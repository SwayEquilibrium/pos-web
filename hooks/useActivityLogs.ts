'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface AuditLog {
  id: string
  table_name: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  record_id: string
  old_data?: any
  new_data?: any
  changed_fields?: string[]
  user_email?: string
  created_at: string
}

export interface UserActivityLog {
  id: string
  action: string
  resource_type?: string
  resource_id?: string
  details: any
  user_email?: string
  ip_address?: string
  created_at: string
}

export interface PaymentLog {
  id: string
  order_id: string
  payment_method: string
  amount: number
  currency: string
  status: string
  transaction_reference?: string
  processed_by_email?: string
  processed_at?: string
  created_at: string
}

export interface SettingsChangeLog {
  id: string
  setting_category: string
  setting_key: string
  old_value: any
  new_value: any
  reason?: string
  user_email?: string
  created_at: string
}

// Get audit logs with pagination
export function useAuditLogs(page: number = 1, pageSize: number = 50, filters?: {
  table_name?: string
  operation?: string
  date_from?: string
  date_to?: string
}) {
  return useQuery({
    queryKey: ['audit-logs', page, pageSize, filters],
    queryFn: async (): Promise<{ data: AuditLog[], total: number }> => {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          table_name,
          operation,
          record_id,
          old_data,
          new_data,
          changed_fields,
          created_at,
          user_id,
          users:user_id(email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name)
      }
      if (filters?.operation) {
        query = query.eq('operation', filters.operation)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from + 'T00:00:00Z')
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59Z')
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching audit logs:', error)
        throw new Error(`Failed to fetch audit logs: ${error.message}`)
      }
      
      const formattedData: AuditLog[] = (data || []).map(log => ({
        ...log,
        user_email: (log as any).users?.email || 'System'
      }))
      
      return {
        data: formattedData,
        total: count || 0
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get user activity logs
export function useUserActivityLogs(page: number = 1, pageSize: number = 50, filters?: {
  action?: string
  resource_type?: string
  date_from?: string
  date_to?: string
}) {
  return useQuery({
    queryKey: ['user-activity-logs', page, pageSize, filters],
    queryFn: async (): Promise<{ data: UserActivityLog[], total: number }> => {
      let query = supabase
        .from('user_activity_logs')
        .select(`
          id,
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          created_at,
          user_id,
          users:user_id(email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.action) {
        query = query.eq('action', filters.action)
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from + 'T00:00:00Z')
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59Z')
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching user activity logs:', error)
        throw new Error(`Failed to fetch user activity logs: ${error.message}`)
      }
      
      const formattedData: UserActivityLog[] = (data || []).map(log => ({
        ...log,
        user_email: (log as any).users?.email || 'System'
      }))
      
      return {
        data: formattedData,
        total: count || 0
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get payment logs
export function usePaymentLogs(page: number = 1, pageSize: number = 50, filters?: {
  payment_method?: string
  status?: string
  date_from?: string
  date_to?: string
}) {
  return useQuery({
    queryKey: ['payment-logs', page, pageSize, filters],
    queryFn: async (): Promise<{ data: PaymentLog[], total: number }> => {
      let query = supabase
        .from('payment_logs')
        .select(`
          id,
          order_id,
          payment_method,
          amount,
          currency,
          status,
          transaction_reference,
          processed_at,
          created_at,
          processed_by,
          processed_by_user:processed_by(email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.payment_method) {
        query = query.eq('payment_method', filters.payment_method)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from + 'T00:00:00Z')
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59Z')
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching payment logs:', error)
        throw new Error(`Failed to fetch payment logs: ${error.message}`)
      }
      
      const formattedData: PaymentLog[] = (data || []).map(log => ({
        ...log,
        processed_by_email: (log as any).processed_by_user?.email || 'System'
      }))
      
      return {
        data: formattedData,
        total: count || 0
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get settings change logs
export function useSettingsChangeLogs(page: number = 1, pageSize: number = 50, filters?: {
  setting_category?: string
  date_from?: string
  date_to?: string
}) {
  return useQuery({
    queryKey: ['settings-change-logs', page, pageSize, filters],
    queryFn: async (): Promise<{ data: SettingsChangeLog[], total: number }> => {
      let query = supabase
        .from('settings_change_logs')
        .select(`
          id,
          setting_category,
          setting_key,
          old_value,
          new_value,
          reason,
          created_at,
          user_id,
          users:user_id(email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
      
      // Apply filters
      if (filters?.setting_category) {
        query = query.eq('setting_category', filters.setting_category)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from + 'T00:00:00Z')
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59Z')
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching settings change logs:', error)
        throw new Error(`Failed to fetch settings change logs: ${error.message}`)
      }
      
      const formattedData: SettingsChangeLog[] = (data || []).map(log => ({
        ...log,
        user_email: (log as any).users?.email || 'System'
      }))
      
      return {
        data: formattedData,
        total: count || 0
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Log custom user activity
export function useLogActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      action: string
      resource_type?: string
      resource_id?: string
      details?: any
    }) => {
      const { error } = await supabase.rpc('log_user_activity', {
        p_action: params.action,
        p_resource_type: params.resource_type,
        p_resource_id: params.resource_id,
        p_details: params.details || {}
      })
      
      if (error) {
        console.error('Error logging activity:', error)
        throw new Error(`Failed to log activity: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidate activity logs to show the new entry
      queryClient.invalidateQueries({ queryKey: ['user-activity-logs'] })
    }
  })
}
