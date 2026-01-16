'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MessageSquare,
  Calculator,
  FileText,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Sun,
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ventas', href: '/dashboard/ventas', icon: ShoppingCart },
  { name: 'Inventario', href: '/dashboard/inventario', icon: Package },
  { name: 'Conversión', href: '/dashboard/conversion', icon: MessageSquare },
  { type: 'separator', name: 'Contabilidad' },
  { name: 'Resumen', href: '/contabilidad', icon: Calculator },
  { name: 'Asientos', href: '/contabilidad/asientos', icon: FileText },
  { name: 'Proveedores', href: '/contabilidad/proveedores', icon: Users },
  { name: 'Costos Fijos', href: '/contabilidad/costos-fijos', icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-slate-200/80 shadow-sm">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/25">
          <Sun className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            HUANGCOM
          </span>
          <span className="text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wide">
            ENERGÍA SOLAR
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div key={index} className="pt-5 pb-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {item.name}
                </p>
              </div>
            )
          }

          const isActive = pathname === item.href
          const Icon = item.icon!

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                'transition-all duration-200 ease-out',
                isActive
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50/80 text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-r-full" />
              )}

              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600'
                    : 'bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>

              <span className="flex-1">{item.name}</span>

              {/* Hover arrow */}
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-all duration-200',
                  isActive
                    ? 'text-amber-500 opacity-100'
                    : 'text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                )}
              />
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 space-y-0.5">
        <Link
          href="/settings"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700 transition-colors">
            <Settings className="h-4 w-4" strokeWidth={2} />
          </div>
          Configuración
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100/80 text-slate-500 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </div>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
