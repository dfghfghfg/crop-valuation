"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { ValuationEngine, type ParcelData, type ParcelValuationResult } from "@/lib/calculations/valuation-engine"

interface ValuationCalculatorProps {
  parcelData: ParcelData
  onCalculationComplete?: (result: ParcelValuationResult) => void
}

export function ValuationCalculator({ parcelData, onCalculationComplete }: Readonly<ValuationCalculatorProps>) {
  const [result, setResult] = useState<ParcelValuationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = async () => {
    setIsCalculating(true)

    // Simulate calculation delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      const calculationResult = ValuationEngine.calculateParcelValuation(parcelData)
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
