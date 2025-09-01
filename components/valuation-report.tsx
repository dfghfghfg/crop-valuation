"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  PieChart,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
} from "lucide-react"
import type { ParcelValuationResult } from "@/lib/calculations/valuation-engine"

interface ValuationReportProps {
  result: ParcelValuationResult
  parcelData?: {
    operator_name?: string
    region: string
    total_parcel_area_ha: number
  }
}

export function ValuationReport({ result, parcelData }: ValuationReportProps) {
  const [reportView, setReportView] = useState<"summary" | "detailed" | "financial">("summary")

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error de Datos</CardTitle>
          <CardDescription>No se pudieron cargar los datos de valuación. El resultado es nulo.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Por favor, intente recargar la página o contacte al administrador si el problema persiste.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!result.blocks || !Array.isArray(result.blocks) || result.blocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datos Incompletos</CardTitle>
          <CardDescription>No se encontraron bloques de valuación para mostrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La valuación existe pero no contiene información de bloques válida.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
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

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    console.log(`Exportando reporte como ${format}`)
    alert(`La funcionalidad de exportar como ${format.toUpperCase()} se implementaría aquí`)
  }

  const handlePrint = () => {
    window.print()
  }

  const totalNetIncome = result.blocks.reduce((sum, block) => sum + block.net_income_cop, 0)
  const totalGrossIncome = result.blocks.reduce((sum, block) => sum + block.gross_income_cop, 0)
  const totalInvestment = result.blocks.reduce((sum, block) => sum + block.total_invest_cop, 0)
  const avgYield =
    result.blocks.reduce((sum, block) => sum + block.yield_t_ha * block.block_area_ha, 0) /
    result.blocks.reduce((sum, block) => sum + block.block_area_ha, 0)

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Reporte de Valuación Agrícola
              </CardTitle>
              <CardDescription>Análisis profesional de valuación para la parcela {result.parcel_id}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Report Navigation */}
      <div className="flex gap-2">
        <Button
          variant={reportView === "summary" ? "default" : "outline"}
          onClick={() => setReportView("summary")}
          size="sm"
        >
          Resumen Ejecutivo
        </Button>
        <Button
          variant={reportView === "detailed" ? "default" : "outline"}
          onClick={() => setReportView("detailed")}
          size="sm"
        >
          Análisis Detallado
        </Button>
        <Button
          variant={reportView === "financial" ? "default" : "outline"}
          onClick={() => setReportView("financial")}
          size="sm"
        >
          Desglose Financiero
        </Button>
      </div>

      {/* Executive Summary View */}
      {reportView === "summary" && (
        <div className="space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Propiedad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Fecha de Valuación</div>
                    <div className="text-sm text-muted-foreground">{formatDate(result.valuation_asof_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Región</div>
                    <div className="text-sm text-muted-foreground">{parcelData?.region || "N/A"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Operador</div>
                    <div className="text-sm text-muted-foreground">{parcelData?.operator_name || "N/A"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Área Total</div>
                    <div className="text-sm text-muted-foreground">{parcelData?.total_parcel_area_ha || 0} ha</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Valuación Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(result.parcel_value_cop)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(result.parcel_value_cop_per_ha)} por hectárea
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ingreso Neto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalNetIncome)}</div>
                <div className="text-xs text-muted-foreground mt-1">Proyección anual</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Rendimiento Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgYield.toLocaleString()} kg/ha</div>
                <div className="text-xs text-muted-foreground mt-1">Promedio ponderado</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Nivel de Confianza</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getTierColor(result.overall_tier)}>
                  {getTierIcon(result.overall_tier)}
                  Nivel {result.overall_tier}
                </Badge>
                <div className="text-xs text-muted-foreground mt-2">
                  {result.overall_tier === "A" && "Datos verificados con evidencia"}
                  {result.overall_tier === "B" && "Modelado con plantillas estándar"}
                  {result.overall_tier === "C" && "Provisional - requiere revisión"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Block Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Bloques</CardTitle>
              <CardDescription>Vista general de {result.blocks.length} bloques dentro de la parcela</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID del Bloque</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Edad (años)</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Nivel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.blocks.map((block) => (
                    <TableRow key={block.block_id}>
                      <TableCell className="font-medium">{block.block_id}</TableCell>
                      <TableCell>{block.block_area_ha}</TableCell>
                      <TableCell>{block.age_years_t}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {block.phase} • {block.pe_flag}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(block.value_block_cop)}</TableCell>
                      <TableCell>
                        <Badge className={getTierColor(block.tier)} variant="outline">
                          {block.tier}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis View */}
      {reportView === "detailed" && (
        <div className="space-y-6">
          {result.blocks.map((block) => (
            <Card key={block.block_id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Bloque {block.block_id} - Análisis Detallado
                  <Badge className={getTierColor(block.tier)}>
                    {getTierIcon(block.tier)}
                    Nivel {block.tier}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Block Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium">Área</div>
                    <div className="text-lg">{block.block_area_ha} ha</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Edad</div>
                    <div className="text-lg">{block.age_years_t} años</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Rendimiento</div>
                    <div className="text-lg">{block.yield_t_ha.toLocaleString()} kg/ha</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Fase</div>
                    <div className="text-lg">
                      {block.phase} • {block.pe_flag}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Financial Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-emerald-600">Ingreso Bruto</div>
                    <div className="text-xl font-bold">{formatCurrency(block.gross_income_cop)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-600">Inversión Total</div>
                    <div className="text-xl font-bold">{formatCurrency(block.total_invest_cop)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-600">Ingreso Neto</div>
                    <div className="text-xl font-bold">{formatCurrency(block.net_income_cop)}</div>
                  </div>
                </div>

                <Separator />

                {/* Calculation Steps */}
                <div>
                  <div className="text-sm font-medium mb-2">Pasos de Cálculo</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {block.calculation_steps.map((step, index) => (
                      <div key={index}>• {step}</div>
                    ))}
                  </div>
                </div>

                {/* QA Flags */}
                {block.qa_flags.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Indicadores de Control de Calidad
                    </div>
                    <div className="text-sm text-amber-700 space-y-1">
                      {block.qa_flags.map((flag, index) => (
                        <div key={index}>• {flag}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Financial Breakdown View */}
      {reportView === "financial" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis Financiero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Ingreso Bruto Total</div>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalGrossIncome)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Inversión Total</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalInvestment)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Ingreso Neto</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalNetIncome)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Block Financial Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación Financiera de Bloques</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bloque</TableHead>
                    <TableHead>Ingreso Bruto</TableHead>
                    <TableHead>Inversión</TableHead>
                    <TableHead>Ingreso Neto</TableHead>
                    <TableHead>VPN</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.blocks.map((block) => (
                    <TableRow key={block.block_id}>
                      <TableCell className="font-medium">{block.block_id}</TableCell>
                      <TableCell>{formatCurrency(block.gross_income_cop)}</TableCell>
                      <TableCell>{formatCurrency(block.total_invest_cop)}</TableCell>
                      <TableCell>{formatCurrency(block.net_income_cop)}</TableCell>
                      <TableCell>{block.npv ? formatCurrency(block.npv) : "N/A"}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(block.value_block_cop)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
