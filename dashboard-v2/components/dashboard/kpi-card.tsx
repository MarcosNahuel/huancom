'use client'

import { cn } from '@/lib/utils'
import {
  DollarSign,
  Package,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Sun,
  Battery,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Package,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Sun,
  Battery,
}

// Variantes de color para los iconos
const iconVariants = {
  default: 'bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600',
  success: 'bg-gradient-to-br from-emerald-100 to-green-50 text-emerald-600',
  danger: 'bg-gradient-to-br from-red-100 to-rose-50 text-red-500',
  energy: 'bg-gradient-to-br from-sky-100 to-blue-50 text-sky-600',
  warning: 'bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-500',
}

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  iconName?: keyof typeof iconMap
  iconVariant?: keyof typeof iconVariants
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  animationDelay?: number
}

export function KPICard({
  title,
  value,
  description,
  iconName,
  iconVariant = 'default',
  trend,
  className,
  animationDelay = 0,
}: KPICardProps) {
  const Icon = iconName ? iconMap[iconName] : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)]',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_10px_40px_-10px_rgb(0_0_0/0.1)]',
        'hover:border-slate-300/80 hover:-translate-y-0.5',
        'animate-fade-in opacity-0',
        className
      )}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Accent bar superior - aparece en hover */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-0.5',
          'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600',
          'opacity-0 transition-opacity duration-300',
          'group-hover:opacity-100'
        )}
      />

      {/* Glow effect sutil en hover */}
      <div
        className={cn(
          'absolute -top-24 -right-24 h-48 w-48 rounded-full',
          'bg-gradient-to-br from-amber-200/30 to-orange-100/20',
          'opacity-0 blur-3xl transition-opacity duration-500',
          'group-hover:opacity-100'
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Título */}
          <p className="text-sm font-medium text-slate-500 tracking-tight">
            {title}
          </p>

          {/* Valor principal */}
          <p className="font-display text-[1.75rem] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
            {value}
          </p>

          {/* Descripción y trend */}
          <div className="flex flex-wrap items-center gap-2">
            {description && (
              <p className="text-xs text-slate-400 font-medium">
                {description}
              </p>
            )}
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                  'transition-transform duration-200 hover:scale-105',
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                    : 'bg-red-50 text-red-700 ring-1 ring-red-100'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
        </div>

        {/* Icono */}
        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              'transition-all duration-300',
              'group-hover:scale-110 group-hover:shadow-md',
              iconVariants[iconVariant]
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  )
}

// Variante compacta para grids más densos
export function KPICardCompact({
  title,
  value,
  iconName,
  iconVariant = 'default',
  trend,
  className,
}: Omit<KPICardProps, 'description' | 'animationDelay'>) {
  const Icon = iconName ? iconMap[iconName] : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-slate-200/60 bg-white p-4',
        'shadow-sm transition-all duration-200',
        'hover:shadow-md hover:border-slate-300/80 hover:-translate-y-px',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              'transition-transform duration-200 group-hover:scale-105',
              iconVariants[iconVariant]
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-lg font-bold text-slate-900 tabular-nums">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
