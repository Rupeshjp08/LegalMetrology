import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Card from '../../components/ui/Card/Card'
import './ModulePlaceholder.css'

/**
 * Reusable placeholder shown for modules that are under development.
 */
export default function ModulePlaceholder({ title, description, breadcrumb }) {
  return (
    <div className="container">
      <PageHeader
        overline={breadcrumb || 'Module'}
        title={title}
        description={description}
        actions={<StatusBadge status="in-development" label="Under development" />}
      />
      <Card>
        <div className="module-placeholder">
          <span className="module-placeholder__marker" aria-hidden="true" />
          <h2 className="module-placeholder__title">Module under development</h2>
          <p className="module-placeholder__text">
            This module is part of the application foundation and will be built
            by the assigned development team. Basic browsing, layouts, routing,
            and the design system are in place and ready for feature work.
          </p>
        </div>
      </Card>
    </div>
  )
}