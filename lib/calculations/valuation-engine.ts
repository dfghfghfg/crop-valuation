export interface BlockData {
  // Block identity
  block_id: string
  block_area_ha: number
  crop: string
  variety?: string
  planting_date: Date
  density_spacing?: string

  // Yield source
  yield_source: "measured" | "modeled"
  production_tons_period?: number
  period_days?: number
  evidence_uploads?: string[]
  age_yield_curve_id?: string
  realization_factor?: number

  // Price
  price_farmgate_cop_per_kg: number
  price_source_note?: string

  // Costs
  cost_source: "standard_template" | "custom_entered"
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

  // Improductive phase (if age <= 3)
  cumulative_outlays_to_date_cop?: number
  inp_factor?: number

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
  phase: "improductive" | "productive"
  pe_flag: "PE+" | "PE-"

  // Valuation
  value_block_cop: number
  value_block_cop_per_ha: number

  // Business indicators
  npv?: number
  irr?: number
  break_even_year?: number

  // Confidence tier
  tier: "A" | "B" | "C"
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
  overall_tier: "A" | "B" | "C"
  summary_flags: string[]
}

// Standard yield curves (simplified - in production would come from database)
const YIELD_CURVES: Record<string, Record<number, number>> = {
  oil_palm_standard: {
    0: 0,
    1: 0,
    2: 0,
    3: 2000,
    4: 8000,
    5: 12000,
    6: 15000,
    7: 18000,
    8: 20000,
    9: 20000,
    10: 19000,
    11: 18000,
    12: 17000,
    13: 16000,
    14: 15000,
    15: 14000,
  },
}

// Standard cost templates (simplified)
const COST_TEMPLATES: Record<string, Record<string, number>> = {
  oil_palm_standard: {
    land_rent_cop_per_ha: 500000,
    fertilizers_cop_per_ha: 1200000,
    crop_protection_cop_per_ha: 300000,
    propagation_material_cop_per_ha: 100000,
    labor_cop_per_ha: 2000000,
    irrigation_energy_cop_per_ha: 200000,
    maintenance_upkeep_cop_per_ha: 400000,
    harvest_cop_per_ha: 800000,
    transport_logistics_cop_per_ha: 300000,
    services_contracts_cop_per_ha: 150000,
    admin_overheads_cop_per_ha: 250000,
  },
}

export interface CalculationLookups {
  yieldCurves?: Record<string, Record<number, number>>
  costTemplates?: Record<string, Record<string, number>>
}

export class ValuationEngine {
  static calculateBlockValuation(
    block: BlockData,
    valuationDate: Date,
    lookups?: CalculationLookups,
  ): BlockValuationResult {
    const steps: string[] = []
    const qaFlags: string[] = []

    // 1) Derived fundamentals
    const ageYears = Math.floor((valuationDate.getTime() - block.planting_date.getTime()) / (365 * 24 * 60 * 60 * 1000))
    steps.push(
      `Age calculation: ${ageYears} years from planting date ${block.planting_date.toISOString().split("T")[0]}`,
    )

    // Calculate yield
    let yieldTHa: number
    if (block.yield_source === "measured") {
      if (!block.production_tons_period || !block.period_days) {
        qaFlags.push("Missing production data for measured yield")
        yieldTHa = 0
      } else {
        yieldTHa = (block.production_tons_period * 1000) / (block.block_area_ha * (block.period_days / 365))
        steps.push(
          `Measured yield: ${block.production_tons_period} tons over ${block.period_days} days = ${yieldTHa.toFixed(0)} kg/ha`,
        )
      }
    } else {
      const curveId = block.age_yield_curve_id || "oil_palm_standard"
      const baseYield = (lookups?.yieldCurves?.[curveId] || YIELD_CURVES[curveId])?.[ageYears] || 0
      const realizationFactor = block.realization_factor || 1.0
      yieldTHa = baseYield * realizationFactor
      steps.push(`Modeled yield: ${baseYield} kg/ha × ${realizationFactor} = ${yieldTHa.toFixed(0)} kg/ha`)
    }

    // Calculate costs
    let directCostsPerHa: number
    if (block.cost_source === "standard_template") {
      const templateId = block.cost_template_id || "oil_palm_standard"
      const template = (lookups?.costTemplates?.[templateId] || COST_TEMPLATES[templateId])
      if (!template) {
        qaFlags.push("Invalid cost template ID")
        directCostsPerHa = 0
      } else {
        directCostsPerHa = Object.values(template).reduce((sum, cost) => sum + cost, 0)
        steps.push(`Template costs: ${directCostsPerHa.toLocaleString()} COP/ha from template ${templateId}`)
      }
    } else {
      directCostsPerHa = [
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
      steps.push(`Custom costs: ${directCostsPerHa.toLocaleString()} COP/ha (sum of 11 cost groups)`)
    }

    // Financial calculations
    const grossIncome = yieldTHa * block.price_farmgate_cop_per_kg * block.block_area_ha
    const finCost = block.financed_amount_cop * block.ea_rate
    const totalInvest = directCostsPerHa * block.block_area_ha + finCost
    const netIncome = grossIncome - totalInvest

    steps.push(
      `Gross income: ${yieldTHa.toFixed(0)} kg/ha × ${block.price_farmgate_cop_per_kg} COP/kg × ${block.block_area_ha} ha = ${grossIncome.toLocaleString()} COP`,
    )
    steps.push(
      `Financial cost: ${block.financed_amount_cop.toLocaleString()} COP × ${(block.ea_rate * 100).toFixed(1)}% = ${finCost.toLocaleString()} COP`,
    )
    steps.push(`Total investment: ${totalInvest.toLocaleString()} COP`)
    steps.push(
      `Net income: ${grossIncome.toLocaleString()} - ${totalInvest.toLocaleString()} = ${netIncome.toLocaleString()} COP`,
    )

    // 2) Break-even analysis (simplified - assumes current period data)
    const cumInflows = grossIncome // Simplified for current period
    const cumOutflows = totalInvest + (block.cumulative_outlays_to_date_cop || 0)
    const breakevenReached = cumInflows >= cumOutflows

    // 3) Phase classification
    const phase: "improductive" | "productive" = ageYears <= 3 ? "improductive" : "productive"
    const peFlag: "PE+" | "PE-" = breakevenReached ? "PE+" : "PE-"

    steps.push(`Phase: ${phase} (age ${ageYears} years)`)
    steps.push(
      `Break-even: ${peFlag} (cumulative inflows ${cumInflows.toLocaleString()} vs outflows ${cumOutflows.toLocaleString()})`,
    )

    // 4) Valuation rules
    let valueBlock: number

    if (phase === "improductive") {
      // Case A: Improductive (yrs 0-3)
      const avgNetIncomeImprod = netIncome // Simplified - would need historical data
      const inpFactor = block.inp_factor || 0.4
      const cumulativeOutlays = block.cumulative_outlays_to_date_cop || totalInvest
      valueBlock = cumulativeOutlays + inpFactor * avgNetIncomeImprod
      steps.push(
        `Improductive valuation: ${cumulativeOutlays.toLocaleString()} + (${inpFactor} × ${avgNetIncomeImprod.toLocaleString()}) = ${valueBlock.toLocaleString()} COP`,
      )
    } else if (peFlag === "PE-") {
      // Case B: Productive & PE- (below break-even)
      valueBlock = netIncome + totalInvest
      steps.push(
        `Productive PE- valuation: ${netIncome.toLocaleString()} + ${totalInvest.toLocaleString()} = ${valueBlock.toLocaleString()} COP`,
      )
    } else {
      // Case C: Productive & PE+ (above break-even)
      valueBlock = netIncome
      steps.push(`Productive PE+ valuation: ${netIncome.toLocaleString()} COP`)
    }

    const valueBlockPerHa = valueBlock / block.block_area_ha

    // 5) Business indicators (simplified NPV calculation)
    const npv = netIncome / (1 + block.dnp_discount_rate)
    steps.push(
      `NPV (1-year): ${netIncome.toLocaleString()} / (1 + ${(block.dnp_discount_rate * 100).toFixed(1)}%) = ${npv.toLocaleString()} COP`,
    )

    // 6) Confidence tiering
    let tier: "A" | "B" | "C" = "B"
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
      value_block_cop: valueBlock,
      value_block_cop_per_ha: valueBlockPerHa,
      npv,
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
    const parcelValuePerHa = parcelValue / totalArea

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
