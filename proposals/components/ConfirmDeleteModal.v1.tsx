'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  isLoading?: boolean
  destructive?: boolean
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  destructive = true
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              {description}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-medium text-red-900">
                "{itemName}"
              </p>
            </div>

            {destructive && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                ⚠️ {t('language') === 'da' 
                  ? 'Denne handling kan ikke fortrydes. Elementet vil blive markeret som inaktivt.'
                  : 'This action cannot be undone. The item will be marked as inactive.'
                }
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {t('language') === 'da' ? 'Slet' : 'Delete'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                {t('language') === 'da' ? 'Annuller' : 'Cancel'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
