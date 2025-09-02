"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

export interface ComboOption {
  id: string
  label: string
  meta?: string
}

interface CreatableComboboxProps {
  value: string
  onChange: (value: string) => void
  fetchOptions: (query: string) => Promise<ComboOption[]>
  onSelectOption?: (option: ComboOption) => void
  createLabel?: (q: string) => string
  placeholder?: string
  disabled?: boolean
  emptyHint?: string
  className?: string
}

export function CreatableCombobox({
  value,
  onChange,
  fetchOptions,
  onSelectOption,
  createLabel = (q) => `Crear "${q}"`,
  placeholder = "Buscar...",
  disabled = false,
  emptyHint = "Sin resultados",
  className,
}: Readonly<CreatableComboboxProps>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ComboOption[]>([])

  const debouncedQuery = useDebounced(query, 250)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!open) return
      setLoading(true)
      try {
        const items = await fetchOptions(debouncedQuery)
        if (active) setOptions(items)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [debouncedQuery, open, fetchOptions])

  const currentLabel = useMemo(() => {
    if (!value) return ""
    const match = options.find((o) => o.label === value)
    return match?.label || value
  }, [value, options])

  const showCreate = query.trim().length > 0 && !options.some((o) => o.label === query.trim())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={className}
          disabled={disabled}
        >
          <span className="truncate text-left mr-2">
            {currentLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-64">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
          />
          <CommandList>
            {!loading && options.length === 0 && !showCreate && (
              <CommandEmpty>{emptyHint}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  onSelect={() => {
                    onChange(opt.label)
                    onSelectOption?.(opt)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <Check
                    className={
                      "mr-2 h-4 w-4 " + (opt.label === value ? "opacity-100" : "opacity-0")
                    }
                  />
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.meta && (
                      <span className="text-xs text-muted-foreground">{opt.meta}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem
                  onSelect={() => {
                    const newVal = query.trim()
                    onChange(newVal)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createLabel(query.trim())}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer.current)
  }, [value, delay])
  return debounced
}

