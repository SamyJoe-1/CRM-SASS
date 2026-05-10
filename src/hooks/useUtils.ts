import { useState, useEffect, useCallback } from 'react'
import { downloadBlob } from '../lib/utils'
import { toast } from 'sonner'

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.error(error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportData = useCallback(
    async (
      apiFn: () => Promise<Blob>,
      filename: string
    ) => {
      setIsExporting(true)
      try {
        const blob = await apiFn()
        downloadBlob(blob, filename)
        toast.success('Export completed')
      } catch {
        toast.error('Export failed')
      } finally {
        setIsExporting(false)
      }
    },
    []
  )

  return { exportData, isExporting }
}
