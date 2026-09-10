import { useMemo, useSyncExternalStore } from 'react'
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import AdminLayout from '../admin/components/AdminLayout'
import AnalyticsCards from './components/AnalyticsCards'
import ComplianceChart from './components/ComplianceChart'
import ViolationChart from './components/ViolationChart'
import {
  getAnalyticsData,
  hasAnalyticsData,
} from './analyticsService'
import { subscribe, getChangeVersion } from '../shared/scanDataService'
import '../admin/adminDashboard.css'
import './analytics.css'

function ScanTrend({ data }) {
  const rows = data.labels.map((label, index) => ({
    day: label,
    scans: data.values[index] || 0,
  }))

  return (
    <div className="dashboard-panel analytics-chart analytics-chart--full">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">Scan Trend</h2>
        <span className="dashboard-panel__hint">Scans per day (last 7 days)</span>
      </div>
      <div className="analytics-chart__body analytics-chart__body--trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={rows}
            margin={{ top: 10, right: 20, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scanTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
              formatter={(value) => [value, 'Scans']}
            />
            <Area
              type="monotone"
              dataKey="scans"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#scanTrendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Small bar legend strip */}
      <div className="analytics-chart__days">
        {rows.map((row) => (
          <div key={row.day} className="analytics-chart__day">
            <span className="analytics-chart__day-bar" style={{ height: `${(row.scans / Math.max(...data.values)) * 100}%` }} />
            <span className="analytics-chart__day-label">{row.day}</span>
            <span className="analytics-chart__day-value">{row.scans}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplianceRate({ rate }) {
  const rows = [
    { name: 'Compliant', value: rate, color: '#16a34a' },
    { name: 'Remainder', value: Math.max(0, 100 - rate), color: '#e2e8f0' },
  ]

  return (
    <div className="dashboard-panel analytics-chart">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">Compliance Rate</h2>
        <span className="dashboard-panel__hint">Overall compliance</span>
      </div>
      <div className="analytics-rate">
        <div className="analytics-rate__gauge">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={-270}
                innerRadius="70%"
                outerRadius="100%"
                stroke="none"
                cornerRadius={6}
              >
                {rows.map((row) => (
                  <Cell key={row.name} fill={row.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="analytics-rate__center">
            <span className="analytics-rate__value">{rate}%</span>
            <span className="analytics-rate__label">Compliant</span>
          </div>
        </div>
        <div className="analytics-rate__legend">
          <span className="analytics-rate__legend-item">
            <span className="analytics-rate__dot" style={{ background: '#16a34a' }} />
            Compliant
          </span>
          <span className="analytics-rate__legend-item">
            <span className="analytics-rate__dot" style={{ background: '#e2e8f0' }} />
            Non-compliant / Pending
          </span>
        </div>
      </div>
    </div>
  )
}

function NoData() {
  return (
    <div className="analytics-empty">
      <BarChart3 size={40} aria-hidden="true" />
      <p>No analytics data available</p>
    </div>
  )
}

function Analytics() {
  const changeVersion = useSyncExternalStore(
    (callback) => subscribe(callback),
    getChangeVersion
  )

  const data = useMemo(() => {
    void changeVersion
    return getAnalyticsData()
  }, [changeVersion])

  if (!hasAnalyticsData(data)) {
    return (
      <AdminLayout>
        <div className="admin-page analytics-page">
          <div className="admin-page__header">
            <div>
              <h1 className="admin-page__heading">Analytics</h1>
              <p className="admin-page__subheading">
                Monitor compliance trends and violation statistics
              </p>
            </div>
          </div>
          <NoData />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page analytics-page">
        <div className="admin-page__header">
          <div>
            <h1 className="admin-page__heading">Analytics</h1>
            <p className="admin-page__subheading">
              Monitor compliance trends and violation statistics
            </p>
          </div>
        </div>

        <AnalyticsCards data={data} />

        <div className="analytics-grid">
          <ComplianceChart data={data.compliance} />
          <ViolationChart data={data.violations} />
        </div>

        <ScanTrend data={data.scanTrend} />

        <div className="analytics-grid analytics-grid--single">
          <ComplianceRate rate={data.complianceRate.rate} />
        </div>
      </div>
    </AdminLayout>
  )
}

export default Analytics