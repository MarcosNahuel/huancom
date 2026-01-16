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
          icon="users"
        />
        <KPICard
          title="Total Compras"
          value={formatCurrency(data.totalCompras)}
          icon="dollar"
        />
        <KPICard
          title="Promedio por Compra"
          value={formatCurrency(data.promedioCompra)}
          icon="trending"
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
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">Proveedor</th>
                  <th className="text-left py-3 px-4 font-medium">CUIT</th>
                  <th className="text-right py-3 px-4 font-medium">Total Compras</th>
                  <th className="text-right py-3 px-4 font-medium">Operaciones</th>
                  <th className="text-right py-3 px-4 font-medium">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {data.proveedores.slice(0, 50).map((proveedor, index) => (
                  <tr key={proveedor.nombre} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{proveedor.nombre}</td>
                    <td className="py-3 px-4 text-muted-foreground">{proveedor.cuit || '-'}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(proveedor.totalCompras)}</td>
                    <td className="py-3 px-4 text-right">{formatNumber(proveedor.cantidadOperaciones)}</td>
                    <td className="py-3 px-4 text-right">
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
