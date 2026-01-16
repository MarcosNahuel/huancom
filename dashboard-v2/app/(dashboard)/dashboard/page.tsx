import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { KPICard } from '@/components/dashboard/kpi-card'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { TrendingUp, AlertTriangle, Flame, Sparkles } from 'lucide-react'

async function getMetrics() {
  const supabase = await createClient()

  // Obtener métricas de productos
  const { data: productos } = await supabase
    .from('productos')
    .select('stock, valor_inventario, precio_venta')

  // Obtener pedidos del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: pedidosMes, count: countPedidos } = await supabase
    .from('pedidos')
    .select('total, unidades', { count: 'exact' })
    .gte('fecha_venta', startOfMonth.toISOString())

  // Obtener costos fijos activos para calcular egresos mensuales
  const { data: costosFijos } = await supabase
    .from('costos_fijos')
    .select('costo_mensual_ars')
    .eq('estado', 'ACTIVO')

  // Alertas de stock bajo
  const { data: alertasStock } = await supabase
    .from('v_alertas_stock')
    .select('*')
    .limit(5)

  // Top productos
  const { data: topProductos } = await supabase
    .from('v_top_productos')
    .select('*')
    .limit(10)

  // Calcular totales
  const valorInventario = productos?.reduce((acc, p) => acc + (p.valor_inventario || 0), 0) || 0
  const totalStock = productos?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0
  const ventasMes = pedidosMes?.reduce((acc, p) => acc + (p.total || 0), 0) || 0
  const unidadesMes = pedidosMes?.reduce((acc, p) => acc + (p.unidades || 0), 0) || 0
  const egresosMes = costosFijos?.reduce((acc, c) => acc + (c.costo_mensual_ars || 0), 0) || 0

  // Ticket promedio = ventas / pedidos
  const ticketPromedio = countPedidos && countPedidos > 0 ? ventasMes / countPedidos : 0

  // Resultado = Ingresos (ventas) - Egresos (costos fijos)
  const resultadoMes = ventasMes - egresosMes

  return {
    valorInventario,
    totalStock,
    productosConStock: productos?.filter(p => p.stock > 0).length || 0,
    productosSinStock: productos?.filter(p => (p.stock || 0) <= 0).length || 0,
    pedidosMes: countPedidos || 0,
    unidadesMes,
    ventasMes,
    ticketPromedio,
    egresosMes,
    resultadoMes,
    alertasStock: alertasStock || [],
    topProductos: topProductos || [],
  }
}

export default async function DashboardPage() {
  const metrics = await getMetrics()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      <Header
        title="Dashboard Ejecutivo"
        description="Vista general del negocio"
        actions={<DateRangePicker />}
        exportTipo="productos"
        sourceUrl="https://docs.google.com/spreadsheets/d/1w5KIANDzaXkvZFyCZZLDtKTdW-wOG60aRGijgC_vLmo"
        sourceName="Productos HUANGCOM"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* KPIs principales con animaciones escalonadas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Valor del Inventario"
            value={formatCurrency(metrics.valorInventario)}
            description={`${formatNumber(metrics.totalStock)} unidades en stock`}
            iconName="Package"
            iconVariant="default"
            animationDelay={0}
          />
          <KPICard
            title="Ventas del Mes"
            value={formatCurrency(metrics.ventasMes)}
            description={`${metrics.pedidosMes} pedidos`}
            iconName="ShoppingCart"
            iconVariant="success"
            trend={{ value: 12.5, isPositive: true }}
            animationDelay={50}
          />
          <KPICard
            title="Ticket Promedio"
            value={formatCurrency(metrics.ticketPromedio)}
            description={`${formatNumber(metrics.unidadesMes)} unidades vendidas`}
            iconName="Receipt"
            iconVariant="energy"
            animationDelay={100}
          />
          <KPICard
            title="Resultado del Mes"
            value={formatCurrency(metrics.resultadoMes)}
            description={`Costos fijos: ${formatCurrency(metrics.egresosMes)}`}
            iconName="DollarSign"
            iconVariant={metrics.resultadoMes >= 0 ? 'success' : 'danger'}
            animationDelay={150}
          />
        </div>

        {/* Gráficos y tablas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Productos */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 dark:hover:border-zinc-700 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/40 to-orange-50/20 dark:from-amber-500/10 dark:to-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10 text-amber-600 dark:text-amber-400">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-display">Top Productos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Últimos 30 días</p>
                </div>
              </div>
            </div>

            <div className="relative p-5">
              <div className="space-y-3">
                {metrics.topProductos.length > 0 ? (
                  metrics.topProductos.slice(0, 5).map((producto: any, index: number) => (
                    <div
                      key={producto.sku}
                      className="group/item flex items-center justify-between rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 p-3 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-bold text-white shadow-sm">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                            {producto.nombre}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {producto.sku}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatNumber(producto.unidades_vendidas)} uds
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatCurrency(producto.ingresos_totales)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay datos de ventas aún</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Las ventas aparecerán aquí</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alertas de Stock */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 dark:hover:border-zinc-700 animate-fade-in" style={{ animationDelay: '250ms', animationFillMode: 'forwards', opacity: 0 }}>
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/40 to-yellow-50/20 dark:from-amber-500/10 dark:to-yellow-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/10 text-amber-500 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-display">Alertas de Stock</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Productos con stock bajo</p>
                </div>
                {metrics.alertasStock.length > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    {metrics.alertasStock.length}
                  </span>
                )}
              </div>
            </div>

            <div className="relative p-5">
              <div className="space-y-3">
                {metrics.alertasStock.length > 0 ? (
                  metrics.alertasStock.map((producto: any) => (
                    <div
                      key={producto.sku}
                      className="flex items-center justify-between rounded-lg border border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 to-yellow-50/50 dark:from-amber-500/10 dark:to-yellow-500/5 p-3 transition-all duration-200 hover:border-amber-300 dark:hover:border-amber-500/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                          {producto.nombre}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {producto.sku}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-700 dark:text-amber-400 tabular-nums text-lg">
                          {producto.stock}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">restantes</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Stock en buen nivel</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No hay alertas de stock bajo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
