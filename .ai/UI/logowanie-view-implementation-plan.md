# Plan implementacji widoku: Logowanie

## 1. Przegląd

Widok "Logowanie" jest publicznie dostępną stroną, która umożliwia zarejestrowanym użytkownikom rozpoczęcie procesu logowania do aplikacji `funnyMMS`. Zgodnie z wymaganiami (FU-005), proces jest dwuetapowy: najpierw użytkownik podaje swój login (e-mail) i hasło, a następnie, po pomyślnej weryfikacji, jest proszony o podanie jednorazowego kodu wysłanego SMS-em.

Widok ten będzie renderowany po stronie serwera i wykorzysta HTMX do obsługi formularza, zapewniając płynne przejście do drugiego etapu uwierzytelniania bez przeładowywania całej strony.

## 2. Routing widoku

-   **Ścieżka**: `/login`

## 3. Struktura komponentów

Widok będzie renderowany po stronie serwera jako pojedyncza strona HTML. Jego struktura będzie oparta na kompozycji następujących komponentów:

```
LayoutPublic
├── HeaderPublic
├── LoginForm
└── FooterPublic
```

## 4. Szczegóły komponentów

### LayoutPublic
-   **Opis komponentu**: Główny szablon strony, zawierający podstawową strukturę HTML, importujący arkusze stylów (Tailwind CSS) oraz skrypty (HTMX, Supabase-JS).
-   **Główne elementy**: `<head>`, `<body>`.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `children` (zawartość strony).

### HeaderPublic
-   **Opis komponentu**: Prosty nagłówek z nazwą aplikacji.
-   **Główne elementy**: `<h1>` lub `<div>` z nazwą "funnyMMS".
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### LoginForm
-   **Opis komponentu**: Kluczowy komponent zawierający formularz do wprowadzenia danych logowania.
-   **Główne elementy**:
    -   `<form>` z atrybutami HTMX: `hx-post="/functions/v1/auth-password"`, `hx-target="#notification-area"`, `hx-swap="outerHTML"`.
    -   `<input type="email" name="email">` z atrybutami walidacji HTML5 (`required`).
    -   `<input type="password" name="password">` z atrybutami walidacji HTML5 (`required`).
    -   `<button type="submit">`: Przycisk "Zaloguj się" z wbudowanym wskaźnikiem ładowania (`hx-indicator`).
    -   `<div id="notification-area">`: Pusty kontener na komunikaty o błędach zwracane przez serwer.
    -   `<a href="/register">`: Link do strony rejestracji.
-   **Obsługiwane interakcje**: Wysłanie formularza.
-   **Obsługiwana walidacja**:
    -   **Po stronie klienta**: Pola `email` i `password` są wymagane (`required`).
    -   **Po stronie serwera**: Weryfikacja poprawności e-maila i hasła przez Supabase Auth.
-   **Typy**: `LoginCommand`.
-   **Propsy**: Brak.

### FooterPublic
-   **Opis komponentu**: Stopka strony z linkami do dokumentów prawnych.
-   **Główne elementy**: Linki do `/terms` i `/privacy`.
-   **Obsługiwane interakcje**: Nawigacja.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

## 5. Typy

### `LoginCommand` (ViewModel)
-   **Opis**: Nowy typ reprezentujący dane przesyłane z formularza logowania. Nie pochodzi bezpośrednio z typów bazy danych, lecz definiuje strukturę żądania do endpointu logowania.
-   **Pola**:
    -   `email`: `string` - Adres e-mail użytkownika.
    -   `password`: `string` - Hasło użytkownika.

## 6. Zarządzanie stanem

Widok jest w dużej mierze bezstanowy. Jedynym "stanem" jest treść komunikatów o błędach, która jest w całości zarządzana przez serwer. Serwer, w odpowiedzi na żądanie, zwraca odpowiedni fragment HTML, który HTMX wstawia do kontenera `#notification-area`. Nie ma potrzeby stosowania niestandardowych hooków ani zarządzania stanem po stronie klienta.

## 7. Integracja API

Formularz logowania będzie komunikował się z dedykowaną funkcją brzegową (Edge Function), która pośredniczy w kontakcie z wbudowanym API Supabase Auth.

-   **Endpoint**: `POST /functions/v1/auth-password`
-   **Cel**: Weryfikacja e-maila i hasła użytkownika.
-   **Typ żądania**: `LoginCommand`
    ```json
    {
      "email": "user@example.com",
      "password": "user_password"
    }
    ```
-   **Typ odpowiedzi (Sukces)**: Pusta odpowiedź z kodem `200 OK` i nagłówkiem `HX-Redirect: /verify-2fa`.
-   **Typ odpowiedzi (Błąd)**: Kod `401 Unauthorized` i fragment HTML z komunikatem o błędzie.
    ```html
    <div id="notification-area" class="alert alert-error">
      Nieprawidłowy login lub hasło.
    </div>
    ```

## 8. Interakcje użytkownika

-   **Wypełnienie i wysłanie formularza**: Użytkownik wpisuje e-mail i hasło, a następnie klika "Zaloguj się". Przycisk jest blokowany na czas żądania.
-   **Otrzymanie odpowiedzi sukcesu**: Przeglądarka, na polecenie nagłówka `HX-Redirect`, automatycznie przekierowuje użytkownika na stronę `/verify-2fa` w celu dokończenia logowania.
-   **Otrzymanie odpowiedzi błędu**: W kontenerze `#notification-area` pojawia się komunikat o błędnych danych logowania.

## 9. Warunki i walidacja

-   **Walidacja na poziomie komponentu `LoginForm`**:
    -   **Warunek**: Pola `email` i `password` nie mogą być puste.
    -   **Weryfikacja**: Atrybuty `required` w elementach `<input>`.
    -   **Wpływ na UI**: Przeglądarka uniemożliwi wysłanie formularza i wyświetli standardowy komunikat walidacyjny.
-   **Walidacja na poziomie API**:
    -   **Warunek**: Podane e-mail i hasło muszą pasować do istniejącego rekordu w `auth.users`.
    -   **Weryfikacja**: Wywołanie `supabase.auth.signInWithPassword()` wewnątrz Edge Function.
    -   **Wpływ na UI**: W przypadku błędu, endpoint zwróci fragment HTML z komunikatem, który zostanie wstawiony do `#notification-area`.

## 10. Obsługa błędów

-   **Nieprawidłowe dane logowania**: Endpoint `auth-password` zwróci kod `401` i fragment HTML z komunikatem "Nieprawidłowy login lub hasło.".
-   **Błędy sieciowe**: Globalny event listener `htmx:sendError` (zdefiniowany w architekturze UI) wyświetli komunikat o problemie z połączeniem.
-   **Błędy serwera (5xx)**: Endpoint `auth-password` w bloku `catch` zwróci generyczny komunikat o błędzie serwera w formacie HTML.

## 11. Kroki implementacji

1.  **Stworzenie pliku widoku**: Utwórz plik dla strony logowania (np. `src/pages/login.astro`).
2.  **Implementacja layoutu i komponentów statycznych**: Złóż widok, używając komponentów `LayoutPublic`, `HeaderPublic` i `FooterPublic`.
3.  **Implementacja komponentu `LoginForm`**:
    -   Stwórz formularz HTML z polami `email` i `password` oraz przyciskiem `submit`.
    -   Dodaj atrybuty walidacyjne HTML5 (`required`, `type="email"`).
    -   Dodaj atrybuty HTMX do formularza: `hx-post="/functions/v1/auth-password"`, `hx-target="#notification-area"`.
    -   Dodaj pusty `div` z `id="notification-area"` na komunikaty zwrotne.
4.  **Stworzenie Edge Function (`auth-password`)**:
    -   Utwórz nową funkcję brzegową w `supabase/functions/auth-password/index.ts`.
    -   Zaimplementuj logikę:
        -   Pobierz `email` i `password` z ciała żądania.
        -   Wywołaj `supabase.auth.signInWithPassword({ email, password })`.
        -   W przypadku sukcesu, zwróć odpowiedź z kodem `200` i nagłówkiem `HX-Redirect: /verify-2fa`.
        -   W przypadku błędu, zwróć odpowiedź z kodem `401` i fragmentem HTML z komunikatem o błędzie.
5.  **Stylowanie**: Użyj klas Tailwind CSS, aby ostylować formularz, przyciski i komunikaty o błędach, zapewniając responsywność.
6.  **Testowanie manualne**:
    -   Sprawdź, czy walidacja po stronie klienta działa.
    -   Przetestuj logowanie z poprawnymi danymi i zweryfikuj, czy następuje przekierowanie do `/verify-2fa`.
    -   Przetestuj logowanie z błędnymi danymi i zweryfikuj, czy w kontenerze `#notification-area` pojawia się odpowiedni komunikat.
    -   Sprawdź responsywność widoku na różnych urządzeniach.