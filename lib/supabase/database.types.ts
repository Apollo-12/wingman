export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      aircraft_types: {
        Row: {
          category: string | null;
          created_at: string;
          engine_count: number | null;
          engine_type: string | null;
          family: string | null;
          iata_code: string | null;
          icao_code: string | null;
          id: number;
          manufacturer: string | null;
          model: string | null;
          name: string;
          variant: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          engine_count?: number | null;
          engine_type?: string | null;
          family?: string | null;
          iata_code?: string | null;
          icao_code?: string | null;
          id?: never;
          manufacturer?: string | null;
          model?: string | null;
          name: string;
          variant?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          engine_count?: number | null;
          engine_type?: string | null;
          family?: string | null;
          iata_code?: string | null;
          icao_code?: string | null;
          id?: never;
          manufacturer?: string | null;
          model?: string | null;
          name?: string;
          variant?: string | null;
        };
        Relationships: [];
      };
      airlines: {
        Row: {
          active: boolean | null;
          callsign: string | null;
          country: string | null;
          created_at: string;
          iata_code: string | null;
          icao_code: string | null;
          id: number;
          logo_url: string | null;
          name: string;
        };
        Insert: {
          active?: boolean | null;
          callsign?: string | null;
          country?: string | null;
          created_at?: string;
          iata_code?: string | null;
          icao_code?: string | null;
          id?: never;
          logo_url?: string | null;
          name: string;
        };
        Update: {
          active?: boolean | null;
          callsign?: string | null;
          country?: string | null;
          created_at?: string;
          iata_code?: string | null;
          icao_code?: string | null;
          id?: never;
          logo_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      airports: {
        Row: {
          city: string | null;
          country: string | null;
          country_code: string | null;
          created_at: string;
          elevation_ft: number | null;
          iata_code: string | null;
          icao_code: string | null;
          id: number;
          latitude: number;
          longitude: number;
          name: string;
          scheduled_service: boolean | null;
          timezone: string | null;
          type: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string;
          elevation_ft?: number | null;
          iata_code?: string | null;
          icao_code?: string | null;
          id?: never;
          latitude: number;
          longitude: number;
          name: string;
          scheduled_service?: boolean | null;
          timezone?: string | null;
          type?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string;
          elevation_ft?: number | null;
          iata_code?: string | null;
          icao_code?: string | null;
          id?: never;
          latitude?: number;
          longitude?: number;
          name?: string;
          scheduled_service?: boolean | null;
          timezone?: string | null;
          type?: string | null;
        };
        Relationships: [];
      };
      flight_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          flight_id: string;
          id: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          flight_id: string;
          id?: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          flight_id?: string;
          id?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flight_photos_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
        ];
      };
      flights: {
        Row: {
          aircraft_type_id: number | null;
          airline_id: number | null;
          arr_gate: string | null;
          arr_terminal: string | null;
          arrival_airport_id: number;
          cabin_class: Database["public"]["Enums"]["cabin_class"] | null;
          created_at: string;
          dep_gate: string | null;
          dep_terminal: string | null;
          departure_airport_id: number;
          distance_km: number | null;
          diverted_to_airport_id: number | null;
          duration_minutes: number | null;
          external_ids: Json | null;
          flight_number: string | null;
          flight_reason: Database["public"]["Enums"]["flight_reason"] | null;
          gate_arrival_actual: string | null;
          gate_arrival_scheduled: string | null;
          gate_departure_actual: string | null;
          gate_departure_scheduled: string | null;
          id: string;
          landing_actual: string | null;
          landing_scheduled: string | null;
          notes: string | null;
          pnr: string | null;
          scheduled_date: string;
          seat: string | null;
          seat_type: Database["public"]["Enums"]["seat_type"] | null;
          status: Database["public"]["Enums"]["flight_status"];
          tail_number: string | null;
          takeoff_actual: string | null;
          takeoff_scheduled: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          aircraft_type_id?: number | null;
          airline_id?: number | null;
          arr_gate?: string | null;
          arr_terminal?: string | null;
          arrival_airport_id: number;
          cabin_class?: Database["public"]["Enums"]["cabin_class"] | null;
          created_at?: string;
          dep_gate?: string | null;
          dep_terminal?: string | null;
          departure_airport_id: number;
          distance_km?: number | null;
          diverted_to_airport_id?: number | null;
          duration_minutes?: number | null;
          external_ids?: Json | null;
          flight_number?: string | null;
          flight_reason?: Database["public"]["Enums"]["flight_reason"] | null;
          gate_arrival_actual?: string | null;
          gate_arrival_scheduled?: string | null;
          gate_departure_actual?: string | null;
          gate_departure_scheduled?: string | null;
          id?: string;
          landing_actual?: string | null;
          landing_scheduled?: string | null;
          notes?: string | null;
          pnr?: string | null;
          scheduled_date: string;
          seat?: string | null;
          seat_type?: Database["public"]["Enums"]["seat_type"] | null;
          status?: Database["public"]["Enums"]["flight_status"];
          tail_number?: string | null;
          takeoff_actual?: string | null;
          takeoff_scheduled?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          aircraft_type_id?: number | null;
          airline_id?: number | null;
          arr_gate?: string | null;
          arr_terminal?: string | null;
          arrival_airport_id?: number;
          cabin_class?: Database["public"]["Enums"]["cabin_class"] | null;
          created_at?: string;
          dep_gate?: string | null;
          dep_terminal?: string | null;
          departure_airport_id?: number;
          distance_km?: number | null;
          diverted_to_airport_id?: number | null;
          duration_minutes?: number | null;
          external_ids?: Json | null;
          flight_number?: string | null;
          flight_reason?: Database["public"]["Enums"]["flight_reason"] | null;
          gate_arrival_actual?: string | null;
          gate_arrival_scheduled?: string | null;
          gate_departure_actual?: string | null;
          gate_departure_scheduled?: string | null;
          id?: string;
          landing_actual?: string | null;
          landing_scheduled?: string | null;
          notes?: string | null;
          pnr?: string | null;
          scheduled_date?: string;
          seat?: string | null;
          seat_type?: Database["public"]["Enums"]["seat_type"] | null;
          status?: Database["public"]["Enums"]["flight_status"];
          tail_number?: string | null;
          takeoff_actual?: string | null;
          takeoff_scheduled?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flights_aircraft_type_id_fkey";
            columns: ["aircraft_type_id"];
            isOneToOne: false;
            referencedRelation: "aircraft_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_airline_id_fkey";
            columns: ["airline_id"];
            isOneToOne: false;
            referencedRelation: "airlines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_arrival_airport_id_fkey";
            columns: ["arrival_airport_id"];
            isOneToOne: false;
            referencedRelation: "airports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_departure_airport_id_fkey";
            columns: ["departure_airport_id"];
            isOneToOne: false;
            referencedRelation: "airports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_diverted_to_airport_id_fkey";
            columns: ["diverted_to_airport_id"];
            isOneToOne: false;
            referencedRelation: "airports";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          home_airport_id: number | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          home_airport_id?: number | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          home_airport_id?: number | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_home_airport_id_fkey";
            columns: ["home_airport_id"];
            isOneToOne: false;
            referencedRelation: "airports";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      haversine_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number };
        Returns: number;
      };
    };
    Enums: {
      cabin_class: "economy" | "premium_economy" | "business" | "first";
      flight_reason: "leisure" | "business" | "commute" | "crew" | "other";
      flight_status: "scheduled" | "completed" | "canceled" | "diverted";
      seat_type: "window" | "middle" | "aisle" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cabin_class: ["economy", "premium_economy", "business", "first"],
      flight_reason: ["leisure", "business", "commute", "crew", "other"],
      flight_status: ["scheduled", "completed", "canceled", "diverted"],
      seat_type: ["window", "middle", "aisle", "other"],
    },
  },
} as const;
