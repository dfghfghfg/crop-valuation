"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ValuationReport } from "@/components/valuation-report"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, EditIcon } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { ParcelValuationResult } from "@/lib/calculations/valuation-engine"

interface StoredValuation {
  result: ParcelValuationResult
  parcelData: any
  blockData: any
  createdAt: string
}

export default function ValuationViewPage() {
  const params = useParams()
  const router = useRouter()
  const [valuation, setValuation] = useState<StoredValuation | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadValuation()
  }, [params.id])

  const loadValuation = async () => {
    const id = params.id as string

    if (!id) {
      console.log("[v0] No ID provided")
      setValuation(null)
      setLoading(false)
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.log("[v0] Invalid UUID format:", id)
      setValuation(null)
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Loading valuation with ID:", id)

      const { data: parcel, error: parcelError } = await supabase.from("parcels").select("*").eq("id", id).single()

      if (parcelError) {
        console.error("[v0] Error loading parcel:", parcelError)
        if (parcelError.code === "PGRST116") {
          console.log("[v0] Parcel not found, checking localStorage")
          // Fallback to localStorage for backward compatibility
          const stored = localStorage.getItem(`valuation-${id}`)
          if (stored) {
            try {
              const data = JSON.parse(stored)
              setValuation(data)
              setLoading(false)
              return
            } catch (error) {
              console.error("[v0] Error parsing valuation data:", error)
            }
          }
        }
        setValuation(null)
        setLoading(false)
        return
      }

      if (!parcel) {
        console.log("[v0] No parcel found")
        setValuation(null)
        setLoading(false)
        return
      }

      console.log("[v0] Parcel found, loading blocks...")

      const { data: blocks, error: blocksError } = await supabase.from("blocks").select("*").eq("parcel_id", id)

      if (blocksError) {
        console.error("[v0] Error loading blocks:", blocksError)
        setValuation(null)
        setLoading(false)
        return
      }

      console.log("[v0] Blocks loaded, loading valuation results...")

      // Get valuation results for all blocks
      const blockIds = (blocks || []).map((block) => block.id)
      let valuationResults: any[] = []

      if (blockIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from("valuation_results")
          .select("*")
          .in("block_id", blockIds)

        if (resultsError) {
          console.error("[v0] Error loading valuation results:", resultsError)
        } else {
          valuationResults = results || []
        }
      }

      if (valuationResults.length > 0 && blocks && blocks.length > 0) {
        console.log("[v0] Found valuation results in database, reconstructing...")

        const firstResult = valuationResults[0]

        // Validate that we have the minimum required data
        if (!firstResult || !parcel.parcel_id || !parcel.valuation_asof_date) {
          console.error("[v0] Missing critical data for reconstruction")
          setValuation(null)
          setLoading(false)
          return
        }

        try {
          // Reconstruct the complete ParcelValuationResult from database columns
          const result: ParcelValuationResult = {
            parcel_id: parcel.parcel_id,
            valuation_asof_date: new Date(parcel.valuation_asof_date),
            parcel_value_cop: firstResult.parcel_value_cop || 0,
            parcel_value_cop_per_ha: firstResult.parcel_value_cop_per_ha || 0,
            blocks: valuationResults.map((vr: any) => {
              // Find the corresponding block data
              const blockInfo = blocks?.find((b: any) => b.id === vr.block_id)
              if (!blockInfo) {
                console.warn("[v0] Block info not found for valuation result:", vr.block_id)
              }

              return {
                block_id: blockInfo?.block_id || `Block-${vr.block_id}`,
                block_area_ha: Number(blockInfo?.block_area_ha) || 0,
                age_years_t: Number(vr.age_years_t) || 0,
                yield_t_ha: Number(vr.yield_t_ha) || 0,
                direct_costs_cop_per_ha: Number(vr.direct_costs_cop_per_ha) || 0,
                gross_income_cop: Number(vr.gross_income_cop) || 0,
                fin_cost_cop: Number(vr.fin_cost_cop) || 0,
                total_invest_cop: Number(vr.total_invest_cop) || 0,
                net_income_cop: Number(vr.net_income_cop) || 0,
                cum_inflows_to_t: Number(vr.cum_inflows_to_t) || 0,
                cum_outflows_to_t: Number(vr.cum_outflows_to_t) || 0,
                breakeven_reached: Boolean(vr.breakeven_reached),
                phase: (vr.phase || "productive") as "productive" | "improductive",
                pe_flag: (vr.pe_flag || "PE-") as "PE+" | "PE-",
                value_block_cop: Number(vr.value_block_cop) || 0,
                value_block_cop_per_ha: Number(vr.value_block_cop_per_ha) || 0,
                npv: Number(vr.npv) || 0,
                tier: (vr.tier || "C") as "A" | "B" | "C",
                qa_flags: Array.isArray(vr.qa_flags) ? vr.qa_flags : vr.qa_flags ? [vr.qa_flags] : [],
                calculation_steps: Array.isArray(vr.calculation_steps)
                  ? vr.calculation_steps
                  : vr.calculation_steps
                    ? [vr.calculation_steps]
                    : [],
              }
            }),
            overall_tier: (firstResult.overall_tier || "C") as "A" | "B" | "C",
            summary_flags: Array.isArray(firstResult.summary_flags)
              ? firstResult.summary_flags
              : firstResult.summary_flags
                ? [firstResult.summary_flags]
                : [],
          }

          // Validate the reconstructed result
          if (!result.blocks || result.blocks.length === 0) {
            console.error("[v0] No blocks found in reconstructed result")
            setValuation(null)
            setLoading(false)
            return
          }

          console.log("[v0] Successfully reconstructed calculation details from database columns")

          const parcelData = {
            parcelId: parcel.parcel_id,
            operatorName: parcel.operator_name,
            region: parcel.region,
            totalParcelAreaHa: parcel.total_parcel_area_ha.toString(),
            valuationAsOfDate: parcel.valuation_asof_date,
          }

          const blockData = (blocks || []).map((block: any) => ({
            blockId: block.block_id,
            blockAreaHa: block.block_area_ha.toString(),
            crop: block.crop,
            variety: block.variety || "",
            plantingDate: block.planting_date,
          }))

          setValuation({
            result,
            parcelData,
            blockData,
            createdAt: parcel.created_at || new Date().toISOString(),
          })
        } catch (reconstructionError) {
          console.error("[v0] Error during result reconstruction:", reconstructionError)
          setValuation(null)
        }
      } else {
        console.log("[v0] No valuation results found in database, checking localStorage")
        // Fallback to localStorage for backward compatibility
        const stored = localStorage.getItem(`valuation-${id}`)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            if (data && data.result && data.result.blocks) {
              setValuation(data)
            } else {
              console.error("[v0] Invalid data structure in localStorage")
              setValuation(null)
            }
          } catch (error) {
            console.error("[v0] Error parsing valuation data:", error)
            setValuation(null)
          }
        } else {
          console.log("[v0] No valuation found in localStorage either")
          setValuation(null)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading valuation:", error)
      setValuation(null)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (valuation) {
      router.push(`/valuation/edit/${params.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <p className="text-muted-foreground">Cargando valuación...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!valuation) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Valuación No Encontrada</CardTitle>
              <CardDescription>La valuación solicitada no existe o ha sido eliminada.</CardDescription>
            </CardHeader>
          </Card>
          <Button onClick={() => router.push("/dashboard")}>Volver al Panel de Control</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">Resultados de Valuación</h1>
            <p className="text-muted-foreground text-pretty">
              Análisis completo de valuación para la parcela: {valuation.parcelData?.parcelId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver al Panel
            </Button>
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" />
              Editar Valuación
            </Button>
          </div>
        </div>

        <ValuationReport
          result={valuation?.result || null}
          parcelData={
            valuation?.parcelData
              ? {
                  operator_name: valuation.parcelData.operatorName,
                  region: valuation.parcelData.region,
                  total_parcel_area_ha: Number.parseFloat(valuation.parcelData.totalParcelAreaHa),
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}
