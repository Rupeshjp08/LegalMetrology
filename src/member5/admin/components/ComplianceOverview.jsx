import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import '../adminDashboard.css'

const SCAN_ACTIVITY = [
  { label: 'Total Scans', color: '#2563eb' },
  { label: 'Compliant', color: '#16a34a' },
  { label: 'Violations', color: '#dc2626' },
]

function ComplianceOverview({ data }) {
  return (
    <div className="dashboard-panel compliance-overview">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">Compliance Overview</h2>
        <div className="compliance-overview__legend">
          {SCAN_ACTIVITY.map((item) => (
            <span key={item.label} className="compliance-overview__legend-item">
              <span
                className="compliance-overview__legend-dot"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="compliance-overview__chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="month"
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
              cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar
              dataKey="compliant"
              name="Compliant"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="minorIssue"
              name="Minor Issue"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="majorViolation"
              name="Major Violation"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ComplianceOverview
