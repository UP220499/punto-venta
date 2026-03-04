# Punto de Venta — Backend

API REST para sistema de Punto de Venta. Node.js + Fastify + PostgreSQL.

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14

## Instalación

```bash
npm install
cp .env.example .env   # editar con tus credenciales
```

## Comandos

| Script                | Descripción                        |
|-----------------------|------------------------------------|
| `npm run dev`         | Servidor con hot-reload (nodemon)  |
| `npm start`           | Servidor en producción             |
| `npm run migrate:latest`   | Ejecutar migraciones          |
| `npm run migrate:rollback` | Revertir última migración     |
| `npm run seed:run`         | Ejecutar seeds                |
| `npm run knex`             | CLI de Knex directo           |

## Endpoints disponibles

| Método | Ruta          | Auth | Descripción                 |
|--------|---------------|------|-----------------------------|
| GET    | /health       | No   | Liveness check              |
| GET    | /health/db    | No   | DB connectivity check       |
| POST   | /auth/login   | No   | Login stub → JWT            |
| GET    | /auth/me      | Sí   | Info del usuario autenticado|
