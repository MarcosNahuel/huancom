import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react'

async function getContabilidadData() {
  const supabase = await createClient()

  // Obtener ventas agrupadas por mes (desde pedidos)
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('fecha_venta, total')
    .not('fecha_venta', 'is', null)
    .order('fecha_venta', { ascending: false })

  // Costos fijos activos
  const { data: costosFijos } = await supabase
    .from('costos_fijos')
    .select('*')
    .eq('estado', 'ACTIVO')

  const totalCostosFijos = costosFijos?.reduce((acc, c) => acc + (c.costo_mensual_ars || 0), 0) || 0

  // Agrupar pedidos por mes para calcular ingresos
  const ingresosPorMes: Record<string, number> = {}
  pedidos?.forEach((p) => {
    if (p.fecha_venta && p.total) {
      const fecha = new Date(p.fecha_venta)
      const anioMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      ingresosPorMes[anioMes] = (ingresosPorMes[anioMes] || 0) + Number(p.total)
    }
  })

  // Crear resultados mensuales combinando ingresos (pedidos) con egresos (costos fijos)
  const resultados = Object.entries(ingresosPorMes)
    .map(([anioMes, ingresos]) => ({
      anio_mes: anioMes,
      centro_costo: 'Ventas MeLi',
      ingresos,
      egresos: totalCostosFijos,
      resultado: ingresos - totalCostosFijos,
    }))
    .sort((a, b) => b.anio_mes.localeCompare(a.anio_mes))
    .slice(0, 12)

  // Último mes (más reciente)
  const ultimoMes = resultados[0] || { ingresos: 0, egresos: totalCostosFijos, resultado: -totalCostosFijos }

  return {
    resultados,
    costosFijos: costosFijos || [],
    totalCostosFijos,
    ultimoMes,
  }
}

export default async function ContabilidadPage() {
  const data = await getContabilidadData()

  return (
    <div className="flex flex-col">
      <Header
        title="Contabilidad"
        description="Resumen financiero y cashflow"
        actions={<DateRangePicker />}
        exportTipo="asientos"
        sourceUrl="https://docs.google.com/spreadsheets/d/1Gypm7OJkbimlJpKPgAO9Z3fULSN8NcgfxO5kwuyp34Q"
        sourceName="Cashflow HUANGCOM"
      />

      <div className="p-6">
        {/* KPIs */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-500/20 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Ingresos (Último Mes)</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(data.ultimoMes.ingresos)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 dark:bg-red-500/20 p-2">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Egresos (Último Mes)</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(data.ultimoMes.egresos)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${data.ultimoMes.resultado >= 0 ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                  <DollarSign className={`h-5 w-5 ${data.ultimoMes.resultado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Resultado (Último Mes)</p>
                  <p className={`text-xl font-bold ${data.ultimoMes.resultado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.ultimoMes.resultado)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-500/20 p-2">
                  <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Costos Fijos</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(data.totalCostosFijos)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resultado Mensual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Resultado por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700 text-left">
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Período</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Ingresos</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Egresos</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.resultados.length > 0 ? (
                      data.resultados.map((row: any) => (
                        <tr key={`${row.anio_mes}-${row.centro_costo}`} className="border-b border-gray-100 dark:border-zinc-800">
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{row.anio_mes}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{row.centro_costo}</p>
                            </div>
                          </td>
                          <td className="py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(row.ingresos)}</td>
                          <td className="py-3 text-right text-red-600 dark:text-red-400">{formatCurrency(row.egresos)}</td>
                          <td className={`py-3 text-right font-bold ${row.resultado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(row.resultado)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-slate-400">
                          No hay datos contables
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Costos Fijos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Costos Fijos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.costosFijos.length > 0 ? (
                  data.costosFijos.map((costo: any) => (
                    <div
                      key={costo.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-zinc-800 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{costo.descripcion}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {costo.tipo} • {costo.centro_costo}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-slate-100">
                        {formatCurrency(costo.costo_mensual_ars)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                    No hay costos fijos registrados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
