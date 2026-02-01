import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import RegisterForm from "./RegisterForm.astro";

// Po każdym teście czyścimy DOM, aby uniknąć interferencji
afterEach(() => {
  cleanup();
});

describe("RegisterForm.astro", () => {
  it("powinien poprawnie renderować wszystkie pola formularza", async () => {
    // @ts-ignore - Astro Component
    render(await RegisterForm.render());

    // Sprawdzenie, czy wszystkie pola istnieją
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasło")).toBeInTheDocument();
    expect(screen.getByLabelText("Potwierdź hasło")).toBeInTheDocument();
    expect(screen.getByLabelText("Numer telefonu")).toBeInTheDocument();
    expect(screen.getByLabelText(/Akceptuję/)).toBeInTheDocument();

    // Sprawdzenie przycisku i linku
    expect(screen.getByRole("button", { name: "Zarejestruj się" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zaloguj się" })).toBeInTheDocument();
  });

  it("powinien mieć poprawne atrybuty walidacji HTML5", async () => {
    // @ts-ignore - Astro Component
    render(await RegisterForm.render());

    const emailInput = screen.getByLabelText("E-mail");
    const passwordInput = screen.getByLabelText("Hasło");
    const phoneInput = screen.getByLabelText("Numer telefonu");
    const termsCheckbox = screen.getByLabelText(/Akceptuję/);

    // Weryfikacja atrybutu 'required'
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(phoneInput).toBeRequired();
    expect(termsCheckbox).toBeRequired();

    // Weryfikacja specyficznych atrybutów
    expect(passwordInput).toHaveAttribute("minlength", "8");
    expect(phoneInput).toHaveAttribute(
      "pattern",
      "(\\+?[0-9\\s\\-]{9,15})",
    );
  });

  it("powinien mieć poprawne atrybuty HTMX na formularzu", async () => {
    // @ts-ignore - Astro Component
    render(await RegisterForm.render());

    const form = screen.getByRole("form");

    expect(form).toHaveAttribute("hx-post", "/functions/v1/register");
    expect(form).toHaveAttribute("hx-target", "#notification-area");
    expect(form).toHaveAttribute("hx-swap", "innerHTML");
  });

  describe("Walidacja potwierdzenia hasła (JavaScript)", () => {
    it("nie powinien ustawiać błędu, gdy hasła są zgodne", async () => {
      // @ts-ignore - Astro Component
      render(await RegisterForm.render());

      const passwordInput = screen.getByLabelText<HTMLInputElement>("Hasło");
      const passwordConfirmInput = screen.getByLabelText<HTMLInputElement>(
        "Potwierdź hasło",
      );

      await fireEvent.input(passwordInput, { target: { value: "password123" } });
      await fireEvent.input(passwordConfirmInput, {
        target: { value: "password123" },
      });

      // Sprawdzamy, czy pole jest "ważne" (valid)
      expect(passwordConfirmInput.validity.valid).toBe(true);
      expect(passwordConfirmInput.validationMessage).toBe("");
    });

    it("powinien ustawić błąd, gdy hasła nie są zgodne", async () => {
      // @ts-ignore - Astro Component
      render(await RegisterForm.render());

      const passwordInput = screen.getByLabelText<HTMLInputElement>("Hasło");
      const passwordConfirmInput = screen.getByLabelText<HTMLInputElement>(
        "Potwierdź hasło",
      );

      await fireEvent.input(passwordInput, { target: { value: "password123" } });
      await fireEvent.input(passwordConfirmInput, {
        target: { value: "password456" },
      });

      // Sprawdzamy, czy pole jest "nieważne" (invalid) i ma odpowiedni komunikat
      expect(passwordConfirmInput.validity.valid).toBe(false);
      expect(passwordConfirmInput.validationMessage).toBe("Hasła nie są zgodne.");
    });

    it("powinien usunąć błąd, gdy hasła zostaną poprawione", async () => {
      // @ts-ignore - Astro Component
      render(await RegisterForm.render());

      const passwordInput = screen.getByLabelText<HTMLInputElement>("Hasło");
      const passwordConfirmInput = screen.getByLabelText<HTMLInputElement>(
        "Potwierdź hasło",
      );

      // Krok 1: Wprowadź niezgodne hasła
      await fireEvent.input(passwordInput, { target: { value: "password123" } });
      await fireEvent.input(passwordConfirmInput, {
        target: { value: "password456" },
      });
      expect(passwordConfirmInput.validity.valid).toBe(false);

      // Krok 2: Popraw hasło
      await fireEvent.input(passwordConfirmInput, {
        target: { value: "password123" },
      });

      // Sprawdzamy, czy błąd zniknął
      expect(passwordConfirmInput.validity.valid).toBe(true);
      expect(passwordConfirmInput.validationMessage).toBe("");
    });
  });
});