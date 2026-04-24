# ==========================================
# Етап 1: Build (Збірка коду)
# ==========================================
FROM node:20-alpine AS builder

# Встановлюємо робочу директорію всередині контейнера
WORKDIR /app

# Копіюємо файли залежностей
COPY package*.json ./

# Встановлюємо ВСІ залежності (включно з devDependencies, бо нам потрібен TypeScript для компіляції)
RUN npm ci

# Копіюємо конфіг TS та вихідний код
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]