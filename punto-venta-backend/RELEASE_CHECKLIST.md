# Release Checklist — punto-venta-backend

> Completar cada ítem en orden antes de declarar un release como **GO**.
> Marcar con `[x]` cuando pase, `[!]` si falla (documentar motivo).

---

## 1. Pre-requisitos

| Requisito | Versión mínima | Verificar |
|-----------|---------------|-----------|
| Node.js   | 20 LTS        | `node -v` |
| npm       | 10+           | `npm -v`  |
| PostgreSQL | 14+          | `psql --version` |
| Playwright Chromium | instalado | ver §3 |

```bat
node -v
npm -v
psql --version
```

---

## 2. Setup desde cero

```bat
REM 1. Clonar / actualizar repo
git clone <repo-url> punto-venta-backend
cd punto-venta-backend

REM 2. Instalar dependencias
npm install

REM 3. Instalar binario de Chromium (solo primera vez o en CI)
npx playwright install chromium

REM 4. Configurar variables de entorno
copy .env.example .env
REM Editar .env: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, PORT, NODE_ENV, CORS_ORIGINS

REM 5. Crear base de datos (si no existe)
psql -U postgres -c "CREATE DATABASE punto_venta;"

REM 6. Ejecutar migraciones
npm run migrate:latest

REM 7. Ejecutar seeds
npm run seed:run

REM 8. Arrancar servidor
npm run dev
```

---

## 3. Verificación de Chromium (PDF)

```bat
REM Comprobar que el ejecutable existe
npx playwright install --dry-run chromium
```

Si el server arranca sin errores y `/health/db` responde `{"ok":true}`, la instalación base es correcta.

---

## 4. Verificación de base de datos

```bat
REM Migraciones aplicadas
npm run knex -- migrate:status

REM Seeds idempotentes (puede ejecutarse N veces)
npm run seed:run
npm run seed:run
```

Tablas esperadas (en este orden):
`business`, `role`, `permission`, `role_permission`, `user`,
`business_settings`, `payment_method`, `product`, `product_barcode`,
`sale_ticket`, `sale_ticket_item`, `sale_payment`,
`inventory_movement`, `audit_log`

---

## 5. Health checks

```bat
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/health/db
curl http://127.0.0.1:3000/health/version
```

Respuestas esperadas:
- `/health`         → `{"ok":true}`
- `/health/db`      → `{"ok":true}`
- `/health/version` → `{"name":"punto-venta-backend","version":"1.0.0","node":"v20.x.x","env":"development","uptime_seconds":<n>,"commit":null}`

---


## 5.1 Verificación de CORS whitelist

```bat
REM Origin permitido (ajusta al valor configurado en CORS_ORIGINS)
curl -i -X OPTIONS http://127.0.0.1:3000/health ^
  -H "Origin: http://localhost:5173" ^
  -H "Access-Control-Request-Method: GET"

REM Origin no permitido (debe no incluir Access-Control-Allow-Origin)
curl -i -X OPTIONS http://127.0.0.1:3000/health ^
  -H "Origin: https://evil.example" ^
  -H "Access-Control-Request-Method: GET"
```

Esperado:
- Origin permitido: `204` con `access-control-allow-origin`.
- Origin no permitido: respuesta bloqueada/no CORS (sin `access-control-allow-origin`).
- Sin `Origin` (Postman/curl): permitido.

## 6. Flujo Postman recomendado

Importar colección y environment desde `/postman/`.

**Orden de requests:**

1. `POST /auth/login` (admin) → guarda `{{token}}`
2. `GET /health/version` — sin token, confirma build info
3. `GET /settings` — verifica config de negocio
4. `PATCH /settings` — prueba actualización (paper width, folio prefix)
5. `POST /products` — crea producto de prueba
6. `GET /products` — lista productos
7. `POST /barcodes` — asocia código de barras
8. `GET /barcodes/lookup?code=<ean>` — busca por barcode
9. `POST /inventory` — movimiento ENTRADA
10. `GET /inventory` — lista movimientos
11. `POST /tickets` — abre ticket (BORRADOR)
12. `POST /tickets/:id/items` — agrega producto
13. `POST /tickets/:id/close` — cierra ticket (CERRADO)
14. `GET /tickets` — lista tickets
15. `GET /tickets/:id` — detalle ticket
16. `GET /tickets/:id/print/html` — vista HTML (abrir en browser)
17. `GET /tickets/:id/print/pdf` — descarga PDF
18. `GET /reports/sales` — reporte de ventas
19. `GET /audit` — log de auditoría (solo ADMIN)

---

## 7. Checks de permisos

### ADMIN
```bat
REM Login admin
curl -s -X POST http://127.0.0.1:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" -o login.json

for /f "delims=" %T in ('node -e "process.stdout.write(require('./login.json').access_token)"') do set ADMIN=%T

REM Debe responder 200
curl -s http://127.0.0.1:3000/audit -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/settings -H "Authorization: Bearer %ADMIN%"
curl -s http://127.0.0.1:3000/reports/sales -H "Authorization: Bearer %ADMIN%"
```

### CAJERO
```bat
curl -s -X POST http://127.0.0.1:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"cajero\",\"password\":\"cajero123\"}" -o cajero.json

for /f "delims=" %T in ('node -e "process.stdout.write(require('./cajero.json').access_token)"') do set CAJERO=%T

REM Debe responder 403 FORBIDDEN en:
curl -s http://127.0.0.1:3000/audit      -H "Authorization: Bearer %CAJERO%"
curl -s http://127.0.0.1:3000/settings   -H "Authorization: Bearer %CAJERO%"

REM Debe responder 200 en:
curl -s http://127.0.0.1:3000/tickets    -H "Authorization: Bearer %CAJERO%"
curl -s http://127.0.0.1:3000/products   -H "Authorization: Bearer %CAJERO%"
```

### INVENTARIO
```bat
REM Debe responder 403 en /tickets (no tiene SALE_VIEW)
REM Debe responder 200 en /inventory, /products
```

---

## 8. Checks de impresión

```bat
REM Sustituir <ID> por un ticket_id con estatus=CERRADO

REM HTML — debe abrir HTML completo en browser
curl -s http://127.0.0.1:3000/tickets/<ID>/print/html ^
  -H "Authorization: Bearer %ADMIN%" -o ticket.html
start ticket.html

REM PDF — debe generar PDF descargable
curl -s http://127.0.0.1:3000/tickets/<ID>/print/pdf ^
  -H "Authorization: Bearer %ADMIN%" -o ticket.pdf
start ticket.pdf
```

Verificar visualmente:
- [ ] Logo/encabezado del negocio presente
- [ ] Folio con prefijo y padding correctos
- [ ] Líneas de productos (nombre, qty, precio, subtotal)
- [ ] Totales (subtotal, impuestos si aplica, TOTAL en negrita)
- [ ] Métodos de pago y cambio
- [ ] Pie de página presente
- [ ] Ancho de papel correcto (58mm o 80mm según setting)
- [ ] Ticket BORRADOR muestra marca de agua "BORRADOR"

---

## 9. Troubleshooting

### Puerto ya en uso
```
Error: listen EADDRINUSE :::3000
```
```bat
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Nodemon reinicia en bucle
- Verificar que `nodemon.json` existe en la raíz.
- Confirmar que `"watch": ["src"]` está presente.
- Archivos como `login.json`, `ticket.pdf` deben estar en la lista `ignore`.

### Chromium no encontrado (PDF falla con 500 PDF_RENDER_FAILED)
```bat
npx playwright install chromium
```
En CI, agregar al pipeline antes de arrancar el servidor.

### 401 Unauthorized
- Token expirado → hacer nuevo login.
- Header mal formado → debe ser exactamente `Authorization: Bearer <token>`.

### 403 FORBIDDEN
- Confirmar que el rol del usuario tiene el permiso requerido.
- Re-ejecutar `npm run seed:run` si se agregaron permisos nuevos recientemente.

### Rate limit (429)
- El rate limiter aplica por IP. En pruebas locales esperar 1 minuto o reiniciar el servidor.

### Seeds fallan con "duplicate key"
- Los seeds son idempotentes (`onConflict().ignore()`). Si falla, revisar si hay datos corruptos manualmente.

---

## 10. Lista GO / NO-GO

### Infraestructura
- [ ] Node.js >= 20 instalado
- [ ] PostgreSQL accesible y credenciales válidas en `.env`
- [ ] `npm install` sin errores
- [ ] Chromium instalado (`npx playwright install chromium`)

### Base de datos
- [ ] `npm run migrate:latest` — sin errores, todas las migraciones aplicadas
- [ ] `npm run seed:run` — sin errores
- [ ] `GET /health/db` → `{"ok":true}`

### Servidor
- [ ] `npm run dev` arranca sin errores
- [ ] `GET /health` → `{"ok":true}`
- [ ] `GET /health/version` → JSON con version, node, env

### Auth y permisos
- [ ] Login ADMIN → token válido
- [ ] Login CAJERO → 403 en `/audit`
- [ ] Sin token → 401 en rutas protegidas

### Funcionalidad crítica
- [ ] Crear ticket → agregar items → cerrar ticket (flujo completo)
- [ ] `GET /tickets/:id/print/html` → HTML renderizado
- [ ] `GET /tickets/:id/print/pdf` → PDF descargable (requiere Chromium)
- [ ] `GET /reports/sales` → datos de ventas
- [ ] `GET /audit` → log de eventos (solo ADMIN)
- [ ] `PATCH /settings` → actualización persistida

### Regresión
- [ ] Nodemon NO reinicia al crear `login.json` o `ticket.pdf`
- [ ] Rate limiter responde 429 tras múltiples peticiones rápidas
- [ ] Rutas no existentes → 404

---

**Decisión:** `[ ] GO` — `[ ] NO-GO`

Firmado por: _________________ Fecha: _________________
