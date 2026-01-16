'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface SalesTrendData {
  mes: string
  ingresos: number
  pedidos: number
  unidades: number
}

interface SalesTrendChartProps {
  data: SalesTrendData[]
}

const formatMonth = (mes: string) => {
  const date = new Date(mes)
  return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-lg">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {formatMonth(label)}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-emerald-600 dark:text-emerald-400">
            Ingresos: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-amber-600 dark:text-amber-400">
            Pedidos: {payload[1]?.value || 0}
          </p>
          <p className="text-sky-600 dark:text-sky-400">
            Unidades: {payload[2]?.value || 0}
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  // Ordenar por fecha ascendente para el gráfico
  const sortedData = [...data].sort((a, b) => a.mes.localeCompare(b.mes))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-zinc-700" />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMonth}
          tick={{ fontSize: 12 }}
          className="text-slate-500 dark:text-slate-400"
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
          tick={{ fontSize: 12 }}
          className="text-slate-500 dark:text-slate-400"
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          className="text-slate-500 dark:text-slate-400"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '10px' }}
          formatter={(value) => <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="ingresos"
          name="Ingresos"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorIngresos)"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="pedidos"
          name="Pedidos"
          stroke="#f59e0b"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPedidos)"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="unidades"
          name="Unidades"
          stroke="#0ea5e9"
          strokeWidth={1.5}
          fillOpacity={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
