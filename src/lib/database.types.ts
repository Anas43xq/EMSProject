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
          email: string
          role: 'admin' | 'hr' | 'employee'
          employee_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'hr' | 'employee'
          employee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'hr' | 'employee'
          employee_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          type: 'academic' | 'administrative'
          head_id: string | null
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'academic' | 'administrative'
          head_id?: string | null
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'academic' | 'administrative'
          head_id?: string | null
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          employee_number: string
          first_name: string
          last_name: string
          email: string
          phone: string
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          address: string
          city: string
          state: string
          postal_code: string
          department_id: string | null
          position: string
          employment_type: 'full-time' | 'part-time' | 'contract'
          status: 'active' | 'inactive' | 'on-leave'
          hire_date: string
          termination_date: string | null
          salary: number
          photo_url: string | null
          qualifications: Json
          emergency_contact_name: string
          emergency_contact_phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_number: string
          first_name: string
          last_name: string
          email: string
          phone?: string
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string
          city?: string
          state?: string
          postal_code?: string
          department_id?: string | null
          position: string
          employment_type?: 'full-time' | 'part-time' | 'contract'
          status?: 'active' | 'inactive' | 'on-leave'
          hire_date: string
          termination_date?: string | null
          salary?: number
          photo_url?: string | null
          qualifications?: Json
          emergency_contact_name?: string
          emergency_contact_phone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_number?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string
          city?: string
          state?: string
          postal_code?: string
          department_id?: string | null
          position?: string
          employment_type?: 'full-time' | 'part-time' | 'contract'
          status?: 'active' | 'inactive' | 'on-leave'
          hire_date?: string
          termination_date?: string | null
          salary?: number
          photo_url?: string | null
          qualifications?: Json
          emergency_contact_name?: string
          emergency_contact_phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      leaves: {
        Row: {
          id: string
          employee_id: string
          leave_type: 'annual' | 'sick' | 'casual' | 'sabbatical'
          start_date: string
          end_date: string
          days_count: number
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: 'annual' | 'sick' | 'casual' | 'sabbatical'
          start_date: string
          end_date: string
          days_count: number
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: 'annual' | 'sick' | 'casual' | 'sabbatical'
          start_date?: string
          end_date?: string
          days_count?: number
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leave_balances: {
        Row: {
          id: string
          employee_id: string
          year: number
          annual_total: number
          annual_used: number
          sick_total: number
          sick_used: number
          casual_total: number
          casual_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          year: number
          annual_total?: number
          annual_used?: number
          sick_total?: number
          sick_used?: number
          casual_total?: number
          casual_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          year?: number
          annual_total?: number
          annual_used?: number
          sick_total?: number
          sick_used?: number
          casual_total?: number
          casual_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          date: string
          check_in: string | null
          check_out: string | null
          status: 'present' | 'absent' | 'late' | 'half-day'
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          check_in?: string | null
          check_out?: string | null
          status?: 'present' | 'absent' | 'late' | 'half-day'
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          status?: 'present' | 'absent' | 'late' | 'half-day'
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'leave' | 'attendance' | 'system'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'leave' | 'attendance' | 'system'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'leave' | 'attendance' | 'system'
          is_read?: boolean
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          email_leave_approvals: boolean
          email_attendance_reminders: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_leave_approvals?: boolean
          email_attendance_reminders?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_leave_approvals?: boolean
          email_attendance_reminders?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by: string
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_by?: string
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
