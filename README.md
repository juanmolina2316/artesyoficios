# Punto de Venta Móvil (MVP)

Monorepo con backend (API), frontend (PWA) y base de datos (Postgres).

## Requisitos
- Node.js 18+
- Postgres 14+

## Configuración rápida

0) DB con Docker (opcional)

```
docker compose up -d
```

1) Base de datos

```
psql -d pos -f /Users/juanl/Desktop/artes-oficios-web/db/migrations/001_init.sql
psql -d pos -f /Users/juanl/Desktop/artes-oficios-web/db/seed/seed.sql
```

2) Backend

```
cd /Users/juanl/Desktop/artes-oficios-web/backend
cp .env.example .env
npm install
npm run dev
```

3) Frontend

```
cd /Users/juanl/Desktop/artes-oficios-web/frontend
cp .env.example .env
npm install
npm run dev
```

## Endpoints
Ver `openapi.yaml`.

## Notas
- El seed usa una contraseña placeholder (`REPLACE_WITH_BCRYPT`).
- Para producción, usar HTTPS y cookies seguras.
