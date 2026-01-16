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
              <p className="text-sm text-gray-500">Total Ventas (Mes)</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalVentas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Pedidos (Mes)</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalPedidos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Unidades Vendidas</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalUnidades)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Ticket Promedio</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.ticketPromedio)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-medium text-gray-500">Fecha</th>
                    <th className="pb-3 font-medium text-gray-500">Orden</th>
                    <th className="pb-3 font-medium text-gray-500">Producto</th>
                    <th className="pb-3 font-medium text-gray-500">Comprador</th>
                    <th className="pb-3 font-medium text-gray-500">Uds</th>
                    <th className="pb-3 font-medium text-gray-500">Total</th>
                    <th className="pb-3 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.length > 0 ? (
                    pedidos.map((pedido) => (
                      <tr key={pedido.id} className="border-b border-gray-100">
                        <td className="py-3">{formatDate(pedido.fecha_venta)}</td>
                        <td className="py-3 font-mono text-xs">{pedido.order_id?.slice(-10)}</td>
                        <td className="py-3 max-w-[200px] truncate">
                          {pedido.titulo_publicacion || pedido.sku || '-'}
                        </td>
                        <td className="py-3">{pedido.comprador_nombre || '-'}</td>
                        <td className="py-3 text-center">{pedido.unidades}</td>
                        <td className="py-3 font-medium">{formatCurrency(pedido.total)}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            pedido.estado === 'Entregado' ? 'bg-green-100 text-green-700' :
                            pedido.estado === 'En camino' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {pedido.estado || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
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
