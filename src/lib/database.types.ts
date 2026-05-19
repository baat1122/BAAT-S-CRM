export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          created_at: string
          customer_name: string
          phone: string | null
          email: string | null
          vehicle_name: string
          pickup_location: string
          dropoff_location: string
          est_pickup_date: string | null
          est_delivery_date: string | null
          estimated_price: number | null
          status: string
          source: string | null
          is_archived: boolean
          custom_order_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'is_archived'> & { id?: string, created_at?: string, is_archived?: boolean }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      orders: {
        Row: {
          id: string
          created_at: string
          order_id: string
          customer_id: string | null
          vehicle_name: string
          pickup_location: string
          dropoff_location: string
          est_pickup_date: string | null
          est_delivery_date: string | null
          customer_price: number | null
          carrier_pay: number | null
          profit: number | null
          status: string
          agent_name: string | null
          source: string | null
          is_archived: boolean
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'is_archived' | 'profit'> & { id?: string, created_at?: string, is_archived?: boolean, profit?: number | null }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      quote_vehicles: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          year: string
          make: string
          model: string
          vin: string | null
          operable: boolean
          trailer_type: string
        }
        Insert: Omit<Database['public']['Tables']['quote_vehicles']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['quote_vehicles']['Insert']>
      }
      order_vehicles: {
        Row: {
          id: string
          created_at: string
          order_id: string
          year: string
          make: string
          model: string
          vin: string | null
          operable: boolean
          trailer_type: string
        }
        Insert: Omit<Database['public']['Tables']['order_vehicles']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['order_vehicles']['Insert']>
      }
      customers: {
        Row: {
          id: string
          created_at: string
          customer_name: string
          email: string | null
          phone: string | null
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      carriers: {
        Row: {
          id: string
          created_at: string
          mc_number: string | null
          dot_number: string | null
          company_name: string
          phone: string | null
          email: string | null
          status: string
          routes: string | null
        }
        Insert: Omit<Database['public']['Tables']['carriers']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['carriers']['Insert']>
      }
      payments: {
        Row: {
          id: string
          created_at: string
          order_id: string | null
          amount: number
          type: string
          status: string
          reference: string | null
          sender_name: string | null
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'> & { id?: string, created_at?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
  }
}

// Utility Types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
