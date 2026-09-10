import '../adminDashboard.css'

const ACCENT_STYLES = {
  blue: 'stat-card--blue',
  green: 'stat-card--green',
  red: 'stat-card--red',
  amber: 'stat-card--amber',
}

function StatCard({ title, value, icon: Icon, accent = 'blue', subtitle, badge }) {
  const accentClass = ACCENT_STYLES[accent] || ACCENT_STYLES.blue

  return (
    <div className={`stat-card ${accentClass}`}>
      <div className="stat-card__icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="stat-card__body">
        <div className="stat-card__value">
          {value.toLocaleString()}
          {badge && <span className="stat-card__badge">{badge}</span>}
        </div>
        <div className="stat-card__title">{title}</div>
        {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
      </div>
    </div>
  )
}

export default StatCard
