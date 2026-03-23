import { useState } from 'react'
import { useRoles } from '../../features/roles/useRoles'
import { usePermission, PERMISSIONS } from '../../lib/permissions'
import { RolePermissionsModal } from './RolePermissionsModal'

/* ── icons ──────────────────────────────────────────────── */

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

/* ── role badge ─────────────────────────────────────────── */

const ROLE_COLORS = {
  ADMIN:      'bg-indigo-100 text-indigo-700',
  CAJERO:     'bg-emerald-100 text-emerald-700',
  INVENTARIO: 'bg-amber-100 text-amber-700',
}

function RoleCodeBadge({ code }) {
  const cls = ROLE_COLORS[code] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
      {code}
    </span>
  )
}

/* ── component ──────────────────────────────────────────── */

export function RolesPage() {
  const { data: roles, isLoading, isError, error } = useRoles()
  const canWrite = usePermission(PERMISSIONS.ROLE_WRITE)
  const [editingRole, setEditingRole] = useState(null)

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Roles y permisos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los permisos asignados a cada rol del sistema
          </p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-28 bg-gray-100 rounded" />
                  </div>
                  <div className="h-8 w-32 bg-gray-100 rounded-lg" />
                </div>
                <div className="mt-3 flex gap-1.5">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-5 w-20 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <span>{error?.response?.data?.message ?? error?.message ?? 'Error cargando roles'}</span>
          </div>
        )}

        {/* Role cards */}
        {!isLoading && !isError && (
          <div className="space-y-3">
            {roles?.map((role) => {
              const isAdmin = role.code === 'ADMIN'
              const permCount = role.permissions.length

              return (
                <div
                  key={role.role_id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-semibold text-gray-900">{role.nombre}</h2>
                          <RoleCodeBadge code={role.code} />
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <LockIcon />
                              No editable
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {isAdmin
                            ? 'Acceso completo — todos los permisos del sistema'
                            : permCount === 0
                            ? 'Sin permisos asignados'
                            : `${permCount} permiso${permCount !== 1 ? 's' : ''} asignado${permCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>

                    {canWrite && !isAdmin && (
                      <button
                        type="button"
                        onClick={() => setEditingRole(role)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-[--brand] border border-[--brand]/25 hover:bg-[--brand]/10 transition-colors shrink-0"
                      >
                        <PencilIcon />
                        Editar permisos
                      </button>
                    )}
                  </div>

                  {/* Permission preview pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {isAdmin ? (
                      <span className="text-xs text-gray-400 italic">
                        Todos los permisos del sistema
                      </span>
                    ) : permCount === 0 ? (
                      <span className="text-xs text-gray-400 italic">Sin permisos</span>
                    ) : (
                      <>
                        {role.permissions.slice(0, 8).map((code) => (
                          <span
                            key={code}
                            className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-mono"
                          >
                            {code}
                          </span>
                        ))}
                        {permCount > 8 && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-400 text-xs">
                            +{permCount - 8} más
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <RolePermissionsModal
        role={editingRole}
        isOpen={editingRole != null}
        onClose={() => setEditingRole(null)}
      />
    </>
  )
}
