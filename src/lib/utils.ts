import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  return fmt.replace('MMM', months[d.getMonth()]).replace('MM', pad(d.getMonth()+1)).replace('dd', pad(d.getDate())).replace('yyyy', String(d.getFullYear())).replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes()))
}

export function formatDateTime(date: string | Date): string { return formatDate(date, 'MMM dd, yyyy HH:mm') }
export function getInitials(name: string): string { return name.split(' ').slice(0,2).map((n)=>n[0]).join('').toUpperCase() }
export function capitalize(str: string): string { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() }
export function truncate(str: string, length: number): string { return str.length <= length ? str : str.slice(0, length) + '...' }

export function buildQueryString(params: Record<string, unknown>): string {
  const qs = Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '').map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  return qs ? `?${qs}` : ''
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'success', inactive: 'muted', pending: 'warning', approved: 'success',
  rejected: 'danger', cancelled: 'muted', processing: 'info', processed: 'success',
  draft: 'muted', published: 'success', suspended: 'danger', terminated: 'danger',
  present: 'success', absent: 'danger', late: 'warning', half_day: 'warning',
}
