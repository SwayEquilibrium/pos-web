'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { testPaymentSystemSetup, testPaymentRecording, getPaymentStats, type PaymentTestResult } from '@/lib/testPaymentSystem'
import { useRecordPayment } from '@/hooks/usePayments'
import type { PaymentDetails } from '@/components/PaymentModal'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Database
} from 'lucide-react'

export default function TestPaymentsPage() {
  const router = useRouter()
  const [testResults, setTestResults] = useState<PaymentTestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testPaymentAmount, setTestPaymentAmount] = useState('25.00')
  const [testCashReceived, setTestCashReceived] = useState('30.00')
  
  const recordPayment = useRecordPayment()

  const runSystemTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    try {
      // Test 1: System setup
      const setupResult = await testPaymentSystemSetup()
      setTestResults(prev => [...prev, { ...setupResult, message: '1. ' + setupResult.message }])

      if (setupResult.success) {
        // Test 2: Payment recording
        const recordingResult = await testPaymentRecording({
          method: 'cash',
          amount: 1.00,
          cashReceived: 2.00,
          changeGiven: 1.00
        })
        setTestResults(prev => [...prev, { ...recordingResult, message: '2. ' + recordingResult.message }])

        // Test 3: Get statistics
        const statsResult = await getPaymentStats()
        setTestResults(prev => [...prev, { ...statsResult, message: '3. ' + statsResult.message }])
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        message: 'Unexpected error during testing',
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
    } finally {
      setIsRunningTests(false)
    }
  }

  const testRealPayment = async () => {
    try {
      const paymentDetails: PaymentDetails = {
        method: 'cash',
        amount: parseFloat(testPaymentAmount),
        cashReceived: parseFloat(testCashReceived),
        changeGiven: parseFloat(testCashReceived) - parseFloat(testPaymentAmount),
        originalAmount: parseFloat(testPaymentAmount),
        discountAmount: 0
      }

      const result = await recordPayment.mutateAsync({
        orderId: undefined,
        paymentDetails
      })

      setTestResults(prev => [...prev, {
        success: true,
        message: `✅ Real payment test successful! Transaction ID: ${result}`,
        data: { transactionId: result, paymentDetails }
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        message: '❌ Real payment test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
    }
  }

  const getResultIcon = (result: PaymentTestResult) => {
    if (result.success) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />
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
            <h1 className="text-2xl font-bold">Test Betalingssystem</h1>
            <p className="text-muted-foreground">Verificer at betalingssystemet fungerer korrekt</p>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} />
              System Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kør automatiske tests for at verificere database setup og funktionalitet
            </p>
            <Button 
              onClick={runSystemTests}
              disabled={isRunningTests}
              className="w-full"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Kører tests...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Kør System Tests
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play size={20} />
              Test Betaling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="testAmount">Beløb (kr.)</Label>
                <Input
                  id="testAmount"
                  type="number"
                  step="0.01"
                  value={testPaymentAmount}
                  onChange={(e) => setTestPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testCash">Modtaget (kr.)</Label>
                <Input
                  id="testCash"
                  type="number"
                  step="0.01"
                  value={testCashReceived}
                  onChange={(e) => setTestCashReceived(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Tilbage: {(parseFloat(testCashReceived) - parseFloat(testPaymentAmount)).toFixed(2)} kr
            </div>
            <Button 
              onClick={testRealPayment}
              disabled={recordPayment.isPending}
              className="w-full"
              variant="outline"
            >
              {recordPayment.isPending ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Behandler...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Test Real Betaling
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} />
              Test Resultater
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getResultIcon(result)}
                  <div className="flex-1">
                    <div className="font-medium">{result.message}</div>
                    {result.error && (
                      <div className="text-sm text-red-600 mt-1">
                        Fejl: {result.error}
                      </div>
                    )}
                    {result.data && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruktioner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Database Setup</h4>
            <p className="text-sm text-muted-foreground">
              Hvis system tests fejler, skal du køre SQL scripts i din Supabase database:
            </p>
            <div className="bg-muted p-3 rounded font-mono text-sm">
              <div>1. Kør: database/payment-tracking-schema.sql</div>
              <div>2. Kør: database/audit-logging-system.sql (valgfri)</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Test Betaling</h4>
            <p className="text-sm text-muted-foreground">
              Når system tests passerer, kan du teste en rigtig betaling. Dette vil:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside ml-4">
              <li>Oprette en transaktion i payment_transactions tabellen</li>
              <li>Opdatere daily_sales_summary</li>
              <li>Logge betalingsdetaljer til konsollen</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Verificer Resultater</h4>
            <p className="text-sm text-muted-foreground">
              Check dine Supabase tabeller eller gå til:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/economy/reports')}
              >
                📊 Betalingsrapporter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/economy/accounting')}
              >
                🧮 Kasseopstilling
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
