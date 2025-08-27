// Test Payment System for development and testing
// This provides mock functionality for testing payments without full database setup

export interface PaymentTestResult {
  success: boolean
  message: string
  error?: string
  data?: any
}

export interface TestPaymentDetails {
  method: string
  amount: number
  cashReceived?: number
  changeGiven?: number
}

// Test system setup - check if all components are available
export async function testPaymentSystemSetup(): Promise<PaymentTestResult> {
  try {
    // Check if we have basic payment infrastructure
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    if (!hasSupabase) {
      return {
        success: false,
        message: "Database setup incomplete - missing Supabase configuration",
        error: "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found"
      }
    }

    return {
      success: true,
      message: "Payment system setup verified - Supabase configured",
      data: { hasSupabase }
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to verify payment system setup",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// Test payment recording functionality
export async function testPaymentRecording(paymentDetails: TestPaymentDetails): Promise<PaymentTestResult> {
  try {
    // Mock payment recording - in a real system this would interact with the database
    const mockPaymentId = `test_payment_${Date.now()}`
    
    // Validate payment details
    if (!paymentDetails.method || paymentDetails.amount <= 0) {
      return {
        success: false,
        message: "Invalid payment details",
        error: "Payment method and positive amount are required"
      }
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      success: true,
      message: `Test payment recorded successfully (${paymentDetails.method}: ${paymentDetails.amount} kr)`,
      data: {
        paymentId: mockPaymentId,
        method: paymentDetails.method,
        amount: paymentDetails.amount,
        cashReceived: paymentDetails.cashReceived,
        changeGiven: paymentDetails.changeGiven,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to record test payment",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// Get payment statistics (mock data for testing)
export async function getPaymentStats(): Promise<PaymentTestResult> {
  try {
    // Mock statistics - in a real system this would query the database
    const mockStats = {
      totalPayments: 42,
      totalAmount: 1250.50,
      paymentMethods: {
        cash: 25,
        card: 15,
        mobilepay: 2
      },
      lastPayment: new Date().toISOString()
    }

    return {
      success: true,
      message: "Payment statistics retrieved (mock data)",
      data: mockStats
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to retrieve payment statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// Test database connectivity
export async function testDatabaseConnection(): Promise<PaymentTestResult> {
  try {
    // This would normally test actual database connection
    // For now, just check if environment variables are set
    const hasConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    if (!hasConfig) {
      return {
        success: false,
        message: "Database configuration missing",
        error: "Supabase environment variables not configured"
      }
    }

    return {
      success: true,
      message: "Database connection test passed (configuration verified)",
      data: { configured: true }
    }
  } catch (error) {
    return {
      success: false,
      message: "Database connection test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
