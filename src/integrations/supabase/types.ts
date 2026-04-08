export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string
          end_date: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          paystack_ref: string | null
          property_id: string
          room_id: string
          service_fee: number
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          student_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          end_date: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_ref?: string | null
          property_id: string
          room_id: string
          service_fee?: number
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          end_date?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_ref?: string | null
          property_id?: string
          room_id?: string
          service_fee?: number
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          property_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["inspection_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["inspection_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["inspection_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_student_verified: boolean
          is_verified: boolean
          matric_number: string | null
          phone: string | null
          profile_photo_url: string | null
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          is_student_verified?: boolean
          is_verified?: boolean
          matric_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_student_verified?: boolean
          is_verified?: boolean
          matric_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          created_at: string
          description: string | null
          distance_to_gate_meters: number | null
          gender_restriction: Database["public"]["Enums"]["gender_restriction"]
          host_id: string
          house_rules: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["property_status"]
          title: string
          total_rooms: number
          university_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          distance_to_gate_meters?: number | null
          gender_restriction?: Database["public"]["Enums"]["gender_restriction"]
          host_id: string
          house_rules?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          total_rooms?: number
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          distance_to_gate_meters?: number | null
          gender_restriction?: Database["public"]["Enums"]["gender_restriction"]
          host_id?: string
          house_rules?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          total_rooms?: number
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          property_id: string | null
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          property_id: string | null
          rating: number
          review_type: Database["public"]["Enums"]["review_type"]
          reviewee_id: string | null
          reviewer_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string | null
          rating: number
          review_type: Database["public"]["Enums"]["review_type"]
          reviewee_id?: string | null
          reviewer_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string | null
          rating?: number
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewee_id?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          available_count: number
          created_at: string
          id: string
          is_furnished: boolean
          max_occupants: number
          photos: string[] | null
          price_per_month: number | null
          price_per_session: number
          property_id: string
          room_type: Database["public"]["Enums"]["room_type"]
          total_count: number
          updated_at: string
        }
        Insert: {
          available_count?: number
          created_at?: string
          id?: string
          is_furnished?: boolean
          max_occupants?: number
          photos?: string[] | null
          price_per_month?: number | null
          price_per_session?: number
          property_id: string
          room_type?: Database["public"]["Enums"]["room_type"]
          total_count?: number
          updated_at?: string
        }
        Update: {
          available_count?: number
          created_at?: string
          id?: string
          is_furnished?: boolean
          max_occupants?: number
          photos?: string[] | null
          price_per_month?: number | null
          price_per_session?: number
          property_id?: string
          room_type?: Database["public"]["Enums"]["room_type"]
          total_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          short_name: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          short_name: string
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          short_name?: string
          state?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "host" | "admin"
      booking_status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
      booking_type: "SESSION" | "MONTHLY" | "SHORT_TERM"
      gender_restriction: "ANY" | "MALE_ONLY" | "FEMALE_ONLY"
      inspection_status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
      payment_status: "UNPAID" | "PAID" | "REFUNDED"
      property_status: "PENDING" | "APPROVED" | "SUSPENDED"
      property_type:
        | "HOSTEL"
        | "APARTMENT"
        | "SELF_CONTAIN"
        | "MINI_FLAT"
        | "SHARED_ROOM"
      report_status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED"
      review_type: "STUDENT_TO_PROPERTY" | "STUDENT_TO_HOST" | "HOST_TO_STUDENT"
      room_type:
        | "SELF_CONTAIN"
        | "SHARED_2"
        | "SHARED_4"
        | "SHARED_6"
        | "MINI_FLAT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "host", "admin"],
      booking_status: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
      booking_type: ["SESSION", "MONTHLY", "SHORT_TERM"],
      gender_restriction: ["ANY", "MALE_ONLY", "FEMALE_ONLY"],
      inspection_status: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      payment_status: ["UNPAID", "PAID", "REFUNDED"],
      property_status: ["PENDING", "APPROVED", "SUSPENDED"],
      property_type: [
        "HOSTEL",
        "APARTMENT",
        "SELF_CONTAIN",
        "MINI_FLAT",
        "SHARED_ROOM",
      ],
      report_status: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
      review_type: [
        "STUDENT_TO_PROPERTY",
        "STUDENT_TO_HOST",
        "HOST_TO_STUDENT",
      ],
      room_type: [
        "SELF_CONTAIN",
        "SHARED_2",
        "SHARED_4",
        "SHARED_6",
        "MINI_FLAT",
      ],
    },
  },
} as const
