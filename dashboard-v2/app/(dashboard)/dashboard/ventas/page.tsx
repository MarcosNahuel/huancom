import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'

async function getPedidos() {
  const supabase = await createClient()

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('fecha_venta', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching pedidos:', error)
    return []
  }

  return pedidos || []
}

async function getVentasStats() {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('pedidos')
    .select('total, unidades')
    .gte('fecha_venta', startOfMonth.toISOString())

  const totalVentas = data?.reduce((acc, p) => acc + (p.total || 0), 0) || 0
  const totalUnidades = data?.reduce((acc, p) => acc + (p.unidades || 0), 0) || 0
  const totalPedidos = data?.length || 0
  const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0

  return { totalVentas, totalUnidades, totalPedidos, ticketPromedio }
}

export default async function VentasPage() {
  const [pedidos, stats] = await Promise.all([getPedidos(), getVentasStats()])

  return (
    <div className="flex flex-col">
      <Header
        title="Ventas"
        description="Gestión de pedidos y análisis de ventas"
        actions={<DateRangePicker />}
        exportTipo="pedidos"
        sourceUrl="https://docs.google.com/spreadsheets/d/1lL0qYGaM9Ao1CENKaSLHWkDT_0OlqwDR9684oShOzBs"
        sourceName="Pedidos MeLi"
      />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Total Ventas (Mes)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalVentas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Pedidos (Mes)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNumber(stats.totalPedidos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Unidades Vendidas</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNumber(stats.totalUnidades)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Ticket Promedio</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.ticketPromedio)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700 text-left">
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Fecha</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Orden</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Producto</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Comprador</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Uds</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Total</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.length > 0 ? (
                    pedidos.map((pedido) => (
                      <tr key={pedido.id} className="border-b border-gray-100 dark:border-zinc-800">
                        <td className="py-3 text-slate-900 dark:text-slate-100">{formatDate(pedido.fecha_venta)}</td>
                        <td className="py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{pedido.order_id?.slice(-10)}</td>
                        <td className="py-3 max-w-[200px] truncate text-slate-900 dark:text-slate-100">
                          {pedido.titulo_publicacion || pedido.sku || '-'}
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">{pedido.comprador_nombre || '-'}</td>
                        <td className="py-3 text-center text-slate-900 dark:text-slate-100">{pedido.unidades}</td>
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{formatCurrency(pedido.total)}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            pedido.estado === 'Entregado' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                            pedido.estado === 'En camino' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                            'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-slate-300'
                          }`}>
                            {pedido.estado || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-slate-400">
                        No hay pedidos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
