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

  // Agrupar por centro de costo
  const porCentroCosto = activos.reduce((acc, c) => {
    const centro = c.centro_costo || 'Sin clasificar'
    if (!acc[centro]) {
      acc[centro] = { total: 0, cantidad: 0 }
    }
    acc[centro].total += c.costo_mensual_ars || 0
    acc[centro].cantidad++
    return acc
  }, {} as Record<string, { total: number; cantidad: number }>)

  // Agrupar por tipo
  const porTipo = activos.reduce((acc, c) => {
    const tipo = c.tipo || 'Sin tipo'
    if (!acc[tipo]) {
      acc[tipo] = { total: 0, cantidad: 0 }
    }
    acc[tipo].total += c.costo_mensual_ars || 0
    acc[tipo].cantidad++
    return acc
  }, {} as Record<string, { total: number; cantidad: number }>)

  return {
    costos: costos || [],
    activos,
    inactivos,
    totalMensualARS,
    totalMensualUSD,
    totalAnualARS: totalMensualARS * 12,
    porCentroCosto: Object.entries(porCentroCosto)
      .map(([nombre, data]) => ({ nombre, total: data.total, cantidad: data.cantidad }))
      .sort((a, b) => b.total - a.total),
    porTipo: Object.entries(porTipo)
      .map(([nombre, data]) => ({ nombre, total: data.total, cantidad: data.cantidad }))
      .sort((a, b) => b.total - a.total),
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
                <div key={centro.nombre} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{centro.nombre}</p>
                    <p className="text-sm text-muted-foreground">{centro.cantidad} conceptos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(centro.total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {((centro.total / data.totalMensualARS) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              {data.porCentroCosto.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Sin datos</p>
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
                <div key={tipo.nombre} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tipo.nombre}</p>
                    <p className="text-sm text-muted-foreground">{tipo.cantidad} conceptos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(tipo.total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {((tipo.total / data.totalMensualARS) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              {data.porTipo.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Sin datos</p>
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
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Descripción</th>
                  <th className="text-left py-3 px-4 font-medium">Centro Costo</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Medio Pago</th>
                  <th className="text-right py-3 px-4 font-medium">Mensual ARS</th>
                  <th className="text-right py-3 px-4 font-medium">Mensual USD</th>
                </tr>
              </thead>
              <tbody>
                {data.costos.map((costo, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        costo.estado?.toUpperCase() === 'ACTIVO'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {costo.estado || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                      {costo.descripcion}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{costo.centro_costo || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{costo.tipo || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{costo.medio_pago || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {costo.costo_mensual_ars ? formatCurrency(costo.costo_mensual_ars) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {costo.costo_mensual_usd ? `US$ ${formatNumber(costo.costo_mensual_usd)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.costos.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No hay costos fijos registrados
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
