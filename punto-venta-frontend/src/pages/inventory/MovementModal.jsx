import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEntry } from '../../features/inventory/useCreateEntry'
import { useCreateAdjustment } from '../../features/inventory/useCreateAdjustment'

/* ── schemas ────────────────────────────────────────────── */

const entrySchema = z.object({
  product_id: z.coerce.number().int().positive('Selecciona un producto'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  nota: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
})

const adjustmentSchema = z.object({
  product_id: z.coerce.number().int().positive('Selecciona un producto'),
  qty_delta: z.coerce
    .number()
    .refine((n) => n !== 0, { message: 'No puede ser cero' }),
  nota: z
    .string()
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
})

/* ── helpers ────────────────────────────────────────────── */

function inputCls(hasError) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`
}

function FieldError({ msg }) {
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

function extractServerError(err) {
  if (!err) return null
  return (
    err.response?.data?.error?.message ??
    err.response?.data?.message ??
    err.message ??
    null
  )
}

// Maps backend INSUFFICIENT_STOCK (English, technical) to a clean Spanish message.
// Parses numbers from the pattern "(actual + delta = result)" in the raw message.
function formatAdjustmentError(err) {
  if (!err) return null
  const code = err.response?.data?.error?.code
  if (code === 'INSUFFICIENT_STOCK') {
    const raw = err.response?.data?.error?.message ?? ''
    const match = raw.match(/\((\d+(?:\.\d+)?)\s*\+\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)\)/)
    if (match) {
      return `Stock insuficiente. Actual: ${match[1]}, resultado sería: ${match[3]}.`
    }
    return 'Stock insuficiente. El ajuste dejaría el stock en negativo.'
  }
  return extractServerError(err)
}

/* ── component ─────────────────────────────────────────── */

// movementType: 'ENTRADA' | 'AJUSTE'
// products: array of active products for selector
// Key prop in parent forces remount when switching between ENTRADA/AJUSTE
export function MovementModal({ isOpen, movementType = 'ENTRADA', products = [], onClose }) {
  const isEntry = movementType === 'ENTRADA'
  const schema = isEntry ? entrySchema : adjustmentSchema

  const { mutate: doEntry, isPending: entryPending, error: entryErr } = useCreateEntry()
  const { mutate: doAdjustment, isPending: adjPending, error: adjErr } = useCreateAdjustment()
  const isPending = entryPending || adjPending

  const serverError = extractServerError(entryErr) ?? formatAdjustmentError(adjErr)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: '',
      ...(isEntry ? { cantidad: '', nota: '' } : { qty_delta: '', nota: '' }),
    },
  })

  // Live stock validation data (AJUSTE mode only)
  // Always call watch so no conditional hook violation
  const watchedProductId = watch('product_id')
  const watchedDelta = watch('qty_delta')
  const selectedProduct = !isEntry && watchedProductId
    ? products.find((p) => String(p.product_id) === String(watchedProductId))
    : null
  const currentStock = selectedProduct?.stock_actual ?? null
  const resultStock =
    currentStock !== null &&
    watchedDelta !== '' &&
    watchedDelta !== null &&
    !isNaN(Number(watchedDelta))
      ? currentStock + Number(watchedDelta)
      : null

  function onSubmit(data) {
    if (isEntry) {
      const item = { product_id: data.product_id, cantidad: data.cantidad }
      if (data.nota?.trim()) item.nota = data.nota.trim()
      doEntry({ items: [item] }, { onSuccess: onClose })
    } else {
      // Frontend guard: prevent stock from going negative
      const product = products.find((p) => String(p.product_id) === String(data.product_id))
      const stockActual = product?.stock_actual ?? 0
      if (stockActual + data.qty_delta < 0) {
        setError('qty_delta', {
          type: 'manual',
          message: `Stock insuficiente. Actual: ${stockActual}, resultado sería: ${stockActual + data.qty_delta}`,
        })
        return
      }
      doAdjustment(
        { items: [{ product_id: data.product_id, qty_delta: data.qty_delta, nota: data.nota }] },
        { onSuccess: onClose },
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md my-8">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {/* Color dot */}
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  isEntry ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
              />
              <h2 className="text-lg font-semibold text-gray-900">
                {isEntry ? 'Entrada de stock' : 'Ajuste manual'}
              </h2>
            </div>
            <p className="text-sm text-gray-500 pl-4">
              {isEntry
                ? 'Registra la recepción de mercancía'
                : 'Corrige el stock por conteo u otro motivo'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 ml-4 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-4">

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Producto <span className="text-red-500">*</span>
              </label>
              <select {...register('product_id')} className={inputCls(errors.product_id)}>
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.sku} — {p.nombre}
                  </option>
                ))}
              </select>
              {errors.product_id && <FieldError msg={errors.product_id.message} />}
            </div>

            {/* Quantity — different field depending on type */}
            {isEntry ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad a ingresar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="0"
                  {...register('cantidad')}
                  className={inputCls(errors.cantidad)}
                />
                {errors.cantidad && <FieldError msg={errors.cantidad.message} />}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad{' '}
                  <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    (negativo para reducir, positivo para agregar)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Ej. −5 o +10"
                  {...register('qty_delta')}
                  className={inputCls(errors.qty_delta)}
                />
                {errors.qty_delta && <FieldError msg={errors.qty_delta.message} />}
                {selectedProduct && currentStock !== null && (
                  <p className="mt-1.5 text-xs">
                    <span className="text-gray-400">Stock actual: </span>
                    <span className="font-medium text-gray-600 tabular-nums">{currentStock}</span>
                    {resultStock !== null && (
                      <>
                        <span className="text-gray-400 mx-1.5">→</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            resultStock < 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {resultStock}
                        </span>
                        {resultStock < 0 && (
                          <span className="ml-1 text-red-500">— no permitido</span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isEntry ? (
                  <>
                    Nota{' '}
                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                  </>
                ) : (
                  <>
                    Motivo <span className="text-red-500">*</span>
                  </>
                )}
              </label>
              <textarea
                rows={2}
                placeholder={
                  isEntry
                    ? 'Ej. Compra a proveedor ABC'
                    : 'Ej. Corrección por conteo físico'
                }
                {...register('nota')}
                className={`resize-none ${inputCls(errors.nota)}`}
              />
              {errors.nota && <FieldError msg={errors.nota.message} />}
            </div>

            {/* AJUSTE info note */}
            {!isEntry && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-amber-700">
                  El stock final no puede quedar negativo. Si el ajuste causaría stock menor a 0, será rechazado.
                </p>
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:cursor-not-allowed ${
                isEntry
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
              }`}
            >
              {isPending && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEntry ? 'Registrar entrada' : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
