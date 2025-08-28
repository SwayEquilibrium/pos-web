'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Auth data
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  // Company data
  const [companyData, setCompanyData] = useState({
    name: '',
    cvr: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: ''
  })
  
  // Personal data
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validation
      if (authData.password !== authData.confirmPassword) {
        throw new Error('Passwords do not match')
      }
      
      if (authData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      
      if (companyData.cvr.length !== 8) {
        throw new Error('CVR number must be exactly 8 digits')
      }
      
      if (companyData.postalCode.length !== 4) {
        throw new Error('Postal code must be exactly 4 digits')
      }

      console.log('Creating user account...')
      
      // Step 1: Create user account
      const { data: authResponse, error: authError } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password,
        options: {
          data: {
            first_name: personalData.firstName,
            last_name: personalData.lastName
          }
        }
      })

      if (authError) throw authError
      
      if (!authResponse.user) {
        throw new Error('Failed to create user account')
      }

      // Check if email confirmation is required
      if (authResponse.user.email_confirmed_at === null) {
        console.log('User created but email not confirmed - proceeding with company creation')
      }

      console.log('User created, creating company...')

      // Step 2: Create company and link to user
      const { data: companyId, error: companyError } = await supabase.rpc('create_company_with_user', {
        p_company_name: companyData.name,
        p_cvr: companyData.cvr,
        p_address: companyData.address,
        p_city: companyData.city,
        p_postal_code: companyData.postalCode,
        p_phone: companyData.phone || null,
        p_email: companyData.email || null,
        p_first_name: personalData.firstName || null,
        p_last_name: personalData.lastName || null
      })

      if (companyError) {
        console.error('Company creation error:', companyError)
        throw new Error(`Failed to create company: ${companyError.message}`)
      }

      console.log('Company created successfully:', companyId)
      
      // Success - redirect to main POS interface
      alert('Konto og virksomhed oprettet! Velkommen til dit POS system.')
      router.push('/')

    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mb-4">
            <button
              onClick={() => router.push('/landing')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Tilbage til forsiden
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Opret POS Konto</h1>
          <p className="text-muted-foreground">Indtast dine virksomhedsoplysninger for at komme i gang</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Personlige Oplysninger
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Fornavn</Label>
                <Input
                  id="firstName"
                  value={personalData.firstName}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Dit fornavn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternavn</Label>
                <Input
                  id="lastName"
                  value={personalData.lastName}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Dit efternavn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="din@email.dk"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Adgangskode *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 tegn"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Bekræft Adgangskode *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={authData.confirmPassword}
                  onChange={(e) => setAuthData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Gentag adgangskode"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏢 Virksomhedsoplysninger
                <Badge variant="secondary">Lovpligtige</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Disse oplysninger bruges til SAF-T rapportering og andre lovpligtige dokumenter.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyName">Virksomhedsnavn *</Label>
                <Input
                  id="companyName"
                  required
                  value={companyData.name}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Din Virksomhed ApS"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cvr">CVR-nummer *</Label>
                <Input
                  id="cvr"
                  required
                  value={companyData.cvr}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, cvr: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                  placeholder="12345678"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">8 cifre uden mellemrum</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Telefon</Label>
                <Input
                  id="companyPhone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyAddress">Adresse *</Label>
                <Input
                  id="companyAddress"
                  required
                  value={companyData.address}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Gadenavn 123, 1. th"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyCity">By *</Label>
                <Input
                  id="companyCity"
                  required
                  value={companyData.city}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="København"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyPostalCode">Postnummer *</Label>
                <Input
                  id="companyPostalCode"
                  required
                  value={companyData.postalCode}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="1000"
                  maxLength={4}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyEmail">Virksomheds Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@dinvirksomhed.dk"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Fejl:</strong> {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
            >
              {loading ? '⏳ Opretter konto...' : '🚀 Opret Konto & Virksomhed'}
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Har du allerede en konto?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:underline"
              >
                Log ind her
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
