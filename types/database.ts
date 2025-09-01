// Generated manually from scripts/*.sql to match the public schema.
// If you later adopt Supabase typegen, replace this with the generated file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      regions: {
        Row: {
          id: string
          name: string
          description: string | null
          active: boolean | null
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          active?: boolean | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          id: string
          name: string
          scientific_name: string | null
          active: boolean | null
        }
        Insert: {
          id: string
          name: string
          scientific_name?: string | null
          active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          scientific_name?: string | null
          active?: boolean | null
        }
        Relationships: []
      }
      varieties: {
        Row: {
          id: string
          crop_id: string
          name: string
          description: string | null
          active: boolean | null
        }
        Insert: {
          id: string
          crop_id: string
          name: string
          description?: string | null
          active?: boolean | null
        }
        Update: {
          id?: string
          crop_id?: string
          name?: string
          description?: string | null
          active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'varieties_crop_id_fkey'
            columns: ['crop_id']
            isOneToOne: false
            referencedRelation: 'crops'
            referencedColumns: ['id']
          },
        ]
      }
      age_yield_curves: {
        Row: {
          id: string
          crop_id: string
          variety_id: string | null
          region_id: string | null
          name: string
          description: string | null
          curve_data: Json
          active: boolean | null
        }
        Insert: {
          id: string
          crop_id: string
          variety_id?: string | null
          region_id?: string | null
          name: string
          description?: string | null
          curve_data: Json
          active?: boolean | null
        }
        Update: {
          id?: string
          crop_id?: string
          variety_id?: string | null
          region_id?: string | null
          name?: string
          description?: string | null
          curve_data?: Json
          active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'age_yield_curves_crop_id_fkey'
            columns: ['crop_id']
            isOneToOne: false
            referencedRelation: 'crops'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'age_yield_curves_variety_id_fkey'
            columns: ['variety_id']
            isOneToOne: false
            referencedRelation: 'varieties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'age_yield_curves_region_id_fkey'
            columns: ['region_id']
            isOneToOne: false
            referencedRelation: 'regions'
            referencedColumns: ['id']
          },
        ]
      }
      cost_templates: {
        Row: {
          id: string
          crop_id: string
          region_id: string | null
          name: string
          description: string | null
          land_rent_cop_per_ha: string | null
          fertilizers_cop_per_ha: string | null
          crop_protection_cop_per_ha: string | null
          propagation_material_cop_per_ha: string | null
          labor_cop_per_ha: string | null
          irrigation_energy_cop_per_ha: string | null
          maintenance_upkeep_cop_per_ha: string | null
          harvest_cop_per_ha: string | null
          transport_logistics_cop_per_ha: string | null
          services_contracts_cop_per_ha: string | null
          admin_overheads_cop_per_ha: string | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id: string
          crop_id: string
          region_id?: string | null
          name: string
          description?: string | null
          land_rent_cop_per_ha?: string | null
          fertilizers_cop_per_ha?: string | null
          crop_protection_cop_per_ha?: string | null
          propagation_material_cop_per_ha?: string | null
          labor_cop_per_ha?: string | null
          irrigation_energy_cop_per_ha?: string | null
          maintenance_upkeep_cop_per_ha?: string | null
          harvest_cop_per_ha?: string | null
          transport_logistics_cop_per_ha?: string | null
          services_contracts_cop_per_ha?: string | null
          admin_overheads_cop_per_ha?: string | null
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          crop_id?: string
          region_id?: string | null
          name?: string
          description?: string | null
          land_rent_cop_per_ha?: string | null
          fertilizers_cop_per_ha?: string | null
          crop_protection_cop_per_ha?: string | null
          propagation_material_cop_per_ha?: string | null
          labor_cop_per_ha?: string | null
          irrigation_energy_cop_per_ha?: string | null
          maintenance_upkeep_cop_per_ha?: string | null
          harvest_cop_per_ha?: string | null
          transport_logistics_cop_per_ha?: string | null
          services_contracts_cop_per_ha?: string | null
          admin_overheads_cop_per_ha?: string | null
          active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cost_templates_crop_id_fkey'
            columns: ['crop_id']
            isOneToOne: false
            referencedRelation: 'crops'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cost_templates_region_id_fkey'
            columns: ['region_id']
            isOneToOne: false
            referencedRelation: 'regions'
            referencedColumns: ['id']
          },
        ]
      }
      parcels: {
        Row: {
          id: string
          parcel_id: string
          valuation_asof_date: string // date
          operator_name: string | null
          region: string
          total_parcel_area_ha: string // numeric
          created_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          valuation_asof_date: string
          operator_name?: string | null
          region: string
          total_parcel_area_ha: string
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          valuation_asof_date?: string
          operator_name?: string | null
          region?: string
          total_parcel_area_ha?: string
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          id: string
          parcel_id: string
          block_id: string
          block_area_ha: string
          crop: string
          variety: string | null
          planting_date: string // date
          density_spacing: string | null
          yield_source: 'measured' | 'modeled'
          production_tons_period: string | null
          period_days: number | null
          evidence_uploads: Json | null
          age_yield_curve_id: string | null
          realization_factor: string | null
          price_farmgate_cop_per_kg: string
          price_source_note: string | null
          cost_source: 'standard_template' | 'custom_entered'
          cost_template_id: string | null
          land_rent_cop_per_ha: string | null
          fertilizers_cop_per_ha: string | null
          crop_protection_cop_per_ha: string | null
          propagation_material_cop_per_ha: string | null
          labor_cop_per_ha: string | null
          irrigation_energy_cop_per_ha: string | null
          maintenance_upkeep_cop_per_ha: string | null
          harvest_cop_per_ha: string | null
          transport_logistics_cop_per_ha: string | null
          services_contracts_cop_per_ha: string | null
          admin_overheads_cop_per_ha: string | null
          financed_amount_cop: string
          ea_rate: string
          cumulative_outlays_to_date_cop: string | null
          inp_factor: string | null
          dnp_discount_rate: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          block_id: string
          block_area_ha: string
          crop: string
          variety?: string | null
          planting_date: string
          density_spacing?: string | null
          yield_source: 'measured' | 'modeled'
          production_tons_period?: string | null
          period_days?: number | null
          evidence_uploads?: Json | null
          age_yield_curve_id?: string | null
          realization_factor?: string | null
          price_farmgate_cop_per_kg: string
          price_source_note?: string | null
          cost_source: 'standard_template' | 'custom_entered'
          cost_template_id?: string | null
          land_rent_cop_per_ha?: string | null
          fertilizers_cop_per_ha?: string | null
          crop_protection_cop_per_ha?: string | null
          propagation_material_cop_per_ha?: string | null
          labor_cop_per_ha?: string | null
          irrigation_energy_cop_per_ha?: string | null
          maintenance_upkeep_cop_per_ha?: string | null
          harvest_cop_per_ha?: string | null
          transport_logistics_cop_per_ha?: string | null
          services_contracts_cop_per_ha?: string | null
          admin_overheads_cop_per_ha?: string | null
          financed_amount_cop: string
          ea_rate: string
          cumulative_outlays_to_date_cop?: string | null
          inp_factor?: string | null
          dnp_discount_rate: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          block_id?: string
          block_area_ha?: string
          crop?: string
          variety?: string | null
          planting_date?: string
          density_spacing?: string | null
          yield_source?: 'measured' | 'modeled'
          production_tons_period?: string | null
          period_days?: number | null
          evidence_uploads?: Json | null
          age_yield_curve_id?: string | null
          realization_factor?: string | null
          price_farmgate_cop_per_kg?: string
          price_source_note?: string | null
          cost_source?: 'standard_template' | 'custom_entered'
          cost_template_id?: string | null
          land_rent_cop_per_ha?: string | null
          fertilizers_cop_per_ha?: string | null
          crop_protection_cop_per_ha?: string | null
          propagation_material_cop_per_ha?: string | null
          labor_cop_per_ha?: string | null
          irrigation_energy_cop_per_ha?: string | null
          maintenance_upkeep_cop_per_ha?: string | null
          harvest_cop_per_ha?: string | null
          transport_logistics_cop_per_ha?: string | null
          services_contracts_cop_per_ha?: string | null
          admin_overheads_cop_per_ha?: string | null
          financed_amount_cop?: string
          ea_rate?: string
          cumulative_outlays_to_date_cop?: string | null
          inp_factor?: string | null
          dnp_discount_rate?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'blocks_parcel_id_fkey'
            columns: ['parcel_id']
            isOneToOne: false
            referencedRelation: 'parcels'
            referencedColumns: ['id']
          },
        ]
      }
      valuation_results: {
        Row: {
          id: string
          block_id: string
          age_years: number
          yield_kg_per_ha: string
          gross_income_cop: string
          direct_costs_cop_per_ha: string
          fin_cost_cop: string
          total_invest_cop: string
          net_income_cop: string
          cum_inflows_to_date: string
          cum_outflows_to_date: string
          breakeven_reached: boolean
          phase: 'improductive' | 'productive'
          pe_flag: 'PE+' | 'PE-'
          value_block_cop: string
          value_block_cop_per_ha: string
          npv: string | null
          irr: string | null
          break_even_year: number | null
          confidence_tier: 'A' | 'B' | 'C'
          tier_explanation: string | null
          calculation_date: string | null
          calculation_version: string | null
          created_at: string | null
          calculation_details: Json | null
        }
        Insert: {
          id?: string
          block_id: string
          age_years: number
          yield_kg_per_ha: string
          gross_income_cop: string
          direct_costs_cop_per_ha: string
          fin_cost_cop: string
          total_invest_cop: string
          net_income_cop: string
          cum_inflows_to_date: string
          cum_outflows_to_date: string
          breakeven_reached: boolean
          phase: 'improductive' | 'productive'
          pe_flag: 'PE+' | 'PE-'
          value_block_cop: string
          value_block_cop_per_ha: string
          npv?: string | null
          irr?: string | null
          break_even_year?: number | null
          confidence_tier: 'A' | 'B' | 'C'
          tier_explanation?: string | null
          calculation_date?: string | null
          calculation_version?: string | null
          created_at?: string | null
          calculation_details?: Json | null
        }
        Update: {
          id?: string
          block_id?: string
          age_years?: number
          yield_kg_per_ha?: string
          gross_income_cop?: string
          direct_costs_cop_per_ha?: string
          fin_cost_cop?: string
          total_invest_cop?: string
          net_income_cop?: string
          cum_inflows_to_date?: string
          cum_outflows_to_date?: string
          breakeven_reached?: boolean
          phase?: 'improductive' | 'productive'
          pe_flag?: 'PE+' | 'PE-'
          value_block_cop?: string
          value_block_cop_per_ha?: string
          npv?: string | null
          irr?: string | null
          break_even_year?: number | null
          confidence_tier?: 'A' | 'B' | 'C'
          tier_explanation?: string | null
          calculation_date?: string | null
          calculation_version?: string | null
          created_at?: string | null
          calculation_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'valuation_results_block_id_fkey'
            columns: ['block_id']
            isOneToOne: false
            referencedRelation: 'blocks'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
