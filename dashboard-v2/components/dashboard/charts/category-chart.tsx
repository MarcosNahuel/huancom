'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryData {
  categoria: string
  ingresos: number
  productos: number
}

interface CategoryChartProps {
  data: CategoryData[]
}

// Paleta de colores solar/energía
const COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-lg">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {data.categoria}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-emerald-600 dark:text-emerald-400">
            Ingresos: {formatCurrency(data.ingresos)}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Productos: {data.productos}
          </p>
          <p className="text-amber-600 dark:text-amber-400">
            {((data.ingresos / data.total) * 100).toFixed(1)}% del total
          </p>
        </div>
      </div>
    )
  }
  return null
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null // No mostrar labels para segmentos < 5%

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CategoryChart({ data }: CategoryChartProps) {
  // Filtrar "Mercadolibre" ya que es una etiqueta de canal, no categoría de producto
  const filteredData = data
    .filter((d) => d.categoria !== 'Mercadolibre')
    .slice(0, 8) // Top 8 categorías

  const total = filteredData.reduce((acc, item) => acc + item.ingresos, 0)
  const chartData = filteredData.map((item) => ({
    ...item,
    total,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          innerRadius={40}
          fill="#8884d8"
          dataKey="ingresos"
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value) => (
            <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
