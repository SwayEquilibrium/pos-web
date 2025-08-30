'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  getDynamicOverrides, 
  setDynamicOverrides, 
  toggleFlag, 
  clearDynamicOverrides,
  type DynamicFlagOverrides 
} from '@/lib/utils/dynamicFlags'
import { flags as envFlags, type FeatureFlags } from '@/src/config/flags'

interface DynamicFlagTogglerProps {
  className?: string
  compact?: boolean
}

const FLAG_DESCRIPTIONS: Record<keyof FeatureFlags, string> = {
  idempotencyV1: 'Payment idempotency system',
  outboxV1: 'Event outbox pattern',
  paymentsV1: 'Enhanced payment processing',
  fulfillmentV1: 'Order fulfillment system',
  reservationsV1: 'Table reservation system',
  observabilityV1: 'Enhanced logging and monitoring',
  printerWebPRNTV1: 'Star WebPRNT printer support',
  printerCloudPRNTV1: 'Star CloudPRNT printer support'
}

export function DynamicFlagToggler({ className, compact = false }: DynamicFlagTogglerProps) {
  const [overrides, setOverridesState] = useState<DynamicFlagOverrides>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setOverridesState(getDynamicOverrides())

    const handleFlagsChanged = (event: CustomEvent) => {
      setOverridesState(event.detail)
    }

    window.addEventListener('flagsChanged', handleFlagsChanged as EventListener)
    return () => window.removeEventListener('flagsChanged', handleFlagsChanged as EventListener)
  }, [])

  const isDynamicEnabled = overrides._enabled || false

  const handleToggleDynamic = () => {
    if (isDynamicEnabled) {
      clearDynamicOverrides()
    } else {
      setDynamicOverrides({ _enabled: true })
    }
  }

  const handleToggleFlag = (flagName: keyof FeatureFlags) => {
    toggleFlag(flagName)
  }

  if (!mounted) {
    return <div className={`animate-pulse bg-muted rounded-lg h-32 ${className}`} />
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Label htmlFor="dynamic-flags">Dynamic Flags</Label>
          <Switch
            id="dynamic-flags"
            checked={isDynamicEnabled}
            onCheckedChange={handleToggleDynamic}
          />
        </div>
        {isDynamicEnabled && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(FLAG_DESCRIPTIONS).map(([flagName, description]) => {
              const isEnvEnabled = envFlags[flagName as keyof FeatureFlags]
              const isOverridden = flagName in overrides && flagName !== '_enabled'
              const finalValue = isOverridden ? overrides[flagName as keyof FeatureFlags] : isEnvEnabled

              return (
                <div key={flagName} className="flex items-center space-x-2">
                  <Switch
                    id={flagName}
                    checked={!!finalValue}
                    onCheckedChange={() => handleToggleFlag(flagName as keyof FeatureFlags)}
                    size="sm"
                  />
                  <Label htmlFor={flagName} className="text-xs">
                    {flagName}
                    {isOverridden && <Badge variant="secondary" className="ml-1 text-xs">Override</Badge>}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">🚀 Dynamic Feature Flags</CardTitle>
            <CardDescription>
              Toggle features without restarting the server
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="enable-dynamic">Enable Dynamic Flags</Label>
            <Switch
              id="enable-dynamic"
              checked={isDynamicEnabled}
              onCheckedChange={handleToggleDynamic}
            />
          </div>
        </div>
      </CardHeader>
      
      {isDynamicEnabled && (
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {Object.entries(FLAG_DESCRIPTIONS).map(([flagName, description]) => {
              const isEnvEnabled = envFlags[flagName as keyof FeatureFlags]
              const isOverridden = flagName in overrides && flagName !== '_enabled'
              const finalValue = isOverridden ? overrides[flagName as keyof FeatureFlags] : isEnvEnabled

              return (
                <div key={flagName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={flagName} className="font-medium">
                        {flagName}
                      </Label>
                      {isEnvEnabled && (
                        <Badge variant="outline" className="text-xs">
                          ENV
                        </Badge>
                      )}
                      {isOverridden && (
                        <Badge variant="secondary" className="text-xs">
                          Override
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  </div>
                  <Switch
                    id={flagName}
                    checked={!!finalValue}
                    onCheckedChange={() => handleToggleFlag(flagName as keyof FeatureFlags)}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Changes take effect immediately
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearDynamicOverrides}
            >
              Reset to ENV
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
