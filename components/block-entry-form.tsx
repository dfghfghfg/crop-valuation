"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUpIcon, DollarSignIcon, CalculatorIcon, FileTextIcon, PlusIcon, InfoIcon, Trash2 } from "lucide-react"

interface BlockData {
  // Block identity
  blockId: string
  blockAreaHa: string
  crop: string
  variety: string
  plantingDate: string
  densitySpacing: string

  // Yield source
  yieldSource: "measured" | "modeled" | ""
  // Measured yield fields
  productionTonsPeriod: string
  periodDays: string
  evidenceUploads: string[]
  // Modeled yield fields
  ageYieldCurveId: string
  realizationFactor: string

  // Price
  priceFarmgateCopPerKg: string
  priceSourceNote: string

  // Costs
  costSource: "standard_template" | "custom_entered" | ""
  costTemplateId: string
  // Custom cost fields (COP per hectare)
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

  // Financial
  financedAmountCop: string
  eaRate: string

  // Improductive phase (for blocks age <= 3 years)
  cumulativeOutlaysToDateCop: string
  inpFactor: string

  // Discount & metadata
  dnpDiscountRate: string
  notes: string
}

interface BlockErrors {
  blockId?: string
  blockAreaHa?: string
  crop?: string
  plantingDate?: string
  yieldSource?: string
  priceFarmgateCopPerKg?: string
  costSource?: string
  productionTonsPeriod?: string
  periodDays?: string
  ageYieldCurveId?: string
  costTemplateId?: string
}

interface BlockEntryFormProps {
  onSubmit: (blocks: BlockData[]) => void
  initialBlocks?: BlockData[]
  isLoading?: boolean
  totalParcelAreaHa?: number
  parcelId?: string // Added parcelId to fetch blocks for specific parcel
}

const crops = [
  { id: "oil_palm", name: "Palma de Aceite" },
  { id: "cocoa", name: "Cacao" },
  { id: "coffee", name: "Café" },
]

const varieties = {
  oil_palm: [
    { id: "e_guineensis", name: "E. guineensis" },
    { id: "oxg", name: "OxG" },
    { id: "e_oleifera", name: "E. oleifera" },
  ],
  cocoa: [
    { id: "trinitario", name: "Trinitario" },
    { id: "forastero", name: "Forastero" },
  ],
  coffee: [
    { id: "arabica", name: "Arábica" },
    { id: "robusta", name: "Robusta" },
  ],
}

const ageYieldCurves = [
  { id: "oil_palm_uraba_standard", name: "Palma de Aceite - Urabá Estándar" },
  { id: "oil_palm_magdalena_standard", name: "Palma de Aceite - Magdalena Estándar" },
  { id: "cocoa_standard", name: "Cacao Estándar" },
]

const costTemplates = [
  { id: "oil_palm_uraba_2024", name: "Palma de Aceite Urabá 2024" },
  { id: "oil_palm_magdalena_2024", name: "Palma de Aceite Magdalena 2024" },
  { id: "cocoa_standard_2024", name: "Cacao Estándar 2024" },
]

const createEmptyBlock = (): BlockData => ({
  blockId: "",
  blockAreaHa: "",
  crop: "",
  variety: "",
  plantingDate: "",
  densitySpacing: "",
  yieldSource: "",
  productionTonsPeriod: "",
  periodDays: "365",
  evidenceUploads: [],
  ageYieldCurveId: "",
  realizationFactor: "1.00",
  priceFarmgateCopPerKg: "",
  priceSourceNote: "",
  costSource: "",
  costTemplateId: "",
  landRentCopPerHa: "0",
  fertilizersCopPerHa: "0",
  cropProtectionCopPerHa: "0",
  propagationMaterialCopPerHa: "0",
  laborCopPerHa: "0",
  irrigationEnergyCopPerHa: "0",
  maintenanceUpkeepCopPerHa: "0",
  harvestCopPerHa: "0",
  transportLogisticsCopPerHa: "0",
  servicesContractsCopPerHa: "0",
  adminOverheadsCopPerHa: "0",
  financedAmountCop: "0",
  eaRate: "0.12",
  cumulativeOutlaysToDateCop: "",
  inpFactor: "0.40",
  dnpDiscountRate: "0.12",
  notes: "",
})

export function BlockEntryForm({
  onSubmit,
  initialBlocks,
  isLoading = false,
  totalParcelAreaHa,
  parcelId,
}: Readonly<BlockEntryFormProps>) {
  const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks || [createEmptyBlock()])
  const [errors, setErrors] = useState<Record<number, BlockErrors>>({})
  const [existingBlocks, setExistingBlocks] = useState<
    Array<{ id: string; name: string; data: Database["public"]["Tables"]["blocks"]["Row"] }>
  >([])
  const [selectedExistingBlocks, setSelectedExistingBlocks] = useState<Record<number, string>>({})
  const [dbCrops, setDbCrops] = useState<Database["public"]["Tables"]["crops"]["Row"][]>([])
  const [dbVarietiesByCrop, setDbVarietiesByCrop] = useState<
    Record<string, Database["public"]["Tables"]["varieties"]["Row"][]>
  >({})
  const [dbCurvesByCrop, setDbCurvesByCrop] = useState<
    Record<string, Database["public"]["Tables"]["age_yield_curves"]["Row"][]>
  >({})
  const [dbTemplatesByCrop, setDbTemplatesByCrop] = useState<
    Record<string, Database["public"]["Tables"]["cost_templates"]["Row"][]>
  >({})
  const supabase = createClient()

  useEffect(() => {
    if (parcelId) {
      fetchExistingBlocks()
    } else {
      setExistingBlocks([])
    }
  }, [parcelId])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("crops").select("*")
      if (data) setDbCrops(data as Database["public"]["Tables"]["crops"]["Row"][])
    })()
  }, [])

  const ensureLookupsForCrop = async (cropId: string) => {
    if (!dbVarietiesByCrop[cropId]) {
      const { data } = await supabase.from("varieties").select("*").eq("crop_id", cropId)
      setDbVarietiesByCrop((prev) => ({ ...prev, [cropId]: (data || []) as any }))
    }
    if (!dbCurvesByCrop[cropId]) {
      const { data } = await supabase.from("age_yield_curves").select("*").eq("crop_id", cropId)
      setDbCurvesByCrop((prev) => ({ ...prev, [cropId]: (data || []) as any }))
    }
    if (!dbTemplatesByCrop[cropId]) {
      const { data } = await supabase.from("cost_templates").select("*").eq("crop_id", cropId)
      setDbTemplatesByCrop((prev) => ({ ...prev, [cropId]: (data || []) as any }))
    }
  }

  const fetchExistingBlocks = async () => {
    if (!parcelId) {
      setExistingBlocks([])
      return
    }

    try {
      console.log("[v0] Fetching existing blocks for parcel UUID:", parcelId)

      const { data: blocksData, error } = await supabase
        .from("blocks")
        .select("*")
        .eq("parcel_id", parcelId)
        .returns<Database["public"]["Tables"]["blocks"]["Row"][]>()

      if (error) {
        console.error("[v0] Error fetching blocks:", error)
        return
      }

      console.log("[v0] Found blocks:", blocksData?.length || 0)

      if (blocksData && blocksData.length > 0) {
        const formattedBlocks = blocksData.map((block) => ({
          id: block.id, // Database UUID
          name: block.block_id, // User-friendly name for display
          data: block,
        }))
        setExistingBlocks(formattedBlocks)
        console.log("[v0] Formatted existing blocks for selection:", formattedBlocks.length)
      } else {
        setExistingBlocks([])
      }
    } catch (error) {
      console.error("[v0] Error fetching blocks:", error)
    }
  }

  const totalBlockArea = blocks.reduce((sum, block) => {
    const area = Number.parseFloat(block.blockAreaHa) || 0
    return sum + area
  }, 0)

  const addBlock = () => {
    setBlocks([...blocks, createEmptyBlock()])
  }

  const removeBlock = (index: number) => {
    if (blocks.length > 1) {
      const newBlocks = blocks.filter((_, i) => i !== index)
      setBlocks(newBlocks)
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  const updateBlock = (index: number, field: keyof BlockData, value: string | string[]) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], [field]: value }
    setBlocks(newBlocks)

    // Only clear errors for fields that can have validation errors
    const clearErrorIfExists = (errorField: keyof BlockErrors) => {
      if (errors[index]?.[errorField]) {
        const newErrors = { ...errors }
        if (newErrors[index]) {
          delete newErrors[index][errorField]
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index]
          }
        }
        setErrors(newErrors)
      }
    }

    // Trigger lookup fetch and reset dependent fields on crop change
    if (field === "crop" && typeof value === "string" && value) {
      void ensureLookupsForCrop(value)
      const reset = [...newBlocks]
      reset[index].variety = ""
      reset[index].ageYieldCurveId = ""
      reset[index].costTemplateId = ""
      setBlocks(reset)
    }

    // Map BlockData fields to BlockErrors fields only when they exist
    switch (field) {
      case 'blockId':
        clearErrorIfExists('blockId')
        break
      case 'blockAreaHa':
        clearErrorIfExists('blockAreaHa')
        break
      case 'crop':
        clearErrorIfExists('crop')
        break
      case 'plantingDate':
        clearErrorIfExists('plantingDate')
        break
      case 'yieldSource':
        clearErrorIfExists('yieldSource')
        break
      case 'priceFarmgateCopPerKg':
        clearErrorIfExists('priceFarmgateCopPerKg')
        break
      case 'costSource':
        clearErrorIfExists('costSource')
        break
      case 'productionTonsPeriod':
        clearErrorIfExists('productionTonsPeriod')
        break
      case 'periodDays':
        clearErrorIfExists('periodDays')
        break
      case 'ageYieldCurveId':
        clearErrorIfExists('ageYieldCurveId')
        break
      case 'costTemplateId':
        clearErrorIfExists('costTemplateId')
        break
      default:
        // Other fields don't have validation errors to clear
        break
    }
  }

  const validateBlocks = (): boolean => {
    const newErrors: Record<number, BlockErrors> = {}

    blocks.forEach((block, index) => {
      const blockErrors: BlockErrors = {}

      if (!block.blockId.trim()) blockErrors.blockId = "El ID del bloque es requerido"
      if (!block.blockAreaHa) {
        blockErrors.blockAreaHa = "El área del bloque es requerida"
      } else {
        const area = Number.parseFloat(block.blockAreaHa)
        if (isNaN(area) || area <= 0) {
          blockErrors.blockAreaHa = "El área debe ser un número positivo"
        }
      }
      if (!block.crop) blockErrors.crop = "El cultivo es requerido"
      if (!block.plantingDate) blockErrors.plantingDate = "La fecha de siembra es requerida"
      if (!block.yieldSource) blockErrors.yieldSource = "La fuente de rendimiento es requerida"
      if (!block.priceFarmgateCopPerKg) {
        blockErrors.priceFarmgateCopPerKg = "El precio es requerido"
      } else {
        const price = Number.parseFloat(block.priceFarmgateCopPerKg)
        if (isNaN(price) || price <= 0) {
          blockErrors.priceFarmgateCopPerKg = "El precio debe ser positivo"
        }
      }
      if (!block.costSource) blockErrors.costSource = "La fuente de costos es requerida"

      if (block.yieldSource === "measured") {
        if (!block.productionTonsPeriod) {
          blockErrors.productionTonsPeriod = "La producción es requerida para rendimiento medido"
        }
        if (!block.periodDays) {
          blockErrors.periodDays = "Los días del período son requeridos para rendimiento medido"
        }
      } else if (block.yieldSource === "modeled") {
        if (!block.ageYieldCurveId) {
          blockErrors.ageYieldCurveId = "La curva edad-rendimiento es requerida para rendimiento modelado"
        }
      }

      if (block.costSource === "standard_template" && !block.costTemplateId) {
        blockErrors.costTemplateId = "La plantilla de costos es requerida"
      }

      if (Object.keys(blockErrors).length > 0) {
        newErrors[index] = blockErrors
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateBlocks()) {
      onSubmit(blocks)
    }
  }

  const calculateAge = (plantingDate: string): number => {
    if (!plantingDate) return 0
    const planting = new Date(plantingDate)
    const now = new Date()
    return Math.floor((now.getTime() - planting.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  const handleBlockSelection = (value: string, index: number) => {
    console.log(`[v0] Block selection changed for index ${index}:`, value)

    if (value === "none") {
      // Clear selection and reset to empty block
      setSelectedExistingBlocks((prev) => {
        const updated = { ...prev }
        delete updated[index]
        return updated
      })

      const newBlocks = [...blocks]
      newBlocks[index] = createEmptyBlock()
      setBlocks(newBlocks)
      return
    }

    const selectedBlock = existingBlocks.find((b) => b.id === value)
    if (!selectedBlock) {
      console.log(`[v0] Block not found with ID: ${value}`)
      return
    }

    console.log(`[v0] Found selected block:`, selectedBlock)

    setSelectedExistingBlocks((prev) => ({
      ...prev,
      [index]: value, // Store the database UUID
    }))

    // Map database fields to form fields
    const dbBlock = selectedBlock.data
    const mappedBlock: BlockData = {
      blockId: dbBlock.block_id, // Display name from database
      blockAreaHa: dbBlock.block_area_ha?.toString() || "",
      crop: dbBlock.crop || "",
      variety: dbBlock.variety || "",
      plantingDate: dbBlock.planting_date || "",
      densitySpacing: dbBlock.density_spacing || "",
      yieldSource: dbBlock.yield_source || "",
      productionTonsPeriod: dbBlock.production_tons_period?.toString() || "",
      periodDays: dbBlock.period_days?.toString() || "",
      evidenceUploads:
        Array.isArray(dbBlock.evidence_uploads)
          ? (dbBlock.evidence_uploads as unknown[]).filter((v): v is string => typeof v === "string")
          : [],
      ageYieldCurveId: dbBlock.age_yield_curve_id || "",
      realizationFactor: dbBlock.realization_factor?.toString() || "",
      priceFarmgateCopPerKg: dbBlock.price_farmgate_cop_per_kg?.toString() || "",
      priceSourceNote: dbBlock.price_source_note || "",
      costSource: dbBlock.cost_source || "",
      costTemplateId: dbBlock.cost_template_id || "",
      landRentCopPerHa: dbBlock.land_rent_cop_per_ha?.toString() || "",
      fertilizersCopPerHa: dbBlock.fertilizers_cop_per_ha?.toString() || "",
      cropProtectionCopPerHa: dbBlock.crop_protection_cop_per_ha?.toString() || "",
      propagationMaterialCopPerHa: dbBlock.propagation_material_cop_per_ha?.toString() || "",
      laborCopPerHa: dbBlock.labor_cop_per_ha?.toString() || "",
      irrigationEnergyCopPerHa: dbBlock.irrigation_energy_cop_per_ha?.toString() || "",
      maintenanceUpkeepCopPerHa: dbBlock.maintenance_upkeep_cop_per_ha?.toString() || "",
      harvestCopPerHa: dbBlock.harvest_cop_per_ha?.toString() || "",
      transportLogisticsCopPerHa: dbBlock.transport_logistics_cop_per_ha?.toString() || "",
      servicesContractsCopPerHa: dbBlock.services_contracts_cop_per_ha?.toString() || "",
      adminOverheadsCopPerHa: dbBlock.admin_overheads_cop_per_ha?.toString() || "",
      financedAmountCop: dbBlock.financed_amount_cop?.toString() || "",
      eaRate: dbBlock.ea_rate?.toString() || "",
      cumulativeOutlaysToDateCop: dbBlock.cumulative_outlays_to_date_cop?.toString() || "",
      inpFactor: dbBlock.inp_factor?.toString() || "",
      dnpDiscountRate: dbBlock.dnp_discount_rate?.toString() || "",
      notes: dbBlock.notes || "",
    }

    console.log("[v0] Mapped block data:", mappedBlock)

    // Update the blocks array with the mapped data
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks]
      newBlocks[index] = mappedBlock
      return newBlocks
    })
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-balance">Información de Bloques</CardTitle>
            <CardDescription className="text-pretty">
              Agregue detalles para cada bloque plantado dentro de la parcela. Cada bloque puede tener diferentes
              cultivos, edades y prácticas de manejo.
            </CardDescription>
            {totalParcelAreaHa && (
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">Total Parcela: {totalParcelAreaHa} ha</Badge>
                <Badge variant={totalBlockArea > totalParcelAreaHa ? "destructive" : "secondary"}>
                  Total Bloques: {totalBlockArea.toFixed(4)} ha
                </Badge>
              </div>
            )}
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {blocks.map((block, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Bloque {index + 1}</CardTitle>
                  {blocks.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeBlock(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`blockId-${index}`}>ID del Bloque *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Identificador único del bloque dentro de la parcela</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="w-full">
                      <Select
                        value={selectedExistingBlocks[index] || ""}
                        onValueChange={(value) => handleBlockSelection(value, index)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar bloque existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingBlocks.length > 0 ? (
                            existingBlocks.map((existingBlock) => (
                              <SelectItem key={existingBlock.id} value={existingBlock.id}>
                                {existingBlock.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-blocks-available" disabled>
                              {parcelId ? "No hay bloques existentes" : "Ingrese un nombre para el bloque"}
                            </SelectItem>
                          )}
                          <SelectItem value="none">--- Nuevo Bloque ---</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      id={`blockId-${index}`}
                      placeholder="O escriba un nuevo nombre de bloque"
                      value={block.blockId}
                      onChange={(e) => updateBlock(index, "blockId", e.target.value)}
                      className={errors[index]?.blockId ? "border-destructive" : ""}
                    />
                    {errors[index]?.blockId && <p className="text-sm text-destructive">{errors[index]?.blockId}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`blockArea-${index}`}>Área (ha) *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Área total del bloque en hectáreas. Debe ser menor o igual al área total de la parcela.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id={`blockArea-${index}`}
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.0000"
                      value={block.blockAreaHa}
                      onChange={(e) => updateBlock(index, "blockAreaHa", e.target.value)}
                      className={errors[index]?.blockAreaHa ? "border-destructive" : ""}
                    />
                    {errors[index]?.blockAreaHa && (
                      <p className="text-sm text-destructive">{errors[index]?.blockAreaHa}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`densitySpacing-${index}`}>Espaciamiento</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Distancia entre plantas (ej: 9×9 m para palma de aceite, 3×3 m para cacao)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id={`densitySpacing-${index}`}
                      placeholder="ej: 9×9 m"
                      value={block.densitySpacing}
                      onChange={(e) => updateBlock(index, "densitySpacing", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`crop-${index}`}>Cultivo *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Tipo de cultivo plantado en este bloque</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={block.crop} onValueChange={(value) => updateBlock(index, "crop", value)}>
                      <SelectTrigger className={errors[index]?.crop ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar cultivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(dbCrops.length ? dbCrops : (crops as any)).map((crop: any) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {crop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[index]?.crop && <p className="text-sm text-destructive">{errors[index]?.crop}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`variety-${index}`}>Variedad</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variedad específica del cultivo seleccionado</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={block.variety}
                      onValueChange={(value) => updateBlock(index, "variety", value)}
                      disabled={!block.crop}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar variedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {block.crop &&
                          ((dbVarietiesByCrop[block.crop] || (varieties as any)[block.crop] || []) as any[]).map(
                            (variety: any) => (
                              <SelectItem key={variety.id} value={variety.id}>
                                {variety.name}
                              </SelectItem>
                            ),
                          )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`plantingDate-${index}`}>Fecha de Siembra *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fecha cuando se plantó este bloque. Se usa para calcular la edad del cultivo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id={`plantingDate-${index}`}
                      type="date"
                      value={block.plantingDate}
                      onChange={(e) => updateBlock(index, "plantingDate", e.target.value)}
                      className={errors[index]?.plantingDate ? "border-destructive" : ""}
                    />
                    {errors[index]?.plantingDate && (
                      <p className="text-sm text-destructive">{errors[index]?.plantingDate}</p>
                    )}
                    {block.plantingDate && (
                      <p className="text-sm text-muted-foreground">Edad: {calculateAge(block.plantingDate)} años</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4" />
                    Fuente de Rendimiento
                  </h3>
                  <div className="flex items-center gap-2">
                    <RadioGroup
                      value={block.yieldSource}
                      onValueChange={(value) => updateBlock(index, "yieldSource", value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="measured" id={`measured-${index}`} />
                        <Label htmlFor={`measured-${index}`}>Medido</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="modeled" id={`modeled-${index}`} />
                        <Label htmlFor={`modeled-${index}`}>Modelado</Label>
                      </div>
                    </RadioGroup>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Medido: usar datos reales de producción. Modelado: usar curvas estándar edad-rendimiento.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {errors[index]?.yieldSource && (
                    <p className="text-sm text-destructive">{errors[index]?.yieldSource}</p>
                  )}

                  {block.yieldSource === "measured" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`production-${index}`}>Producción (ton/período) *</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Producción total medida en toneladas durante el período especificado</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`production-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={block.productionTonsPeriod}
                          onChange={(e) => updateBlock(index, "productionTonsPeriod", e.target.value)}
                          className={errors[index]?.productionTonsPeriod ? "border-destructive" : ""}
                        />
                        {errors[index]?.productionTonsPeriod && (
                          <p className="text-sm text-destructive">{errors[index]?.productionTonsPeriod}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`periodDays-${index}`}>Período (días) *</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Número de días durante los cuales se midió la producción (típicamente 365 para un año)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`periodDays-${index}`}
                          type="number"
                          min="1"
                          placeholder="365"
                          value={block.periodDays}
                          onChange={(e) => updateBlock(index, "periodDays", e.target.value)}
                          className={errors[index]?.periodDays ? "border-destructive" : ""}
                        />
                        {errors[index]?.periodDays && (
                          <p className="text-sm text-destructive">{errors[index]?.periodDays}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {block.yieldSource === "modeled" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`ageYieldCurve-${index}`}>Curva Edad-Rendimiento *</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Curva estándar que relaciona la edad del cultivo con el rendimiento esperado</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select
                          value={block.ageYieldCurveId}
                          onValueChange={(value) => updateBlock(index, "ageYieldCurveId", value)}
                        >
                          <SelectTrigger className={errors[index]?.ageYieldCurveId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Seleccionar curva" />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              (block.crop ? dbCurvesByCrop[block.crop] : undefined) || (ageYieldCurves as any)
                            ).map((curve: any) => (
                              <SelectItem key={curve.id} value={curve.id}>
                                {curve.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[index]?.ageYieldCurveId && (
                          <p className="text-sm text-destructive">{errors[index]?.ageYieldCurveId}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`realizationFactor-${index}`}>Factor de Realización</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Multiplicador para ajustes regionales o de manejo (por defecto: 1.00)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`realizationFactor-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1.00"
                          value={block.realizationFactor}
                          onChange={(e) => updateBlock(index, "realizationFactor", e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Multiplicador para ajustes regionales (por defecto: 1.00)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <DollarSignIcon className="h-4 w-4" />
                    Información de Precios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`price-${index}`}>Precio en Finca (COP/kg) *</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Precio que recibe el productor por kilogramo de producto en la finca</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={block.priceFarmgateCopPerKg}
                        onChange={(e) => updateBlock(index, "priceFarmgateCopPerKg", e.target.value)}
                        className={errors[index]?.priceFarmgateCopPerKg ? "border-destructive" : ""}
                      />
                      {errors[index]?.priceFarmgateCopPerKg && (
                        <p className="text-sm text-destructive">{errors[index]?.priceFarmgateCopPerKg}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`priceSource-${index}`}>Nota de Fuente de Precio</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Fuente o referencia del precio utilizado (ej: contrato con molino X, precio de mercado)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id={`priceSource-${index}`}
                        placeholder="ej: Contrato con molino X"
                        value={block.priceSourceNote}
                        onChange={(e) => updateBlock(index, "priceSourceNote", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <CalculatorIcon className="h-4 w-4" />
                    Información de Costos
                  </h3>
                  <div className="flex items-center gap-2">
                    <RadioGroup
                      value={block.costSource}
                      onValueChange={(value) => updateBlock(index, "costSource", value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard_template" id={`template-${index}`} />
                        <Label htmlFor={`template-${index}`}>Plantilla Estándar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom_entered" id={`custom-${index}`} />
                        <Label htmlFor={`custom-${index}`}>Personalizado</Label>
                      </div>
                    </RadioGroup>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Plantilla: usar costos estándar predefinidos. Personalizado: ingresar costos específicos.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {errors[index]?.costSource && <p className="text-sm text-destructive">{errors[index]?.costSource}</p>}

                  {block.costSource === "standard_template" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`costTemplate-${index}`}>Plantilla de Costos *</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Plantilla predefinida con costos estándar para el cultivo y región seleccionados</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select
                          value={block.costTemplateId}
                          onValueChange={(value) => updateBlock(index, "costTemplateId", value)}
                        >
                          <SelectTrigger className={errors[index]?.costTemplateId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Seleccionar plantilla" />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              (block.crop ? dbTemplatesByCrop[block.crop] : undefined) || (costTemplates as any)
                            ).map((template: any) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[index]?.costTemplateId && (
                          <p className="text-sm text-destructive">{errors[index]?.costTemplateId}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {block.costSource === "custom_entered" && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <p className="text-sm text-muted-foreground">Ingrese costos por hectárea (COP/ha)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          {
                            key: "landRentCopPerHa",
                            label: "Arriendo de Tierra",
                            tooltip: "Costo anual de arriendo o uso de la tierra",
                          },
                          {
                            key: "fertilizersCopPerHa",
                            label: "Fertilizantes",
                            tooltip: "Costo de fertilizantes químicos y orgánicos",
                          },
                          {
                            key: "cropProtectionCopPerHa",
                            label: "Protección de Cultivos",
                            tooltip: "Pesticidas, fungicidas, herbicidas",
                          },
                          {
                            key: "propagationMaterialCopPerHa",
                            label: "Material de Propagación",
                            tooltip: "Semillas, plántulas, material vegetal",
                          },
                          {
                            key: "laborCopPerHa",
                            label: "Mano de Obra",
                            tooltip: "Costos de trabajo directo en el cultivo",
                          },
                          {
                            key: "irrigationEnergyCopPerHa",
                            label: "Riego/Energía",
                            tooltip: "Costos de riego y energía eléctrica",
                          },
                          {
                            key: "maintenanceUpkeepCopPerHa",
                            label: "Mantenimiento",
                            tooltip: "Mantenimiento de equipos e infraestructura",
                          },
                          {
                            key: "harvestCopPerHa",
                            label: "Cosecha",
                            tooltip: "Costos de recolección y procesamiento inicial",
                          },
                          {
                            key: "transportLogisticsCopPerHa",
                            label: "Transporte/Logística",
                            tooltip: "Transporte del producto al punto de venta",
                          },
                          {
                            key: "servicesContractsCopPerHa",
                            label: "Servicios/Contratos",
                            tooltip: "Servicios técnicos y contratos externos",
                          },
                          {
                            key: "adminOverheadsCopPerHa",
                            label: "Gastos Administrativos",
                            tooltip: "Costos administrativos y generales",
                          },
                        ].map(({ key, label, tooltip }) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`${key}-${index}`}>{label}</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id={`${key}-${index}`}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={block[key as keyof BlockData] as string}
                              onChange={(e) => updateBlock(index, key as keyof BlockData, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Información Financiera</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`financedAmount-${index}`}>Monto Financiado (COP)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Monto total financiado para este bloque (créditos, préstamos)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id={`financedAmount-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={block.financedAmountCop}
                        onChange={(e) => updateBlock(index, "financedAmountCop", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`eaRate-${index}`}>Tasa Efectiva Anual</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tasa de interés efectiva anual del financiamiento (como decimal, ej: 0.12 para 12%)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id={`eaRate-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.12"
                        value={block.eaRate}
                        onChange={(e) => updateBlock(index, "eaRate", e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">Ingrese como decimal (ej: 0.12 para 12%)</p>
                    </div>
                  </div>
                </div>

                {calculateAge(block.plantingDate) <= 3 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-medium">Fase Improductiva (Edad ≤ 3 años)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`cumulativeOutlays-${index}`}>Gastos Acumulados a la Fecha (COP)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total de gastos acumulados desde la siembra hasta la fecha de valuación</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id={`cumulativeOutlays-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={block.cumulativeOutlaysToDateCop}
                            onChange={(e) => updateBlock(index, "cumulativeOutlaysToDateCop", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`inpFactor-${index}`}>Factor INP</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Factor de Indemnización por No Producción. Rango típico: 0.30 - 0.50</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id={`inpFactor-${index}`}
                            type="number"
                            step="0.01"
                            min="0.30"
                            max="0.50"
                            placeholder="0.40"
                            value={block.inpFactor}
                            onChange={(e) => updateBlock(index, "inpFactor", e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Rango: 0.30 - 0.50 (por defecto: 0.40)</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`discountRate-${index}`}>Tasa de Descuento DNP</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tasa de descuento oficial del Departamento Nacional de Planeación para valuaciones</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id={`discountRate-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.12"
                        value={block.dnpDiscountRate}
                        onChange={(e) => updateBlock(index, "dnpDiscountRate", e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">Ingrese como decimal (ej: 0.12 para 12%)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`notes-${index}`}>Notas</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Observaciones especiales: replantaciones, enfermedades, condiciones inusuales, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Textarea
                        id={`notes-${index}`}
                        placeholder="Condiciones inusuales, replantaciones, enfermedades, etc."
                        value={block.notes}
                        onChange={(e) => updateBlock(index, "notes", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={addBlock}
              className="flex items-center gap-2 bg-transparent"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Otro Bloque
            </Button>

            <div className="flex gap-4">
              <Button type="button" variant="outline">
                Guardar Borrador
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-32">
                {isLoading ? "Procesando..." : "Calcular Valuación"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}
