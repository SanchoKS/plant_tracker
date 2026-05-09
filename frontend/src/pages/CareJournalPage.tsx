import { useEffect, useState, useCallback } from 'react'
import { careLogApi, myPlantsApi } from '../api'
import type { CareLog, CareStats, UserPlant } from '../types'
import { ACTION_LABELS } from '../types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TIME_FILTERS = [
  { label: 'Всё время', value: undefined },
  { label: 'Неделя', value: 7 },
  { label: 'Месяц', value: 30 },
  { label: '3 месяца', value: 90 },
]

const ACTION_TYPES = ['watering', 'fertilizing', 'repotting', 'pruning']

export default function CareJournalPage() {
  const [logs, setLogs] = useState<CareLog[]>([])
  const [stats, setStats] = useState<CareStats | null>(null)
  const [plants, setPlants] = useState<UserPlant[]>([])
  const [selectedPlant, setSelectedPlant] = useState<number | undefined>()
  const [selectedAction, setSelectedAction] = useState('all')
  const [selectedDays, setSelectedDays] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, statsRes, plantsRes] = await Promise.all([
        careLogApi.getAll({
          plant_id: selectedPlant,
          action_type: selectedAction === 'all' ? undefined : selectedAction,
          days: selectedDays,
        }),
        careLogApi.getStats(),
        myPlantsApi.getAll(),
      ])
      setLogs(logsRes.data)
      setStats(statsRes.data)
      setPlants(plantsRes.data)
    } catch {
      toast.error('Ошибка загрузки журнала')
    } finally {
      setLoading(false)
    }
  }, [selectedPlant, selectedAction, selectedDays])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div>
      {/* Section title */}
      <div className="bg-green-100 border border-green-200 px-4 py-2 mb-4 inline-block rounded-lg">
        <span className="text-green-800 font-medium text-sm">📋 Журнал ухода</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="border border-gray-200 bg-white p-2 text-center rounded-xl shadow-sm">
            <div className="text-xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500">Количество действий</div>
          </div>
          {ACTION_TYPES.map((action) => {
            const count = stats.by_action[action] ?? 0
            return (
              <div key={action} className="border border-gray-200 bg-white p-2 text-center rounded-xl shadow-sm">
                <div className="text-xl font-bold text-green-700">{count}</div>
                <div className="text-xs text-gray-500">{ACTION_LABELS[action] || action}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters block */}
      <div className="border border-gray-200 bg-white mb-4 flex rounded-xl overflow-hidden shadow-sm">
        {/* Green left border stripe */}
        <div className="w-1 bg-green-500 flex-shrink-0" />

        <div className="flex-1 p-3">
          {/* Dropdowns row */}
          <div className="flex gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Растения</label>
              <select
                value={selectedPlant ?? ''}
                onChange={(e) => setSelectedPlant(e.target.value ? Number(e.target.value) : undefined)}
                className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-green-500 rounded-lg"
              >
                <option value="">Все</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.catalog_plant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Время</label>
              <select
                value={selectedDays ?? ''}
                onChange={(e) => setSelectedDays(e.target.value ? Number(e.target.value) : undefined)}
                className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-green-500 rounded-lg"
              >
                {TIME_FILTERS.map((f) => (
                  <option key={f.label} value={f.value ?? ''}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action type filter pills */}
          <div className="flex gap-2 flex-wrap">
            <ActionPill label="все" active={selectedAction === 'all'} onClick={() => setSelectedAction('all')} />
            {ACTION_TYPES.map((a) => (
              <ActionPill
                key={a}
                label={ACTION_LABELS[a] || a}
                active={selectedAction === a}
                onClick={() => setSelectedAction(a)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-4xl animate-pulse">🌿</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 text-gray-400 rounded-xl shadow-sm">
          <div className="text-5xl mb-2">🌿</div>
          <p className="text-sm">Нет записей — начните ухаживать за растениями!</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white divide-y divide-gray-100 rounded-xl overflow-hidden shadow-sm">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActionPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm transition-colors ${
        active
          ? 'bg-green-600 text-white border-green-600'
          : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
      }`}
    >
      {label}
    </button>
  )
}

function LogEntry({ log }: { log: CareLog }) {
  const plantName = log.plant_nickname || log.plant_name || '—'
  const dateStr = format(parseISO(log.action_date), 'd MMM yyyy, HH:mm', { locale: ru })

  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-gray-700">
        <span className="font-medium">{ACTION_LABELS[log.action_type] || log.action_type}</span>
        {' — '}
        <span className="text-gray-500">{plantName}</span>
        {log.notes && <span className="text-gray-400 hidden sm:inline"> ({log.notes})</span>}
      </span>
      <span className="text-gray-400 flex-shrink-0 ml-4">{dateStr}</span>
    </div>
  )
}
