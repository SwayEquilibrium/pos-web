'use client'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { Language } from '@/lib/translations'
import { showToast } from '@/lib/toast'

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    showToast.success(
      newLanguage === 'da' 
        ? 'Sprog ændret til dansk' 
        : 'Language changed to English'
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {t('selectLanguage')}:
        </span>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={language === 'da' ? 'default' : 'outline'}
          onClick={() => handleLanguageChange('da')}
          className="flex items-center gap-2"
        >
          🇩🇰 {t('danish')}
        </Button>
        
        <Button
          variant={language === 'en' ? 'default' : 'outline'}
          onClick={() => handleLanguageChange('en')}
          className="flex items-center gap-2"
        >
          🇬🇧 {t('english')}
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {language === 'da' 
          ? 'Det valgte sprog gemmes automatisk og anvendes på tværs af systemet.'
          : 'The selected language is automatically saved and applied across the system.'
        }
      </div>
    </div>
  )
}
