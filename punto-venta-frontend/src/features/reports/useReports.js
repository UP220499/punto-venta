import { useQuery } from '@tanstack/react-query'
import {
  getReportsSalesSummary,
  getReportsSalesByDay,
  getReportsTopProducts,
  getReportsInventorySummary,
} from './reportsApi'

export function useReportsSalesSummary({ from, to }) {
  return useQuery({
    queryKey: ['reports', 'sales-summary', from, to],
    queryFn: () => getReportsSalesSummary({ from, to }),
    enabled: !!from && !!to,
  })
}

export function useReportsSalesByDay({ from, to }) {
  return useQuery({
    queryKey: ['reports', 'sales-by-day', from, to],
    queryFn: () => getReportsSalesByDay({ from, to }),
    enabled: !!from && !!to,
  })
}

export function useReportsTopProducts({ from, to, limit = 10 }) {
  return useQuery({
    queryKey: ['reports', 'top-products', from, to, limit],
    queryFn: () => getReportsTopProducts({ from, to, limit }),
    enabled: !!from && !!to,
  })
}

export function useReportsInventorySummary({ from, to }) {
  return useQuery({
    queryKey: ['reports', 'inventory-summary', from, to],
    queryFn: () => getReportsInventorySummary({ from, to }),
    enabled: !!from && !!to,
  })
}
