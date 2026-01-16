import { NextRequest, NextResponse } from 'next/server'
import { syncProductos } from '@/lib/sync/productos'
import { syncPedidos } from '@/lib/sync/pedidos'
import { syncPreguntas } from '@/lib/sync/preguntas'
import { syncAsientos, syncCostosFijos } from '@/lib/sync/cashflow'

export const maxDuration = 300 // 5 minutes for Vercel Pro

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}
  const startTime = Date.now()

  try {
    // Sync productos
    console.log('Syncing productos...')
    results.productos = await syncProductos()

    // Sync pedidos
    console.log('Syncing pedidos...')
    results.pedidos = await syncPedidos()

    // Sync preguntas
    console.log('Syncing preguntas...')
    results.preguntas = await syncPreguntas()

    // Sync asientos
    console.log('Syncing asientos...')
    results.asientos = await syncAsientos()

    // Sync costos fijos
    console.log('Syncing costos fijos...')
    results.costosFijos = await syncCostosFijos()

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        results,
      },
      { status: 500 }
    )
  }
}

// Allow manual trigger via POST
export async function POST(request: NextRequest) {
  return GET(request)
}
