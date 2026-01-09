import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { TimeEntry, Project } from '@/types'
import { calculateTotalMinutesFromIntervals, minutesToRoundedHours } from '@/utils/time'

interface SummaryProps {
  entries: TimeEntry[]
  projects: Project[]
}

// Calculate rounded hours per project per day, then sum
function calculateRoundedTotals(entries: TimeEntry[], projectMap: Map<string, Project>) {
  // Group minutes by project+date
  const minutesByProjectDate = new Map<string, number>()

  for (const entry of entries) {
    const key = `${entry.projectId}|${entry.date}`
    const currentMinutes = minutesByProjectDate.get(key) || 0
    const entryMinutes = entry.timeIntervals && entry.timeIntervals.length > 0
      ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
      : entry.hours * 60
    minutesByProjectDate.set(key, currentMinutes + entryMinutes)
  }

  // Round each project+date total and aggregate
  let totalHours = 0
  const hoursByProject = new Map<string, number>()
  const hoursByDate = new Map<string, number>()
  let totalBillable = 0

  for (const [key, minutes] of minutesByProjectDate.entries()) {
    const [projectId, date] = key.split('|')
    const roundedHours = minutesToRoundedHours(minutes)
    const project = projectMap.get(projectId)
    const rate = project?.defaultHourlyRate || 0

    totalHours += roundedHours
    totalBillable += roundedHours * rate

    // Aggregate by project
    const currentProjectHours = hoursByProject.get(projectId) || 0
    hoursByProject.set(projectId, currentProjectHours + roundedHours)

    // Aggregate by date
    const currentDateHours = hoursByDate.get(date) || 0
    hoursByDate.set(date, currentDateHours + roundedHours)
  }

  return { totalHours, totalBillable, hoursByProject, hoursByDate }
}

export function Summary({ entries, projects }: SummaryProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const { totalHours, totalBillable, hoursByProject, hoursByDate } = calculateRoundedTotals(entries, projectMap)

  // Prepare pie chart data
  const pieData = Array.from(hoursByProject.entries()).map(([projectId, hours]) => {
    const project = projectMap.get(projectId)
    return {
      name: project?.name || 'Okänt',
      value: hours,
      color: project?.color || '#6b7280',
    }
  })

  // Hours by day for bar chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const barData = last7Days.map((date) => {
    const hours = hoursByDate.get(date) || 0
    const dayName = new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' })
    return { name: dayName, timmar: hours }
  })

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Totalt timmar</p>
          <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Att fakturera</p>
          <p className="text-2xl font-bold text-primary-600">{totalBillable.toFixed(0)} kr</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly bar chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Senaste 7 dagarna</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="timmar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project pie chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Fördelning per projekt</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Ingen data att visa
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
