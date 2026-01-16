'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ParetoData {
  nombre: string
  sku: string
  ingresos: number
  porcentajeAcumulado: number
}

interface ParetoChartProps {
  data: ParetoData[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-lg max-w-xs">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1 truncate">
          {data.nombre}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
          {data.sku}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-amber-600 dark:text-amber-400">
            Ingresos: {formatCurrency(data.ingresos)}
          </p>
          <p className="text-emerald-600 dark:text-emerald-400">
            Acumulado: {data.porcentajeAcumulado.toFixed(1)}%
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function ParetoChart({ data }: ParetoChartProps) {
  // Calcular porcentaje acumulado
  const totalIngresos = data.reduce((acc, item) => acc + item.ingresos, 0)
  let acumulado = 0
  const paretoData = data.map((item, index) => {
    acumulado += item.ingresos
    return {
      ...item,
      index: index + 1,
      porcentajeAcumulado: (acumulado / totalIngresos) * 100,
    }
  })

  // Encontrar el punto 80/20
  const punto80 = paretoData.findIndex((d) => d.porcentajeAcumulado >= 80)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-zinc-700" />
        <XAxis
          dataKey="index"
          tick={{ fontSize: 11 }}
          className="text-slate-500 dark:text-slate-400"
          label={{ value: 'Productos (ranking)', position: 'bottom', fontSize: 11, fill: '#94a3b8' }}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
          tick={{ fontSize: 11 }}
          className="text-slate-500 dark:text-slate-400"
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tick={{ fontSize: 11 }}
          className="text-slate-500 dark:text-slate-400"
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Línea de referencia 80% */}
        <ReferenceLine
          yAxisId="right"
          y={80}
          stroke="#ef4444"
          strokeDasharray="5 5"
          label={{ value: '80%', position: 'right', fill: '#ef4444', fontSize: 10 }}
        />

        {/* Línea vertical en el punto 80/20 */}
        {punto80 > 0 && (
          <ReferenceLine
            yAxisId="left"
            x={punto80 + 1}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{ value: `Top ${punto80 + 1}`, position: 'top', fill: '#ef4444', fontSize: 10 }}
          />
        )}

        <Bar
          yAxisId="left"
          dataKey="ingresos"
          fill="#f59e0b"
          radius={[2, 2, 0, 0]}
          opacity={0.8}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="porcentajeAcumulado"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
