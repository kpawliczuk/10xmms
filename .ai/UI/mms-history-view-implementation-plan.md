# Plan implementacji widoku: Profil i Historia

## 1. Przegląd

Widok "Profil i Historia" jest kluczowym ekranem dla zalogowanego użytkownika, łączącym w sobie dwie funkcje: prezentację danych o koncie oraz przeglądanie historii wygenerowanych wiadomości MMS. Zgodnie z architekturą opartą na HTMX, widok ten będzie renderowany po stronie serwera, a dynamiczne akcje, takie jak doładowywanie kolejnych elementów historii, będą realizowane poprzez pobieranie gotowych fragmentów HTML z backendu.

Celem jest stworzenie spójnego, responsywnego i wydajnego interfejsu, który w intuicyjny sposób prezentuje użytkownikowi jego dane i aktywność w aplikacji.

## 2. Routing widoku

-   **Ścieżka**: `/profile`

## 3. Struktura komponentów

Widok będzie renderowany po stronie serwera jako pojedyncza strona HTML. Jego struktura będzie oparta na kompozycji następujących komponentów:

```
LayoutPrivate
├── NavigationBar
└── ProfileView
    ├── ProfileSection
    └── HistorySection
        ├── HistoryGrid
        └── LoadMoreButton
```

## 4. Szczegóły komponentów

### LayoutPrivate
-   **Opis komponentu**: Główny szablon dla widoków prywatnych, zawierający podstawową strukturę HTML, importujący arkusze stylów (Tailwind CSS) oraz skrypty (HTMX, Supabase-JS).
-   **Główne elementy**: `<head>`, `<body>`.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `children` (zawartość strony), `user` (dane zalogowanego użytkownika).

### NavigationBar
-   **Opis komponentu**: Wspólny dla wszystkich widoków prywatnych pasek nawigacyjny.
-   **Główne elementy**: Linki do `/app` i `/profile`, przycisk "Wyloguj".
-   **Obsługiwane interakcje**: Nawigacja, wylogowanie.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### ProfileView
-   **Opis komponentu**: Główny kontener dla widoku profilu. Odpowiedzialny za pobranie danych profilu i historii przy pierwszym renderowaniu.
-   **Główne elementy**: `ProfileSection`, `HistorySection`.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `ProfileViewModel`.
-   **Propsy**: `profile` (ProfileDto), `initialHistory` (MmsHistoryDto[]), `nextPageOffset` (number | null).

### ProfileSection
-   **Opis komponentu**: Sekcja wyświetlająca dane zalogowanego użytkownika.
-   **Główne elementy**:
    -   `<h2>`: Nazwa użytkownika.
    -   `<p>`: Zamaskowany numer telefonu.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `ProfileDto`.
-   **Propsy**: `profile` (ProfileDto).

### HistorySection
-   **Opis komponentu**: Sekcja zawierająca historię wygenerowanych MMS-ów.
-   **Główne elementy**: `HistoryGrid`, `LoadMoreButton`.
-   **Obsługiwane interakcje**: Brak.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `MmsHistoryDto[]`.
-   **Propsy**: `initialHistory` (MmsHistoryDto[]), `nextPageOffset` (number | null).

### HistoryGrid
-   **Opis komponentu**: Responsywna siatka wyświetlająca miniatury MMS.
-   **Główne elementy**:
    -   `<div id="history-grid">`: Kontener siatki (CSS Grid).
    -   Dynamicznie renderowana lista komponentów `HistoryItem`.
-   **Obsługiwane interakcje**: Brak (interakcje obsługiwane przez `HistoryItem`).
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `MmsHistoryDto[]`.
-   **Propsy**: `historyItems` (MmsHistoryDto[]).

### HistoryItem
-   **Opis komponentu**: Pojedynczy element w siatce historii.
-   **Główne elementy**:
    -   `<a href="/mms/image/{id}" target="_blank">`: Link otwierający pełny obraz w nowej karcie.
    -   `<img>`: Miniatura obrazu MMS.
    -   `<div>`: Nakładka (np. on-hover) wyświetlająca `prompt` i `created_at`.
-   **Obsługiwane interakcje**: Kliknięcie w celu otwarcia obrazu.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `MmsHistoryDto`.
-   **Propsy**: `item` (MmsHistoryDto).

### LoadMoreButton
-   **Opis komponentu**: Przycisk do ładowania kolejnej strony wyników historii.
-   **Główne elementy**:
    -   `<button>` z atrybutami HTMX: `hx-get`, `hx-target="#history-grid"`, `hx-swap="beforeend"`.
    -   Wskaźnik ładowania (`hx-indicator`).
-   **Obsługiwane interakcje**: Kliknięcie w celu doładowania elementów.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**: `nextOffset` (number).

## 5. Typy

### `ProfileDto` (z `src/types.ts`)
-   **Opis**: Obiekt danych profilu użytkownika, mapowany 1:1 z tabelą `profiles`.

### `MmsHistoryDto` (z `src/types.ts`)
-   **Opis**: Obiekt danych pojedynczego wpisu w historii, z pominięciem pola `image_data`.

### `ProfileViewModel` (ViewModel)
-   **Opis**: Nowy typ reprezentujący wszystkie dane potrzebne do wyrenderowania widoku `/profile` po stronie serwera.
-   **Pola**:
    -   `profile`: `ProfileDto` - Dane profilowe zalogowanego użytkownika.
    -   `initialHistory`: `MmsHistoryDto[]` - Pierwsza strona wyników historii MMS.
    -   `nextPageOffset`: `number | null` - Offset dla następnej strony paginacji lub `null`, jeśli nie ma więcej wyników.

## 6. Zarządzanie stanem

Stan widoku jest zarządzany po stronie serwera.
-   **Stan początkowy**: Przy pierwszym żądaniu `GET /profile`, serwer pobiera dane profilu oraz pierwszą stronę historii i renderuje cały widok.
-   **Paginacja**: Stan paginacji (offset) jest zarządzany przez atrybuty HTMX. Przycisk "Załaduj więcej" zawiera `hx-get` ze ścieżką do następnej strony. Po kliknięciu, serwer renderuje i zwraca tylko nowe elementy `HistoryItem`, które HTMX dołącza na końcu siatki.

## 7. Integracja API

Widok będzie korzystał z dwóch głównych endpointów. Zgodnie z architekturą, wywołania te będą realizowane po stronie serwera (w logice renderowania strony lub w dedykowanej Edge Function), a do klienta trafi gotowy HTML.

1.  **Pobieranie danych profilu**:
    -   **Endpoint**: `GET /rest/v1/profiles?select=...&id=eq.{user_id}`
    -   **Cel**: Pobranie danych zalogowanego użytkownika.
    -   **Typ odpowiedzi**: `ProfileDto[]`

2.  **Pobieranie historii MMS (paginacja)**:
    -   **Endpoint**: `GET /functions/v1/history-items?limit=10&offset={offset}` (dedykowana Edge Function)
    -   **Cel**: Pobranie listy elementów historii w formacie HTML.
    -   **Typ odpowiedzi**: `string` (fragment HTML zawierający listę `HistoryItem` oraz zaktualizowany przycisk `LoadMoreButton`).

3.  **Pobieranie obrazu MMS**:
    -   **Endpoint**: `GET /functions/v1/mms/image/{id}` (dedykowana Edge Function)
    -   **Cel**: Pobranie i zwrócenie binarnej zawartości obrazu z bazy danych z odpowiednim nagłówkiem `Content-Type: image/jpeg`.

## 8. Interakcje użytkownika

-   **Wejście na stronę**: Użytkownik klika link "Profil" w nawigacji, co powoduje załadowanie strony `/profile` z pierwszą partią historii.
-   **Przeglądanie historii**: Użytkownik przewija siatkę z miniaturami.
-   **Kliknięcie miniatury**: Otwiera pełnowymiarowy obraz w nowej karcie przeglądarki.
-   **Ładowanie kolejnych elementów**: Użytkownik klika przycisk "Załaduj więcej", co doładowuje kolejne elementy do siatki bez przeładowywania strony. Przycisk jest ukrywany, gdy nie ma więcej wyników.

## 9. Warunki i walidacja

Ten widok jest przeznaczony tylko do odczytu, więc nie ma walidacji po stronie klienta. Jedynym warunkiem jest uwierzytelnienie użytkownika, co jest weryfikowane na poziomie serwera przed wyrenderowaniem widoku.

## 10. Obsługa błędów

-   **Błąd autoryzacji (401)**: Jeśli użytkownik nie jest zalogowany, serwer powinien go przekierować na stronę `/login`.
-   **Błąd pobierania danych (500)**: W przypadku problemu z pobraniem danych profilu lub historii, serwer powinien wyrenderować stronę błędu z odpowiednim komunikatem.
-   **Brak historii**: Jeśli użytkownik nie ma jeszcze żadnych wygenerowanych MMS-ów, siatka powinna być pusta, a na jej miejscu powinien pojawić się komunikat, np. "Nie masz jeszcze żadnej historii. Wygeneruj swojego pierwszego MMS-a!".

## 11. Kroki implementacji

1.  **Stworzenie pliku widoku**: Utwórz plik dla strony profilu (np. `src/pages/profile.astro`).
2.  **Logika po stronie serwera (w pliku widoku)**:
    -   Dodaj logikę weryfikacji sesji użytkownika. Jeśli jest niezalogowany, przekieruj na `/login`.
    -   Wykonaj równolegle dwa zapytania do API Supabase: jedno po dane z `profiles`, drugie po pierwszą stronę (np. `limit=12`) z `mms_history`.
    -   Przygotuj obiekt `ProfileViewModel` i przekaż go jako props do głównego komponentu widoku.
3.  **Implementacja layoutu i komponentów**: Złóż widok, używając `LayoutPrivate`, `NavigationBar`, `ProfileSection` i `HistorySection`.
4.  **Implementacja `ProfileSection`**: Wyrenderuj dane użytkownika (`profile.username`, zamaskowany `profile.phone_number`).
5.  **Implementacja `HistorySection`**:
    -   Użyj pętli, aby wyrenderować komponenty `HistoryItem` na podstawie `initialHistory`.
    -   Jeśli `nextPageOffset` nie jest `null`, wyrenderuj komponent `LoadMoreButton`, przekazując mu `nextPageOffset` do atrybutu `hx-get`.
6.  **Stworzenie Edge Function (`history-items`)**:
    -   Utwórz nową funkcję w `supabase/functions/history-items/index.ts`.
    -   Funkcja powinna przyjmować `limit` i `offset` jako parametry zapytania.
    -   Wewnątrz funkcji: pobierz odpowiednią stronę z `mms_history`, wyrenderuj listę `HistoryItem` oraz nowy przycisk `LoadMoreButton` z kolejnym offsetem i zwróć je jako jeden fragment HTML.
7.  **Stworzenie Edge Function (`mms/image/{id}`)**:
    -   Utwórz nową funkcję, która będzie obsługiwać dynamiczny routing.
    -   Funkcja powinna pobrać `id` obrazu z URL, odpytać bazę o pole `image_data` z tabeli `mms_history` i zwrócić dane binarne z nagłówkiem `Content-Type: image/jpeg`.
8.  **Stylowanie**: Użyj klas Tailwind CSS, aby ostylować wszystkie komponenty, w tym responsywną siatkę (np. `grid-cols-2 md:grid-cols-4`).
9.  **Testowanie manualne**:
    -   Sprawdź, czy dane profilu i pierwsza strona historii ładują się poprawnie.
    -   Przetestuj działanie przycisku "Załaduj więcej" i sprawdź, czy nowe elementy są poprawnie dołączane.
    -   Zweryfikuj, że kliknięcie miniatury otwiera obraz w nowej karcie.
    -   Sprawdź responsywność widoku.
    -   Przetestuj widok dla użytkownika bez historii.