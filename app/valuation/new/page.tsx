"use client"

import { useState } from "react"
import { ParcelHeaderForm } from "@/components/parcel-header-form"
import { BlockEntryForm } from "@/components/block-entry-form"
import { ValuationCalculator } from "@/components/valuation-calculator"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { ParcelData, ParcelValuationResult } from "@/lib/calculations/valuation-engine"
import type { Json, Database } from "@/types/database"
import { Header } from "@/components/header"

interface ParcelHeaderData {
  valuationAsOfDate: string
  parcelId: string
  operatorName: string
  region: string
  totalParcelAreaHa: string
}

interface BlockData {
  blockId: string
  blockAreaHa: string
  crop: string
  variety: string
  plantingDate: string
  densitySpacing: string
  yieldSource: "measured" | "modeled" | ""
  productionTonsPeriod: string
  periodDays: string
  evidenceUploads: string[]
  ageYieldCurveId: string
  realizationFactor: string
  priceFarmgateCopPerKg: string
  priceSourceNote: string
  costSource: "standard_template" | "custom_entered" | ""
  costTemplateId: string
  landRentCopPerHa: string
  fertilizersCopPerHa: string
  cropProtectionCopPerHa: string
  propagationMaterialCopPerHa: string
  laborCopPerHa: string
  irrigationEnergyCopPerHa: string
  maintenanceUpkeepCopPerHa: string
  harvestCopPerHa: string
  transportLogisticsCopPerHa: string
  servicesContractsCopPerHa: string
  adminOverheadsCopPerHa: string
  financedAmountCop: string
  eaRate: string
  cumulativeOutlaysToDateCop: string
  inpFactor: string
  dnpDiscountRate: string
  notes: string
}

export default function NewValuationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"parcel-form" | "block-form" | "calculation">("parcel-form")
  const [parcelData, setParcelData] = useState<ParcelHeaderData | null>(null)
  const [blockData, setBlockData] = useState<BlockData[] | null>(null)
  const [savedParcelId, setSavedParcelId] = useState<string | null>(null)
  const [blocksSaved, setBlocksSaved] = useState<boolean>(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleParcelSubmit = async (data: ParcelHeaderData) => {
    setParcelData(data)
    console.log("Datos de parcela enviados:", data)

    const { data: userRes, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userRes.user) {
      console.error("Error getting user:", userErr)
      throw new Error("User authentication required")
    }

    try {
      const { data: existing, error: findErr } = await supabase
        .from("parcels")
        .select("id")
        .eq("parcel_id", data.parcelId)
        .single()

      if (!findErr && existing) {
        setSavedParcelId(existing.id)
        const { error: updErr } = await supabase
          .from("parcels")
          .update({
            operator_name: data.operatorName || null,
            region: data.region,
            total_parcel_area_ha: String(Number.parseFloat(data.totalParcelAreaHa)),
            valuation_asof_date: data.valuationAsOfDate,
          })
          .eq("id", existing.id)
        if (updErr) console.error("Error updating parcel:", updErr)
        else console.log("Parcel updated:", existing.id)
      } else {
        const { data: created, error: insErr } = await supabase
          .from("parcels")
          .insert({
            parcel_id: data.parcelId,
            operator_name: data.operatorName || null,
            region: data.region,
            total_parcel_area_ha: String(Number.parseFloat(data.totalParcelAreaHa)),
            valuation_asof_date: data.valuationAsOfDate,
            user_id: userRes.user.id,
          })
          .select("id")
          .single()
        if (insErr) console.error("Error creating parcel:", insErr)
        else if (created) {
          setSavedParcelId(created.id)
          console.log("Parcel created:", created.id)
        }
      }
    } catch (e) {
      console.error("Parcel upsert failed:", e)
    }

    setCurrentStep("block-form")
  }

  const handleBlockSubmit = async (blocks: BlockData[]) => {
    setBlockData(blocks)
    console.log("Datos de bloques enviados:", blocks)

    if (!savedParcelId) {
      console.error("No saved parcel ID; cannot persist blocks yet")
      setCurrentStep("calculation")
      return
    }

    // Clear previous blocks for this parcel to avoid duplicates
    try {
      await supabase.from("blocks").delete().eq("parcel_id", savedParcelId)
    } catch (e) {
      console.warn("Could not clear previous blocks:", e)
    }

    const blocksToInsert: Database["public"]["Tables"]["blocks"]["Insert"][] = blocks.map((block) => ({
      parcel_id: savedParcelId,
      block_id: block.blockId,
      block_area_ha: String(Number.parseFloat(block.blockAreaHa)),
      crop: block.crop,
      variety: block.variety || null,
      planting_date: block.plantingDate,
      density_spacing: block.densitySpacing || null,
      yield_source:
        block.yieldSource === "measured" || block.yieldSource === "modeled"
          ? block.yieldSource
          : "measured",
      production_tons_period: block.productionTonsPeriod
        ? String(Number.parseFloat(block.productionTonsPeriod))
        : null,
      period_days: block.periodDays ? Number.parseInt(block.periodDays) : null,
      evidence_uploads: block.evidenceUploads,
      age_yield_curve_id: block.ageYieldCurveId || null,
      realization_factor: block.realizationFactor ? String(Number.parseFloat(block.realizationFactor)) : null,
      price_farmgate_cop_per_kg: String(Number.parseFloat(block.priceFarmgateCopPerKg)),
      price_source_note: block.priceSourceNote || null,
      cost_source:
        block.costSource === "standard_template" || block.costSource === "custom_entered"
          ? block.costSource
          : "standard_template",
      cost_template_id: block.costTemplateId || null,
      land_rent_cop_per_ha: block.landRentCopPerHa ? String(Number.parseFloat(block.landRentCopPerHa)) : null,
      fertilizers_cop_per_ha: block.fertilizersCopPerHa ? String(Number.parseFloat(block.fertilizersCopPerHa)) : null,
      crop_protection_cop_per_ha: block.cropProtectionCopPerHa
        ? String(Number.parseFloat(block.cropProtectionCopPerHa))
        : null,
      propagation_material_cop_per_ha: block.propagationMaterialCopPerHa
        ? String(Number.parseFloat(block.propagationMaterialCopPerHa))
        : null,
      labor_cop_per_ha: block.laborCopPerHa ? String(Number.parseFloat(block.laborCopPerHa)) : null,
      irrigation_energy_cop_per_ha: block.irrigationEnergyCopPerHa
        ? String(Number.parseFloat(block.irrigationEnergyCopPerHa))
        : null,
      maintenance_upkeep_cop_per_ha: block.maintenanceUpkeepCopPerHa
        ? String(Number.parseFloat(block.maintenanceUpkeepCopPerHa))
        : null,
      harvest_cop_per_ha: block.harvestCopPerHa ? String(Number.parseFloat(block.harvestCopPerHa)) : null,
      transport_logistics_cop_per_ha: block.transportLogisticsCopPerHa
        ? String(Number.parseFloat(block.transportLogisticsCopPerHa))
        : null,
      services_contracts_cop_per_ha: block.servicesContractsCopPerHa
        ? String(Number.parseFloat(block.servicesContractsCopPerHa))
        : null,
      admin_overheads_cop_per_ha: block.adminOverheadsCopPerHa
        ? String(Number.parseFloat(block.adminOverheadsCopPerHa))
        : null,
      financed_amount_cop: String(Number.parseFloat(block.financedAmountCop)),
      ea_rate: String(Number.parseFloat(block.eaRate)),
      cumulative_outlays_to_date_cop: block.cumulativeOutlaysToDateCop
        ? String(Number.parseFloat(block.cumulativeOutlaysToDateCop))
        : null,
      inp_factor: block.inpFactor ? String(Number.parseFloat(block.inpFactor)) : null,
      dnp_discount_rate: String(Number.parseFloat(block.dnpDiscountRate)),
      notes: block.notes || null,
    }))

    const { error: blocksError } = await supabase.from("blocks").insert(blocksToInsert)
    if (blocksError) {
      console.error("Error saving blocks:", blocksError)
    } else {
      setBlocksSaved(true)
      console.log("Blocks persisted for parcel:", savedParcelId)
    }

    setCurrentStep("calculation")
  }

  const handleCalculationComplete = async (result: ParcelValuationResult) => {
    try {
      const newId = await saveNewValuation(result)
      router.push(`/valuation/view/${newId}`)
    } catch (error) {
      console.error("Error saving valuation:", error)
      const resultId = Date.now().toString()
      localStorage.setItem(
        `valuation-${resultId}`,
        JSON.stringify({
          result,
          parcelData,
          blockData,
          createdAt: new Date().toISOString(),
        }),
      )
      router.push(`/valuation/view/${resultId}`)
    }
  }

  const saveNewValuation = async (result: ParcelValuationResult): Promise<string> => {
    if (!parcelData || !blockData) throw new Error("Missing data")

    console.log("Saving new valuation...")
    console.log("Result structure:", JSON.stringify(result, null, 2))

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      throw new Error("User authentication required")
    }

    console.log("Current user ID:", user.id)

    let parcelUuid: string

    if (savedParcelId) {
      console.log("Using existing parcel UUID:", savedParcelId)
      parcelUuid = savedParcelId

      // Update existing parcel with new data
      const { error: updateError } = await supabase
        .from("parcels")
        .update({
          operator_name: parcelData.operatorName || null,
          region: parcelData.region,
          total_parcel_area_ha: String(Number.parseFloat(parcelData.totalParcelAreaHa)),
          valuation_asof_date: parcelData.valuationAsOfDate,
        })
        .eq("id", savedParcelId)

      if (updateError) {
        console.error("Error updating existing parcel:", updateError)
        throw updateError
      }

      console.log("Existing parcel updated successfully")
    } else {
      // Create new parcel
      const { data: parcel, error: parcelError } = await supabase
        .from("parcels")
        .insert({
          parcel_id: parcelData.parcelId, // User-provided identifier
          operator_name: parcelData.operatorName || null,
          region: parcelData.region,
          total_parcel_area_ha: String(Number.parseFloat(parcelData.totalParcelAreaHa)),
          valuation_asof_date: parcelData.valuationAsOfDate,
          user_id: user.id,
        })
        .select()
        .single()

      if (parcelError) {
        console.error("Error saving parcel:", parcelError)
        if (parcelError.code === "23505") {
          throw new Error("Parcel ID already exists. Please use a different ID.")
        }
        throw parcelError
      }

      parcelUuid = parcel.id
      console.log("New parcel saved with UUID:", parcel.id)
    }

    const blocksToInsert: Database["public"]["Tables"]["blocks"]["Insert"][] = blockData.map((block) => ({
      parcel_id: parcelUuid, // Use parcel UUID, not user-provided ID
      block_id: block.blockId, // User-provided block name/identifier
      block_area_ha: String(Number.parseFloat(block.blockAreaHa)),
      crop: block.crop,
      variety: block.variety || null,
      planting_date: block.plantingDate,
      density_spacing: block.densitySpacing || null,
      yield_source:
        block.yieldSource === "measured" || block.yieldSource === "modeled"
          ? block.yieldSource
          : "measured",
      production_tons_period: block.productionTonsPeriod
        ? String(Number.parseFloat(block.productionTonsPeriod))
        : null,
      period_days: block.periodDays ? Number.parseInt(block.periodDays) : null,
      evidence_uploads: block.evidenceUploads,
      age_yield_curve_id: block.ageYieldCurveId || null,
      realization_factor: block.realizationFactor ? String(Number.parseFloat(block.realizationFactor)) : null,
      price_farmgate_cop_per_kg: String(Number.parseFloat(block.priceFarmgateCopPerKg)),
      price_source_note: block.priceSourceNote || null,
      cost_source:
        block.costSource === "standard_template" || block.costSource === "custom_entered"
          ? block.costSource
          : "standard_template",
      cost_template_id: block.costTemplateId || null,
      land_rent_cop_per_ha: block.landRentCopPerHa ? String(Number.parseFloat(block.landRentCopPerHa)) : null,
      fertilizers_cop_per_ha: block.fertilizersCopPerHa ? String(Number.parseFloat(block.fertilizersCopPerHa)) : null,
      crop_protection_cop_per_ha: block.cropProtectionCopPerHa
        ? String(Number.parseFloat(block.cropProtectionCopPerHa))
        : null,
      propagation_material_cop_per_ha: block.propagationMaterialCopPerHa
        ? String(Number.parseFloat(block.propagationMaterialCopPerHa))
        : null,
      labor_cop_per_ha: block.laborCopPerHa ? String(Number.parseFloat(block.laborCopPerHa)) : null,
      irrigation_energy_cop_per_ha: block.irrigationEnergyCopPerHa
        ? String(Number.parseFloat(block.irrigationEnergyCopPerHa))
        : null,
      maintenance_upkeep_cop_per_ha: block.maintenanceUpkeepCopPerHa
        ? String(Number.parseFloat(block.maintenanceUpkeepCopPerHa))
        : null,
      harvest_cop_per_ha: block.harvestCopPerHa ? String(Number.parseFloat(block.harvestCopPerHa)) : null,
      transport_logistics_cop_per_ha: block.transportLogisticsCopPerHa
        ? String(Number.parseFloat(block.transportLogisticsCopPerHa))
        : null,
      services_contracts_cop_per_ha: block.servicesContractsCopPerHa
        ? String(Number.parseFloat(block.servicesContractsCopPerHa))
        : null,
      admin_overheads_cop_per_ha: block.adminOverheadsCopPerHa
        ? String(Number.parseFloat(block.adminOverheadsCopPerHa))
        : null,
      financed_amount_cop: String(Number.parseFloat(block.financedAmountCop)),
      ea_rate: String(Number.parseFloat(block.eaRate)),
      cumulative_outlays_to_date_cop: block.cumulativeOutlaysToDateCop
        ? String(Number.parseFloat(block.cumulativeOutlaysToDateCop))
        : null,
      inp_factor: block.inpFactor ? String(Number.parseFloat(block.inpFactor)) : null,
      dnp_discount_rate: String(Number.parseFloat(block.dnpDiscountRate)),
      notes: block.notes || null,
    }))

    let savedBlocks: { id: string; block_id: string }[] = []
    if (blocksSaved) {
      const { data: existingBlocks, error: fetchErr } = await supabase
        .from("blocks")
        .select("id, block_id")
        .eq("parcel_id", parcelUuid)
      if (fetchErr || !existingBlocks) {
        console.error("Error fetching existing blocks for results:", fetchErr)
        throw fetchErr || new Error("Missing blocks for results")
      }
      savedBlocks = existingBlocks
    } else {
      const { data: inserted, error: blocksError } = await supabase.from("blocks").insert(blocksToInsert).select()
      if (blocksError) {
        console.error("Error saving blocks:", blocksError)
        throw blocksError
      }
      savedBlocks = inserted.map((b) => ({ id: b.id, block_id: b.block_id }))
      console.log(
        "Blocks saved successfully with UUIDs:",
        inserted.map((b) => b.id),
      )
    }

    // Build results aligned by block_id
    const idByBlockId = new Map(savedBlocks.map((b) => [b.block_id, b.id]))
    const valuationResultsToInsert: Database["public"]["Tables"]["valuation_results"]["Insert"][] = blockData.map((currentBlockData, index) => {
      const blockResult = result.blocks?.[index] || null

      const plantingDate = new Date(currentBlockData.plantingDate)
      const valuationDate = new Date(parcelData.valuationAsOfDate)
      const ageYears = Math.max(
        0,
        Math.floor((valuationDate.getTime() - plantingDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      )

      const blockAreaHa = Number.parseFloat(currentBlockData.blockAreaHa)
      const yieldKgPerHa = currentBlockData.productionTonsPeriod
        ? (Number.parseFloat(currentBlockData.productionTonsPeriod) * 1000) / blockAreaHa
        : 1000 // Default yield if not provided

      const pricePerKg = Number.parseFloat(currentBlockData.priceFarmgateCopPerKg)
      const grossIncome = yieldKgPerHa * pricePerKg * blockAreaHa

      // Calculate direct costs per hectare
      const directCostsPerHa = [
        currentBlockData.landRentCopPerHa,
        currentBlockData.fertilizersCopPerHa,
        currentBlockData.cropProtectionCopPerHa,
        currentBlockData.propagationMaterialCopPerHa,
        currentBlockData.laborCopPerHa,
        currentBlockData.irrigationEnergyCopPerHa,
        currentBlockData.maintenanceUpkeepCopPerHa,
        currentBlockData.harvestCopPerHa,
        currentBlockData.transportLogisticsCopPerHa,
        currentBlockData.servicesContractsCopPerHa,
        currentBlockData.adminOverheadsCopPerHa,
      ].reduce((sum, cost) => sum + (cost ? Number.parseFloat(cost) : 0), 0)

      const totalDirectCosts = directCostsPerHa * blockAreaHa
      const financialCost =
        Number.parseFloat(currentBlockData.financedAmountCop) * (Number.parseFloat(currentBlockData.eaRate) / 100)
      const totalInvestment = Number.parseFloat(currentBlockData.financedAmountCop)
      const netIncome = grossIncome - totalDirectCosts - financialCost
      const cumulativeOutlays = currentBlockData.cumulativeOutlaysToDateCop
        ? Number.parseFloat(currentBlockData.cumulativeOutlaysToDateCop)
        : totalInvestment

      const blockUuid = idByBlockId.get(currentBlockData.blockId) as string
      return {
        block_id: blockUuid, // Use database UUID, not user-provided name
        calculation_version: "1.0",
        age_years: ageYears,
        yield_kg_per_ha: String(yieldKgPerHa),
        gross_income_cop: String(grossIncome),
        direct_costs_cop_per_ha: String(directCostsPerHa),
        fin_cost_cop: String(financialCost),
        total_invest_cop: String(totalInvestment),
        net_income_cop: String(netIncome),
        cum_inflows_to_date: String(grossIncome),
        cum_outflows_to_date: String(cumulativeOutlays),
        breakeven_reached: netIncome > 0,
        phase: (ageYears < 3 ? "improductive" : "productive"), // Use valid phase values
        pe_flag: (netIncome > 0 ? "PE+" : "PE-"), // Use valid pe_flag values
        confidence_tier: blockResult?.tier || "C", // Ensure valid confidence tier
        tier_explanation: `Confidence tier based on data quality and completeness`,
        value_block_cop: String(blockResult?.value_block_cop || Math.max(0, netIncome)), // Ensure positive value
        value_block_cop_per_ha: String(
          blockResult?.value_block_cop ? blockResult.value_block_cop / blockAreaHa : Math.max(0, netIncome) / blockAreaHa,
        ),
        npv: String(blockResult?.npv || netIncome),
        irr: String(blockResult?.irr || (netIncome > 0 ? 0.15 : 0)),
        break_even_year: netIncome > 0 ? ageYears : null,
        calculation_date: new Date().toISOString(),
        calculation_details: (result as unknown) as Json,
      }
    })

    const { error: resultsError } = await supabase.from("valuation_results").insert(valuationResultsToInsert)

    if (resultsError) {
      console.error("Error saving valuation results:", resultsError)
      throw resultsError
    }

    console.log("Valuation results saved successfully")
    return parcelUuid
  }

  const convertToParcelData = (): ParcelData | null => {
    if (!parcelData || !blockData) return null

    return {
      valuation_asof_date: new Date(parcelData.valuationAsOfDate),
      parcel_id: parcelData.parcelId,
      operator_name: parcelData.operatorName || undefined,
      region: parcelData.region,
      total_parcel_area_ha: Number.parseFloat(parcelData.totalParcelAreaHa),
      blocks: blockData.map((block) => ({
        block_id: block.blockId,
        block_area_ha: Number.parseFloat(block.blockAreaHa),
        crop: block.crop,
        variety: block.variety || undefined,
        planting_date: new Date(block.plantingDate),
        density_spacing: block.densitySpacing || undefined,
        yield_source: block.yieldSource as "measured" | "modeled",
        production_tons_period: block.productionTonsPeriod ? Number.parseFloat(block.productionTonsPeriod) : undefined,
        period_days: block.periodDays ? Number.parseInt(block.periodDays) : undefined,
        evidence_uploads: block.evidenceUploads,
        age_yield_curve_id: block.ageYieldCurveId || undefined,
        realization_factor: block.realizationFactor ? Number.parseFloat(block.realizationFactor) : undefined,
        price_farmgate_cop_per_kg: Number.parseFloat(block.priceFarmgateCopPerKg),
        price_source_note: block.priceSourceNote || undefined,
        cost_source: block.costSource as "standard_template" | "custom_entered",
        cost_template_id: block.costTemplateId || undefined,
        land_rent_cop_per_ha: block.landRentCopPerHa ? Number.parseFloat(block.landRentCopPerHa) : undefined,
        fertilizers_cop_per_ha: block.fertilizersCopPerHa ? Number.parseFloat(block.fertilizersCopPerHa) : undefined,
        crop_protection_cop_per_ha: block.cropProtectionCopPerHa
          ? Number.parseFloat(block.cropProtectionCopPerHa)
          : undefined,
        propagation_material_cop_per_ha: block.propagationMaterialCopPerHa
          ? Number.parseFloat(block.propagationMaterialCopPerHa)
          : undefined,
        labor_cop_per_ha: block.laborCopPerHa ? Number.parseFloat(block.laborCopPerHa) : undefined,
        irrigation_energy_cop_per_ha: block.irrigationEnergyCopPerHa
          ? Number.parseFloat(block.irrigationEnergyCopPerHa)
          : undefined,
        maintenance_upkeep_cop_per_ha: block.maintenanceUpkeepCopPerHa
          ? Number.parseFloat(block.maintenanceUpkeepCopPerHa)
          : undefined,
        harvest_cop_per_ha: block.harvestCopPerHa ? Number.parseFloat(block.harvestCopPerHa) : undefined,
        transport_logistics_cop_per_ha: block.transportLogisticsCopPerHa
          ? Number.parseFloat(block.transportLogisticsCopPerHa)
          : undefined,
        services_contracts_cop_per_ha: block.servicesContractsCopPerHa
          ? Number.parseFloat(block.servicesContractsCopPerHa)
          : undefined,
        admin_overheads_cop_per_ha: block.adminOverheadsCopPerHa
          ? Number.parseFloat(block.adminOverheadsCopPerHa)
          : undefined,
        financed_amount_cop: Number.parseFloat(block.financedAmountCop),
        ea_rate: Number.parseFloat(block.eaRate),
        cumulative_outlays_to_date_cop: block.cumulativeOutlaysToDateCop
          ? Number.parseFloat(block.cumulativeOutlaysToDateCop)
          : undefined,
        inp_factor: block.inpFactor ? Number.parseFloat(block.inpFactor) : undefined,
        dnp_discount_rate: Number.parseFloat(block.dnpDiscountRate),
        notes: block.notes || undefined,
      })),
    }
  }

  const goBack = () => {
    if (currentStep === "calculation") {
      setCurrentStep("block-form")
    } else if (currentStep === "block-form") {
      setCurrentStep("parcel-form")
    } else if (currentStep === "parcel-form") {
      router.push("/")
    }
  }

  if (currentStep === "calculation") {
    const calculationData = convertToParcelData()

    if (!calculationData) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[calc(100vh-3.5rem)] p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                  <CardDescription>
                    No se pudieron preparar los datos para el cálculo. Por favor regrese y verifique sus datos.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Button onClick={goBack}>Regresar</Button>
            </div>
          </div>
        </div>
      )
}

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[calc(100vh-3.5rem)] p-6">
          <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-balance">Calcular Valuación</h1>
              <p className="text-muted-foreground text-pretty">
                Revisar datos y ejecutar cálculos de valuación para la parcela: {parcelData?.parcelId}
              </p>
            </div>
            <Button variant="outline" onClick={goBack} className="flex items-center gap-2 bg-transparent">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a Bloques
            </Button>
          </div>

          <ValuationCalculator parcelData={calculationData} onCalculationComplete={handleCalculationComplete} />
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === "block-form") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[calc(100vh-3.5rem)] p-6">
          <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-balance">Entrada de Bloques</h1>
              <p className="text-muted-foreground text-pretty">
                Configurar bloques individuales dentro de la parcela: {parcelData?.parcelId}
              </p>
            </div>
            <Button variant="outline" onClick={goBack} className="flex items-center gap-2 bg-transparent">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a Parcela
            </Button>
          </div>

          <BlockEntryForm
            onSubmit={handleBlockSubmit}
            totalParcelAreaHa={parcelData ? Number.parseFloat(parcelData.totalParcelAreaHa) : undefined}
            parcelId={savedParcelId || undefined}
            regionId={parcelData?.region}
          />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[calc(100vh-3.5rem)] p-6">
        <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">Nueva Valuación</h1>
            <p className="text-muted-foreground text-pretty">
              Crear una nueva valuación profesional de parcela agrícola
            </p>
          </div>
          <Button variant="outline" onClick={goBack} className="flex items-center gap-2 bg-transparent">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </div>

        <ParcelHeaderForm onSubmit={handleParcelSubmit} />
        </div>
      </div>
    </div>
  )
}
