"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarIcon, MapPinIcon, UserIcon, RulerIcon, HelpCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"
import { CreatableCombobox } from "@/components/creatable-combobox"

interface ParcelHeaderData {
  valuationAsOfDate: string
  parcelId: string
  operatorName: string
  departamento: string
  municipio: string
  vereda: string
  region: string // Keep for backward compatibility
  totalParcelAreaHa: string
}

interface ParcelHeaderFormProps {
  onSubmit: (data: ParcelHeaderData) => void
  initialData?: Partial<ParcelHeaderData>
  isLoading?: boolean
}


export function ParcelHeaderForm({ onSubmit, initialData, isLoading = false }: Readonly<ParcelHeaderFormProps>) {
  const [formData, setFormData] = useState<ParcelHeaderData>({
    valuationAsOfDate: initialData?.valuationAsOfDate || "",
    parcelId: initialData?.parcelId || "",
    operatorName: initialData?.operatorName || "",
    departamento: initialData?.departamento || "",
    municipio: initialData?.municipio || "",
    vereda: initialData?.vereda || "",
    region: initialData?.region || "", // Keep for backward compatibility
    totalParcelAreaHa: initialData?.totalParcelAreaHa || "",
  })

  const [errors, setErrors] = useState<Partial<ParcelHeaderData>>({})
  // Using CreatableCombobox for parcel and operator selection/creation
  const [departamentos, setDepartamentos] = useState<Database["public"]["Tables"]["departamentos"]["Row"][]>([])
  const [municipios, setMunicipios] = useState<Database["public"]["Tables"]["municipios"]["Row"][]>([])
  const [filteredMunicipios, setFilteredMunicipios] = useState<Database["public"]["Tables"]["municipios"]["Row"][]>([])
  const [parcels, setParcels] = useState<
    Pick<
      Database["public"]["Tables"]["parcels"]["Row"],
      "id" | "parcel_id" | "region" | "operator_name" | "departamento" | "municipio" | "vereda"
    >[]
  >([])
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      // Fetch departamentos
      const { data: depts } = await supabase
        .from("departamentos")
        .select("*")
        .returns<Database["public"]["Tables"]["departamentos"]["Row"][]>()
      setDepartamentos((depts || []).filter((d) => d.active !== false))

      // Fetch municipios
      const { data: muns } = await supabase
        .from("municipios")
        .select("*")
        .returns<Database["public"]["Tables"]["municipios"]["Row"][]>()
      setMunicipios((muns || []).filter((m) => m.active !== false))

      const { data: pcs } = await supabase
        .from("parcels")
        .select("id, parcel_id, region, operator_name, departamento, municipio, vereda")
        .order("created_at", { ascending: false })
        .returns<
          Pick<
            Database["public"]["Tables"]["parcels"]["Row"],
            "id" | "parcel_id" | "region" | "operator_name" | "departamento" | "municipio" | "vereda"
          >[]
        >()
      setParcels(pcs || [])
    })()
  }, [])

  // Normalize departamento values coming from legacy records (names vs ids)
  useEffect(() => {
    if (!formData.departamento || departamentos.length === 0) return

    const matchesById = departamentos.some((dept) => dept.id === formData.departamento)
    if (matchesById) return

    const normalized = departamentos.find(
      (dept) => dept.name.toLowerCase() === formData.departamento.toLowerCase() || dept.code === formData.departamento,
    )

    if (normalized) {
      setFormData((prev) => (
        prev.departamento === normalized.id
          ? prev
          : {
              ...prev,
              departamento: normalized.id,
            }
      ))
    }
  }, [departamentos, formData.departamento])

  // Filter municipios based on selected departamento
  useEffect(() => {
    if (formData.departamento) {
      const filtered = municipios.filter((m) => m.departamento_id === formData.departamento)
      setFilteredMunicipios(filtered)
    } else {
      setFilteredMunicipios([])
    }
  }, [formData.departamento, municipios])

  // Normalize municipio value (legacy records might store name instead of id)
  useEffect(() => {
    if (!formData.municipio || filteredMunicipios.length === 0) return

    const existingMatch = filteredMunicipios.some((m) => m.id === formData.municipio)
    if (existingMatch) return

    const normalized = filteredMunicipios.find(
      (m) => m.name.toLowerCase() === formData.municipio.toLowerCase() || m.code === formData.municipio,
    )

    if (normalized) {
      setFormData((prev) => (
        prev.municipio === normalized.id
          ? prev
          : {
              ...prev,
              municipio: normalized.id,
            }
      ))
    }
  }, [filteredMunicipios, formData.municipio])

  const existingOperators = useMemo(() => {
    const names = new Set<string>()
    for (const p of parcels) {
      if (p.operator_name) names.add(p.operator_name)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [parcels])

  const validateForm = (): boolean => {
    const newErrors: Partial<ParcelHeaderData> = {}

    if (!formData.valuationAsOfDate) {
      newErrors.valuationAsOfDate = "La fecha de valoración es requerida"
    }

    if (!formData.parcelId.trim()) {
      newErrors.parcelId = "El ID del predio es requerido"
    }

    if (!formData.departamento) {
      newErrors.departamento = "El departamento es requerido"
    }

    if (!formData.municipio) {
      newErrors.municipio = "El municipio es requerido"
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
          <CardTitle className="text-2xl font-semibold text-balance">Información del Predio</CardTitle>
          <CardDescription className="text-pretty">
            Ingrese la información básica para esta valoración de predio agrícola
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
                  Predio *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Seleccione un predio existente o cree uno nuevo. El ID debe corresponder a la cédula catastral
                        del IGAC o un identificador interno único.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <CreatableCombobox
                  value={formData.parcelId}
                  onChange={(val) => handleInputChange("parcelId", val)}
                  fetchOptions={async (q) => {
                    const { data } = await supabase
                      .from("parcels")
                      .select("id, parcel_id, region, operator_name, vereda")
                      .ilike("parcel_id", `%${q}%`)
                      .order("created_at", { ascending: false })
                      .returns<
                        Pick<
                          Database["public"]["Tables"]["parcels"]["Row"],
                          "id" | "parcel_id" | "region" | "operator_name" | "vereda"
                        >[]
                      >()
                    return (data || []).map((p) => ({
                      id: p.id,
                      label: p.parcel_id,
                      meta: [p.operator_name, p.region, p.vereda].filter(Boolean).join(" — "),
                    }))
                  }}
                  onSelectOption={(opt) => {
                    const selectedParcel = parcels.find((p) => p.parcel_id === opt.label)
                    if (selectedParcel) {
                      if (selectedParcel.departamento) {
                        handleInputChange("departamento", selectedParcel.departamento)
                      }
                      if (selectedParcel.municipio) {
                        handleInputChange("municipio", selectedParcel.municipio)
                      }
                    if (selectedParcel.vereda) {
                      handleInputChange("vereda", selectedParcel.vereda)
                    }
                      handleInputChange("region", selectedParcel.region || "")
                      if (selectedParcel.operator_name) {
                        handleInputChange("operatorName", selectedParcel.operator_name)
                      }
                    }
                  }}
                  placeholder={parcels.length ? "Buscar o crear predio..." : "Crear predio o buscar"}
                  emptyHint={"Sin coincidencias"}
                  className={`w-full justify-between ${errors.parcelId ? "border-destructive" : ""}`}
                />
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
                <CreatableCombobox
                  value={formData.operatorName}
                  onChange={(val) => handleInputChange("operatorName", val)}
                  fetchOptions={async (q) => {
                    const term = q.trim().toLowerCase()
                    const opts = existingOperators
                      .filter((o) => o.toLowerCase().includes(term))
                      .slice(0, 20)
                      .map((o) => ({ id: o, label: o }))
                    return Promise.resolve(opts)
                  }}
                  placeholder={existingOperators.length ? "Buscar o crear operador..." : "Crear operador o buscar"}
                  emptyHint={"Sin coincidencias"}
                  className="w-full justify-between"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  Ubicación del Predio
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departamento" className="flex items-center gap-2">
                      Departamento *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Departamento donde se encuentra ubicada la parcela. Esto afecta los parámetros de
                            valoración y curvas de rendimiento.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select value={formData.departamento} onValueChange={(value) => {
                      handleInputChange("departamento", value)
                      // Clear municipio when departamento changes
                      if (value !== formData.departamento) {
                      handleInputChange("municipio", "")
                      handleInputChange("vereda", "")
                      }
                    }} required>
                      <SelectTrigger className={`w-full ${errors.departamento ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((departamento) => (
                          <SelectItem key={departamento.id} value={departamento.id}>
                            {departamento.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.departamento && <p className="text-sm text-destructive">{errors.departamento}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipio" className="flex items-center gap-2">
                      Municipio *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Municipio donde se encuentra ubicada la parcela. Seleccione primero un departamento.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select value={formData.municipio} onValueChange={(value) => handleInputChange("municipio", value)} required>
                      <SelectTrigger className={`w-full ${errors.municipio ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={formData.departamento ? "Seleccionar municipio" : "Seleccione departamento primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredMunicipios.map((municipio) => (
                          <SelectItem key={municipio.id} value={municipio.id}>
                            {municipio.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.municipio && <p className="text-sm text-destructive">{errors.municipio}</p>}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vereda" className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    Vereda / Corregimiento
                  </Label>
                  <Input
                    id="vereda"
                    placeholder="Ingrese la vereda o corregimiento"
                    value={formData.vereda}
                    onChange={(e) => handleInputChange("vereda", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Campo opcional. Úselo para especificar la vereda o corregimiento del predio.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalArea" className="flex items-center gap-2">
                <RulerIcon className="h-4 w-4 text-muted-foreground" />
                Área Total del Predio (hectáreas) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Área total del predio en hectáreas. Debe incluir todas las áreas plantadas y no plantadas
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
                    departamento: "",
                    municipio: "",
                  vereda: "",
                    region: "",
                    totalParcelAreaHa: "",
                  })
                  setErrors({})
                  setFilteredMunicipios([])
                }}
              >
                Limpiar Formulario
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-32">
                {isLoading ? "Guardando..." : "Continuar a Cultivos/Lotes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
