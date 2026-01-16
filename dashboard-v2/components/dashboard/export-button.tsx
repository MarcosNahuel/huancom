'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

interface ExportButtonProps {
  tipo: string
  desde?: string
  hasta?: string
}

export function ExportButton({ tipo, desde, hasta }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = async (format: 'excel' | 'csv') => {
    setLoading(true)
    setShowMenu(false)

    try {
      const params = new URLSearchParams({ tipo })
      if (desde) params.append('desde', desde)
      if (hasta) params.append('hasta', hasta)

      const endpoint = format === 'excel' ? '/api/export/excel' : '/api/export/csv'
      const response = await fetch(`${endpoint}?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar')
      }

      // Descargar archivo
      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `export.${format === 'excel' ? 'xlsx' : 'csv'}`

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
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
      >
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Exportando...' : 'Exportar'}
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
          <button
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Exportar Excel
          </button>
          <button
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleExport('csv')}
          >
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            Exportar CSV
          </button>
        </div>
      )}
    </div>
  )
}
