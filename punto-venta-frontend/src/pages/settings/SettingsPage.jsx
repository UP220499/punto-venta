import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePermission, PERMISSIONS } from '../../lib/permissions'
import { useSettings } from '../../features/settings/useSettings'
import { useUpdateSettings } from '../../features/settings/useUpdateSettings'

/* ── Zod schema ───────────────────────────────────────── */

const schema = z.object({
  currency_code:              z.string().min(3).max(3, 'Exactamente 3 caracteres (ej: MXN)'),
  currency_symbol:            z.string().min(1, 'Requerido').max(5),
  decimal_places:             z.coerce.number().int().min(0).max(4),
  timezone:                   z.string().min(1, 'Requerido').max(64),
  ticket_folio_prefix:        z.string().max(20),
  ticket_folio_next:          z.coerce.number().int().min(1, 'Debe ser al menos 1'),
  ticket_folio_padding:       z.coerce.number().int().min(0).max(12),
  tax_enabled:                z.boolean(),
  tax_rate_pct:               z.coerce.number().min(0).max(100),
  tax_included_in_price:      z.boolean(),
  ticket_paper_width:         z.coerce.number().refine((v) => v === 58 || v === 80, { message: 'Debe ser 58 o 80' }),
  ticket_header_text:         z.string().max(500),
  ticket_footer_text:         z.string().max(500),
  show_tax_breakdown:         z.boolean(),
  show_cashier_name:          z.boolean(),
  show_barcode_on_ticket:     z.boolean(),
  default_stock_minimo:       z.coerce.number().int().min(0),
  default_unidad:             z.string().min(1, 'Requerido').max(16),
  require_transfer_reference: z.boolean(),
})

/* ── helpers ──────────────────────────────────────────── */

function toFormValues(s) {
  return {
    currency_code:              s.currency_code,
    currency_symbol:            s.currency_symbol,
    decimal_places:             s.decimal_places,
    timezone:                   s.timezone,
    ticket_folio_prefix:        s.ticket_folio_prefix ?? '',
    ticket_folio_next:          s.ticket_folio_next,
    ticket_folio_padding:       s.ticket_folio_padding,
    tax_enabled:                s.tax_enabled,
    tax_rate_pct:               parseFloat((s.tax_rate * 100).toFixed(4)),
    tax_included_in_price:      s.tax_included_in_price,
    ticket_paper_width:         String(s.ticket_paper_width),
    ticket_header_text:         s.ticket_header_text ?? '',
    ticket_footer_text:         s.ticket_footer_text ?? '',
    show_tax_breakdown:         s.show_tax_breakdown,
    show_cashier_name:          s.show_cashier_name,
    show_barcode_on_ticket:     s.show_barcode_on_ticket,
    default_stock_minimo:       s.default_stock_minimo,
    default_unidad:             s.default_unidad,
    require_transfer_reference: s.require_transfer_reference,
  }
}

/* ── sub-components ───────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500'

/* ── page ─────────────────────────────────────────────── */

export function SettingsPage() {
  const canWrite = usePermission(PERMISSIONS.SETTINGS_WRITE)
  const { data: settings, isLoading, isError, error: loadError } = useSettings()
  const mutation = useUpdateSettings()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  // Populate form once settings are fetched
  useEffect(() => {
    if (settings) reset(toFormValues(settings))
  }, [settings, reset])

  // Auto-dismiss success indicator after 3 s
  useEffect(() => {
    if (mutation.isSuccess) {
      const t = setTimeout(() => mutation.reset(), 3000)
      return () => clearTimeout(t)
    }
  }, [mutation.isSuccess, mutation.reset])

  function onSubmit(values) {
    const {
      tax_rate_pct,
      ticket_folio_prefix,
      ticket_header_text,
      ticket_footer_text,
      ...rest
    } = values

    mutation.mutate({
      ...rest,
      tax_rate:            parseFloat((tax_rate_pct / 100).toFixed(4)),
      ticket_folio_prefix: ticket_folio_prefix || null,
      ticket_header_text:  ticket_header_text  || null,
      ticket_footer_text:  ticket_footer_text  || null,
    })
  }

  const disabled = !canWrite || mutation.isPending

  /* ── loading ──────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 gap-2">
        <svg className="animate-spin w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Cargando configuración...
      </div>
    )
  }

  /* ── error ────────────────────────────────────────────── */
  if (isError) {
    const msg =
      loadError?.response?.data?.error?.message ??
      loadError?.response?.data?.message ??
      loadError?.message ??
      'Error al cargar la configuración'
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <p className="text-sm text-red-700">{msg}</p>
        </div>
      </div>
    )
  }

  /* ── main render ──────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">Parámetros operativos del negocio</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {mutation.isError && (
            <p className="text-sm text-red-600">
              {mutation.error?.response?.data?.error?.message ??
               mutation.error?.response?.data?.message ??
               'Error al guardar'}
            </p>
          )}
          {mutation.isSuccess && (
            <p className="text-sm text-green-600 font-medium">Configuración guardada</p>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

          {/* Read-only notice */}
          {!canWrite && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-sm text-amber-700">Solo tienes permiso de lectura. Los cambios no pueden guardarse.</p>
            </div>
          )}

          {/* 1 — Información general */}
          <Section title="Información general">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Zona horaria" hint="Nombre IANA, ej: America/Mexico_City" error={errors.timezone?.message}>
                <input
                  {...register('timezone')}
                  disabled={disabled}
                  className={inputCls}
                  placeholder="America/Mexico_City"
                />
              </Field>
              <Field label="Moneda" hint="Código ISO 4217 (3 chars)" error={errors.currency_code?.message}>
                <input
                  {...register('currency_code')}
                  disabled={disabled}
                  className={inputCls}
                  placeholder="MXN"
                />
              </Field>
              <Field label="Símbolo de moneda" error={errors.currency_symbol?.message}>
                <input
                  {...register('currency_symbol')}
                  disabled={disabled}
                  className={inputCls}
                  placeholder="$"
                />
              </Field>
              <Field label="Decimales en precios" hint="0 – 4" error={errors.decimal_places?.message}>
                <input
                  {...register('decimal_places')}
                  type="number"
                  min={0}
                  max={4}
                  disabled={disabled}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* 2 — Folio de tickets */}
          <Section title="Folio de tickets">
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Prefijo" hint="Ej: V, T, FAC" error={errors.ticket_folio_prefix?.message}>
                <input
                  {...register('ticket_folio_prefix')}
                  disabled={disabled}
                  className={inputCls}
                  placeholder="V"
                />
              </Field>
              <Field label="Siguiente número" error={errors.ticket_folio_next?.message}>
                <input
                  {...register('ticket_folio_next')}
                  type="number"
                  min={1}
                  disabled={disabled}
                  className={inputCls}
                />
                <div className="mt-1.5 flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-700">Reducir este valor puede generar folios duplicados si ya existen tickets con números mayores.</p>
                </div>
              </Field>
              <Field label="Dígitos (padding)" hint="0–12, rellena con ceros" error={errors.ticket_folio_padding?.message}>
                <input
                  {...register('ticket_folio_padding')}
                  type="number"
                  min={0}
                  max={12}
                  disabled={disabled}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* 3 — Impuestos */}
          <Section title="Impuestos">
            <div className="space-y-4">
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-amber-700">
                  La configuración de impuestos se almacena pero el cálculo automático al cerrar tickets aún no está implementado en el backend. Si habilitas impuestos con "incluido en precio", los precios se asumen con IVA incluido (solo informativo).
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  {...register('tax_enabled')}
                  type="checkbox"
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-700">Habilitar impuestos</span>
              </label>
              <div className="grid grid-cols-2 gap-x-6">
                <Field label="Tasa de impuesto (%)" hint="Ej: 16 = IVA 16%" error={errors.tax_rate_pct?.message}>
                  <input
                    {...register('tax_rate_pct')}
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    disabled={disabled}
                    className={inputCls}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  {...register('tax_included_in_price')}
                  type="checkbox"
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Impuesto incluido en precio</span>
              </label>
            </div>
          </Section>

          {/* 4 — Ticket impreso */}
          <Section title="Ticket impreso">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6">
                <Field label="Ancho del papel" error={errors.ticket_paper_width?.message}>
                  <select
                    {...register('ticket_paper_width')}
                    disabled={disabled}
                    className={inputCls}
                  >
                    <option value="58">58 mm</option>
                    <option value="80">80 mm</option>
                  </select>
                </Field>
              </div>
              <Field label="Encabezado" hint="Texto al inicio del ticket" error={errors.ticket_header_text?.message}>
                <textarea
                  {...register('ticket_header_text')}
                  disabled={disabled}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Bienvenido"
                />
              </Field>
              <Field label="Pie de página" hint="Texto al final del ticket" error={errors.ticket_footer_text?.message}>
                <textarea
                  {...register('ticket_footer_text')}
                  disabled={disabled}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Gracias por su compra"
                />
              </Field>
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    {...register('show_tax_breakdown')}
                    type="checkbox"
                    disabled={disabled}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Mostrar desglose de impuestos</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    {...register('show_cashier_name')}
                    type="checkbox"
                    disabled={disabled}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Mostrar nombre del cajero</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    {...register('show_barcode_on_ticket')}
                    type="checkbox"
                    disabled={disabled}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700">Mostrar código de barras</span>
                </label>
              </div>
            </div>
          </Section>

          {/* 5 — Inventario */}
          <Section title="Inventario">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Stock mínimo predeterminado" error={errors.default_stock_minimo?.message}>
                  <input
                    {...register('default_stock_minimo')}
                    type="number"
                    min={0}
                    disabled={disabled}
                    className={inputCls}
                  />
                </Field>
                <Field label="Unidad predeterminada" hint="Ej: pz, kg, lt" error={errors.default_unidad?.message}>
                  <input
                    {...register('default_unidad')}
                    disabled={disabled}
                    className={inputCls}
                    placeholder="pz"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  {...register('require_transfer_reference')}
                  type="checkbox"
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Requerir referencia en transferencias</span>
              </label>
            </div>
          </Section>

          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
