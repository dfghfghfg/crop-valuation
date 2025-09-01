"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LayoutDashboard, Search, Eye, Edit, Trash2, Calendar, MapPin } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { useToast } from "@/hooks/use-toast"

interface ValuationSummary {
  id: string
  parcel_id: string
  operator_name?: string
  region: string
  total_area_ha: number
  total_value_cop: number
  confidence_tier: "A" | "B" | "C"
  valuation_date: string
  status: "draft" | "completed" | "archived"
  created_at: string
}

export default function DashboardPage() {
  const [valuations, setValuations] = useState<ValuationSummary[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRegion, setFilterRegion] = useState<string>("all")
  const [filterTier, setFilterTier] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [valuationToDelete, setValuationToDelete] = useState<string | null>(null)

  const { toast } = useToast()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadValuations()
  }, [])

  const loadValuations = async () => {
    try {
      type ParcelsRow = Database["public"]["Tables"]["parcels"]["Row"]
      type BlocksRow = Database["public"]["Tables"]["blocks"]["Row"]
      type ValuationResultRow = Database["public"]["Tables"]["valuation_results"]["Row"]

      const { data: parcels, error: parcelsError } = await supabase
        .from("parcels")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<ParcelsRow[]>()

      if (parcelsError) {
        console.error("Error loading parcels:", parcelsError)
        setValuations([])
        return
      }

      const parcelIds = parcels?.map((p) => p.id) || []
      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .select("*")
        .in("parcel_id", parcelIds)
        .returns<BlocksRow[]>()

      if (blocksError) {
        console.error("Error loading blocks:", blocksError)
      }

      const blockIds = blocks?.map((b) => b.id) || []
      const { data: results, error: resultsError } = await supabase
        .from("valuation_results")
        .select("*")
        .in("block_id", blockIds)
        .returns<ValuationResultRow[]>()

      if (resultsError) {
        console.error("Error loading valuation results:", resultsError)
      }

      const transformedData: ValuationSummary[] = (parcels || []).map((parcel) => {
        const parcelBlocks = (blocks || []).filter((b) => b.parcel_id === parcel.id)

        const parcelResults = (results || []).filter((r) => parcelBlocks.some((b) => b.id === r.block_id))

        const totalValue = parcelResults.reduce((sum, r) => sum + Number(r.value_block_cop || 0), 0)

        const confidenceTiers = parcelResults.map((r) => r.confidence_tier)
        const bestTier = confidenceTiers.includes("A") ? "A" : confidenceTiers.includes("B") ? "B" : "C"

        const hasResults = parcelResults.length > 0

        return {
          id: parcel.id,
          parcel_id: parcel.parcel_id,
          operator_name: parcel.operator_name || undefined,
          region: parcel.region,
          total_area_ha: Number(parcel.total_parcel_area_ha),
          total_value_cop: totalValue,
          confidence_tier: bestTier as "A" | "B" | "C",
          valuation_date: parcel.valuation_asof_date,
          status: hasResults ? "completed" : "draft",
          created_at: parcel.created_at || new Date().toISOString(),
        }
      })

      setValuations(transformedData)
    } catch (error) {
      console.error("Error cargando valuaciones:", error)
      setValuations([])
    } finally {
      setIsLoading(false)
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString))
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-blue-100 text-blue-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "draft":
        return "Borrador"
      case "archived":
        return "Archivado"
      default:
        return status
    }
  }

  const filteredValuations = valuations.filter((valuation) => {
    const matchesSearch =
      valuation.parcel_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      valuation.operator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      valuation.region.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRegion = filterRegion === "all" || valuation.region === filterRegion
    const matchesTier = filterTier === "all" || valuation.confidence_tier === filterTier

    return matchesSearch && matchesRegion && matchesTier
  })

  const totalValue = valuations.reduce((sum, v) => sum + v.total_value_cop, 0)
  const totalArea = valuations.reduce((sum, v) => sum + v.total_area_ha, 0)
  const avgValuePerHa = totalArea > 0 ? totalValue / totalArea : 0

  const handleView = (id: string) => {
    window.location.href = `/valuation/view/${id}`
  }

  const handleEdit = (id: string) => {
    window.location.href = `/valuation/edit/${id}`
  }

  const handleDelete = async (id: string) => {
    console.log("[v0] Starting deletion process for valuation:", id)

    try {
      const { data: blocks, error: blocksError } = await supabase.from("blocks").select("id").eq("parcel_id", id)

      if (blocksError) {
        console.error("[v0] Error fetching blocks for deletion:", blocksError)
        toast({
          title: "Error al eliminar",
          description: "No se pudieron obtener los bloques",
          variant: "destructive",
        })
        return
      }

      if (blocks && blocks.length > 0) {
        const blockIds = blocks.map((b) => b.id)
        const { error: resultsError } = await supabase.from("valuation_results").delete().in("block_id", blockIds)

        if (resultsError) {
          console.error("[v0] Error deleting valuation results:", resultsError)
          toast({
            title: "Error al eliminar",
            description: "Error al eliminar los resultados de valuación",
            variant: "destructive",
          })
          return
        }
        console.log("[v0] Deleted valuation results for blocks:", blockIds)
      }

      const { error: blocksDeleteError } = await supabase.from("blocks").delete().eq("parcel_id", id)

      if (blocksDeleteError) {
        console.error("[v0] Error deleting blocks:", blocksDeleteError)
        toast({
          title: "Error al eliminar",
          description: "Error al eliminar los bloques",
          variant: "destructive",
        })
        return
      }
      console.log("[v0] Deleted blocks for parcel:", id)

      const { error: parcelError } = await supabase.from("parcels").delete().eq("id", id)

      if (parcelError) {
        console.error("[v0] Error deleting parcel:", parcelError)
        toast({
          title: "Error al eliminar",
          description: "Error al eliminar la parcela",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Successfully deleted parcel:", id)

      setValuations(valuations.filter((v) => v.id !== id))
      toast({
        title: "Éxito",
        description: "Valuación eliminada exitosamente",
      })
    } catch (error) {
      console.error("[v0] Unexpected error during deletion:", error)
      toast({
        title: "Error inesperado",
        description: "Error inesperado al eliminar la valuación",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (id: string) => {
    setValuationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (valuationToDelete) {
      handleDelete(valuationToDelete)
      setDeleteDialogOpen(false)
      setValuationToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8 text-emerald-600" />
              Panel de Valuaciones
            </h1>
            <p className="text-gray-600 mt-1">Gestiona y revisa todas tus valuaciones agrícolas</p>
          </div>
          <Button onClick={() => (window.location.href = "/")} className="bg-emerald-600 hover:bg-emerald-700">
            Ir a Inicio
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Valuaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{valuations.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Propiedades evaluadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Valor Total del Portafolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValue)}</div>
              <div className="text-xs text-muted-foreground mt-1">Suma de todas las valuaciones</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Área Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArea.toLocaleString()} ha</div>
              <div className="text-xs text-muted-foreground mt-1">Hectáreas bajo evaluación</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Valor Promedio/ha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(avgValuePerHa)}</div>
              <div className="text-xs text-muted-foreground mt-1">Valor por hectárea</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por parcela, operador o región..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas las regiones</option>
                <option value="Meta">Meta</option>
                <option value="Cesar">Cesar</option>
                <option value="Santander">Santander</option>
                <option value="Magdalena">Magdalena</option>
              </select>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos los niveles</option>
                <option value="A">Nivel A</option>
                <option value="B">Nivel B</option>
                <option value="C">Nivel C</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Valuaciones</CardTitle>
            <CardDescription>
              {filteredValuations.length} de {valuations.length} valuaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando valuaciones...</div>
            ) : filteredValuations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron valuaciones que coincidan con los filtros
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Región</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValuations.map((valuation) => (
                    <TableRow key={valuation.id}>
                      <TableCell className="font-medium">{valuation.parcel_id}</TableCell>
                      <TableCell>{valuation.operator_name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {valuation.region}
                        </div>
                      </TableCell>
                      <TableCell>{valuation.total_area_ha.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(valuation.total_value_cop)}</TableCell>
                      <TableCell>
                        <Badge className={getTierColor(valuation.confidence_tier)} variant="outline">
                          {valuation.confidence_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(valuation.status)} variant="outline">
                          {getStatusText(valuation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(valuation.valuation_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(valuation.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(valuation.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(valuation.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la valuación y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
