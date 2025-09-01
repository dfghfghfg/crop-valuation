"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarIcon, MapPinIcon, UserIcon, RulerIcon, HelpCircle, Plus } from "lucide-react"

interface ParcelHeaderData {
  valuationAsOfDate: string
  parcelId: string
  operatorName: string
  region: string
  totalParcelAreaHa: string
}

interface ParcelHeaderFormProps {
  onSubmit: (data: ParcelHeaderData) => void
  initialData?: Partial<ParcelHeaderData>
  isLoading?: boolean
}

const regions = [
  { id: "uraba", name: "Urabá" },
  { id: "magdalena_medio", name: "Magdalena Medio" },
  { id: "llanos_orientales", name: "Llanos Orientales" },
  { id: "pacifico", name: "Pacífico" },
  { id: "caribe", name: "Caribe" },
  { id: "andina", name: "Región Andina" },
  { id: "amazonia", name: "Amazonía" },
  { id: "orinoquia", name: "Orinoquía" },
]

const existingParcels = [
  { id: "001-2024-URB", name: "Finca El Progreso - Urabá", region: "uraba" },
  { id: "002-2024-MAG", name: "Hacienda San José - Magdalena", region: "magdalena_medio" },
  { id: "003-2024-LLA", name: "Plantación Los Llanos", region: "llanos_orientales" },
]

const existingOperators = [
  "Cooperativa Agrícola del Urabá",
  "Asociación de Palmicultores",
  "Grupo Empresarial Agroindustrial",
  "Fundación para el Desarrollo Rural",
]

export function ParcelHeaderForm({ onSubmit, initialData, isLoading = false }: ParcelHeaderFormProps) {
  const [formData, setFormData] = useState<ParcelHeaderData>({
    valuationAsOfDate: initialData?.valuationAsOfDate || "",
    parcelId: initialData?.parcelId || "",
    operatorName: initialData?.operatorName || "",
    region: initialData?.region || "",
    totalParcelAreaHa: initialData?.totalParcelAreaHa || "",
  })

  const [errors, setErrors] = useState<Partial<ParcelHeaderData>>({})
  const [showCreateNewParcel, setShowCreateNewParcel] = useState(false)
  const [showCreateNewOperator, setShowCreateNewOperator] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<ParcelHeaderData> = {}

    if (!formData.valuationAsOfDate) {
      newErrors.valuationAsOfDate = "La fecha de valoración es requerida"
    }

    if (!formData.parcelId.trim()) {
      newErrors.parcelId = "El ID de parcela es requerido"
    }

    if (!formData.region) {
      newErrors.region = "La región es requerida"
    }

    if (!formData.totalParcelAreaHa) {
      newErrors.totalParcelAreaHa = "El área total de la parcela es requerida"
    } else {
      const area = Number.parseFloat(formData.totalParcelAreaHa)
      if (isNaN(area) || area < 0) {
        newErrors.totalParcelAreaHa = "El área debe ser un número positivo"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof ParcelHeaderData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-balance">Información de la Parcela</CardTitle>
          <CardDescription className="text-pretty">
            Ingrese la información básica para esta valoración de parcela agrícola
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="valuationDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  Fecha de Valoración *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Fecha en la cual se realiza la valoración de la parcela. Generalmente es la fecha actual o la
                        fecha de corte del análisis.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="valuationDate"
                  type="date"
                  value={formData.valuationAsOfDate}
                  onChange={(e) => handleInputChange("valuationAsOfDate", e.target.value)}
                  className={errors.valuationAsOfDate ? "border-destructive" : ""}
                  required
                />
                {errors.valuationAsOfDate && <p className="text-sm text-destructive">{errors.valuationAsOfDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parcelId" className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  Parcela *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Seleccione una parcela existente o cree una nueva. El ID debe corresponder a la cédula catastral
                        del IGAC o un identificador interno único.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                {!showCreateNewParcel ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.parcelId}
                      onValueChange={(value) => {
                        if (value === "create_new") {
                          setShowCreateNewParcel(true)
                          setFormData((prev) => ({ ...prev, parcelId: "" }))
                        } else {
                          handleInputChange("parcelId", value)
                          // Auto-fill region based on selected parcel
                          const selectedParcel = existingParcels.find((p) => p.id === value)
                          if (selectedParcel) {
                            handleInputChange("region", selectedParcel.region)
                          }
                        }
                      }}
                      required
                    >
                      <SelectTrigger className={errors.parcelId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Seleccionar parcela existente" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingParcels.map((parcel) => (
                          <SelectItem key={parcel.id} value={parcel.id}>
                            {parcel.name} ({parcel.id})
                          </SelectItem>
                        ))}
                        <SelectItem value="create_new">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Crear nueva parcela
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="parcelId"
                      type="text"
                      placeholder="Ej: 001-2024-URB o cédula catastral IGAC"
                      value={formData.parcelId}
                      onChange={(e) => handleInputChange("parcelId", e.target.value)}
                      className={errors.parcelId ? "border-destructive" : ""}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreateNewParcel(false)
                        setFormData((prev) => ({ ...prev, parcelId: "" }))
                      }}
                    >
                      Volver a seleccionar existente
                    </Button>
                  </div>
                )}
                {errors.parcelId && <p className="text-sm text-destructive">{errors.parcelId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="operatorName" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Nombre del Operador
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Persona u organización que proporciona los datos o administra la parcela. Campo opcional.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                {!showCreateNewOperator ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.operatorName}
                      onValueChange={(value) => {
                        if (value === "create_new") {
                          setShowCreateNewOperator(true)
                          setFormData((prev) => ({ ...prev, operatorName: "" }))
                        } else {
                          handleInputChange("operatorName", value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar operador (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingOperators.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                        <SelectItem value="create_new">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Agregar nuevo operador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="operatorName"
                      type="text"
                      placeholder="Nombre del proveedor de datos"
                      value={formData.operatorName}
                      onChange={(e) => handleInputChange("operatorName", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreateNewOperator(false)
                        setFormData((prev) => ({ ...prev, operatorName: "" }))
                      }}
                    >
                      Volver a seleccionar existente
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  Región *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Región geográfica donde se encuentra ubicada la parcela. Esto afecta los parámetros de
                        valoración y curvas de rendimiento.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)} required>
                  <SelectTrigger className={errors.region ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-sm text-destructive">{errors.region}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalArea" className="flex items-center gap-2">
                <RulerIcon className="h-4 w-4 text-muted-foreground" />
                Área Total de la Parcela (hectáreas) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Área total de la parcela en hectáreas. Debe incluir todas las áreas plantadas y no plantadas
                      dentro de los límites de la propiedad.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="totalArea"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                value={formData.totalParcelAreaHa}
                onChange={(e) => handleInputChange("totalParcelAreaHa", e.target.value)}
                className={errors.totalParcelAreaHa ? "border-destructive" : ""}
                required
              />
              {errors.totalParcelAreaHa && <p className="text-sm text-destructive">{errors.totalParcelAreaHa}</p>}
              <p className="text-sm text-muted-foreground">
                Ingrese el área total de la parcela en hectáreas (ej: 12.5000)
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    valuationAsOfDate: "",
                    parcelId: "",
                    operatorName: "",
                    region: "",
                    totalParcelAreaHa: "",
                  })
                  setErrors({})
                  setShowCreateNewParcel(false)
                  setShowCreateNewOperator(false)
                }}
              >
                Limpiar Formulario
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-32">
                {isLoading ? "Guardando..." : "Continuar a Bloques"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
