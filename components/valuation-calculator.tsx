"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { ValuationEngine, type ParcelData, type ParcelValuationResult } from "@/lib/calculations/valuation-engine"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

interface ValuationCalculatorProps {
  parcelData: ParcelData
  onCalculationComplete?: (result: ParcelValuationResult) => void
}

export function ValuationCalculator({ parcelData, onCalculationComplete }: Readonly<ValuationCalculatorProps>) {
  const [result, setResult] = useState<ParcelValuationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const supabase = createClient()

  const handleCalculate = async () => {
    setIsCalculating(true)

    // Simulate calculation delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      const curveIds = Array.from(
        new Set(
          parcelData.blocks
            .filter((b) => b.yield_source === "modeled" && b.age_yield_curve_id)
            .map((b) => b.age_yield_curve_id as string),
        ),
      )
      const templateIds = Array.from(
        new Set(
          parcelData.blocks
            .filter((b) => b.cost_source === "standard_template" && b.cost_template_id)
            .map((b) => b.cost_template_id as string),
        ),
      )
      const cropIds = Array.from(
        new Set(
          parcelData.blocks
            .map((b) => b.crop)
            .filter((c): c is string => Boolean(c)),
        ),
      )

      let yieldCurves: Record<string, Record<number, number>> = {}
      if (curveIds.length > 0) {
        const { data } = await supabase
          .from("age_yield_curves")
          .select("id,curve_data")
          .in("id", curveIds)
          .returns<Pick<Database["public"]["Tables"]["age_yield_curves"]["Row"], "id" | "curve_data">[]>()
        for (const row of data || []) {
          const obj = row.curve_data as Record<string, number>
          const normalized: Record<number, number> = {}
          Object.entries(obj).forEach(([k, v]) => {
            const n = Number(k)
            if (!Number.isNaN(n)) normalized[n] = Number(v)
          })
          yieldCurves[row.id] = normalized
        }
      }

      let costTemplates: Record<string, Record<string, number>> = {}
      if (templateIds.length > 0) {
        const { data } = await supabase
          .from("cost_templates")
          .select("*")
          .in("id", templateIds)
          .returns<Database["public"]["Tables"]["cost_templates"]["Row"][]>()
        for (const row of data || []) {
          costTemplates[row.id] = {
            land_rent_cop_per_ha: Number(row.land_rent_cop_per_ha || 0),
            fertilizers_cop_per_ha: Number(row.fertilizers_cop_per_ha || 0),
            crop_protection_cop_per_ha: Number(row.crop_protection_cop_per_ha || 0),
            propagation_material_cop_per_ha: Number(row.propagation_material_cop_per_ha || 0),
            labor_cop_per_ha: Number(row.labor_cop_per_ha || 0),
            irrigation_energy_cop_per_ha: Number(row.irrigation_energy_cop_per_ha || 0),
            maintenance_upkeep_cop_per_ha: Number(row.maintenance_upkeep_cop_per_ha || 0),
            harvest_cop_per_ha: Number(row.harvest_cop_per_ha || 0),
            transport_logistics_cop_per_ha: Number(row.transport_logistics_cop_per_ha || 0),
            services_contracts_cop_per_ha: Number(row.services_contracts_cop_per_ha || 0),
            admin_overheads_cop_per_ha: Number(row.admin_overheads_cop_per_ha || 0),
          }
        }
      }

      // Fetch cost_curves for the crops in the parcel (to let engine pick age-based costs)
      let costCurves: Record<string, Record<number, number>> = {}
      if (cropIds.length > 0) {
        const { data } = await supabase
          .from("cost_curves")
          .select("id,crop_id,name,curve_data")
          .in("crop_id", cropIds)
          .returns<Pick<Database["public"]["Tables"]["cost_curves"]["Row"], "id" | "crop_id" | "name" | "curve_data">[]>()
        const rows = data || []
        for (const row of rows) {
          const obj = row.curve_data as Record<string, number>
          const normalized: Record<number, number> = {}
          Object.entries(obj).forEach(([k, v]) => {
            const n = Number(k)
            if (!Number.isNaN(n)) normalized[n] = Number(v)
          })
          costCurves[row.id] = normalized
        }
        // Alias: if a crop has a single cost curve, allow lookup by the age_yield_curve_id directly
        const byCrop: Record<string, string[]> = {}
        for (const r of rows) {
          byCrop[r.crop_id] = byCrop[r.crop_id] || []
          byCrop[r.crop_id].push(r.id)
        }
        for (const b of parcelData.blocks) {
          const crop = b.crop
          const ageId = b.age_yield_curve_id
          if (!crop || !ageId) continue
          const list = byCrop[crop] || []
          if (list.length === 1) {
            const onlyCurveId = list[0]
            if (costCurves[onlyCurveId] && !costCurves[ageId]) {
              costCurves[ageId] = costCurves[onlyCurveId]
            }
          }
        }
      }

      const calculationResult = ValuationEngine.calculateParcelValuation(parcelData, {
        yieldCurves,
        costTemplates,
        costCurves,
      })
      setResult(calculationResult)
      onCalculationComplete?.(calculationResult)
    } catch (error) {
      console.error("Error de cálculo:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTierColor = (tier: "A" | "B" | "C") => {
    switch (tier) {
      case "A":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "B":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "C":
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const getTierIcon = (tier: "A" | "B" | "C") => {
    switch (tier) {
      case "A":
        return <CheckCircle className="h-4 w-4" />
      case "B":
        return <TrendingUp className="h-4 w-4" />
      case "C":
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-600" />
            Calculadora de Valuación
          </CardTitle>
          <CardDescription>Calcular la valuación agrícola para la parcela {parcelData.parcel_id}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID de Parcela:</span> {parcelData.parcel_id}
              </div>
              <div>
                <span className="font-medium">Región:</span> {parcelData.region}
              </div>
              <div>
                <span className="font-medium">Área Total:</span> {parcelData.total_parcel_area_ha} ha
              </div>
              <div>
                <span className="font-medium">Bloques:</span> {parcelData.blocks.length}
              </div>
            </div>

            <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
              {isCalculating ? "Calculando..." : "Calcular Valuación"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resumen de Valuación
                <Badge className={getTierColor(result.overall_tier)}>
                  {getTierIcon(result.overall_tier)}
                  Nivel {result.overall_tier}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(result.parcel_value_cop)}</div>
                  <div className="text-sm text-muted-foreground">Valor Total de la Parcela</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(result.parcel_value_cop_per_ha)}
                  </div>
                  <div className="text-sm text-muted-foreground">Valor por Hectárea</div>
                </div>
              </div>

              {result.summary_flags.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Indicadores de Control de Calidad
                  </div>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {result.summary_flags.map((flag, index) => (
                      <li key={index}>• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Análisis por Bloque</h3>
            {result.blocks.map((block, index) => (
              <Card key={block.block_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    Bloque {block.block_id}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {block.phase} • {block.pe_flag}
                      </Badge>
                      <Badge className={getTierColor(block.tier)}>
                        {getTierIcon(block.tier)}
                        Nivel {block.tier}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium">Edad</div>
                      <div className="text-lg">{block.age_years_t} años</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Rendimiento</div>
                      <div className="text-lg">{block.yield_t_ha.toLocaleString()} kg/ha</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Ingreso Neto</div>
                      <div className="text-lg">{formatCurrency(block.net_income_cop)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Valor del Bloque</div>
                      <div className="text-lg font-bold text-emerald-600">{formatCurrency(block.value_block_cop)}</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <details className="space-y-2">
                    <summary className="cursor-pointer font-medium text-sm">Ver Pasos de Cálculo</summary>
                    <div className="text-xs text-muted-foreground space-y-1 ml-4">
                      {block.calculation_steps.map((step, stepIndex) => (
                        <div key={stepIndex}>• {step}</div>
                      ))}
                    </div>
                  </details>

                  {block.qa_flags.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                      <div className="font-medium text-amber-800 mb-1">Indicadores de Calidad:</div>
                      {block.qa_flags.map((flag, flagIndex) => (
                        <div key={flagIndex} className="text-amber-700">
                          • {flag}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
