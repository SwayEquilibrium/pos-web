'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Database, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface TableStatus {
  name: string
  exists: boolean
  description: string
}

export default function DatabaseStatus() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    checkDatabaseTables()
  }, [])

  const checkDatabaseTables = async () => {
    const tablesToCheck = [
      { name: 'payment_types', description: 'Payment methods configuration' },
      { name: 'payment_transactions', description: 'Payment records and tracking' },
      { name: 'customer_groups', description: 'Customer discount groups' },
      { name: 'gift_cards', description: 'Gift card management' }
    ]

    const statuses: TableStatus[] = []

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1)

        statuses.push({
          name: table.name,
          exists: !error,
          description: table.description
        })
      } catch (err) {
        statuses.push({
          name: table.name,
          exists: false,
          description: table.description
        })
      }
    }

    setTableStatuses(statuses)
    setIsLoading(false)
  }

  const missingTables = tableStatuses.filter(t => !t.exists)
  const hasAllTables = missingTables.length === 0

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800">Checking database status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasAllTables && !showDetails) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Database ready</span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                All tables found
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={hasAllTables ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${hasAllTables ? 'text-green-800' : 'text-orange-800'}`}>
          <Database className="w-5 h-5" />
          Database Status
          {!hasAllTables && (
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Setup required
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAllTables && (
          <div className={`p-3 rounded-lg border ${hasAllTables ? 'border-green-200 bg-green-100' : 'border-orange-200 bg-orange-100'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-orange-800 font-medium mb-1">
                  Payment system is using fallback data
                </p>
                <p className="text-orange-700">
                  Some database tables are missing. The system works but payments won't be saved permanently.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 text-sm">Required Tables:</h4>
          <div className="grid grid-cols-1 gap-2">
            {tableStatuses.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-2 rounded border bg-white"
              >
                <div className="flex items-center gap-2">
                  {table.exists ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  <div>
                    <span className="font-mono text-sm">{table.name}</span>
                    <p className="text-xs text-gray-600">{table.description}</p>
                  </div>
                </div>
                <Badge variant={table.exists ? "default" : "secondary"} className="text-xs">
                  {table.exists ? "Found" : "Missing"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {!hasAllTables && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/docs/database-setup.md', '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Setup Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkDatabaseTables}
              className="flex items-center gap-1"
            >
              <Database className="w-3 h-3" />
              Recheck
            </Button>
          </div>
        )}

        {hasAllTables && showDetails && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(false)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Hide Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
