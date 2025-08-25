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
}

export default function SimpleTableLayout({
  tables,
  rooms,
  onUpdateTable,
  onCreateTable,
  onDeleteTable,
  selectedRoomId
}: SimpleTableLayoutProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Local state for table positions - completely isolated from props
  const [localTables, setLocalTables] = useState<{[key: string]: {x: number, y: number}}>({})
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{x: number, y: number}>({x: 0, y: 0})
  const [isEditMode, setIsEditMode] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)

  // Canvas dimensions - Much larger for practical daily use
  const CANVAS_WIDTH = 1200
  const CANVAS_HEIGHT = 800
  const TABLE_SIZE = 60
  const GRID_SIZE = 20

  const selectedRoom = rooms.find(room => room.id === selectedRoomId)
  const roomTables = tables.filter(table => table.room_id === selectedRoomId)

  // Initialize local positions when tables change
  useEffect(() => {
    const newLocalTables: {[key: string]: {x: number, y: number}} = {}
    roomTables.forEach(table => {
      if (!localTables[table.id]) {
        newLocalTables[table.id] = { x: table.x, y: table.y }
      } else {
        newLocalTables[table.id] = localTables[table.id]
      }
    })
    setLocalTables(newLocalTables)
  }, [roomTables])

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode) {
      // In view mode, clicking a table should create an order
      const table = roomTables.find(t => t.id === tableId)
      if (table) {
        window.location.href = `/orders/${tableId}`
      }
      return
    }

    e.preventDefault()
    e.stopPropagation()
    
    setSelectedTableId(tableId)
    setIsDragging(true)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentPos = localTables[tableId] || { x: 0, y: 0 }
    setDragStart({
      x: e.clientX - rect.left - currentPos.x,
      y: e.clientY - rect.top - currentPos.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedTableId || !isEditMode) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.min(CANVAS_WIDTH - TABLE_SIZE, 
      Math.round((e.clientX - rect.left - dragStart.x) / GRID_SIZE) * GRID_SIZE))
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - TABLE_SIZE, 
      Math.round((e.clientY - rect.top - dragStart.y) / GRID_SIZE) * GRID_SIZE))

    // Update only the specific table in local state
    setLocalTables(prev => ({
      ...prev,
      [selectedTableId]: { x, y }
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
      setSelectedTableId(clickedTable.id)
    } else {
      setSelectedTableId(null)
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
    setIsEditMode(false)
    setSelectedTableId(null)
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

    const gridCols = Math.floor(CANVAS_WIDTH / (TABLE_SIZE + 20))
    
    for (let i = startNumber; i <= endNumber; i++) {
      const index = i - startNumber
      const row = Math.floor(index / gridCols)
      const col = index % gridCols
      
      const x = 20 + col * (TABLE_SIZE + 20)
      const y = 20 + row * (TABLE_SIZE + 20)
      
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
    
    setShowBulkCreate(false)
  }

  const selectedTable = selectedTableId ? roomTables.find(t => t.id === selectedTableId) : null

  return (
    <div className="space-y-3">
      {/* Compact Controls Bar */}
      {selectedRoom && (
        <div className="flex items-center justify-between bg-card border rounded-lg px-4 py-2 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: selectedRoom.color }}
              ></div>
              <span className="font-medium text-sm">{selectedRoom.name}</span>
              <span className="text-xs text-muted-foreground">({roomTables.length} borde)</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {isEditMode 
                ? "🔧 Træk borde for at flytte • Klik 'Gem' når færdig"
                : "👆 Klik borde for ordrer • 'Rediger' for at flytte"
              }
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkCreate(!showBulkCreate)}
              className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 text-xs px-2 py-1"
            >
              ➕ Opret
            </Button>
            
            {isEditMode ? (
              <>
                <Button variant="outline" size="sm" onClick={resetLayout} className="text-xs px-2 py-1">
                  🔄 Nulstil
                </Button>
                <Button size="sm" onClick={saveLayout} className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1">
                  💾 Gem
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
              >
                ✏️ Rediger
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Create Form */}
      {showBulkCreate && selectedRoom && (
        <Card className="border-green-200 bg-green-50">
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
                onClick={() => setShowBulkCreate(false)}
              >
                Annuller
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Large Canvas - Takes most of the space */}
        <div className="xl:col-span-3">
          <Card className="h-full">
            <CardContent className="p-4">
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
                  const isSelected = selectedTableId === table.id
                  
                  return (
                    <div
                      key={table.id}
                      className={`absolute border-2 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg ${
                        isSelected ? 'border-yellow-400 scale-105 border-4' : 'border-gray-400'
                      } bg-blue-500 hover:bg-blue-600 ${
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
                      title={isEditMode ? `Træk for at flytte ${table.name}` : `Klik ${table.name} for at oprette ordre`}
                    >
                      <div className="text-xs font-bold">{table.name}</div>
                      {table.capacity && (
                        <div className="text-xs opacity-75">{table.capacity}p</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compact Properties Panel */}
        <div className="space-y-3">
          {/* Table Properties */}
          {selectedTable && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 space-y-3">
                <div className="text-sm font-medium text-blue-800">
                  📍 {selectedTable.name}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Navn</Label>
                    <Input
                      size="sm"
                      value={selectedTable.name}
                      onChange={(e) => {
                        onUpdateTable({ ...selectedTable, name: e.target.value })
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
                        onUpdateTable({ ...selectedTable, capacity: parseInt(e.target.value) || 0 })
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

                  {isEditMode && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        if (confirm(`Slet ${selectedTable.name}?`)) {
                          onDeleteTable(selectedTable.id)
                          setSelectedTableId(null)
                        }
                      }}
                    >
                      🗑️ Slet
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <div className="text-xs font-medium mb-2 text-gray-700">💡 Hurtig Guide</div>
              <div className="space-y-1 text-xs text-gray-600">
                {isEditMode ? (
                  <>
                    <div>🔧 Træk borde for at flytte</div>
                    <div>💾 Klik "Gem" når færdig</div>
                  </>
                ) : (
                  <>
                    <div>👆 Klik bord → Opret ordre</div>
                    <div>✏️ Rediger for at flytte</div>
                  </>
                )}
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  📊 {roomTables.length} borde total
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
