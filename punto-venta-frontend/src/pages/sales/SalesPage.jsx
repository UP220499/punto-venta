import { useState, useMemo, useEffect, useRef } from 'react'
import { useProducts } from '../../features/products/useProducts'
import { useTicket } from '../../features/sales/useTicket'
import { CheckoutModal } from './CheckoutModal'
import { usePermission, PERMISSIONS } from '../../lib/permissions'

/* ── currency formatter ──────────────────────────────────── */

const currencyFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})
function fmt(amount) {
  return currencyFmt.format(amount ?? 0)
}

/* ── icons ───────────────────────────────────────────────── */

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-gray-200">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

/* ── product card (search panel) ─────────────────────────── */

function ProductCard({ product, qtyInCart, onAdd }) {
  const outOfStock = product.stock_actual <= 0
  const atMax = qtyInCart >= product.stock_actual

  return (
    <button
      type="button"
      onClick={!outOfStock && !atMax ? onAdd : undefined}
      disabled={outOfStock || atMax}
      className={`relative w-full text-left p-3 rounded-xl border transition-all group ${
        outOfStock || atMax
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Cart qty badge */}
      {qtyInCart > 0 && (
        <span className="absolute top-2 right-2 min-w-[1.25rem] h-5 px-1 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center font-bold leading-none">
          {qtyInCart}
        </span>
      )}

      <p className="text-xs text-gray-400 font-mono mb-0.5 truncate pr-7">{product.sku}</p>
      <p className="text-sm font-medium text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
        {product.nombre}
      </p>
      <p className="text-base font-bold text-indigo-600 mb-2 tabular-nums">{fmt(product.precio_venta)}</p>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${
            product.stock_actual === 0
              ? 'text-red-500'
              : product.stock_actual <= product.stock_minimo
              ? 'text-amber-600'
              : 'text-gray-400'
          }`}
        >
          {outOfStock ? 'Sin stock' : `Stock: ${product.stock_actual}`}
        </span>
        {!outOfStock && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              atMax
                ? 'bg-gray-100 text-gray-400'
                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
            }`}
          >
            {atMax ? 'Máx.' : '+ Agregar'}
          </span>
        )}
      </div>
    </button>
  )
}

/* ── product search panel (left) ─────────────────────────── */

function ProductSearchPanel({ cartItems, stockAlert, onAdd }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef(null)

  // Debounce search query (300 ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading } = useProducts({
    pageSize: 30,
    q: debouncedQuery,
    estatus: 'ACTIVO',
  })
  const products = data?.items ?? []

  // product_id → current qty in cart
  const cartQtyMap = useMemo(
    () => Object.fromEntries(cartItems.map((i) => [i.product_id, i.cantidad])),
    [cartItems],
  )

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Search header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-200">
        <div className="relative flex items-center">
          <span className="absolute left-3 pointer-events-none">
            <IconSearch />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Stock alert banner */}
      {stockAlert && (
        <div className="shrink-0 mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-amber-700">
            <span className="font-semibold">{stockAlert.nombre}</span>
            {' — '}Stock disponible: <span className="font-semibold">{stockAlert.available}</span>
          </p>
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconSearch />
            <p className="mt-3 text-sm font-medium text-gray-500">Sin resultados</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedQuery ? `No hay productos para "${debouncedQuery}"` : 'No hay productos activos'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                qtyInCart={cartQtyMap[product.product_id] ?? 0}
                onAdd={() => onAdd(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: result count */}
      {!isLoading && products.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {products.length} producto{products.length !== 1 ? 's' : ''}
            {debouncedQuery ? ` para "${debouncedQuery}"` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── ticket item row (right panel) ───────────────────────── */

function TicketItem({ item, onSetQuantity, onRemove }) {
  const subtotalLinea = item.precio_unitario * item.cantidad
  const atMax = item.cantidad >= item.stock_actual

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight truncate">{item.nombre}</p>
        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{item.sku}</p>
        <p className="text-xs text-gray-500 mt-0.5">{fmt(item.precio_unitario)} c/u</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onSetQuantity(item.product_id, item.cantidad - 1)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          aria-label="Reducir cantidad"
        >
          <IconMinus />
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums text-gray-900 select-none">
          {item.cantidad}
        </span>
        <button
          type="button"
          onClick={() => onSetQuantity(item.product_id, item.cantidad + 1)}
          disabled={atMax}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Aumentar cantidad"
        >
          <IconPlus />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.product_id)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors ml-0.5"
          aria-label="Eliminar"
        >
          <IconTrash />
        </button>
      </div>

      {/* Line subtotal */}
      <p className="text-sm font-semibold text-gray-900 tabular-nums w-16 text-right shrink-0 mt-0.5">
        {fmt(subtotalLinea)}
      </p>
    </div>
  )
}

/* ── ticket panel (right) ────────────────────────────────── */

function TicketPanel({ items, subtotal, total, onSetQuantity, onRemove, onClear, onCobrar }) {
  const isEmpty = items.length === 0

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Ticket actual</h3>
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              {items.length}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <IconCart />
            <p className="mt-3 text-sm font-medium text-gray-500">Sin artículos</p>
            <p className="text-xs text-gray-400 mt-1">
              Busca y selecciona un producto para comenzar
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 pt-2 pb-1 border-b border-gray-100">
              <p className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">Cant.</p>
              <p className="w-16 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">Total</p>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <TicketItem
                  key={item.product_id}
                  item={item}
                  onSetQuantity={onSetQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Totals + action */}
      <div
        className={`shrink-0 border-t border-gray-200 ${
          isEmpty ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {/* Totals */}
        <div className="px-4 pt-3 pb-2 space-y-1.5">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium text-gray-700">{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Impuestos</span>
            <span className="tabular-nums text-gray-400 text-xs">Incluidos</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-indigo-600 tabular-nums">{fmt(total)}</span>
          </div>
        </div>

        {/* Cobrar button — only rendered when user has SALE_CLOSE permission */}
        {onCobrar && (
          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={onCobrar}
              disabled={isEmpty}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
            >
              Cobrar · {fmt(total)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── main page ───────────────────────────────────────────── */

export function SalesPage() {
  const ticket = useTicket()
  const canClose = usePermission(PERMISSIONS.SALE_CLOSE)

  // Stock alert: { nombre, available } | null
  const [stockAlert, setStockAlert] = useState(null)
  const stockAlertTimer = useRef(null)

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  function showStockAlert(nombre, available) {
    clearTimeout(stockAlertTimer.current)
    setStockAlert({ nombre, available })
    stockAlertTimer.current = setTimeout(() => setStockAlert(null), 4000)
  }

  function handleAddItem(product) {
    const result = ticket.addItem(product)
    if (result === 'STOCK_EXCEEDED') {
      showStockAlert(product.nombre, product.stock_actual)
    } else {
      clearTimeout(stockAlertTimer.current)
      setStockAlert(null)
    }
  }

  function handleSetQuantity(productId, newQty) {
    const result = ticket.setQuantity(productId, newQty)
    if (result === 'STOCK_EXCEEDED') {
      const item = ticket.items.find((i) => i.product_id === productId)
      showStockAlert(item?.nombre ?? 'Producto', item?.stock_actual ?? 0)
    }
  }

  function handleCobrar() {
    setIsCheckoutOpen(true)
  }

  return (
    <>
      <div className="flex gap-4 h-full">
      {/* Left: product search */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <ProductSearchPanel
          cartItems={ticket.items}
          stockAlert={stockAlert}
          onAdd={handleAddItem}
        />
      </div>

      {/* Right: ticket summary */}
      <div className="w-80 xl:w-96 shrink-0 flex flex-col min-h-0">
        <TicketPanel
          items={ticket.items}
          subtotal={ticket.subtotal}
          total={ticket.total}
          onSetQuantity={handleSetQuantity}
          onRemove={ticket.removeItem}
          onClear={() => {
            ticket.clearTicket()
            setStockAlert(null)
          }}
          onCobrar={canClose ? handleCobrar : undefined}
        />
      </div>
    </div>

    <CheckoutModal
      isOpen={isCheckoutOpen}
      total={ticket.total}
      cartItems={ticket.items}
      onClose={() => setIsCheckoutOpen(false)}
      onSuccess={ticket.clearTicket}
    />
    </>
  )
}
