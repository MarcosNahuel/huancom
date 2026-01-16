import { createServiceClient } from '@/lib/supabase/server'
import { getAllSheetData } from '@/lib/google-sheets/client'

const SHEET_ID = process.env.SHEET_PREGUNTAS_ID!

function parseDate(value: string | undefined): string | null {
  if (!value) return null
  try {
    // Formato: "04/08/2025 23:14:38" o ISO
    if (value.includes('T')) {
      return new Date(value).toISOString()
    }
    const match = value.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):?(\d+)?/)
    if (match) {
      const [, day, month, year, hour, min, sec = '0'] = match
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec))
      return date.toISOString()
    }
    return new Date(value).toISOString()
  } catch {
    return null
  }
}

function parseTimeToMinutes(value: string | undefined): number | null {
  if (!value) return null
  // Formato: "7 Min" o "1:26:24"
  const minMatch = value.match(/(\d+)\s*Min/i)
  if (minMatch) return parseInt(minMatch[1])

  const timeMatch = value.match(/(\d+):(\d+):(\d+)/)
  if (timeMatch) {
    const [, h, m, s] = timeMatch
    return parseInt(h) * 60 + parseInt(m) + Math.round(parseInt(s) / 60)
  }
  return null
}

export async function syncPreguntas() {
  const supabase = createServiceClient()

  const errors: string[] = []
  let synced = 0

  // Sync "Respuestas Agente IA"
  const agenteRows = await getAllSheetData(SHEET_ID, 'Respuestas Agente IA')

  if (agenteRows.length > 1) {
    const headers = agenteRows[0]
    const dataRows = agenteRows.slice(1, 1000) // Limit to avoid timeout

    for (const row of dataRows) {
      try {
        const idPregunta = row[headers.indexOf('ID PREGUNTA')]
        const fechaPregunta = parseDate(row[headers.indexOf('FECHA DE PREGUNTA')])

        if (!fechaPregunta) continue

        const pregunta = {
          id_pregunta: idPregunta || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fecha_pregunta: fechaPregunta,
          estado: row[headers.indexOf('ESTADO')] || null,
          pregunta: row[headers.indexOf('PREGUNTA')] || null,
          respuesta: row[headers.indexOf('RESPUESTA REFORMULADA')] || null,
          respuesta_tecnica: row[headers.indexOf('RESPUESTA TECNICA')] || null,
          fuente_consultada: row[headers.indexOf('FUENTE CONSULTADA')] || null,
          titulo_publicacion: row[headers.indexOf('TITULO DE LA PUBLICACION')] || null,
          item_id: row[headers.indexOf('ITEM ID')]?.replace('#', '') || null,
          link_meli: row[headers.indexOf('LINK DE MERCADOLIBRE')] || null,
          sku: row[headers.indexOf(' ⁠SKU')]?.trim() || row[headers.indexOf('SKU')] || null,
          descripcion_producto: row[headers.indexOf('DESCRIPCION DEL PRODUCTO')] || null,
          link_huangcom: row[headers.indexOf('LINK DE HUANGCOM.COM')] || null,
          email: row[headers.indexOf('EMAIL')] || null,
          fecha_respuesta: parseDate(row[headers.indexOf('FECHA DE RESPUESTA')]),
          id_usuario: row[headers.indexOf('ID USUARIO')] || null,
          tiempo_respuesta_minutos: parseTimeToMinutes(row[headers.indexOf('TIEMPO DE RESPUESTA')]),
          efectuo_compra: row[headers.indexOf('EFECTUO COMPRA')]?.toLowerCase() === 'si',
          datos_compra: row[headers.indexOf('DATOS DE LA COMPRA')] || null,
          origen: 'AGENTE_IA',
        }

        const { error } = await supabase
          .from('preguntas')
          .upsert(pregunta, { onConflict: 'id_pregunta' })

        if (error) {
          errors.push(`Pregunta: ${error.message}`)
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
