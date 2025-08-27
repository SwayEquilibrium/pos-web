'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { useTranslation } from '@/contexts/LanguageContext'
import { useCurrentCompany, useUpdateCompany } from '@/hooks/useCompany'
import { showToast } from '@/lib/toast'
import LanguageToggle from '@/components/LanguageToggle'
import { Upload, X, Building2, Globe, Image as ImageIcon } from 'lucide-react'
import { enableContextualSave, BusinessSettingsFormV1 } from '@/proposals/glue/contextualSave.v1'

export default function BusinessSettings() {
  // Use new contextual save version if enabled
  if (enableContextualSave) {
    return <BusinessSettingsFormV1 />
  }

  // Fallback to original implementation
  const router = useRouter()
  const { t } = useTranslation()
  const { data: currentCompany, isLoading: companyLoading } = useCurrentCompany()
  const updateCompany = useUpdateCompany()

  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    cvr: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'DK',
    phone: '',
    email: '',
    logo_url: '',
    receipt_message: ''
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Auto-populate form when data loads
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
        email: currentCompany.email || '',
        logo_url: currentCompany.logo_url || '',
        receipt_message: currentCompany.receipt_message || ''
      })
      setLogoPreview(currentCompany.logo_url || '')
    }
  }, [currentCompany])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast.error(t('language') === 'da' ? 'Filen er for stor. Maksimalt 2MB.' : 'File too large. Maximum 2MB.')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error(t('language') === 'da' ? 'Kun billedfiler er tilladt.' : 'Only image files are allowed.')
        return
      }

      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setCompanyInfo(prev => ({ ...prev, logo_url: '' }))
  }

  const handleUpdateCompany = async () => {
    if (!currentCompany) return
    
    try {
      let logoUrl = companyInfo.logo_url

      // If there's a new logo file, upload it first
      if (logoFile) {
        setUploadingLogo(true)
        
        // In a real app, you would upload to a storage service
        // For now, we'll simulate with a data URL
        const reader = new FileReader()
        reader.onload = async (e) => {
          logoUrl = e.target?.result as string
          
          // Update company with new logo
          await updateCompany.mutateAsync({
            id: currentCompany.id,
            name: companyInfo.name,
            address: companyInfo.address,
            city: companyInfo.city,
            postal_code: companyInfo.postalCode,
            phone: companyInfo.phone,
            email: companyInfo.email,
            logo_url: logoUrl,
            receipt_message: companyInfo.receipt_message
          })
          
          setUploadingLogo(false)
          showToast.success(t('saveSuccess'))
        }
        reader.readAsDataURL(logoFile)
      } else {
        // Update company without logo change
        await updateCompany.mutateAsync({
          id: currentCompany.id,
          name: companyInfo.name,
          address: companyInfo.address,
          city: companyInfo.city,
          postal_code: companyInfo.postalCode,
          phone: companyInfo.phone,
          email: companyInfo.email,
          logo_url: logoUrl,
          receipt_message: companyInfo.receipt_message
        })
        showToast.success(t('saveSuccess'))
      }
    } catch (error) {
      console.error('Company update error:', error)
      showToast.error(t('saveError') + ': ' + (error instanceof Error ? error.message : t('unknownError')))
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('businessSettings')}</h2>
        <p className="text-gray-600">
          {t('language') === 'da'
            ? 'Administrer virksomhedsoplysninger, logo og sprogindstillinger'
            : 'Manage company information, logo and language settings'
          }
        </p>
      </div>

      {/* Loading State */}
      {companyLoading && (
        <div className="text-center py-8">
          <p>⏳ {t('loading')}</p>
        </div>
      )}

      {!companyLoading && (
        <div className="space-y-6">
          {/* Company Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon size={20} />
                {t('companyLogo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo Preview */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Company Logo" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon size={32} className="mx-auto mb-2" />
                        <p className="text-sm">
                          {t('language') === 'da' ? 'Intet logo' : 'No logo'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {logoPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} className="mr-2" />
                      {t('removeLogo')}
                    </Button>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="logo-upload" className="block mb-2">
                      {t('uploadLogo')}
                    </Label>
                    <div className="flex items-center gap-4">
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={uploadingLogo}
                      >
                        <Upload size={16} className="mr-2" />
                        {uploadingLogo ? t('loading') : t('uploadLogo')}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('logoUploadHint')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 size={20} />
                {t('businessInformation')}
                <Badge variant="secondary">
                  {t('language') === 'da' ? 'Lovpligtige' : 'Required'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('language') === 'da' 
                  ? 'Disse oplysninger bruges automatisk til rapporter og dokumenter.'
                  : 'This information is automatically used for reports and documents.'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">{t('name')}</Label>
                  <Input
                    id="companyName"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('language') === 'da' ? 'Din Virksomhed ApS' : 'Your Company Ltd'}
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
                  <p className="text-xs text-muted-foreground">
                    {t('language') === 'da' ? 'CVR-nummer kan ikke ændres' : 'CVR number cannot be changed'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+45 12 34 56 78"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Input
                    id="address"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={t('language') === 'da' ? 'Gadenavn 123' : 'Street Name 123'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">{t('city')}</Label>
                  <Input
                    id="city"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('language') === 'da' ? 'København' : 'Copenhagen'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t('postalCode')}</Label>
                  <Input
                    id="postalCode"
                    value={companyInfo.postalCode}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="1000"
                    maxLength={4}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyEmail">{t('email')}</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('language') === 'da' ? 'info@dinvirksomhed.dk' : 'info@yourcompany.com'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🧾</span>
                {t('language') === 'da' ? 'Kvitteringsbesked' : 'Receipt Message'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('language') === 'da'
                  ? 'Denne besked vises nederst på kundekvitteringer'
                  : 'This message will appear at the bottom of customer receipts'
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="receiptMessage">
                  {t('language') === 'da' ? 'Besked på kvittering' : 'Receipt Message'}
                </Label>
                <textarea
                  id="receiptMessage"
                  value={companyInfo.receipt_message}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, receipt_message: e.target.value }))}
                  placeholder={t('language') === 'da' ? 'Tak for dit besøg! Vi ses snart igen.' : 'Thank you for your visit! See you soon.'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {companyInfo.receipt_message.length}/200 {t('language') === 'da' ? 'tegn' : 'characters'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} />
                {t('languageSettings')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('language') === 'da' 
                  ? 'Vælg dit foretrukne sprog for systemets brugerflade'
                  : 'Select your preferred language for the system interface'
                }
              </p>
            </CardHeader>
            <CardContent>
              <LanguageToggle />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleUpdateCompany}
              disabled={updateCompany.isPending || uploadingLogo || !currentCompany}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {(updateCompany.isPending || uploadingLogo) ? `⏳ ${t('saving')}` : `💾 ${t('save')} ${t('settings')}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
