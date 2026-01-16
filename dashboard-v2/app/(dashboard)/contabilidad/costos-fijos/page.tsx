import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { KPICard } from '@/components/dashboard/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'

async function getCostosFijosData() {
  const supabase = await createClient()

  const { data: costos } = await supabase
    .from('costos_fijos')
    .select('*')
    .order('costo_mensual_ars', { ascending: false })

  const activos = costos?.filter(c => c.estado?.toUpperCase() === 'ACTIVO') || []
  const inactivos = costos?.filter(c => c.estado?.toUpperCase() !== 'ACTIVO') || []

  const totalMensualARS = activos.reduce((sum, c) => sum + (c.costo_mensual_ars || 0), 0)
  const totalMensualUSD = activos.reduce((sum, c) => sum + (c.costo_mensual_usd || 0), 0)

  type GroupData = { total: number; cantidad: number }

  // Agrupar por centro de costo
  const porCentroCosto: Record<string, GroupData> = {}
  for (const c of activos) {
    const centro = c.centro_costo || 'Sin clasificar'
    if (!porCentroCosto[centro]) {
      porCentroCosto[centro] = { total: 0, cantidad: 0 }
    }
    porCentroCosto[centro].total += c.costo_mensual_ars || 0
    porCentroCosto[centro].cantidad++
  }

  // Agrupar por tipo
  const porTipo: Record<string, GroupData> = {}
  for (const c of activos) {
    const tipo = c.tipo || 'Sin tipo'
    if (!porTipo[tipo]) {
      porTipo[tipo] = { total: 0, cantidad: 0 }
    }
    porTipo[tipo].total += c.costo_mensual_ars || 0
    porTipo[tipo].cantidad++
  }

  const centrosArray = Object.keys(porCentroCosto).map(nombre => ({
    nombre,
    total: porCentroCosto[nombre].total,
    cantidad: porCentroCosto[nombre].cantidad,
  })).sort((a, b) => b.total - a.total)

  const tiposArray = Object.keys(porTipo).map(nombre => ({
    nombre,
    total: porTipo[nombre].total,
    cantidad: porTipo[nombre].cantidad,
  })).sort((a, b) => b.total - a.total)

  return {
    costos: costos || [],
    activos,
    inactivos,
    totalMensualARS,
    totalMensualUSD,
    totalAnualARS: totalMensualARS * 12,
    porCentroCosto: centrosArray,
    porTipo: tiposArray,
  }
}

export default async function CostosFijosPage() {
  const data = await getCostosFijosData()

  return (
    <div className="space-y-6">
      <Header
        title="Costos Fijos"
        description="Gastos fijos mensuales y recurrentes"
        exportTipo="costos-fijos"
        sourceUrl="https://docs.google.com/spreadsheets/d/1Gypm7OJkbimlJpKPgAO9Z3fULSN8NcgfxO5kwuyp34Q"
        sourceName="Cashflow HUANGCOM"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Total Mensual ARS"
          value={formatCurrency(data.totalMensualARS)}
          iconName="DollarSign"
        />
        <KPICard
          title="Total Mensual USD"
          value={`US$ ${formatNumber(data.totalMensualUSD)}`}
          iconName="DollarSign"
        />
        <KPICard
          title="Proyección Anual"
          value={formatCurrency(data.totalAnualARS)}
          iconName="TrendingUp"
        />
        <KPICard
          title="Costos Activos"
          value={formatNumber(data.activos.length)}
          description={`${data.inactivos.length} inactivos`}
          iconName="Package"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por Centro de Costo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.porCentroCosto.map(centro => (
                <div key={centro.nombre} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{centro.nombre}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{centro.cantidad} conceptos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-amber-400">{formatCurrency(centro.total)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {((centro.total / data.totalMensualARS) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              {data.porCentroCosto.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Tipo de Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.porTipo.map(tipo => (
                <div key={tipo.nombre} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{tipo.nombre}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{tipo.cantidad} conceptos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-amber-400">{formatCurrency(tipo.total)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {((tipo.total / data.totalMensualARS) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              {data.porTipo.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Costos Fijos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Descripción</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Centro Costo</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Medio Pago</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Mensual ARS</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Mensual USD</th>
                </tr>
              </thead>
              <tbody>
                {data.costos.map((costo, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                        costo.estado?.toUpperCase() === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                      }`}>
                        {costo.estado || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate text-slate-900 dark:text-slate-100">
                      {costo.descripcion}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{costo.centro_costo || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{costo.tipo || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{costo.medio_pago || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-amber-400 font-medium">
                      {costo.costo_mensual_ars ? formatCurrency(costo.costo_mensual_ars) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-sky-400">
                      {costo.costo_mensual_usd ? `US$ ${formatNumber(costo.costo_mensual_usd)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.costos.length === 0 && (
              <p className="text-center py-8 text-slate-500 dark:text-slate-400">
                No hay costos fijos registrados
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
