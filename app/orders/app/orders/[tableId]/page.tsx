'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCategories, useProductsByCategory } from '@/hooks/useCatalog'
import { useCreateOrder, useFireCourse, useFireNextCourse, NewOrderItem } from '@/hooks/useOrders'

export default function OrderPage() {
  const { tableId } = useParams() as { tableId: string }
  const router = useRouter()
  const [selectedCat, setSelectedCat] = useState<string|undefined>()
  const [items, setItems] = useState<NewOrderItem[]>([])
  const { data: cats } = useCategories()
  const { data: prods } = useProductsByCategory(selectedCat)
  const createOrder = useCreateOrder()
  const fireCourse = useFireCourse()
  const fireNext = useFireNextCourse()

  useEffect(() => { if (!selectedCat && cats?.length) setSelectedCat(cats[0].id) }, [cats, selectedCat])
  const total = useMemo(() => items.reduce((s,i)=> s + (i.unit_price ?? 0) * i.qty, 0), [items])

  const addItem = (p: any) => {
    const price = p.is_open_price ? Number(prompt('Pris?') || '0') : p.price
    const course = Number(prompt('Kursus (1=forret,2=hovedret,3=dessert)?') || '1')
    setItems(prev => [...prev, { product_id: p.id, qty: 1, unit_price: price, course_no: course }])
  }
  const placeOrder = async () => {
    const id = await createOrder.mutateAsync({ type: 'dine_in', table_id: tableId, items })
    alert('Ordre oprettet: ' + id)
  }
  const handleFireNext = async () => {
    const orderId = prompt('Order ID at fire next course for:'); if (!orderId) return
    const next = await fireNext.mutateAsync(orderId); alert(next ? `Kørte ret ${next}` : 'Ingen ret at køre')
  }
  const handleFireX = async () => {
    const orderId = prompt('Order ID:'); const x = Number(prompt('Ret nr.:')); if (!orderId || !x) return
    await fireCourse.mutateAsync({ order_id: orderId, course_no: x }); alert('Kørte ret ' + x)
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, padding:16 }}>
      <div>
        <h2>Kategorier</h2>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {cats?.map(c => (
            <button key={c.id} onClick={()=>setSelectedCat(c.id)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ccc', background: selectedCat===c.id?'#eee':'#fff' }}>
              {c.name}
            </button>
          ))}
        </div>
        <h3 style={{ marginTop:12 }}>Produkter</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {prods?.map(p => (
            <button key={p.id} onClick={()=>addItem(p)} style={{ border:'1px solid #ddd', borderRadius:8, padding:10, minWidth:120 }}>
              <div>{p.name}</div>
              <small>{p.is_open_price ? 'Åben pris' : (p.price?.toFixed(2) + ' kr')}</small>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2>Kurv</h2>
        <ul>{items.map((i,idx)=> (<li key={idx} style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
          <span>#{i.course_no} x{i.qty}</span><span>{(i.unit_price ?? 0).toFixed(2)} kr</span></li>))}</ul>
        <div style={{ marginTop:8 }}>Total: <b>{total.toFixed(2)} kr</b></div>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button onClick={placeOrder}>Læg på bord</button>
          <button onClick={()=>router.push('/tables')}>Tilbage</button>
        </div>
      </div>
      <div>
        <h2>Coursing</h2>
        <p>MVP-test: angiv Order ID i prompt for at køre RPC’er.</p>
        <div style={{ display:'grid', gap:8 }}>
          <button onClick={handleFireNext}>Kør næste ret</button>
          <button onClick={handleFireX}>Kør ret X</button>
        </div>
      </div>
    </div>
  )
}
