'use client'

import { useState } from 'react'
import { usePrintQueueStatus, usePrintFailureRates, usePrintJobs, useReprintJob, useCancelPrintJob } from '@/hooks/usePrintJobs'
import { usePrinters } from '@/hooks/usePrinters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface PrinterDashboardProps {
  className?: string
}

export default function PrinterDashboard({ className }: PrinterDashboardProps) {
  const [selectedPrinter, setSelectedPrinter] = useState<string>('all')
  const [isProcessorRunning, setIsProcessorRunning] = useState(false)

  // Data hooks
  const { data: queueStatus, isLoading: queueLoading, refetch: refetchQueue } = usePrintQueueStatus()
  const { data: failureRates, isLoading: failureLoading, refetch: refetchFailures } = usePrintFailureRates()
  const { data: printers = [] } = usePrinters()
  const { data: recentJobs, isLoading: jobsLoading } = usePrintJobs({
    limit: 20,
    status: selectedPrinter === 'all' ? undefined : undefined // Will filter by printer if needed
  })

  // Action hooks
  const reprintJob = useReprintJob()
  const cancelJob = useCancelPrintJob()

  // Calculate totals
  const totalQueued = queueStatus?.reduce((sum, printer) => sum + (printer.queued_count || 0), 0) || 0
  const totalProcessing = queueStatus?.reduce((sum, printer) => sum + (printer.processing_count || 0), 0) || 0
  const totalFailed = queueStatus?.reduce((sum, printer) => sum + (printer.failed_count || 0), 0) || 0

  const handleReprint = async (jobId: string) => {
    try {
      await reprintJob.mutateAsync({ originalJobId: jobId, reason: 'Manual reprint from dashboard' })
      toast.success('Print job reprinted successfully')
      refetchQueue()
    } catch (error) {
      toast.error('Failed to reprint job')
    }
  }

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob.mutateAsync({ id: jobId, reason: 'Cancelled from dashboard' })
      toast.success('Print job cancelled')
      refetchQueue()
    } catch (error) {
      toast.error('Failed to cancel job')
    }
  }

  const handleStartProcessor = async () => {
    try {
      const response = await fetch('/api/print-jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })

      if (response.ok) {
        setIsProcessorRunning(true)
        toast.success('Print processor started')
      } else {
        throw new Error('Failed to start processor')
      }
    } catch (error) {
      toast.error('Failed to start print processor')
    }
  }

  const handleStopProcessor = async () => {
    try {
      const response = await fetch('/api/print-jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })

      if (response.ok) {
        setIsProcessorRunning(false)
        toast.success('Print processor stopped')
      } else {
        throw new Error('Failed to stop processor')
      }
    } catch (error) {
      toast.error('Failed to stop print processor')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'processing': return 'bg-blue-500'
      case 'queued': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getFailureRateColor = (rate: number) => {
    if (rate >= 20) return 'text-red-600'
    if (rate >= 10) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Print Operations Dashboard</h2>
          <p className="text-muted-foreground">Monitor print jobs, queue status, and printer health</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchQueue()
              refetchFailures()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={isProcessorRunning ? "secondary" : "default"}
            size="sm"
            onClick={isProcessorRunning ? handleStopProcessor : handleStartProcessor}
          >
            {isProcessorRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Processor
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Processor
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alert for failed jobs */}
      {totalFailed > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {totalFailed} print job{totalFailed > 1 ? 's' : ''} failed. Check the queue below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Queue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueued}</div>
            <p className="text-xs text-muted-foreground">Waiting to print</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessing}</div>
            <p className="text-xs text-muted-foreground">Currently printing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Printers</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {printers.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Total printers</p>
          </CardContent>
        </Card>
      </div>

      {/* Printer Status */}
      <Card>
        <CardHeader>
          <CardTitle>Printer Status</CardTitle>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="text-center py-4">Loading printer status...</div>
          ) : (
            <div className="space-y-4">
              {queueStatus?.map((printer) => {
                const failureRate = failureRates?.find(f => f.printer_name === printer.printer_name)
                const healthPercentage = Math.max(0, 100 - (failureRate?.failure_rate_percent || 0))

                return (
                  <div key={printer.printer_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Printer className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{printer.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {printer.queued_count} queued, {printer.processing_count} processing, {printer.failed_count} failed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Health indicator */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">Health</span>
                          <span className={`text-sm font-medium ${getFailureRateColor(failureRate?.failure_rate_percent || 0)}`}>
                            {healthPercentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={healthPercentage} className="w-20 h-2" />
                      </div>

                      {/* Failure rate */}
                      {failureRate && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Failure Rate</p>
                          <p className={`text-sm font-medium ${getFailureRateColor(failureRate.failure_rate_percent)}`}>
                            {failureRate.failure_rate_percent.toFixed(1)}%
                          </p>
                        </div>
                      )}

                      {/* Last job */}
                      {printer.last_job_at && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Last Job</p>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(printer.last_job_at), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Print Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Print Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="text-center py-4">Loading recent jobs...</div>
          ) : (
            <div className="space-y-2">
              {recentJobs?.slice(0, 10).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                    <div>
                      <p className="font-medium">
                        {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)} - {job.id.slice(-8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {job.order_id && `Order: ${job.order_id.slice(-8)} • `}
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' :
                      job.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {job.status}
                    </Badge>

                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReprint(job.id)}
                        disabled={reprintJob.isPending}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reprint
                      </Button>
                    )}

                    {(job.status === 'queued' || job.status === 'processing') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(job.id)}
                        disabled={cancelJob.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {(!recentJobs || recentJobs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent print jobs found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



