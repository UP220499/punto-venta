import { useState, useEffect, useMemo } from 'react'
import { usePaymentMethods } from '../../features/sales/usePaymentMethods'
import { useCheckout } from '../../features/sales/useCheckout'

/* ── currency formatter ──────────────────────────────────── */

const currencyFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})
function fmt(amount) {
  return currencyFmt.format(amount ?? 0)
}

/* ── error mapping ───────────────────────────────────────── */

function extractCheckoutError(err) {
  if (!err) return null
  const res = err.response?.data
  const code = res?.error?.code ?? res?.code
  if (code === 'STOCK_INSUFFICIENT') {
    return 'Stock insuficiente. Algún producto ya no tiene suficiente inventario. Ajusta el ticket e intenta de nuevo.'
  }
  if (code === 'PAYMENT_INSUFFICIENT') {
    return 'El monto recibido es insuficiente para cubrir el total.'
  }
  if (code === 'TICKET_NOT_DRAFT') {
    return 'Este ticket ya fue procesado. Cierra el modal e intenta de nuevo.'
  }
  return (
    res?.message ??
    res?.error?.message ??
    err.message ??
    'Error al procesar el cobro. Intenta de nuevo.'
  )
}

/* ── icons ───────────────────────────────────────────────── */

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconAlertCircle() {
  return (
    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-emerald-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ── success screen ──────────────────────────────────────── */

function SuccessScreen({ result, onClose }) {
  return (
    <>
      <div className="flex flex-col items-center px-6 pt-8 pb-2 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <IconCheck />
        </div>
        <h2 className="text-xl font-bold text-gray-900">¡Venta realizada!</h2>
        <p className="text-sm text-gray-500 mt-1">El ticket ha sido cerrado exitosamente.</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Folio */}
        <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Folio</p>
          <p className="text-4xl font-bold text-gray-900 tabular-nums">
            #{String(result.folio).padStart(4, '0')}
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total cobrado</span>
            <span className="font-semibold text-gray-900 tabular-nums">{fmt(result.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cambio entregado</span>
            <span className={`font-semibold tabular-nums ${result.cambio > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {fmt(result.cambio)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition-colors text-sm tracking-wide"
        >
          Nueva venta
        </button>
      </div>
    </>
  )
}

/* ── payment screen ──────────────────────────────────────── */

function PaymentScreen({ total, isPending, serverError, onSubmit, onClose }) {
  const { data: methodsData, isLoading: loadingMethods } = usePaymentMethods()
  const methods = useMemo(
    () => (methodsData?.items ?? []).filter((m) => m.estatus === 'ACTIVO'),
    [methodsData],
  )

  const [selectedCode, setSelectedCode] = useState(null)
  const [monto, setMonto] = useState('')
  const [referencia, setReferencia] = useState('')

  // Set defaults when total changes (modal reopened) or methods load
  useEffect(() => {
    setMonto(total > 0 ? total.toFixed(2) : '')
  }, [total])

  useEffect(() => {
    if (methods.length > 0 && !selectedCode) {
      setSelectedCode(methods[0].code)
    }
  }, [methods, selectedCode])

  const selectedMethod = methods.find((m) => m.code === selectedCode) ?? null
  const montoNum = parseFloat(monto) || 0
  const cambio = Math.max(0, montoNum - total)
  const montoSuficiente = montoNum >= total && montoNum > 0
  const requiresRef = selectedMethod?.requires_reference ?? false
  const refMissing = requiresRef && referencia.trim() === ''
  const canSubmit = !isPending && !loadingMethods && selectedCode !== null && montoSuficiente && !refMissing

  function handleSubmit() {
    if (!canSubmit) return
    const payment = {
      method_code: selectedCode,
      monto: parseFloat(montoNum.toFixed(2)),
    }
    if (referencia.trim()) payment.referencia = referencia.trim()
    onSubmit(payment)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cobro de venta</h2>
          <p className="text-sm text-gray-500 mt-0.5">Registra el pago para cerrar el ticket</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors p-1 rounded-lg hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <IconX />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Total to pay */}
        <div className="text-center py-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Total a cobrar</p>
          <p className="text-3xl font-bold text-indigo-700 tabular-nums">{fmt(total)}</p>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Método de pago</p>
          {loadingMethods ? (
            <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
              <IconSpinner />
              <span>Cargando métodos…</span>
            </div>
          ) : methods.length === 0 ? (
            <p className="text-sm text-red-500 py-2">
              No hay métodos de pago activos. Configura al menos uno en el sistema.
            </p>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setSelectedCode(m.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    selectedCode === m.code
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selectedCode === m.code ? 'border-indigo-500' : 'border-gray-300'
                    }`}
                  >
                    {selectedCode === m.code && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </span>
                  <span className={`text-sm font-medium ${selectedCode === m.code ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {m.nombre_visible}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Monto recibido */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monto recibido
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">
              $
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder={total.toFixed(2)}
              className={`w-full pl-7 pr-4 py-2.5 rounded-lg border text-sm font-mono bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                monto !== '' && !montoSuficiente ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {monto !== '' && !montoSuficiente && (
            <p className="mt-1 text-xs text-red-500">
              El monto es insuficiente. Mínimo: {fmt(total)}
            </p>
          )}
        </div>

        {/* Referencia (only if required by method) */}
        {requiresRef && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Referencia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={80}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="No. de transferencia, folio, etc."
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        )}

        {/* Cambio (live) */}
        {montoSuficiente && (
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
              cambio > 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className={`text-sm font-semibold ${cambio > 0 ? 'text-emerald-700' : 'text-gray-500'}`}>
              Cambio
            </span>
            <span className={`text-xl font-bold tabular-nums ${cambio > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {fmt(cambio)}
            </span>
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <IconAlertCircle />
            <p className="text-sm text-red-600 leading-relaxed">{serverError}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <IconSpinner />
              Procesando…
            </>
          ) : (
            `Confirmar cobro · ${fmt(total)}`
          )}
        </button>
      </div>
    </>
  )
}

/* ── main modal ──────────────────────────────────────────── */

/**
 * CheckoutModal — POS checkout flow
 *
 * Props:
 *   isOpen    boolean
 *   total     number          — total from local cart
 *   cartItems { product_id, cantidad }[]  — items to submit
 *   onClose   () => void      — called when modal should close (backdrop, X, "Nueva venta")
 *   onSuccess () => void      — called after successful sale (clear cart in parent)
 */
export function CheckoutModal({ isOpen, total, cartItems, onClose, onSuccess }) {
  const { mutate: doCheckout, isPending, error, reset: resetMutation } = useCheckout()
  const [result, setResult] = useState(null)

  // Reset internal state each time modal opens
  useEffect(() => {
    if (!isOpen) return
    setResult(null)
    resetMutation()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(payment) {
    doCheckout(
      {
        items: cartItems.map((i) => ({ product_id: i.product_id, cantidad: i.cantidad })),
        payment,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          onSuccess() // clear cart in parent
        },
      },
    )
  }

  function handleClose() {
    if (isPending) return
    onClose()
  }

  if (!isOpen) return null

  const serverError = extractCheckoutError(error)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={!isPending ? handleClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm z-10 overflow-hidden">
        {result ? (
          <SuccessScreen result={result} onClose={handleClose} />
        ) : (
          <PaymentScreen
            total={total}
            isPending={isPending}
            serverError={serverError}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  )
}
