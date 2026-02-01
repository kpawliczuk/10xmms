<conversation_summary>
<decisions>
1.  **Tabela Profili**: Zostanie utworzona osobna tabela `public.profiles` połączona relacją jeden-do-jednego z `auth.users` do przechowywania danych aplikacji.
2.  **Przechowywanie Obrazów**: Wygenerowane obrazy będą przechowywane bezpośrednio w bazie danych w tabeli `mms_history` jako pliki binarne (typ `bytea`).
3.  **Sprawdzanie Limitu Użytkownika**: Zostanie zaimplementowana funkcja PostgreSQL `count_user_mms_today` do wydajnego sprawdzania dziennego limitu MMS dla użytkownika.
4.  **Status MMS**: Status wysyłki MMS będzie reprezentowany przez dedykowany typ `ENUM` w PostgreSQL, zawierający wartości `success`, `generation_failed`, `send_failed`.
5.  **Partycjonowanie**: Tabela `mms_history` nie będzie partycjonowana na etapie MVP.
6.  **Indeksowanie**: Zostanie utworzony złożony indeks na kolumnach `(user_id, created_at)` w tabeli `mms_history` w celu optymalizacji wydajności.
7.  **Bezpieczeństwo (RLS)**: Zostaną włączone i skonfigurowane zasady bezpieczeństwa na poziomie wierszy (Row Level Security) dla tabel `profiles` i `mms_history`, aby zapewnić, że użytkownicy widzą tylko własne dane.
8.  **Globalny Limit Dzienny**: Do śledzenia globalnego limitu 20 MMS na dobę zostanie użyta osobna tabela `daily_global_stats`.
9.  **Klucze Główne**: Klucze główne w tabelach aplikacji będą typu `UUID`.
10. **Panel Administratora**: Statystyki dla panelu administratora będą dostarczane przez widok (VIEW) w bazie danych o nazwie `admin_daily_stats_view`.
</decisions>

<matched_recommendations>
1.  **Oddzielenie profili od autoryzacji**: Zaakceptowano rekomendację stworzenia tabeli `public.profiles` połączonej z `auth.users`, co jest najlepszą praktyką w Supabase.
2.  **Wydajne sprawdzanie limitów**: Zaakceptowano rekomendację użycia dedykowanej funkcji SQL (`count_user_mms_today`) do sprawdzania limitów użytkownika, co jest znacznie wydajniejsze niż skanowanie całej tabeli.
3.  **Integralność danych statusu**: Zaakceptowano rekomendację użycia typu `ENUM` dla statusu MMS, co zapewnia spójność danych i optymalizuje przechowywanie.
4.  **Indeksowanie dla wydajności**: Zaakceptowano kluczową rekomendację dodania złożonego indeksu do tabeli `mms_history`, co jest niezbędne do szybkiego działania funkcji limitów i pobierania historii.
5.  **Izolacja danych za pomocą RLS**: Zaakceptowano fundamentalną rekomendację dotyczącą bezpieczeństwa, polegającą na włączeniu RLS, aby uniemożliwić użytkownikom dostęp do danych innych osób.
6.  **Zarządzanie limitem globalnym**: Zaakceptowano rekomendację użycia osobnej tabeli do śledzenia globalnego licznika, co zapewnia spójność danych (atomowość operacji).
7.  **Użycie widoku dla statystyk**: Zaakceptowano rekomendację stworzenia widoku (`VIEW`) dla panelu administratora, co upraszcza architekturę i unika redundancji danych.
</matched_recommendations>

<database_planning_summary>
### Podsumowanie planowania bazy danych dla funnyMMS (MVP)

#### 1. Główne wymagania dotyczące schematu bazy danych
Schemat bazy danych PostgreSQL dla MVP `funnyMMS` został zaprojektowany w celu obsługi uwierzytelniania użytkowników, przechowywania ich profili, śledzenia historii generowanych MMS-ów oraz zarządzania limitami użycia. Projekt opiera się na integracji z systemem `auth` dostarczanym przez Supabase.

#### 2. Kluczowe encje i ich relacje
*   **`auth.users`** (dostarczane przez Supabase): Główna tabela przechowująca dane uwierzytelniające.
*   **`public.profiles`**: Tabela przechowująca publiczne dane użytkowników (nazwa, numer telefonu). Połączona relacją **jeden-do-jednego** z `auth.users` za pomocą klucza obcego `id`.
*   **`public.mms_history`**: Główna tabela transakcyjna, przechowująca każdy wygenerowany MMS. Zawiera m.in. `prompt`, binarną postać obrazu (`bytea`), status (`ENUM`) i datę utworzenia. Połączona relacją **wiele-do-jednego** z `auth.users` (użytkownik może mieć wiele wpisów w historii).
*   **`public.daily_global_stats`**: Tabela pomocnicza do śledzenia globalnego dziennego limitu wysłanych MMS w całej aplikacji.
*   **`public.admin_daily_stats_view`**: Widok (VIEW) agregujący dane z `mms_history` w celu prezentacji statystyk w panelu administratora.

#### 3. Ważne kwestie dotyczące bezpieczeństwa i skalowalności
*   **Bezpieczeństwo**: Podstawą bezpieczeństwa jest mechanizm **Row Level Security (RLS)** włączony dla tabel `profiles` i `mms_history`. Zdefiniowane polityki zapewniają ścisłą izolację danych, gwarantując, że użytkownicy mogą odczytywać i modyfikować wyłącznie własne zasoby.
*   **Wydajność i Skalowalność**:
    *   **Indeksowanie**: Kluczowy, złożony indeks na `(user_id, created_at)` w tabeli `mms_history` zapewni wysoką wydajność zapytań o historię użytkownika i sprawdzanie limitów.
    *   **Funkcje SQL**: Użycie funkcji `count_user_mms_today` przenosi logikę biznesową blisko danych, co jest wydajniejsze niż przetwarzanie po stronie aplikacji.
    *   **Ryzyko**: Decyzja o przechowywaniu obrazów jako `bytea` bezpośrednio w bazie danych stanowi **główne ryzyko dla skalowalności**. Może to prowadzić do szybkiego wzrostu rozmiaru bazy, spowolnienia zapytań, problemów z backupem i wyższych kosztów utrzymania.

</database_planning_summary>

</conversation_summary>