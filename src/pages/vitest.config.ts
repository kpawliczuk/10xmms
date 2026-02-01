/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    // Ustawienie środowiska testowego na jsdom, aby symulować przeglądarkę
    environment: "jsdom",
    // Globalne ustawienia, aby nie importować `describe`, `it`, `expect` w każdym pliku
    globals: true,
    // Plik do rozszerzenia funkcjonalności `expect` o matchery z vitest-dom
    setupFiles: "./vitest.setup.ts",
  },
});