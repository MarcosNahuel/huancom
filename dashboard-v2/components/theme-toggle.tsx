'use client'

import { useTheme } from './theme-provider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )
  }

  const getLabel = () => {
    if (theme === 'system') return 'Sistema'
    if (theme === 'dark') return 'Oscuro'
    return 'Claro'
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        'text-slate-700 dark:text-slate-200',
        'hover:bg-slate-50 dark:hover:bg-slate-700',
        'hover:border-slate-300 dark:hover:border-slate-600',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 dark:focus:border-amber-600'
      )}
      title={`Tema actual: ${getLabel()}. Clic para cambiar.`}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  )
}
