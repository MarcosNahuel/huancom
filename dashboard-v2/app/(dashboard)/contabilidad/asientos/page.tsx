import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'
import { formatCurrency, formatDate } from '@/lib/utils'

async function getAsientos() {
  const supabase = await createClient()

  const { data: asientos } = await supabase
    .from('asientos')
    .select('*')
    .order('fecha_compra', { ascending: false })
    .limit(100)

  return asientos || []
}

export default async function AsientosPage() {
  const asientos = await getAsientos()

  return (
    <div className="flex flex-col">
      <Header
        title="Asientos Contables"
        description="Registro de movimientos contables"
        actions={<DateRangePicker />}
        exportTipo="asientos"
        sourceUrl="https://docs.google.com/spreadsheets/d/1Gypm7OJkbimlJpKPgAO9Z3fULSN8NcgfxO5kwuyp34Q"
        sourceName="Cashflow HUANGCOM"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/50 text-left">
                    <th className="pb-3 font-medium text-slate-600 dark:text-slate-300">Fecha</th>
                    <th className="pb-3 font-medium text-slate-600 dark:text-slate-300">Tipo</th>
                    <th className="pb-3 font-medium text-slate-600 dark:text-slate-300">Proveedor</th>
                    <th className="pb-3 font-medium text-slate-600 dark:text-slate-300">Detalle</th>
                    <th className="pb-3 font-medium text-slate-600 dark:text-slate-300">Centro Costo</th>
                    <th className="pb-3 font-medium text-slate-600 dark:text-slate-300 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {asientos.length > 0 ? (
                    asientos.map((asiento) => (
                      <tr key={asiento.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 text-slate-700 dark:text-slate-300">{formatDate(asiento.fecha_compra)}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            asiento.tipo_movimiento === 'INGRESO'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 dark:shadow-[0_0_10px_-3px_rgba(52,211,153,0.25)]'
                              : 'bg-red-100 text-red-700 dark:bg-rose-500/15 dark:text-rose-400 dark:shadow-[0_0_10px_-3px_rgba(251,113,133,0.25)]'
                          }`}>
                            {asiento.tipo_movimiento}
                          </span>
                        </td>
                        <td className="py-3 text-slate-900 dark:text-slate-100">{asiento.proveedor || '-'}</td>
                        <td className="py-3 max-w-[200px] truncate text-slate-700 dark:text-slate-300">{asiento.detalle || asiento.tipo_gasto || '-'}</td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{asiento.centro_costo || '-'}</td>
                        <td className={`py-3 text-right font-medium ${
                          asiento.tipo_movimiento === 'INGRESO'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-rose-400'
                        }`}>
                          {asiento.tipo_movimiento === 'INGRESO' ? '+' : '-'}
                          {formatCurrency(asiento.total_factura || asiento.importe_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No hay asientos registrados
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
