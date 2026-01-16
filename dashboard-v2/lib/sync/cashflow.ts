import { createServiceClient } from '@/lib/supabase/server'
import { getAllSheetData } from '@/lib/google-sheets/client'

const SHEET_ID = process.env.SHEET_CASHFLOW_ID!

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[$.,\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null
  try {
    const match = value.match(/(\d+)\/(\d+)\/(\d+)/)
    if (match) {
      const [, day, month, year] = match
      const fullYear = year.length === 2 ? `20${year}` : year
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return null
  } catch {
    return null
  }
}

export async function syncAsientos() {
  const supabase = createServiceClient()
  const rows = await getAllSheetData(SHEET_ID, 'ACIENTO')

  if (rows.length < 2) return { synced: 0, errors: [] }

  const headers = rows[0]
  const dataRows = rows.slice(1, 500) // Limit

  const errors: string[] = []
  let synced = 0

  for (const row of dataRows) {
    try {
      const fechaCompra = parseDate(row[headers.indexOf('Fecha de la Compra')])
      if (!fechaCompra) continue

      const asiento = {
        marca_temporal: row[headers.indexOf('Marca temporal')] ? new Date(row[headers.indexOf('Marca temporal')]).toISOString() : null,
        fecha_compra: fechaCompra,
        importe_total: parseNumber(row[headers.indexOf('Importe Total de la Compra [$AR]')]),
        fecha_factura: parseDate(row[headers.indexOf('Fecha de la Factura')]),
        tipo_comprobante: row[headers.indexOf('Tipo de Comprobante')] || null,
        numero_factura: row[headers.indexOf('N° de Factura o Comprobante')] || null,
        cuit_proveedor: row[headers.indexOf('DNI / CUIT Proveedor')] || null,
        proveedor: row[headers.indexOf('Proveedor')] || null,
        total_factura: parseNumber(row[headers.indexOf('Total de la Factura [$AR]')]),
        iva: parseNumber(row[headers.indexOf('IVA [$AR]')]),
        percepciones: parseNumber(row[headers.indexOf('Percepciones [$AR]')]),
        medio_pago: row[headers.indexOf('Medio de Pago')] || null,
        detalle: row[headers.indexOf('Detalle')] || null,
        tipo_gasto: row[headers.indexOf('Tipo de Gasto')] || null,
        tiene_factura: row[headers.indexOf('Esta la Factura?')]?.toUpperCase() === 'SI',
        centro_costo: row[headers.indexOf('Centro de Costo')] || null,
        tipo_movimiento: row[headers.indexOf('Es EGRESO o INGRESO?')] || 'EGRESO',
        anio: parseInt(row[headers.indexOf('AÑO')] || '0') || null,
        mes: parseInt(row[headers.indexOf('MES')] || '0') || null,
        dia: parseInt(row[headers.indexOf('DIA')] || '0') || null,
        anio_mes: row[headers.indexOf('AÑO/MES')] || null,
        trimestre: row[headers.indexOf('TRIMESTRE')] || null,
        cotizacion_usd: parseNumber(row[headers.indexOf('COTIZACION\nDOLAR\nBLUE\nU$S')]),
        cuenta: row[headers.indexOf('ES OFICIAL?\nCUENTA 1\nCUENTA 2')] || null,
        iva_a_pagar: parseNumber(row[headers.indexOf('IVA A PAGAR [$AR]')]),
      }

      const { error } = await supabase
        .from('asientos')
        .insert(asiento)

      if (error && !error.message.includes('duplicate')) {
        errors.push(`Asiento: ${error.message}`)
      } else {
        synced++
      }
    } catch (e) {
      errors.push(`Row error: ${e}`)
    }
  }

  return { synced, errors }
}

export async function syncCostosFijos() {
  const supabase = createServiceClient()
  const rows = await getAllSheetData(SHEET_ID, 'FIJO MENSUAL')

  if (rows.length < 5) return { synced: 0, errors: [] }

  // Headers start at row 4
  const headers = rows[3]
  const dataRows = rows.slice(4)

  const errors: string[] = []
  let synced = 0

  // Clear existing
  await supabase.from('costos_fijos').delete().neq('id', '')

  for (const row of dataRows) {
    try {
      const descripcion = row[headers.indexOf('DESCRIPCION\nIncluir descripcion exacta como aparece en los movimientos')]
      if (!descripcion) continue

      const costo = {
        estado: row[headers.indexOf('ESTADO')] || null,
        centro_costo: row[headers.indexOf('CENTRO DE COSTO')] || null,
        tipo: row[headers.indexOf('TIPO')] || null,
        descripcion,
        medio_pago: row[headers.indexOf('Se Paga con')] || null,
        debito_automatico: row[headers.indexOf('Debito\nAutomatico?')]?.toUpperCase() === 'SI',
        dia_debito: parseInt(row[headers.indexOf('Dia del Mes\nque se Debita')] || '0') || null,
        costo_mensual_usd: parseNumber(row[headers.indexOf('COSTO MENSUAL DE REFERENCIA U$S')]),
        costo_mensual_ars: parseNumber(row[headers.indexOf('COSTO MENSUAL $AR')]),
        observaciones: row[headers.indexOf('OBSERVACIONES')] || null,
      }

      const { error } = await supabase
        .from('costos_fijos')
        .insert(costo)

      if (error) {
        errors.push(`Costo: ${error.message}`)
      } else {
        synced++
      }
    } catch (e) {
      errors.push(`Row error: ${e}`)
    }
  }

  return { synced, errors }
}
