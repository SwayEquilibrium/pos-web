'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  Plus, 
  Search, 
  CheckCircle, 
  BarChart3, 
  Download,
  ArrowLeft,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import GiftCardCreator from '@/components/GiftCardCreator'
import GiftCardLookup from '@/components/GiftCardLookup'
import GiftCardValidator from '@/components/GiftCardValidator'
import { useGiftCards, useGiftCardStats } from '@/hooks/useGiftCards'
import { formatCurrency, formatDate, getGiftCardStatusInfo, exportGiftCardsToCSV } from '@/lib/giftCardUtils'

type TabType = 'overview' | 'create' | 'lookup' | 'validate' | 'manage'

export default function GiftCardsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  const { data: giftCards, isLoading } = useGiftCards({ limit: 50 })
  const { data: stats } = useGiftCardStats()

  const tabs = [
    { id: 'overview', label: 'Oversigt', icon: BarChart3 },
    { id: 'create', label: 'Opret', icon: Plus },
    { id: 'lookup', label: 'Slå Op', icon: Search },
    { id: 'validate', label: 'Valider', icon: CheckCircle },
    { id: 'manage', label: 'Administrer', icon: Gift },
  ]

  const handleExport = () => {
    if (!giftCards) return
    
    const csv = exportGiftCardsToCSV(giftCards)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gavekort-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/modules')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Gavekort Administration
              </h1>
              <p className="text-muted-foreground">Administrer gavekort, opret nye og valider eksisterende</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!giftCards?.length}>
              <Download className="w-4 h-4 mr-2" />
              Eksporter
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Gavekort</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-50">
                        <Gift className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Aktive Gavekort</p>
                        <p className="text-2xl font-bold">{stats.active}</p>
                      </div>
                      <div className="p-3 rounded-full bg-green-50">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Udstedt Værdi</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalIssued)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-50">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Udestående Saldo</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-orange-50">
                        <CreditCard className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Gift Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Seneste Gavekort</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Indlæser gavekort...</p>
                  </div>
                ) : giftCards && giftCards.length > 0 ? (
                  <div className="space-y-4">
                    {giftCards.slice(0, 10).map((giftCard) => {
                      const statusInfo = getGiftCardStatusInfo(giftCard.status, giftCard.expiry_date)
                      return (
                        <div key={giftCard.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {giftCard.code}
                              </code>
                              <Badge className={statusInfo.color}>
                                {statusInfo.icon} {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatCurrency(giftCard.current_balance)} / {formatCurrency(giftCard.initial_amount)}</span>
                              {giftCard.recipient_name && <span>• {giftCard.recipient_name}</span>}
                              <span>• {formatDate(giftCard.issued_date)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(giftCard.current_balance)}</div>
                            <div className="text-sm text-muted-foreground">Resterende</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Ingen gavekort fundet</p>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="mt-3"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Opret Dit Første Gavekort
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'create' && (
          <GiftCardCreator 
            onGiftCardCreated={(giftCard) => {
              console.log('Gift card created:', giftCard)
              // Could show success message or redirect
            }}
          />
        )}

        {activeTab === 'lookup' && <GiftCardLookup />}

        {activeTab === 'validate' && (
          <GiftCardValidator 
            onRedemption={(result) => {
              console.log('Gift card redeemed:', result)
              // Could show success message or update stats
            }}
          />
        )}

        {activeTab === 'manage' && (
          <Card>
            <CardHeader>
              <CardTitle>Administrer Gavekort</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">Avanceret gavekort administration</p>
                <p className="text-sm text-muted-foreground">
                  Her kan du administrere eksisterende gavekort, annullere dem, se detaljeret historik og mere.
                </p>
                <div className="mt-6 space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Søg i alle gavekort
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Detaljerede rapporter
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Massiv eksport
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
