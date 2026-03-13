import { useState, useMemo } from 'react'
import { useMovements } from '../../features/inventory/useMovements'
import { useProducts } from '../../features/products/useProducts'
import { MovementModal } from './MovementModal'

/* ── formatters ────────────────────────────────────────── */

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'short',
  timeStyle: 'short',
})
function formatDate(iso) {
  try {
    return dateFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

/* ── sub-components ────────────────────────────────────── */

function TipoBadge({ tipo, qtyDelta }) {
  if (tipo === 'ENTRADA') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Entrada
      </span>
    )
  }
  if (tipo === 'VENTA') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
        Venta
      </span>
    )
  }
  // AJUSTE — color depends on direction
  if (qtyDelta > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
        Ajuste +
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      Ajuste −
    </span>
  )
}

function DeltaCell({ qty_delta }) {
  const positive = qty_delta > 0
  return (
    <span
      className={`font-semibold tabular-nums text-sm ${
        positive ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {positive ? '+' : ''}{qty_delta}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-gray-500">Cargando movimientos...</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-red-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">Error al cargar movimientos</p>
      <p className="text-xs text-gray-400 mt-1">{message}</p>
    </div>
  )
}

function EmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-gray-700">Sin resultados</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            No hay movimientos que coincidan con los filtros
          </p>
          <button
            onClick={onClearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">Sin movimientos</p>
          <p className="text-xs text-gray-400 mt-1">
            Registra una entrada o ajuste para comenzar
          </p>
        </>
      )}
    </div>
  )
}

/* ── select helper ─────────────────────────────────────── */

function FilterSelect({ value, onChange, className = '', children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${className}`}
    >
      {children}
    </select>
  )
}

/* ── main page ─────────────────────────────────────────── */

const PAGE_SIZE = 20

export function InventoryPage() {
  const [page, setPage] = useState(1)
  const [tipoFilter, setTipoFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)   // 'ENTRADA' | 'AJUSTE' | null

  /* ── data ── */

  const { data: movementsData, isLoading, isError, error } = useMovements({
    page,
    pageSize: PAGE_SIZE,
    productId: productFilter,
    tipo: tipoFilter,
    fromDate,
    toDate,
  })

  // Fetch all active products for: product filter dropdown + modal selector
  const { data: productsData } = useProducts({ pageSize: 100, estatus: 'ACTIVO' })
  const allProducts = productsData?.items ?? []

  // Build product lookup map for the movements table (product_id → product)
  const productMap = useMemo(() => {
    const map = {}
    for (const p of allProducts) map[p.product_id] = p
    return map
  }, [allProducts])

  /* ── derived ── */

  const items = movementsData?.items ?? []
  const total = movementsData?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const fromRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const toRow = Math.min(page * PAGE_SIZE, total)

  /* ── handlers ── */

  function changeFilter(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  function clearFilters() {
    setTipoFilter('')
    setProductFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  function openEntry() {
    setModalType('ENTRADA')
    setIsModalOpen(true)
  }

  function openAdjustment() {
    setModalType('AJUSTE')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setModalType(null)
  }

  const hasFilters = !!(tipoFilter || productFilter || fromDate || toDate)
  const errorMessage =
    error?.response?.data?.error?.message ??
    error?.response?.data?.message ??
    error?.message ??
    'Error al cargar movimientos'

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Module header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Historial de movimientos y ajustes de stock
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAdjustment}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-indigo-600 text-sm font-semibold rounded-xl border border-indigo-200 shadow-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Ajuste manual
          </button>
          <button
            onClick={openEntry}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva entrada
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tipo */}
        <FilterSelect value={tipoFilter} onChange={changeFilter(setTipoFilter)}>
          <option value="">Todos los movimientos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="AJUSTE">Ajuste</option>
          <option value="VENTA">Venta</option>
        </FilterSelect>

        {/* Producto */}
        <FilterSelect
          value={productFilter}
          onChange={changeFilter(setProductFilter)}
          className="max-w-xs"
        >
          <option value="">Todos los productos</option>
          {allProducts.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.sku} — {p.nombre}
            </option>
          ))}
        </FilterSelect>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Desde</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => changeFilter(setFromDate)(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Hasta</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => changeFilter(setToDate)(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={errorMessage} />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Motivo / Nota
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((mv) => {
                    const product = productMap[mv.product_id]
                    return (
                      <tr key={mv.movement_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-gray-500">
                            {formatDate(mv.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {product ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 leading-tight">
                                {product.nombre}
                              </p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">
                                {product.sku}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">
                              #{mv.product_id}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <TipoBadge tipo={mv.tipo} qtyDelta={mv.qty_delta} />
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <DeltaCell qty_delta={mv.qty_delta} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500 max-w-xs truncate">
                            {mv.nota ?? (
                              <span className="text-gray-300 italic text-xs">—</span>
                            )}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {fromRow}–{toRow} de {total} movimientos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500 tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {/* Row count when no pagination */}
            {totalPages === 1 && total > 0 && (
              <div className="px-6 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {total} {total === 1 ? 'movimiento' : 'movimientos'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal — key forces remount when switching between ENTRADA/AJUSTE */}
      <MovementModal
        key={modalType}
        isOpen={isModalOpen}
        movementType={modalType}
        products={allProducts}
        onClose={closeModal}
      />
    </div>
  )
}
