// Type aliases for union types
type YieldSource = "measured" | "modeled"
type CostSource = "standard_template" | "custom_entered"
type BlockPhase = "improductive" | "productive"
type PEFlag = "PE+" | "PE-"
type ConfidenceTier = "A" | "B" | "C"

export interface BlockData {
  // Block identity
  block_id: string
  block_area_ha: number
  crop: string
  variety?: string
  planting_date: Date
  density_spacing?: string

  // Yield source
  yield_source: YieldSource
  production_tons_period?: number
  period_days?: number
  evidence_uploads?: string[]
  age_yield_curve_id?: string
  realization_factor?: number

  // Price
  price_farmgate_cop_per_kg: number
  price_source_note?: string

  // Costs
  cost_source: CostSource
  cost_template_id?: string
  land_rent_cop_per_ha?: number
  fertilizers_cop_per_ha?: number
  crop_protection_cop_per_ha?: number
  propagation_material_cop_per_ha?: number
  labor_cop_per_ha?: number
  irrigation_energy_cop_per_ha?: number
  maintenance_upkeep_cop_per_ha?: number
  harvest_cop_per_ha?: number
  transport_logistics_cop_per_ha?: number
  services_contracts_cop_per_ha?: number
  admin_overheads_cop_per_ha?: number

  // Financial
  financed_amount_cop: number
  ea_rate: number

  // Improductive phase parameters
  cumulative_outlays_to_date_cop?: number
  inp_factor?: number
  improductive_years?: number

  // Discount & metadata
  dnp_discount_rate: number
  notes?: string
}

export interface ParcelData {
  valuation_asof_date: Date
  parcel_id: string
  operator_name?: string
  region: string
  total_parcel_area_ha: number
  blocks: BlockData[]
}

export interface BlockValuationResult {
  // Input data
  block_id: string
  block_area_ha: number

  // Derived fundamentals
  age_years_t: number
  yield_t_ha: number // kg/ha
  direct_costs_cop_per_ha: number
  gross_income_cop: number
  fin_cost_cop: number
  total_invest_cop: number
  net_income_cop: number

  // Break-even & phase
  cum_inflows_to_t: number
  cum_outflows_to_t: number
  breakeven_reached: boolean
  phase: BlockPhase
  pe_flag: PEFlag

  // Valuation
  value_block_cop: number
  value_block_cop_per_ha: number

  // Business indicators
  npv?: number
  irr?: number
  break_even_year?: number

  // Confidence tier
  tier: ConfidenceTier
  qa_flags: string[]

  // Explanation
  calculation_steps: string[]
}

export interface ParcelValuationResult {
  parcel_id: string
  valuation_asof_date: Date
  parcel_value_cop: number
  parcel_value_cop_per_ha: number
  blocks: BlockValuationResult[]
  overall_tier: ConfidenceTier
  summary_flags: string[]
}

export interface CalculationLookups {
  yieldCurves?: Record<string, Record<number, number>>
  costTemplates?: Record<string, Record<string, number>>
  costCurves?: Record<string, Record<number, number>>
}

export class ValuationEngine {
  static calculateBlockValuation(
    block: BlockData,
    valuationDate: Date,
    lookups?: CalculationLookups,
  ): BlockValuationResult {
    const steps: string[] = []
    const qaFlags: string[] = []

    const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000
    const ageYears = Math.max(
      0,
      Math.floor((valuationDate.getTime() - block.planting_date.getTime()) / YEAR_IN_MS),
    )
    steps.push(
      `Age calculation: ${ageYears} years from planting date ${block.planting_date
        .toISOString()
        .split("T")[0]}`,
    )

    if (!block.block_area_ha || block.block_area_ha <= 0) {
      qaFlags.push("Block area must be greater than zero")
    }

    const realizationFactor = block.realization_factor || 1.0

    const yieldCurve =
      block.age_yield_curve_id && lookups?.yieldCurves
        ? lookups.yieldCurves[block.age_yield_curve_id]
        : undefined

    let yieldTHa: number

    if (block.yield_source === "measured") {
      if (!block.production_tons_period || !block.period_days || !block.block_area_ha) {
        qaFlags.push("Missing production data for measured yield")
        yieldTHa = 0
      } else {
        const effectiveDays = block.period_days / 365
        if (effectiveDays <= 0) {
          qaFlags.push("Invalid period days for measured yield")
          yieldTHa = 0
        } else {
          yieldTHa = (block.production_tons_period * 1000) / (block.block_area_ha * effectiveDays)
          steps.push(
            `Measured yield: ${block.production_tons_period} tons over ${block.period_days} days = ${yieldTHa.toFixed(
              0,
            )} kg/ha`,
          )
        }
      }
    } else {
      const perAge = yieldCurve
      if (!perAge) {
        qaFlags.push("Missing age-yield curve data for modeled yield")
        yieldTHa = 0
      } else {
        const baseYield = perAge[ageYears] ?? 0
        yieldTHa = baseYield * realizationFactor
        steps.push(`Modeled yield: ${baseYield} kg/ha x ${realizationFactor} = ${yieldTHa.toFixed(0)} kg/ha`)
      }
    }

    const modeledYieldCurve = block.yield_source === "modeled" ? yieldCurve : undefined
    const measuredYieldForProjection = block.yield_source === "measured" ? yieldTHa : undefined

    let earliestPositiveYieldAge: number | undefined
    if (modeledYieldCurve) {
      const positiveAges = Object.entries(modeledYieldCurve)
        .map(([ageKey, value]) => {
          const ageNumber = Number(ageKey)
          if (!Number.isFinite(ageNumber) || Number.isNaN(value) || value <= 0) {
            return undefined
          }
          return ageNumber
        })
        .filter((age): age is number => age !== undefined)
      if (positiveAges.length > 0) {
        earliestPositiveYieldAge = Math.min(...positiveAges)
      }
    }

    if (typeof block.improductive_years === "number" && Number.isFinite(block.improductive_years)) {
      earliestPositiveYieldAge = block.improductive_years
    }

    const getYieldPerHaForAge = (age: number): number => {
      if (block.yield_source === "measured") {
        return measuredYieldForProjection ?? 0
      }
      if (!modeledYieldCurve) return 0
      const base = modeledYieldCurve[age]
      if (typeof base !== "number" || Number.isNaN(base)) return 0
      return base * realizationFactor
    }

    const customCostPerHa = [
      block.land_rent_cop_per_ha || 0,
      block.fertilizers_cop_per_ha || 0,
      block.crop_protection_cop_per_ha || 0,
      block.propagation_material_cop_per_ha || 0,
      block.labor_cop_per_ha || 0,
      block.irrigation_energy_cop_per_ha || 0,
      block.maintenance_upkeep_cop_per_ha || 0,
      block.harvest_cop_per_ha || 0,
      block.transport_logistics_cop_per_ha || 0,
      block.services_contracts_cop_per_ha || 0,
      block.admin_overheads_cop_per_ha || 0,
    ].reduce((sum, cost) => sum + cost, 0)

    const costTemplate =
      block.cost_template_id && lookups?.costTemplates
        ? lookups.costTemplates[block.cost_template_id]
        : undefined

    const templateCostPerHa = costTemplate
      ? Object.values(costTemplate).reduce((sum, cost) => sum + cost, 0)
      : undefined

    const findCostCurve = (): { id: string; curve: Record<number, number> } | undefined => {
      if (!lookups?.costCurves) return undefined
      const curveRef = block.age_yield_curve_id
      const candidates = new Set<string>()
      if (curveRef) {
        candidates.add(curveRef)
        candidates.add(curveRef.replace(/[-\s]/g, "_"))
        const normalized = curveRef.toLowerCase()
        if (normalized.includes("oxg")) {
          candidates.add("oil_palm_cost_oxg")
        }
        if (normalized.includes("eguinensis") || normalized.includes("eguine") || normalized.includes("palma")) {
          candidates.add("oil_palm_cost_palmaeguinensis")
          candidates.add("eguinensis_prueba")
          candidates.add("eguinensis_prueba_cost")
        }
      }
      if (block.cost_template_id) {
        candidates.add(block.cost_template_id)
        candidates.add(block.cost_template_id.replace(/[-\s]/g, "_"))
      }
      for (const candidate of candidates) {
        const direct = lookups.costCurves[candidate]
        if (direct) return { id: candidate, curve: direct }
        const match = Object.entries(lookups.costCurves).find(
          ([existingId]) => existingId.toLowerCase() === candidate.toLowerCase(),
        )
        if (match) {
          return { id: match[0], curve: match[1] }
        }
      }
      return undefined
    }

    const costCurveCandidate = findCostCurve()

    let missingCostFlagged = false
    const resolveCostForAge = (age: number): { value: number; source: string } => {
      if (block.cost_source === "standard_template") {
        if (costCurveCandidate) {
          const raw = costCurveCandidate.curve[age]
          if (typeof raw === "number" && !Number.isNaN(raw)) {
            return { value: raw, source: `curva ${costCurveCandidate.id} (edad ${age})` }
          }
          const availableAges = Object.keys(costCurveCandidate.curve)
            .map((key) => Number(key))
            .filter((num) => !Number.isNaN(num))
            .sort((a, b) => a - b)
          if (availableAges.length > 0) {
            const nearest = availableAges.reduce((prev, curr) =>
              Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev,
              availableAges[0]
            )
            const nearestVal = costCurveCandidate.curve[nearest]
            if (typeof nearestVal === "number" && !Number.isNaN(nearestVal)) {
              return { value: nearestVal, source: `curva ${costCurveCandidate.id} (edad ${nearest})` }
            }
          }
        }
        if (typeof templateCostPerHa === "number" && !Number.isNaN(templateCostPerHa)) {
          return {
            value: templateCostPerHa,
            source: `plantilla ${block.cost_template_id ?? "predeterminada"}`,
          }
        }
        if (!missingCostFlagged) {
          qaFlags.push("Missing cost data for projections")
          missingCostFlagged = true
        }
        return { value: 0, source: "sin datos de costos" }
      }
      return { value: customCostPerHa, source: "costos personalizados" }
    }

    const currentCostInfo = resolveCostForAge(ageYears)
    const directCostsPerHa = currentCostInfo.value
    steps.push(`Cost reference: ${currentCostInfo.source} = ${directCostsPerHa.toLocaleString()} COP/ha`)

    const blockArea = block.block_area_ha || 0
    const grossIncome = yieldTHa * block.price_farmgate_cop_per_kg * blockArea
    const finCost = block.financed_amount_cop * block.ea_rate
    const totalInvest = directCostsPerHa * blockArea + finCost
    const netIncome = grossIncome - totalInvest

    steps.push(
      `Gross income: ${yieldTHa.toFixed(0)} kg/ha x ${block.price_farmgate_cop_per_kg} COP/kg x ${blockArea} ha = ${grossIncome.toLocaleString()} COP`,
    )
    steps.push(
      `Financial cost: ${block.financed_amount_cop.toLocaleString()} COP x ${(block.ea_rate * 100).toFixed(1)}% = ${finCost.toLocaleString()} COP`,
    )
    steps.push(`Total investment: ${totalInvest.toLocaleString()} COP`)
    steps.push(
      `Net income: ${grossIncome.toLocaleString()} - ${totalInvest.toLocaleString()} = ${netIncome.toLocaleString()} COP`,
    )

    const cumInflows = grossIncome
    const cumOutflows = totalInvest + (block.cumulative_outlays_to_date_cop || 0)
    const breakevenReached = cumInflows >= cumOutflows

    const hasCurveThreshold = earliestPositiveYieldAge !== undefined
    const meetsCurveThreshold = earliestPositiveYieldAge !== undefined ? ageYears >= earliestPositiveYieldAge : false
    const hasPositiveYieldOrNet = yieldTHa > 0 || netIncome > 0

    const isProductive = hasCurveThreshold ? meetsCurveThreshold : hasPositiveYieldOrNet

    const phase: BlockPhase = isProductive ? "productive" : "improductive"
    const peFlag: PEFlag = breakevenReached ? "PE+" : "PE-"

    steps.push(`Phase: ${phase} (age ${ageYears} years, yield ${yieldTHa.toFixed(0)} kg/ha)`)
    steps.push(
      `Break-even: ${peFlag} (cumulative inflows ${cumInflows.toLocaleString()} vs outflows ${cumOutflows.toLocaleString()})`,
    )

    const discountRate = block.dnp_discount_rate ?? 0
    const safeDiscountRate = discountRate > -1 ? discountRate : 0

    let blockNPV: number

    if (phase === "improductive") {
      const cumulativeOutlaysForNPV = block.cumulative_outlays_to_date_cop ?? totalInvest
      blockNPV = cumulativeOutlaysForNPV
      steps.push(
        `Improductive valuation (VPN): inversión acumulada ${cumulativeOutlaysForNPV.toLocaleString()} COP`,
      )
    } else {
      let cycleEndAge = ageYears
      if (modeledYieldCurve) {
        const ages = Object.keys(modeledYieldCurve)
          .map((key) => Number(key))
          .filter((num) => !Number.isNaN(num))
        if (ages.length > 0) {
          const maxFromCurve = Math.max(...ages)
          if (Number.isFinite(maxFromCurve)) {
            cycleEndAge = Math.max(cycleEndAge, maxFromCurve)
          }
        }
      }
      if (costCurveCandidate) {
        const costAges = Object.keys(costCurveCandidate.curve)
          .map((key) => Number(key))
          .filter((num) => !Number.isNaN(num))
        if (costAges.length > 0) {
          const maxCostAge = Math.max(...costAges)
          if (Number.isFinite(maxCostAge)) {
            cycleEndAge = Math.max(cycleEndAge, maxCostAge)
          }
        }
      }

      const remainingYears = Math.max(0, cycleEndAge - ageYears)
      const futureFlows: number[] = []

      for (let offset = 1; offset <= remainingYears; offset++) {
        const projectedAge = ageYears + offset
        const projectedYieldPerHa = getYieldPerHaForAge(projectedAge)
        const revenue = projectedYieldPerHa * block.price_farmgate_cop_per_kg * blockArea
        const costInfo = resolveCostForAge(projectedAge)
        const directCosts = costInfo.value * blockArea
        const netCash = revenue - directCosts
        futureFlows.push(netCash)
        steps.push(
          `Flujo año ${offset} (edad ${projectedAge}): ingresos ${revenue.toLocaleString()} - costos ${directCosts.toLocaleString()} = ${netCash.toLocaleString()} COP`,
        )
      }

      if (futureFlows.length === 0) {
        steps.push("No remaining productive years found; future flows omitted.")
      }

      const discountedCurrentNet = netIncome / Math.pow(1 + safeDiscountRate, 1)
      const discountedFuture = futureFlows.reduce(
        (sum, cash, index) => sum + cash / Math.pow(1 + safeDiscountRate, index + 2),
        0,
      )
      steps.push(
        `VPN futuros (${futureFlows.length} años) a ${(safeDiscountRate * 100).toFixed(2)}% = ${discountedFuture.toLocaleString()} COP`,
      )
      blockNPV = discountedCurrentNet + discountedFuture
      steps.push(
        `Productive valuation (VPN): neto descontado ${discountedCurrentNet.toLocaleString()} + VPN futuros ${discountedFuture.toLocaleString()} = ${blockNPV.toLocaleString()} COP`,
      )
    }

    const valueBlockPerHa = block.block_area_ha > 0 ? blockNPV / block.block_area_ha : 0

    let tier: ConfidenceTier = "B"
    if (block.yield_source === "measured" && block.evidence_uploads && block.evidence_uploads.length > 0) {
      tier = "A"
    } else if (!block.price_farmgate_cop_per_kg || directCostsPerHa === 0) {
      tier = "C"
      qaFlags.push("Missing critical pricing or cost data")
    }

    return {
      block_id: block.block_id,
      block_area_ha: block.block_area_ha,
      age_years_t: ageYears,
      yield_t_ha: yieldTHa,
      direct_costs_cop_per_ha: directCostsPerHa,
      gross_income_cop: grossIncome,
      fin_cost_cop: finCost,
      total_invest_cop: totalInvest,
      net_income_cop: netIncome,
      cum_inflows_to_t: cumInflows,
      cum_outflows_to_t: cumOutflows,
      breakeven_reached: breakevenReached,
      phase,
      pe_flag: peFlag,
      value_block_cop: blockNPV,
      value_block_cop_per_ha: valueBlockPerHa,
      npv: blockNPV,
      tier,
      qa_flags: qaFlags,
      calculation_steps: steps,
    }
  }


  static calculateParcelValuation(
    parcel: ParcelData,
    lookups?: CalculationLookups,
  ): ParcelValuationResult {
    const blockResults = parcel.blocks.map((block) =>
      this.calculateBlockValuation(block, parcel.valuation_asof_date, lookups),
    )

    const parcelValue = blockResults.reduce((sum, block) => sum + block.value_block_cop, 0)
    const totalArea = blockResults.reduce((sum, block) => sum + block.block_area_ha, 0)
    const parcelValuePerHa = totalArea > 0 ? parcelValue / totalArea : 0

    // Overall tier is the lowest tier among all blocks
    const overallTier = blockResults.reduce(
      (lowest, block) => {
        if (block.tier === "C" || lowest === "C") return "C"
        if (block.tier === "B" || lowest === "B") return "B"
        return "A"
      },
      "A" as "A" | "B" | "C",
    )

    const summaryFlags = blockResults.flatMap((block) => block.qa_flags)

    return {
      parcel_id: parcel.parcel_id,
      valuation_asof_date: parcel.valuation_asof_date,
      parcel_value_cop: parcelValue,
      parcel_value_cop_per_ha: parcelValuePerHa,
      blocks: blockResults,
      overall_tier: overallTier,
      summary_flags: summaryFlags,
    }
  }
}


