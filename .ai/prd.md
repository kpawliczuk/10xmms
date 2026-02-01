# Dokument wymagań produktu (PRD) - funnyMMS

## 1. Przegląd produktu
funnyMMS to aplikacja webowa, która umożliwia użytkownikom generowanie unikalnych, humorystycznych grafik za pomocą sztucznej inteligencji i natychmiastowe wysyłanie ich jako wiadomości MMS na własny, zweryfikowany numer telefonu. Aplikacja oferuje prosty system kont użytkowników, historię wysłanych wiadomości oraz dzienne limity użycia. Celem produktu jest dostarczenie prostego i szybkiego narzędzia do tworzenia zabawnych treści graficznych na podstawie krótkich opisów tekstowych w języku polskim.

## 2. Problem użytkownika
Wymyślanie i tworzenie śmiesznych obrazków lub memów jest trudne i czasochłonne. Użytkownicy często mają pomysł, ale brakuje im umiejętności graficznych lub dostępu do odpowiednich narzędzi, aby szybko przekształcić go w gotowy do wysłania obraz. funnyMMS rozwiązuje ten problem, automatyzując proces tworzenia grafiki na podstawie tekstu i integrując go z funkcją wysyłki MMS.

## 3. Wymagania funkcjonalne
### 3.1. Uwierzytelnianie i autoryzacja
- FU-001: Użytkownicy mogą założyć konto, podając login, hasło i numer telefonu.
- FU-002: Rejestracja wymaga akceptacji regulaminu i polityki prywatności poprzez zaznaczenie checkboxa.
- FU-003: Po rejestracji użytkownik musi zweryfikować swój numer telefonu za pomocą jednorazowego kodu wysłanego SMS-em.
- FU-004: Logowanie do systemu odbywa się za pomocą loginu i hasła.
- FU-005: Każde logowanie wymaga dodatkowego uwierzytelnienia za pomocą tokena wysyłanego SMS-em (2FA).

### 3.2. Generowanie i wysyłka MMS
- FU-006: Zalogowany użytkownik ma dostęp do pola tekstowego, w którym może wpisać prompt (opis grafiki) w języku polskim.
- FU-007: Prompt jest ograniczony do 300 znaków.
- FU-008: System wykorzystuje API Gemini (darmowa wersja) do generowania grafiki.
- FU-009: Wygenerowany obraz ma format JPEG, rozdzielczość 640x480 px i rozmiar nieprzekraczający 300 KB.
- FU-010: Po wygenerowaniu grafika jest automatycznie wysyłana jako MMS na zweryfikowany numer telefonu użytkownika za pośrednictwem bramki smsapi.pl.
- FU-011: Interfejs informuje użytkownika o postępie, wyświetlając osobne komunikaty: "Generowanie grafiki..." i "Wysyłanie MMS...".

### 3.3. Limity
- FU-012: Każdy użytkownik ma dzienny limit 5 MMS.
- FU-013: Aplikacja posiada globalny limit 20 MMS na dobę dla wszystkich użytkowników (w ramach MVP).
- FU-014: Limity resetują się automatycznie codziennie o godzinie 00:00 UTC.

### 3.4. Profil użytkownika i historia
- FU-015: Użytkownik ma dostęp do strony swojego profilu.
- FU-016: Na stronie profilu wyświetlana jest nazwa użytkownika i częściowo zamaskowany numer telefonu.
- FU-017: Strona profilu zawiera historię wysłanych MMS, która zawiera: miniaturę grafiki, datę i godzinę wysyłki, użyty prompt oraz informację o modelu AI.

### 3.5. Interfejs i platforma
- FU-018: Produkt jest responsywną aplikacją webową (RWD), działającą w przeglądarkach internetowych.
- FU-019: Dla niezalogowanych użytkowników dostępna jest prosta strona docelowa (landing page) zachęcająca do rejestracji.
- FU-020: Aplikacja zawiera podstrony z treścią regulaminu i polityki prywatności (treść tymczasowa, placeholder).

### 3.6. Administracja i monitoring
- FU-021: Stworzony zostanie prosty panel administratora.
- FU-022: Panel administratora będzie zawierał tabelę ze statystykami udanych i nieudanych wysyłek w ujęciu dziennym.

## 4. Granice produktu
Następujące funkcjonalności nie wchodzą w zakres MVP:
- Współdzielenie historii MMS między kontami.
- Możliwość zapisywania MMS w wersji roboczej.
- Zaawansowane statystyki i analityka po stronie użytkownika.

## 5. Historyjki użytkowników

---
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w serwisie, podając login, hasło i numer telefonu, abym mógł korzystać z funkcji generowania MMS.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola: login, hasło (z potwierdzeniem), numer telefonu.
  2. Formularz zawiera checkbox do akceptacji regulaminu i polityki prywatności, który jest wymagany.
  3. Po pomyślnym przesłaniu formularza, konto użytkownika jest tworzone w systemie ze statusem "niezweryfikowany".
  4. Użytkownik jest przekierowywany na stronę weryfikacji numeru telefonu.

---
- ID: US-002
- Tytuł: Weryfikacja numeru telefonu
- Opis: Jako nowy użytkownik po rejestracji, chcę zweryfikować swój numer telefonu za pomocą kodu SMS, aby aktywować konto.
- Kryteria akceptacji:
  1. Po rejestracji na podany numer telefonu automatycznie wysyłany jest SMS z kodem weryfikacyjnym.
  2. Użytkownik widzi ekran z polem do wpisania otrzymanego kodu.
  3. Wprowadzenie poprawnego kodu zmienia status użytkownika na "zweryfikowany" i loguje go do aplikacji.
  4. Wprowadzenie błędnego kodu wyświetla stosowny komunikat.

---
- ID: US-003
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji za pomocą loginu i hasła oraz tokena SMS, aby uzyskać dostęp do swojego konta.
- Kryteria akceptacji:
  1. Strona logowania zawiera pola na login i hasło.
  2. Po podaniu poprawnych danych, na numer telefonu użytkownika wysyłany jest SMS z tokenem.
  3. Użytkownik jest proszony o wpisanie tokena.
  4. Wpisanie poprawnego tokena daje dostęp do aplikacji.
  5. Podanie błędnych danych logowania lub tokena skutkuje wyświetleniem komunikatu o błędzie.

---
- ID: US-004
- Tytuł: Generowanie i wysyłanie MMS
- Opis: Jako zalogowany użytkownik, chcę wpisać tekst, wygenerować na jego podstawie grafikę i wysłać ją jako MMS na mój telefon.
- Kryteria akceptacji:
  1. Na stronie głównej widoczne jest pole tekstowe na prompt o maksymalnej długości 300 znaków.
  2. Po wpisaniu tekstu i kliknięciu przycisku "Generuj i wyślij", rozpoczyna się proces.
  3. Użytkownik widzi komunikat "Generowanie grafiki...".
  4. Po pomyślnym wygenerowaniu, użytkownik widzi komunikat "Wysyłanie MMS...".
  5. Po pomyślnej wysyłce, użytkownik otrzymuje MMS na swój zweryfikowany numer telefonu.
  6. Udana operacja jest zapisywana w historii użytkownika i zmniejsza jego dzienny limit o 1.

---
- ID: US-005
- Tytuł: Przeglądanie historii MMS
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość przeglądania historii wysłanych przeze mnie MMS-ów, aby wrócić do moich poprzednich kreacji.
- Kryteria akceptacji:
  1. W menu nawigacyjnym znajduje się link do "Profilu" lub "Historii".
  2. Na stronie profilu/historii wyświetlana jest lista wysłanych MMS.
  3. Każdy element listy zawiera miniaturę grafiki, datę wysyłki oraz tekst użytego promptu.
  4. Lista jest posortowana od najnowszej do najstarszej.

---
- ID: US-006
- Tytuł: Osiągnięcie dziennego limitu MMS
- Opis: Jako użytkownik, który wykorzystał swój dzienny limit 5 MMS, chcę być poinformowany o tym fakcie i uniemożliwić dalsze generowanie.
- Kryteria akceptacji:
  1. Po wysłaniu 5 MMS-ów w ciągu dnia, przycisk "Generuj i wyślij" staje się nieaktywny.
  2. Obok przycisku lub pola tekstowego wyświetlany jest komunikat informujący o osiągnięciu limitu i czasie jego zresetowania.
  3. Pole do wpisywania promptu pozostaje aktywne.

---
- ID: US-007
- Tytuł: Obsługa pustego lub zbyt długiego promptu
- Opis: Jako użytkownik, próbując wygenerować MMS, chcę otrzymać informację o błędzie, jeśli nie wpiszę żadnego tekstu lub tekst będzie za długi.
- Kryteria akceptacji:
  1. Kliknięcie przycisku "Generuj i wyślij" przy pustym polu tekstowym wyświetla błąd walidacji "Prompt nie może być pusty".
  2. Wpisanie więcej niż 300 znaków w pole tekstowe uniemożliwia dalsze pisanie lub wyświetla błąd walidacji "Prompt jest za długi (maks. 300 znaków)".
  3. W obu przypadkach proces generowania nie jest uruchamiany.

---
- ID: US-008
- Tytuł: Obsługa błędu generowania grafiki
- Opis: Jako użytkownik, chcę zostać poinformowany, gdy proces generowania grafiki przez AI nie powiedzie się.
- Kryteria akceptacji:
  1. Jeśli API Gemini zwróci błąd, proces zostaje przerwany.
  2. Użytkownikowi wyświetlany jest komunikat "Błąd podczas generowania grafiki. Spróbuj ponownie z innym opisem."
  3. Próba nie jest odliczana od dziennego limitu użytkownika.

---
- ID: US-009
- Tytuł: Obsługa błędu wysyłki MMS
- Opis: Jako użytkownik, chcę zostać poinformowany, gdy grafika została wygenerowana, ale wysyłka MMS nie powiodła się.
- Kryteria akceptacji:
  1. Jeśli bramka smsapi.pl zwróci błąd, proces zostaje przerwany.
  2. Użytkownikowi wyświetlany jest komunikat "Błąd wysyłki, proszę spróbować później".
  3. Nieudana próba wysyłki nie jest wliczana do dziennego limitu użytkownika.

---
- ID: US-010
- Tytuł: Widok dla niezalogowanego użytkownika (Landing Page)
- Opis: Jako osoba odwiedzająca stronę po raz pierwszy, chcę zobaczyć stronę główną, która wyjaśnia, do czego służy aplikacja i zachęca do rejestracji.
- Kryteria akceptacji:
  1. Strona główna dla niezalogowanych zawiera krótki opis usługi.
  2. Na stronie widoczne są przyciski "Zaloguj się" i "Zarejestruj się".
  3. Strona jest responsywna i poprawnie wyświetla się na urządzeniach mobilnych i desktopowych.

---
- ID: US-011
- Tytuł: Resetowanie dziennego limitu
- Opis: Jako użytkownik, chcę, aby mój dzienny limit MMS był automatycznie resetowany każdego dnia.
- Kryteria akceptacji:
  1. System codziennie o 00:00 UTC resetuje liczniki MMS dla wszystkich użytkowników do wartości 5.
  2. Użytkownik, który osiągnął limit poprzedniego dnia, może ponownie generować MMS-y po czasie resetu.

---
- ID: US-012
- Tytuł: Dostęp do statystyk w panelu administratora
- Opis: Jako administrator, chcę mieć dostęp do panelu, w którym mogę monitorować podstawowe wskaźniki użycia aplikacji.
- Kryteria akceptacji:
  1. Istnieje zabezpieczona hasłem strona (panel administratora).
  2. W panelu znajduje się tabela pokazująca dzienne statystyki.
  3. Tabela zawiera co najmniej kolumny: data, liczba udanych wysyłek, liczba nieudanych wysyłek (z podziałem na błędy generacji i wysyłki).

## 6. Metryki sukcesu
### 6.1. Kryteria sukcesu MVP
- Cel 1: 90% prób wysłania MMS przez użytkowników (którzy nie osiągnęli limitu) kończy się sukcesem.
  - Sposób pomiaru: Monitorowanie stosunku udanych wysyłek do wszystkich prób w panelu administratora. Metryka ta mierzy stabilność i wydajność techniczną platformy.
- Cel 2: 75% aktywnych użytkowników wysyła 2 lub więcej MMS-ów dziennie.
  - Sposób pomiaru: Analiza danych z bazy danych lub panelu administratora w celu określenia wzorców zaangażowania użytkowników. Metryka ta mierzy, czy produkt jest wartościowy i angażujący dla użytkowników.