import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (val: number) => void
  label?: string
  showValue?: boolean
  valueLabels?: Record<number, string>
  className?: string
  colorClass?: string
}

export function Slider({
  min = 1, max = 5, step = 1, value, onChange,
  showValue = true, valueLabels, className, colorClass = 'accent-[#1e3a5f]',
}: SliderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('flex-1 h-2 rounded-full cursor-pointer', colorClass)}
        style={{ WebkitAppearance: 'slider-horizontal' }}
      />
      {showValue && (
        <span className="min-w-[2.5rem] text-center font-bold text-lg text-[#1e3a5f]">
          {valueLabels ? valueLabels[value] ?? value : value}
        </span>
      )}
    </div>
  )
}

interface TapRatingProps {
  min?: number
  max?: number
  value: number
  onChange: (val: number) => void
  labels?: string[]
  className?: string
  colorClass?: string
}

export function TapRating({ min = 1, max = 5, value, onChange, labels, className, colorClass }: TapRatingProps) {
  const count = max - min + 1
  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length: count }, (_, i) => i + min).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border',
            value === n
              ? colorClass || 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
              : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/10'
          )}
        >
          {labels ? labels[n - min] : n}
        </button>
      ))}
    </div>
  )
}
