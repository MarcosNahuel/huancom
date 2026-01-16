import { createServiceClient } from '@/lib/supabase/server'
import { getAllSheetData } from '@/lib/google-sheets/client'

const SHEET_ID = process.env.SHEET_PRODUCTOS_ID!

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[$.,]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseArray(value: string | undefined): string[] | null {
  if (!value) return null
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export async function syncProductos() {
  const supabase = createServiceClient()
  const rows = await getAllSheetData(SHEET_ID, 'PRODUCTOS')

  if (rows.length < 2) return { synced: 0, errors: [] }

  const headers = rows[0]
  const dataRows = rows.slice(1)

  const errors: string[] = []
  let synced = 0

  for (const row of dataRows) {
    try {
      const sku = row[headers.indexOf('SKU')]
      if (!sku) continue

      const producto = {
        sku,
        nombre: row[headers.indexOf('Nombre')] || '',
        descripcion_corta: row[headers.indexOf('Descripción corta')] || null,
        precio_venta: parseNumber(row[headers.indexOf('Precio rebajado')]) || parseNumber(row[headers.indexOf('Precio normal')]),
        precio_normal: parseNumber(row[headers.indexOf('Precio normal')]),
        stock: parseInt(row[headers.indexOf('Inventario')] || '0') || 0,
        valor_inventario: parseNumber(row[headers.indexOf('VALOR DE INVENTARIO')]),
        peso_kg: parseNumber(row[headers.indexOf('Peso (kg)')]),
        longitud_cm: parseNumber(row[headers.indexOf('Longitud (cm)')]),
        anchura_cm: parseNumber(row[headers.indexOf('Anchura (cm)')]),
        altura_cm: parseNumber(row[headers.indexOf('Altura (cm)')]),
        categorias: parseArray(row[headers.indexOf('Categorías')]),
        etiquetas: parseArray(row[headers.indexOf('Etiquetas')]),
        link_huangcom: row[headers.indexOf('LINK')] || null,
        imagenes: parseArray(row[headers.indexOf('Imágenes')]),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('productos')
        .upsert(producto, { onConflict: 'sku' })

      if (error) {
        errors.push(`SKU ${sku}: ${error.message}`)
      } else {
        synced++
      }
    } catch (e) {
      errors.push(`Row error: ${e}`)
    }
  }

  return { synced, errors }
}
