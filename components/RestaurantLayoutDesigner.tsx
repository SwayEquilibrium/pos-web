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
  width: number
  height: number
  color: string
}

interface RestaurantLayoutDesignerProps {
  tables: Table[]
  rooms: Room[]
  onUpdateTable: (table: Table) => void
  onCreateTable: (table: Omit<Table, 'id'>) => void
  onDeleteTable: (tableId: string) => void
  selectedRoomId: string | null
}

export default function RestaurantLayoutDesigner({
  tables,
  rooms,
  onUpdateTable,
  onCreateTable,
  onDeleteTable,
  selectedRoomId
}: RestaurantLayoutDesignerProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragStarted, setDragStarted] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)

  // Canvas dimensions
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const TABLE_SIZE = 60
  const GRID_SIZE = 20

  const selectedRoom = rooms.find(room => room.id === selectedRoomId)
  const roomTables = tables.filter(table => table.room_id === selectedRoomId)

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedRoomId || isDragging || dragStarted) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.round((e.clientX - rect.left) / GRID_SIZE) * GRID_SIZE
    const y = Math.round((e.clientY - rect.top) / GRID_SIZE) * GRID_SIZE

    // Check if clicking on existing table
    const clickedTable = roomTables.find(table => 
      x >= table.x && x < table.x + table.width &&
      y >= table.y && y < table.y + table.height
    )

    if (clickedTable) {
      setSelectedTable(clickedTable)
    }
    // Remove table creation from canvas click - only selection now
  }

  const handleTableMouseDown = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Always select the table
    setSelectedTable(table)
    
    // Only allow dragging in edit mode
    if (!isEditMode) return
    
    // Prepare for potential drag
    setIsDragging(true)
    setDragStarted(false)

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragOffset({
      x: e.clientX - rect.left - table.x,
      y: e.clientY - rect.top - table.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedTable || !isEditMode) return

    // Mark that dragging has actually started (not just mousedown)
    if (!dragStarted) {
      setDragStarted(true)
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.min(CANVAS_WIDTH - selectedTable.width, 
      Math.round((e.clientX - rect.left - dragOffset.x) / GRID_SIZE) * GRID_SIZE))
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - selectedTable.height, 
      Math.round((e.clientY - rect.top - dragOffset.y) / GRID_SIZE) * GRID_SIZE))

    // Only update the selected table position locally during drag
    // Create a new object to ensure we don't mutate the original table
    setSelectedTable(prev => {
      if (!prev || prev.id !== selectedTable.id) return prev
      return { ...prev, x, y }
    })
  }

  const handleMouseUp = () => {
    if (isDragging && selectedTable && dragStarted) {
      // Save the final position to database only if actually dragged
      onUpdateTable(selectedTable)
    }
    setIsDragging(false)
    setDragStarted(false)
  }

  const handleBulkCreateTables = (startNumber: number, endNumber: number, capacity: number) => {
    if (!selectedRoomId) return

    const tablesToCreate = []
    const gridCols = Math.floor(CANVAS_WIDTH / (TABLE_SIZE + 20)) // Tables per row with spacing
    
    for (let i = startNumber; i <= endNumber; i++) {
      const index = i - startNumber
      const row = Math.floor(index / gridCols)
      const col = index % gridCols
      
      const x = 20 + col * (TABLE_SIZE + 20) // 20px margin + spacing
      const y = 20 + row * (TABLE_SIZE + 20) // 20px margin + spacing
      
      const newTable: Omit<Table, 'id'> = {
        name: `Bord ${i}`,
        x,
        y,
        width: TABLE_SIZE,
        height: TABLE_SIZE,
        room_id: selectedRoomId,
        capacity
      }
      
      tablesToCreate.push(newTable)
    }

    // Create all tables
    tablesToCreate.forEach(table => {
      onCreateTable(table)
    })
    
    setShowBulkCreate(false)
  }

  const handleUpdateTableName = (name: string) => {
    if (!selectedTable) return
    const updatedTable = { ...selectedTable, name }
    onUpdateTable(updatedTable)
    setSelectedTable(updatedTable)
  }

  const handleUpdateTableCapacity = (capacity: number) => {
    if (!selectedTable) return
    const updatedTable = { ...selectedTable, capacity }
    onUpdateTable(updatedTable)
    setSelectedTable(updatedTable)
  }

  const getTableColor = () => {
    return 'bg-blue-500 hover:bg-blue-600'
  }

  return (
    <div className="space-y-6">
      {/* Room Info & Controls */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: selectedRoom.color }}
                ></div>
                {selectedRoom.name} - Layout Designer
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    // Reset all drag states when toggling edit mode
                    setIsDragging(false)
                    setDragStarted(false)
                    setSelectedTable(null)
                    setShowBulkCreate(false)
                    setIsEditMode(!isEditMode)
                  }}
                  className={isEditMode ? "bg-orange-600 hover:bg-orange-700" : ""}
                >
                  {isEditMode ? "💾 Gem Layout" : "✏️ Rediger Layout"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isEditMode 
                  ? "Rediger mode: Træk borde for at flytte dem til ønskede positioner."
                  : "Visning mode: Brug 'Opret Borde' for at tilføje nye eller 'Rediger Layout' for at flytte eksisterende."
                }
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkCreate(!showBulkCreate)}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                ➕ Opret Borde
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Create Tables Form */}
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
                <Input
                  id="startNumber"
                  type="number"
                  placeholder="1"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="endNumber">Til Bord Nr.</Label>
                <Input
                  id="endNumber"
                  type="number"
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="bulkCapacity">Standard Kapacitet</Label>
                <Input
                  id="bulkCapacity"
                  type="number"
                  placeholder="4"
                  min="1"
                  max="12"
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground bg-white p-3 rounded border">
              <strong>💡 Tip:</strong> Borde oprettes automatisk i et gitter og kan derefter flyttes individuelt i redigeringstilstand.
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
                  
                  if (start <= end && end - start < 50) { // Max 50 tables at once
                    handleBulkCreateTables(start, end, capacity)
                  } else {
                    alert('Kontroller bordnumre (max 50 borde ad gangen)')
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Opret {(() => {
                  const startInput = document.getElementById('startNumber') as HTMLInputElement
                  const endInput = document.getElementById('endNumber') as HTMLInputElement
                  const start = parseInt(startInput?.value || '1')
                  const end = parseInt(endInput?.value || '1')
                  return Math.max(1, end - start + 1)
                })()} Borde
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={canvasRef}
                className={`relative border-2 ${isEditMode ? 'border-dashed border-orange-300 bg-orange-50' : 'border-solid border-gray-300 bg-gray-50'} ${isEditMode ? 'cursor-crosshair' : 'cursor-default'}`}
                style={{ 
                  width: CANVAS_WIDTH, 
                  height: CANVAS_HEIGHT,
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
                  // Only use selectedTable position if this exact table is being dragged
                  const isThisTableBeingDragged = isDragging && dragStarted && selectedTable?.id === table.id
                  const displayTable = isThisTableBeingDragged ? selectedTable : table
                  
                  return (
                    <div
                      key={table.id}
                      className={`absolute border-2 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg ${
                        selectedTable?.id === table.id ? 'border-yellow-400 scale-105 border-4' : 'border-gray-400'
                      } ${getTableColor()} ${isEditMode ? 'cursor-move hover:scale-105' : 'cursor-pointer'} ${
                        isThisTableBeingDragged ? '' : 'transition-all'
                      }`}
                      style={{
                        left: displayTable?.x || table.x,
                        top: displayTable?.y || table.y,
                        width: displayTable?.width || table.width,
                        height: displayTable?.height || table.height,
                        zIndex: selectedTable?.id === table.id ? 10 : 1,
                        transform: isThisTableBeingDragged ? 'none' : undefined // Disable transforms during drag
                      }}
                      onMouseDown={(e) => handleTableMouseDown(e, table)}
                      title={isEditMode ? `Træk for at flytte ${displayTable?.name || table.name}` : `Klik for at vælge ${displayTable?.name || table.name}`}
                    >
                      <div className="text-xs font-bold">{displayTable?.name || table.name}</div>
                      {(displayTable?.capacity || table.capacity) && (
                        <div className="text-xs opacity-75">{displayTable?.capacity || table.capacity}p</div>
                      )}
                    </div>
                  )
                })}


              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {/* Table Properties */}
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle>Bord Indstillinger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bord Navn</Label>
                  <Input
                    value={selectedTable.name}
                    onChange={(e) => handleUpdateTableName(e.target.value)}
                    placeholder="Bord 1"
                    disabled={!isEditMode}
                  />
                </div>
                
                <div>
                  <Label>Kapacitet (personer)</Label>
                  <Input
                    type="number"
                    value={selectedTable.capacity || ''}
                    onChange={(e) => handleUpdateTableCapacity(parseInt(e.target.value) || 0)}
                    placeholder="4"
                    min="1"
                    max="12"
                    disabled={!isEditMode}
                  />
                </div>

                <div>
                  <Label>Position</Label>
                  <div className="text-sm text-muted-foreground">
                    X: {selectedTable.x}px, Y: {selectedTable.y}px
                  </div>
                </div>

                {isEditMode && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      if (confirm(`Slet ${selectedTable.name}?`)) {
                        onDeleteTable(selectedTable.id)
                        setSelectedTable(null)
                      }
                    }}
                  >
                    🗑️ Slet Bord
                  </Button>
                )}

                {!isEditMode && (
                  <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                    💡 Aktiver "Rediger Layout" for at ændre bordindstillinger
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instruktioner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {isEditMode ? (
                <>
                  <div>• <strong>Træk</strong> borde for at flytte dem</div>
                  <div>• <strong>Klik</strong> på bord for at redigere navn/kapacitet</div>
                  <div>• Borde snapper automatisk til gitteret</div>
                  <div>• <strong>Klik "Gem Layout"</strong> når du er færdig</div>
                </>
              ) : (
                <>
                  <div>• <strong>Klik</strong> på bord for at se detaljer</div>
                  <div>• <strong>Klik "Opret Borde"</strong> for at tilføje nye borde</div>
                  <div>• <strong>Klik "Rediger Layout"</strong> for at flytte borde</div>
                  <div>• Layoutet er låst for at forhindre utilsigtede ændringer</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total borde:</span>
                  <Badge variant="secondary">{roomTables.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total kapacitet:</span>
                  <Badge variant="secondary">
                    {roomTables.reduce((sum, table) => sum + (table.capacity || 0), 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}
