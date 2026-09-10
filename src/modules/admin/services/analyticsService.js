import { getInspectionRecords } from './scanHistoryStore.js'

const CATEGORY_RULES = [
  { match: /6\(1\)\(e\)/, label: 'MRP Declaration' },
  { match: /6\(1\)\(b\)|Second Schedule/, label: 'Net Quantity' },
  { match: /6\(1\)\(a\)/, label: 'Manufacturer Details' },
  { match: /6\(2\)/, label: 'Consumer Care Details' },
  { match: /6\(10\)/, label: 'Country of Origin' },
  { match: /6\(1\)\(d\)/, label: 'Date of Packing' },
  { match: /6\(1\)\(h\)/, label: 'Unit Sale Price' },
]

export function violationCategoryLabel(clause = '') {
  const match = CATEGORY_RULES.find((rule) => rule.match.test(clause))
  return match ? match.label : 'Other'
}

function getViolationsBreakdown(records) {
  const counts = new Map()
  records.forEach((record) => {
    if (record.status !== 'non-compliant' && record.status !== 'warning') return
    record.violationsList.forEach((violation) => {
      const label = violationCategoryLabel(violation.statutoryClause || violation.rule)
      counts.set(label, (counts.get(label) || 0) + 1)
    })
    if (record.violationsList.length === 0) {
      counts.set('Other', (counts.get('Other') || 0) + 1)
    }
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
}

function getDailyCount(records, dateKey) {
  return records.filter((record) => record.scanDateKey === dateKey).length
}

function getScanTrend(records) {
  const labels = []
  const values = []
  const today = new Date()
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    const dateKey = day.toISOString().slice(0, 10)
    labels.push(day.toLocaleDateString('en-IN', { weekday: 'short' }))
    values.push(getDailyCount(records, dateKey))
  }
  return { labels, values }
}

function trendPercent(current, previous) {
  if (!previous) return '0%'
  const diff = Math.round(((current - previous) / previous) * 100)
  return `${diff >= 0 ? '+' : '-'}${Math.abs(diff)}%`
}

export function getAnalytics() {
  const records = getInspectionRecords()
  const total = records.length
  const compliant = records.filter((record) => record.status === 'compliant').length
  const minorIssue = records.filter((record) => record.status === 'warning').length
  const majorViolation = records.filter((record) => record.status === 'non-compliant').length
  const pending = records.filter((record) => record.status === 'pending').length

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const todayKey = today.toISOString().slice(0, 10)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)

  const dayRecords = (dateKey) =>
    records.filter((record) => record.scanDateKey === dateKey)
  const countStatus = (list, status) => list.filter((record) => record.status === status).length

  const todayRecords = dayRecords(todayKey)
  const yesterdayRecords = dayRecords(yesterdayKey)
  const rate = total ? Math.round((compliant / total) * 100) : 0

  return {
    summary: {
      totalScans: total,
      compliant,
      violations: minorIssue + majorViolation,
      pending,
      complianceRate: rate,
      trends: {
        totalScans: trendPercent(todayRecords.length, yesterdayRecords.length),
        compliant: trendPercent(
          countStatus(todayRecords, 'compliant'),
          countStatus(yesterdayRecords, 'compliant'),
        ),
        violations: trendPercent(
          todayRecords.filter((record) =>
            ['non-compliant', 'warning'].includes(record.status),
          ).length,
          yesterdayRecords.filter((record) =>
            ['non-compliant', 'warning'].includes(record.status),
          ).length,
        ),
        pending: trendPercent(
          countStatus(todayRecords, 'pending'),
          countStatus(yesterdayRecords, 'pending'),
        ),
      },
    },
    compliance: {
      compliant,
      minorIssue,
      majorViolation,
      pending,
    },
    violations: getViolationsBreakdown(records),
    scanTrend: getScanTrend(records),
    complianceRate: { rate },
  }
}

export function hasAnalyticsData(data) {
  if (!data || typeof data !== 'object') return false
  return (data.summary?.totalScans || 0) > 0
}