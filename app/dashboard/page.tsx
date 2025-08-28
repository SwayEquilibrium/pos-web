'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserProfile {
  id: string
  company_id: string
  role: string
  created_at: string
}

interface Company {
  id: string
  name: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Get user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)

          // Get company info
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single()

          if (companyData) {
            setCompany(companyData)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your POS system</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👤 User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg font-semibold">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <Badge variant="secondary" className="mt-1">
                  {profile?.role || 'User'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Card */}
        {company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏢 Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Name</label>
                  <p className="text-lg font-semibold">{company.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-lg font-semibold">
                    {new Date(company.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => router.push('/tables')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-2xl">🪑</span>
                <span>Tables & Orders</span>
              </Button>
              <Button 
                onClick={() => router.push('/modules/menu')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-2xl">🍽️</span>
                <span>Menu Editor</span>
              </Button>
              <Button 
                onClick={() => router.push('/admin')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-2xl">⚙️</span>
                <span>Admin Panel</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
