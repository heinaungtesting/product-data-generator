/**
 * Supabase Database Types
 *
 * Auto-generated types for type-safe database queries
 * Run: npx supabase gen types typescript --local > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          category: string;
          jan_code: string | null;
          barcode: string | null;
          updated_at: string;
          synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          category: string;
          jan_code?: string | null;
          barcode?: string | null;
          updated_at?: string;
          synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          jan_code?: string | null;
          barcode?: string | null;
          updated_at?: string;
          synced_at?: string | null;
          created_at?: string;
        };
      };
      product_texts: {
        Row: {
          id: string;
          product_id: string;
          lang: string;
          name: string;
          description: string | null;
          features: Json | null;
          usage: string | null;
          ingredients: string | null;
          warnings: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          lang?: string;
          name: string;
          description?: string | null;
          features?: Json | null;
          usage?: string | null;
          ingredients?: string | null;
          warnings?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          lang?: string;
          name?: string;
          description?: string | null;
          features?: Json | null;
          usage?: string | null;
          ingredients?: string | null;
          warnings?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
      };
      product_tags: {
        Row: {
          product_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          product_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      bundle_metadata: {
        Row: {
          id: string;
          etag: string;
          product_count: number;
          built_at: string;
          storage_path: string;
          size_bytes: number | null;
          schema_version: string;
        };
        Insert: {
          id?: string;
          etag: string;
          product_count: number;
          built_at?: string;
          storage_path: string;
          size_bytes?: number | null;
          schema_version?: string;
        };
        Update: {
          id?: string;
          etag?: string;
          product_count?: number;
          built_at?: string;
          storage_path?: string;
          size_bytes?: number | null;
          schema_version?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
