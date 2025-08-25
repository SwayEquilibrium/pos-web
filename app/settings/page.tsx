'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useSAFTExport } from '@/hooks/useSAFT'
import { useCurrentCompany, useUserProfile, useUpdateCompany, useUpdateUserProfile } from '@/hooks/useCompany'
import ActivityLogs from './components/ActivityLogs'

export default function SettingsPage() {
  // Fetch current company and user data
  const { data: currentCompany, isLoading: companyLoading } = useCurrentCompany()
  const { data: userProfile, isLoading: profileLoading } = useUserProfile()
  const updateCompany = useUpdateCompany()
  const updateProfile = useUpdateUserProfile()
  const saftExport = useSAFTExport()

  // Active section state
  const [activeSection, setActiveSection] = useState<'profile' | 'company' | 'saft' | 'logs' | 'system'>('profile')

  // Company form state
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    cvr: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'DK',
    phone: '',
    email: ''
  })
  
  // User profile form state
  const [profileInfo, setProfileInfo] = useState({
    firstName: '',
    lastName: ''
  })
  
  const [reportPeriod, setReportPeriod] = useState({
    startDate: '',
    endDate: ''
  })

  // Auto-populate forms when data loads
  useEffect(() => {
    if (currentCompany) {
      setCompanyInfo({
        name: currentCompany.name || '',
        cvr: currentCompany.cvr || '',
        address: currentCompany.address || '',
        city: currentCompany.city || '',
        postalCode: currentCompany.postal_code || '',
        country: currentCompany.country || 'DK',
        phone: currentCompany.phone || '',
        email: currentCompany.email || ''
      })
    }
  }, [currentCompany])

  useEffect(() => {
    if (userProfile) {
      setProfileInfo({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || ''
      })
    }
  }, [userProfile])

  const handleUpdateCompany = async () => {
    if (!currentCompany) return
    
    try {
      await updateCompany.mutateAsync({
        id: currentCompany.id,
        name: companyInfo.name,
        address: companyInfo.address,
        city: companyInfo.city,
        postal_code: companyInfo.postalCode,
        phone: companyInfo.phone,
        email: companyInfo.email
      })
      alert('Virksomhedsoplysninger opdateret!')
    } catch (error) {
      console.error('Company update error:', error)
      alert('Fejl ved opdatering: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: profileInfo.firstName,
        last_name: profileInfo.lastName
      })
      alert('Profil opdateret!')
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Fejl ved opdatering: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  const handleExportSAFT = async () => {
    if (!currentCompany) {
      alert('Ingen virksomhedsoplysninger fundet. Kontakt support.')
      return
    }

    try {
      // Use current company data for SAF-T export
      const blob = await saftExport.mutateAsync({
        companyInfo: {
          name: currentCompany.name,
          cvr: currentCompany.cvr,
          address: currentCompany.address,
          city: currentCompany.city,
          postalCode: currentCompany.postal_code,
          country: currentCompany.country
        },
        startDate: reportPeriod.startDate,
        endDate: reportPeriod.endDate
      })
      
      // Download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SAF-T_${currentCompany.cvr}_${reportPeriod.startDate}_${reportPeriod.endDate}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('SAF-T export error:', error)
      alert('Fejl ved generering af SAF-T rapport: ' + (error instanceof Error ? error.message : 'Ukendt fejl'))
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Indstillinger</h1>
          <p className="text-muted-foreground">Administrer virksomhedsoplysninger, profil og rapporter</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeSection === 'profile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('profile')}
          >
            👤 Min Profil
          </Button>
          <Button
            variant={activeSection === 'company' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('company')}
          >
            🏢 Virksomhed
          </Button>
          <Button
            variant={activeSection === 'saft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('saft')}
          >
            📊 SAF-T Rapport
          </Button>
          <Button
            variant={activeSection === 'logs' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('logs')}
          >
            📋 Log Aktivitet
          </Button>
          <Button
            variant={activeSection === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('system')}
          >
            ⚙️ System
          </Button>
        </div>

        {/* Loading State */}
        {(companyLoading || profileLoading) && activeSection !== 'logs' && (
          <div className="text-center py-8">
            <p>⏳ Indlæser data...</p>
          </div>
        )}

        {/* User Profile Section */}
        {activeSection === 'profile' && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👤 Min Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Fornavn</Label>
                <Input
                  id="firstName"
                  value={profileInfo.firstName}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Dit fornavn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternavn</Label>
                <Input
                  id="lastName"
                  value={profileInfo.lastName}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Dit efternavn"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleUpdateProfile}
                disabled={updateProfile.isPending}
                variant="outline"
              >
                {updateProfile.isPending ? '⏳ Opdaterer...' : '💾 Gem Profil'}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Company Information Section */}
        {activeSection === 'company' && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏢 Virksomhedsoplysninger
              <Badge variant="secondary">Lovpligtige</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Disse oplysninger bruges automatisk til SAF-T rapporter og andre dokumenter.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyName">Virksomhedsnavn</Label>
                <Input
                  id="companyName"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Din Virksomhed ApS"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cvr">CVR-nummer</Label>
                <Input
                  id="cvr"
                  value={companyInfo.cvr}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">CVR-nummer kan ikke ændres</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Gadenavn 123"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">By</Label>
                <Input
                  id="city"
                  value={companyInfo.city}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="København"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  value={companyInfo.postalCode}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="1000"
                  maxLength={4}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@dinvirksomhed.dk"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleUpdateCompany}
                disabled={updateCompany.isPending || !currentCompany}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateCompany.isPending ? '⏳ Opdaterer...' : '💾 Gem Virksomhedsoplysninger'}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* SAF-T Section */}
        {activeSection === 'saft' && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 SAF-T Rapport
              <Badge variant="secondary">Lovpligtig</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Standard Audit File for Tax (SAF-T) er en lovpligtig rapportering til SKAT. 
              Rapporten indeholder alle regnskabsdata i et standardiseret XML-format.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Company Info Display */}
            {currentCompany && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Virksomhedsoplysninger (bruges automatisk):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Virksomhed:</strong> {currentCompany.name}</div>
                  <div><strong>CVR:</strong> {currentCompany.cvr}</div>
                  <div><strong>Adresse:</strong> {currentCompany.address}</div>
                  <div><strong>By:</strong> {currentCompany.city} {currentCompany.postal_code}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Opdater virksomhedsoplysninger i afsnittet ovenfor hvis nødvendigt.
                </p>
              </div>
            )}

            {/* Report Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fra dato</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={reportPeriod.startDate}
                  onChange={(e) => setReportPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Til dato</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={reportPeriod.endDate}
                  onChange={(e) => setReportPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* SAF-T Content Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">SAF-T rapporten indeholder:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>• Virksomhedsoplysninger og CVR-nummer</div>
                <div>• Alle transaktionsdata og posteringer</div>
                <div>• Kontoplan og saldooplysninger</div>
                <div>• Momskoder og momsafregning</div>
                <div>• Debitor- og kreditoroplysninger</div>
                <div>• Fakturaer og betalingshistorik</div>
                <div>• Lageroplysninger og bevægelser</div>
                <div>• Revisionsspor og ændringer</div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleExportSAFT}
                disabled={!currentCompany || !reportPeriod.startDate || !reportPeriod.endDate || saftExport.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saftExport.isPending ? '⏳ Genererer...' : '📥 Download SAF-T Rapport'}
              </Button>
            </div>

            {/* Legal Notice */}
            <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
              <strong>Juridisk bemærkning:</strong> SAF-T rapportering er lovpligtig i Danmark iht. bogføringsloven. 
              Kun certificerede regnskabsprogrammer kan generere korrekte SAF-T filer. Denne funktion er til 
              demonstrationsformål og skal verificeres af en revisor før indsendelse til SKAT.
            </div>
          </CardContent>
        </Card>
        )}

        {/* Activity Logs Section */}
        {activeSection === 'logs' && (
          <ActivityLogs />
        )}

        {/* Other Settings */}
        {activeSection === 'system' && (
          <Card>
          <CardHeader>
            <CardTitle>⚙️ Systemindstillinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Andre systemindstillinger kommer her...</p>
              <p className="text-sm mt-2">Momssatser, printerindstillinger, backup osv.</p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}
