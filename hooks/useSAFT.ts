'use client'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface CompanyInfo {
  name: string
  cvr: string
  address: string
  city: string
  postalCode: string
  country: string
}

export interface SAFTExportParams {
  companyInfo: CompanyInfo
  startDate: string
  endDate: string
}

// SAF-T XML structure based on Danish requirements
const generateSAFTXML = (data: {
  companyInfo: CompanyInfo
  orders: any[]
  orderItems: any[]
  products: any[]
  categories: any[]
  startDate: string
  endDate: string
}) => {
  const currentDate = new Date().toISOString()
  const { companyInfo, orders, orderItems, products, categories, startDate, endDate } = data

  // Calculate totals
  const totalRevenue = orderItems.reduce((sum: number, item: any) => 
    sum + ((item.unit_price || 0) * (item.qty || 0)), 0
  )
  const vatAmount = totalRevenue * 0.25 // 25% Danish VAT
  const netAmount = totalRevenue - vatAmount

  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:DK_1.00">
  <Header>
    <AuditFileVersion>1.00</AuditFileVersion>
    <AuditFileCountry>DK</AuditFileCountry>
    <AuditFileDateCreated>${currentDate.split('T')[0]}</AuditFileDateCreated>
    <SoftwareCompanyName>POS Web MVP</SoftwareCompanyName>
    <SoftwareID>POS-WEB-1.0</SoftwareID>
    <SoftwareVersion>1.0</SoftwareVersion>
  </Header>
  
  <Company>
    <RegistrationNumber>${companyInfo.cvr}</RegistrationNumber>
    <Name>${escapeXml(companyInfo.name)}</Name>
    <Address>
      <StreetName>${escapeXml(companyInfo.address)}</StreetName>
      <City>${escapeXml(companyInfo.city)}</City>
      <PostalCode>${companyInfo.postalCode}</PostalCode>
      <Country>${companyInfo.country}</Country>
    </Address>
  </Company>
  
  <SelectionCriteria>
    <SelectionStartDate>${startDate}</SelectionStartDate>
    <SelectionEndDate>${endDate}</SelectionEndDate>
  </SelectionCriteria>
  
  <TaxonomyReference>
    <TaxonomyName>Danish Standard Chart of Accounts</TaxonomyName>
    <TaxonomyVersion>2024</TaxonomyVersion>
  </TaxonomyReference>
  
  <!-- General Ledger Accounts -->
  <GeneralLedgerAccounts>
    <Account>
      <AccountID>1000</AccountID>
      <AccountDescription>Omsætning</AccountDescription>
      <StandardAccountID>1000</StandardAccountID>
      <AccountType>Revenue</AccountType>
    </Account>
    <Account>
      <AccountID>2510</AccountID>
      <AccountDescription>Moms af salg</AccountDescription>
      <StandardAccountID>2510</StandardAccountID>
      <AccountType>VAT</AccountType>
    </Account>
    <Account>
      <AccountID>1910</AccountID>
      <AccountDescription>Debitorer</AccountDescription>
      <StandardAccountID>1910</StandardAccountID>
      <AccountType>Receivables</AccountType>
    </Account>
  </GeneralLedgerAccounts>
  
  <!-- Customers (simplified) -->
  <Customers>
    <Customer>
      <CustomerID>WALK_IN</CustomerID>
      <AccountID>1910</AccountID>
      <CustomerTaxID></CustomerTaxID>
      <CompanyName>Walk-in kunde</CompanyName>
      <Contact>
        <ContactPerson>
          <FirstName>Walk-in</FirstName>
          <LastName>Kunde</LastName>
        </ContactPerson>
      </Contact>
    </Customer>
  </Customers>
  
  <!-- Products -->
  <Products>
    ${products.map((product: any) => `
    <Product>
      <ProductCode>${product.id}</ProductCode>
      <ProductDescription>${escapeXml(product.name || 'Unknown Product')}</ProductDescription>
      <ProductNumberCode>${product.id}</ProductNumberCode>
    </Product>`).join('')}
  </Products>
  
  <!-- VAT Codes -->
  <TaxTable>
    <TaxTableEntry>
      <TaxType>VAT</TaxType>
      <Description>Standard VAT 25%</Description>
      <TaxCodeDetails>
        <TaxCode>S25</TaxCode>
        <Description>Standard VAT 25%</Description>
        <TaxPercentage>25.00</TaxPercentage>
        <Country>DK</Country>
        <TaxAmount>${vatAmount.toFixed(2)}</TaxAmount>
      </TaxCodeDetails>
    </TaxTableEntry>
  </TaxTable>
  
  <!-- General Ledger Entries -->
  <GeneralLedgerEntries>
    <NumberOfEntries>${orders.length * 3}</NumberOfEntries>
    <TotalDebit>${totalRevenue.toFixed(2)}</TotalDebit>
    <TotalCredit>${totalRevenue.toFixed(2)}</TotalCredit>
    
    ${orders.map((order: any, index: number) => {
      const orderTotal = orderItems
        .filter((item: any) => item.order_id === order.id)
        .reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.qty || 0)), 0)
      const orderVat = orderTotal * 0.25
      const orderNet = orderTotal - orderVat
      
      return `
    <!-- Order ${order.id} entries -->
    <Journal>
      <JournalID>SALES-${index + 1}</JournalID>
      <Description>Sales Journal</Description>
      <Transaction>
        <TransactionID>TXN-${order.id}</TransactionID>
        <Period>${new Date(order.created_at).getFullYear()}</Period>
        <PeriodYear>${new Date(order.created_at).getFullYear()}</PeriodYear>
        <TransactionDate>${order.created_at.split('T')[0]}</TransactionDate>
        <SourceID>POS</SourceID>
        <Description>POS Sale - Order ${order.id}</Description>
        <SystemEntryDate>${order.created_at.split('T')[0]}</SystemEntryDate>
        <TransactionLines>
          <!-- Debit: Receivables -->
          <Line>
            <RecordID>1</RecordID>
            <AccountID>1910</AccountID>
            <CustomerID>WALK_IN</CustomerID>
            <Description>Sale - Order ${order.id}</Description>
            <DebitAmount>
              <Amount>${orderTotal.toFixed(2)}</Amount>
            </DebitAmount>
          </Line>
          <!-- Credit: Revenue -->
          <Line>
            <RecordID>2</RecordID>
            <AccountID>1000</AccountID>
            <Description>Revenue - Order ${order.id}</Description>
            <CreditAmount>
              <Amount>${orderNet.toFixed(2)}</Amount>
            </CreditAmount>
          </Line>
          <!-- Credit: VAT -->
          <Line>
            <RecordID>3</RecordID>
            <AccountID>2510</AccountID>
            <Description>VAT 25% - Order ${order.id}</Description>
            <CreditAmount>
              <Amount>${orderVat.toFixed(2)}</Amount>
            </CreditAmount>
            <TaxInformation>
              <TaxType>VAT</TaxType>
              <TaxCode>S25</TaxCode>
              <TaxPercentage>25.00</TaxPercentage>
              <TaxAmount>${orderVat.toFixed(2)}</TaxAmount>
            </TaxInformation>
          </Line>
        </TransactionLines>
      </Transaction>
    </Journal>`
    }).join('')}
  </GeneralLedgerEntries>
  
  <!-- Source Documents (Orders) -->
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${orders.length}</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>${totalRevenue.toFixed(2)}</TotalCredit>
      
      ${orders.map((order: any) => {
        const orderItems_filtered = orderItems.filter((item: any) => item.order_id === order.id)
        const orderTotal = orderItems_filtered.reduce((sum: number, item: any) => 
          sum + ((item.unit_price || 0) * (item.qty || 0)), 0
        )
        
        return `
      <Invoice>
        <InvoiceNo>${order.id}</InvoiceNo>
        <CustomerInfo>
          <CustomerID>WALK_IN</CustomerID>
          <CompanyName>Walk-in kunde</CompanyName>
        </CustomerInfo>
        <Period>${new Date(order.created_at).getFullYear()}</Period>
        <PeriodYear>${new Date(order.created_at).getFullYear()}</PeriodYear>
        <InvoiceDate>${order.created_at.split('T')[0]}</InvoiceDate>
        <InvoiceType>FT</InvoiceType>
        <SelfBillingIndicator>0</SelfBillingIndicator>
        <SystemEntryDate>${order.created_at.split('T')[0]}</SystemEntryDate>
        <TransactionID>TXN-${order.id}</TransactionID>
        
        <Lines>
          ${orderItems_filtered.map((item: any, lineIndex: number) => `
          <Line>
            <LineNumber>${lineIndex + 1}</LineNumber>
            <ProductCode>${item.product_id}</ProductCode>
            <ProductDescription>${escapeXml(item.name_snapshot || 'Unknown Product')}</ProductDescription>
            <Quantity>${item.qty}</Quantity>
            <UnitOfMeasure>STK</UnitOfMeasure>
            <UnitPrice>${(item.unit_price || 0).toFixed(2)}</UnitPrice>
            <TaxPointDate>${order.created_at.split('T')[0]}</TaxPointDate>
            <Description>${escapeXml(item.name_snapshot || 'Product sale')}</Description>
            <CreditAmount>
              <Amount>${((item.unit_price || 0) * item.qty).toFixed(2)}</Amount>
            </CreditAmount>
            <Tax>
              <TaxType>VAT</TaxType>
              <TaxCode>S25</TaxCode>
              <TaxPercentage>25.00</TaxPercentage>
              <TaxAmount>${(((item.unit_price || 0) * item.qty) * 0.25).toFixed(2)}</TaxAmount>
            </Tax>
          </Line>`).join('')}
        </Lines>
        
        <DocumentTotals>
          <TaxInclusive>${orderTotal.toFixed(2)}</TaxInclusive>
          <NetTotal>${(orderTotal * 0.8).toFixed(2)}</NetTotal>
          <GrossTotal>${orderTotal.toFixed(2)}</GrossTotal>
        </DocumentTotals>
      </Invoice>`
      }).join('')}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`
}

// Helper function to escape XML special characters
const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function useSAFTExport() {
  return useMutation({
    mutationFn: async (params: SAFTExportParams): Promise<Blob> => {
      console.log('Generating SAF-T report for:', params)
      
      // Fetch data from Supabase
      const [ordersResult, orderItemsResult, productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .gte('created_at', params.startDate + 'T00:00:00Z')
          .lte('created_at', params.endDate + 'T23:59:59Z')
          .eq('status', 'paid'),
          
        supabase
          .from('order_items')
          .select('*')
          .gte('created_at', params.startDate + 'T00:00:00Z')
          .lte('created_at', params.endDate + 'T23:59:59Z'),
          
        supabase.from('products').select('*'),
        supabase.from('categories').select('*')
      ])
      
      if (ordersResult.error) throw new Error('Failed to fetch orders: ' + ordersResult.error.message)
      if (orderItemsResult.error) throw new Error('Failed to fetch order items: ' + orderItemsResult.error.message)
      if (productsResult.error) throw new Error('Failed to fetch products: ' + productsResult.error.message)
      if (categoriesResult.error) throw new Error('Failed to fetch categories: ' + categoriesResult.error.message)
      
      const orders = ordersResult.data || []
      const orderItems = orderItemsResult.data || []
      const products = productsResult.data || []
      const categories = categoriesResult.data || []
      
      console.log('SAF-T data:', { orders: orders.length, orderItems: orderItems.length, products: products.length })
      
      // Generate XML
      const xmlContent = generateSAFTXML({
        companyInfo: params.companyInfo,
        orders,
        orderItems,
        products,
        categories,
        startDate: params.startDate,
        endDate: params.endDate
      })
      
      // Create blob
      return new Blob([xmlContent], { type: 'application/xml' })
    }
  })
}
