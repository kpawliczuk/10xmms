# API Endpoint Implementation Plan: Get Current User's Profile

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /rest/v1/profiles` służy do pobierania danych profilowych aktualnie uwierzytelnionego użytkownika. Jest to standardowy, auto-generowany przez Supabase (PostgREST) endpoint, który operuje na tabeli `public.profiles`. Bezpieczeństwo i dostęp do danych są w pełni kontrolowane przez polityki Row-Level Security (RLS) zdefiniowane w bazie danych.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/rest/v1/profiles`
-   **Parametry**:
    -   **Wymagane**:
        -   `id=eq.{user_id}`: Filtruje wyniki do profilu, którego `id` pasuje do ID aktualnie zalogowanego użytkownika.
    -   **Opcjonalne**:
        -   `select=*`: Określa, które kolumny mają zostać zwrócone. Zalecane jest jawne określenie kolumn (np. `select=id,username,phone_number`) zamiast `*` dla lepszej wydajności i bezpieczeństwa.
-   **Request Body**: Brak (dla metody `GET`).

## 3. Wykorzystywane typy

-   **`ProfileDto`**: Reprezentuje obiekt danych profilu użytkownika zwracany w odpowiedzi.
    