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
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Preguntas</p>
                  <p className="text-2xl font-bold">{formatNumber(data.totalPreguntas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Compraron</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(data.compraron)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-brand-600">{formatPercent(data.tasaConversion)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tiempo Promedio</p>
                  <p className="text-2xl font-bold">{Math.round(data.tiempoPromedio)} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversión mensual */}
        {data.conversionMensual.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Conversión Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-3 font-medium text-gray-500">Mes</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Preguntas</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Compraron</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Tasa</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Tiempo Resp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversionMensual.map((row: any) => (
                      <tr key={row.mes} className="border-b border-gray-100">
                        <td className="py-3">{row.mes}</td>
                        <td className="py-3 text-right">{formatNumber(row.total_preguntas)}</td>
                        <td className="py-3 text-right text-green-600">{formatNumber(row.compraron)}</td>
                        <td className="py-3 text-right font-medium">{formatPercent(row.tasa_conversion)}</td>
                        <td className="py-3 text-right">{row.tiempo_respuesta_promedio || '-'} min</td>
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
            <CardTitle>Últimas Preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.preguntas.length > 0 ? (
                data.preguntas.slice(0, 10).map((pregunta) => (
                  <div
                    key={pregunta.id}
                    className={`rounded-lg border p-4 ${
                      pregunta.efectuo_compra
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">
                          {formatDateTime(pregunta.fecha_pregunta)} - {pregunta.id_usuario || 'Anónimo'}
                        </p>
                        <p className="mt-1 font-medium">{pregunta.pregunta}</p>
                        {pregunta.respuesta && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                            {pregunta.respuesta}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {pregunta.efectuo_compra ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            <CheckCircle className="h-3 w-3" /> Compró
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            <XCircle className="h-3 w-3" /> No compró
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay preguntas registradas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
