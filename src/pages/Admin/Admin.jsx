import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants'
import Card from '../../components/ui/Card/Card'
import Table from '../../components/ui/Table/Table'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import {
  subscribe,
  getVersion,
  getOverview,
  getRecentRecords,
  getComplianceOverview,
} from '../../modules/admin/services/scanHistoryStore'
import '../../modules/admin/admin.css'

function StatCard({ icon, iconClass, value, label, trend, trendClass }) {
  return (
    <div className="m5-stat-card">
      <span className={`m5-stat-card__icon ${iconClass || ''}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="m5-stat-card__body">
        <p className="m5-stat-card__value">{value}</p>
        <p className="m5-stat-card__label">{label}</p>
        {trend && (
          <span className={`m5-stat-card__trend ${trendClass || ''}`}>
            <Icon name={trendClass === 'm5-stat-card__trend--down' ? 'trending-down' : 'trending-up'} size={14} />
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

const LEGEND = [
  { key: 'compliant', label: 'Compliant', color: '#138808' },
  { key: 'minorIssue', label: 'Minor Issue', color: '#b45309' },
  { key: 'majorViolation', label: 'Major Violation', color: '#b91c1c' },
  { key: 'pending', label: 'Pending Review', color: '#075985' },
]

function ComplianceOverviewChart({ data }) {
  const columns = data.length
  if (!columns) return null

  const maxTotal = Math.max(
    1,
    ...data.map(
      (row) =>
        row.compliant + row.minorIssue + row.majorViolation + row.pending,
    ),
  )
  const chartWidth = 560
  const chartHeight = 200
  const marginTop = 14
  const barWidth = Math.min(46, (chartWidth - 40) / columns - 12)
  const plotHeight = chartHeight - marginTop - 40

  return (
    <div className="m5-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Compliance overview by month"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = marginTop + plotHeight - fraction * plotHeight
          return (
            <line
              key={fraction}
              x1="10"
              y1={y}
              x2={chartWidth - 10}
              y2={y}
              stroke="#e4e9ef"
              strokeWidth="1"
            />
          )
        })}

        {data.map((row, index) => {
          const total =
            row.compliant + row.minorIssue + row.majorViolation + row.pending
          const x = 20 + index * ((chartWidth - 40) / columns) + 6
          let yCursor = marginTop + plotHeight

          return (
            <g key={row.month}>
              {LEGEND.filter((entry) => (row[entry.key] ?? 0) > 0)
                .map((entry) => {
                  const segmentHeight = (row[entry.key] / maxTotal) * plotHeight
                  const rect = (
                    <rect
                      key={entry.key}
                      className="m5-bar-seg"
                      x={x}
                      y={yCursor - segmentHeight}
                      width={barWidth}
                      height={segmentHeight}
                      fill={entry.color}
                    >
                      <title>
                        {row.month} — {entry.label}: {row[entry.key]}
                      </title>
                    </rect>
                  )
                  yCursor -= segmentHeight
                  return rect
                })}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {row.month}
              </text>
              <text
                x={x + barWidth / 2}
                y={marginTop + plotHeight - (total / maxTotal) * plotHeight - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#1f2933"
              >
                {total}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const RECENT_COLUMNS = [
  {
    key: 'id',
    header: 'Report ID',
    render: (row) => <span className="m5-report-id">{row.id}</span>,
  },
  { key: 'productName', header: 'Product' },
  { key: 'category', header: 'Category' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'complianceScore',
    header: 'Score',
    align: 'center',
    render: (row) => `${row.complianceScore}%`,
  },
  {
    key: 'violations',
    header: 'Violations',
    align: 'center',
    render: (row) => row.violations,
  },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [, setVersionState] = useState(() => getVersion())

  useEffect(() => subscribe(() => setVersionState(getVersion())), [])

  const overview = getOverview()
  const recentRecords = getRecentRecords(5)
  const complianceOverview = getComplianceOverview()

  return (
    <div className="m5-page">
      <PageHeader
        overline="PCLMCS · Officer Workspace"
        title="Admin Dashboard"
        description="Compliance administration, inspection history, verification and departmental analytics."
        actions={
          <Button
            variant="secondary"
            icon="refresh"
            onClick={() => setVersionState(getVersion())}
          >
            Refresh
          </Button>
        }
      />

      {overview.totalScans === 0 ? (
        <Card>
          <div className="m5-empty">
            <span className="m5-empty__icon">
              <Icon name="shield" size={26} />
            </span>
            <p>
              No compliance inspections have been recorded yet. Complete a scan
              and save the inspection report from the Compliance module to see
              live statistics here.
            </p>
            <Button variant="primary" icon="camera" onClick={() => navigate(ROUTES.SCAN)}>
              Go to Scan Product
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="m5-kpi-grid">
            <StatCard
              icon="barcode"
              value={overview.totalScans}
              label="Total Scans"
              trend={`${overview.totalScans} inspections on record`}
            />
            <StatCard
              icon="check-circle"
              iconClass="m5-stat-card__icon--green"
              value={overview.compliantProducts}
              label="Compliant Products"
              trend={`${overview.complianceRate}% compliance rate`}
            />
            <StatCard
              icon="alert-triangle"
              iconClass="m5-stat-card__icon--red"
              value={overview.violations}
              label="Violations"
            />
            <StatCard
              icon="clock"
              iconClass="m5-stat-card__icon--amber"
              value={overview.pendingReviews}
              label="Pending Reviews"
            />
          </div>

          <div className="m5-grid-2">
            <Card
              title="Compliance Overview"
              subtitle="Last six months of inspections"
              meta={
                <ul className="m5-chart-legend" aria-label="Chart legend">
                  {LEGEND.map((entry) => (
                    <li key={entry.key} className="m5-legend__item">
                      <span
                        className="m5-legend__dot"
                        style={{ background: entry.color }}
                        aria-hidden="true"
                      />
                      {entry.label}
                    </li>
                  ))}
                </ul>
              }
            >
              {complianceOverview.length ? (
                <ComplianceOverviewChart data={complianceOverview} />
              ) : (
                <p className="m5-hint">
                  Monthly trend will appear once inspections are recorded.
                </p>
              )}
            </Card>

            <Card
              title="Recent Inspections"
              subtitle="Latest compliance records"
              footer={
                <Button
                  variant="outline"
                  icon="history"
                  onClick={() => navigate(ROUTES.SCAN_HISTORY)}
                >
                  View all
                </Button>
              }
            >
              <Table
                dense
                columns={RECENT_COLUMNS}
                rows={recentRecords}
                emptyMessage="No inspections recorded yet."
              />
            </Card>
          </div>

          <Card title="Administrative Tools">
            <div className="m5-quick-links">
              <button
                type="button"
                className="m5-quick-link"
                onClick={() => navigate(ROUTES.SCAN_HISTORY)}
              >
                <Icon name="history" size={18} />
                Scan History
              </button>
              <button
                type="button"
                className="m5-quick-link"
                onClick={() => navigate(ROUTES.REPORTS)}
              >
                <Icon name="file-text" size={18} />
                PDF Reports
              </button>
              <button
                type="button"
                className="m5-quick-link"
                onClick={() => navigate(ROUTES.QR_VERIFICATION)}
              >
                <Icon name="qr" size={18} />
                QR Verification
              </button>
              <button
                type="button"
                className="m5-quick-link"
                onClick={() => navigate(ROUTES.ANALYTICS)}
              >
                <Icon name="chart" size={18} />
                Analytics
              </button>
              <button
                type="button"
                className="m5-quick-link"
                onClick={() => navigate(ROUTES.SETTINGS)}
              >
                <Icon name="settings" size={18} />
                Settings
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}