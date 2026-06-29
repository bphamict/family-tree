export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      families: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      family_invitations: {
        Row: {
          id: string;
          family_id: string;
          email: string;
          role: string;
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          email: string;
          role: string;
          invited_by: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          email?: string;
          role?: string;
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      persons: {
        Row: {
          id: string;
          family_id: string;
          branch_id: string | null;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          gender: string | null;
          birth_date: string | null;
          death_date: string | null;
          biography: string | null;
          occupation: string | null;
          avatar_url: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          branch_id?: string | null;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          gender?: string | null;
          birth_date?: string | null;
          death_date?: string | null;
          biography?: string | null;
          occupation?: string | null;
          avatar_url?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          branch_id?: string | null;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          gender?: string | null;
          birth_date?: string | null;
          death_date?: string | null;
          biography?: string | null;
          occupation?: string | null;
          avatar_url?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "persons_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      relationships: {
        Row: {
          id: string;
          person1_id: string;
          person2_id: string;
          relationship_type: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person1_id: string;
          person2_id: string;
          relationship_type: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person1_id?: string;
          person2_id?: string;
          relationship_type?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "relationships_person1_id_fkey";
            columns: ["person1_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_person2_id_fkey";
            columns: ["person2_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string | null;
          event_type: string;
          event_date: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string | null;
          event_type: string;
          event_date: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string | null;
          event_type?: string;
          event_date?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
      event_members: {
        Row: {
          id: string;
          event_id: string;
          person_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          person_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          person_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_members_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string | null;
          document_type: string;
          mime_type: string;
          file_url: string;
          storage_path: string;
          file_size: number;
          person_id: string | null;
          event_id: string | null;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string | null;
          document_type: string;
          mime_type: string;
          file_url: string;
          storage_path: string;
          file_size?: number;
          person_id?: string | null;
          event_id?: string | null;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string | null;
          document_type?: string;
          mime_type?: string;
          file_url?: string;
          storage_path?: string;
          file_size?: number;
          person_id?: string | null;
          event_id?: string | null;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_family_with_owner: {
        Args: {
          p_name: string;
          p_description?: string | null;
        };
        Returns: string;
      };
      accept_family_invitation: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
      is_family_member: {
        Args: {
          p_family_id: string;
        };
        Returns: boolean;
      };
      has_family_role: {
        Args: {
          p_family_id: string;
          p_roles: string[];
        };
        Returns: boolean;
      };
      create_relationship: {
        Args: {
          p_person1_id: string;
          p_person2_id: string;
          p_relationship_type: string;
          p_start_date?: string | null;
          p_end_date?: string | null;
        };
        Returns: string;
      };
      would_create_parent_cycle: {
        Args: {
          p_parent_id: string;
          p_child_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
