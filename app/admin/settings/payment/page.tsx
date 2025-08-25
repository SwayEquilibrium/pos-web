'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SimpleBackButton } from '@/components/BackNavigation'

interface PaymentMethod {
  id: string
  name: string
  type: 'cash' | 'card' | 'mobile_pay' | 'bank_transfer' | 'other'
  enabled: boolean
  fee_percentage?: number
  fee_fixed?: number
  provider?: string
  settings?: any
}

export default function PaymentMethodsManagement() {
  const router = useRouter()
  const [showCreateMethod, setShowCreateMethod] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)

  // Mock payment methods data
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      name: 'Kontant',
      type: 'cash',
      enabled: true
    },
    {
      id: '2',
      name: 'Dankort/Visa',
      type: 'card',
      enabled: true,
      fee_percentage: 1.5,
      provider: 'Nets'
    },
    {
      id: '3',
      name: 'MobilePay',
      type: 'mobile_pay',
      enabled: true,
      fee_percentage: 1.0,
      provider: 'MobilePay'
    },
    {
      id: '4',
      name: 'Bankoverførsel',
      type: 'bank_transfer',
      enabled: false,
      fee_fixed: 5.00
    }
  ])

  const [methodForm, setMethodForm] = useState({
    name: '',
    type: 'card' as const,
    fee_percentage: 0,
    fee_fixed: 0,
    provider: '',
    enabled: true
  })

  const handleCreateMethod = () => {
    console.log('Creating payment method:', methodForm)
    setShowCreateMethod(false)
    setMethodForm({
      name: '',
      type: 'card',
      fee_percentage: 0,
      fee_fixed: 0,
      provider: '',
      enabled: true
    })
  }

  const handleToggleMethod = (methodId: string) => {
    console.log('Toggling payment method:', methodId)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return '💵'
      case 'card': return '💳'
      case 'mobile_pay': return '📱'
      case 'bank_transfer': return '🏦'
      default: return '💰'
    }
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'cash': return 'Kontant'
      case 'card': return 'Kort'
      case 'mobile_pay': return 'MobilePay'
      case 'bank_transfer': return 'Bankoverførsel'
      case 'other': return 'Andet'
      default: return type
    }
  }

  const calculateFee = (amount: number, method: PaymentMethod) => {
    let fee = 0
    if (method.fee_percentage) {
      fee += (amount * method.fee_percentage) / 100
    }
    if (method.fee_fixed) {
      fee += method.fee_fixed
    }
    return fee
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <SimpleBackButton onBack={() => router.push('/admin')} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Betalingsmetoder</h1>
          <p className="text-muted-foreground">Administrer tilgængelige betalingsmetoder</p>
        </div>
        <Button 
          onClick={() => setShowCreateMethod(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          💳 Tilføj Betalingsmetode
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <p className="text-sm text-muted-foreground">Total Metoder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{paymentMethods.filter(m => m.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Aktive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{paymentMethods.filter(m => !m.enabled).length}</div>
            <p className="text-sm text-muted-foreground">Deaktiverede</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {(paymentMethods.reduce((sum, m) => sum + (m.fee_percentage || 0), 0) / paymentMethods.length).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Gns. Gebyr</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Payment Method Form */}
      {showCreateMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Tilføj Betalingsmetode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="methodName">Navn *</Label>
                <Input
                  id="methodName"
                  value={methodForm.name}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Betalingsmetode navn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodType">Type *</Label>
                <select
                  id="methodType"
                  className="w-full px-3 py-2 border rounded-md"
                  value={methodForm.type}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="cash">Kontant</option>
                  <option value="card">Kort</option>
                  <option value="mobile_pay">MobilePay</option>
                  <option value="bank_transfer">Bankoverførsel</option>
                  <option value="other">Andet</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodProvider">Udbyder</Label>
                <Input
                  id="methodProvider"
                  value={methodForm.provider}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="f.eks. Nets, MobilePay"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={methodForm.enabled}
                    onChange={(e) => setMethodForm(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  Aktiv fra start
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodFeePercentage">Gebyr (%) - Valgfrit</Label>
                <Input
                  id="methodFeePercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={methodForm.fee_percentage}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, fee_percentage: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodFeeFixed">Fast Gebyr (kr) - Valgfrit</Label>
                <Input
                  id="methodFeeFixed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={methodForm.fee_fixed}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, fee_fixed: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Gebyrberegning:</h4>
              <p className="text-sm text-muted-foreground">
                Eksempel på 100 kr handel: 
                {methodForm.fee_percentage > 0 || methodForm.fee_fixed > 0 ? (
                  <span className="font-medium ml-1">
                    {calculateFee(100, methodForm as PaymentMethod).toFixed(2)} kr i gebyr
                  </span>
                ) : (
                  <span className="ml-1">Ingen gebyrer</span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateMethod}>Gem Betalingsmetode</Button>
              <Button variant="outline" onClick={() => setShowCreateMethod(false)}>Annuller</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <Card>
        <CardHeader>
          <CardTitle>Betalingsmetoder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getTypeIcon(method.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{method.name}</h3>
                      <Badge variant="outline">
                        {getTypeDisplayName(method.type)}
                      </Badge>
                      <Badge variant={method.enabled ? 'default' : 'secondary'}>
                        {method.enabled ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {method.provider && <p>Udbyder: {method.provider}</p>}
                      {(method.fee_percentage || method.fee_fixed) && (
                        <p>
                          Gebyr: 
                          {method.fee_percentage && <span> {method.fee_percentage}%</span>}
                          {method.fee_percentage && method.fee_fixed && <span> + </span>}
                          {method.fee_fixed && <span> {method.fee_fixed} kr</span>}
                        </p>
                      )}
                      <p>Eksempel (100 kr): {calculateFee(100, method).toFixed(2)} kr gebyr</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedMethod(method)}
                  >
                    Rediger
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleMethod(method.id)}
                  >
                    {method.enabled ? 'Deaktiver' : 'Aktiver'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                  >
                    Slet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Details/Edit Modal */}
      {selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Rediger: {selectedMethod.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input defaultValue={selectedMethod.name} />
              </div>
              <div className="space-y-2">
                <Label>Udbyder</Label>
                <Input defaultValue={selectedMethod.provider || ''} />
              </div>
              <div className="space-y-2">
                <Label>Gebyr (%)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  defaultValue={selectedMethod.fee_percentage || 0} 
                />
              </div>
              <div className="space-y-2">
                <Label>Fast Gebyr (kr)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  defaultValue={selectedMethod.fee_fixed || 0} 
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Avancerede Indstillinger</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Nøgle</Label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://..." />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button>Gem Ændringer</Button>
              <Button variant="outline" onClick={() => setSelectedMethod(null)}>Annuller</Button>
              <Button variant="outline">Test Forbindelse</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Help */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Integrationer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Nets</h4>
              <p className="text-sm text-muted-foreground mb-3">Dansk kortbetalingsudbyder</p>
              <Button size="sm" variant="outline">Konfigurer</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">MobilePay</h4>
              <p className="text-sm text-muted-foreground mb-3">Danmarks mest populære mobilbetaling</p>
              <Button size="sm" variant="outline">Konfigurer</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Stripe</h4>
              <p className="text-sm text-muted-foreground mb-3">International betalingsudbyder</p>
              <Button size="sm" variant="outline">Konfigurer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
