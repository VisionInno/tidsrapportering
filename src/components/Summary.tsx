import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { TimeEntry, Project } from '@/types'

interface SummaryProps {
  entries: TimeEntry[]
  projects: Project[]
}

export function Summary({ entries, projects }: SummaryProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0)
  const totalBillable = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.hours * (e.hourlyRate || 0), 0)

  // Hours by project for pie chart
  const hoursByProject = entries.reduce(
    (acc, entry) => {
      const project = projectMap.get(entry.projectId)
      const name = project?.name || 'Okänt'
      acc[name] = (acc[name] || 0) + entry.hours
      return acc
    },
    {} as Record<string, number>
  )

  const pieData = Object.entries(hoursByProject).map(([name, hours]) => {
    const project = projects.find((p) => p.name === name)
    return {
      name,
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
    const dayEntries = entries.filter((e) => e.date === date)
    const hours = dayEntries.reduce((sum, e) => sum + e.hours, 0)
    const dayName = new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' })
    return { name: dayName, timmar: hours }
  })

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Totalt timmar</p>
          <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Fakturerbara timmar</p>
          <p className="text-2xl font-bold text-green-600">{billableHours.toFixed(1)}</p>
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
