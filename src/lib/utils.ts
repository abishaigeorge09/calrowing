import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
}

export function generateInviteCode(teamName: string) {
  const prefix = teamName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${prefix}-ROW-${year}-${rand}`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function sessionTypeColor(type: string) {
  const map: Record<string, string> = {
    Erg: 'bg-blue-500',
    Water: 'bg-cyan-500',
    Weights: 'bg-purple-500',
    'Cross Training': 'bg-green-500',
    Rest: 'bg-gray-400',
  }
  return map[type] ?? 'bg-gray-400'
}

export function intensityColor(intensity: string) {
  const map: Record<string, string> = {
    Low: 'text-green-600 bg-green-50',
    Moderate: 'text-yellow-700 bg-yellow-50',
    High: 'text-orange-600 bg-orange-50',
    'Race Pace': 'text-red-600 bg-red-50',
  }
  return map[intensity] ?? 'text-gray-600 bg-gray-50'
}
