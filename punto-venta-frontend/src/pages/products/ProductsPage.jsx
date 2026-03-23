import { useState, useEffect } from 'react'
import { useProducts } from '../../features/products/useProducts'
import { ProductFormModal } from './ProductFormModal'
import { usePermission, PERMISSIONS } from '../../lib/permissions'

/* ── formatters ────────────────────────────────────────── */

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
function formatPrice(n) {
  return MXN.format(n)
}

/* ── sub-components ────────────────────────────────────── */

function StatusBadge({ estatus }) {
  if (estatus === 'ACTIVO') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Activo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
      Inactivo
    </span>
  )
}

function StockCell({ stock, minimo }) {
  if (stock === 0) {
    return <span className="text-red-600 font-semibold tabular-nums">{stock}</span>
  }
  if (stock <= minimo) {
    return <span className="text-amber-600 font-semibold tabular-nums">{stock}</span>
  }
  return <span className="text-gray-900 tabular-nums">{stock}</span>
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg className="animate-spin w-8 h-8 text-[--brand] mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-gray-500">Cargando productos...</p>
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
      <p className="text-sm font-medium text-gray-700">Error al cargar productos</p>
      <p className="text-xs text-gray-400 mt-1">{message}</p>
    </div>
  )
}

function EmptyState({ hasFilters, onClearFilters, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm font-medium text-gray-700">Sin resultados</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            No hay productos que coincidan con los filtros aplicados
          </p>
          <button
            onClick={onClearFilters}
            className="text-sm text-[--brand] hover:text-[--brand-active] font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">Sin productos</p>
          <p className={`text-xs text-gray-400 mt-1 ${onAdd ? 'mb-4' : ''}`}>
            Aún no hay productos registrados en el catálogo
          </p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 text-sm text-[--brand] hover:text-[--brand-active] font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar primer producto
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ── main page ─────────────────────────────────────────── */

const PAGE_SIZE = 20

export function ProductsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Debounce search input — reset page on new search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error } = useProducts({
    page,
    pageSize: PAGE_SIZE,
    q: debouncedSearch,
    estatus: statusFilter,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  function handleStatusChange(value) {
    setStatusFilter(value)
    setPage(1)
  }

  function clearFilters() {
    setSearchInput('')
    setStatusFilter('')
    setPage(1)
  }

  function openCreate() {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  function openEdit(product) {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const canWrite = usePermission(PERMISSIONS.PRODUCT_WRITE)

  const hasFilters = !!(debouncedSearch || statusFilter)
  const errorMessage =
    error?.response?.data?.message ?? error?.message ?? 'Error al cargar productos'

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Module header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Catálogo de productos del negocio
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="btn-brand flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-sm shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo producto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
        >
          <option value="">Todos los estatus</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>

        {/* Active filters indicator */}
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
          <EmptyState
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onAdd={canWrite ? openCreate : null}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Unidad
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estatus
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {product.nombre}
                        </p>
                        {product.primary_barcode && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">
                            {product.primary_barcode}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {formatPrice(product.precio_venta)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <StockCell stock={product.stock_actual} minimo={product.stock_minimo} />
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-xs text-gray-500">{product.unidad}</span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <StatusBadge estatus={product.estatus} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {canWrite && (
                          <button
                            onClick={() => openEdit(product)}
                            title="Editar producto"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[--brand] hover:bg-[--brand]/10 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                        )}
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
                  Mostrando {from}–{to} de {total} productos
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

            {/* Row count summary when no pagination needed */}
            {totalPages === 1 && total > 0 && (
              <div className="px-6 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {total} {total === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit modal — key forces remount when switching between create and edit modes */}
      <ProductFormModal
        key={selectedProduct?.product_id ?? 'new'}
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={closeModal}
      />
    </div>
  )
}
