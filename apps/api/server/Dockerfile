FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# postgresql-client aporta pg_dump/pg_restore/psql — necesarios para el
# backup y restauración completos de la base de datos (sección Backups de
# Configuración). La imagen base node:20-alpine no los trae de serie.
RUN apk add --no-cache postgresql-client
COPY --from=builder /app/dist ./dist
COPY migrations/ ./migrations/
COPY package.json ./
RUN npm install --omit=dev
EXPOSE 3001
CMD ["node", "dist/index.js"]
