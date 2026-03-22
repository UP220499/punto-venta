import { useEffect, useState } from 'react'
import { useAllPermissions } from '../../features/roles/useAllPermissions'
import { useSetRolePermissions } from '../../features/roles/useSetRolePermissions'

/* ── permission grouping ────────────────────────────────── */

const GROUP_LABELS = {
  DASHBOARD: 'Dashboard',
  PRODUCT:   'Productos',
  INVENTORY: 'Inventario',
  SALE:      'Ventas',
  REPORT:    'Reportes',
  SETTINGS:  'Configuración',
  USER:      'Usuarios',
  PAYMENT:   'Métodos de pago',
  ROLE:      'Roles',
  AUDIT:     'Auditoría',
}

// Group permissions by the first segment of their code (before first underscore)
function groupPermissions(permissions) {
  const groups = {}
  for (const p of permissions) {
    const prefix = p.code.split('_')[0]
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(p)
  }
  return groups
}

/* ── helpers ────────────────────────────────────────────── */

function extractError(err) {
  if (!err) return null
  return (
    err.response?.data?.message ??
    err.response?.data?.error?.message ??
    err.message ??
    'Error desconocido'
  )
}

/* ── group header with indeterminate checkbox ───────────── */

function GroupHeader({ prefix, groupCodes, selected, onToggleGroup }) {
  const checkedCount = groupCodes.filter((c) => selected.includes(c)).length
  const allChecked = checkedCount === groupCodes.length
  const someChecked = checkedCount > 0 && !allChecked
  const label = GROUP_LABELS[prefix] ?? prefix

  return (
    <button
      type="button"
      onClick={() => onToggleGroup(groupCodes)}
      className="flex items-center gap-2 mb-2 group w-full text-left"
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
          allChecked
            ? 'bg-indigo-600 border-indigo-600'
            : someChecked
            ? 'bg-indigo-200 border-indigo-400'
            : 'border-gray-300 bg-white'
        }`}
      >
        {allChecked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {someChecked && <div className="w-2 h-0.5 bg-indigo-600 rounded" />}
      </div>
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider group-hover:text-gray-900 transition-colors">
        {label}
      </span>
      <span className="text-xs text-gray-400">
        {checkedCount}/{groupCodes.length}
      </span>
    </button>
  )
}

/* ── component ──────────────────────────────────────────── */

export function RolePermissionsModal({ role, isOpen, onClose }) {
  const { data: allPermissions = [], isLoading: loadingPerms } = useAllPermissions()
  const {
    mutate: save,
    isPending: saving,
    error: saveErr,
    reset: resetMutation,
  } = useSetRolePermissions()

  const [selected, setSelected] = useState([])

  // Reset selected codes whenever the modal opens with a new role
  useEffect(() => {
    if (!isOpen || !role) return
    resetMutation()
    setSelected(role.permissions ?? [])
  }, [isOpen, role]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !role) return null

  const groups = groupPermissions(allPermissions)
  const serverError = extractError(saveErr)

  function togglePermission(code) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  function toggleGroup(groupCodes) {
    const allChecked = groupCodes.every((c) => selected.includes(c))
    if (allChecked) {
      setSelected((prev) => prev.filter((c) => !groupCodes.includes(c)))
    } else {
      setSelected((prev) => {
        const toAdd = groupCodes.filter((c) => !prev.includes(c))
        return [...prev, ...toAdd]
      })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    save({ roleId: role.role_id, permissionCodes: selected }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={!saving ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Editar permisos</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {role.nombre}{' '}
              <span className="font-mono text-xs text-gray-400">({role.code})</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 ml-4 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Permissions loading skeleton */}
            {loadingPerms && (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded" />
                    <div className="space-y-1.5">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-10 bg-gray-100 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Permission groups */}
            {!loadingPerms &&
              Object.entries(groups).map(([prefix, perms]) => {
                const groupCodes = perms.map((p) => p.code)

                return (
                  <div key={prefix}>
                    <GroupHeader
                      prefix={prefix}
                      groupCodes={groupCodes}
                      selected={selected}
                      onToggleGroup={toggleGroup}
                    />
                    <div className="space-y-1 pl-1">
                      {perms.map((perm) => {
                        const checked = selected.includes(perm.code)
                        return (
                          <label
                            key={perm.code}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(perm.code)}
                              className="w-4 h-4 mt-0.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-gray-800 font-medium leading-tight">
                                {perm.code}
                              </p>
                              {perm.descripcion && (
                                <p className="text-xs text-gray-400 mt-0.5">{perm.descripcion}</p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
            <span className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{selected.length}</span>
              {' '}de {allPermissions.length} permisos seleccionados
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {saving && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
