# Architektura UI dla funnyMMS

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji `funnyMMS` jest zaprojektowana w oparciu o filozofię **HATEOAS (Hypermedia as the Engine of Application State)**, z wykorzystaniem biblioteki **HTMX**. Oznacza to, że serwer jest odpowiedzialny za dostarczanie nie tylko danych, ale również gotowych do wyrenderowania fragmentów HTML. Taka architektura minimalizuje ilość logiki po stronie klienta (JavaScript), upraszcza zarządzanie stanem i doskonale wpisuje się w ramy szybkiego tworzenia MVP.

Kluczowe zasady:
-   **Server-Side Rendering (SSR) fragmentów HTML**: Każda interakcja użytkownika (kliknięcie, wysłanie formularza) wysyła żądanie do serwera (Supabase Edge Functions), który w odpowiedzi zwraca fragment HTML do wstawienia w odpowiednie miejsce na stronie.
-   **Progresywne ulepszanie**: Aplikacja jest funkcjonalna nawet z wyłączonym JavaScriptem (dla podstawowych formularzy), a HTMX i minimalna ilość JS dodają dynamiczne interakcje.
-   **Responsywność (RWD)**: Układ jest w pełni responsywny dzięki zastosowaniu **Tailwind CSS**, zapewniając spójne doświadczenie na urządzeniach mobilnych i desktopowych.
-   **Centralizacja stanu na serwerze**: Stan aplikacji (np. dane użytkownika, historia, limity) jest przechowywany i zarządzany po stronie serwera. UI jest jedynie odzwierciedleniem tego stanu.

## 2. Lista widoków

### 1. Strona Główna (Landing Page)
-   **Ścieżka**: `/`
-   **Główny cel**: Przedstawienie wartości aplikacji nowym użytkownikom i zachęcenie ich do rejestracji lub logowania.
-   **Kluczowe informacje**: Krótki opis usługi, przykładowa grafika wygenerowana przez AI wraz z użytym promptem.
-   **Kluczowe komponenty**:
    -   Nagłówek z nazwą aplikacji.
    -   Sekcja "Hero" z hasłem przewodnim.
    -   Komponent `PrzykładUżycia` (grafika + prompt).
    -   Przyciski akcji: `Zaloguj się` i `Zarejestruj się`.
    -   Stopka z linkami do regulaminu i polityki prywatności.
-   **UX/Bezpieczeństwo**: Widok publicznie dostępny, zoptymalizowany pod kątem szybkiego ładowania.

### 2. Logowanie
-   **Ścieżka**: `/login`
-   **Główny cel**: Umożliwienie zarejestrowanym użytkownikom zalogowania się do aplikacji.
-   **Kluczowe informacje**: Pola formularza.
-   **Kluczowe komponenty**:
    -   Formularz logowania (`hx-post="/auth/login"`) z polami na login i hasło.
    -   Kontener na komunikaty o błędach (np. błędne dane).
    -   Link do strony rejestracji.
-   **UX/Bezpieczeństwo**: Formularz powinien mieć walidację po stronie klienta (atrybuty HTML5). Komunikacja z serwerem przez HTTPS.

### 3. Rejestracja
-   **Ścieżka**: `/register`
-   **Główny cel**: Umożliwienie nowym użytkownikom założenia konta.
-   **Kluczowe informacje**: Pola formularza, linki do dokumentów prawnych.
-   **Kluczowe komponenty**:
    -   Formularz rejestracji (`hx-post="/auth/register"`) z polami: login, hasło (z potwierdzeniem), numer telefonu.
    -   Checkbox do akceptacji regulaminu (wymagany).
    -   Kontener na błędy walidacji.
-   **UX/Bezpieczeństwo**: Po pomyślnej rejestracji, serwer zwraca nagłówek `HX-Redirect: /verify-phone`, aby płynnie przenieść użytkownika do kolejnego kroku.

### 4. Weryfikacja (2FA / Telefon)
-   **Ścieżka**: `/verify-2fa`, `/verify-phone`
-   **Główny cel**: Potwierdzenie tożsamości użytkownika za pomocą kodu SMS.
-   **Kluczowe informacje**: Instrukcja dla użytkownika, pole do wpisania kodu.
-   **Kluczowe komponenty**:
    -   Formularz z jednym polem na kod (`hx-post="/auth/verify"`).
    -   Komunikat informujący, że kod został wysłany.
    -   Kontener na błędy (np. "Błędny kod").
-   **UX/Bezpieczeństwo**: Po pomyślnej weryfikacji, serwer zwraca `HX-Redirect` do głównego widoku aplikacji (`/app`).

### 5. Generator MMS (Główny widok aplikacji)
-   **Ścieżka**: `/app`
-   **Główny cel**: Główne narzędzie do generowania MMS-ów przez użytkownika.
-   **Kluczowe informacje**: Pole do wpisania promptu, informacja o pozostałych limitach (opcjonalnie).
-   **Kluczowe komponenty**:
    -   **Pasek nawigacyjny**: Z linkami do `/app` (Generator) i `/profile` (Profil).
    -   **Kontener na powiadomienia (`#notification-area`)**: Centralne miejsce na wszystkie komunikaty zwrotne z serwera.
    -   **Formularz generatora**:
        -   Pole `textarea` na prompt (`hx-post="/functions/v1/mms"`).
        -   Przycisk "Generuj i wyślij" z wbudowanym wskaźnikiem ładowania (`hx-indicator`) i mechanizmem blokady na czas żądania.
-   **UX/Bezpieczeństwo**: Widok dostępny tylko dla zalogowanych użytkowników. Jeśli dzienny limit jest wyczerpany, przycisk generowania jest renderowany jako nieaktywny.

### 6. Profil i Historia
-   **Ścieżka**: `/profile`
-   **Główny cel**: Umożliwienie użytkownikowi przeglądania danych swojego konta oraz historii wygenerowanych MMS-ów.
-   **Kluczowe informacje**: Dane użytkownika, siatka z miniaturami.
-   **Kluczowe komponenty**:
    -   **Pasek nawigacyjny**.
    -   **Sekcja profilu**: Wyświetla nazwę użytkownika i zamaskowany numer telefonu. Zawiera przycisk "Wyloguj".
    -   **Siatka historii (`#history-grid`)**: Responsywna siatka z komponentami `MiniaturaMMS`.
    -   **Przycisk "Załaduj więcej"**: (`hx-get="/mms_history?offset=..."`, `hx-swap="beforeend"`) do paginacji.
-   **UX/Bezpieczeństwo**: Dostępny tylko dla zalogowanych. Dane pobierane przez `GET /rest/v1/mms_history` z parametrami `limit` i `offset`.

## 3. Mapa podróży użytkownika

### Główny przepływ: Generowanie MMS
1.  **Użytkownik wchodzi na `/app`**. Widzi formularz do generowania.
2.  **Wpisuje prompt** w pole tekstowe.
3.  **Klika "Generuj i wyślij"**. Przycisk staje się nieaktywny, pojawia się wskaźnik ładowania.
4.  **HTMX wysyła `POST`** na `/functions/v1/mms`.
5.  **Serwer zwraca `202 Accepted`** i fragment HTML z komunikatem "Przetwarzanie w toku...", który jest wstawiany do `#notification-area`. Odpowiedź zawiera też nagłówek `HX-Trigger: {"loadHistory": {"delay":"5s"}}`.
6.  **Formularz zostaje wyczyszczony** (dzięki `hx-swap-oob="true"` w odpowiedzi serwera).
7.  **Po 5 sekundach HTMX**, na skutek zdarzenia `loadHistory`, wysyła żądanie `GET` w celu odświeżenia siatki z historią na stronie `/profile`.
8.  Użytkownik otrzymuje MMS na telefon.

### Przepływ logowania
1.  Użytkownik na `/` klika "Zaloguj się" -> przechodzi na `/login`.
2.  Wpisuje dane, wysyła formularz.
3.  Serwer weryfikuje dane, wysyła SMS z kodem i zwraca `HX-Redirect: /verify-2fa`.
4.  Użytkownik na `/verify-2fa` wpisuje kod, wysyła formularz.
5.  Serwer weryfikuje kod i zwraca `HX-Redirect: /app`.

## 4. Układ i struktura nawigacji

Aplikacja będzie miała prosty, dwuczęściowy układ:

-   **Część publiczna**: Strony dostępne dla wszystkich (`/`, `/login`, `/register`, etc.). Nie posiadają one stałej nawigacji poza linkami w treści i stopce.
-   **Część prywatna**: Dostępna po zalogowaniu (`/app`, `/profile`). Wszystkie strony w tej części posiadają **wspólny, stały pasek nawigacyjny** na górze, zawierający:
    -   Logo/Nazwę aplikacji (link do `/app`).
    -   Link "Generator" (do `/app`).
    -   Link "Profil" (do `/profile`).
    -   Przycisk/link "Wyloguj".

Nawigacja między widokami odbywa się poprzez standardowe linki `<a>` wzmocnione atrybutem `hx-boost="true"`, co pozwala HTMX na płynne przeładowywanie tylko głównej treści strony, bez odświeżania całej witryny.

## 5. Kluczowe komponenty

Poniższe komponenty będą reużywalne i renderowane po stronie serwera.

-   **PasekNawigacyjny**: Wspólny dla wszystkich widoków prywatnych.
-   **FormularzGeneratora**: Główny formularz na stronie `/app`. Jego stan (aktywny/nieaktywny przycisk) jest kontrolowany przez serwer.
-   **KontenerPowiadomien (`#notification-area`)**: Standardowy komponent `<div>` do wyświetlania dynamicznych komunikatów zwrotnych z API.
-   **SiatkaHistorii (`#history-grid`)**: Kontener `<div>` w układzie siatki (CSS Grid), który jest celem dla paginacji.
-   **MiniaturaMMS**: Pojedynczy element siatki, zawierający `<a>` z `<img>` w środku. Link otwiera obraz w nowej karcie.
-   **PrzyciskPaginacji**: Przycisk "Załaduj więcej" z atrybutami HTMX do doładowywania kolejnych elementów.

Ta architektura zapewnia, że interfejs jest prosty, łatwy w utrzymaniu i w pełni wykorzystuje moc deklaratywnego podejścia HTMX, minimalizując złożoność po stronie klienta.