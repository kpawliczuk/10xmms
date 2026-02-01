# API Endpoint Implementation Plan: Update Current User's Profile

## 1. Przegląd punktu końcowego

Punkt końcowy `PATCH /rest/v1/profiles` służy do aktualizacji danych profilowych (np. nazwy użytkownika) dla aktualnie uwierzytelnionego użytkownika. Jest to standardowy, auto-generowany przez Supabase (PostgREST) endpoint, który operuje na tabeli `public.profiles`. Bezpieczeństwo, autoryzacja i walidacja unikalności są w pełni kontrolowane przez mechanizmy bazy danych PostgreSQL, w tym polityki Row-Level Security (RLS) oraz ograniczenia `UNIQUE`.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `PATCH`
-   **Struktura URL**: `/rest/v1/profiles`
-   **Parametry**:
    -   **Wymagane**:
        -   `id=eq.{user_id}`: Filtruje operację `UPDATE` do profilu, którego `id` pasuje do ID aktualnie zalogowanego użytkownika.
-   **Request Body**:
    -   **Struktura**: Obiekt JSON zawierający pola do zaktualizowania.
    -   **Przykład**:
        ```json
        {
          "username": "new_unique_username"
        }
        ```

## 3. Wykorzystywane typy

-   **`UpdateProfileCommand`**: Reprezentuje obiekt polecenia (command object) wysyłany w ciele żądania, zawierający dane do aktualizacji.
    ```typescript
    import type { TablesUpdate } from "./db/database.types";
    export type UpdateProfileCommand = Pick<TablesUpdate<"profiles">, "username">;
    ```

## 4. Szczegóły odpowiedzi

-   **Struktura odpowiedzi (Sukces)**:
    -   **Kod statusu**: `204 No Content`
    -   **Treść**: Brak. Pusta odpowiedź sygnalizuje, że operacja zakończyła się pomyślnie.
-   **Struktura odpowiedzi (Błąd)**:
    -   **Kod statusu**: `400 Bad Request`, `401 Unauthorized`, `409 Conflict`.
    -   **Treść**: Obiekt JSON z opisem błędu.
      ```json
      {
        "message": "duplicate key value violates unique constraint \"profiles_username_key\"",
        "code": "23505",
        "details": "...",
        "hint": "..."
      }
      ```

## 5. Przepływ danych

1.  Klient (formularz HTMX) wysyła żądanie `PATCH` do `/rest/v1/profiles?id=eq.{user_id}` z nagłówkiem `Authorization: Bearer <JWT>` oraz ciałem żądania zawierającym `UpdateProfileCommand`.
2.  Supabase (PostgREST) odbiera żądanie i weryfikuje token JWT.
3.  PostgREST konstruuje zapytanie `UPDATE public.profiles SET username = 'new_unique_username' WHERE id = '{user_id}'`.
4.  Baza danych PostgreSQL aktywuje politykę RLS `Users can insert/update their own profile`, która weryfikuje, czy `id` w klauzuli `WHERE` jest równe `auth.uid()`.
5.  Baza danych próbuje wykonać operację `UPDATE`. Jeśli nowa nazwa użytkownika narusza ograniczenie `UNIQUE`, transakcja jest odrzucana.
6.  Jeśli operacja się powiedzie, baza danych zatwierdza zmianę.
7.  PostgREST otrzymuje potwierdzenie z bazy i odsyła do klienta odpowiedź z kodem `204 No Content`.
8.  Klient HTMX, po otrzymaniu pomyślnej odpowiedzi, może wywołać kolejne akcje zdefiniowane w atrybutach `HX-Trigger` (np. odświeżenie widoku profilu lub wyświetlenie komunikatu o sukcesie).

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Każde żądanie musi zawierać ważny token JWT. Supabase automatycznie odrzuci żądania bez niego (kod `401`).
-   **Autoryzacja**: Polityka **Row-Level Security (RLS)** jest kluczowym mechanizmem bezpieczeństwa.
    -   **Polityka**: `CREATE POLICY "Users can insert/update their own profile." ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`
    -   **Gwarancja**: Ta polityka uniemożliwia jednemu użytkownikowi modyfikację profilu innego użytkownika, nawet jeśli spróbuje on manipulować parametrem `id` w URL.
-   **Walidacja danych**:
    -   **Po stronie bazy danych**: Ograniczenie `UNIQUE` na kolumnie `username` zapobiega duplikatom.
    -   **Po stronie klienta**: Formularz HTML powinien zawierać atrybuty walidacyjne (np. `required`, `minlength`, `maxlength`, `pattern`), aby zapewnić podstawową walidację przed wysłaniem żądania.

## 7. Obsługa błędów

| Kod Statusu | Nazwa Błędu          | Opis                                                                                             |
|-------------|----------------------|--------------------------------------------------------------------------------------------------|
| `400`       | Bad Request          | Występuje, gdy ciało żądania jest nieprawidłowo sformatowane lub typ danych jest niezgodny.       |
| `401`       | Unauthorized         | Występuje, gdy żądanie nie zawiera ważnego tokena JWT lub token wygasł.                           |
| `409`       | Conflict             | Występuje, gdy podana nazwa użytkownika (`username`) już istnieje w bazie danych.                |
| `500`       | Internal Server Error| Może wystąpić w przypadku nieprzewidzianych problemów z bazą danych lub infrastrukturą.           |

## 8. Rozważania dotyczące wydajności

-   **Indeksowanie**: Operacja `UPDATE` na kluczu głównym (`id`) jest bardzo wydajna dzięki automatycznemu indeksowaniu. Ograniczenie `UNIQUE` na `username` również tworzy indeks, co sprawia, że sprawdzanie unikalności jest szybkie. Wydajność nie stanowi problemu dla tego endpointu.

## 9. Etapy wdrożenia

Implementacja tego punktu końcowego polega głównie na prawidłowym skonfigurowaniu bazy danych i wywołaniu go z frontendu, ponieważ Supabase zapewnia jego działanie "out-of-the-box".

1.  **Weryfikacja schematu bazy danych**:
    -   Upewnij się, że tabela `public.profiles` posiada ograniczenie `UNIQUE` na kolumnie `username`.
2.  **Weryfikacja polityk RLS**:
    -   Potwierdź w panelu Supabase, że RLS jest włączone dla tabeli `public.profiles`.
    -   Upewnij się, że polityka `Users can insert/update their own profile.` jest aktywna i poprawnie zdefiniowana dla operacji `UPDATE` i roli `authenticated`.
3.  **Implementacja po stronie klienta (HTMX/Frontend)**:
    -   Stwórz formularz HTML z polem do edycji nazwy użytkownika.
    -   Użyj atrybutu `hx-patch` w formularzu, aby wysłać żądanie `PATCH` do odpowiedniego URL (`/rest/v1/profiles?id=eq.{user_id}`).
    -   Upewnij się, że klient Supabase JS jest skonfigurowany do automatycznego dołączania nagłówka `Authorization` do wszystkich żądań.
    -   Dodaj atrybut `hx-trigger` na elemencie, który ma zostać odświeżony po pomyślnej aktualizacji (np. `hx-trigger="success from:#edit-profile-form -> refreshProfileView"`).
4.  **Obsługa odpowiedzi i błędów na frontendzie**:
    -   Zgodnie z zasadami (`rulles/backend.mdc`), odpowiedź na żądanie HTMX powinna być fragmentem HTML. W tym przypadku, ponieważ endpoint zwraca `204`, można obsłużyć sukces po stronie klienta lub użyć nagłówka `HX-Trigger` do odświeżenia innej części UI, która zwróci zaktualizowany HTML.
    -   Zaimplementuj mechanizm wyświetlania komunikatów o błędach (np. `409 Conflict`), przechwytując zdarzenia HTMX (np. `htmx:responseError`).
5.  **Testowanie**:
    -   Napisz testy weryfikujące:
        -   Pomyślną aktualizację nazwy użytkownika dla zalogowanego użytkownika.
        -   Otrzymanie błędu `401` dla niezalogowanego użytkownika.
        -   Otrzymanie błędu `409` przy próbie ustawienia istniejącej nazwy użytkownika.
        -   Potwierdzenie, że użytkownik A nie może zmodyfikować profilu użytkownika B.