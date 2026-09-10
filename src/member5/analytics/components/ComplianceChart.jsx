import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import '../../admin/adminDashboard.css'
import '../analytics.css'

function ComplianceChart({ data }) {
  // Convert the flat compliance object into chart-friendly rows.
  const rows = [
    { name: 'Compliant', value: data.compliant },
    { name: 'Minor Issue', value: data.minorIssue },
    { name: 'Major Violation', value: data.majorViolation },
    { name: 'Pending', value: data.pending },
  ]

  return (
    <div className="dashboard-panel analytics-chart">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">Compliance Overview</h2>
        <span className="dashboard-panel__hint">By scan outcome</span>
      </div>
      <div className="analytics-chart__body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(15, 36, 64, 0.05)' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
              formatter={(value) => [value, 'Scans']}
            />
            <Bar
              dataKey="value"
              name="Scans"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
            >
              {/* Per-category color via cell */}
              {rows.map((row, index) => {
                const colors = ['#16a34a', '#f59e0b', '#dc2626', '#2563eb']
                return (
                  <Cell key={`cell-${row.name}-${index}`} fill={colors[index]} />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ComplianceChart