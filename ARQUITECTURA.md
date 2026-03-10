# Arquitectura funcional de Crop Valuation

Este documento resume cómo está construido y cómo opera el proyecto `crop-valuation`. Se describe la arquitectura lógica, las dependencias críticas y el flujo principal para generar una valuación agrícola.

## 1. Visión general del sistema

- **Propósito:** Aplicación interna para capturar información de predios agrícolas, ejecutar un motor de valuación y emitir reportes comparables con la metodología institucional (`AVM_formulas_y_procedimiento.md`).
- **Stack:** Next.js 15 (App Router) con React 19 y TypeScript. Tailwind CSS v4 + componentes shadcn/ui para la interfaz. Persistencia y autenticación con Supabase (Postgres + Auth + Storage).
- **Modelo operativo:** Aplicación 100 % serverless. La UI y el motor corren en Vercel (o infraestructura equivalente) y los datos viven en Supabase. No existe backend tradicional; la lógica de negocio reside en componentes cliente/servidor y en el motor TypeScript (`lib/calculations/valuation-engine.ts`).

## 2. Capas principales

| Capa | Descripción | Artefactos destacados |
| --- | --- | --- |
| Presentación | Formularios, paneles y reportes. Se renderizan con componentes cliente en `app/**/page.tsx` y `components/*.tsx`. | `app/valuation/new/page.tsx`, `components/parcel-header-form.tsx`, `components/block-entry-form.tsx`, `components/valuation-report.tsx` |
| Dominio | Motor de cálculo determinístico que estandariza VPN, banderas de QA y tiers de confianza. | `lib/calculations/valuation-engine.ts` |
| Persistencia | Operaciones CRUD sobre Supabase y sincronización de tipos. | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `types/database.ts`, `scripts/*.sql` |
| Infraestructura | Configuración global, middleware de autenticación y estilos. | `app/layout.tsx`, `middleware.ts`, `styles/`, `components/ui` |

## 3. Flujo de valuación punta a punta

1. **Captura de encabezado del predio** (`ParcelHeaderForm`):
   - Trae departamentos/municipios desde Supabase (tablas `departamentos` y `municipios`) para poblar listas dependientes.
   - Valida campos requeridos localmente y actualiza o crea el registro en `public.parcels`.
2. **Registro de cultivos/lotes** (`BlockEntryForm`):
   - Permite múltiples bloques; cada bloque recoge fuentes de rendimiento (medido o modelado), supuestos de precio y costos.
   - Consulta curvas de rendimiento (`age_yield_curves`) y plantillas de costos (`cost_templates`) para mostrar opciones con autocomplete (`CreatableCombobox`).
   - Persiste los registros en `public.blocks`, manteniendo la relación con la parcela.
3. **Cálculo y simulación** (`ValuationCalculator`):
   - Con los datos capturados, arma un objeto `ParcelData` y solicita a Supabase las curvas adicionales necesarias (`age_yield_curves`, `cost_curves`, `cost_templates`).
   - Invoca `ValuationEngine.calculateParcelValuation`, que calcula edad del cultivo, rendimientos esperados, costos por hectárea, flujos acumulados, valor del bloque, VPN predial y banderas de control de calidad.
   - Devuelve `ParcelValuationResult`, que sirve tanto para mostrar resultados inmediatos como para alimentar reportes (`components/valuation-report.tsx`) y registros históricos (`valuation_results`).
4. **Revisión y almacenamiento**:
   - El usuario puede revisar gráficos/tablas y decidir si guarda la valuación final en las tablas de resultados (`valuation_results`, `valuation_blocks_results`) mediante acciones desde la UI (flujo gestionado en las páginas de `app/valuation/*`).

## 4. Motor de valuación (`lib/calculations/valuation-engine.ts`)

- **Entradas:** `ParcelData` contiene encabezado y un arreglo de `BlockData`. Se pueden complementar con `CalculationLookups` para curvas de rendimiento/costos.
- **Procesos clave:**
  - Determina edad del cultivo y fase (`improductive` vs `productive`) según fechas y umbrales configurables.
  - Normaliza fuentes de rendimiento (medido vs. modelado) aplicando factores de realización y convirtiendo producción a toneladas/hectárea.
  - Calcula ingresos brutos por bloque (precio * rendimiento * área) y consolida costos directos (plantillas, curvas o captura manual).
  - Genera flujos netos, punto de equilibrio (`PE+/PE-`), indicadores financieros (VPN, IRR, año de break-even) y asigna un tier de confianza (`A/B/C`) basado en la calidad de datos.
  - Registra `calculation_steps` y `qa_flags` para auditoría.
- **Salidas:** `ParcelValuationResult` resume valor agregado del predio, lista de bloques con métricas detalladas, tier global y banderas de resumen. Esta estructura alimenta la UI y puede serializarse tal cual hacia Supabase.

## 5. Persistencia y Supabase

- **Autenticación:** Middleware `lib/supabase/middleware.ts` mantiene la sesión de Supabase mediante cookies. Cualquier ruta protegida pasa por `middleware.ts`.
- **Tablas nucleares:** Definidas en `scripts/001-004*.sql` y documentadas en `types/database.ts`.
  - `parcels` (encabezados) y `blocks` (cultivos/lotes) contienen la materia prima del motor.
  - `valuation_results` y `valuation_block_results` almacenan salidas auditables del motor, junto con `qa_flags`, `calculation_steps` y metadatos de usuario.
  - Tablas de referencia: `departamentos`, `municipios`, `age_yield_curves`, `cost_templates`, `cost_curves`, `crops`, entre otras.
- **Sincronización de tipos:** Los tipos TypeScript consumidos por React y el motor se declaran manualmente en `types/database.ts`. Cualquier cambio en SQL debe reflejarse en este archivo y en los tipos compartidos (`types/shared.ts` si aplica) para evitar discrepancias.
- **Migraciones:** Los scripts `scripts/00X_*.sql` se aplican en orden. Incluyen creación de tablas, funciones, triggers de auditoría y cargas iniciales (curvas, plantillas, catastro de departamentos/municipios).

## 6. Interfaz y experiencia de usuario

- Los componentes usan `shadcn/ui` (Radix + Tailwind). Se agrupan en `components/ui`.
- Formularios complejos (`parcel-header-form.tsx`, `block-entry-form.tsx`) administran estado con `useState`, validaciones manuales y componentes derivados como `CreatableCombobox`.
- `ValuationReport` y `valuation-calculator` reutilizan utilidades de formato para presentar COP, porcentajes y fechas en formato `es-CO`.
- La navegación principal vive en `app/valuation`, `app/dashboard`, `app/profile`, etc. El layout global (`app/layout.tsx`) define tipografías Geist, Suspense y Analytics de Vercel.

## 7. Integraciones y despliegue

- **Supabase:** Cliente browser (`lib/supabase/client.ts`) para operaciones en componentes cliente y cliente servidor (`lib/supabase/server.ts`) para acciones en Server Components / RSC.
- **Vercel Analytics:** Habilitado en el layout para telemetría ligera.
- **Entorno:** Variables críticas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, etc.) viven en `.env.local` y se propagan según el contexto (browser vs. server).
- **Build pipeline:** Scripts estándar `pnpm dev/build/start/lint`. No hay procesos adicionales fuera del árbol Next.js.

## 8. Consideraciones de seguridad y QA

- Datos sensibles (keys de servicio y cadenas Postgres sin pool) se usan únicamente en el backend de Supabase o en scripts administrativos. La app cliente consume solo claves públicas.
  - La función `middleware.ts` protege rutas y refresca sesiones; cualquier acceso directo sin cookie válida redirige a `app/auth/login`.
- Validaciones adicionales:
  - Formularios bloquean envíos incompletos y muestran errores contextuales.
  - El motor agrega `qa_flags` cuando detecta datos faltantes o inconsistentes (área cero, producción sin periodo, etc.), lo cual facilita revisiones de control interno.

## 9. Cómo extender o mantener

1. **Nuevas variables o campos:** agregar la columna en los scripts SQL, actualizar `types/database.ts`, extender los formularios y ajustar el motor si la variable participa en cálculos.
2. **Nuevas curvas o plantillas:** cargar datos mediante `scripts/006_*.sql` o el panel de Supabase; los componentes ya consultan las tablas y solo requieren exponer el nuevo registro.
3. **Automatizaciones:** se recomienda encapsular scripts administrativos en `scripts/` (por ejemplo, cargas masivas) y consumir `SUPABASE_SERVICE_ROLE_KEY` con precaución.

Con esta vista puede argumentarse el esfuerzo de desarrollo: un frontend especializado sustentado por un motor financiero propio y una base de datos normalizada en Supabase, alineado con las metodologías internas de valuación agrícola.
