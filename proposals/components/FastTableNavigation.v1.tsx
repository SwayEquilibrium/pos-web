'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Table {
  id: string
  name: string
  capacity: number
  room_id: string
}

interface Room {
  id: string
  name: string
  color?: string
}

interface FastTableNavigationProps {
  tables: Table[]
  rooms?: Room[]
  searchTerm?: string
  effectiveRoomId?: string | null
}

export default function FastTableNavigation({ 
  tables, 
  rooms, 
  searchTerm = '', 
  effectiveRoomId 
}: FastTableNavigationProps) {
  const router = useRouter()
  const [navigatingToTable, setNavigatingToTable] = useState<string | null>(null)

  // Optimized table navigation with immediate feedback
  const handleTableNavigation = useCallback((tableId: string) => {
    if (navigatingToTable) return // Prevent double-clicks
    
    // Immediate visual feedback
    setNavigatingToTable(tableId)
    
    // Prefetch the route if not already done
    router.prefetch(`/orders/${tableId}`)
    
    // Navigate immediately without artificial delays
    router.push(`/orders/${tableId}`)
    
    // Reset state quickly
    setTimeout(() => {
      setNavigatingToTable(null)
    }, 200)
  }, [router, navigatingToTable])

  // Prefetch on hover for instant navigation
  const handleTableHover = useCallback((tableId: string) => {
    router.prefetch(`/orders/${tableId}`)
  }, [router])

  return (
    <div className="space-y-4">
      {tables.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm.trim() !== '' ? 'Ingen borde fundet' : 'Ingen borde i dette lokale'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm.trim() !== '' 
              ? `Ingen borde matcher "${searchTerm}"`
              : 'Opret borde i redigeringstilstand'
            }
          </p>
        </div>
      ) : (
        tables.map(table => {
          const tableRoom = rooms?.find(room => room.id === table.room_id)
          const isNavigating = navigatingToTable === table.id
          
          return (
            <Card 
              key={table.id} 
              className={`cursor-pointer transition-all duration-150 ease-out hover:shadow-lg active:scale-[0.98] ${
                isNavigating ? 'scale-[1.02] shadow-xl ring-2 ring-primary/20 bg-primary/5' : 'hover:scale-[1.01]'
              }`}
              onMouseEnter={() => handleTableHover(table.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150 ${
                      isNavigating 
                        ? 'bg-primary/20 scale-110' 
                        : 'bg-primary/10 hover:bg-primary/15'
                    }`}>
                      {isNavigating ? (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="font-semibold text-primary">{table.name}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{table.name}</h3>
                        {searchTerm.trim() !== '' && tableRoom && table.room_id !== effectiveRoomId && (
                          <Badge variant="outline" className="text-xs">
                            {tableRoom.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Kapacitet: {table.capacity} personer
                        {tableRoom && searchTerm.trim() !== '' && ` • ${tableRoom.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ledig
                    </Badge>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTableNavigation(table.id)
                      }}
                      disabled={isNavigating}
                      size="sm"
                      className={`transition-all duration-150 ${
                        isNavigating 
                          ? 'bg-primary/80 scale-95' 
                          : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isNavigating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Åbner...
                        </>
                      ) : (
                        'Opret Ordre'
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar for navigating table */}
                {isNavigating && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20 rounded-b-lg overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
