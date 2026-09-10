import { useMemo, useSyncExternalStore } from 'react'
import { ScanLine, ShieldCheck, AlertTriangle, Clock } from 'lucide-react'
import AdminLayout from './components/AdminLayout'
import StatCard from './components/StatCard'
import RecentScans from './components/RecentScans'
import ComplianceOverview from './components/ComplianceOverview'
import {
  getDashboardOverview,
  getRecentScans,
  getComplianceOverview,
} from './adminService'
import {
  subscribe,
  getChangeVersion,
} from '../shared/scanDataService'
import './adminDashboard.css'

function subscribeToScans(callback) {
  return subscribe(callback)
}

function EmptyDashboard() {
  return (
    <div className="admin-stats">
      <StatCard title="Total Scans" value={0} icon={ScanLine} accent="blue" subtitle="All commodity scans to date" />
      <StatCard title="Compliant Products" value={0} icon={ShieldCheck} accent="green" subtitle="Met all labelling & MRP requirements" />
      <StatCard title="Violations" value={0} icon={AlertTriangle} accent="red" subtitle="Non-compliant packaged commodities" />
      <StatCard title="Pending Reviews" value={0} icon={Clock} accent="amber" subtitle="Awaiting manual verification" />
      <div className="dashboard-empty">
        <p>No scan data available</p>
        <span>Scans recorded by the compliance workflow will appear here automatically.</span>
      </div>
    </div>
  )
}

function AdminDashboard() {
  // Re-render whenever the shared scan store changes (new scan / status update).
  const changeVersion = useSyncExternalStore(subscribeToScans, getChangeVersion)

  const { overview, recentScans, complianceOverview } = useMemo(() => {
    void changeVersion
    return {
      overview: getDashboardOverview(),
      recentScans: getRecentScans(8),
      complianceOverview: getComplianceOverview(),
    }
  }, [changeVersion])

  const handleViewResult = (scan) => {
    // TODO(Member 5): Navigate to the full scan report / detail page once the
    // Scan History / Reports module is built. For now, log to console (UI test).
    console.log('View result for scan:', scan)
  }

  if (overview.totalScans === 0) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="admin-page__header">
            <div>
              <h1 className="admin-page__heading">Admin Dashboard</h1>
              <p className="admin-page__subheading">
                Overview of system activity and compliance status
              </p>
            </div>
            <div className="admin-page__filters">
              <span className="admin-page__date">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <EmptyDashboard />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page__header">
          <div>
            <h1 className="admin-page__heading">Admin Dashboard</h1>
            <p className="admin-page__subheading">
              Overview of system activity and compliance status
            </p>
          </div>
          <div className="admin-page__filters">
            <span className="admin-page__date">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <button type="button" className="admin-page__filter-btn">
              Last 30 days
            </button>
          </div>
        </div>

        <div className="admin-stats">
          <StatCard
            title="Total Scans"
            value={overview.totalScans}
            icon={ScanLine}
            accent="blue"
            subtitle="All commodity scans to date"
          />
          <StatCard
            title="Compliant Products"
            value={overview.compliantProducts}
            icon={ShieldCheck}
            accent="green"
            badge={`${overview.complianceRate}%`}
            subtitle="Met all labelling & MRP requirements"
          />
          <StatCard
            title="Violations"
            value={overview.violations}
            icon={AlertTriangle}
            accent="red"
            subtitle="Non-compliant packaged commodities"
          />
          <StatCard
            title="Pending Reviews"
            value={overview.pendingReviews}
            icon={Clock}
            accent="amber"
            subtitle="Awaiting manual verification"
          />
        </div>

        <ComplianceOverview data={complianceOverview} />

        <RecentScans scans={recentScans} onViewResult={handleViewResult} />
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard