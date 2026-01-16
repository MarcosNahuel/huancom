'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  RefreshCw,
  Download,
  Check,
  X,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  exportTipo?: string
  sourceUrl?: string
  sourceName?: string
}

export function Header({
  title,
  description,
  actions,
  exportTipo,
  sourceUrl,
  sourceName,
}: HeaderProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<'success' | 'error' | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'huangcom_dashboard_sync_2024'}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setSyncResult('success')
        router.refresh()
      } else {
        setSyncResult('error')
        console.error('Sync failed:', data.error)
      }
    } catch (error) {
      setSyncResult('error')
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncResult(null), 3000)
    }
  }

  const handleExport = async (format: 'excel' | 'csv') => {
    if (!exportTipo) return
    setExporting(true)
    setShowExportMenu(false)

    try {
      const endpoint = format === 'excel' ? '/api/export/excel' : '/api/export/csv'
      const response = await fetch(`${endpoint}?tipo=${exportTipo}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar')
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `${exportTipo}.${format === 'excel' ? 'xlsx' : 'csv'}`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-sm px-6 py-4">
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
          {title}
        </h1>

        {/* Description & Source */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors group"
            >
              <ExternalLink className="h-3 w-3 transition-transform group-hover:scale-110" />
              <span className="group-hover:underline">
                Ver fuente: {sourceName || 'Google Sheet'}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        {actions}

        {/* Export Button */}
        {exportTipo && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-white border border-slate-200 text-slate-700',
                'hover:bg-slate-50 hover:border-slate-300',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar'}
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  showExportMenu && 'rotate-180'
                )}
              />
            </button>

            {/* Export Dropdown */}
            {showExportMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-20 overflow-hidden animate-fade-in">
                  <div className="py-1">
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => handleExport('excel')}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-3 text-emerald-600" />
                      <span className="font-medium">Exportar Excel</span>
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => handleExport('csv')}
                    >
                      <FileText className="w-4 h-4 mr-3 text-sky-600" />
                      <span className="font-medium">Exportar CSV</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold',
            'transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:cursor-not-allowed',
            syncResult === 'success'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 focus:ring-emerald-500'
              : syncResult === 'error'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 focus:ring-red-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:from-amber-600 hover:to-orange-600 focus:ring-amber-500'
          )}
        >
          {syncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : syncResult === 'success' ? (
            <Check className="h-4 w-4" />
          ) : syncResult === 'error' ? (
            <X className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing
            ? 'Sincronizando...'
            : syncResult === 'success'
              ? 'Sincronizado'
              : syncResult === 'error'
                ? 'Error'
                : 'Sincronizar'}
        </button>
      </div>
    </div>
  )
}
