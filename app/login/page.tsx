'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Login form submitted') // Debug log
    
    setErr(null)
    setLoading(true)
    
    try {
      console.log('Attempting login with:', email) // Debug log
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      console.log('Login response:', { data, error }) // Debug log
      
      if (error) { 
        console.error('Login error:', error) // Debug log
        
        // Handle specific error for unconfirmed email
        if (error.message.includes('Email not confirmed')) {
          setErr('Email not confirmed. Please check your email and click the confirmation link, or contact support to disable email confirmation.')
        } else {
          setErr(error.message)
        }
        return 
      }
      
      console.log('Login successful, redirecting...') // Debug log
      
      // Check if there's a redirect URL, otherwise go to main POS interface
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo') || '/'
      
      console.log('Redirecting to:', redirectTo) // Debug log
      router.push(redirectTo)
      
    } catch (err) {
      console.error('Unexpected error during login:', err) // Debug log
      setErr('An unexpected error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-foreground">👤</span>
          </div>
          <CardTitle className="text-2xl font-bold">Log ind</CardTitle>
          <CardDescription>
            Indtast dine login-oplysninger
          </CardDescription>
          <div className="pt-2">
            <button
              onClick={() => router.push('/landing')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Tilbage til forsiden
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Logger ind...' : 'Log ind'}
            </Button>
            {err && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{err}</p>
              </div>
            )}
          </form>
          
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Har du ikke en konto?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-blue-600 hover:underline font-medium"
              >
                Opret virksomhedskonto
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
