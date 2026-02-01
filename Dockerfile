# Etap 1: Budowanie aplikacji
FROM node:20-alpine AS builder

# Ustawienie katalogu roboczego w kontenerze
WORKDIR /app

# Kopiowanie plików package.json i package-lock.json
COPY package*.json ./

# Instalacja wszystkich zależności, w tym deweloperskich
RUN npm install

# Kopiowanie reszty plików projektu
COPY . .

# Uruchomienie skryptu budującego aplikację Astro
RUN npm run build

# Etap 2: Tworzenie lekkiego obrazu produkcyjnego
FROM node:20-alpine

WORKDIR /app

# Kopiowanie tylko niezbędnych plików z etapu 'builder'
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Ustawienie zmiennej środowiskowej dla Node.js
ENV NODE_ENV=production

# Uruchomienie serwera produkcyjnego Astro
CMD ["npm", "run", "preview"]