'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Table {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  room_id: string
  capacity?: number
  hasOrders?: boolean
  orderCount?: number
  totalAmount?: number
}

interface Room {
  id: string
  name: string
  color?: string
}

interface SimpleTableLayoutProps {
  tables: Table[]
  rooms: Room[]
  onUpdateTable: (table: Table) => void
  onCreateTable: (table: Omit<Table, 'id'>) => void
  onDeleteTable: (tableId: string) => void
  selectedRoomId: string | null
  isEditMode?: boolean
  showBulkCreate?: boolean
  onSetEditMode?: (editMode: boolean) => void
  onSetShowBulkCreate?: (show: boolean) => void
  onTableSelect?: (table: Table) => void
  selectedTableId?: string | null
  onMakeOrder?: (tableId: string) => void
  onSeeBill?: (tableId: string) => void
  onCloseTab?: (tableId: string) => void
  onMoveOrders?: (fromTableId: string, toTableId: string) => void
  onSaveLayout?: () => void
}

export default function SimpleTableLayout({
  tables,
  rooms,
  onUpdateTable,
  onCreateTable,
  onDeleteTable,
  selectedRoomId,
  isEditMode = false,
  showBulkCreate = false,
  onSetEditMode,
  onSetShowBulkCreate,
  onTableSelect,
  selectedTableId,
  onMakeOrder,
  onSeeBill,
  onCloseTab,
  onMoveOrders,
  onSaveLayout
}: SimpleTableLayoutProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Local state for table positions - completely isolated from props
  const [localTables, setLocalTables] = useState<{[key: string]: {x: number, y: number}}>({})
  const [localSelectedTableId, setLocalSelectedTableId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{x: number, y: number}>({x: 0, y: 0})
  const [showAdminPopup, setShowAdminPopup] = useState(false)
  const initializedRef = useRef<Set<string>>(new Set())


  // Canvas dimensions - Much larger for practical daily use
  const CANVAS_WIDTH = 1600  // Further increased to utilize more space
  const CANVAS_HEIGHT = 1000  // Further increased to utilize more space
  const TABLE_SIZE = 140  // Increased to 140 for better visibility and usability
  const GRID_SIZE = 30  // Increased grid size to match larger tables

  const selectedRoom = rooms.find(room => room.id === selectedRoomId)
  const roomTables = tables.filter(table => table.room_id === selectedRoomId)

  // Initialize local positions when tables change
  useEffect(() => {
    roomTables.forEach(table => {
      if (!initializedRef.current.has(table.id)) {
        setLocalTables(prev => ({
          ...prev,
          [table.id]: { x: table.x, y: table.y }
        }))
        initializedRef.current.add(table.id)
      }
    })

    // Clean up removed tables
    const currentTableIds = new Set(roomTables.map(t => t.id))
    const toRemove = Array.from(initializedRef.current).filter(id => !currentTableIds.has(id))
    if (toRemove.length > 0) {
      setLocalTables(prev => {
        const newTables = { ...prev }
        toRemove.forEach(id => delete newTables[id])
        return newTables
      })
      toRemove.forEach(id => initializedRef.current.delete(id))
    }
  }, [roomTables])

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode) {
      // In view mode, clicking a table should select it for the functions menu
      const table = roomTables.find(t => t.id === tableId)
      if (table && onTableSelect) {
        onTableSelect(table)
      }
      return
    }

    e.preventDefault()
    e.stopPropagation()
    
    console.log('Mouse down on table:', tableId, 'Edit mode:', isEditMode)
    
    setLocalSelectedTableId(tableId)
    setIsDragging(true)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) {
      console.log('No canvas rect found')
      return
    }

    const currentPos = localTables[tableId] || { x: 0, y: 0 }
    console.log('Current position:', currentPos)
    
    setDragStart({
      x: e.clientX - rect.left - currentPos.x,
      y: e.clientY - rect.top - currentPos.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !localSelectedTableId || !isEditMode) {
      return
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.min(CANVAS_WIDTH - TABLE_SIZE, 
      Math.round((e.clientX - rect.left - dragStart.x) / GRID_SIZE) * GRID_SIZE))
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - TABLE_SIZE, 
      Math.round((e.clientY - rect.top - dragStart.y) / GRID_SIZE) * GRID_SIZE))

    console.log('Moving table to:', x, y)

    // Update only the specific table in local state
    setLocalTables(prev => ({
      ...prev,
      [localSelectedTableId]: { x, y }
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on a table
    const clickedTable = roomTables.find(table => {
      const pos = localTables[table.id] || { x: table.x, y: table.y }
      return x >= pos.x && x < pos.x + TABLE_SIZE && y >= pos.y && y < pos.y + TABLE_SIZE
    })

    if (clickedTable) {
      setLocalSelectedTableId(clickedTable.id)
    } else {
      setLocalSelectedTableId(null)
    }
  }

  const saveLayout = () => {
    // Save all changed positions to database
    Object.entries(localTables).forEach(([tableId, position]) => {
      const table = roomTables.find(t => t.id === tableId)
      
      if (table && (table.x !== position.x || table.y !== position.y)) {
        onUpdateTable({
          ...table,
          x: position.x,
          y: position.y
        })
      }
    })
    
    // Call the parent callback if provided
    onSaveLayout?.()
    
    onSetEditMode?.(false)
    setLocalSelectedTableId(null)
  }

  const resetLayout = () => {
    // Reset to original positions
    const resetTables: {[key: string]: {x: number, y: number}} = {}
    roomTables.forEach(table => {
      resetTables[table.id] = { x: table.x, y: table.y }
    })
    setLocalTables(resetTables)
  }

  const handleBulkCreate = (startNumber: number, endNumber: number, capacity: number) => {
    if (!selectedRoomId) return

    const gridCols = Math.floor(CANVAS_WIDTH / (TABLE_SIZE + GRID_SIZE * 2))  // Use grid-aligned spacing
    
    for (let i = startNumber; i <= endNumber; i++) {
      const index = i - startNumber
      const row = Math.floor(index / gridCols)
      const col = index % gridCols
      
      const x = GRID_SIZE + col * (TABLE_SIZE + GRID_SIZE * 2)  // Grid-aligned spacing
      const y = GRID_SIZE + row * (TABLE_SIZE + GRID_SIZE * 2)  // Grid-aligned spacing
      
      onCreateTable({
        name: `Bord ${i}`,
        x,
        y,
        width: TABLE_SIZE,
        height: TABLE_SIZE,
        room_id: selectedRoomId,
        capacity
      })
    }
    
    onSetShowBulkCreate?.(false)
  }

  const selectedTable = localSelectedTableId ? roomTables.find(t => t.id === localSelectedTableId) : null

  return (
    <div className="space-y-3">

      {/* Bulk Create Form */}
      {showBulkCreate && selectedRoom && (
         <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🏗️</span>
              Opret Flere Borde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startNumber">Fra Bord Nr.</Label>
                <Input id="startNumber" type="number" placeholder="1" min="1" max="100" />
              </div>
              <div>
                <Label htmlFor="endNumber">Til Bord Nr.</Label>
                <Input id="endNumber" type="number" placeholder="10" min="1" max="100" />
              </div>
              <div>
                <Label htmlFor="bulkCapacity">Standard Kapacitet</Label>
                <Input id="bulkCapacity" type="number" placeholder="4" min="1" max="12" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  const startInput = document.getElementById('startNumber') as HTMLInputElement
                  const endInput = document.getElementById('endNumber') as HTMLInputElement
                  const capacityInput = document.getElementById('bulkCapacity') as HTMLInputElement
                  
                  const start = parseInt(startInput.value) || 1
                  const end = parseInt(endInput.value) || start
                  const capacity = parseInt(capacityInput.value) || 4
                  
                  if (start <= end && end - start < 50) {
                    handleBulkCreate(start, end, capacity)
                  } else {
                    alert('Kontroller bordnumre (max 50 borde ad gangen)')
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Opret Borde
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => onSetShowBulkCreate?.(false)}
              >
                Annuller
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Large Canvas - Takes most of the space */}
        <div className="xl:col-span-4">
          <Card className="h-full scroll-container">
            <CardContent className="p-4 h-full">
              <div 
                ref={canvasRef}
                className={`relative border-2 rounded-lg ${isEditMode ? 'border-dashed border-orange-300 bg-orange-50' : 'border-solid border-gray-300 bg-gray-50'} ${isEditMode ? 'cursor-crosshair' : 'cursor-default'} mx-auto`}
                style={{ 
                  width: CANVAS_WIDTH, 
                  height: CANVAS_HEIGHT,
                  maxWidth: '100%',
                  backgroundImage: isEditMode ? `radial-gradient(circle, #ccc 1px, transparent 1px)` : 'none',
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Tables */}
                {roomTables.map(table => {
                  const position = localTables[table.id] || { x: table.x, y: table.y }
                  const isSelected = localSelectedTableId === table.id
                  const isFunctionsSelected = localSelectedTableId === table.id && !isEditMode // In view mode, selection is for functions menu
                  
                  return (
                    <div
                      key={table.id}
                      className={`absolute border-2 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg ${
                        isSelected ? 'border-yellow-400 scale-105 border-4' : 
                        isFunctionsSelected ? 'border-primary border-2' : 'border-gray-400'
                      } ${table.hasOrders ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-500 hover:bg-gray-600'} ${
                        isEditMode ? 'cursor-move hover:scale-105' : 'cursor-pointer'
                      } transition-all`}
                      style={{
                        left: position.x,
                        top: position.y,
                        width: TABLE_SIZE,
                        height: TABLE_SIZE,
                        zIndex: isSelected ? 10 : 1
                      }}
                      onMouseDown={(e) => handleMouseDown(e, table.id)}
                      title={isEditMode ? `Træk for at flytte ${table.name}` : `Klik ${table.name} for at vælge`}
                    >
                      <div className="text-xs font-bold">{table.name}</div>
                      {table.capacity && (
                        <div className="text-xs opacity-75">{table.capacity}p</div>
                      )}
                      {table.hasOrders && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {table.orderCount}
                        </div>
                      )}
                      {table.hasOrders && (
                        <div className="absolute -bottom-1 left-1 right-1 bg-black/70 text-white text-xs rounded px-1 py-0.5">
                          {table.totalAmount?.toFixed(0)} kr
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

                 {/* Right Sidebar - Functions Menu & Properties */}
         <div className="space-y-3 p-4 rounded-lg">
                     {/* Functions Menu */}
           {selectedTable && onMakeOrder && onSeeBill && onCloseTab && (
             <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Bord {selectedTable.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kapacitet:</span>
                  <Badge variant="outline">{selectedTable.capacity || 4} personer</Badge>
                </div>
                
                {selectedTable.hasOrders && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Aktive ordrer:</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {selectedTable.orderCount} ordre{selectedTable.orderCount !== 1 ? 'r' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total at betale:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {selectedTable.totalAmount?.toFixed(2)} kr
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

                     {/* Action Buttons */}
           {selectedTable && onMakeOrder && onSeeBill && onCloseTab && (
             <div className="space-y-3 p-4 rounded-lg">
              <Button 
                onClick={() => onMakeOrder(selectedTable.id)}
                className="w-full"
                size="lg"
              >
                Lav Ordre
              </Button>

              {selectedTable.hasOrders && (
                <>
                  <Button 
                    onClick={() => onSeeBill(selectedTable.id)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Se Regning
                  </Button>

                  <Button 
                    onClick={() => onCloseTab(selectedTable.id)}
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    Luk Regning / Betal
                  </Button>
                </>
              )}

                             {!selectedTable.hasOrders && (
                 <Button 
                   variant="outline"
                   className="w-full"
                   size="lg"
                   disabled
                 >
                   Ingen aktive ordrer
                 </Button>
               )}

               {/* Move Orders Button - Only show if table has orders and onMoveOrders is available */}
               {selectedTable.hasOrders && onMoveOrders && (
                 <div className="p-3 rounded-lg">
                   <div className="text-sm font-medium mb-2">Flyt Ordre til andet bord:</div>
                   <div className="space-y-2">
                     {roomTables
                       .filter(table => table.id !== selectedTable.id) // Don't show current table
                       .map(table => (
                         <Button
                           key={table.id}
                           variant="outline"
                           size="sm"
                           className="w-full"
                           onClick={() => onMoveOrders(selectedTable.id, table.id)}
                         >
                           Flyt til {table.name}
                         </Button>
                       ))}
                   </div>
                 </div>
               )}

               {/* Admin Button with Popup */}
               <div className="pt-4 border-t">
                 <Button
                   variant="outline"
                   size="lg"
                   className="w-full justify-start"
                   onClick={() => setShowAdminPopup(true)}
                 >
                   <svg className="w-5 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   Admin
                 </Button>
               </div>
            </div>
          )}

                     {/* Table Properties (Edit Mode) */}
           {selectedTable && isEditMode && (
             <Card>
              <CardContent className="p-3 space-y-3">
                <div className="text-sm font-medium">
                  📍 {selectedTable.name}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Navn</Label>
                    <Input
                      size="sm"
                      value={selectedTable.name}
                      onChange={(e) => {
                        const updatedTable: Table = {
                          id: selectedTable.id,
                          name: e.target.value,
                          x: selectedTable.x,
                          y: selectedTable.y,
                          width: selectedTable.width,
                          height: selectedTable.height,
                          room_id: selectedTable.room_id,
                          capacity: selectedTable.capacity,
                          hasOrders: selectedTable.hasOrders,
                          orderCount: selectedTable.orderCount,
                          totalAmount: selectedTable.totalAmount
                        }
                        onUpdateTable(updatedTable)
                      }}
                      placeholder="Bord 1"
                      disabled={!isEditMode}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Personer</Label>
                    <Input
                      size="sm"
                      type="number"
                      value={selectedTable.capacity || ''}
                      onChange={(e) => {
                        const capacity = parseInt(e.target.value) || 0
                        const updatedTable: Table = {
                          id: selectedTable.id,
                          name: selectedTable.name,
                          x: selectedTable.x,
                          y: selectedTable.y,
                          width: selectedTable.width,
                          height: selectedTable.height,
                          room_id: selectedTable.room_id,
                          capacity,
                          hasOrders: selectedTable.hasOrders,
                          orderCount: selectedTable.orderCount,
                          totalAmount: selectedTable.totalAmount
                        }
                        onUpdateTable(updatedTable)
                      }}
                      placeholder="4"
                      min="1"
                      max="12"
                      disabled={!isEditMode}
                      className="h-8"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Pos: ({localTables[selectedTable.id]?.x || selectedTable.x}, {localTables[selectedTable.id]?.y || selectedTable.y})
                  </div>

                  {/* Save Changes Button */}
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Save ALL table changes (including dragged positions)
                      saveLayout()
                      
                      // Show success feedback
                      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
                      if (saveButton) {
                        const originalText = saveButton.textContent
                        saveButton.textContent = '✅ Gemt!'
                        saveButton.disabled = true
                        setTimeout(() => {
                          saveButton.textContent = originalText
                          saveButton.disabled = false
                        }, 2000)
                      }
                    }}
                    data-save-button
                  >
                    💾 Gem Alle Ændringer
                  </Button>

                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        if (confirm(`Slet ${selectedTable.name}?`)) {
                          onDeleteTable(selectedTable.id)
                        setLocalSelectedTableId(null)
                        }
                      }}
                    >
                      🗑️ Slet
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Popup */}
          {showAdminPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Bord Administration - {selectedTable?.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdminPopup(false)}
                    className="h-8 w-8 p-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Table Status Management */}
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Bord Status</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Implement table reservation */}}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reserver Bord
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Implement table cleaning */}}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Ryd Bord
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Implement table maintenance */}}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Bord Indstillinger
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Hurtige Handlinger</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Implement move bill */}}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Flyt Regning
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Implement table notes */}}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Bord Noter
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {/* TODO: Implement table history */}}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Bord Historik
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
