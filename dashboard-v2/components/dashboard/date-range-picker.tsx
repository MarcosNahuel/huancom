'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface DateRangePickerProps {
  onChange?: (range: { from: Date; to: Date }) => void
}

const presets = [
  { label: 'Hoy', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Últimos 7 días', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 días', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Mes anterior', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Últimos 3 meses', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
]

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState('Últimos 30 días')
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetClick = (preset: typeof presets[0]) => {
    setSelectedPreset(preset.label)
    const range = preset.getValue()
    onChange?.(range)
    setIsOpen(false)
  }

  const currentRange = presets.find(p => p.label === selectedPreset)?.getValue() || presets[2].getValue()

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[240px] justify-start text-left"
      >
        <Calendar className="mr-2 h-4 w-4" />
        <span>
          {format(currentRange.from, 'dd MMM', { locale: es })} -{' '}
          {format(currentRange.to, 'dd MMM yyyy', { locale: es })}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-lg">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedPreset === preset.label
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
