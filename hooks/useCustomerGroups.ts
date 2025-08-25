import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useCompany } from './useCompany'

export interface CustomerGroup {
  id: string
  company_id: string
  display_name: string
  discount_percentage: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCustomerGroupParams {
  display_name: string
  discount_percentage: number
  description?: string
}

class CustomerGroupService {
  /**
   * Get all customer groups for a company
   */
  async getCustomerGroups(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Error fetching customer groups:', error)
        throw new Error(error.message)
      }

      return data as CustomerGroup[]
    } catch (error) {
      console.error('Error in getCustomerGroups:', error)
      throw error
    }
  }

  /**
   * Create a new customer group
   */
  async createCustomerGroup(companyId: string, params: CreateCustomerGroupParams) {
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .insert([{
          company_id: companyId,
          display_name: params.display_name,
          discount_percentage: params.discount_percentage,
          description: params.description,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating customer group:', error)
        throw new Error(error.message)
      }

      return data as CustomerGroup
    } catch (error) {
      console.error('Error in createCustomerGroup:', error)
      throw error
    }
  }

  /**
   * Update a customer group
   */
  async updateCustomerGroup(groupId: string, params: Partial<CreateCustomerGroupParams>) {
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .update({
          ...params,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
        .select()
        .single()

      if (error) {
        console.error('Error updating customer group:', error)
        throw new Error(error.message)
      }

      return data as CustomerGroup
    } catch (error) {
      console.error('Error in updateCustomerGroup:', error)
      throw error
    }
  }

  /**
   * Delete a customer group (soft delete)
   */
  async deleteCustomerGroup(groupId: string) {
    try {
      const { error } = await supabase
        .from('customer_groups')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (error) {
        console.error('Error deleting customer group:', error)
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteCustomerGroup:', error)
      throw error
    }
  }
}

const customerGroupService = new CustomerGroupService()

export function useCustomerGroups() {
  const { company } = useCompany()

  return useQuery({
    queryKey: ['customerGroups', company?.id],
    queryFn: () => customerGroupService.getCustomerGroups(company!.id),
    enabled: !!company?.id,
    staleTime: 300000, // 5 minutes - customer groups don't change often
  })
}

export function useCreateCustomerGroup() {
  const queryClient = useQueryClient()
  const { company } = useCompany()

  return useMutation({
    mutationFn: (params: CreateCustomerGroupParams) =>
      customerGroupService.createCustomerGroup(company!.id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] })
    },
  })
}

export function useUpdateCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, params }: { groupId: string; params: Partial<CreateCustomerGroupParams> }) =>
      customerGroupService.updateCustomerGroup(groupId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] })
    },
  })
}

export function useDeleteCustomerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) =>
      customerGroupService.deleteCustomerGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] })
    },
  })
}
