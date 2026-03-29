export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          hometown: string | null
          country_code: string | null
          facility_tag: string | null
          team: string | null
          username_change_count: number
          locale: string
          status: string
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          hometown?: string | null
          country_code?: string | null
          facility_tag?: string | null
          team?: string | null
          username_change_count?: number
          locale?: string
          status?: string
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          hometown?: string | null
          country_code?: string | null
          facility_tag?: string | null
          team?: string | null
          username_change_count?: number
          locale?: string
          status?: string
          last_login_at?: string | null
        }
      }
      tricks: {
        Row: {
          id: string
          name_original: string
          name_en: string | null
          name_ja: string | null
          aliases: string[] | null
          category: string
          created_by: string | null
          clip_count: number
          challenger_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_original: string
          name_en?: string | null
          name_ja?: string | null
          aliases?: string[] | null
          category: string
          created_by?: string | null
          clip_count?: number
          challenger_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name_original?: string
          name_en?: string | null
          name_ja?: string | null
          aliases?: string[] | null
          category?: string
          clip_count?: number
          challenger_count?: number
        }
      }
      clips: {
        Row: {
          id: string
          user_id: string
          video_url: string
          thumbnail_url: string
          video_duration: number
          video_size: number
          caption: string | null
          mood: string
          facility_tag: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          thumbnail_url: string
          video_duration: number
          video_size: number
          caption?: string | null
          mood: string
          facility_tag?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          mood?: string
          facility_tag?: string | null
          status?: string
        }
      }
      best_plays: {
        Row: {
          id: string
          user_id: string
          video_url: string
          thumbnail_url: string
          video_duration: number
          video_size: number
          title: string | null
          mood: string | null
          facility_tag: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          thumbnail_url: string
          video_duration: number
          video_size: number
          title?: string | null
          mood?: string | null
          facility_tag?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string | null
          mood?: string | null
          facility_tag?: string | null
          sort_order?: number
        }
      }
      best_play_tricks: {
        Row: {
          best_play_id: string
          trick_id: string
          created_at: string
        }
        Insert: {
          best_play_id: string
          trick_id: string
          created_at?: string
        }
        Update: never
      }
      clip_tricks: {
        Row: {
          clip_id: string
          trick_id: string
          created_at: string
        }
        Insert: {
          clip_id: string
          trick_id: string
          created_at?: string
        }
        Update: never
      }
      user_tricks: {
        Row: {
          user_id: string
          trick_id: string
          status: string
          first_landed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          trick_id: string
          status: string
          first_landed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          first_landed_at?: string | null
        }
      }
      claps: {
        Row: {
          id: string
          clip_id: string
          user_id: string
          count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clip_id: string
          user_id: string
          count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          count?: number
        }
      }
      clip_counters: {
        Row: {
          clip_id: string
          clap_count: number
          clap_total: number
          comment_count: number
          updated_at: string
        }
        Insert: {
          clip_id: string
          clap_count?: number
          clap_total?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          clap_count?: number
          clap_total?: number
          comment_count?: number
        }
      }
      reports: {
        Row: {
          id: string
          target_type: string
          target_id: string
          reporter_user_id: string
          reason: string
          reason_detail: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          target_type: string
          target_id: string
          reporter_user_id: string
          reason: string
          reason_detail?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          status?: string
        }
      }
      deletion_logs: {
        Row: {
          id: string
          user_id: string
          clip_id: string
          deleted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clip_id: string
          deleted_at?: string
        }
        Update: never
      }
    }
  }
}
