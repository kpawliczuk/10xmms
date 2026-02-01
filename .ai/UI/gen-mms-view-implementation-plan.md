# Plan implementacji widoku: Generator MMS

## 1. Przegląd

Widok "Generator MMS" jest głównym ekranem aplikacji `funnyMMS`, dostępnym dla zalogowanych użytkowników. Jego celem jest dostarczenie prostego i intuicyjnego interfejsu do realizacji kluczowej funkcji produktu: generowania humorystycznych grafik na podstawie promptu tekstowego i wysyłania ich jako MMS.

Architektura widoku opiera się na HTMX, co oznacza, że interakcje użytkownika (wysyłanie formularza) będą skutkowały żądaniami do serwera, który w odpowiedzi będzie zwracał gotowe fragmenty HTML. Taka koncepcja minimalizuje logikę po stronie klienta i centralizuje zarządzanie stanem (np. limitami) na backendzie.

## 2. Routing widoku

-   **Ścieżka**: `/app`

## 3. Struktura komponentów

Widok będzie renderowany po stronie serwera jako pojedyncza strona HTML. Jego struktura będzie oparta na kompozycji następujących komponentów:

```
LayoutPrivate
├── NavigationBar
└── GeneratorView
    ├── NotificationArea
    └── GeneratorForm
```

## 4. Szczegóły komponentów

### LayoutPrivate
-   **Opis komponentu**: Główny szablon dla widoków prywatnych, zawierający podstawową strukturę HTML, importujący arkusze stylów (Tailwind CSS) oraz skrypty (HTMX, Supabase-JS).
-   **Główne elementy**: `<head>`, `<body>`.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `children` (zawartość strony), `user` (opcjonalnie, dane zalogowanego użytkownika).

### NavigationBar
-   **Opis komponentu**: Wspólny dla wszystkich widoków prywatnych pasek nawigacyjny.
-   **Główne elementy**:
    -   Logo/nazwa aplikacji (link do `/app`).
    -   Link "Generator" (`<a href="/app">`).
    -   Link "Profil" (`<a href="/profile">`).
    -   Przycisk "Wyloguj" (`<button>`), który po stronie klienta wywoła funkcję `supabase.auth.signOut()`.
-   **Obsługiwane interakcje**: Nawigacja, wylogowanie.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### GeneratorView
-   **Opis komponentu**: Główny kontener dla widoku generatora.
-   **Główne elementy**: `NotificationArea`, `GeneratorForm`.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `GeneratorViewModel`.
-   **Propsy**: `isLimitReached` (boolean).

### NotificationArea
-   **Opis komponentu**: Dedykowany kontener na wszystkie komunikaty zwrotne z serwera.
-   **Główne elementy**: `<div id="notification-area">`. Początkowo pusty lub z komunikatem o limicie.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `initialMessage` (string, opcjonalnie).

### GeneratorForm
-   **Opis komponentu**: Formularz umożliwiający użytkownikowi wpisanie promptu i zainicjowanie procesu generowania MMS.
-   **Główne elementy**:
    -   `<form>` z atrybutami HTMX: `hx-post="/functions/v1/mms"`, `hx-target="#notification-area"`, `hx-swap="innerHTML"`.
    -   `<textarea name="prompt">` z atrybutami walidacji HTML5 (`required`, `maxlength="300"`).
    -   `<button type="submit">`: Przycisk "Generuj i wyślij" z wbudowanym wskaźnikiem ładowania (`hx-indicator`) i stanem `disabled` kontrolowanym przez serwer.
-   **Obsługiwane interakcje**: Wysłanie formularza.
-   **Obsługiwana walidacja**:
    -   **Po stronie klienta**: Pole `prompt` jest wymagane (`required`) i ograniczone do 300 znaków (`maxlength`).
    -   **Po stronie serwera**: Walidacja jest powtórzona w Edge Function.
-   **Typy**: `GenerateMmsCommand`.
-   **Propsy**: `isSubmitDisabled` (boolean).

## 5. Typy

### `GenerateMmsCommand` (z `src/types.ts`)
-   **Opis**: Obiekt polecenia wysyłany w ciele żądania `POST`.
-   **Pola**:
    -   `prompt`: `string` - Tekst wpisany przez użytkownika.

### `GeneratorViewModel` (ViewModel)
-   **Opis**: Nowy typ reprezentujący dane potrzebne do wyrenderowania całego widoku `GeneratorView` po stronie serwera.
-   **Pola**:
    -   `isLimitReached`: `boolean` - Flaga informująca, czy dzienny limit użytkownika został osiągnięty.

## 6. Zarządzanie stanem

Stan widoku jest w całości zarządzany po stronie serwera.
-   **Stan przycisku**: Serwer, renderując widok, decyduje, czy przycisk "Generuj i wyślij" ma być aktywny czy nieaktywny (`disabled`), na podstawie sprawdzenia limitu użytkownika.
-   **Komunikaty**: Stan powiadomień jest zarządzany przez odpowiedzi z API. Każde żądanie HTMX targetuje kontener `#notification-area`, a serwer zwraca odpowiedni fragment HTML z komunikatem, który jest w nim podmieniany.

## 7. Integracja API

Główna interakcja odbywa się z jednym, dedykowanym punktem końcowym.

-   **Endpoint**: `POST /functions/v1/mms`
-   **Cel**: Zainicjowanie procesu generowania i wysyłki MMS.
-   **Typ żądania**: `GenerateMmsCommand`
    ```json
    {
      "prompt": "Tekst wpisany przez użytkownika"
    }
    ```
-   **Typ odpowiedzi (Sukces)**: Kod `202 Accepted` i fragment HTML z komunikatem o przyjęciu zadania.
    ```html
    <div class="alert alert-info">
      Twoje zapytanie zostało przyjęte. Generowanie i wysyłka MMS w toku...
    </div>
    ```
-   **Typ odpowiedzi (Błąd)**: Kod `400`, `429` lub `500` i fragment HTML z odpowiednim komunikatem o błędzie.

## 8. Interakcje użytkownika

-   **Wpisanie promptu**: Użytkownik wpisuje tekst w pole `<textarea>`. Walidacja `maxlength` uniemożliwia wpisanie więcej niż 300 znaków.
-   **Wysłanie formularza**: Użytkownik klika "Generuj i wyślij". Przycisk jest blokowany na czas żądania (`htmx-request`).
-   **Otrzymanie odpowiedzi sukcesu (202)**: W kontenerze `#notification-area` pojawia się komunikat o rozpoczęciu procesu.
-   **Otrzymanie odpowiedzi błędu (4xx, 5xx)**: W kontenerze `#notification-area` pojawia się odpowiedni komunikat o błędzie (np. o przekroczonym limicie, błędzie generacji).

## 9. Warunki i walidacja

-   **Walidacja na poziomie komponentu `GeneratorForm`**:
    -   **Warunek**: Pole `prompt` nie może być puste.
        -   **Weryfikacja**: Atrybut `required` w `<textarea>`.
        -   **Wpływ na UI**: Przeglądarka zablokuje wysłanie formularza.
    -   **Warunek**: Pole `prompt` nie może przekraczać 300 znaków.
        -   **Weryfikacja**: Atrybut `maxlength="300"` w `<textarea>`.
        -   **Wpływ na UI**: Przeglądarka uniemożliwi wpisanie dłuższego tekstu.
-   **Walidacja na poziomie API (Edge Function)**:
    -   **Warunek**: Dzienny limit użytkownika (5 MMS) lub globalny (20 MMS) nie został przekroczony.
    -   **Weryfikacja**: Logika wewnątrz funkcji `mms/index.ts`.
    -   **Wpływ na UI**: Serwer zwróci kod `429` i fragment HTML z komunikatem o błędzie, który pojawi się w `#notification-area`.

## 10. Obsługa błędów

-   **Błędy walidacji (400)**: Endpoint zwróci HTML z komunikatem "Opis nie może być pusty." lub "Opis jest za długi...".
-   **Przekroczony limit (429)**: Endpoint zwróci HTML z komunikatem o osiągnięciu limitu.
-   **Błąd generacji AI (500)**: Endpoint zwróci HTML z komunikatem "Nie udało się wygenerować grafiki...".
-   **Błąd wysyłki MMS (500)**: Endpoint zwróci HTML z komunikatem "Nie udało się wysłać wiadomości MMS.".
-   **Błąd autoryzacji (401)**: Globalna obsługa błędu (zdefiniowana w architekturze UI) przekieruje użytkownika na stronę logowania.

## 11. Kroki implementacji

1.  **Stworzenie pliku widoku**: Utwórz plik dla głównego widoku aplikacji (np. `src/pages/app.astro`).
2.  **Logika po stronie serwera (w pliku widoku)**:
    -   Dodaj logikę weryfikacji sesji użytkownika. Jeśli użytkownik nie jest zalogowany, przekieruj go na `/login`.
    -   Wywołaj funkcję RPC `count_user_mms_today()` z bazy danych, aby uzyskać aktualną liczbę wysłanych MMS-ów.
    -   Przekaż wynik (np. `isLimitReached: true/false`) jako props do komponentu `GeneratorView`.
3.  **Implementacja `LayoutPrivate` i `NavigationBar`**: Stwórz reużywalny layout dla zalogowanych użytkowników, zawierający stały pasek nawigacyjny.
4.  **Implementacja komponentu `GeneratorView`**: Złóż widok, używając komponentów `NotificationArea` i `GeneratorForm`.
5.  **Implementacja `GeneratorForm`**:
    -   Stwórz formularz HTML z polem `<textarea>` i przyciskiem `submit`.
    -   Dodaj atrybuty walidacyjne HTML5 (`required`, `maxlength`).
    -   Dodaj atrybuty HTMX do formularza: `hx-post="/functions/v1/mms"`, `hx-target="#notification-area"`, `hx-swap="innerHTML"`.
    -   Dodaj klasę `htmx-indicator` do elementu, który ma być pokazywany podczas ładowania.
    -   Dynamicznie dodaj atrybut `disabled` do przycisku, jeśli `isLimitReached` jest `true`.
6.  **Implementacja `NotificationArea`**:
    -   Stwórz `div` z `id="notification-area"`.
    -   Jeśli `isLimitReached` jest `true`, wyrenderuj wewnątrz początkowy komunikat o osiągniętym limicie.
7.  **Stylowanie**: Użyj klas Tailwind CSS, aby ostylować formularz, przycisk (w tym jego stan `disabled`), wskaźnik ładowania i komunikaty, zapewniając responsywność.
8.  **Konfiguracja klienta Supabase**: Upewnij się, że globalny skrypt po stronie klienta jest skonfigurowany tak, aby automatycznie dołączał nagłówek `Authorization` do wszystkich żądań HTMX.
9.  **Testowanie manualne**:
    -   Sprawdź, czy walidacja po stronie klienta działa poprawnie.
    -   Przetestuj pomyślne wysłanie formularza i zweryfikuj, czy w `#notification-area` pojawia się komunikat o przyjęciu zadania.
    -   Przetestuj scenariusz z przekroczonym limitem (można to zasymulować po stronie serwera) i zweryfikuj, czy przycisk jest nieaktywny, a komunikat jest widoczny.
    -   Sprawdź, czy komunikaty o błędach z API (400, 429, 500) poprawnie renderują się w kontenerze powiadomień.
    -   Sprawdź responsywność widoku.
```