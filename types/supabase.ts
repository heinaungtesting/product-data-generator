/**
 * Supabase Database TypeScript Types
 *
 * IMPORTANT: These types should be auto-generated from your Supabase schema.
 *
 * To generate types, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
 *
 * Or use Supabase CLI:
 * npx supabase gen types typescript --linked > types/supabase.ts
 */

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
      products: {
        Row: {
          id: string
          category: 'health' | 'cosmetic'
          point_value: number
          content_updated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: 'health' | 'cosmetic'
          point_value: number
          content_updated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: 'health' | 'cosmetic'
          point_value?: number
          content_updated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_texts: {
        Row: {
          id: number
          product_id: string
          language: 'ja' | 'en' | 'th' | 'ko' | 'zh'
          name: string
          description: string
          effects: string
          side_effects: string
          good_for: string
        }
        Insert: {
          id?: number
          product_id: string
          language: 'ja' | 'en' | 'th' | 'ko' | 'zh'
          name: string
          description?: string
          effects?: string
          side_effects?: string
          good_for?: string
        }
        Update: {
          id?: number
          product_id?: string
          language?: 'ja' | 'en' | 'th' | 'ko' | 'zh'
          name?: string
          description?: string
          effects?: string
          side_effects?: string
          good_for?: string
        }
      }
      tags: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: number
        }
        Insert: {
          product_id: string
          tag_id: number
        }
        Update: {
          product_id?: string
          tag_id?: number
        }
      }
      staff: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          point_balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          point_balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          point_balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      point_logs: {
        Row: {
          id: string
          staff_id: string
          product_id: string | null
          points: number
          product_name: string
          category: 'health' | 'cosmetic' | null
          notes: string | null
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          product_id?: string | null
          points: number
          product_name: string
          category?: 'health' | 'cosmetic' | null
          notes?: string | null
          log_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          product_id?: string | null
          points?: number
          product_name?: string
          category?: 'health' | 'cosmetic' | null
          notes?: string | null
          log_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalculate_staff_balance: {
        Args: { staff_uuid: string }
        Returns: number
      }
      get_staff_points_by_date: {
        Args: {
          staff_uuid: string
          start_date: string
          end_date: string
        }
        Returns: {
          log_date: string
          total_points: number
          log_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
