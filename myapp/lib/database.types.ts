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
          nickname: string
          pin_hash: string
          email: string | null
          role: 'admin' | 'user'
          point_balance: number
          is_active: boolean
          language_preference: 'ja' | 'en' | 'zh' | 'th' | 'ko'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nickname: string
          pin_hash: string
          email?: string | null
          role?: 'admin' | 'user'
          point_balance?: number
          is_active?: boolean
          language_preference?: 'ja' | 'en' | 'zh' | 'th' | 'ko'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          pin_hash?: string
          email?: string | null
          role?: 'admin' | 'user'
          point_balance?: number
          is_active?: boolean
          language_preference?: 'ja' | 'en' | 'zh' | 'th' | 'ko'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category: 'health' | 'cosmetic' | null
          point_value: number
          is_active: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          category?: 'health' | 'cosmetic' | null
          point_value: number
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: 'health' | 'cosmetic' | null
          point_value?: number
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_texts: {
        Row: {
          id: string
          product_id: string
          language: 'ja' | 'en' | 'zh' | 'th' | 'ko'
          name: string
          description: string | null
          bundle_size: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          language: 'ja' | 'en' | 'zh' | 'th' | 'ko'
          name: string
          description?: string | null
          bundle_size?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          language?: 'ja' | 'en' | 'zh' | 'th' | 'ko'
          name?: string
          description?: string | null
          bundle_size?: string | null
          created_at?: string
        }
      }
      point_logs: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          points: number
          product_name: string
          category: 'health' | 'cosmetic' | null
          notes: string | null
          logged_by: string | null
          log_date: string
          is_flagged: boolean
          flag_reason: string | null
          flagged_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          points: number
          product_name: string
          category?: 'health' | 'cosmetic' | null
          notes?: string | null
          logged_by?: string | null
          log_date?: string
          is_flagged?: boolean
          flag_reason?: string | null
          flagged_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          points?: number
          product_name?: string
          category?: 'health' | 'cosmetic' | null
          notes?: string | null
          logged_by?: string | null
          log_date?: string
          is_flagged?: boolean
          flag_reason?: string | null
          flagged_at?: string | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name_ja: string | null
          name_en: string | null
          name_zh: string | null
          name_th: string | null
          name_ko: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ja?: string | null
          name_en?: string | null
          name_zh?: string | null
          name_th?: string | null
          name_ko?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ja?: string | null
          name_en?: string | null
          name_zh?: string | null
          name_th?: string | null
          name_ko?: string | null
          created_at?: string
        }
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_points_by_date: {
        Args: {
          p_user_id: string
          p_date: string
        }
        Returns: number
      }
      get_user_points_by_month: {
        Args: {
          p_user_id: string
          p_year: number
          p_month: number
        }
        Returns: number
      }
      get_user_points_by_range: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
