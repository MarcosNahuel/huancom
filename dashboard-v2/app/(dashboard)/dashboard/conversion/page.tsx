import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { formatNumber, formatPercent, formatDateTime } from '@/lib/utils'
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react'

async function getConversionData() {
  const supabase = await createClient()

  // Métricas de conversión mensuales
  const { data: conversionMensual } = await supabase
    .from('v_conversion_preguntas')
    .select('*')
    .order('mes', { ascending: false })
    .limit(12)

  // Últimas preguntas
  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('*')
    .order('fecha_pregunta', { ascending: false })
    .limit(50)

  // Stats generales
  const totalPreguntas = preguntas?.length || 0
  const compraron = preguntas?.filter(p => p.efectuo_compra).length || 0
  const tasaConversion = totalPreguntas > 0 ? (compraron / totalPreguntas) * 100 : 0
  const tiempoPromedio = preguntas?.reduce((acc, p) => acc + (p.tiempo_respuesta_minutos || 0), 0) || 0

  return {
    conversionMensual: conversionMensual || [],
    preguntas: preguntas || [],
    totalPreguntas,
    compraron,
    tasaConversion,
    tiempoPromedio: totalPreguntas > 0 ? tiempoPromedio / totalPreguntas : 0,
  }
}

export default async function ConversionPage() {
  const data = await getConversionData()
  const sinDatos = data.totalPreguntas === 0

  return (
    <div className="flex flex-col">
      <Header
        title="Conversión"
        description="Análisis de preguntas y conversión a ventas"
        actions={<DateRangePicker />}
        exportTipo="preguntas"
        sourceUrl="https://docs.google.com/spreadsheets/d/1Y0_ql9HiX8-qaE5uU4-MyYibZ98ZmJPhanetOqrF7Xs"
        sourceName="Preguntas MeLi"
      />

      <div className="p-6">
        {sinDatos ? (
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-amber-100 dark:bg-amber-500/20 p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Sin datos de preguntas
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md">
                  La tabla de preguntas está vacía. Para ver métricas de conversión,
                  sincroniza las preguntas desde el Google Sheet de Preguntas MeLi.
                </p>
                <a
                  href="https://docs.google.com/spreadsheets/d/1Y0_ql9HiX8-qaE5uU4-MyYibZ98ZmJPhanetOqrF7Xs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
                >
                  Ver Google Sheet
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
        <>
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-500/20 p-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Total Preguntas</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNumber(data.totalPreguntas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-500/20 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Compraron</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(data.compraron)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-brand-600 dark:text-amber-400">{formatPercent(data.tasaConversion)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-500/20 p-2">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{Math.round(data.tiempoPromedio)} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversión mensual */}
        {data.conversionMensual.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Conversión Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700 text-left">
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Mes</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Preguntas</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Compraron</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Tasa</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Tiempo Resp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversionMensual.map((row: any) => (
                      <tr key={row.mes} className="border-b border-gray-100 dark:border-zinc-800">
                        <td className="py-3 text-slate-900 dark:text-slate-100">{row.mes}</td>
                        <td className="py-3 text-right text-slate-900 dark:text-slate-100">{formatNumber(row.total_preguntas)}</td>
                        <td className="py-3 text-right text-green-600 dark:text-green-400">{formatNumber(row.compraron)}</td>
                        <td className="py-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatPercent(row.tasa_conversion)}</td>
                        <td className="py-3 text-right text-slate-900 dark:text-slate-100">{row.tiempo_respuesta_promedio || '-'} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Últimas preguntas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Últimas Preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.preguntas.length > 0 ? (
                data.preguntas.slice(0, 10).map((pregunta) => (
                  <div
                    key={pregunta.id}
                    className={`rounded-lg border p-4 ${
                      pregunta.efectuo_compra
                        ? 'border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10'
                        : 'border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {formatDateTime(pregunta.fecha_pregunta)} - {pregunta.id_usuario || 'Anónimo'}
                        </p>
                        <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{pregunta.pregunta}</p>
                        {pregunta.respuesta && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-zinc-700 p-2 rounded">
                            {pregunta.respuesta}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {pregunta.efectuo_compra ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" /> Compró
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-300">
                            <XCircle className="h-3 w-3" /> No compró
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                  No hay preguntas registradas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  )
}
