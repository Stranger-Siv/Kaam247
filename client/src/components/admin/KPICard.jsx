/**
 * Reusable KPI card for admin dashboard
 * @param {string} label - Card label
 * @param {string|number} value - Display value
 * @param {string} [icon] - Emoji or icon
 * @param {string} [color] - Tailwind color name: blue, green, purple, amber, red, etc.
 * @param {string} [className] - Extra classes
 */
function KPICard({ label, value, icon, color = 'blue', className = '' }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400'
  }
  const classes = colorMap[color] || colorMap.blue

  return (
    <div className={`p-4 sm:p-5 rounded-xl border-2 ${classes} ${className}`}>
      {icon && <p className="text-2xl mb-2">{icon}</p>}
      <p className="text-2xl sm:text-3xl font-bold mb-1 truncate">{value}</p>
      <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide opacity-90 truncate">{label}</p>
    </div>
  )
}

export default KPICard
