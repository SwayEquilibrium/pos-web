import { NextRequest, NextResponse } from 'next/server'
import { giftCardService } from '@/lib/giftCardService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      company_id,
      amount,
      recipient_name,
      recipient_email,
      sender_name,
      sender_email,
      message,
      expiry_months
    } = body

    // Validate required fields
    if (!company_id || !amount) {
      return NextResponse.json(
        { error: 'Company ID and amount are required' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount < 50 || amount > 10000) {
      return NextResponse.json(
        { error: 'Amount must be between 50 and 10,000 DKK' },
        { status: 400 }
      )
    }

    // Validate email addresses if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (recipient_email && !emailRegex.test(recipient_email)) {
      return NextResponse.json(
        { error: 'Invalid recipient email address' },
        { status: 400 }
      )
    }

    if (sender_email && !emailRegex.test(sender_email)) {
      return NextResponse.json(
        { error: 'Invalid sender email address' },
        { status: 400 }
      )
    }

    // Create gift card
    const result = await giftCardService.createGiftCard(company_id, {
      amount,
      recipient_name,
      recipient_email,
      sender_name,
      sender_email,
      message,
      expiry_months: expiry_months || 12
    })

    return NextResponse.json({
      success: true,
      gift_card: result,
      message: 'Gift card created successfully'
    })

  } catch (error) {
    console.error('Error creating gift card:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create gift card',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get('company_id')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    const options: any = {}
    
    if (status) options.status = status
    if (limit) options.limit = parseInt(limit)
    if (offset) options.offset = parseInt(offset)

    const giftCards = await giftCardService.getGiftCards(company_id, options)

    return NextResponse.json({
      success: true,
      gift_cards: giftCards
    })

  } catch (error) {
    console.error('Error fetching gift cards:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch gift cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
