'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface Company {
  id: string
  name: string
  cvr: string
  address: string
  city: string
  postal_code: string
  country: string
  phone?: string
  email?: string
  website?: string
  vat_number?: string
}

export interface UserProfile {
  id: string
  company_id?: string
  role: 'admin' | 'manager' | 'cashier'
  first_name?: string
  last_name?: string
}

// Get current user's company
export function useCurrentCompany() {
  return useQuery({
    queryKey: ['current-company'],
    queryFn: async (): Promise<Company | null> => {
      try {
        // Get current user first
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        // Get user profile to find company_id
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        // Handle different error scenarios
        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // No profile found - this is expected for new users
            if (process.env.NODE_ENV === 'development') {
              console.warn('No user profile found - user needs to complete signup')
            }
            return null
          } else if (profileError.code === '42P01' || profileError.message?.includes('Could not find the table')) {
            // Table doesn't exist - provide clear setup instructions
            if (process.env.NODE_ENV === 'development') {
              console.warn('🔧 SETUP REQUIRED: user_profiles table does not exist')
              console.warn('📋 Run this SQL in Supabase SQL Editor:')
              console.warn(`
-- Minimal Company Setup
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL DEFAULT 'My Restaurant',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "Allow authenticated users to read companies" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);
              `)
            }
            return null
          } else {
            // Other database error
            if (process.env.NODE_ENV === 'development' && profileError.message) {
              console.warn('Database error fetching user profile:', profileError.message)
            }
            return null
          }
        }

        // Profile exists but no company_id
        if (!profile?.company_id) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('User profile exists but no company_id - user needs to complete company setup')
          }
          return null
        }

        // Get company details
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()
        
        if (error) {
          // Log error in development, handle gracefully in production
          if (process.env.NODE_ENV === 'development' && error.message) {
            console.error('Error fetching current company:', error.message)
          }
          return null
        }
        
        return data
      } catch (error) {
        // Catch any unexpected errors
        if (process.env.NODE_ENV === 'development') {
          console.warn('Company fetch failed, continuing without company info:', error)
        }
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure
  })
}

// Get current user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is expected for new users
          if (process.env.NODE_ENV === 'development') {
            console.warn('No user profile found - user needs to complete signup')
          }
          return null
        } else {
          // Other database error
          if (process.env.NODE_ENV === 'development') {
            console.error('Database error fetching user profile:', error)
          }
          return null
        }
      }
      
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update company information
export function useUpdateCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (companyData: Partial<Company>): Promise<Company> => {
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyData.id)
        .select()
        .single()
      
      if (error) {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error updating company:', error)
        }
        throw new Error(`Failed to update company: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch company data
      queryClient.invalidateQueries({ queryKey: ['current-company'] })
    }
  })
}

// Update user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error updating user profile:', error)
        }
        throw new Error(`Failed to update profile: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    }
  })
}
