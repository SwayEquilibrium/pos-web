'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Database, RefreshCw, Plus, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DataStatusIndicatorProps {
  title: string
  dataType: 'categories' | 'products' | 'modifiers' | 'tables'
  isLoading: boolean
  error?: Error | null
  data?: any[] | null
  expectedMinimum?: number
  onRefresh?: () => void
  createUrl?: string // URL to create new items
  setupUrl?: string // URL to setup/configure
  className?: string
}

export default function DataStatusIndicator({
  title,
  dataType,
  isLoading,
  error,
  data,
  expectedMinimum = 1,
  onRefresh,
  createUrl,
  setupUrl,
  className = ''
}: DataStatusIndicatorProps) {
  const router = useRouter()

  // Determine status
  const hasError = !!error
  const isEmpty = !isLoading && !hasError && (!data || data.length === 0)
  const hasInsufficientData = !isLoading && !hasError && data && data.length > 0 && data.length < expectedMinimum
  const isHealthy = !isLoading && !hasError && data && data.length >= expectedMinimum

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        variant: 'secondary' as const,
        icon: <RefreshCw size={16} className="animate-spin" />,
        title: 'Loading...',
        message: `Loading ${dataType}...`,
        color: 'text-blue-600'
      }
    }

    if (hasError) {
      const isTableMissing = error?.message?.includes('does not exist') || error?.message?.includes('relation')
      
      return {
        variant: 'destructive' as const,
        icon: <Database size={16} />,
        title: isTableMissing ? 'Database Setup Required' : 'Database Error',
        message: isTableMissing 
          ? `The ${dataType} table does not exist in the database. Database setup is required.`
          : `Failed to load ${dataType}: ${error.message}`,
        color: 'text-red-600',
        showSetup: isTableMissing
      }
    }

    if (isEmpty) {
      return {
        variant: 'outline' as const,
        icon: <Plus size={16} />,
        title: 'No Data Found',
        message: `No ${dataType} have been created yet. Create your first ${dataType.slice(0, -1)} to get started.`,
        color: 'text-orange-600',
        showCreate: true
      }
    }

    if (hasInsufficientData) {
      return {
        variant: 'secondary' as const,
        icon: <AlertTriangle size={16} />,
        title: 'Limited Data',
        message: `Only ${data.length} ${dataType} found. You may want to add more.`,
        color: 'text-yellow-600',
        showCreate: true
      }
    }

    return {
      variant: 'default' as const,
      icon: <Database size={16} />,
      title: 'Data Loaded',
      message: `${data.length} ${dataType} loaded successfully.`,
      color: 'text-green-600'
    }
  }

  const status = getStatusInfo()

  return (
    <Card className={`border-l-4 ${
      status.color.includes('red') ? 'border-l-red-500' :
      status.color.includes('orange') ? 'border-l-orange-500' :
      status.color.includes('yellow') ? 'border-l-yellow-500' :
      status.color.includes('green') ? 'border-l-green-500' :
      'border-l-blue-500'
    } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {status.icon}
            {title}
          </CardTitle>
          <Badge variant={status.variant}>
            {status.title}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className={`text-sm ${status.color} mb-3`}>
          {status.message}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
          )}

          {status.showCreate && createUrl && (
            <Button
              onClick={() => router.push(createUrl)}
              variant="default"
              size="sm"
            >
              <Plus size={14} className="mr-1" />
              Create {dataType.slice(0, -1)}
            </Button>
          )}

          {status.showSetup && setupUrl && (
            <Button
              onClick={() => router.push(setupUrl)}
              variant="default"
              size="sm"
            >
              <Settings size={14} className="mr-1" />
              Setup Database
            </Button>
          )}
        </div>

        {/* Additional info for errors */}
        {hasError && process.env.NODE_ENV === 'development' && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Technical Details
            </summary>
            <div className="mt-2 p-2 bg-muted rounded font-mono text-xs overflow-auto">
              <div><strong>Error:</strong> {error.name}</div>
              <div><strong>Message:</strong> {error.message}</div>
              {error.stack && (
                <div className="mt-1">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
