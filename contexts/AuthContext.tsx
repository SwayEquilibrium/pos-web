'use client'

import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User, Session } from '@supabase/auth-helpers-nextjs'

// ================================================
// AUTH CONTEXT - AUTHENTICATION MANAGEMENT
// ================================================

interface AuthContextType {
  // Data
  user: User | null
  session: Session | null
  
  // Loading & Error states
  isLoading: boolean
  error: any
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  
  // Computed values
  isAuthenticated: boolean
  isAdmin: boolean
  userId: string | null
  userEmail: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ================================================
// PROVIDER COMPONENT
// ================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    getSession()
  }, [supabase.auth])
  
  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
        
        if (event === 'SIGNED_IN') {
          router.refresh()
        } else if (event === 'SIGNED_OUT') {
          router.refresh()
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [supabase.auth, router])
  
  // Actions
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error)
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth])
  
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setError(error)
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth])
  
  const signOut = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setError(error)
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth])
  
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) {
        setError(error)
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth])
  
  // Computed values
  const isAuthenticated = !!user
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'admin@example.com'
  const userId = user?.id || null
  const userEmail = user?.email || null
  
  const value: AuthContextType = {
    // Data
    user,
    session,
    
    // Loading & Error states
    isLoading,
    error,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    
    // Computed values
    isAuthenticated,
    isAdmin,
    userId,
    userEmail,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ================================================
// HOOK
// ================================================

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

// ================================================
// UTILITY HOOKS
// ================================================

export function useAuth() {
  const { user, session, isAuthenticated, isLoading, error } = useAuthContext()
  return { user, session, isAuthenticated, isLoading, error }
}

export function useUser() {
  const { user, userId, userEmail, isAdmin } = useAuthContext()
  
  const userProfile = user ? {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0],
    avatar: user.user_metadata?.avatar_url,
    role: user.user_metadata?.role || 'user',
    isAdmin,
  } : null
  
  return {
    user,
    userProfile,
    userId,
    userEmail,
    isAdmin,
  }
}

export function useAuthActions() {
  const { signIn, signUp, signOut, resetPassword, isLoading } = useAuthContext()
  
  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    isLoading,
  }
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])
  
  return { isAuthenticated, isLoading }
}

export function useRequireAdmin() {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/login')
    }
  }, [isAuthenticated, isAdmin, isLoading, router])
  
  return { isAuthenticated, isAdmin, isLoading }
}
