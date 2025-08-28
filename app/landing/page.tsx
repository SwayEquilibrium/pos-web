'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  const router = useRouter()
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">🍽️</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">POS System</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Restaurant Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Streamline your restaurant operations with our comprehensive POS system. 
              Manage orders, tables, menus, and payments all in one place.
            </p>
            
            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🪑</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Table Management</h3>
                <p className="text-gray-600">Organize tables, track orders, and manage reservations efficiently</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Editor</h3>
                <p className="text-gray-600">Create and manage menus with categories, modifiers, and pricing</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing</h3>
                <p className="text-gray-600">Handle payments, gift cards, and generate receipts seamlessly</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/signup')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
              >
                🚀 Get Started Free
              </Button>
              <Button 
                onClick={() => router.push('/login')}
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg font-semibold"
              >
                🔐 Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our POS System?
            </h2>
            <p className="text-xl text-gray-600">
              Built for modern restaurants that need efficiency and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">⚡</span>
                </div>
                <CardTitle className="text-lg">Fast & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Lightning-fast order processing and reliable performance</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">🔒</span>
                </div>
                <CardTitle className="text-lg">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Enterprise-grade security for your business data</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">📱</span>
                </div>
                <CardTitle className="text-lg">Mobile Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Works perfectly on all devices and screen sizes</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">📊</span>
                </div>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Detailed insights into your business performance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600">
              © 2024 POS System. Built for modern restaurants.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
