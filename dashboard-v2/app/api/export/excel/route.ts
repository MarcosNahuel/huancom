import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tipo = searchParams.get('tipo') || 'ventas'
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const supabase = createServiceClient()
  let data: any[] = []
  let filename = ''

  try {
    switch (tipo) {
      case 'ventas':
      case 'pedidos': {
        let query = supabase.from('pedidos').select('*')
        if (desde) query = query.gte('fecha_venta', desde)
        if (hasta) query = query.lte('fecha_venta', hasta)
        const { data: pedidos } = await query.order('fecha_venta', { ascending: false })
        data = pedidos || []
        filename = 'pedidos'
        break
      }

      case 'productos':
      case 'inventario': {
        const { data: productos } = await supabase
          .from('productos')
          .select('*')
          .order('nombre')
        data = productos || []
        filename = 'productos'
        break
      }

      case 'preguntas': {
        let query = supabase.from('preguntas').select('*')
        if (desde) query = query.gte('fecha_pregunta', desde)
        if (hasta) query = query.lte('fecha_pregunta', hasta)
        const { data: preguntas } = await query.order('fecha_pregunta', { ascending: false })
        data = preguntas || []
        filename = 'preguntas'
        break
      }

      case 'asientos': {
        let query = supabase.from('asientos').select('*')
        if (desde) query = query.gte('fecha_compra', desde)
        if (hasta) query = query.lte('fecha_compra', hasta)
        const { data: asientos } = await query.order('fecha_compra', { ascending: false })
        data = asientos || []
        filename = 'asientos_contables'
        break
      }

      case 'costos-fijos': {
        const { data: costos } = await supabase
          .from('costos_fijos')
          .select('*')
          .order('costo_mensual_ars', { ascending: false })
        data = costos || []
        filename = 'costos_fijos'
        break
      }

      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 404 })
    }

    // Crear workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // Auto-ajustar columnas
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.slice(0, 100).map(row => String(row[key] || '').length)
      )
    }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, filename)

    // Generar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const today = new Date().toISOString().split('T')[0]

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}_${today}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al exportar' },
      { status: 500 }
    )
  }
}
