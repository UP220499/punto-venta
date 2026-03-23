import { useState } from 'react'
import { usePaymentMethods } from '../../features/payment-methods/usePaymentMethods'
import { useUpdatePaymentMethod } from '../../features/payment-methods/useUpdatePaymentMethod'
import { usePermission, PERMISSIONS } from '../../lib/permissions'
import { PaymentMethodFormModal } from './PaymentMethodFormModal'

/* ── icons ──────────────────────────────────────────────── */

function IconSpinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-[--brand]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

/* ── sub-components ─────────────────────────────────────── */

function StatusBadge({ estatus }) {
  if (estatus === 'ACTIVO') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Inactivo
    </span>
  )
}

function CodeBadge({ code }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">
      {code}
    </span>
  )
}

function BoolBadge({ value }) {
  return value ? (
    <span className="text-emerald-600 font-medium text-xs">Sí</span>
  ) : (
    <span className="text-gray-400 text-xs">No</span>
  )
}

function EmptyState({ onNew, canWrite }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">No hay métodos de pago registrados</p>
      {canWrite && (
        <button
          type="button"
          onClick={onNew}
          className="btn-brand mt-1 px-4 py-2 rounded-lg text-sm"
        >
          Agregar primer método
        </button>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────── */

export function PaymentMethodsPage() {
  const canWrite = usePermission(PERMISSIONS.PAYMENT_METHOD_WRITE)
  const { data, isLoading, isError, error } = usePaymentMethods()
  const { mutate: doUpdate } = useUpdatePaymentMethod()

  const [modalOpen, setModalOpen]       = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)

  const methods = data?.items ?? []

  function openCreate() {
    setEditingMethod(null)
    setModalOpen(true)
  }

  function openEdit(m) {
    setEditingMethod(m)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingMethod(null)
  }

  function handleToggleEstatus(m) {
    const nextEstatus = m.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    doUpdate({ paymentMethodId: m.payment_method_id, estatus: nextEstatus })
  }

  return (
    <>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Métodos de pago</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {methods.length > 0
                ? `${methods.length} método${methods.length !== 1 ? 's' : ''} configurado${methods.length !== 1 ? 's' : ''}`
                : 'Configura los métodos disponibles en el punto de venta'}
            </p>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="btn-brand flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo método
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
              <IconSpinner />
              <span className="text-sm">Cargando métodos de pago…</span>
            </div>
          )}

          {isError && (
            <p className="text-center text-sm text-red-500 py-16">
              {error?.response?.data?.error?.message ?? 'Error al cargar métodos de pago. Intenta de nuevo.'}
            </p>
          )}

          {!isLoading && !isError && methods.length === 0 && (
            <EmptyState onNew={openCreate} canWrite={canWrite} />
          )}

          {!isLoading && !isError && methods.length > 0 && (
            <div className="px-6 py-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Requiere ref.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Permite cambio
                      </th>
                      {canWrite && (
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {methods.map((m) => (
                      <tr key={m.payment_method_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{m.nombre_visible}</p>
                          <div className="mt-1">
                            <CodeBadge code={m.code} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge estatus={m.estatus} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {m.sort_order}
                        </td>
                        <td className="px-4 py-3">
                          <BoolBadge value={m.requires_reference} />
                        </td>
                        <td className="px-4 py-3">
                          <BoolBadge value={m.allows_change} />
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle estatus — disabled for EFECTIVO */}
                              <button
                                type="button"
                                onClick={() => handleToggleEstatus(m)}
                                disabled={m.code === 'EFECTIVO'}
                                title={
                                  m.code === 'EFECTIVO'
                                    ? 'El método Efectivo no puede desactivarse'
                                    : m.estatus === 'ACTIVO'
                                    ? 'Desactivar método'
                                    : 'Activar método'
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                  m.estatus === 'ACTIVO'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {m.estatus === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(m)}
                                title="Editar método"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[--brand] hover:bg-[--brand]/10 transition-colors"
                              >
                                <IconEdit />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaymentMethodFormModal
        isOpen={modalOpen}
        method={editingMethod}
        onClose={handleCloseModal}
      />
    </>
  )
}
