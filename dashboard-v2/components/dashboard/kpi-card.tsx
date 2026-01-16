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
  Receipt,
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
  Receipt,
}

// Variantes de color para los iconos - Solar Luxury Dark
const iconVariants = {
  default: 'bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10 text-amber-600 dark:text-amber-400 dark:shadow-[0_0_20px_-5px_rgba(249,168,37,0.3)]',
  success: 'bg-gradient-to-br from-emerald-100 to-green-50 dark:from-emerald-500/20 dark:to-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:shadow-[0_0_20px_-5px_rgba(52,211,153,0.3)]',
  danger: 'bg-gradient-to-br from-red-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/10 text-red-500 dark:text-rose-400 dark:shadow-[0_0_20px_-5px_rgba(251,113,133,0.3)]',
  energy: 'bg-gradient-to-br from-sky-100 to-blue-50 dark:from-sky-500/20 dark:to-sky-500/10 text-sky-600 dark:text-sky-400 dark:shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]',
  warning: 'bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-yellow-500/20 dark:to-yellow-500/10 text-amber-500 dark:text-yellow-400 dark:shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]',
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
        'group relative overflow-hidden rounded-xl p-5',
        // Light mode
        'border border-slate-200/80 bg-white',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)]',
        // Dark mode - glassmorphism effect
        'dark:border-white/[0.06] dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/80',
        'dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.03)]',
        'dark:backdrop-blur-sm',
        // Transitions
        'transition-all duration-300 ease-out',
        // Light hover
        'hover:shadow-[0_10px_40px_-10px_rgb(0_0_0/0.1)] hover:border-slate-300/80',
        // Dark hover - solar glow effect
        'dark:hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.6),0_0_30px_-10px_rgba(249,168,37,0.15),inset_0_1px_0_0_rgba(255,255,255,0.05)]',
        'dark:hover:border-amber-500/20',
        'hover:-translate-y-0.5',
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
          'dark:from-amber-500 dark:via-amber-400 dark:to-orange-400',
          'opacity-0 transition-opacity duration-300',
          'group-hover:opacity-100'
        )}
      />

      {/* Glow effect sutil en hover */}
      <div
        className={cn(
          'absolute -top-24 -right-24 h-48 w-48 rounded-full',
          'bg-gradient-to-br from-amber-200/30 to-orange-100/20',
          'dark:from-amber-500/15 dark:to-orange-500/10',
          'opacity-0 blur-3xl transition-opacity duration-500',
          'group-hover:opacity-100'
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Título */}
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300 tracking-tight">
            {title}
          </p>

          {/* Valor principal */}
          <p className="font-display text-[1.75rem] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none tabular-nums">
            {value}
          </p>

          {/* Descripción y trend */}
          <div className="flex flex-wrap items-center gap-2">
            {description && (
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
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
                    : 'bg-red-50 text-red-700 ring-1 ring-red-100',
                  // Dark mode with subtle glow
                  trend.isPositive
                    ? 'dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30 dark:shadow-[0_0_10px_-3px_rgba(52,211,153,0.25)]'
                    : 'dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/30 dark:shadow-[0_0_10px_-3px_rgba(251,113,133,0.25)]'
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
        'group relative overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 p-4',
        'shadow-sm dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.3)] transition-all duration-200',
        'hover:shadow-md dark:hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/0.4)] hover:border-slate-300/80 dark:hover:border-amber-600/40 hover:-translate-y-px',
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
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
