import { ScanLine, ShieldCheck, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import '../analytics.css'
import '../../admin/adminDashboard.css'

function TrendPill({ trend }) {
  const isPositive = trend.startsWith('+')
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span
      className={`analytics-card__trend ${
        isPositive ? 'analytics-card__trend--up' : 'analytics-card__trend--down'
      }`}
    >
      <Icon size={12} aria-hidden="true" />
      {trend}
    </span>
  )
}

function AnalyticsCard({ title, value, icon: Icon, accent, trend, subtitle }) {
  const accentClass = `analytics-card analytics-card--${accent}`

  return (
    <div className={accentClass}>
      <div className="analytics-card__icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="analytics-card__body">
        <div className="analytics-card__value">{value.toLocaleString()}</div>
        <div className="analytics-card__title">{title}</div>
        <div className="analytics-card__meta">
          {trend && <TrendPill trend={trend} />}
          {subtitle && <span className="analytics-card__subtitle">{subtitle}</span>}
        </div>
      </div>
    </div>
  )
}

function AnalyticsCards({ data }) {
  const { summary } = data
  const complianceRate = Math.round(
    (summary.compliant / Math.max(1, summary.totalScans)) * 100
  )

  return (
    <div className="analytics-cards">
      <AnalyticsCard
        title="Total Scans"
        value={summary.totalScans}
        icon={ScanLine}
        accent="blue"
        trend={summary.trends.totalScans}
        subtitle="vs last month"
      />
      <AnalyticsCard
        title="Compliant"
        value={summary.compliant}
        icon={ShieldCheck}
        accent="green"
        trend={summary.trends.compliant}
        subtitle={`${complianceRate}% of scans`}
      />
      <AnalyticsCard
        title="Violations"
        value={summary.violations}
        icon={AlertTriangle}
        accent="red"
        trend={summary.trends.violations}
        subtitle="vs last month"
      />
      <AnalyticsCard
        title="Pending Reviews"
        value={summary.pending}
        icon={Clock}
        accent="amber"
        trend={summary.trends.pending}
        subtitle="Awaiting review"
      />
    </div>
  )
}

export default AnalyticsCards