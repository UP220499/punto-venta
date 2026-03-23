import { useState } from 'react'
import { useAuditLogs } from '../../features/audit/useAuditLogs'

/* ── constants ──────────────────────────────────────── */

const PAGE_SIZE = 20

const SEVERITY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Advertencia' },
  { value: 'ERROR', label: 'Error' },
]

const EVENT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'TICKET_CLOSED', label: 'Ticket cerrado' },
]

/* ── formatters ─────────────────────────────────────── */

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
function fmtDate(iso) {
  if (!iso) return '—'
  try { return dateFmt.format(new Date(iso)) } catch { return '—' }
}

/* ── severity badge ─────────────────────────────────── */

const SEVERITY_STYLES = {
  INFO:  'bg-blue-100 text-blue-700',
  WARN:  'bg-amber-100 text-amber-700',
  ERROR: 'bg-red-100 text-red-700',
}

function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {severity}
    </span>
  )
}

/* ── event code label ───────────────────────────────── */

const EVENT_LABELS = {
  TICKET_CLOSED: 'Ticket cerrado',
}

function eventLabel(code) {
  return EVENT_LABELS[code] ?? code
}

/* ── icons ──────────────────────────────────────────── */

function IconSpinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-[--brand]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function IconError() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-300">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  )
}

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0h-16.5m16.5 0l-1.177-4.414A2.25 2.25 0 0016.956 1.5H7.044a2.25 2.25 0 00-2.117 1.586L3.75 7.5" />
    </svg>
  )
}

/* ── state components ───────────────────────────────── */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <IconSpinner />
      <p className="text-sm">Cargando registros…</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <IconError />
      <p className="text-sm text-red-500">{message}</p>
    </div>
  )
}

function EmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <IconInbox />
      <p className="text-sm font-medium text-gray-500">
        {hasFilters ? 'No se encontraron registros con esos filtros.' : 'Aún no hay registros de auditoría.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-[--brand] hover:text-[--brand-active] font-medium transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

/* ── main page ──────────────────────────────────────── */

export function AuditPage() {
  const [page, setPage] = useState(1)
  const [severity, setSeverity] = useState('')
  const [eventCode, setEventCode] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data, isLoading, isError, error } = useAuditLogs({
    page,
    pageSize: PAGE_SIZE,
    severity,
    eventCode,
    from: fromDate,
    to: toDate,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const fromRow = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0
  const toRow = Math.min(page * PAGE_SIZE, total)

  const hasFilters = severity !== '' || eventCode !== '' || fromDate !== '' || toDate !== ''

  function clearFilters() {
    setSeverity('')
    setEventCode('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const errorMessage = error?.response?.data?.message ?? error?.message ?? 'Error al cargar los registros de auditoría.'

  const selectClass = 'text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition'
  const dateClass = 'text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition'

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500 mt-0.5">Registro de actividad del sistema</p>
      </div>

      {/* Filters */}
      <div className="shrink-0 px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1) }}
            className={selectClass}
          >
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={eventCode}
            onChange={(e) => { setEventCode(e.target.value); setPage(1) }}
            className={selectClass}
          >
            {EVENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              className={dateClass}
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              className={dateClass}
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

            {isLoading ? (
              <LoadingState />
            ) : isError ? (
              <ErrorState message={errorMessage} />
            ) : items.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Fecha / hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Severidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Entidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {items.map((log) => (
                        <tr key={log.audit_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {fmtDate(log.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <SeverityBadge severity={log.severity} />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {eventLabel(log.event_code)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.actor_username ?? (log.actor_user_id ? `Usuario #${log.actor_user_id}` : '—')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.message}>
                            {log.message}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {log.entity_type
                              ? `${log.entity_type}${log.entity_id != null ? ` #${log.entity_id}` : ''}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Mostrando {fromRow}–{toRow} de {total} registros
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600 tabular-nums px-1">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
