"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ParcelHeaderForm } from "@/components/parcel-header-form"
import { BlockEntryForm } from "@/components/block-entry-form"
import { ValuationCalculator } from "@/components/valuation-calculator"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { ParcelData, ParcelValuationResult } from "@/lib/calculations/valuation-engine"
import type { Database } from "@/types/database"

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

export default function EditValuationPage() {
  const params = useParams()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"parcel-form" | "block-form" | "calculation">("parcel-form")
  const [parcelData, setParcelData] = useState<ParcelHeaderData | null>(null)
  const [blockData, setBlockData] = useState<BlockData[] | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadExistingValuation()
  }, [params.id])

  const loadExistingValuation = async () => {
    const id = params.id as string

    if (!id) {
      console.log("[v0] No ID provided")
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Loading existing valuation with ID:", id)

      const { data: parcelRows, error: parcelError } = await supabase
        .from("parcels")
        .select("*")
        .eq("id", id)
        .returns<Database["public"]["Tables"]["parcels"]["Row"][]>()

      const parcel = parcelRows?.[0] || null

      if (parcelError) {
        console.error("[v0] Error loading parcel:", parcelError)
        setLoading(false)
        return
      }

      if (!parcel) {
        console.log("[v0] No parcel found")
        setLoading(false)
        return
      }

      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .select("*")
        .eq("parcel_id", id)
        .returns<Database["public"]["Tables"]["blocks"]["Row"][]>()

      if (blocksError) {
        console.error("[v0] Error loading blocks:", blocksError)
        setLoading(false)
        return
      }

      // Convert parcel data to form format
      const parcelFormData: ParcelHeaderData = {
        valuationAsOfDate: parcel.valuation_asof_date,
        parcelId: parcel.parcel_id,
        operatorName: parcel.operator_name || "",
        region: parcel.region,
        totalParcelAreaHa: parcel.total_parcel_area_ha.toString(),
      }

      // Convert blocks data to form format
      const blocksFormData: BlockData[] = (blocks || []).map((block) => ({
        blockId: block.block_id,
        blockAreaHa: block.block_area_ha.toString(),
        crop: block.crop,
        variety: block.variety || "",
        plantingDate: block.planting_date,
        densitySpacing: block.density_spacing || "",
        yieldSource: block.yield_source || "",
        productionTonsPeriod: block.production_tons_period?.toString() || "",
        periodDays: block.period_days?.toString() || "",
        evidenceUploads:
          Array.isArray(block.evidence_uploads)
            ? (block.evidence_uploads as unknown[]).filter((v): v is string => typeof v === "string")
            : [],
        ageYieldCurveId: block.age_yield_curve_id || "",
        realizationFactor: block.realization_factor?.toString() || "",
        priceFarmgateCopPerKg: block.price_farmgate_cop_per_kg.toString(),
        priceSourceNote: block.price_source_note || "",
        costSource: block.cost_source || "",
        costTemplateId: block.cost_template_id || "",
        landRentCopPerHa: block.land_rent_cop_per_ha?.toString() || "",
        fertilizersCopPerHa: block.fertilizers_cop_per_ha?.toString() || "",
        cropProtectionCopPerHa: block.crop_protection_cop_per_ha?.toString() || "",
        propagationMaterialCopPerHa: block.propagation_material_cop_per_ha?.toString() || "",
        laborCopPerHa: block.labor_cop_per_ha?.toString() || "",
        irrigationEnergyCopPerHa: block.irrigation_energy_cop_per_ha?.toString() || "",
        maintenanceUpkeepCopPerHa: block.maintenance_upkeep_cop_per_ha?.toString() || "",
        harvestCopPerHa: block.harvest_cop_per_ha?.toString() || "",
        transportLogisticsCopPerHa: block.transport_logistics_cop_per_ha?.toString() || "",
        servicesContractsCopPerHa: block.services_contracts_cop_per_ha?.toString() || "",
        adminOverheadsCopPerHa: block.admin_overheads_cop_per_ha?.toString() || "",
        financedAmountCop: block.financed_amount_cop.toString(),
        eaRate: block.ea_rate.toString(),
        cumulativeOutlaysToDateCop: block.cumulative_outlays_to_date_cop?.toString() || "",
        inpFactor: block.inp_factor?.toString() || "",
        dnpDiscountRate: block.dnp_discount_rate.toString(),
        notes: block.notes || "",
      }))

      setParcelData(parcelFormData)
      setBlockData(blocksFormData)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading existing valuation:", error)
      setLoading(false)
    }
  }

  const handleParcelSubmit = (data: ParcelHeaderData) => {
    setParcelData(data)
    console.log("[v0] Datos de parcela actualizados:", data)
    setCurrentStep("block-form")
  }

  const handleBlockSubmit = (blocks: BlockData[]) => {
    setBlockData(blocks)
    console.log("[v0] Datos de bloques actualizados:", blocks)
    setCurrentStep("calculation")
  }

  const handleCalculationComplete = async (result: ParcelValuationResult) => {
    try {
      await updateExistingValuation(result)
      router.push(`/valuation/view/${params.id}`)
    } catch (error) {
      console.error("Error updating valuation:", error)
    }
  }

  const updateExistingValuation = async (result: ParcelValuationResult): Promise<void> => {
    if (!parcelData || !blockData) throw new Error("Missing data")

    const id = params.id as string
    console.log("[v0] Updating existing valuation...")

    // Update parcel
    const { error: parcelError } = await supabase
      .from("parcels")
      .update({
        parcel_id: parcelData.parcelId,
        operator_name: parcelData.operatorName || null,
        region: parcelData.region,
        total_parcel_area_ha: String(Number.parseFloat(parcelData.totalParcelAreaHa)),
        valuation_asof_date: parcelData.valuationAsOfDate,
      })
      .eq("id", id)

    if (parcelError) {
      console.error("[v0] Error updating parcel:", parcelError)
      throw parcelError
    }

    // Delete existing blocks and valuation results
    const { data: existingBlocks } = await supabase
      .from("blocks")
      .select("id")
      .eq("parcel_id", id)
      .returns<Pick<Database["public"]["Tables"]["blocks"]["Row"], "id">[]>()

    if (existingBlocks && existingBlocks.length > 0) {
      const blockIds = existingBlocks.map((b) => b.id)
      await supabase.from("valuation_results").delete().in("block_id", blockIds)
      await supabase.from("blocks").delete().eq("parcel_id", id)
    }

    // Insert new blocks
    const blocksToInsert: Database["public"]["Tables"]["blocks"]["Insert"][] = blockData.map((block) => ({
      parcel_id: id, // Use parcel UUID for foreign key
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

    const { data: savedBlocks, error: blocksError } = await supabase
      .from("blocks")
      .insert(blocksToInsert as Database["public"]["Tables"]["blocks"]["Insert"][])
      .select()
      .returns<Database["public"]["Tables"]["blocks"]["Row"][]>()

    if (blocksError) {
      console.error("[v0] Error saving blocks:", blocksError)
      throw blocksError
    }

    // Insert new valuation results
    const valuationResultsToInsert = savedBlocks.map((block, index) => {
      const blockResult = result.blocks[index]
      const currentBlockData = blockData[index]

      const plantingDate = new Date(currentBlockData.plantingDate)
      const valuationDate = new Date(parcelData.valuationAsOfDate)
      const ageYears = Math.max(
        0,
        Math.floor((valuationDate.getTime() - plantingDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      )

      const blockAreaHa = Number.parseFloat(currentBlockData.blockAreaHa)
      const yieldKgPerHa = currentBlockData.productionTonsPeriod
        ? (Number.parseFloat(currentBlockData.productionTonsPeriod) * 1000) / blockAreaHa
        : 1000

      const pricePerKg = Number.parseFloat(currentBlockData.priceFarmgateCopPerKg)
      const grossIncome = yieldKgPerHa * pricePerKg * blockAreaHa

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

      return {
        block_id: block.id, // Use database UUID, not user-provided name
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
        phase: ageYears < 3 ? "improductive" : "productive",
        pe_flag: netIncome > 0 ? "PE+" : "PE-",
        confidence_tier: blockResult?.tier || "C",
        tier_explanation: `Confidence tier based on data quality and completeness`,
        value_block_cop: String(blockResult?.value_block_cop || Math.max(0, netIncome)),
        value_block_cop_per_ha: String(
          blockResult?.value_block_cop ? blockResult.value_block_cop / blockAreaHa : Math.max(0, netIncome) / blockAreaHa,
        ),
        npv: String(blockResult?.npv || netIncome),
        irr: String(blockResult?.irr || (netIncome > 0 ? 0.15 : 0)),
        break_even_year: netIncome > 0 ? ageYears : null,
        calculation_date: new Date().toISOString(),
        calculation_details: JSON.stringify(result),
      }
    })

    const { error: resultsError } = await supabase
      .from("valuation_results")
      .insert(
        valuationResultsToInsert as Database["public"]["Tables"]["valuation_results"]["Insert"][],
      )

    if (resultsError) {
      console.error("[v0] Error saving valuation results:", resultsError)
      throw resultsError
    }

    console.log("[v0] Valuation updated successfully")
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
      router.push(`/valuation/view/${params.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <p className="text-muted-foreground">Cargando datos para edición...</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === "calculation") {
    const calculationData = convertToParcelData()

    if (!calculationData) {
      return (
        <div className="min-h-screen bg-background p-6">
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
      )
    }

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-balance">Recalcular Valuación</h1>
              <p className="text-muted-foreground text-pretty">
                Revisar datos y ejecutar cálculos actualizados para la parcela: {parcelData?.parcelId}
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
    )
  }

  if (currentStep === "block-form") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-balance">Editar Bloques</h1>
              <p className="text-muted-foreground text-pretty">
                Modificar bloques de la parcela: {parcelData?.parcelId}
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
            initialBlocks={blockData || undefined}
            regionId={parcelData?.region}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">Editar Valuación</h1>
            <p className="text-muted-foreground text-pretty">Modificar datos de la valuación existente</p>
          </div>
          <Button variant="outline" onClick={goBack} className="flex items-center gap-2 bg-transparent">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a Vista
          </Button>
        </div>

        <ParcelHeaderForm onSubmit={handleParcelSubmit} initialData={parcelData || undefined} />
      </div>
    </div>
  )
}
