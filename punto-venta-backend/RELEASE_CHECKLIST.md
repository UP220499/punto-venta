# Release Checklist — Punto de Venta Backend

Lista de verificacion pre-release. Ejecutar en orden antes de cada despliegue a produccion.

---

## 1. Pre-requisitos

- [ ] PostgreSQL corriendo y accesible
- [ ] Archivo `.env` configurado con valores de produccion
  - `NODE_ENV=production`
  - `DATABASE_URL` apuntando a la BD de produccion
  - `JWT_SECRET` con valor seguro (>= 32 chars)
  - `CORS_ORIGINS` con los origenes del frontend
- [ ] Node.js >= 18.x instalado
- [ ] Chromium instalado para PDF: `npx playwright install chromium`

---

## 2. Base de Datos

```bash
# Aplicar todas las migraciones pendientes
npm run migrate:latest

# Poblar datos de referencia (permisos, roles, metodos de pago)
npm run seed:run
```

- [ ] `npm run migrate:latest` termina sin errores
- [ ] `npm run seed:run` termina sin errores

---

## 3. Arranque del Servidor

```bash
npm start
```

- [ ] `GET /health` responde `{"ok":true}`
- [ ] `GET /health/db` responde `{"ok":true,"db":"connected"}`
- [ ] `GET /health/version` responde con version, node y env

---

## 4. Smoke Tests

### ADMIN

```bat
REM 1. Login ADMIN
curl -s -X POST http://127.0.0.1:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" -o login.json

for /f "delims=" %T in ('node -e "process.stdout.write(require('./login.json').access_token)"') do set ADMIN=%T

REM Debe responder 200
curl -s http://127.0.0.1:3000/audit          -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/settings       -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/reports/sales/summary -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/users          -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/roles          -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/roles/permissions -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/payment-methods -H "Authorization: Bearer %ADMIN%"
```

### CAJERO

```bat
REM 2. Login CAJERO
curl -s -X POST http://127.0.0.1:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"cajero\",\"password\":\"cajero123\"}" -o cajero.json

for /f "delims=" %T in ('node -e "process.stdout.write(require('./cajero.json').access_token)"') do set CAJERO=%T

REM Debe responder 403 FORBIDDEN en:
curl -s http://127.0.0.1:3000/audit          -H "Authorization: Bearer %CAJERO%"
curl -s http://127.0.0.1:3000/settings       -H "Authorization: Bearer %CAJERO%"
curl -s http://127.0.0.1:3000/users          -H "Authorization: Bearer %CAJERO%"
curl -s http://127.0.0.1:3000/roles          -H "Authorization: Bearer %CAJERO%"

REM Debe responder 200 en:
curl -s http://127.0.0.1:3000/payment-methods -H "Authorization: Bearer %CAJERO%"
curl -s http://127.0.0.1:3000/products        -H "Authorization: Bearer %CAJERO%"
```

---

## 5. Verificacion de Modulos

### Auth y permisos

- [ ] Login ADMIN → `access_token` valido
- [ ] Login CAJERO → 403 en `/audit`, `/users`, `/roles`
- [ ] Sin token → 401 en rutas protegidas
- [ ] `GET /auth/me` → devuelve `user_id`, `username`, `roles`, `permissions`

### Products y Barcodes

- [ ] `GET /products` → lista paginada con `data` y `meta`
- [ ] `POST /products` → 201 con `product_id`
- [ ] `PATCH /products/:product_id` → 200 con datos actualizados

### Tickets (Ventas)

- [ ] `POST /tickets` → 201, estatus `BORRADOR`, guarda `ticket_id`
- [ ] `POST /tickets/:ticket_id/close` → 200, estatus `CERRADO`
- [ ] `GET /tickets?estatus=BORRADOR` → lista filtrada correctamente
- [ ] `GET /tickets?estatus=CERRADO` → lista filtrada correctamente
- [ ] `GET /tickets/:ticket_id` → detalle con `items` y `payments`
- [ ] `GET /tickets/:ticket_id/print/html` → Content-Type `text/html`
- [ ] `GET /tickets/:ticket_id/print/pdf` → Content-Type `application/pdf`

### Inventory

- [ ] `POST /inventory/entries` → 201 con `movements`
- [ ] `POST /inventory/adjustments` → 201 con `movements`
- [ ] `GET /inventory/movements` → lista paginada
- [ ] `GET /inventory/products/low-stock` → lista de productos

### Reports

- [ ] `GET /reports/sales/summary?from=...&to=...` → `total_ventas`, `total_tickets`
- [ ] `GET /reports/sales/by-day?from=...&to=...` → `data` array
- [ ] `GET /reports/top-products?from=...&to=...` → `data` array
- [ ] `GET /reports/inventory/summary?from=...&to=...` → objeto de resumen

### Settings

- [ ] `GET /settings` → campos de configuracion del negocio
- [ ] `PATCH /settings` → 200 con configuracion actualizada

### Audit

- [ ] `GET /audit` → lista paginada con `data` y `meta`
- [ ] CAJERO → 403 en `/audit`

### Users (Admin)

- [ ] `GET /users` → lista de usuarios del negocio
- [ ] `GET /users/:user_id` → detalle de usuario
- [ ] `POST /users` → 201 con `user_id`
- [ ] `PATCH /users/:user_id` → 200 con datos actualizados
- [ ] `POST /users/:user_id/reset-password` → 204
- [ ] `PUT /users/:user_id/roles` → 200 con roles actualizados
- [ ] CAJERO → 403 en todos los endpoints de `/users`

### Roles (Admin)

- [ ] `GET /roles` → lista de roles con permisos
- [ ] `GET /roles/permissions` → lista de todos los permisos disponibles
- [ ] `GET /roles/:role_id` → detalle del rol con sus permisos
- [ ] `PUT /roles/:role_id/permissions` → 200, permisos reemplazados
- [ ] `PUT /roles/1/permissions` donde rol es ADMIN → 409 `CANNOT_MODIFY_ADMIN_ROLE`
- [ ] CAJERO → 403 en todos los endpoints de `/roles`

### Payment Methods (Admin)

- [ ] `GET /payment-methods` → lista con `payment_method_id`, `code`, `estatus`
- [ ] `POST /payment-methods` → 201 con `payment_method_id`
- [ ] `PATCH /payment-methods/:payment_method_id` → 200 con datos actualizados
- [ ] `DELETE /payment-methods/:payment_method_id` → 204 (soft-delete, estatus INACTIVO)
- [ ] `DELETE` sobre metodo `EFECTIVO` → 409 `CANNOT_DISABLE_CASH`
- [ ] CAJERO → 200 en `GET /payment-methods`, 403 en POST/PATCH/DELETE

---

## 6. Orden de Requests en Postman

1. `POST /auth/login` (admin) → guarda `{{token}}`
2. `GET /health/version` — sin token, confirma build info
3. `GET /settings` — verifica config de negocio
4. `POST /products` — crea producto de prueba
5. `POST /tickets` — crea ticket → guarda `{{ticket_id}}`
6. `POST /tickets/{{ticket_id}}/close` — cierra ticket con pago EFECTIVO
7. `GET /tickets/{{ticket_id}}` — verifica ticket CERRADO con payments
8. `GET /reports/sales/summary` — verifica que la venta aparezca
9. `GET /users` — lista usuarios (ADMIN only)
10. `GET /roles` — lista roles con permisos (ADMIN only)
11. `GET /payment-methods` — lista metodos de pago

---

## 7. Solucion de Problemas

### Token expirado
- Hacer nuevo `POST /auth/login`.
- Verificar que `access_token` se guarde en la variable `token`.

### 401 Unauthorized
- Header mal formado → debe ser exactamente `Authorization: Bearer <token>`.

### 403 FORBIDDEN
- Confirmar que el rol del usuario tiene el permiso requerido en la BD.

### 409 CANNOT_MODIFY_ADMIN_ROLE
- No se pueden cambiar los permisos del rol ADMIN via API.

### 409 CANNOT_DISABLE_CASH
- El metodo de pago EFECTIVO no puede desactivarse.

### Migraciones fallan
- Verificar permisos del usuario PostgreSQL (CREATE TABLE).
- Usar `npm run migrate:rollback` para revertir y corregir.