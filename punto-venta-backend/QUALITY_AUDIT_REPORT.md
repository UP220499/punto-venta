# Quality Audit Report — Backend POS (Fastify + Knex + PostgreSQL)

Fecha: 2026-03-10

## 1) Resumen ejecutivo

- El backend está **bien encaminado** en estructura modular, uso de RBAC por permiso y estandarización base de errores `{ error: { code, message } }`.
- No está listo para tag final todavía: se detectaron **2 hallazgos P0** (bloqueantes) en cierre de ticket concurrente y robustez de impresión PDF.
- En autenticación hay anti-enumeración y expiración JWT correcta, pero falta hardening de configuración (secreto obligatorio) en arranque.
- El inventario usa transacciones y bloqueos (`FOR UPDATE`) en entradas/ajustes; eso está bien.
- Existe inconsistencia entre documentación y comportamiento real de validación/cors (P1).
- La colección Postman está mayormente alineada con login (`access_token`) y scripts.
- Recomendación: corregir primero P0, luego P1 de consistencia API/validaciones, y finalmente P2 de DX.

---

## 2) Tabla de hallazgos

| Severidad | Hallazgo | Archivo(s) | Impacto | Fix recomendado |
|---|---|---|---|---|
| P0 | **Race condition al cerrar ticket**: se valida `BORRADOR` y se cargan items **fuera** de la transacción; no se bloquea fila de `sale_ticket` con `FOR UPDATE`. | `src/modules/sales/tickets.service.js`, `src/modules/sales/tickets.repository.js` | Doble cierre concurrente del mismo ticket puede duplicar pagos/movimientos y descontar stock más de una vez. | Mover lectura/validación del ticket al bloque transaccional con lock (`SELECT ... FOR UPDATE`) y actualizar con condición de estado (`WHERE ticket_id=? AND estatus='BORRADOR'`), validando `rowCount` para detectar conflicto concurrente. |
| P0 | **Generación PDF sin timeout explícito ni cierre de page/context**. Solo se cierra browser en `finally`. | `src/modules/sales/ticket-pdf.service.js` | Bajo carga/fallo de Playwright puede haber sesiones colgadas, consumo de recursos y latencia elevada. | Agregar timeouts (`launch/newPage/setContent/pdf`), cerrar `page` y/o `context` explícitamente en `finally`, y mapear timeout a código estable (`PDF_TIMEOUT`). |
| P1 | **CORS no respeta la política documentada** (`origin: true` permite todos los orígenes), contradice README (`CORS_ORIGINS`). | `src/config/plugins.js`, `README.md` | Superficie de exposición mayor a la esperada y brecha entre operación y documentación. | Parsear `process.env.CORS_ORIGINS` y aplicar whitelist explícita (o función de validación de origen). Actualizar README según comportamiento final. |
| P1 | **Validación “estricta” no homogénea**: muchos esquemas Zod no usan `.strict()`. En Zod, keys desconocidas se eliminan por defecto en lugar de rechazarse. | `src/modules/sales/tickets.schemas.js`, `src/modules/products/products.schemas.js`, `src/modules/inventory/inventory.schemas.js`, `src/modules/reports/reports.schemas.js`, `src/modules/audit/audit.schemas.js`, `src/modules/users/users.schemas.js` | UX/API inconsistente y contradicción con estándar declarado (rechazo de campos desconocidos). | Definir política global: para bodies usar `.strict()`; para query params mantener parse/coerción explícita. Ajustar tests/colección si cambia comportamiento. |
| P1 | **Campo `referencia` no validado en close ticket** pero es usado por servicio. | `src/modules/sales/tickets.schemas.js`, `src/modules/sales/tickets.service.js` | El dato de referencia puede descartarse silenciosamente, afectando trazabilidad de pagos. | Incluir `referencia` (opcional, con límites) en `closeTicketSchema` para alinear contrato con persistencia. |
| P1 | **Error de arranque sin `JWT_SECRET` no manejado de forma operativa**. | `src/config/plugins.js` | Caída temprana de app (correcta para fail-fast), pero mensaje no está estandarizado para operación y despliegue. | Validar variables críticas al boot y emitir error de configuración explícito (`CONFIG_ERROR`) antes de registrar plugins. |
| P2 | **README reportes: formato fecha inconsistente** (declara ISO8601 con offset, schema exige `yyyy-mm-dd`). | `README.md`, `src/modules/reports/reports.schemas.js` | Confusión para integradores y mayor fricción en consumo de API. | Unificar contrato (o aceptar datetime completo en schema, o corregir README a fecha corta). |
| P2 | **Sin suite de tests automatizada** (`npm test` falla por placeholder). | `package.json` | Riesgo de regresiones y menor confianza en fixes críticos. | Definir smoke tests mínimos (auth, cierre ticket, inventario, permisos) y pipeline CI básico. |

---

## 3) Plan de fixes (orden recomendado)

### Fix 1 — P0 concurrencia cierre ticket
- **Branch sugerida:** `fix/p0-ticket-close-concurrency`
- **Commits sugeridos:**
  1. `fix(tickets): lock sale_ticket row and validate BORRADOR inside transaction`
  2. `fix(tickets): enforce conditional close update and concurrent conflict error`
  3. `test(tickets): cover concurrent close single-success scenario`

### Fix 2 — P0 robustez PDF
- **Branch sugerida:** `fix/p0-pdf-timeouts-lifecycle`
- **Commits sugeridos:**
  1. `fix(print): add explicit playwright timeouts and page/context cleanup`
  2. `fix(print): map timeout errors to stable PDF_TIMEOUT code`

### Fix 3 — P1 consistencia validación/API
- **Branch sugerida:** `fix/p1-validation-contract`
- **Commits sugeridos:**
  1. `fix(validation): enforce strict body schemas in modules`
  2. `fix(tickets): add referencia to close payload schema`
  3. `docs(api): align validation behavior and error examples`

### Fix 4 — P1 seguridad/configuración CORS + env
- **Branch sugerida:** `fix/p1-config-hardening`
- **Commits sugeridos:**
  1. `fix(config): enforce required env vars with startup validation`
  2. `fix(cors): restrict origins using CORS_ORIGINS whitelist`

### Fix 5 — P2 documentación y DX
- **Branch sugerida:** `chore/p2-docs-dx-cleanup`
- **Commits sugeridos:**
  1. `docs(reports): align date format docs with schema`
  2. `chore(test): replace placeholder npm test with smoke suite`

---

## 4) Checklist de verificación post-fix

### Infra / arranque
- `npm run migrate:latest`
- `npm run seed:run`
- `npm run dev`

### Auth / RBAC
- `POST /auth/login` con credenciales válidas -> 200 + `access_token`
- `POST /auth/login` inválido -> 401 uniforme
- `GET /auth/me` sin token -> 401
- Endpoint protegido con token sin permiso -> 403

### Tickets / inventario
- `POST /tickets` -> 201
- `POST /tickets/:ticket_id/close` con pagos insuficientes -> 400 `PAYMENT_INSUFFICIENT`
- Cierre concurrente doble del mismo ticket -> solo uno exitoso; segundo 409 controlado
- Stock nunca negativo tras cierre/ajustes concurrentes

### Print
- `GET /tickets/:id/print/html` -> 200
- `GET /tickets/:id/print/pdf` -> 200 PDF
- Simular timeout Playwright -> error controlado (`PDF_TIMEOUT`/`PDF_RENDER_FAILED`) y sin fuga de procesos

### Contrato API
- Bodies con campos extra en endpoints strict -> 400 `VALIDATION_ERROR`
- Queries con coerción inválida -> 400 `VALIDATION_ERROR`
- Paginación uniforme: `{ items, page, page_size, total }`

### Docs/Postman
- Colección Postman login guarda `token` y endpoints protegidos funcionan
- README alineado con formatos reales (`from/to`) y política CORS

---

## Puntos verificados como correctos (sin fix necesario inmediato)

- RBAC está aplicado de forma consistente en rutas de negocio mediante `requirePermission(code)` + autenticación previa en hooks de módulo.
- Manejo estándar 401/403 existe y es consistente a nivel base.
- Inventario de entradas/ajustes usa transacciones y locks por producto, con control de no-negativo en ajustes.
- `nodemon.json` observa `src` e ignora artefactos comunes; `.gitignore` contempla `.env`, logs y PDFs generados.
- Postman (login) está alineado con `access_token` y scripts de guardado de token.
