# Plan implementacji widoku: Landing Page

## 1. Przegląd

Widok "Landing Page" jest publicznie dostępną stroną główną aplikacji, przeznaczoną dla niezalogowanych użytkowników. Jej głównym celem jest szybkie i klarowne przedstawienie wartości produktu `funnyMMS` oraz zachęcenie odwiedzających do podjęcia akcji – rejestracji lub logowania. Strona będzie statyczna, zoptymalizowana pod kątem szybkiego ładowania i w pełni responsywna.

## 2. Routing widoku

-   **Ścieżka**: `/`

## 3. Struktura komponentów

Widok będzie renderowany po stronie serwera jako pojedyncza strona HTML. Jego struktura będzie oparta na kompozycji następujących komponentów:

```
LayoutPublic
├── HeaderPublic
├── HeroSection
├── ExampleUsage
└── FooterPublic
```

## 4. Szczegóły komponentów

### LayoutPublic
-   **Opis komponentu**: Główny szablon strony, zawierający podstawową strukturę HTML (`<html>`, `<head>`, `<body>`), importujący niezbędne arkusze stylów (Tailwind CSS) oraz skrypty (HTMX, Supabase-JS).
-   **Główne elementy**: `<head>` z metadanymi, `<link>` do CSS, `<body>` z miejscem na osadzenie komponentów widoku, `<script>` do bibliotek JS.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `children` (zawartość strony).

### HeaderPublic
-   **Opis komponentu**: Prosty nagłówek wyświetlany na stronach publicznych.
-   **Główne elementy**: `<h1>` lub `<div>` z nazwą/logo aplikacji "funnyMMS".
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### HeroSection
-   **Opis komponentu**: Główna sekcja marketingowa strony, która ma za zadanie przyciągnąć uwagę użytkownika.
-   **Główne elementy**:
    -   `<h1>`: Główne hasło (np. "Twórz śmieszne MMS-y w kilka sekund!").
    -   `<p>`: Krótki opis wyjaśniający problem i rozwiązanie (zgodnie z PRD).
    -   `<div>` z dwoma przyciskami:
        -   `<a href="/login">`: Przycisk "Zaloguj się".
        -   `<a href="/register">`: Przycisk "Zarejestruj się" (wyróżniony jako główna akcja).
-   **Obsługiwane interakcje**: Nawigacja do stron `/login` i `/register`.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### ExampleUsage
-   **Opis komponentu**: Komponent wizualny prezentujący przykład użycia aplikacji, aby pokazać jej możliwości.
-   **Główne elementy**:
    -   `<img>`: Statyczny obrazek reprezentujący przykładową, wygenerowaną grafikę.
    -   `<blockquote>` lub `<p>`: Tekst promptu, który został użyty do stworzenia powyższej grafiki.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `imageUrl` (string), `promptText` (string).

### FooterPublic
-   **Opis komponentu**: Stopka strony, zawierająca linki do dokumentów prawnych i informacje o prawach autorskich.
-   **Główne elementy**:
    -   `<a href="/terms">`: Link do regulaminu.
    -   `<a href="/privacy">`: Link do polityki prywatności.
    -   `<p>`: Informacja o prawach autorskich (np. "© 2024 funnyMMS").
-   **Obsługiwane interakcje**: Nawigacja do stron `/terms` i `/privacy`.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

## 5. Typy

Dla tego statycznego widoku nie są wymagane żadne specyficzne typy DTO ani ViewModel. Komponent `ExampleUsage` będzie przyjmował proste typy `string` jako propsy.

## 6. Zarządzanie stanem

Widok "Landing Page" jest bezstanowy. Nie wymaga zarządzania stanem po stronie klienta ani żadnych niestandardowych hooków. Cała zawartość jest renderowana statycznie po stronie serwera.

## 7. Integracja API

Ten widok nie wykonuje żadnych bezpośrednich wywołań API. Jego jedyną "integracją" jest dostarczenie linków nawigacyjnych do widoków (`/login`, `/register`), które będą inicjować interakcje z API autoryzacyjnym Supabase.

## 8. Interakcje użytkownika

-   **Kliknięcie "Zaloguj się"**: Użytkownik jest przenoszony na stronę `/login`.
-   **Kliknięcie "Zarejestruj się"**: Użytkownik jest przenoszony na stronę `/register`.
-   **Kliknięcie linków w stopce**: Użytkownik jest przenoszony na odpowiednie strony informacyjne (`/terms`, `/privacy`).

## 9. Warunki i walidacja

Ten widok nie zawiera żadnych formularzy ani pól wejściowych, w związku z czym nie ma potrzeby implementacji logiki walidacyjnej.

## 10. Obsługa błędów

Jako strona statyczna, jedynym potencjalnym błędem jest błąd serwera (np. `500`) podczas próby jej załadowania. Obsługa tego typu błędów leży po stronie infrastruktury hostingowej (np. DigitalOcean).

## 11. Kroki implementacji

1.  **Stworzenie pliku widoku**: Utwórz nowy plik dla strony głównej (np. `src/pages/index.astro` lub odpowiednik w używanym systemie szablonów).
2.  **Implementacja `LayoutPublic`**: Stwórz główny layout, dodając strukturę HTML, `head` z metadanymi oraz linki do Tailwind CSS i skryptów (HTMX, Supabase-JS).
3.  **Implementacja `HeaderPublic`**: Stwórz komponent nagłówka z nazwą aplikacji.
4.  **Implementacja `HeroSection`**: Stwórz komponent z głównym hasłem, opisem i przyciskami akcji (`<a>`), które prowadzą do `/login` i `/register`.
5.  **Implementacja `ExampleUsage`**: Stwórz komponent, który przyjmuje `imageUrl` i `promptText` jako propsy i wyświetla je w estetyczny sposób. Użyj statycznych danych dla MVP.
6.  **Implementacja `FooterPublic`**: Stwórz komponent stopki z linkami do regulaminu i polityki prywatności.
7.  **Złożenie widoku**: W głównym pliku widoku (`index.astro`) zaimportuj i złóż wszystkie powyższe komponenty w odpowiedniej kolejności.
8.  **Stylowanie i responsywność**: Użyj klas Tailwind CSS, aby ostylować wszystkie komponenty i zapewnić, że układ jest w pełni responsywny, zgodnie z kryteriami akceptacji US-010.
9.  **Konfiguracja routingu**: Upewnij się, że serwer (np. Astro, Next.js) jest skonfigurowany tak, aby serwować ten widok pod główną ścieżką `/`.
10. **Testowanie manualne**: Sprawdź, czy strona poprawnie renderuje się na różnych szerokościach ekranu (desktop, tablet, mobile) i czy wszystkie linki nawigacyjne działają zgodnie z oczekiwaniami.