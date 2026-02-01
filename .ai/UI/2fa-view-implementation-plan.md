# Plan implementacji widoku: Weryfikacja (2FA / Telefon)

## 1. Przegląd

Widok "Weryfikacja" jest kluczowym elementem procesów uwierzytelniania i rejestracji w aplikacji `funnyMMS`. Służy on jako drugi, bezpieczny etap, na którym użytkownik musi potwierdzić swoją tożsamość za pomocą jednorazowego kodu (tokena) otrzymanego w wiadomości SMS.

Strona ta jest wywoływana w dwóch głównych scenariuszach:
1.  **Po rejestracji**: W celu weryfikacji numeru telefonu nowego użytkownika.
2.  **Po logowaniu**: Jako obowiązkowy drugi składnik uwierzytelniania (2FA) przy każdym logowaniu.

Widok będzie renderowany po stronie serwera i wykorzysta HTMX do obsługi formularza, co zapewni natychmiastową informację zwrotną i płynne przekierowanie do aplikacji po pomyślnej weryfikacji.

## 2. Routing widoku

-   **Ścieżka**: `/verify-2fa` (dla logowania) oraz `/verify-phone` (dla rejestracji). Obie ścieżki będą renderować ten sam komponent, potencjalnie z drobnymi różnicami w wyświetlanych tekstach.

## 3. Struktura komponentów

Widok będzie renderowany po stronie serwera jako pojedyncza strona HTML. Jego struktura będzie oparta na kompozycji następujących komponentów:

```
LayoutPublic
├── HeaderPublic
├── VerificationForm
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

### VerificationForm
-   **Opis komponentu**: Centralny element widoku, zawierający formularz do wprowadzenia kodu weryfikacyjnego.
-   **Główne elementy**:
    -   `<p>`: Komunikat dla użytkownika, np. "Wysłaliśmy 6-cyfrowy kod weryfikacyjny na Twój numer telefonu."
    -   `<form>` z atrybutami HTMX: `hx-post="/functions/v1/auth-verify"`, `hx-target="#notification-area"`.
    -   `<input type="text" name="token">` z atrybutami walidacji HTML5 (`required`, `pattern="[0-9]{6}"`, `maxlength="6"`).
    -   `<button type="submit">`: Przycisk "Weryfikuj" z wbudowanym wskaźnikiem ładowania (`hx-indicator`).
    -   `<div id="notification-area">`: Pusty kontener na komunikaty o błędach (np. "Błędny kod").
-   **Obsługiwane interakcje**: Wysłanie formularza.
-   **Obsługiwana walidacja**:
    -   **Po stronie klienta**: Pole `token` jest wymagane i musi składać się z 6 cyfr.
    -   **Po stronie serwera**: Weryfikacja poprawności tokena OTP przez Supabase Auth.
-   **Typy**: `VerifyOtpCommand`.
-   **Propsy**: `type` (`'sms'` lub `'phone_change'`), `phone` (string) - te dane mogą być przekazywane w ukrytych polach formularza lub zarządzane w sesji po stronie serwera.

### FooterPublic
-   **Opis komponentu**: Stopka strony z linkami do dokumentów prawnych.
-   **Główne elementy**: Linki do `/terms` i `/privacy`.
-   **Obsługiwane interakcje**: Nawigacja.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

## 5. Typy

### `VerifyOtpCommand` (ViewModel)
-   **Opis**: Nowy typ reprezentujący dane przesyłane z formularza weryfikacyjnego. Definiuje strukturę żądania do endpointu weryfikacji.
-   **Pola**:
    -   `token`: `string` - 6-cyfrowy kod OTP wprowadzony przez użytkownika.
    -   `phone`: `string` - Numer telefonu, na który wysłano kod.
    -   `type`: `'sms' | 'phone_change'` - Typ weryfikacji, zgodny z wymaganiami Supabase.

## 6. Zarządzanie stanem

Widok jest bezstanowy. Stan formularza jest zarządzany przez przeglądarkę. Komunikaty o błędach są w całości kontrolowane przez serwer, który zwraca odpowiednie fragmenty HTML do wstawienia w kontenerze `#notification-area`.

## 7. Integracja API

Formularz weryfikacyjny będzie komunikował się z dedykowaną funkcją brzegową (Edge Function), która pośredniczy w kontakcie z wbudowanym API Supabase Auth.

-   **Endpoint**: `POST /functions/v1/auth-verify`
-   **Cel**: Weryfikacja jednorazowego hasła (OTP) i dokończenie procesu logowania lub rejestracji.
-   **Typ żądania**: `VerifyOtpCommand`
    ```json
    {
      "phone": "+48123456789",
      "token": "123456",
      "type": "sms"
    }
    ```
-   **Typ odpowiedzi (Sukces)**: Pusta odpowiedź z kodem `200 OK` i nagłówkiem `HX-Redirect: /app`.
-   **Typ odpowiedzi (Błąd)**: Kod `400 Bad Request` lub `401 Unauthorized` i fragment HTML z komunikatem o błędzie.
    ```html
    <div id="notification-area" class="alert alert-error">
      Wprowadzony kod jest nieprawidłowy.
    </div>
    ```

## 8. Interakcje użytkownika

-   **Wpisanie kodu i wysłanie formularza**: Użytkownik wpisuje 6-cyfrowy kod z SMS-a i klika "Weryfikuj".
-   **Otrzymanie odpowiedzi sukcesu**: Przeglądarka, na polecenie nagłówka `HX-Redirect`, automatycznie przekierowuje użytkownika do głównego widoku aplikacji (`/app`).
-   **Otrzymanie odpowiedzi błędu**: W kontenerze `#notification-area` pojawia się komunikat "Wprowadzony kod jest nieprawidłowy.".

## 9. Warunki i walidacja

-   **Walidacja na poziomie komponentu `VerificationForm`**:
    -   **Warunek**: Pole `token` nie może być puste i musi zawierać dokładnie 6 cyfr.
    -   **Weryfikacja**: Atrybuty `required`, `pattern="[0-9]{6}"` i `maxlength="6"` w elemencie `<input>`.
    -   **Wpływ na UI**: Przeglądarka uniemożliwi wysłanie formularza i wyświetli standardowy komunikat walidacyjny.
-   **Walidacja na poziomie API**:
    -   **Warunek**: Podany token musi być prawidłowy i nie może być przeterminowany.
    -   **Weryfikacja**: Wywołanie `supabase.auth.verifyOtp()` wewnątrz Edge Function.
    -   **Wpływ na UI**: W przypadku błędu, endpoint zwróci fragment HTML z komunikatem, który zostanie wstawiony do `#notification-area`.

## 10. Obsługa błędów

-   **Nieprawidłowy lub wygasły token (401)**: Endpoint `auth-verify` zwróci kod `401` i fragment HTML z komunikatem "Wprowadzony kod jest nieprawidłowy.".
-   **Błędy sieciowe**: Globalny event listener `htmx:sendError` wyświetli komunikat o problemie z połączeniem.
-   **Błędy serwera (5xx)**: Endpoint `auth-verify` w bloku `catch` zwróci generyczny komunikat o błędzie serwera w formacie HTML.

## 11. Kroki implementacji

1.  **Stworzenie plików widoków**: Utwórz pliki dla stron weryfikacji (np. `src/pages/verify-phone.astro` i `src/pages/verify-2fa.astro`).
2.  **Implementacja layoutu i komponentów statycznych**: Złóż oba widoki, używając komponentów `LayoutPublic`, `HeaderPublic` i `FooterPublic`.
3.  **Implementacja komponentu `VerificationForm`**:
    -   Stwórz formularz HTML z polem `token` i przyciskiem `submit`.
    -   Dodaj atrybuty walidacyjne HTML5 (`required`, `pattern`, `maxlength`).
    -   Dodaj atrybuty HTMX do formularza: `hx-post="/functions/v1/auth-verify"`, `hx-target="#notification-area"`.
    -   Dodaj ukryte pola `<input type="hidden">` dla `phone` i `type`, których wartości będą przekazywane z poprzedniego kroku (logowania/rejestracji) przez serwer.
    -   Dodaj pusty `div` z `id="notification-area"`.
4.  **Stworzenie Edge Function (`auth-verify`)**:
    -   Utwórz nową funkcję brzegową w `supabase/functions/auth-verify/index.ts`.
    -   Zaimplementuj logikę:
        -   Pobierz `token`, `phone` i `type` z ciała żądania.
        -   Wywołaj `supabase.auth.verifyOtp({ phone, token, type })`.
        -   W przypadku sukcesu, zwróć odpowiedź z kodem `200` i nagłówkiem `HX-Redirect: /app`.
        -   W przypadku błędu, zwróć odpowiedź z kodem `401` i fragmentem HTML z komunikatem o błędzie.
5.  **Modyfikacja funkcji `register` i `auth-password`**:
    -   Upewnij się, że po stronie serwera, po pomyślnej rejestracji lub logowaniu, numer telefonu użytkownika jest przekazywany do szablonu widoku `/verify-phone` lub `/verify-2fa`, aby mógł zostać umieszczony w ukrytym polu formularza.
6.  **Stylowanie**: Użyj klas Tailwind CSS, aby ostylować formularz, przyciski i komunikaty o błędach, zapewniając responsywność.
7.  **Testowanie manualne**:
    -   Przetestuj cały przepływ rejestracji: `rejestracja -> weryfikacja telefonu -> dostęp do aplikacji`.
    -   Przetestuj cały przepływ logowania: `logowanie -> weryfikacja 2FA -> dostęp do aplikacji`.
    -   Sprawdź, czy wprowadzenie błędnego kodu na obu ścieżkach poprawnie wyświetla komunikat o błędzie.
    -   Sprawdź responsywność widoku na różnych urządzeniach.