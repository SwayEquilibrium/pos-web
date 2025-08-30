'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Search,
  Printer,
  Wifi,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Settings,
  Target,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { usePrinterDiscovery, type DiscoveredPrinter } from '@/lib/utils/printerDiscovery'
import { useCreatePrinter } from '@/hooks/usePrinters'

interface PrinterDiscoveryProps {
  onPrinterAdded?: (printer: any) => void
  onRefreshNeeded?: () => void
  className?: string
}

export default function PrinterDiscovery({ onPrinterAdded, onRefreshNeeded, className }: PrinterDiscoveryProps) {
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [settingUp, setSettingUp] = useState<string | null>(null)

  // Manual setup state
  const [manualIP, setManualIP] = useState('')
  const [manualPort, setManualPort] = useState('9100')
  const [isTestingManual, setIsTestingManual] = useState(false)

  // Configuration modal state
  const [configuringPrinter, setConfiguringPrinter] = useState<DiscoveredPrinter | null>(null)
  const [customName, setCustomName] = useState('')
  const [printerType, setPrinterType] = useState('thermal')
  const [brand, setBrand] = useState('')

  const { discoverPrinters, quickScan, testConnection, testSpecificIP } = usePrinterDiscovery()
  const createPrinter = useCreatePrinter()

  // Show notification when printers are discovered
  useEffect(() => {
    if (discoveredPrinters.length > 0 && !isScanning) {
      toast.success(`Found ${discoveredPrinters.length} printer(s)!`, {
        description: 'Click "Add to System" to configure them.',
        duration: 5000,
      })
    }
  }, [discoveredPrinters.length, isScanning])

  const handleQuickScan = async () => {
    setIsScanning(true)
    setScanProgress(0)
    setDiscoveredPrinters([])

    try {
      console.log('🚀 Starting quick printer scan...')
      const printers = await quickScan()

      setDiscoveredPrinters(printers)
      toast.success(`Found ${printers.length} potential printers`)

    } catch (error) {
      console.error('❌ Quick scan failed:', error)
      toast.error('Failed to scan for printers')
    } finally {
      setIsScanning(false)
      setScanProgress(100)
    }
  }

  const handleFullScan = async () => {
    setIsScanning(true)
    setScanProgress(0)
    setDiscoveredPrinters([])

    try {
      console.log('🔍 Starting full network scan...')
      const printers = await discoverPrinters({
        timeout: 2000,
        maxConcurrent: 5
      })

      setDiscoveredPrinters(printers)
      toast.success(`Network scan complete. Found ${printers.length} potential printers`)

    } catch (error) {
      console.error('❌ Full scan failed:', error)
      toast.error('Network scan failed')
    } finally {
      setIsScanning(false)
      setScanProgress(100)
    }
  }

  const handleManualTest = async () => {
    if (!manualIP.trim()) {
      toast.error('Please enter a printer IP address')
      return
    }

    setIsTestingManual(true)
    try {
      console.log(`🔍 Testing manual printer: ${manualIP}:${manualPort}`)

      // Create a manual printer object for testing
      const protocol = manualPort === '631' ? 'ipp' : manualPort === '515' ? 'lpd' : 'raw'
      const manualPrinter: DiscoveredPrinter = {
        ip: manualIP,
        port: parseInt(manualPort),
        protocol: protocol as any,
        printerType: 'thermal',
        status: 'unknown',
        lastSeen: new Date()
      }

      // Test the connection
      const response = await testConnection(manualIP, parseInt(manualPort))
      if (response) {
        if (response.includes('blocked by browser')) {
          // Port is blocked but we'll still allow manual setup
          toast.warning(`⚠️ Port ${manualPort} is blocked by browser, but you can still add the printer manually`)
          manualPrinter.status = 'unknown'
        } else {
          toast.success(`✅ Printer found at ${manualIP}:${manualPort}!`)
          manualPrinter.status = 'online'
        }
        setDiscoveredPrinters(prev => [...prev, manualPrinter])
      } else {
        // No response, but we'll still add it for manual setup
        toast.warning(`⚠️ Could not verify connection to ${manualIP}:${manualPort}, but you can still try to add it manually`)
        manualPrinter.status = 'unknown'
        setDiscoveredPrinters(prev => [...prev, manualPrinter])
      }

    } catch (error) {
      console.error('❌ Manual test failed:', error)
      toast.error('Failed to test printer connection')
    } finally {
      setIsTestingManual(false)
    }
  }

  const handleDebugTest = async () => {
    console.log('🔧 Starting debug test for 192.168.8.192...')
    toast.info('Check browser console for detailed debug information')

    try {
      const printers = await testSpecificIP('192.168.8.192')
      if (printers.length > 0) {
        setDiscoveredPrinters(prev => [...prev, ...printers])
        toast.success(`Found ${printers.length} printer(s) at 192.168.8.192!`)
      } else {
        toast.warning('No printers found at 192.168.8.192. Check console for details.')
      }
    } catch (error) {
      console.error('Debug test failed:', error)
      toast.error('Debug test failed')
    }
  }

  const handleSetupPrinter = (printer: DiscoveredPrinter) => {
    // Open configuration modal instead of directly adding
    setConfiguringPrinter(printer)
    setCustomName(`Printer ${printer.ip}`)
    setPrinterType(printer.printerType)
    setBrand(printer.brand || '')
  }

  const handleConfirmSetup = async () => {
    if (!configuringPrinter) return

    setSettingUp(configuringPrinter.ip)

    try {
      // Check if printer already exists (we'll do this client-side for now)
      // The createPrinter hook will handle server-side duplicate checking

      // Create the printer using the hook (which will invalidate cache)
      const printerData = {
        name: customName.trim() || `Printer ${configuringPrinter.ip}`,
        display_name: customName.trim() || `Printer ${configuringPrinter.ip}`,
        printer_type: configuringPrinter.protocol.toUpperCase(),
        connection_string: configuringPrinter.ip,
        brand: brand || 'Auto-detected',
        paper_width: printerType === 'thermal' ? 48 : 80,
        supports_cut: printerType === 'thermal',
        cut_command_hex: '1B69',
        cut_command_name: 'STAR',
        print_kitchen_receipts: true,
        print_customer_receipts: true,
        auto_print_on_order: false,
        auto_print_on_payment: false,
        is_active: true,
        is_default: false
      }

      const createdPrinter = await createPrinter.mutateAsync(printerData)

      toast.success(`Printer "${createdPrinter.display_name}" added successfully!`)
      onPrinterAdded?.(createdPrinter)
      onRefreshNeeded?.() // Trigger refresh of parent component

      // Remove from discovered list
      setDiscoveredPrinters(prev =>
        prev.filter(p => p.ip !== configuringPrinter.ip)
      )

      // Close modal
      setConfiguringPrinter(null)

    } catch (error: any) {
      console.error('❌ Failed to setup printer:', error)
      if (error.message?.includes('duplicate key')) {
        toast.error('A printer with this name already exists. Please choose a different name.')
      } else {
        toast.error('Failed to add printer to system')
      }
    } finally {
      setSettingUp(null)
    }
  }

  const getPrinterIcon = (type: string) => {
    switch (type) {
      case 'thermal': return '🖨️'
      case 'laser': return '📠'
      case 'inkjet': return '🖌️'
      default: return '🖨️'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline': return <XCircle className="h-4 w-4 text-red-500" />
      case 'unknown': return <Settings className="h-4 w-4 text-yellow-500" />
      default: return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔍 Printer Discovery</h2>
          <p className="text-muted-foreground">Automatically find and setup printers on your network</p>
          <p className="text-sm text-gray-500 mt-1">
            💡 Smart scanning only checks common printer IP addresses, not your entire network
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleQuickScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Smart Scan (~50 IPs)
          </Button>
          <Button
            onClick={handleFullScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4 mr-2" />
            )}
            Full Scan (~50 IPs)
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {isScanning && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="flex-1">
                <p className="font-medium">
                  🔍 Scanning common printer IP addresses...
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Only checking likely printer locations, not your entire network
                </p>
                <Progress value={scanProgress} className="mt-3" />
                <p className="text-xs text-gray-500 mt-1">
                  This should take 10-30 seconds depending on your network
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discovered Printers */}
      {discoveredPrinters.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            📋 Found {discoveredPrinters.length} Potential Printer{discoveredPrinters.length > 1 ? 's' : ''}
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discoveredPrinters.map((printer) => (
              <Card key={`${printer.ip}:${printer.port}`} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getPrinterIcon(printer.printerType)}</span>
                      <div>
                        <CardTitle className="text-base">{printer.ip}:{printer.port}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {getStatusIcon(printer.status)}
                          {printer.protocol.toUpperCase()} • {printer.printerType}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={
                      printer.status === 'online' ? 'default' :
                      printer.status === 'unknown' ? 'outline' : 'secondary'
                    }>
                      {printer.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {printer.brand && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Brand:</strong> {printer.brand}
                      </p>
                    )}

                    {printer.responseTime && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Response:</strong> {printer.responseTime}ms
                      </p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleSetupPrinter(printer)}
                      disabled={settingUp === printer.ip}
                    >
                      {settingUp === printer.ip ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add to System
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manual Setup Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Manual Printer Setup
            <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Recommended
            </span>
          </CardTitle>
          <CardDescription>
            For most reliable results, enter your printer's IP address directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="printer-ip">Printer IP Address</Label>
              <Input
                id="printer-ip"
                placeholder="192.168.1.100"
                value={manualIP}
                onChange={(e) => setManualIP(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printer-port">Port</Label>
              <Select value={manualPort} onValueChange={setManualPort}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9100">9100 (Thermal Printer)</SelectItem>
                  <SelectItem value="9101">9101 (Thermal Printer)</SelectItem>
                  <SelectItem value="9102">9102 (Thermal Printer)</SelectItem>
                  <SelectItem value="631">631 (IPP)</SelectItem>
                  <SelectItem value="515">515 (LPD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button
                  onClick={handleManualTest}
                  disabled={isTestingManual || !manualIP.trim()}
                  className="flex-1"
                >
                  {isTestingManual ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDebugTest}
                  variant="outline"
                  className="px-3"
                  title="Debug test your specific IP (192.168.8.192)"
                >
                  🔧
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to find your printer IP:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your printer's network settings menu</li>
              <li>• Look at your router's DHCP client list</li>
              <li>• Check printer documentation for network configuration</li>
              <li>• Use network scanning tools like Advanced IP Scanner</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* No printers found */}
      {!isScanning && discoveredPrinters.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Printer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Printers Found</h3>
            <p className="text-muted-foreground mb-4">
              Network scanning completed but no printers were detected. Use manual setup above for best results.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>💡 <strong>Why might this happen?</strong></p>
              <ul className="text-left space-y-1 max-w-md mx-auto">
                <li>• Printer might be on a different network segment</li>
                <li>• Firewall blocking network discovery</li>
                <li>• Printer not configured for network printing</li>
                <li>• Some ports (like 515) are blocked by browsers</li>
                <li>• Printer IP is outside the common ranges we scan</li>
              </ul>
              <p className="text-blue-600 font-medium mt-3">
                📍 <strong>Best approach:</strong> Use the manual setup section above with your printer's exact IP address
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> This tool scans your network for devices that appear to be printers.
          Once found, you can easily add them to your POS system with one click. The system will automatically
          configure the printer with optimal settings based on its detected type and capabilities.
        </AlertDescription>
      </Alert>

      {/* Configuration Modal */}
      <Dialog open={!!configuringPrinter} onOpenChange={() => setConfiguringPrinter(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Configure Printer
            </DialogTitle>
            <DialogDescription>
              Set up your printer with custom settings before adding it to the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="printer-name">Printer Name</Label>
              <Input
                id="printer-name"
                placeholder="Kitchen Printer"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printer-type">Printer Type</Label>
              <Select value={printerType} onValueChange={setPrinterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select printer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal Printer</SelectItem>
                  <SelectItem value="laser">Laser Printer</SelectItem>
                  <SelectItem value="inkjet">Inkjet Printer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="printer-brand">Brand (Optional)</Label>
              <Input
                id="printer-brand"
                placeholder="Star, Epson, etc."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            {configuringPrinter && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>IP Address:</strong> {configuringPrinter.ip}</div>
                  <div><strong>Port:</strong> {configuringPrinter.port}</div>
                  <div><strong>Protocol:</strong> {configuringPrinter.protocol.toUpperCase()}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguringPrinter(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSetup}
              disabled={!customName.trim() || settingUp === configuringPrinter?.ip}
            >
              {settingUp === configuringPrinter?.ip ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Printer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

