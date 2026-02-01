# API Endpoint Implementation Plan: Generate and Send MMS

## 1. Przegląd punktu końcowego

Punkt końcowy `POST /functions/v1/mms` jest kluczowym, transakcyjnym endpointem aplikacji, zaimplementowanym jako Supabase Edge Function. Jego zadaniem jest orkiestracja całego procesu biznesowego: od walidacji danych wejściowych, przez weryfikację limitów, po generowanie obrazu za pomocą zewnętrznego API (Google AI) i wysyłkę go jako MMS przez kolejną zewnętrzną usługę (smsapi.pl). Ze względu na potencjalnie długi czas trwania, endpoint jest zaprojektowany jako asynchroniczny, zwracając natychmiastową odpowiedź o przyjęciu zadania do realizacji.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/functions/v1/mms`
-   **Parametry**: Brak.
-   **Request Body**:
    -   **Struktura**: Obiekt JSON zawierający pole `prompt`.
    -   **Przykład**:
        ```json
        {
          "prompt": "Kot w czapce imprezowej jadący na deskorolce"
        }
        ```

## 3. Wykorzystywane typy

-   **`GenerateMmsCommand`**: Reprezentuje obiekt polecenia (command object) wysyłany w ciele żądania.
    ```typescript
    export type GenerateMmsCommand = Pick<TablesInsert<"mms_history">, "prompt">;
    ```
-   **`GenerateMmsResponseDto`**: Reprezentuje obiekt DTO zwracany w przypadku sukcesu (w formacie JSON, przed transformacją na HTML).
    ```typescript
    export type GenerateMmsResponseDto = {
      message: string;
      history_id: Tables<"mms_history">["id"];
    };
    ```

## 4. Szczegóły odpowiedzi

-   **Struktura odpowiedzi (Sukces)**:
    -   **Kod statusu**: `202 Accepted`
    -   **Treść**: Zgodnie z zasadami (`rulles/backend.mdc`), funkcja zwróci fragment HTML, który może być wstawiony do DOM przez HTMX, informując użytkownika o rozpoczęciu procesu.
      ```html
      <div id="notification-area" class="alert alert-info">
        Twoje zapytanie zostało przyjęte. Generowanie i wysyłka MMS w toku...
      </div>
      ```
-   **Struktura odpowiedzi (Błąd)**:
    -   **Kod statusu**: `400`, `401`, `429`, `500`.
    -   **Treść**: Fragment HTML z komunikatem o błędzie.
      ```html
      <!-- Przykład dla błędu 429 -->
      <div id="notification-area" class="alert alert-warning">
        Osiągnięto dzienny limit 5 MMS. Spróbuj ponownie jutro.
      </div>
      ```

## 5. Przepływ danych

Logika zostanie zaimplementowana wewnątrz Supabase Edge Function (`/supabase/functions/mms/index.ts`).

1.  **Uwierzytelnienie i Walidacja**:
    -   Funkcja weryfikuje nagłówek `Authorization` i pobiera dane użytkownika. Jeśli brak, zwraca błąd `401`.
    -   Pobiera `prompt` z ciała żądania. Jeśli jest pusty lub przekracza 300 znaków, zwraca błąd `400`.
2.  **Sprawdzenie Limitów**:
    -   **Limit użytkownika**: Wywołuje funkcję bazodanową `count_user_mms_today()` z ID użytkownika. Jeśli wynik jest >= 5, zwraca błąd `429`.
    -   **Limit globalny**: Wykonuje zapytanie `SELECT` do tabeli `daily_global_stats` dla bieżącego dnia. Jeśli `mms_sent_count` jest >= 20, zwraca błąd `429`.
3.  **Inkrementacja Limitu Globalnego**:
    -   Wykonuje operację `UPSERT` (lub `INSERT ... ON CONFLICT UPDATE`) na tabeli `daily_global_stats`, inkrementując `mms_sent_count` o 1.
4.  **Generowanie Obrazu (AI)**:
    -   Wysyła żądanie `POST` do API Google AI (Gemini) z `promptem` użytkownika.
    -   **Obsługa błędu**: Jeśli API zwróci błąd, funkcja tworzy wpis w `mms_history` ze statusem `generation_failed` i zwraca błąd `500`.
5.  **Wysyłka MMS**:
    -   Pobiera numer telefonu użytkownika z tabeli `profiles`.
    -   Wysyła żądanie `POST` do API `smsapi.pl` z danymi obrazu (`bytea`) i numerem telefonu.
    -   **Obsługa błędu**: Jeśli API zwróci błąd, funkcja tworzy wpis w `mms_history` ze statusem `send_failed` i zwraca błąd `500`.
6.  **Logowanie Sukcesu**:
    -   Jeśli oba powyższe kroki zakończą się sukcesem, funkcja tworzy wpis w `mms_history` ze statusem `success`.
7.  **Odpowiedź**:
    -   Funkcja zwraca odpowiedni fragment HTML z kodem statusu (`202` dla sukcesu lub kod błędu).

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Dostęp do funkcji jest chroniony i wymaga ważnego tokena JWT. Klient Supabase powinien być użyty do weryfikacji sesji na początku funkcji.
-   **Autoryzacja**: Wszystkie operacje na bazie danych (RPC, `INSERT`) są wykonywane w kontekście uwierzytelnionego użytkownika (`auth.uid()`), co jest zgodne z politykami RLS.
-   **Zarządzanie Sekretami**: Klucze API do Google AI i `smsapi.pl` muszą być przechowywane jako sekrety w Supabase (`supabase secrets set ...`) i dostępne w funkcji jako zmienne środowiskowe. Nie mogą być one umieszczone w kodzie źródłowym.
-   **Walidacja Danych Wejściowych**: Rygorystyczna walidacja `promptu` (długość, brak) zapobiega niepotrzebnym wywołaniom API i potencjalnym atakom.

## 7. Obsługa błędów

| Kod Statusu | Nazwa Błędu           | Opis                                                                                             |
|-------------|-----------------------|--------------------------------------------------------------------------------------------------|
| `400`       | Bad Request           | `prompt` jest pusty, nie istnieje lub przekracza 300 znaków.                                     |
| `401`       | Unauthorized          | Użytkownik nie jest zalogowany lub jego token JWT jest nieprawidłowy/wygasł.                      |
| `429`       | Too Many Requests     | Użytkownik osiągnął swój dzienny limit (5 MMS) lub osiągnięto globalny limit aplikacji (20 MMS).   |
| `500`       | Internal Server Error | Wystąpił błąd podczas komunikacji z API Google AI lub `smsapi.pl`, lub inny nieprzewidziany błąd. |

## 8. Rozważania dotyczące wydajności

-   **Czas Odpowiedzi**: Głównym celem jest jak najszybsze zwrócenie odpowiedzi `202 Accepted` do klienta. Długotrwałe operacje (AI, wysyłka MMS) nie powinny blokować odpowiedzi.
-   **Zarządzanie Połączeniami**: Należy upewnić się, że klienty HTTP do zewnętrznych API są poprawnie skonfigurowane (np. z rozsądnymi timeoutami), aby uniknąć "wiszących" funkcji.
-   **Ryzyko Skalowalności Bazy Danych**: Przechowywanie obrazów jako `bytea` jest znaczącym ryzykiem. Chociaż jest to decyzja projektowa dla MVP, należy monitorować rozmiar bazy danych.

## 9. Etapy wdrożenia

1.  **Inicjalizacja Edge Function**:
    -   Użyj Supabase CLI, aby utworzyć nową funkcję: `supabase functions new mms`.
2.  **Konfiguracja Sekretów**:
    -   Ustaw sekrety dla kluczy API: `supabase secrets set GOOGLE_AI_API_KEY=...` i `supabase secrets set SMSAPI_TOKEN=...`.
3.  **Implementacja Logiki Głównej**:
    -   W pliku `/supabase/functions/mms/index.ts` zaimplementuj główny handler żądania.
    -   Stwórz klienta Supabase wewnątrz funkcji, aby uzyskać dostęp do bazy danych i informacji o użytkowniku.
4.  **Walidacja i Limity**:
    -   Zaimplementuj logikę walidacji `promptu`.
    -   Dodaj wywołania RPC do `count_user_mms_today` oraz zapytanie do `daily_global_stats` w celu weryfikacji limitów.
    -   Zaimplementuj logikę inkrementacji licznika globalnego.
5.  **Integracja z Zewnętrznymi API**:
    -   Napisz kod do wysyłania żądań `fetch` do API Google AI.
    -   Napisz kod do wysyłania żądań `fetch` do API `smsapi.pl`.
6.  **Logika Zapisu do Bazy Danych**:
    -   Zaimplementuj operacje `INSERT` do tabeli `mms_history` dla każdego scenariusza (sukces, błąd generacji, błąd wysyłki).
7.  **Obsługa Odpowiedzi**:
    -   Zaimplementuj zwracanie odpowiedzi w formacie HTML z odpowiednimi kodami statusu HTTP, zgodnie z architekturą HTMX.
8.  **Testowanie Lokalne**:
    -   Uruchom projekt lokalnie za pomocą `supabase start`.
    -   Użyj narzędzia (np. cURL, Postman) lub bezpośrednio z aplikacji frontendowej, aby przetestować wszystkie ścieżki:
        -   Pomyślne wygenerowanie i wysyłka.
        -   Błąd walidacji (pusty/długi prompt).
        -   Przekroczenie limitu użytkownika i globalnego.
        -   Symulacja błędów z zewnętrznych API (jeśli to możliwe).
9.  **Wdrożenie**:
    -   Wdróż funkcję na platformę Supabase za pomocą `supabase functions deploy mms`.