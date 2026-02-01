<conversation_summary>
<decisions>
1.  **Nawigacja**: Zostanie zaimplementowany stały, prosty pasek nawigacyjny na górze strony z linkami do "Generatora" i "Profilu/Historii".
2.  **Uwierzytelnianie 2FA**: Weryfikacja za pomocą tokena SMS będzie wymagana przy każdym logowaniu, a proces ten będzie odbywał się na osobnej stronie `/verify-2fa`.
3.  **Widok Historii**: Historia MMS będzie prezentowana jako responsywna siatka (grid) z miniaturami. Kliknięcie na miniaturę otworzy pełnowymiarowy obraz w nowej karcie.
4.  **Asynchroniczność**: Po zainicjowaniu generowania MMS (odpowiedź `202 Accepted`), UI wyświetli stały komunikat "Przetwarzanie w toku...", a po 5 sekundach automatycznie odświeży listę historii za pomocą `HX-Trigger`.
5.  **Styling**: Do stylizacji interfejsu zostanie użyta prosta konfiguracja Tailwind CSS.
6.  **Komunikaty**: Wszystkie komunikaty o statusie i błędach będą wyświetlane w dedykowanym kontenerze `<div id="notification-area">` nad głównym formularzem.
7.  **Obsługa Sesji**: Wygasła sesja (błąd `401`) spowoduje automatyczne przekierowanie użytkownika na stronę logowania za pomocą `HX-Redirect`.
8.  **Paginacja Historii**: Zostanie zaimplementowany prosty przycisk "Załaduj więcej" do doładowywania kolejnych elementów historii.
9.  **Strona Profilu**: Widok profilu użytkownika i historii zostanie połączony w jedną stronę.
10. **Obsługa Błędów Sieciowych**: Błędy sieciowe będą obsługiwane przez globalny event listener JavaScript nasłuchujący na zdarzenie `htmx:sendError`.
</decisions>
<matched_recommendations>
1.  **Prosta nawigacja**: Zaakceptowano rekomendację o stałym, prostym pasku nawigacyjnym dla łatwego dostępu do kluczowych sekcji.
2.  **Siatka dla historii**: Zaakceptowano rekomendację użycia responsywnej siatki z miniaturami dla widoku historii, z otwieraniem obrazów w nowej karcie dla uproszczenia MVP.
3.  **Obsługa asynchroniczności przez `HX-Trigger`**: Zaakceptowano rekomendację użycia `HX-Trigger` z opóźnieniem do automatycznego odświeżania stanu po operacji asynchronicznej.
4.  **Lekki framework CSS**: Zaakceptowano rekomendację użycia Tailwind CSS w celu przyspieszenia developmentu i zapewnienia spójności wizualnej.
5.  **Dedykowany kontener na powiadomienia**: Zaakceptowano rekomendację centralizacji wszystkich komunikatów w jednym, targetowanym przez HTMX kontenerze.
6.  **Globalna obsługa błędu 401**: Zaakceptowano rekomendację użycia `HX-Redirect` do obsługi wygaśnięcia sesji na poziomie globalnym.
7.  **Prosta paginacja**: Zaakceptowano rekomendację implementacji przycisku "Załaduj więcej" jako prostej i skutecznej metody paginacji dla MVP.
8.  **Połączenie widoku profilu i historii**: Zaakceptowano rekomendację połączenia tych dwóch sekcji w jeden spójny widok, aby uprościć nawigację.
</matched_recommendations>
<ui_architecture_planning_summary>
### Podsumowanie planowania architektury UI dla funnyMMS (MVP)

#### 1. Główne wymagania dotyczące architektury UI
Architektura interfejsu użytkownika dla `funnyMMS` będzie oparta na frameworku **HTMX**, co oznacza, że backend będzie odpowiedzialny za renderowanie i zwracanie fragmentów HTML. Interfejs ma być prosty, responsywny (RWD) i skupiony na kluczowych funkcjonalnościach MVP. Do stylizacji zostanie wykorzystany **Tailwind CSS**.

#### 2. Kluczowe widoki, ekrany i przepływy użytkownika
*   **Strony publiczne**:
    *   `/` (Landing Page): Dla niezalogowanych użytkowników, z opisem usługi, przykładem grafiki i przyciskami "Zaloguj" / "Zarejestruj".
    *   `/login`: Formularz logowania (login, hasło).
    *   `/register`: Formularz rejestracji (login, hasło, numer telefonu, zgody).
    *   `/verify-phone`: Strona do wpisania kodu weryfikacyjnego po rejestracji.
    *   `/verify-2fa`: Strona do wpisania kodu 2FA po podaniu poprawnych danych logowania.
*   **Strony prywatne (dla zalogowanych)**:
    *   `/app` (Generator): Główny widok z polem do wpisywania promptu. Przycisk "Generuj" będzie nieaktywny, jeśli limit dzienny jest wyczerpany.
    *   `/profile`: Połączony widok profilu i historii. Zawiera dane użytkownika (nazwa, zamaskowany numer) oraz siatkę z historią wygenerowanych MMS-ów.
*   **Przepływ logowania**: `/login` -> (sukces) -> `/verify-2fa` -> (sukces) -> `/app`.
*   **Przepływ rejestracji**: `/register` -> (sukces) -> `HX-Redirect` na `/verify-phone` -> (sukces) -> `/app`.

#### 3. Strategia integracji z API i zarządzania stanem
*   **Integracja z API**: Wszystkie interakcje z API będą realizowane za pomocą atrybutów HTMX (`hx-post`, `hx-get`, `hx-patch`). Backend (Supabase Edge Functions) będzie zwracał fragmenty HTML, a nie JSON.
*   **Zarządzanie stanem**: Stan aplikacji jest zarządzany głównie po stronie serwera. HTMX będzie odpowiedzialny za podmianę odpowiednich fragmentów DOM (`hx-target`, `hx-swap-oob`).
*   **Komunikaty**: Centralny kontener `<div id="notification-area">` będzie celem dla wszystkich odpowiedzi serwera zawierających komunikaty o statusie, błędach lub powodzeniu operacji.
*   **Asynchroniczność**: Długotrwała operacja generowania MMS będzie obsługiwana przez odpowiedź `202 Accepted` i automatyczne odświeżenie listy historii za pomocą nagłówka `HX-Trigger` z opóźnieniem.
*   **Wskaźniki ładowania**: Proste wskaźniki ładowania (`htmx-indicator`) będą używane do informowania użytkownika o trwających żądaniach sieciowych.

#### 4. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa
*   **Responsywność**: Tailwind CSS zostanie użyty do stworzenia w pełni responsywnego layoutu (RWD), który będzie poprawnie działał na urządzeniach mobilnych i desktopowych.
*   **Bezpieczeństwo**:
    *   Wszystkie żądania do prywatnych endpointów będą zabezpieczone tokenem JWT.
    *   Wygasła sesja (`401 Unauthorized`) będzie globalnie obsługiwana przez `HX-Redirect`, wymuszając ponowne zalogowanie.
    *   Przycisk wysyłania formularza będzie automatycznie blokowany na czas żądania, aby zapobiec wielokrotnym kliknięciom.
*   **Dostępność**: Na etapie MVP nacisk kładziony jest na semantyczny HTML i podstawowe zasady dostępności, które oferuje standardowe użycie formularzy i linków.

</ui_architecture_planning_summary>
<unresolved_issues>
*   **Szczegółowy projekt panelu administratora**: Zdecydowano o prostej, chronionej hasłem stronie, ale dokładny układ i sposób prezentacji danych w tabeli statystyk wymaga dalszego doprecyzowania.
*   **Dokładna treść komunikatów**: Chociaż zdefiniowano miejsca i typy komunikatów (błąd, sukces, ostrzeżenie), ich dokładna, przyjazna dla użytkownika treść powinna zostać spisana.
</unresolved_issues>
</conversation_summary>