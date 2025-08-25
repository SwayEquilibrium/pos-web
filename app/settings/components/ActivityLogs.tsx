'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  useAuditLogs, 
  useUserActivityLogs, 
  usePaymentLogs, 
  useSettingsChangeLogs 
} from '@/hooks/useActivityLogs'

type LogType = 'audit' | 'activity' | 'payments' | 'settings'

interface LogFilters {
  date_from?: string
  date_to?: string
  table_name?: string
  operation?: string
  action?: string
  resource_type?: string
  payment_method?: string
  status?: string
  setting_category?: string
}

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState<LogType>('activity')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<LogFilters>({})
  const pageSize = 20

  // Fetch data based on active tab
  const auditLogs = useAuditLogs(currentPage, pageSize, filters)
  const activityLogs = useUserActivityLogs(currentPage, pageSize, filters)
  const paymentLogs = usePaymentLogs(currentPage, pageSize, filters)
  const settingsLogs = useSettingsChangeLogs(currentPage, pageSize, filters)

  const getCurrentData = () => {
    switch (activeTab) {
      case 'audit': return auditLogs
      case 'activity': return activityLogs
      case 'payments': return paymentLogs
      case 'settings': return settingsLogs
      default: return activityLogs
    }
  }

  const currentData = getCurrentData()
  const totalPages = Math.ceil((currentData.data?.total || 0) / pageSize)

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('da-DK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getOperationBadgeVariant = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'default'
      case 'UPDATE': return 'secondary'
      case 'DELETE': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'pending': return 'secondary'
      case 'failed': return 'destructive'
      case 'refunded': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'activity' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveTab('activity')
            setCurrentPage(1)
            setFilters({})
          }}
        >
          📋 User Activity
        </Button>
        <Button
          variant={activeTab === 'payments' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveTab('payments')
            setCurrentPage(1)
            setFilters({})
          }}
        >
          💳 Payments
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveTab('audit')
            setCurrentPage(1)
            setFilters({})
          }}
        >
          🔍 Database Changes
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActiveTab('settings')
            setCurrentPage(1)
            setFilters({})
          }}
        >
          ⚙️ Settings Changes
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_from">Fra dato</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_to">Til dato</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>

            {/* Tab-specific filters */}
            {activeTab === 'audit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="table_name">Tabel</Label>
                  <select
                    id="table_name"
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.table_name || ''}
                    onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  >
                    <option value="">Alle tabeller</option>
                    <option value="orders">Orders</option>
                    <option value="order_items">Order Items</option>
                    <option value="products">Products</option>
                    <option value="categories">Categories</option>
                    <option value="companies">Companies</option>
                    <option value="user_profiles">User Profiles</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operation">Operation</Label>
                  <select
                    id="operation"
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.operation || ''}
                    onChange={(e) => handleFilterChange('operation', e.target.value)}
                  >
                    <option value="">Alle operationer</option>
                    <option value="INSERT">Insert</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'activity' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="action">Handling</Label>
                  <select
                    id="action"
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.action || ''}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <option value="">Alle handlinger</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="order_created">Order Created</option>
                    <option value="payment_processed">Payment Processed</option>
                    <option value="setting_updated">Setting Updated</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource_type">Resource Type</Label>
                  <select
                    id="resource_type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.resource_type || ''}
                    onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                  >
                    <option value="">Alle typer</option>
                    <option value="order">Order</option>
                    <option value="product">Product</option>
                    <option value="company_setting">Company Setting</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'payments' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Betalingsmetode</Label>
                  <select
                    id="payment_method"
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.payment_method || ''}
                    onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                  >
                    <option value="">Alle metoder</option>
                    <option value="cash">Kontant</option>
                    <option value="card">Kort</option>
                    <option value="mobile_pay">MobilePay</option>
                    <option value="bank_transfer">Bankoverførsel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_status">Status</Label>
                  <select
                    id="payment_status"
                    className="w-full px-3 py-2 border rounded-md"
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Alle statusser</option>
                    <option value="completed">Gennemført</option>
                    <option value="pending">Afventer</option>
                    <option value="failed">Fejlet</option>
                    <option value="refunded">Refunderet</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-2">
                <Label htmlFor="setting_category">Kategori</Label>
                <select
                  id="setting_category"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filters.setting_category || ''}
                  onChange={(e) => handleFilterChange('setting_category', e.target.value)}
                >
                  <option value="">Alle kategorier</option>
                  <option value="company">Company</option>
                  <option value="pos">POS Settings</option>
                  <option value="payment">Payment Settings</option>
                  <option value="receipt">Receipt Settings</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Ryd filtre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {activeTab === 'activity' && '📋 Brugeraktivitet'}
              {activeTab === 'payments' && '💳 Betalinger'}
              {activeTab === 'audit' && '🔍 Database Ændringer'}
              {activeTab === 'settings' && '⚙️ Indstillingsændringer'}
            </span>
            {currentData.isLoading && <span className="text-sm text-muted-foreground">⏳ Indlæser...</span>}
          </CardTitle>
          {currentData.data && (
            <p className="text-sm text-muted-foreground">
              Viser {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, currentData.data.total)} af {currentData.data.total} poster
            </p>
          )}
        </CardHeader>
        <CardContent>
          {currentData.isError && (
            <div className="text-center py-8 text-red-600">
              Fejl ved indlæsning af data. Prøv igen senere.
            </div>
          )}

          {currentData.data?.data.length === 0 && !currentData.isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Ingen data fundet med de valgte filtre.
            </div>
          )}

          {/* User Activity Logs */}
          {activeTab === 'activity' && currentData.data?.data && (
            <div className="space-y-3">
              {currentData.data.data.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.action}</Badge>
                      {log.resource_type && <Badge variant="secondary">{log.resource_type}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p><strong>Bruger:</strong> {log.user_email}</p>
                    {log.ip_address && <p><strong>IP:</strong> {log.ip_address}</p>}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">Detaljer</summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Logs */}
          {activeTab === 'payments' && currentData.data?.data && (
            <div className="space-y-3">
              {currentData.data.data.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                      <Badge variant="outline">{log.payment_method}</Badge>
                      <span className="font-semibold">{log.amount} {log.currency}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p><strong>Order ID:</strong> {log.order_id}</p>
                    <p><strong>Behandlet af:</strong> {log.processed_by_email}</p>
                    {log.transaction_reference && (
                      <p><strong>Reference:</strong> {log.transaction_reference}</p>
                    )}
                    {log.processed_at && (
                      <p><strong>Behandlet:</strong> {formatDateTime(log.processed_at)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && currentData.data?.data && (
            <div className="space-y-3">
              {currentData.data.data.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getOperationBadgeVariant(log.operation)}>{log.operation}</Badge>
                      <Badge variant="outline">{log.table_name}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p><strong>Bruger:</strong> {log.user_email}</p>
                    <p><strong>Record ID:</strong> {log.record_id}</p>
                    {log.changed_fields && log.changed_fields.length > 0 && (
                      <p><strong>Ændrede felter:</strong> {log.changed_fields.join(', ')}</p>
                    )}
                    {(log.old_data || log.new_data) && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">Data ændringer</summary>
                        <div className="mt-1 text-xs space-y-2">
                          {log.old_data && (
                            <div>
                              <strong>Gammel data:</strong>
                              <pre className="bg-red-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.old_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <strong>Ny data:</strong>
                              <pre className="bg-green-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.new_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings Change Logs */}
          {activeTab === 'settings' && currentData.data?.data && (
            <div className="space-y-3">
              {currentData.data.data.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.setting_category}</Badge>
                      <span className="font-medium">{log.setting_key}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p><strong>Bruger:</strong> {log.user_email}</p>
                    {log.reason && <p><strong>Årsag:</strong> {log.reason}</p>}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <strong>Gammel værdi:</strong>
                        <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.old_value, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <strong>Ny værdi:</strong>
                        <pre className="mt-1 text-xs bg-green-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.new_value, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Forrige
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Næste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
