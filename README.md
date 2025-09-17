# Plataforma de Valuacion Agricola

## Descripcion General
Crop Valuation es una aplicacion web interna para preparar valuaciones profesionales de regiones (departamentos/municipios) agricolas. Acompana a los analistas desde la configuracion de la región (departamento/municipio), la captura de datos por cultivo/lote y la ejecucion del motor de valuacion que estima indicadores de flujo de caja y asigna niveles de confianza.

## Caracteristicas Principales
- Flujo guiado que lleva al usuario por el encabezado de la región (departamento/municipio), los datos por cultivo/lote y una revision del calculo antes de guardar resultados.
- Motor de valuacion embebido (`lib/calculations/valuation-engine.ts`) que calcula valores de cultivo/lote, aproximaciones de VPN parcelario, estado de punto de equilibrio y banderas de control de calidad.
- Persistencia en Supabase para regiones (departamentos/municipios), cultivos/lotes, resultados de valuacion, tablas de referencia y autenticacion gestionada a traves del proyecto institucional.
- Paginas de panel, visualizacion y edicion bajo `app/valuation/*` para revisar valuaciones historicas y actualizar regiones (departamentos/municipios) existentes.
- Interfaz en espanol alineada con el proceso institucional de avaluos y respaldada por la metodologia detallada en `AVM_formulas_y_procedimiento.md`.

## Stack Tecnologico
- Next.js 15 App Router con React 19 y componentes server/client.
- TypeScript en toda la aplicacion con tipos compartidos en `types/`.
- Tailwind CSS v4 y componentes shadcn/ui (Radix UI, iconos Lucide).
- Supabase Postgres, Auth y Storage via `@supabase/supabase-js` y los helpers SSR/browser en `lib/supabase/`.

## Puesta en Marcha
### Requisitos Previos
- Node.js 20.x o superior (alineado con la version usada en CI/CD).
- pnpm 9.x (el proyecto gestiona dependencias con `pnpm-lock.yaml`).
- Acceso al proyecto institucional de Supabase (URL, anon key, service role key y cadenas de conexion de base de datos).

### Variables de Entorno
Cree un archivo `.env.local` en la raiz del proyecto. Coordine con los administradores antes de copiar secretos. La aplicacion espera las siguientes variables:

| Variable | Requerida | Descripcion |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | si | URL publica del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | si | Llave anonima publica para uso en el cliente. |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | opcional | URL de redireccion para confirmaciones de correo en desarrollo. |
| `SUPABASE_URL` | si | URL de Supabase usada en el servidor por rutas y middleware. |
| `SUPABASE_SERVICE_ROLE_KEY` | si (tareas server) | Llave de rol de servicio para tareas en background o migraciones. Nunca exponer en el navegador. |
| `POSTGRES_URL` | si | Cadena de conexion Postgres con pool. |
| `POSTGRES_URL_NON_POOLING` | opcional | Cadena sin PgBouncer para scripts administrativos. |
| `POSTGRES_PRISMA_URL` | opcional | Cadena compatible con clientes estilo Prisma si se requiere. |
| `POSTGRES_HOST` | opcional | Host usado por scripts de monitoreo. |

### Instalar Dependencias
```bash
pnpm install
```

### Ejecutar en Local
```bash
pnpm dev
```
La aplicacion inicia por defecto en http://localhost:3000. Inicie sesion o registre un usuario de Supabase con acceso al proyecto institucional.

### Scripts Adicionales
```bash
pnpm build   # Compilacion para produccion
pnpm start   # Ejecuta el servidor de produccion luego de compilar
pnpm lint    # Analisis estatico via next lint
```

## Base de Datos y Migraciones
El esquema de Supabase se encuentra en el directorio `scripts/`. Ejecute los archivos SQL en orden numerico al preparar un nuevo entorno:

1. `001_create_parcels_table.sql`
2. `002_create_blocks_table.sql`
3. `003_create_lookup_tables.sql`
4. `004_create_valuation_results_table.sql`
5. `005_create_functions_and_triggers.sql`
6. `006_seed_default_curves_and_templates.sql`

Apliquelos mediante el editor SQL de Supabase o `psql`:
```bash
psql "$POSTGRES_URL_NON_POOLING" -f scripts/001_create_parcels_table.sql
```
Repita para los demas scripts. Mantenga `types/database.ts` sincronizado con cualquier cambio de esquema.

## Estructura del Proyecto
```
app/                    Rutas y paginas de Next.js (App Router)
components/             Componentes reutilizables incluyendo formularios de región (departamento/municipio) y cultivo/lote
hooks/                  Hooks personalizados usados en formularios y asistentes
lib/                    Clientes de Supabase y logica del motor de valuacion
public/                 Activos estaticos servidos por Next.js
scripts/                Migraciones SQL y datos seed para Supabase
styles/                 Configuracion de Tailwind y estilos globales
types/                  Definiciones TypeScript compartidas generadas desde SQL
```

## Flujo de Valuacion
1. Capturar informacion a nivel región (departamento/municipio) (region, operador, fecha de valuacion, area).
2. Configurar cada cultivo/lote con cultivo, variedad, edad, fuente de rendimiento, precios y supuestos de costos.
3. Ejecutar el valuador para obtener curvas de referencia, calcular metricas de cultivo/lote y asignar niveles de confianza.
4. Persistir regiones (departamentos/municipios), cultivos/lotes y resultados en Supabase para su posterior revision.
5. Revisar paneles y paginas de detalle para seguir historicos y preparar reportes para clientes.

## Documentacion y Referencias
- `AVM_formulas_y_procedimiento.md` y el PDF asociado documentan la logica financiera y deben mantenerse alineados con cualquier cambio en el motor.
- El middleware de Supabase en `lib/supabase/middleware.ts` administra sesiones autenticadas en componentes de servidor.
- Los componentes de UI siguen la identidad institucional definida en `styles/` y la tematizacion de shadcn/ui.

## Lista de Verificacion de Mantenimiento
- Ejecute `pnpm lint` antes de abrir pull requests.
- Valide que `.env.local` coincida con las credenciales almacenadas en el gestor de secretos institucional antes de desplegar.
- Actualice `types/database.ts` cada vez que cambien los scripts SQL para evitar desviaciones en tiempo de ejecucion.
- Registre las migraciones en el sistema interno de seguimiento junto con las actualizaciones documentales.
