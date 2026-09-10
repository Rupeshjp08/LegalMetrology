import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import '../../admin/adminDashboard.css'
import '../analytics.css'

function ViolationChart({ data }) {
  const rows = [
    { name: 'MRP Declaration', value: data.mrp },
    { name: 'Net Quantity', value: data.netQuantity },
    { name: 'Manufacturer Details', value: data.manufacturerDetails },
    { name: 'Country of Origin', value: data.countryOfOrigin },
    { name: 'Consumer Care Details', value: data.consumerCare },
    { name: 'Date of Packing', value: data.dateOfPacking },
    { name: 'Other', value: data.other ?? 0 },
  ]

  return (
    <div className="dashboard-panel analytics-chart">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">Violation Analysis</h2>
        <span className="dashboard-panel__hint">Common violation categories</span>
      </div>
      <div className="analytics-chart__body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
            barCategoryGap="26%"
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
              width={150}
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(220, 38, 38, 0.05)' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
              formatter={(value) => [value, 'Violations']}
            />
            <Bar
              dataKey="value"
              name="Violations"
              fill="#dc2626"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ViolationChart