import { NextRequest, NextResponse } from 'next/server'
import { giftCardService } from '@/lib/giftCardService'
import { generateGiftCardEmailContent } from '@/lib/giftCardUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      gift_card_code,
      recipient_email,
      sender_name,
      custom_message
    } = body

    // Validate required fields
    if (!gift_card_code || !recipient_email) {
      return NextResponse.json(
        { error: 'Gift card code and recipient email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipient_email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get gift card details
    const giftCard = await giftCardService.getGiftCardByCode(gift_card_code)
    
    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Generate email content
    const emailContent = generateGiftCardEmailContent({
      code: giftCard.code,
      amount: giftCard.initial_amount,
      recipientName: giftCard.recipient_name,
      senderName: sender_name || giftCard.sender_name || 'Payper Steak House',
      message: custom_message || giftCard.message,
      expiryDate: giftCard.expiry_date
    })

    // Here you would integrate with your email service (e.g., SendGrid, Mailgun, etc.)
    // For now, we'll just return the email content for demonstration
    
    // Example integration with a hypothetical email service:
    /*
    const emailService = new EmailService()
    const result = await emailService.send({
      to: recipient_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })
    */

    // For now, simulate successful email sending
    console.log('Email would be sent to:', recipient_email)
    console.log('Email subject:', emailContent.subject)

    return NextResponse.json({
      success: true,
      message: 'Gift card email sent successfully',
      email_preview: {
        to: recipient_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
    })

  } catch (error) {
    console.error('Error sending gift card email:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send gift card email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get email template preview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gift_card_code = searchParams.get('gift_card_code')

    if (!gift_card_code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      )
    }

    // Get gift card details
    const giftCard = await giftCardService.getGiftCardByCode(gift_card_code)
    
    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Generate email content preview
    const emailContent = generateGiftCardEmailContent({
      code: giftCard.code,
      amount: giftCard.initial_amount,
      recipientName: giftCard.recipient_name,
      senderName: giftCard.sender_name || 'Payper Steak House',
      message: giftCard.message,
      expiryDate: giftCard.expiry_date
    })

    return NextResponse.json({
      success: true,
      email_preview: emailContent
    })

  } catch (error) {
    console.error('Error generating email preview:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate email preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
