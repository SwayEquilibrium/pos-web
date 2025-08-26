'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  useZReportData,
  useDailySalesSummary 
} from '@/hooks/usePayments'
import { 
  Calculator,
  ArrowLeft,
  RefreshCw,
  Printer,
  Save,
  AlertCircle,
  CheckCircle,
  Banknote
} from 'lucide-react'

export default function CashRegisterAccountingPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [physicalCash, setPhysicalCash] = useState<{[key: string]: string}>({
    '1000': '',
    '500': '',
    '200': '',
    '100': '',
    '50': '',
    '20': '',
    '10': '',
    '5': '',
    '2': '',
    '1': '',
    '0.50': '',
    '0.25': '',
    '0.10': '',
    '0.05': ''
  })
  const [startingCash, setStartingCash] = useState<string>('1000')
  const [notes, setNotes] = useState<string>('')

  // Fetch Z-report data
  const { data: zReportData = [], isLoading: zReportLoading, refetch: refetchZReport } = useZReportData(selectedDate)

  // Calculate expected cash from system
  const systemCashData = useMemo(() => {
    const cashMethod = zReportData.find(method => 
      method.payment_method.toLowerCase().includes('kontant') || 
      method.payment_method.toLowerCase().includes('cash')
    )
    
    return {
      totalCashSales: Number(cashMethod?.total_amount || 0),
      totalCashReceived: Number(cashMethod?.total_cash_received || 0),
      totalChangeGiven: Number(cashMethod?.total_change_given || 0),
      netCash: Number(cashMethod?.net_cash || 0),
      transactionCount: Number(cashMethod?.transaction_count || 0)
    }
  }, [zReportData])

  // Calculate physical cash count
  const physicalCashTotal = useMemo(() => {
    return Object.entries(physicalCash).reduce((total, [denomination, count]) => {
      const denomValue = parseFloat(denomination)
      const countValue = parseInt(count) || 0
      return total + (denomValue * countValue)
    }, 0)
  }, [physicalCash])

  // Calculate expected cash in register
  const expectedCashInRegister = useMemo(() => {
    const startingAmount = parseFloat(startingCash) || 0
    return startingAmount + systemCashData.netCash
  }, [startingCash, systemCashData.netCash])

  // Calculate difference
  const cashDifference = physicalCashTotal - expectedCashInRegister

  const handlePhysicalCashChange = (denomination: string, value: string) => {
    setPhysicalCash(prev => ({
      ...prev,
      [denomination]: value
    }))
  }

  const handlePrintReport = () => {
    // In a real app, this would trigger a print dialog or send to printer
    alert('Kasseopstilling sendt til printer')
  }

  const handleSaveReport = () => {
    // In a real app, this would save the cash reconciliation to database
    const reportData = {
      date: selectedDate,
      systemCash: systemCashData,
      physicalCash: physicalCashTotal,
      startingCash: parseFloat(startingCash) || 0,
      expectedCash: expectedCashInRegister,
      difference: cashDifference,
      denominations: physicalCash,
      notes
    }
    
    console.log('Saving cash reconciliation:', reportData)
    alert('Kasseopstilling gemt')
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
            <h1 className="text-2xl font-bold">Kasseopstelling</h1>
            <p className="text-muted-foreground">Afstemning af fysisk kasse med system</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetchZReport}
            disabled={zReportLoading}
          >
            <RefreshCw size={16} className={zReportLoading ? 'animate-spin' : ''} />
            Opdater
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator size={20} />
            Vælg dato for kasseopstelling
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <div>
              <Label htmlFor="startingCash">Startbeløb i kasse (kr.)</Label>
              <Input
                id="startingCash"
                type="number"
                step="0.01"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                className="w-48"
                placeholder="1000.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Cash Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote size={20} />
              System Kontantrapport
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {zReportLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin mr-2" />
                Indlæser data...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-muted/50 rounded">
                  <span>Kontantsalg i alt:</span>
                  <span className="font-bold">{systemCashData.totalCashSales.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded">
                  <span>Kontant modtaget:</span>
                  <span className="font-bold text-green-600">{systemCashData.totalCashReceived.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded">
                  <span>Byttepenge givet:</span>
                  <span className="font-bold text-red-600">-{systemCashData.totalChangeGiven.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Netto kontant:</span>
                  <span className="font-bold text-blue-600">{systemCashData.netCash.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded">
                  <span>Antal transaktioner:</span>
                  <span className="font-bold">{systemCashData.transactionCount}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <span className="font-medium">Forventet i kasse:</span>
                    <span className="font-bold text-green-600">{expectedCashInRegister.toFixed(2)} kr</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Startbeløb ({parseFloat(startingCash || '0').toFixed(2)} kr) + Netto kontant ({systemCashData.netCash.toFixed(2)} kr)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Physical Cash Count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator size={20} />
              Fysisk Kassetælling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Banknotes */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">SEDLER</h4>
                {['1000', '500', '200', '100', '50', '20'].map((denomination) => (
                  <div key={denomination} className="flex items-center gap-2">
                    <Label className="w-12 text-sm">{denomination} kr</Label>
                    <Input
                      type="number"
                      min="0"
                      value={physicalCash[denomination]}
                      onChange={(e) => handlePhysicalCashChange(denomination, e.target.value)}
                      className="w-16 text-center"
                      placeholder="0"
                    />
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {((parseFloat(denomination) * (parseInt(physicalCash[denomination]) || 0))).toFixed(0)} kr
                    </span>
                  </div>
                ))}
              </div>

              {/* Coins */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">MØNTER</h4>
                {['20', '10', '5', '2', '1', '0.50', '0.25'].map((denomination) => (
                  <div key={denomination} className="flex items-center gap-2">
                    <Label className="w-12 text-sm">{denomination} kr</Label>
                    <Input
                      type="number"
                      min="0"
                      value={physicalCash[denomination]}
                      onChange={(e) => handlePhysicalCashChange(denomination, e.target.value)}
                      className="w-16 text-center"
                      placeholder="0"
                    />
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {((parseFloat(denomination) * (parseInt(physicalCash[denomination]) || 0))).toFixed(2)} kr
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                <span className="font-medium">Fysisk total:</span>
                <span className="font-bold text-blue-600">{physicalCashTotal.toFixed(2)} kr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Math.abs(cashDifference) < 0.01 ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            Kasseopstilling Resultat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
              <div className="text-lg font-bold text-green-600">{expectedCashInRegister.toFixed(2)} kr</div>
              <div className="text-sm text-muted-foreground">Forventet</div>
            </div>
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="text-lg font-bold text-blue-600">{physicalCashTotal.toFixed(2)} kr</div>
              <div className="text-sm text-muted-foreground">Fysisk talt</div>
            </div>
            <div className={`text-center p-4 rounded border ${
              Math.abs(cashDifference) < 0.01 
                ? 'bg-green-50 border-green-200' 
                : cashDifference > 0 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-lg font-bold ${
                Math.abs(cashDifference) < 0.01 
                  ? 'text-green-600' 
                  : cashDifference > 0 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {cashDifference >= 0 ? '+' : ''}{cashDifference.toFixed(2)} kr
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.abs(cashDifference) < 0.01 ? 'Stemmer' : 'Difference'}
              </div>
            </div>
          </div>

          {Math.abs(cashDifference) >= 0.01 && (
            <div className={`p-4 rounded border ${
              cashDifference > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className={cashDifference > 0 ? 'text-yellow-600' : 'text-red-600'} />
                <span className="font-medium">
                  {cashDifference > 0 ? 'Overskud' : 'Underskud'} på {Math.abs(cashDifference).toFixed(2)} kr
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {cashDifference > 0 
                  ? 'Der er flere penge i kassen end forventet. Kontroller om alle transaktioner er registreret korrekt.'
                  : 'Der mangler penge i kassen. Kontroller optælling og transaktioner.'
                }
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Noter</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 p-3 border rounded-md"
              rows={3}
              placeholder="Tilføj noter om kasseopstillingen..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer size={16} className="mr-2" />
              Print Rapport
            </Button>
            <Button onClick={handleSaveReport}>
              <Save size={16} className="mr-2" />
              Gem Kasseopstilling
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
