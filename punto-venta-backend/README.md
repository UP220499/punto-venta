# Punto de Venta — Backend

API REST para sistema de Punto de Venta construida con **Node.js**, **Fastify**, **Knex** y **PostgreSQL**.

---

## Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Instalacion](#instalacion)
3. [Variables de Entorno](#variables-de-entorno)
4. [Base de Datos](#base-de-datos)
5. [Ejecutar el Servidor](#ejecutar-el-servidor)
6. [Importar en Postman](#importar-en-postman)
7. [Documentacion de la API](#documentacion-de-la-api)
8. [Autenticacion](#autenticacion)
9. [Permisos](#permisos)
10. [Seguridad](#seguridad)
11. [Estructura del Proyecto](#estructura-del-proyecto)
12. [Scripts Disponibles](#scripts-disponibles)
13. [Solucion de Problemas](#solucion-de-problemas)

---

## Requisitos

| Herramienta | Version minima |
|-------------|----------------|
| Node.js     | 18.x           |
| npm         | 9.x            |
| PostgreSQL  | 14.x           |
| Postman     | 10.x           |

---

## Instalacion

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd punto-venta-backend

# 2. Instalar dependencias
npm install

# 3. Instalar Chromium para generacion de PDF (Playwright)
npx playwright install chromium
```

---

## Variables de Entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
# Servidor
HOST=127.0.0.1
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/punto_venta

# JWT — usa una cadena larga y aleatoria en produccion
JWT_SECRET=cambia_esto_por_un_secreto_seguro_de_al_menos_32_caracteres

# ID del negocio activo en la base de datos
BUSINESS_ID=1

# CORS — origenes permitidos separados por coma
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
```

> **Nunca** subas el archivo `.env` al repositorio. Ya esta en `.gitignore`.

---

## Base de Datos

```bash
# Ejecutar todas las migraciones pendientes
npm run migrate:latest

# Revertir la ultima migracion
npm run migrate:rollback

# Poblar con datos de prueba
npm run seed:run
```

El archivo de configuracion de Knex se encuentra en `knexfile.js`.

---

## Ejecutar el Servidor

```bash
# Modo desarrollo (recarga automatica con nodemon)
npm run dev

# Modo produccion
npm start
```

El servidor escucha en `http://127.0.0.1:3000` por defecto.

Verifica que este corriendo:

```bash
curl http://127.0.0.1:3000/health
# -> {"ok":true}
```

---

## Importar en Postman

### Paso 1 — Importar la Coleccion

1. Abre Postman.
2. Haz clic en **Import** (boton superior izquierdo).
3. Selecciona el archivo `postman/Punto de Venta API.postman_collection.json`.
4. Confirma la importacion.

### Paso 2 — Importar el Environment

1. En Postman, ve a **Environments** (icono de ojo en la barra lateral).
2. Haz clic en **Import**.
3. Selecciona el archivo `postman/Punto de Venta Local.postman_environment.json`.
4. Activa el environment **Punto de Venta Local** en el selector superior derecho.

### Paso 3 — Autenticarse

1. Asegurate de que el servidor este corriendo (`npm run dev`).
2. En la coleccion, abre la carpeta **01 Auth**.
3. Ejecuta **Login** con tus credenciales.
4. El script de test guardara el token automaticamente en la variable `token`.

### Paso 4 — Usar los Endpoints

Todos los endpoints protegidos usaran el token guardado automaticamente.
La variable `ticket_id` tambien se actualiza al crear un ticket con **Create Ticket**.

---

## Documentacion de la API

### Health

| Metodo | Ruta       | Descripcion                     | Auth |
|--------|------------|---------------------------------|------|
| GET    | /health    | Liveness check                  | No   |
| GET    | /health/db | Verifica conectividad con la BD | No   |

---

### Auth

| Metodo | Ruta        | Descripcion                         | Auth |
|--------|-------------|-------------------------------------|------|
| POST   | /auth/login | Autentica usuario, devuelve JWT     | No   |
| GET    | /auth/me    | Informacion del usuario autenticado | Si   |

**Body de POST /auth/login:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Products

| Metodo | Ruta                               | Descripcion                 | Permiso       |
|--------|------------------------------------|-----------------------------|---------------|
| GET    | /products                          | Lista productos (paginado)  | PRODUCT_READ  |
| POST   | /products                          | Crea un producto            | PRODUCT_WRITE |
| PATCH  | /products/:product_id              | Actualiza un producto       | PRODUCT_WRITE |
| POST   | /products/:product_id/barcodes     | Agrega codigo de barras     | PRODUCT_WRITE |
| DELETE | /products/:product_id/barcodes/:id | Elimina codigo de barras    | PRODUCT_WRITE |

**Query params de GET /products:**

| Param     | Tipo   | Default | Descripcion                     |
|-----------|--------|---------|---------------------------------|
| page      | int    | 1       | Numero de pagina                |
| page_size | int    | 20      | Resultados por pagina (max 100) |
| q         | string | —       | Busqueda por nombre o SKU       |
| estatus   | enum   | —       | ACTIVO \| INACTIVO              |

**Body de POST /products:**
```json
{
  "sku": "PROD-001",
  "nombre": "Producto de Ejemplo",
  "descripcion": "Descripcion opcional",
  "precio_venta": 99.99,
  "costo": 50.00,
  "stock_actual": 100,
  "stock_minimo": 10,
  "unidad": "pz"
}
```

---

### Barcodes

| Metodo | Ruta                     | Descripcion                         | Permiso      |
|--------|--------------------------|-------------------------------------|--------------|
| GET    | /barcodes/:barcode_value | Busca producto por codigo de barras | PRODUCT_READ |

---

### Tickets (Ventas)

| Metodo | Ruta               | Descripcion                    | Permiso     |
|--------|--------------------|--------------------------------|-------------|
| POST   | /tickets           | Crea ticket en estado ABIERTO  | SALE_CREATE |
| POST   | /tickets/:id/close | Cierra ticket y registra pagos | SALE_CLOSE  |
| GET    | /tickets           | Lista tickets (paginado)       | SALE_VIEW   |
| GET    | /tickets/:id       | Detalle de un ticket           | SALE_VIEW   |

**Body de POST /tickets:**
```json
{
  "items": [
    { "product_id": 1, "cantidad": 2 },
    { "product_id": 3, "cantidad": 1 }
  ]
}
```

**Body de POST /tickets/:id/close:**
```json
{
  "payments": [
    { "method_code": "EFECTIVO", "monto": 200.00 },
    { "method_code": "TARJETA",  "monto": 50.00 }
  ]
}
```

**Query params de GET /tickets:**

| Param     | Tipo   | Default | Descripcion                          |
|-----------|--------|---------|--------------------------------------|
| page      | int    | 1       | Numero de pagina                     |
| page_size | int    | 20      | Resultados por pagina                |
| estatus   | enum   | —       | ABIERTO \| CERRADO \| CANCELADO      |
| folio     | string | —       | Numero de folio exacto               |
| from      | string | —       | ISO 8601 datetime con offset         |
| to        | string | —       | ISO 8601 datetime con offset         |

---

### Print

| Metodo | Ruta                    | Descripcion                | Permiso   |
|--------|-------------------------|----------------------------|-----------|
| GET    | /tickets/:id/print/html | Renderiza ticket como HTML | SALE_VIEW |
| GET    | /tickets/:id/print/pdf  | Genera ticket como PDF     | SALE_VIEW |

> El endpoint PDF usa **Playwright** (Chromium headless).
> Ejecuta `npx playwright install chromium` antes de usarlo.

---

### Inventory

| Metodo | Ruta                          | Descripcion                     | Permiso         |
|--------|-------------------------------|---------------------------------|-----------------|
| POST   | /inventory/entries            | Registra entradas de inventario | INVENTORY_WRITE |
| POST   | /inventory/adjustments        | Registra ajustes de inventario  | INVENTORY_WRITE |
| GET    | /inventory/movements          | Lista movimientos (paginado)    | INVENTORY_READ  |
| GET    | /inventory/products/low-stock | Productos con stock bajo        | INVENTORY_READ  |

**Body de POST /inventory/entries:**
```json
{
  "items": [
    { "product_id": 1, "cantidad": 50, "nota": "Compra a proveedor ABC" }
  ]
}
```

**Body de POST /inventory/adjustments:**
```json
{
  "items": [
    { "product_id": 1, "qty_delta": -5, "nota": "Merma por caducidad" }
  ]
}
```

> `qty_delta` puede ser positivo o negativo, pero no puede ser 0.

---

### Reports

| Metodo | Ruta                       | Descripcion                          | Permiso     |
|--------|----------------------------|--------------------------------------|-------------|
| GET    | /reports/sales/summary     | Resumen de ventas en periodo         | REPORT_READ |
| GET    | /reports/sales/by-day      | Ventas agrupadas por dia             | REPORT_READ |
| GET    | /reports/top-products      | Productos mas vendidos               | REPORT_READ |
| GET    | /reports/inventory/summary | Resumen de movimientos de inventario | REPORT_READ |

Todos los endpoints de reportes aceptan `from` y `to` en formato ISO 8601 con offset de zona horaria.

Ejemplo: `?from=2025-01-01T00:00:00-06:00&to=2025-12-31T23:59:59-06:00`

---

### Settings

| Metodo | Ruta      | Descripcion                       | Permiso        |
|--------|-----------|-----------------------------------|----------------|
| GET    | /settings | Obtiene configuracion del negocio | SETTINGS_READ  |
| PATCH  | /settings | Actualiza configuracion           | SETTINGS_WRITE |

**Campos disponibles en PATCH /settings:**

| Campo                      | Tipo    | Descripcion                                   |
|----------------------------|---------|-----------------------------------------------|
| ticket_folio_prefix        | string  | Prefijo del folio (ej. "T-")                  |
| ticket_folio_next          | int     | Siguiente numero de folio                     |
| ticket_folio_padding       | int     | Ceros a la izquierda (0-12)                   |
| tax_enabled                | boolean | Habilitar impuestos                           |
| tax_rate                   | number  | Tasa de impuesto (0-1, ej. 0.16 = 16%)        |
| tax_included_in_price      | boolean | Precio ya incluye impuesto                    |
| currency_code              | string  | Codigo ISO 4217 (ej. "MXN")                   |
| currency_symbol            | string  | Simbolo (ej. "$")                             |
| decimal_places             | int     | Decimales a mostrar (0-4)                     |
| timezone                   | string  | Zona horaria IANA (ej. "America/Mexico_City") |
| ticket_header_text         | string  | Texto de encabezado del ticket                |
| ticket_footer_text         | string  | Texto de pie del ticket                       |
| ticket_paper_width         | 58\|80  | Ancho del papel en mm                         |
| show_tax_breakdown         | boolean | Mostrar desglose de impuesto                  |
| show_cashier_name          | boolean | Mostrar nombre del cajero                     |
| show_barcode_on_ticket     | boolean | Mostrar codigo de barras en ticket            |
| default_stock_minimo       | int     | Stock minimo por defecto                      |
| default_unidad             | string  | Unidad de medida por defecto                  |
| require_transfer_reference | boolean | Requerir referencia en transferencias         |

---

### Audit

| Metodo | Ruta   | Descripcion             | Permiso    |
|--------|--------|-------------------------|------------|
| GET    | /audit | Lista logs de auditoria | AUDIT_READ |

**Query params de GET /audit:**

| Param     | Tipo   | Default | Descripcion                  |
|-----------|--------|---------|------------------------------|
| page      | int    | 1       | Numero de pagina             |
| page_size | int    | 20      | Resultados por pagina        |
| user_id   | int    | —       | Filtrar por usuario          |
| action    | string | —       | Filtrar por accion           |
| from      | string | —       | ISO 8601 datetime con offset |
| to        | string | —       | ISO 8601 datetime con offset |

---

## Autenticacion

La API usa **JWT (JSON Web Tokens)** con algoritmo HS256.

- El token se obtiene en `POST /auth/login` y tiene validez de **8 horas**.
- Se envia en el header `Authorization: Bearer <token>`.
- El payload contiene: `sub` (user_id), `business_id`, `username`, `roles`, `permissions`.
- En Postman, la coleccion esta configurada con autenticacion Bearer a nivel coleccion; todos los endpoints heredan el token automaticamente.

---

## Permisos

El sistema usa un modelo de permisos granular. Cada endpoint requiere un permiso especifico:

| Permiso         | Descripcion                              |
|-----------------|------------------------------------------|
| PRODUCT_READ    | Ver productos y codigos de barras        |
| PRODUCT_WRITE   | Crear/editar productos y codigos         |
| SALE_CREATE     | Crear tickets de venta                   |
| SALE_CLOSE      | Cerrar tickets y registrar pagos         |
| SALE_VIEW       | Ver tickets e imprimir                   |
| INVENTORY_READ  | Ver movimientos e inventario             |
| INVENTORY_WRITE | Registrar entradas y ajustes             |
| REPORT_READ     | Ver reportes                             |
| SETTINGS_READ   | Ver configuracion del negocio            |
| SETTINGS_WRITE  | Modificar configuracion del negocio      |
| AUDIT_READ      | Ver logs de auditoria                    |

Los permisos se asignan a roles, y los roles a usuarios en la base de datos.

---

## Seguridad

- **Helmet** — Headers HTTP de seguridad habilitados por defecto.
- **Rate Limiting** — Limite de peticiones por IP para prevenir abuso.
- **CORS** — Solo origenes configurados en `CORS_ORIGINS` son permitidos.
- **Bcrypt** — Contrasenas almacenadas con hash bcrypt (nunca en texto plano).
- **JWT** — Tokens firmados con secreto configurable; expiran en 8 horas.
- **Anti-enumeracion** — El login devuelve el mismo error 401 para usuario inexistente o contrasena incorrecta.
- **Validacion estricta** — Bodies y query params validados con **Zod**; campos desconocidos rechazados con 400.

---

## Estructura del Proyecto

```
punto-venta-backend/
├── src/
│   ├── app.js                    # Punto de entrada de Fastify
│   ├── config/
│   │   ├── db.js                 # Configuracion de Knex/PostgreSQL
│   │   ├── plugins.js            # Registro de plugins Fastify
│   │   └── routes.js             # Registro de rutas
│   ├── modules/
│   │   ├── auth/                 # Autenticacion (login, me)
│   │   ├── health/               # Health checks
│   │   ├── products/             # Productos y codigos de barras
│   │   ├── sales/                # Tickets, cierre, impresion HTML/PDF
│   │   ├── inventory/            # Entradas, ajustes, movimientos
│   │   ├── reports/              # Reportes de ventas e inventario
│   │   ├── settings/             # Configuracion del negocio
│   │   └── audit/                # Log de auditoria
│   └── shared/
│       ├── error-handler.js      # Manejador global de errores
│       └── permissions.js        # Middleware de permisos
├── migrations/                   # Migraciones de base de datos (Knex)
├── seeds/                        # Datos de prueba (Knex)
├── postman/
│   ├── Punto de Venta API.postman_collection.json
│   └── Punto de Venta Local.postman_environment.json
├── knexfile.js                   # Configuracion de Knex
├── nodemon.json                  # Configuracion de nodemon
├── package.json
└── .env                          # Variables de entorno (NO subir al repo)
```

---

## Scripts Disponibles

| Script                     | Descripcion                                 |
|----------------------------|---------------------------------------------|
| `npm run dev`              | Inicia en modo desarrollo con nodemon       |
| `npm start`                | Inicia en modo produccion                   |
| `npm run migrate:latest`   | Ejecuta todas las migraciones pendientes    |
| `npm run migrate:rollback` | Revierte la ultima migracion                |
| `npm run seed:run`         | Inserta datos de prueba en la base de datos |

---

## Solucion de Problemas

### El servidor no inicia

- Verifica que PostgreSQL este corriendo y accesible.
- Confirma que `DATABASE_URL` en `.env` sea correcta.
- Asegurate de haber ejecutado `npm run migrate:latest`.

### Error 401 en todos los endpoints

- Ejecuta primero `POST /auth/login` para obtener un token.
- Verifica que el environment **Punto de Venta Local** este activo en Postman.
- El token expira en 8 horas; vuelve a hacer login si es necesario.

### Error 403 Forbidden

- El usuario no tiene el permiso requerido para ese endpoint.
- Verifica los roles y permisos del usuario en la base de datos.

### El PDF no se genera (500 PDF_RENDER_FAILED)

- Ejecuta `npx playwright install chromium` para instalar el navegador.
- En Linux puede ser necesario instalar dependencias del sistema:
  ```bash
  npx playwright install-deps chromium
  ```

### Error de CORS en el frontend

- Agrega el origen del frontend a `CORS_ORIGINS` en `.env`.
- Reinicia el servidor despues de cambiar variables de entorno.

### Migraciones fallan

- Verifica que el usuario de PostgreSQL tenga permisos de CREATE TABLE.
- Revisa los logs de error para identificar la migracion problematica.
- Usa `npm run migrate:rollback` para revertir y corregir.

---

## Licencia

ISC
