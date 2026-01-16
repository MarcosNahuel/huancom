import { createServiceClient } from '@/lib/supabase/server'
import { getAllSheetData } from '@/lib/google-sheets/client'

const SHEET_ID = process.env.SHEET_PEDIDOS_ID!

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[$.,]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null
  try {
    // Formato: "20 de agosto de 2024 09:16 hs."
    const match = value.match(/(\d+) de (\w+) de (\d+) (\d+):(\d+)/)
    if (match) {
      const months: Record<string, number> = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
      }
      const [, day, month, year, hour, min] = match
      const date = new Date(parseInt(year), months[month.toLowerCase()], parseInt(day), parseInt(hour), parseInt(min))
      return date.toISOString()
    }
    return new Date(value).toISOString()
  } catch {
    return null
  }
}

export async function syncPedidos() {
  const supabase = createServiceClient()

  // Sync DESDE MELI
  const meliRows = await getAllSheetData(SHEET_ID, 'DESDE MELI')
  const pedidosRows = await getAllSheetData(SHEET_ID, 'PEDIDOS')

  const errors: string[] = []
  let synced = 0

  // Process PEDIDOS sheet (consolidated)
  if (pedidosRows.length > 1) {
    const headers = pedidosRows[0]
    const dataRows = pedidosRows.slice(1)

    for (const row of dataRows) {
      try {
        const orderId = row[headers.indexOf('ID ORDER MERCADOLIBRE')]
        if (!orderId) continue

        const pedido = {
          order_id: orderId,
          origen: 'MELI',
          sku: row[headers.indexOf('SKU')] || null,
          fecha_venta: parseDate(row[headers.indexOf('Fecha de venta')]),
          unidades: parseInt(row[headers.indexOf('Unidades')] || '1') || 1,
          precio_unitario: parseNumber(row[headers.indexOf('Precio unitario de venta de la publicación (ARS)')]),
          ingresos_productos: parseNumber(row[headers.indexOf('Ingresos por productos (ARS)')]),
          total: parseNumber(row[headers.indexOf('Ingresos por productos (ARS)')]),
          comprador_nombre: row[headers.indexOf('Comprador')] || row[headers.indexOf('Datos personales o de empresa')] || null,
          comprador_documento: row[headers.indexOf('DNI')] || row[headers.indexOf('Tipo y número de documento')] || null,
          condicion_fiscal: row[headers.indexOf('Condición fiscal')] || null,
          direccion: row[headers.indexOf('Dirección')] || row[headers.indexOf('Domicilio')] || null,
          provincia: row[headers.indexOf('Estado')] || null,
          ciudad: row[headers.indexOf('Ciudad')] || null,
          codigo_postal: row[headers.indexOf('Código postal')] || null,
          forma_entrega: row[headers.indexOf('Forma de entrega')] || null,
          transportista: row[headers.indexOf('Transportista')] || null,
          tracking_number: row[headers.indexOf('Número de seguimiento')] || null,
          tracking_url: row[headers.indexOf('URL de seguimiento')] || null,
          titulo_publicacion: row[headers.indexOf('Título de la publicación')] || null,
          estado: row[headers.indexOf('ESTADO DE PEDIDO')] || null,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('pedidos')
          .upsert(pedido, { onConflict: 'order_id' })

        if (error) {
          errors.push(`Order ${orderId}: ${error.message}`)
        } else {
          synced++
        }
      } catch (e) {
        errors.push(`Row error: ${e}`)
      }
    }
  }

  return { synced, errors }
}
