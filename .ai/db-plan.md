# Schemat Bazy Danych PostgreSQL dla funnyMMS

Poniższy dokument opisuje schemat bazy danych dla aplikacji funnyMMS (MVP), zaprojektowany do wdrożenia na platformie Supabase (PostgreSQL).

## 1. Tabele

### `public.profiles`
Przechowuje publiczne dane profilowe użytkowników, rozszerzając wbudowaną tabelę `auth.users`.

| Nazwa kolumny   | Typ danych    | Ograniczenia                                           | Opis                                             |
|-----------------|---------------|--------------------------------------------------------|--------------------------------------------------|
| `id`            | `uuid`        | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Klucz główny, powiązany 1-do-1 z `auth.users`.   |
| `username`      | `text`        | `UNIQUE`                                               | Unikalna nazwa użytkownika.                      |
| `phone_number`  | `text`        |                                                        | Zweryfikowany numer telefonu użytkownika.        |
| `updated_at`    | `timestamptz` |                                                        | Znacznik czasu ostatniej aktualizacji profilu.   |

### `public.mms_history`
Główna tabela transakcyjna, przechowująca historię wszystkich wygenerowanych wiadomości MMS.

| Nazwa kolumny | Typ danych     | Ograniczenia                                         | Opis                                                              |
|---------------|----------------|------------------------------------------------------|-------------------------------------------------------------------|
| `id`          | `uuid`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`           | Unikalny identyfikator wpisu w historii.                          |
| `user_id`     | `uuid`         | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika, który wygenerował MMS.                 |
| `prompt`      | `text`         | `NOT NULL`, `CHECK (char_length(prompt) <= 300)`     | Tekst użyty do wygenerowania grafiki (maks. 300 znaków).          |
| `image_data`  | `bytea`        | `NOT NULL`                                           | Binarna zawartość wygenerowanego obrazu.                          |
| `status`      | `mms_status`   | `NOT NULL`                                           | Status operacji (typ `ENUM`: `success`, `generation_failed`, `send_failed`). |
| `model_info`  | `text`         |                                                      | Informacja o modelu AI użytym do generacji.                       |
| `created_at`  | `timestamptz`  | `NOT NULL`, `DEFAULT now()`                          | Znacznik czasu utworzenia rekordu.                                |

### `public.daily_global_stats`
Tabela pomocnicza do śledzenia globalnego, dziennego limitu wysłanych MMS.

| Nazwa kolumny    | Typ danych | Ograniczenia                                       | Opis                                                      |
|------------------|------------|----------------------------------------------------|-----------------------------------------------------------|
| `day`            | `date`     | `PRIMARY KEY`, `DEFAULT (now() AT TIME ZONE 'utc')::date` | Dzień (UTC), dla którego zliczane są statystyki.          |
| `mms_sent_count` | `integer`  | `NOT NULL`, `DEFAULT 0`                            | Liczba MMS wysłanych w danym dniu w całej aplikacji.      |

### Typy niestandardowe

*   **`public.mms_status`**:
    ```sql
    CREATE TYPE public.mms_status AS ENUM ('success', 'generation_failed', 'send_failed');
    ```

## 2. Relacje

*   **`auth.users` ↔ `public.profiles`**: Relacja **jeden-do-jednego**. Każdy użytkownik w `auth.users` ma dokładnie jeden powiązany profil w `public.profiles`.
*   **`auth.users` → `public.mms_history`**: Relacja **jeden-do-wielu**. Każdy użytkownik może mieć wiele wpisów w historii MMS, ale każdy wpis w historii należy do jednego użytkownika.

## 3. Indeksy

*   **`mms_history_user_id_created_at_idx`**:
    *   **Tabela**: `public.mms_history`
    *   **Kolumny**: `(user_id, created_at)`
    *   **Cel**: Krytyczny dla wydajności. Przyspiesza pobieranie historii dla konkretnego użytkownika (sortowanie po dacie) oraz działanie funkcji `count_user_mms_today`, która sprawdza dzienny limit.

*Klucze główne i obce są automatycznie indeksowane przez PostgreSQL.*

## 4. Zasady Bezpieczeństwa na Poziomie Wierszy (RLS)

RLS zostanie włączone dla tabel `profiles` i `mms_history`, aby zapewnić ścisłą izolację danych.

### Polityki dla `public.profiles`

*   **`SELECT`**: Użytkownicy mogą odczytywać tylko własny profil.
    ```sql
    CREATE POLICY "Users can view their own profile."
    ON public.profiles FOR SELECT USING (auth.uid() = id);
    ```
*   **`INSERT` / `UPDATE`**: Użytkownicy mogą tworzyć i modyfikować tylko własny profil.
    ```sql
    CREATE POLICY "Users can insert/update their own profile."
    ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    ```

### Polityki dla `public.mms_history`

*   **`SELECT`**: Użytkownicy mogą odczytywać tylko własną historię MMS.
    ```sql
    CREATE POLICY "Users can view their own MMS history."
    ON public.mms_history FOR SELECT USING (auth.uid() = user_id);
    ```
*   **`INSERT`**: Użytkownicy mogą dodawać wpisy do historii tylko dla siebie.
    ```sql
    CREATE POLICY "Users can insert their own MMS records."
    ON public.mms_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```

## 5. Funkcje i Widoki

*   **Funkcja `count_user_mms_today(p_user_id uuid)`**: Oblicza liczbę MMS-ów wysłanych przez danego użytkownika w bieżącym dniu (UTC). Niezbędna do implementacji logiki limitów.
*   **Widok `admin_daily_stats_view`**: Agreguje dane z `mms_history` w celu dostarczenia dziennych statystyk dla panelu administratora (liczba prób, sukcesów, błędów generacji i wysyłki).
*   **Trigger `on_auth_user_created`**: Po utworzeniu nowego użytkownika w `auth.users`, automatycznie tworzy dla niego powiązany wiersz w tabeli `public.profiles`.

## 6. Dodatkowe uwagi i decyzje projektowe

*   **Przechowywanie obrazów (`bytea`)**: Zgodnie z decyzją z sesji planowania, obrazy będą przechowywane jako dane binarne (`bytea`) bezpośrednio w tabeli `mms_history`.
    *   **Ryzyko**: Ta decyzja stanowi **główne ryzyko dla skalowalności i wydajności** projektu. Przechowywanie dużych obiektów binarnych w bazie danych może prowadzić do jej szybkiego puchnięcia, spowolnienia zapytań (zwłaszcza `SELECT *`), problemów z wydajnością backupów i wyższych kosztów utrzymania.
    *   **Rekomendacja długoterminowa**: W przyszłych iteracjach projektu należy priorytetowo potraktować migrację do przechowywania obrazów w dedykowanej usłudze (np. Supabase Storage) i zapisywania w bazie jedynie linku do obiektu.
*   **Klucze Główne (`uuid`)**: Użycie `UUID` jako kluczy głównych jest zgodne z najlepszymi praktykami dla systemów rozproszonych i ułatwia integrację z `auth.users` od Supabase.