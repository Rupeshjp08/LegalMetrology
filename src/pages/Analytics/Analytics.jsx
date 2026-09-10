import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants'
import Card from '../../components/ui/Card/Card'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import { subscribe, getVersion } from '../../modules/admin/services/scanHistoryStore'
import { getAnalytics, hasAnalyticsData } from '../../modules/admin/services/analyticsService'
import '../../modules/admin/admin.css'

const DONUT_COLORS = {
  compliant: '#138808',
  minorIssue: '#b45309',
  majorViolation: '#b91c1c',
  pending: '#075985',
}

const DONUT_LABELS = {
  compliant: 'Compliant',
  minorIssue: 'Minor Issue',
  majorViolation: 'Major Violation',
  pending: 'Pending Review',
}

function SummaryCard({ icon, iconClass, label, value, trend, rising }) {
  return (
    <div className="m5-stat-card">
      <span className={`m5-stat-card__icon ${iconClass || ''}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="m5-stat-card__body">
        <p className="m5-stat-card__value">{value}</p>
        <p className="m5-stat-card__label">{label}</p>
        {trend && (
          <span
            className={`m5-stat-card__trend ${
              rising ? 'm5-stat-card__trend--up' : 'm5-stat-card__trend--down'
            }`}
          >
            <Icon name={rising ? 'trending-up' : 'trending-down'} size={14} />
            {trend} vs yesterday
          </span>
        )}
      </div>
    </div>
  )
}

function DonutChart({ compliance, rate }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const total = Object.values(compliance).reduce((sum, value) => sum + value, 0)

  if (!total) return null

  let offset = 0
  const segments = Object.keys(compliance)
    .filter((key) => compliance[key] > 0)
    .map((key) => {
      const fraction = compliance[key] / total
      const segment = (
        <circle
          key={key}
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={DONUT_COLORS[key]}
          strokeWidth="18"
          strokeDasharray={`${fraction * circumference} ${circumference}`}
          strokeDashoffset={-offset}
          transform="rotate(-90 80 80)"
        >
          <title>{`${DONUT_LABELS[key]}: ${compliance[key]}`}</title>
        </circle>
      )
      offset += fraction * circumference
      return segment
    })

  return (
    <div className="m5-chart">
      <svg viewBox="0 0 160 160" role="img" aria-label="Compliance status breakdown">
        {segments}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#1f2933"
        >
          {rate}%
        </text>
        <text
          x="80"
          y="94"
          textAnchor="middle"
          fontSize="9"
          fill="#6b7280"
        >
          compliance rate
        </text>
      </svg>
      <ul className="m5-chart-legend" aria-label="Chart legend">
        {Object.keys(compliance)
          .filter((key) => compliance[key] > 0)
          .map((key) => (
            <li key={key} className="m5-legend__item">
              <span
                className="m5-legend__dot"
                style={{ background: DONUT_COLORS[key] }}
                aria-hidden="true"
              />
              {DONUT_LABELS[key]} ({compliance[key]})
            </li>
          ))}
      </ul>
    </div>
  )
}

function TrendChart({ data }) {
  const { labels, values } = data
  const max = Math.max(1, ...values)
  const chartWidth = 520
  const chartHeight = 190
  const marginTop = 14
  const barWidth = Math.min(40, (chartWidth - 40) / labels.length - 10)
  const plotHeight = chartHeight - marginTop - 40

  return (
    <div className="m5-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Scans over the last seven days"
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

        {values.map((value, index) => {
          const x = 20 + index * ((chartWidth - 40) / labels.length) + 6
          const barHeight = (value / max) * plotHeight
          return (
            <g key={`${labels[index]}-${index}`}>
              <rect
                className="m5-bar-seg"
                x={x}
                y={marginTop + plotHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill={index === values.length - 1 ? '#003366' : '#0d4a8f'}
              >
                <title>{`${labels[index]}: ${value} scan(s)`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={marginTop + plotHeight - barHeight - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#1f2933"
              >
                {value}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {labels[index]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ViolationBreakdown({ items }) {
  if (!items.length) {
    return <p className="m5-hint">No violations recorded across inspections.</p>
  }

  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <div className="m5-chart">
      {items.map((item) => (
        <div key={item.name} style={{ marginBottom: 'var(--space-3)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 6,
            }}
          >
            <span style={{ fontWeight: 600 }}>{item.name}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{item.value}</span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-subtle)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: '100%',
                background: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const [, setVersionState] = useState(() => getVersion())

  useEffect(() => subscribe(() => setVersionState(getVersion())), [])

  const analytics = getAnalytics()

  if (!hasAnalyticsData(analytics)) {
    return (
      <div className="m5-page">
        <PageHeader
          overline="PCLMCS · Officer Workspace"
          title="Analytics"
          description="Departmental statistics derived from the recorded compliance inspections."
        />
        <Card>
          <div className="m5-empty">
            <span className="m5-empty__icon">
              <Icon name="chart" size={26} />
            </span>
            <p>
              No inspection data is available to analyse yet. Record and save compliance
              scans to generate departmental analytics.
            </p>
            <Button variant="primary" icon="camera" onClick={() => navigate(ROUTES.SCAN)}>
              Go to Scan Product
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const trends = analytics.summary.trends
  const risingByKey = {
    totalScans: !String(trends.totalScans).startsWith('+') && trends.totalScans !== '0%',
    compliant: !String(trends.compliant).startsWith('+') && trends.compliant !== '0%',
    violations: String(trends.violations).startsWith('+'),
    pending: String(trends.pending).startsWith('+'),
  }

  return (
    <div className="m5-page">
      <PageHeader
        overline="PCLMCS · Officer Workspace"
        title="Analytics"
        description="Departmental statistics derived from the recorded compliance inspections."
        actions={
          <Button variant="secondary" icon="refresh" onClick={() => setVersionState(getVersion())}>
            Refresh
          </Button>
        }
      />

      <div className="m5-kpi-grid">
        <SummaryCard
          icon="barcode"
          value={analytics.summary.totalScans}
          label="Total Scans"
          trend={trends.totalScans}
          rising={risingByKey.totalScans}
        />
        <SummaryCard
          icon="check-circle"
          iconClass="m5-stat-card__icon--green"
          value={analytics.summary.compliant}
          label="Compliant"
          trend={trends.compliant}
          rising={risingByKey.compliant}
        />
        <SummaryCard
          icon="alert-triangle"
          iconClass="m5-stat-card__icon--red"
          value={analytics.summary.violations}
          label="Violations"
          trend={trends.violations}
          rising={risingByKey.violations}
        />
        <SummaryCard
          icon="clock"
          iconClass="m5-stat-card__icon--amber"
          value={analytics.summary.pending}
          label="Pending"
          trend={trends.pending}
          rising={risingByKey.pending}
        />
      </div>

      <div className="m5-grid-2">
        <Card title="Compliance Status" subtitle="Distribution across all inspections">
          <DonutChart compliance={analytics.compliance} rate={analytics.complianceRate.rate} />
        </Card>

        <Card title="Violation Categories" subtitle="Most frequent declaration issues">
          <ViolationBreakdown items={analytics.violations} />
        </Card>
      </div>

      <Card title="Inspection Volume" subtitle="Scan count over the last seven days">
        <TrendChart data={analytics.scanTrend} />
      </Card>
    </div>
  )
}