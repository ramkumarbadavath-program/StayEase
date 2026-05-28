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
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          role: 'owner' | 'tenant' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email?: string | null
          phone: string
          role: 'owner' | 'tenant' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          role?: 'owner' | 'tenant' | 'admin'
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: string
          city: string
          pincode: string
          type: 'boys' | 'girls' | 'co-ed'
          total_rooms: number
          amenities: string[]
          photos: string[]
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          address: string
          city: string
          pincode: string
          type: 'boys' | 'girls' | 'co-ed'
          total_rooms?: number
          amenities?: string[]
          photos?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          address?: string
          city?: string
          pincode?: string
          type?: 'boys' | 'girls' | 'co-ed'
          total_rooms?: number
          amenities?: string[]
          photos?: string[]
          created_at?: string
        }
      }
    }
  }
}
