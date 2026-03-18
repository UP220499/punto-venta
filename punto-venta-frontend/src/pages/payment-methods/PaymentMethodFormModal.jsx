import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreatePaymentMethod } from '../../features/payment-methods/useCreatePaymentMethod'
import { useUpdatePaymentMethod } from '../../features/payment-methods/useUpdatePaymentMethod'

/* ── schemas ────────────────────────────────────────────── */

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Solo mayúsculas, números y guion bajo (UPPER_SNAKE_CASE)'),
  nombre_visible: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(60, 'Máximo 60 caracteres'),
  sort_order: z.coerce
    .number({ invalid_type_error: 'Ingresa un número válido' })
    .int('Debe ser un entero')
    .min(0, 'Debe ser 0 o mayor'),
  requires_reference: z.boolean(),
})

const editSchema = z.object({
  nombre_visible: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(60, 'Máximo 60 caracteres'),
  sort_order: z.coerce
    .number({ invalid_type_error: 'Ingresa un número válido' })
    .int('Debe ser un entero')
    .min(0, 'Debe ser 0 o mayor'),
  requires_reference: z.boolean(),
  estatus_activo: z.boolean(),
})

/* ── helpers ────────────────────────────────────────────── */

function inputCls(hasError) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`
}

function FieldError({ msg }) {
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

function extractError(err) {
  if (!err) return null
  return (
    err.response?.data?.error?.message ??
    err.response?.data?.message ??
    err.message ??
    'Error desconocido'
  )
}

/* ── component ──────────────────────────────────────────── */

export function PaymentMethodFormModal({ isOpen, method, onClose }) {
  const isEdit = method != null

  const { mutate: doCreate, isPending: creating, error: createErr } = useCreatePaymentMethod()
  const { mutate: doUpdate, isPending: updating, error: updateErr } = useUpdatePaymentMethod()

  const isPending = creating || updating
  const serverError = extractError(isEdit ? updateErr : createErr)

  const schema = isEdit ? editSchema : createSchema
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const isActivo = watch('estatus_activo')

  useEffect(() => {
    if (!isOpen) return
    if (isEdit) {
      reset({
        nombre_visible:    method.nombre_visible,
        sort_order:        method.sort_order,
        requires_reference: method.requires_reference,
        estatus_activo:    method.estatus === 'ACTIVO',
      })
    } else {
      reset({ code: '', nombre_visible: '', sort_order: 0, requires_reference: false })
    }
  }, [isOpen, isEdit, method, reset])

  function onSubmit(formData) {
    if (isEdit) {
      doUpdate(
        {
          paymentMethodId: method.payment_method_id,
          nombre_visible:    formData.nombre_visible,
          sort_order:        formData.sort_order,
          requires_reference: formData.requires_reference,
          estatus:           formData.estatus_activo ? 'ACTIVO' : 'INACTIVO',
        },
        { onSuccess: onClose },
      )
    } else {
      doCreate(
        {
          code:              formData.code,
          nombre_visible:    formData.nombre_visible,
          sort_order:        formData.sort_order,
          requires_reference: formData.requires_reference,
        },
        { onSuccess: onClose },
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={!isPending ? onClose : undefined} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md my-8">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar método de pago' : 'Nuevo método de pago'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? method.code : 'Completa los datos del nuevo método'}
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

            {/* Code — create only */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. TARJETA_CREDITO"
                  {...register('code')}
                  className={inputCls(errors.code)}
                />
                <p className="mt-1 text-xs text-gray-400">Solo mayúsculas, números y guion bajo. No editable después.</p>
                {errors.code && <FieldError msg={errors.code.message} />}
              </div>
            )}

            {/* Nombre visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre visible <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Tarjeta de crédito"
                {...register('nombre_visible')}
                className={inputCls(errors.nombre_visible)}
              />
              {errors.nombre_visible && <FieldError msg={errors.nombre_visible.message} />}
            </div>

            {/* Sort order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Orden de visualización
              </label>
              <input
                type="number"
                min="0"
                step="1"
                {...register('sort_order')}
                className={inputCls(errors.sort_order)}
              />
              <p className="mt-1 text-xs text-gray-400">Menor número aparece primero. 0 por defecto.</p>
              {errors.sort_order && <FieldError msg={errors.sort_order.message} />}
            </div>

            {/* Requires reference */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-700">Requiere referencia</p>
                <p className="text-xs text-gray-400 mt-0.5">Solicitar número de referencia al cobrar</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative w-10 h-6">
                  <input
                    type="checkbox"
                    {...register('requires_reference')}
                    className="sr-only peer"
                  />
                  <div className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            </div>

            {/* Estatus toggle — edit only */}
            {isEdit && (
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-700">Estado</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {method.code === 'EFECTIVO'
                      ? 'El método Efectivo no puede desactivarse'
                      : 'Desactivar oculta el método durante el cobro'}
                  </p>
                </div>
                <label className={`flex items-center gap-2.5 select-none ${method.code === 'EFECTIVO' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="relative w-10 h-6">
                    <input
                      type="checkbox"
                      {...register('estatus_activo')}
                      disabled={method.code === 'EFECTIVO'}
                      className="sr-only peer"
                    />
                    <div className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-600 min-w-[4rem]">
                    {isActivo ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isPending && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Guardar cambios' : 'Crear método'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
