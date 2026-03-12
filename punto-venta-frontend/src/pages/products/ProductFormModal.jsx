import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateProduct } from '../../features/products/useCreateProduct'
import { useUpdateProduct } from '../../features/products/useUpdateProduct'

/* ── validation schemas ────────────────────────────────── */

const createSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es requerido').max(64, 'Máximo 64 caracteres'),
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(160, 'Máximo 160 caracteres'),
  descripcion: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
  precio_venta: z.coerce
    .number()
    .positive('Debe ser mayor a 0'),
  costo: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(0, 'No puede ser negativo').optional(),
  ),
  stock_actual: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  stock_minimo: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  unidad: z.string().trim().min(1, 'Requerida').max(16, 'Máximo 16 caracteres').default('pz'),
})

const editSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(160, 'Máximo 160 caracteres'),
  descripcion: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
  precio_venta: z.coerce
    .number()
    .positive('Debe ser mayor a 0'),
  costo: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(0, 'No puede ser negativo').optional(),
  ),
  stock_minimo: z.coerce.number().min(0, 'No puede ser negativo').default(0),
  unidad: z.string().trim().min(1, 'Requerida').max(16, 'Máximo 16 caracteres').default('pz'),
  estatus: z.enum(['ACTIVO', 'INACTIVO']),
})

/* ── helpers ───────────────────────────────────────────── */

function inputCls(hasError) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`
}

function FieldError({ msg }) {
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

/* ── component ─────────────────────────────────────────── */

export function ProductFormModal({ isOpen, product, onClose }) {
  const isEdit = product != null

  const { mutate: doCreate, isPending: creating, error: createErr } = useCreateProduct()
  const { mutate: doUpdate, isPending: updating, error: updateErr } = useUpdateProduct()
  const isPending = creating || updating

  const serverError =
    createErr?.response?.data?.error?.message ??
    updateErr?.response?.data?.error?.message ??
    null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(isEdit ? editSchema : createSchema) })

  useEffect(() => {
    if (!isOpen) return
    if (isEdit) {
      reset({
        nombre: product.nombre,
        descripcion: product.descripcion ?? '',
        precio_venta: product.precio_venta,
        costo: product.costo ?? '',
        stock_minimo: product.stock_minimo,
        unidad: product.unidad,
        estatus: product.estatus,
      })
    } else {
      reset({
        sku: '',
        nombre: '',
        descripcion: '',
        precio_venta: '',
        costo: '',
        stock_actual: 0,
        stock_minimo: 0,
        unidad: 'pz',
      })
    }
  }, [isOpen, isEdit, product, reset])

  function onSubmit(data) {
    const payload = { ...data }
    if (payload.descripcion === '') delete payload.descripcion
    if (payload.costo === undefined) delete payload.costo

    if (isEdit) {
      doUpdate({ productId: product.product_id, ...payload }, { onSuccess: onClose })
    } else {
      doCreate(payload, { onSuccess: onClose })
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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? `SKU: ${product.sku}` : 'Completa los datos del nuevo producto'}
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

            {/* SKU — create only */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. PROD-001"
                  {...register('sku')}
                  className={inputCls(errors.sku)}
                />
                {errors.sku && <FieldError msg={errors.sku.message} />}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre del producto"
                {...register('nombre')}
                className={inputCls(errors.nombre)}
              />
              {errors.nombre && <FieldError msg={errors.nombre.message} />}
            </div>

            {/* Precio de venta + Costo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Precio de venta <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register('precio_venta')}
                  className={inputCls(errors.precio_venta)}
                />
                {errors.precio_venta && <FieldError msg={errors.precio_venta.message} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Costo{' '}
                  <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('costo')}
                  className={inputCls(errors.costo)}
                />
                {errors.costo && <FieldError msg={errors.costo.message} />}
              </div>
            </div>

            {/* Stock fields */}
            {!isEdit ? (
              /* Create: stock inicial | stock mínimo | unidad */
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register('stock_actual')}
                    className={inputCls(errors.stock_actual)}
                  />
                  {errors.stock_actual && <FieldError msg={errors.stock_actual.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register('stock_minimo')}
                    className={inputCls(errors.stock_minimo)}
                  />
                  {errors.stock_minimo && <FieldError msg={errors.stock_minimo.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Unidad
                  </label>
                  <input
                    type="text"
                    placeholder="pz"
                    {...register('unidad')}
                    className={inputCls(errors.unidad)}
                  />
                  {errors.unidad && <FieldError msg={errors.unidad.message} />}
                </div>
              </div>
            ) : (
              /* Edit: stock mínimo | unidad */
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register('stock_minimo')}
                    className={inputCls(errors.stock_minimo)}
                  />
                  {errors.stock_minimo && <FieldError msg={errors.stock_minimo.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Unidad
                  </label>
                  <input
                    type="text"
                    placeholder="pz"
                    {...register('unidad')}
                    className={inputCls(errors.unidad)}
                  />
                  {errors.unidad && <FieldError msg={errors.unidad.message} />}
                </div>
              </div>
            )}

            {/* Estatus — edit only */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Estatus
                </label>
                <select {...register('estatus')} className={inputCls(errors.estatus)}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción{' '}
                <span className="text-xs text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Descripción breve del producto"
                {...register('descripcion')}
                className={`resize-none ${inputCls(errors.descripcion)}`}
              />
              {errors.descripcion && <FieldError msg={errors.descripcion.message} />}
            </div>

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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isPending && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
