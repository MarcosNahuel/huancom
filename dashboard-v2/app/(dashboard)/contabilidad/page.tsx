import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react'

async function getContabilidadData() {
  const supabase = await createClient()

  // Resultado mensual
  const { data: resultados } = await supabase
    .from('v_resultado_mensual')
    .select('*')
    .order('anio_mes', { ascending: false })
    .limit(12)

  // Costos fijos activos
  const { data: costosFijos } = await supabase
    .from('costos_fijos')
    .select('*')
    .eq('estado', 'ACTIVO')

  const totalCostosFijos = costosFijos?.reduce((acc, c) => acc + (c.costo_mensual_ars || 0), 0) || 0

  // Último mes
  const ultimoMes = resultados?.[0] || { ingresos: 0, egresos: 0, resultado: 0 }

  return {
    resultados: resultados || [],
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
                <div className="rounded-full bg-green-100 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ingresos (Último Mes)</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(data.ultimoMes.ingresos)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Egresos (Último Mes)</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(data.ultimoMes.egresos)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${data.ultimoMes.resultado >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`h-5 w-5 ${data.ultimoMes.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Resultado (Último Mes)</p>
                  <p className={`text-xl font-bold ${data.ultimoMes.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.ultimoMes.resultado)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Costos Fijos</p>
                  <p className="text-xl font-bold">{formatCurrency(data.totalCostosFijos)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resultado Mensual */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-3 font-medium text-gray-500">Período</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Ingresos</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Egresos</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.resultados.length > 0 ? (
                      data.resultados.map((row: any) => (
                        <tr key={`${row.anio_mes}-${row.centro_costo}`} className="border-b border-gray-100">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{row.anio_mes}</p>
                              <p className="text-xs text-gray-500">{row.centro_costo}</p>
                            </div>
                          </td>
                          <td className="py-3 text-right text-green-600">{formatCurrency(row.ingresos)}</td>
                          <td className="py-3 text-right text-red-600">{formatCurrency(row.egresos)}</td>
                          <td className={`py-3 text-right font-bold ${row.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(row.resultado)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
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
              <CardTitle>Costos Fijos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.costosFijos.length > 0 ? (
                  data.costosFijos.map((costo: any) => (
                    <div
                      key={costo.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div>
                        <p className="font-medium">{costo.descripcion}</p>
                        <p className="text-xs text-gray-500">
                          {costo.tipo} • {costo.centro_costo}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(costo.costo_mensual_ars)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
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
