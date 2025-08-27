'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  usePaymentTransactions,
  useZReportData,
  useDailySalesSummary
} from '@/hooks/usePayments'
import {
  Calendar,
  Download,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  ArrowLeft,
  RefreshCw,
  Eye,
  FileText,
  Building,
  Clock
} from 'lucide-react'

export default function PaymentReportsPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [reportType, setReportType] = useState<'daily' | 'range'>('daily')

  // Fetch payment data
  const { data: paymentTransactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = usePaymentTransactions(
    reportType === 'range' ? { 
      date_from: dateFrom, 
      date_to: dateTo,
      payment_method: selectedMethod || undefined
    } : undefined
  )

  const { data: zReportData = [], isLoading: zReportLoading, refetch: refetchZReport } = useZReportData(selectedDate)
  const { data: dailySummary = [], isLoading: summaryLoading, refetch: refetchSummary } = useDailySalesSummary(selectedDate)

  // Payment method icons
  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
      case 'kontant':
        return <Banknote className="w-5 h-5 text-green-600" />
      case 'card':
      case 'kort':
        return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'mobilepay':
        return <Smartphone className="w-5 h-5 text-purple-600" />
      case 'gift_card':
      case 'gavekort':
        return <Wallet className="w-5 h-5 text-pink-600" />
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />
    }
  }

  // Calculate totals
  const totals = useMemo(() => {
    if (reportType === 'daily' && zReportData.length > 0) {
      return {
        totalAmount: zReportData.reduce((sum, item) => sum + Number(item.total_amount), 0),
        totalTransactions: zReportData.reduce((sum, item) => sum + Number(item.transaction_count), 0),
        totalCashReceived: zReportData.reduce((sum, item) => sum + Number(item.total_cash_received || 0), 0),
        totalChangeGiven: zReportData.reduce((sum, item) => sum + Number(item.total_change_given || 0), 0),
        netCash: zReportData.reduce((sum, item) => sum + Number(item.net_cash || 0), 0)
      }
    } else if (reportType === 'range' && paymentTransactions.length > 0) {
      return {
        totalAmount: paymentTransactions.reduce((sum, txn) => sum + Number(txn.amount), 0),
        totalTransactions: paymentTransactions.length,
        totalCashReceived: paymentTransactions.reduce((sum, txn) => sum + Number(txn.cash_received || 0), 0),
        totalChangeGiven: paymentTransactions.reduce((sum, txn) => sum + Number(txn.change_given || 0), 0),
        netCash: paymentTransactions.reduce((sum, txn) => sum + Number(txn.cash_received || 0) - Number(txn.change_given || 0), 0)
      }
    }
    return {
      totalAmount: 0,
      totalTransactions: 0,
      totalCashReceived: 0,
      totalChangeGiven: 0,
      netCash: 0
    }
  }, [zReportData, paymentTransactions, reportType])

  const refreshData = () => {
    if (reportType === 'daily') {
      refetchZReport()
      refetchSummary()
    } else {
      refetchTransactions()
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Tilbage til Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Betalingsrapporter</h1>
            <p className="text-muted-foreground">Oversigt over betalinger og transaktioner</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={transactionsLoading || zReportLoading || summaryLoading}
          >
            <RefreshCw size={16} className={transactionsLoading || zReportLoading || summaryLoading ? 'animate-spin' : ''} />
            Opdater
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Rapporttype
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={reportType === 'daily' ? 'default' : 'outline'}
              onClick={() => setReportType('daily')}
            >
              📅 Daglig Z-rapport
            </Button>
            <Button
              variant={reportType === 'range' ? 'default' : 'outline'}
              onClick={() => setReportType('range')}
            >
              📊 Periode rapport
            </Button>
          </div>

          {reportType === 'daily' && (
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="selectedDate">Dato</Label>
                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          )}

          {reportType === 'range' && (
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="dateFrom">Fra dato</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-48"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Til dato</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-48"
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Betalingsmetode</Label>
                <select
                  id="paymentMethod"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="px-3 py-2 border rounded-md w-48"
                >
                  <option value="">Alle metoder</option>
                  <option value="cash">Kontant</option>
                  <option value="card">Kort</option>
                  <option value="mobilepay">MobilePay</option>
                  <option value="gift_card">Gavekort</option>
                  <option value="other">Andet</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{totals.totalAmount.toFixed(2)} kr</div>
            <p className="text-sm text-muted-foreground">Total Salg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totals.totalTransactions}</div>
            <p className="text-sm text-muted-foreground">Transaktioner</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totals.totalCashReceived.toFixed(2)} kr</div>
            <p className="text-sm text-muted-foreground">Kontant Modtaget</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{totals.totalChangeGiven.toFixed(2)} kr</div>
            <p className="text-sm text-muted-foreground">Byttepenge Givet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{totals.netCash.toFixed(2)} kr</div>
            <p className="text-sm text-muted-foreground">Netto Kontant</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      {reportType === 'daily' && zReportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Z-rapport for {selectedDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zReportData.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(method.payment_method)}
                    <div>
                      <p className="font-medium">{method.payment_method}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.transaction_count} transaktioner
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{Number(method.total_amount).toFixed(2)} kr</div>
                    {method.payment_method.toLowerCase().includes('kontant') && (
                      <div className="text-sm text-muted-foreground">
                        Netto: {Number(method.net_cash).toFixed(2)} kr
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      {reportType === 'range' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} />
              Transaktioner ({dateFrom} - {dateTo})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin mr-2" />
                Indlæser transaktioner...
              </div>
            ) : paymentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ingen transaktioner fundet i den valgte periode
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {paymentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(transaction.payment_method_name)}
                      <div>
                        <p className="font-medium">{transaction.payment_method_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.transaction_date).toLocaleString('da-DK')}
                          {transaction.order_id && ` • Ordre: ${transaction.order_id.substring(0, 8)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{Number(transaction.amount).toFixed(2)} kr</div>
                      {transaction.cash_received && (
                        <div className="text-sm text-muted-foreground">
                          Modtaget: {Number(transaction.cash_received).toFixed(2)} kr
                          {transaction.change_given && Number(transaction.change_given) > 0 && (
                            <> • Tilbage: {Number(transaction.change_given).toFixed(2)} kr</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Danish Z-Rapport Section */}
      {reportType === 'daily' && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="w-5 h-5" />
              Z-Rapport (Dansk Standard)
              <Badge variant="outline" className="ml-auto border-blue-300 text-blue-700">
                Officiel Rapport
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {zReportLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin mr-2" />
                Genererer Z-rapport...
              </div>
            ) : zReportData && zReportData.length > 0 ? (
              <div className="space-y-4">
                {/* Report Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Rapport dato:</span>
                    <span className="text-sm">{zReportData[0]?.date || selectedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Genereret:</span>
                    <span className="text-sm">{new Date().toLocaleString('da-DK')}</span>
                  </div>
                </div>

                {/* Sales Summary */}
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold mb-3 text-gray-900">Salgssammendrag</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {Number(zReportData[0]?.total_sales || 0).toFixed(2)} kr
                      </div>
                      <div className="text-sm text-gray-600">Total Salg</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {zReportData[0]?.total_transactions || 0}
                      </div>
                      <div className="text-sm text-gray-600">Antal Transaktioner</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {zReportData[0]?.total_transactions ?
                          (Number(zReportData[0]?.total_sales || 0) / zReportData[0]?.total_transactions).toFixed(2) : '0.00'} kr
                      </div>
                      <div className="text-sm text-gray-600">Gennemsnit pr. Transaktion</div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold mb-3 text-gray-900">Betalingsmetoder</h4>
                  <div className="space-y-2">
                    {zReportData[0]?.payment_methods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(method.method)}
                          <span className="font-medium capitalize">{method.method.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{Number(method.amount).toFixed(2)} kr</div>
                          <div className="text-sm text-gray-600">{method.count} transaktioner</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VAT Summary */}
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold mb-3 text-gray-900">Momsberegning (25%)</h4>
                  {zReportData[0]?.tax_summary.map((tax, index) => (
                    <div key={index} className="space-y-2">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nettobeløb:</span>
                          <div className="font-semibold">{Number(tax.net_amount).toFixed(2)} kr</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Moms ({tax.rate}%):</span>
                          <div className="font-semibold">{Number(tax.tax_amount).toFixed(2)} kr</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Bruttobeløb:</span>
                          <div className="font-semibold">{Number(tax.gross_amount).toFixed(2)} kr</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Official Footer */}
                <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs text-gray-600 mb-2">
                    Denne Z-rapport er genereret i overensstemmelse med dansk regnskabslovgivning
                  </p>
                  <p className="text-xs text-gray-600">
                    Skal opbevares i minimum 5 år til brug for SKAT og revision
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.print()}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Udskriv Z-Rapport
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ingen Z-rapport data fundet for valgte dato</p>
                <p className="text-sm mt-1">Vælg en dato hvor der har været aktivitet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {((reportType === 'daily' && zReportData.length === 0 && !zReportLoading) ||
        (reportType === 'range' && paymentTransactions.length === 0 && !transactionsLoading)) && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ingen betalingsdata</h3>
            <p className="text-muted-foreground mb-4">
              {reportType === 'daily' 
                ? `Der er ingen transaktioner registreret for ${selectedDate}`
                : `Der er ingen transaktioner i perioden ${dateFrom} - ${dateTo}`
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Betalinger vil blive vist her når de bliver behandlet gennem systemet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
