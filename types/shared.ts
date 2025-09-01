// Shared union types used across the application
export type ConfidenceTier = "A" | "B" | "C"
export type ValuationStatus = "draft" | "completed" | "archived"
export type YieldSource = "measured" | "modeled"
export type CostSource = "standard_template" | "custom_entered"
export type BlockPhase = "improductive" | "productive"
export type PEFlag = "PE+" | "PE-"

// Filter values for UI components
export type FilterValue = "all" | string
