# Plan implementacji widoku: Rejestracja

## 1. Przegląd

Widok "Rejestracja" jest publicznie dostępną stroną, która umożliwia nowym użytkownikom założenie konta w aplikacji `funnyMMS`. Proces ten jest pierwszym krokiem w podróży użytkownika i jest kluczowy dla pozyskiwania nowych członków społeczności.

Formularz rejestracyjny zbiera niezbędne dane (e-mail, hasło, numer telefonu) i wymaga akceptacji regulaminu. Zgodnie z architekturą opartą na HTMX, po pomyślnym przesłaniu danych serwer zainicjuje proces weryfikacji numeru telefonu i płynnie przekieruje użytkownika do kolejnego etapu, bez konieczności przeładowywania całej strony.

## 2. Routing widoku

-   **Ścieżka**: `/register`

## 3. Struktura komponentów

Widok będzie renderowany po stronie serwera jako pojedyncza strona HTML. Jego struktura będzie oparta na kompozycji następujących komponentów:

```
LayoutPublic
├── HeaderPublic
├── RegisterForm
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

### RegisterForm
-   **Opis komponentu**: Kluczowy komponent zawierający formularz do założenia nowego konta.
-   **Główne elementy**:
    -   `<form>` z atrybutami HTMX: `hx-post="/functions/v1/register"`, `hx-target="#notification-area"`.
    -   `<input type="email" name="email">` z atrybutami walidacji HTML5 (`required`).
    -   `<input type="password" name="password">` z atrybutami walidacji HTML5 (`required`, `minlength="8"`).
    -   `<input type="password" name="passwordConfirm">` z atrybutami walidacji HTML5 (`required`).
    -   `<input type="tel" name="phone">` z atrybutami walidacji HTML5 (`required`, `pattern`).
    -   `<input type="checkbox" name="termsAccepted">` z atrybutem `required`.
    -   `<button type="submit">`: Przycisk "Zarejestruj się" z wbudowanym wskaźnikiem ładowania (`hx-indicator`).
    -   `<div id="notification-area">`: Pusty kontener na komunikaty o błędach zwracane przez serwer.
    -   `<a href="/login">`: Link do strony logowania.
-   **Obsługiwane interakcje**: Wysłanie formularza.
-   **Obsługiwana walidacja**:
    -   **Po stronie klienta**: Wszystkie pola są wymagane. Hasło musi mieć min. 8 znaków. Hasła muszą być identyczne (obsługa przez prosty skrypt JS lub atrybut `oninput`).
    -   **Po stronie serwera**: Weryfikacja, czy e-mail nie jest już zajęty. Sprawdzenie, czy hasła są zgodne.
-   **Typy**: `RegisterCommand`.
-   **Propsy**: Brak.

### FooterPublic
-   **Opis komponentu**: Stopka strony z linkami do dokumentów prawnych.
-   **Główne elementy**: Linki do `/terms` i `/privacy`.
-   **Obsługiwane interakcje**: Nawigacja.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

## 5. Typy

### `RegisterCommand` (ViewModel)
-   **Opis**: Nowy typ reprezentujący dane przesyłane z formularza rejestracji. Definiuje strukturę żądania do endpointu rejestracji.
-   **Pola**:
    -   `email`: `string` - Adres e-mail użytkownika.
    -   `password`: `string` - Hasło użytkownika.
    -   `passwordConfirm`: `string` - Potwierdzenie hasła.
    -   `phone`: `string` - Numer telefonu użytkownika.
    -   `termsAccepted`: `boolean` - Flaga potwierdzająca akceptację regulaminu.

## 6. Zarządzanie stanem

Widok jest bezstanowy. Stan formularza (wpisane wartości) jest zarządzany przez przeglądarkę. Komunikaty o błędach są w całości kontrolowane przez serwer, który zwraca odpowiednie fragmenty HTML do wstawienia w kontenerze `#notification-area`.

## 7. Integracja API

Formularz rejestracji będzie komunikował się z dedykowaną funkcją brzegową (Edge Function), która zarządza procesem tworzenia konta w Supabase.

-   **Endpoint**: `POST /functions/v1/register`
-   **Cel**: Stworzenie nowego użytkownika w systemie Supabase Auth.
-   **Typ żądania**: `RegisterCommand`
    ```json
    {
      "email": "new_user@example.com",
      "password": "strong_password_123",
      "passwordConfirm": "strong_password_123",
      "phone": "+48123456789",
      "termsAccepted": true
    }
    ```
-   **Typ odpowiedzi (Sukces)**: Pusta odpowiedź z kodem `200 OK` i nagłówkiem `HX-Redirect: /verify-phone`.
-   **Typ odpowiedzi (Błąd)**: Kod `400 Bad Request` (błędy walidacji) lub `409 Conflict` (e-mail zajęty) i fragment HTML z komunikatem o błędzie.
    ```html
    <div id="notification-area" class="alert alert-error">
      Użytkownik o tym adresie e-mail już istnieje.
    </div>
    ```

## 8. Interakcje użytkownika

-   **Wypełnienie i wysłanie formularza**: Użytkownik wypełnia wszystkie pola, zaznacza checkbox i klika "Zarejestruj się". Przycisk jest blokowany na czas żądania.
-   **Otrzymanie odpowiedzi sukcesu**: Przeglądarka, na polecenie nagłówka `HX-Redirect`, automatycznie przekierowuje użytkownika na stronę `/verify-phone` w celu dokończenia procesu.
-   **Otrzymanie odpowiedzi błędu**: W kontenerze `#notification-area` pojawia się komunikat o błędzie (np. "Hasła nie są zgodne", "Ten e-mail jest już zajęty").

## 9. Warunki i walidacja

-   **Walidacja na poziomie komponentu `RegisterForm`**:
    -   **Warunek**: Wszystkie pola (`email`, `password`, `passwordConfirm`, `phone`, `termsAccepted`) są wymagane.
    -   **Weryfikacja**: Atrybuty `required` w elementach `<input>`.
    -   **Wpływ na UI**: Przeglądarka uniemożliwi wysłanie formularza i wyświetli standardowy komunikat walidacyjny.
    -   **Warunek**: Hasła w polach `password` i `passwordConfirm` muszą być identyczne.
    -   **Weryfikacja**: Prosty skrypt JS, który przy każdej zmianie w polach porównuje ich wartości i ustawia/usuwa niestandardowy komunikat walidacyjny (`input.setCustomValidity(...)`).
-   **Walidacja na poziomie API**:
    -   **Warunek**: E-mail nie może być już zarejestrowany.
    -   **Weryfikacja**: Wywołanie `supabase.auth.signUp()` wewnątrz Edge Function i obsługa błędu specyficznego dla zajętego e-maila.
    -   **Wpływ na UI**: W przypadku błędu, endpoint zwróci fragment HTML z komunikatem, który zostanie wstawiony do `#notification-area`.

## 10. Obsługa błędów

-   **Błędy walidacji (400)**: Endpoint `register` zwróci kod `400` i fragment HTML z komunikatem, np. "Hasła nie są zgodne" lub "Musisz zaakceptować regulamin".
-   **Zajęty e-mail (409)**: Endpoint `register` zwróci kod `409` i fragment HTML z komunikatem "Użytkownik o tym adresie e-mail już istnieje.".
-   **Błędy sieciowe**: Globalny event listener `htmx:sendError` wyświetli komunikat o problemie z połączeniem.
-   **Błędy serwera (5xx)**: Endpoint `register` w bloku `catch` zwróci generyczny komunikat o błędzie serwera w formacie HTML.

## 11. Kroki implementacji

1.  **Stworzenie pliku widoku**: Utwórz plik dla strony rejestracji (np. `src/pages/register.astro`).
2.  **Implementacja layoutu i komponentów statycznych**: Złóż widok, używając komponentów `LayoutPublic`, `HeaderPublic` i `FooterPublic`.
3.  **Implementacja komponentu `RegisterForm`**:
    -   Stwórz formularz HTML z wymaganymi polami (`email`, `password`, `passwordConfirm`, `phone`) i checkboxem `termsAccepted`.
    -   Dodaj atrybuty walidacyjne HTML5 (`required`, `minlength`, `pattern` dla telefonu).
    -   Dodaj atrybuty HTMX do formularza: `hx-post="/functions/v1/register"`, `hx-target="#notification-area"`.
    -   Dodaj pusty `div` z `id="notification-area"`.
4.  **Dodanie walidacji potwierdzenia hasła**: Dodaj mały blok `<script>`, który będzie porównywał wartości pól haseł i ustawiał `setCustomValidity`, aby zapewnić walidację po stronie klienta.
5.  **Stworzenie Edge Function (`register`)**:
    -   Utwórz nową funkcję brzegową w `supabase/functions/register/index.ts`.
    -   Zaimplementuj logikę:
        -   Pobierz i zwaliduj dane z `RegisterCommand`.
        -   Wywołaj `supabase.auth.signUp()` z `email` i `password` oraz z `phone` i `username` w `options.data`, aby były dostępne dla triggera `handle_new_user`.
        -   W przypadku sukcesu, zwróć odpowiedź z kodem `200` i nagłówkiem `HX-Redirect: /verify-phone`.
        -   W przypadku błędu (np. zajęty e-mail), zwróć odpowiedź z kodem `409` i fragmentem HTML z komunikatem.
6.  **Stylowanie**: Użyj klas Tailwind CSS, aby ostylować formularz, przyciski i komunikaty o błędach, zapewniając responsywność.
7.  **Testowanie manualne**:
    -   Sprawdź, czy walidacja po stronie klienta (pola wymagane, zgodność haseł) działa.
    -   Przetestuj rejestrację z poprawnymi danymi i zweryfikuj, czy następuje przekierowanie do `/verify-phone`.
    -   Przetestuj rejestrację z już istniejącym adresem e-mail i zweryfikuj, czy pojawia się odpowiedni komunikat.
    -   Sprawdź responsywność widoku na różnych urządzeniach.
```