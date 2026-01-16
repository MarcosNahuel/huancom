import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Package, AlertTriangle, TrendingDown } from 'lucide-react'

async function getInventario() {
  const supabase = await createClient()

  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('valor_inventario', { ascending: false })

  const { data: alertas } = await supabase
    .from('v_alertas_stock')
    .select('*')

  const totalValor = productos?.reduce((acc, p) => acc + (p.valor_inventario || 0), 0) || 0
  const totalUnidades = productos?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0
  const conStock = productos?.filter(p => p.stock > 0).length || 0
  const sinStock = productos?.filter(p => p.stock === 0).length || 0

  return {
    productos: productos || [],
    alertas: alertas || [],
    totalValor,
    totalUnidades,
    conStock,
    sinStock,
  }
}

export default async function InventarioPage() {
  const inv = await getInventario()

  return (
    <div className="flex flex-col">
      <Header
        title="Inventario"
        description="Stock y valorización de productos"
        exportTipo="productos"
        sourceUrl="https://docs.google.com/spreadsheets/d/1w5KIANDzaXkvZFyCZZLDtKTdW-wOG60aRGijgC_vLmo"
        sourceName="Productos HUANGCOM"
      />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand-100 dark:bg-amber-500/20 p-2">
                  <Package className="h-5 w-5 text-brand-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Valor Total</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(inv.totalValor)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Unidades en Stock</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNumber(inv.totalUnidades)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-slate-300">Productos con Stock</p>
              <p className="text-2xl font-bold text-green-600 dark:text-emerald-400">{inv.conStock}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 dark:bg-red-500/20 p-2">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-300">Sin Stock</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{inv.sinStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alertas */}
          {inv.alertas.length > 0 && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Stock Bajo ({inv.alertas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inv.alertas.map((p: any) => (
                    <div key={p.sku} className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
                      <p className="font-medium text-sm line-clamp-1 text-slate-900 dark:text-slate-100">{p.nombre}</p>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-slate-400">SKU: {p.sku}</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">{p.stock} uds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de productos */}
          <Card className={inv.alertas.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700 text-left">
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">SKU</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300">Producto</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Stock</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Precio</th>
                      <th className="pb-3 font-medium text-gray-500 dark:text-slate-300 text-right">Valor Inv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.productos.slice(0, 20).map((producto) => (
                      <tr key={producto.id} className="border-b border-gray-100 dark:border-zinc-800">
                        <td className="py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{producto.sku}</td>
                        <td className="py-3 max-w-[250px] truncate text-slate-900 dark:text-slate-100">{producto.nombre}</td>
                        <td className="py-3 text-right text-slate-900 dark:text-slate-100">
                          <span className={producto.stock <= 10 ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                            {formatNumber(producto.stock)}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-900 dark:text-slate-100">{formatCurrency(producto.precio_venta)}</td>
                        <td className="py-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(producto.valor_inventario)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
