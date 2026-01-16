import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { KPICard } from '@/components/dashboard/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'

async function getProveedoresData() {
  const supabase = await createClient()

  // Obtener proveedores únicos de asientos
  const { data: proveedores } = await supabase
    .from('asientos')
    .select('proveedor, cuit_proveedor, importe_total, tipo_movimiento')
    .not('proveedor', 'is', null)

  // Agrupar por proveedor
  const proveedoresMap = new Map<string, {
    nombre: string
    cuit: string | null
    totalCompras: number
    cantidadOperaciones: number
  }>()

  proveedores?.forEach(p => {
    const key = p.proveedor || 'Sin nombre'
    const existing = proveedoresMap.get(key) || {
      nombre: key,
      cuit: p.cuit_proveedor,
      totalCompras: 0,
      cantidadOperaciones: 0
    }

    if (p.tipo_movimiento === 'EGRESO') {
      existing.totalCompras += p.importe_total || 0
    }
    existing.cantidadOperaciones++

    proveedoresMap.set(key, existing)
  })

  const proveedoresList = Array.from(proveedoresMap.values())
    .sort((a, b) => b.totalCompras - a.totalCompras)

  return {
    proveedores: proveedoresList,
    totalProveedores: proveedoresList.length,
    totalCompras: proveedoresList.reduce((sum, p) => sum + p.totalCompras, 0),
    promedioCompra: proveedoresList.length > 0
      ? proveedoresList.reduce((sum, p) => sum + p.totalCompras, 0) / proveedoresList.reduce((sum, p) => sum + p.cantidadOperaciones, 0)
      : 0
  }
}

export default async function ProveedoresPage() {
  const data = await getProveedoresData()

  return (
    <div className="space-y-6">
      <Header
        title="Proveedores"
        description="Análisis de proveedores y compras"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Total Proveedores"
          value={formatNumber(data.totalProveedores)}
          iconName="Package"
        />
        <KPICard
          title="Total Compras"
          value={formatCurrency(data.totalCompras)}
          iconName="DollarSign"
        />
        <KPICard
          title="Promedio por Compra"
          value={formatCurrency(data.promedioCompra)}
          iconName="TrendingUp"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">#</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Proveedor</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-300">CUIT</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Total Compras</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Operaciones</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-300">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {data.proveedores.slice(0, 50).map((proveedor, index) => (
                  <tr key={proveedor.nombre} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{proveedor.nombre}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{proveedor.cuit || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-emerald-400 font-medium">{formatCurrency(proveedor.totalCompras)}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{formatNumber(proveedor.cantidadOperaciones)}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-amber-400">
                      {formatCurrency(proveedor.totalCompras / proveedor.cantidadOperaciones)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.proveedores.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No hay datos de proveedores disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
