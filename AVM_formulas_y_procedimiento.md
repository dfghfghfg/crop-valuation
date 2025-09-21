# AVM de Cultivos — Fórmulas, Definiciones y Procedimiento

> **Propósito**: Documentar, de forma precisa y entendible, las ecuaciones usadas por la calculadora de valuación agrícola (AVM) para cultivos/lotes/regiones (departamentos/municipios). Incluye variables, unidades, reglas de valoración y el orden de cómputo.

---

## 1) Convenciones, unidades y notación

- Moneda: **COP** (pesos colombianos).
- Área: **ha** (hectáreas).
- Masa: **kg** (cuando se lea en toneladas, $\text{tons} \to \text{kg} = \text{tons} \times 1000$).
- Tasas (interés, factor DNP): decimales. Ej.: 9.5% = **0.095**.
- Fechas en formato ISO: `aaaa-mm-dd`.

**Índices**  
- $t$: edad (años desde la siembra, **entero**).
- Cálculos por **cultivo/lote** (subíndice `block`) y por **hectárea** (`/ha`).

**Funciones auxiliares**  
- $\mathrm{floor}(\cdot)$: parte entera hacia abajo.
- `curve_data["t"]`: acceso a un mapa JSON **edad → valor** (de BD).

---

## 2) Variables de entrada (por cultivo/lote)

| Variable | Símbolo | Unidad | Descripción |
|---|---|---|---|
| `block_area_ha` | $A$ | ha | Área del cultivo/lote. |
| `planting_date` | — | fecha | Fecha de siembra. |
| `valuation_asof_date` | — | fecha | Fecha de corte para la valuación. |
| `yield_source` | — | — | `"measured"` o `"modeled"`. |
| `production_tons_period` | $Q_{\text{tons/ha}}$ | ton/ha | Producción por hectárea en el periodo (si *measured*, ya reportada en ton/ha). |
| `period_days` | $D$ | días | Días cubiertos por $Q_{\text{tons}}$. |
| `age_yield_curve_id` | — | — | Id de curva edad–rendimiento (si *modeled*). |
| `realization_factor` | $\phi$ | — | Factor de realización (0.8–1.2 típico). Por defecto 1.0. |
| `price_farmgate_cop_per_kg` | $P$ | COP/kg | Precio a puerta de finca. |
| `cost_source` | — | — | `"standard_template"` o `"custom_entered"`. |
| `cost_template_id` | — | — | Id de plantilla estándar (si aplica). |
| 11 grupos de costo personalizado | — | COP/ha | Suma por ha si `cost_source="custom_entered"`. |
| `financed_amount_cop` | $F$ | COP | Monto financiado en el periodo. |
| `ea_rate` | $i$ | — | Tasa efectiva anual aplicada al monto financiado. |
| `cumulative_outlays_to_date_cop` | $C^{\text{acum}}$ | COP | Egresos acumulados históricos (improductivo). |
| `inp_factor` | $\alpha$ | — | Factor improductivo (0.30–0.50). Por defecto 0.40. |
| `dnp_discount_rate` | $r$ | — | Tasa de descuento para VPN de un periodo. |

---

## 3) Derivadas fundamentales

### 3.1 Edad
$$
t = \mathrm{floor}\!\left( \frac{\text{valuation\_asof\_date} - \text{planting\_date}}{365} \right)
$$

### 3.2 Rendimiento por hectárea $Y_t$ (kg/ha)

- **Medido** (`yield_source = "measured"`):
$$
Y_t = \frac{Q_{\text{tons/ha}} \times 1000}{\left(\frac{D}{365}\right)} \quad [\text{kg/ha}]
$$

- **Modelado** (`yield_source = "modeled"`):
$$
Y_t = Y^{\text{base}}_t \times \phi,\quad
Y^{\text{base}}_t = \text{age\_yield\_curves[curve\_id].curve\_data}[t]
$$

### 3.3 Costos directos por hectárea $C_t$ (COP/ha)

1) **Curva por edad** (preferido, si existe `cost_curves`):  
   Buscar una curva cuyo `id` coincida/alias con `age_yield_curve_id` (o por cultivar) y leer:
$$
C_t = \text{cost\_curves[curve\_id].curve\_data}[t]
$$

2) **Plantilla estándar** (`cost_source="standard_template"`, sin curva por edad):
$$
C_t = \sum_{g=1}^{11} \text{template\_cost}_g \quad [\text{COP/ha}]
$$

3) **Custom** (`cost_source="custom_entered"`):
$$
C_t = \sum_{g=1}^{11} \text{input\_cost}_g \quad [\text{COP/ha}]
$$

### 3.4 Ingreso bruto del cultivo/lote $G$ (COP)
$$
G = Y_t \times P \times A
$$

### 3.5 Costo financiero del cultivo/lote $CF$ (COP)
$$
CF = F \times i
$$

### 3.6 Inversión total del cultivo/lote $I$ (COP)
$$
I = (C_t \times A) + CF
$$

### 3.7 Ingreso neto del cultivo/lote $N$ (COP)
$$
N = G - I
$$

---

## 4) PE, fase y acumulados

### 4.1 Acumulados (implementación simplificada actual)
En la calculadora, para el **periodo actual**:
$$
\text{Influjos}^{\text{acum}} = G,\quad
\text{Egresos}^{\text{acum}} = I + C^{\text{acum}}\ (\text{si viene informado})
$$

> **Alternativa más rigurosa (multi-año)**: Acumular año a año $\sum_{\tau=0}^{t} G_\tau$ y $\sum_{\tau=0}^{t} I_\tau$ leyendo curvas históricas. (No implementado en el snippet actual).

### 4.2 Fase del cultivo/lote
$$
\text{fase} =
\begin{cases}
\text{improductive} & \text{si } t \le 3,\\
\text{productive} & \text{si } t \ge 4.
\end{cases}
$$

### 4.3 Punto de equilibrio (PE)
$$
\text{PE} =
\begin{cases}
\text{PE+} & \text{si } \text{Influjos}^{\text{acum}} \ge \text{Egresos}^{\text{acum}},\\
\text{PE-} & \text{en otro caso.}
\end{cases}
$$

---

## 5) Reglas de valuación (valor del cultivo/lote)

Definimos $V$ como el **valor AVM del cultivo/lote** y $v = V/A$ el valor **por ha**.

1) **Improductiva** ($t \le 3$)  
$$
V = C^{\text{acum}}_{\text{impl}} + \alpha \cdot \overline{N}_{\text{improd}}
$$  
- En la implementación actual: $C^{\text{acum}}_{\text{impl}} = I$ si no se provee `cumulative_outlays_to_date_cop`.
- $\overline{N}_{\text{improd}}$: promedio de utilidades netas en fase improductiva. En el snippet actual se aproxima con **la neta del periodo** (si no hay histórico).

2) **Productiva & PE−**  
$$
V = N + I
$$

3) **Productiva & PE+**  
$$
V = N
$$

**Valor por ha**: $v = V/A$.

---

## 6) Indicadores de negocio

- **VPN de un periodo (simplificado)**:
$$
\mathrm{VPN}_1 = \frac{N}{1+r}
$$

> Extensión multi-periodo: $\mathrm{VPN} = \sum_{\tau=1}^{T} \frac{N_\tau}{(1+r)^\tau}$ con proyección de $Y_\tau, C_\tau, P, F_\tau$.

- **IRR**: no se calcula en el snippet actual; requiere vector de flujos $\{-I_0, N_1, \ldots, N_T\}$.

- **Año de PE**: primer $t$ tal que influjos acumulados ≥ egresos acumulados. En el snippet actual se infiere con datos del periodo; para exactitud, usar acumulados multi-año.

---

## 7) Procedimiento paso a paso (orden de cómputo)

1) **Edad**: calcular $t$.
2) **Rendimiento/ha**:
   - Si *measured*: usar fórmula con $Q_{\text{tons}}$ y $D$.
   - Si *modeled*: leer $Y^{\text{base}}_t$ de `age_yield_curves[curve_id].curve_data[t]` y multiplicar por $\phi$.  
3) **Costo/ha**:  
   - Preferir **curva por edad** en `cost_curves`; si no existe, usar **plantilla** (`standard_template`) o **custom**.  
4) **Ingreso bruto**: $G = Y_t \times P \times A$.
5) **Costo financiero**: $CF = F \times i$.
6) **Inversión total**: $I = (C_t \times A) + CF$.
7) **Ingreso neto**: $N = G - I$.  
8) **Acumulados**:  
   - Simplificado: $\text{Influjos}^{\text{acum}} = G$, $\text{Egresos}^{\text{acum}} = I + C^{\text{acum}}$ (si existe).
9) **Fase y PE**: aplicar reglas de §4.2 y §4.3.
10) **Valor** $V$: aplicar reglas de §5.
11) **VPN**: $\mathrm{VPN}_1 = N/(1+r)$.
12) **Por ha**: dividir $V$ entre $A$.  
13) **Tier QA**: A/B/C según fuente de rendimiento (medido + evidencia) y completitud de precio/costos.

---

## 8) Lectura desde BD (cómo se arman las curvas)

### 8.1 Curva edad–rendimiento (`age_yield_curves`)
- Tabla: `public.age_yield_curves`  
- Campo: `curve_data` (JSONB), p.ej. `{"3":14000,"4":26000,"5":34000,"6":38000,...}`  
- Acceso: `yield = curve_data[t]` (convertir clave string → entero).

**Ejemplo OxG**  
`id = 'oil_palm_oxg'` → `curve_data["6"] = 38000` kg/ha.

### 8.2 Curva edad–costo (`cost_curves`)
- Tabla: `public.cost_curves`  
- Campo: `curve_data` (JSONB), p.ej. `{"6":10982967.5829,...}` en **COP/ha**.  
- Acceso: `cost_ha = curve_data[t]`.

**Ejemplo OxG**  
`id = 'oil_palm_cost_oxg'` → `curve_data["6"] ≈ 10,982,968` COP/ha.

> **Alias práctico**: si `age_yield_curve_id` contiene `"oxg"`, mapear a `oil_palm_cost_oxg`; si contiene `"palmaeguinensis"`, mapear a `oil_palm_cost_palmaeguinensis`.

---

## 9) Ejemplo numérico (OxG, edad 6, 5 ha, precio 740 COP/ha, 70% financiado, EA=0.095)

Datos:
$A=5\ \text{ha}$, $t=6$, $Y_t=38{,}000\ \text{kg/ha}$, $P=740\ \text{COP/kg}$, $C_t=10{,}982{,}968\ \text{COP/ha}$, $F = 0.70 \times (C_t \times A) = 38{,}440{,}388$, $i=0.095$, $r=0.12$.

Cálculos:
1. $G = 38{,}000 \times 740 \times 5 = 140{,}600{,}000$ COP.
2. $CF = 38{,}440{,}388 \times 0.095 \approx 3{,}651{,}837$ COP.
3. $I = (10{,}982{,}968 \times 5) + 3{,}651{,}837 = 58{,}566{,}675$ COP.
4. $N = 140{,}600{,}000 - 58{,}566{,}675 = 82{,}033{,}325$ COP.
5. $\mathrm{VPN}_1 = 82{,}033{,}325 / 1.12 \approx 73{,}244{,}041$ COP.
6. Fase (t=6): **productiva**. PE (simplificado con acumulados del periodo): **PE+**.
7. **Valor** (productiva, PE+): $V = N = 82{,}033{,}325$ COP.
8. Valor por ha: $v = 82{,}033{,}325 / 5 = 16{,}406{,}665$ COP/ha.

---

## 10) Extensiones recomendadas

- **Acumulados multi-año** reales (para PE exacto).  
- **Proyecciones T-periodos** para NPV/IRR.  
- **Descomposición de $C_t$** en 11 grupos (siempre) a partir de proporciones por edad.
- **Sensibilidades**: $\pm 10\%$ en $P$, $C_t$, $\phi$, $i$.

---
