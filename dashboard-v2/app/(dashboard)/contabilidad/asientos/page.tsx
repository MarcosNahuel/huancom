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
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-medium text-gray-500">Fecha</th>
                    <th className="pb-3 font-medium text-gray-500">Tipo</th>
                    <th className="pb-3 font-medium text-gray-500">Proveedor</th>
                    <th className="pb-3 font-medium text-gray-500">Detalle</th>
                    <th className="pb-3 font-medium text-gray-500">Centro Costo</th>
                    <th className="pb-3 font-medium text-gray-500 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {asientos.length > 0 ? (
                    asientos.map((asiento) => (
                      <tr key={asiento.id} className="border-b border-gray-100">
                        <td className="py-3">{formatDate(asiento.fecha_compra)}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            asiento.tipo_movimiento === 'INGRESO'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {asiento.tipo_movimiento}
                          </span>
                        </td>
                        <td className="py-3">{asiento.proveedor || '-'}</td>
                        <td className="py-3 max-w-[200px] truncate">{asiento.detalle || asiento.tipo_gasto || '-'}</td>
                        <td className="py-3 text-xs">{asiento.centro_costo || '-'}</td>
                        <td className={`py-3 text-right font-medium ${
                          asiento.tipo_movimiento === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {asiento.tipo_movimiento === 'INGRESO' ? '+' : '-'}
                          {formatCurrency(asiento.total_factura || asiento.importe_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
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
