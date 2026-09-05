import ModulePlaceholder from '../ModulePlaceholder/ModulePlaceholder'

/**
 * Admin page foundation.
 * System management and audit functionality will be implemented
 * by the admin module.
 */
export default function Admin() {
  return (
    <ModulePlaceholder
      title="System Administration"
      breadcrumb="Admin"
      description="Audit logs, user administration and system management."
    />
  )
}