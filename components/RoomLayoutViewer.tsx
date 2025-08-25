'use client'
import Link from 'next/link'
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
  status: string
  capacity?: number
}

interface Room {
  id: string
  name: string
  color?: string
}

interface RoomLayoutViewerProps {
  room: Room
  tables: Table[]
}

export default function RoomLayoutViewer({ room, tables }: RoomLayoutViewerProps) {
  // Scale factor to make the layout smaller for overview
  const SCALE_FACTOR = 0.4
  const CANVAS_WIDTH = 800 * SCALE_FACTOR
  const CANVAS_HEIGHT = 600 * SCALE_FACTOR
  
  const roomTables = tables.filter(table => table.room_id === room.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-500 hover:bg-red-600'
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'cleaning': return 'bg-blue-500 hover:bg-blue-600'
      default: return 'bg-green-500 hover:bg-green-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return 'Ledigt'
      case 'occupied': return 'Optaget'
      case 'reserved': return 'Reserveret'
      case 'cleaning': return 'Rengøring'
      default: return status
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-3" 
              style={{ backgroundColor: room.color || '#3B82F6' }}
            ></div>
            {room.name}
          </div>
          <Badge variant="secondary">
            {roomTables.length} {roomTables.length === 1 ? 'bord' : 'borde'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {roomTables.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Visual Layout */}
            <div className="flex-1">
              <div 
                className="relative border-2 border-dashed border-gray-300 bg-gray-50 mx-auto rounded-lg"
                style={{ 
                  width: CANVAS_WIDTH, 
                  height: CANVAS_HEIGHT,
                  backgroundImage: `radial-gradient(circle, #ccc 1px, transparent 1px)`,
                  backgroundSize: `${8 * SCALE_FACTOR}px ${8 * SCALE_FACTOR}px`
                }}
              >
                {/* Tables */}
                {roomTables.map(table => (
                  <Link key={table.id} href={`/orders/${table.id}`}>
                    <div
                      className={`absolute border-2 rounded-md cursor-pointer flex flex-col items-center justify-center text-white text-xs font-bold shadow-md transition-all hover:scale-110 hover:z-10 ${getStatusColor(table.status)}`}
                      style={{
                        left: (table.x || 0) * SCALE_FACTOR,
                        top: (table.y || 0) * SCALE_FACTOR,
                        width: (table.width || 60) * SCALE_FACTOR,
                        height: (table.height || 60) * SCALE_FACTOR
                      }}
                      title={`${table.name} - ${getStatusText(table.status)}`}
                    >
                      <div className="leading-tight">{table.name}</div>
                      {table.capacity && (
                        <div className="text-xs opacity-75">{table.capacity}p</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Table List */}
            <div className="lg:w-80">
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">Bordliste</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {roomTables.map(table => (
                  <Link key={table.id} href={`/orders/${table.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(table.status).split(' ')[0]}`}></div>
                        <div>
                          <div className="font-medium">{table.name}</div>
                          {table.capacity && (
                            <div className="text-xs text-muted-foreground">{table.capacity} personer</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(table.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Ingen borde i dette lokale</p>
            <p className="text-sm mt-1">Tilføj borde i Layout Designer</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
