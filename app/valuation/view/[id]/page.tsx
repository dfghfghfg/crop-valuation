"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ValuationReport } from "@/components/valuation-report"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, EditIcon } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { ParcelValuationResult } from "@/lib/calculations/valuation-engine"
import type { Database } from "@/types/database"
import { Header } from "@/components/header"


type ParcelsRow = Database["public"]["Tables"]["parcels"]["Row"]
type BlocksRow = Database["public"]["Tables"]["blocks"]["Row"]
type ValuationResultRow = Database["public"]["Tables"]["valuation_results"]["Row"]
type StoredCalcBlock = {
  block_id: string
  qa_flags?: string[]
  calculation_steps?: string[]
}
type StoredCalcDetails = {
  blocks?: StoredCalcBlock[]
} | null

interface StoredValuation {
  result: ParcelValuationResult
  parcelData: {
    parcelId: string
    operatorName: string | null
    region: string
    totalParcelAreaHa: string
    valuationAsOfDate: string
  }
  blockData: Array<{
    blockId: string
    blockAreaHa: string
    crop: string
    variety: string | null
    plantingDate: string
  }>
  createdAt: string
}

export default function ValuationViewPage() {
  const params = useParams()
  const router = useRouter()
  const [valuation, setValuation] = useState<StoredValuation | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadValuation()
  }, [params.id])

  const loadValuation = async () => {
    const id = params.id as string

    if (!id) {
      console.log("No ID provided")
      setValuation(null)
      setLoading(false)
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.log("Invalid UUID format:", id)
      setValuation(null)
      setLoading(false)
      return
    }

    try {
      console.log("Loading valuation with ID:", id)

      const { data: parcelRows, error: parcelError } = await supabase
        .from("parcels")
        .select("*")
        .eq("id", id)

      const parcel = parcelRows?.[0] || null

      if (parcelError) {
        console.error("Error loading parcel:", parcelError)
        if (parcelError.code === "PGRST116") {
          console.log("Parcel not found, checking localStorage")
          // Fallback to localStorage for backward compatibility
          const stored = localStorage.getItem(`valuation-${id}`)
          if (stored) {
            try {
              const data = JSON.parse(stored)
              setValuation(data)
              setLoading(false)
              return
            } catch (error) {
              console.error("Error parsing valuation data:", error)
            }
          }
        }
        setValuation(null)
        setLoading(false)
        return
      }

      if (!parcel) {
        console.log("No parcel found")
        setValuation(null)
        setLoading(false)
        return
      }

      console.log("Parcel found, loading blocks...")

      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .select("*")
        .eq("parcel_id", id)

      if (blocksError) {
        console.error("Error loading blocks:", blocksError)
        setValuation(null)
        setLoading(false)
        return
      }

      console.log("Blocks loaded, loading valuation results...")

      // Get valuation results for all blocks
      const blockIds = (blocks || []).map((block) => block.id)
      let valuationResults: ValuationResultRow[] = []

      if (blockIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from("valuation_results")
          .select("*")
          .in("block_id", blockIds)

        if (resultsError) {
          console.error("Error loading valuation results:", resultsError)
        } else {
          valuationResults = results || []
        }
      }

      if (valuationResults.length > 0 && blocks && blocks.length > 0) {
        console.log("Found valuation results in database, reconstructing...")

        // Validate that we have the minimum required data
        if (!parcel.parcel_id || !parcel.valuation_asof_date) {
          console.error("Missing critical data for reconstruction")
          setValuation(null)
          setLoading(false)
          return
        }

        try {
          // Map DB rows -> engine result using only real columns.
          const blocksResults = valuationResults.map((vr) => {
            const blockInfo = (blocks as BlocksRow[] | null | undefined)?.find((b) => b.id === vr.block_id)

            // Try to enrich from calculation_details JSON, if present
            let qaFlags: string[] = []
            let calcSteps: string[] = []
            const details = vr.calculation_details as StoredCalcDetails | string | null
            let parsed: StoredCalcDetails = null
            if (typeof details === 'string') {
              try {
                parsed = JSON.parse(details) as StoredCalcDetails
              } catch {
                parsed = null
              }
            } else {
              parsed = details
            }
            if (parsed?.blocks && blockInfo?.block_id) {
              const match = parsed.blocks.find((b) => b.block_id === blockInfo.block_id)
              if (match) {
                if (Array.isArray(match.qa_flags)) qaFlags = match.qa_flags
                if (Array.isArray(match.calculation_steps)) calcSteps = match.calculation_steps
              }
            }

            return {
              block_id: blockInfo?.block_id || `Block-${vr.block_id}`,
              block_area_ha: Number(blockInfo?.block_area_ha) || 0,
              age_years_t: Number(vr.age_years) || 0,
              yield_t_ha: Number(vr.yield_kg_per_ha) || 0,
              direct_costs_cop_per_ha: Number(vr.direct_costs_cop_per_ha) || 0,
              gross_income_cop: Number(vr.gross_income_cop) || 0,
              fin_cost_cop: Number(vr.fin_cost_cop) || 0,
              total_invest_cop: Number(vr.total_invest_cop) || 0,
              net_income_cop: Number(vr.net_income_cop) || 0,
              cum_inflows_to_t: Number(vr.cum_inflows_to_date) || 0,
              cum_outflows_to_t: Number(vr.cum_outflows_to_date) || 0,
              breakeven_reached: Boolean(vr.breakeven_reached),
              phase: vr.phase || "productive",
              pe_flag: vr.pe_flag || "PE-",
              value_block_cop: Number(vr.value_block_cop) || 0,
              value_block_cop_per_ha: Number(vr.value_block_cop_per_ha) || 0,
              npv: vr.npv != null ? Number(vr.npv) : undefined,
              tier: vr.confidence_tier || "C",
              qa_flags: qaFlags,
              calculation_steps: calcSteps,
            }
          })

          const parcelValue = blocksResults.reduce((sum, b) => sum + (b.value_block_cop || 0), 0)
          const totalArea = blocksResults.reduce((sum, b) => sum + (b.block_area_ha || 0), 0)
          const parcelValuePerHa = totalArea > 0 ? parcelValue / totalArea : 0

          // Overall tier = worst among blocks
          const overallTier = blocksResults.reduce((acc, b) => {
            if (b.tier === 'C' || acc === 'C') return 'C'
            if (b.tier === 'B' || acc === 'B') return 'B'
            return 'A'
          }, 'A' as 'A' | 'B' | 'C')

          const summaryFlags = blocksResults.flatMap((b) => b.qa_flags || [])

          const result: ParcelValuationResult = {
            parcel_id: parcel.parcel_id,
            valuation_asof_date: new Date(parcel.valuation_asof_date),
            parcel_value_cop: parcelValue,
            parcel_value_cop_per_ha: parcelValuePerHa,
            blocks: blocksResults,
            overall_tier: overallTier,
            summary_flags: summaryFlags,
          }

          // Validate the reconstructed result
          if (!result.blocks || result.blocks.length === 0) {
            console.error("No blocks found in reconstructed result")
            setValuation(null)
            setLoading(false)
            return
          }

          console.log("Successfully reconstructed calculation details from database columns")

          const parcelData = {
            parcelId: parcel.parcel_id,
            operatorName: parcel.operator_name,
            region: parcel.region,
            totalParcelAreaHa: parcel.total_parcel_area_ha.toString(),
            valuationAsOfDate: parcel.valuation_asof_date,
          }

          const blockData = blocks.map((block) => ({
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
          console.error("Error during result reconstruction:", reconstructionError)
          setValuation(null)
        }
      } else {
        console.log("No valuation results found in database, checking localStorage")
        // Fallback to localStorage for backward compatibility
        const stored = localStorage.getItem(`valuation-${id}`)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            if (data?.result?.blocks) {
              setValuation(data)
            } else {
              console.error("Invalid data structure in localStorage")
              setValuation(null)
            }
          } catch (error) {
            console.error("Error parsing valuation data:", error)
            setValuation(null)
          }
        } else {
          console.log("No valuation found in localStorage either")
          setValuation(null)
        }
      }
    } catch (error) {
      console.error("Error loading valuation:", error)
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[calc(100vh-3.5rem)] p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <p className="text-muted-foreground">Cargando valuación...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!valuation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 min-h-[calc(100vh-3.5rem)] p-6">
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
            <h1 className="text-3xl font-bold text-balance">Resultados de VPN</h1>
            <p className="text-muted-foreground text-pretty">
              Análisis completo de valuación para la región (departamento/municipio): {valuation.parcelData?.parcelId}
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
                  operator_name: valuation.parcelData.operatorName ?? undefined,
                  region: valuation.parcelData.region,
                  total_parcel_area_ha: Number.parseFloat(valuation.parcelData.totalParcelAreaHa),
                }
              : undefined
          }
        />
        </div>
      </div>
    </div>
  )
}
