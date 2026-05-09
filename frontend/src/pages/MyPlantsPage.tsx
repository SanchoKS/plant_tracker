import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { myPlantsApi } from '../api'
import type { UserPlant, CareSchedule } from '../types'
import { ACTION_LABELS } from '../types'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const ACTION_ICONS: Record<string, string> = {
  watering: '💧',
  fertilizing: '🌱',
  repotting: '🪴',
  pruning: '✂️',
  inspection: '🔍',
}

interface UpcomingAction {
  plantId: number
  plantName: string
  actionType: string
  dueDate: string
  overdue: boolean
}

interface PlantWithSchedule {
  plant: UserPlant
  schedule: CareSchedule | null
}

export default function MyPlantsPage() {
  const [plantsWithSchedule, setPlantsWithSchedule] = useState<PlantWithSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadPlants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await myPlantsApi.getAll()
      const withSchedules = await Promise.all(
        res.data.map(async (plant) => {
          try {
            const s = await myPlantsApi.getSchedule(plant.id)
            return { plant, schedule: s.data }
          } catch {
            return { plant, schedule: null }
          }
        }),
      )
      setPlantsWithSchedule(withSchedules)
    } catch {
      toast.error('Ошибка загрузки растений')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlants()
  }, [loadPlants])

  const handleAction = async (plantId: number, actionType: string) => {
    try {
      await myPlantsApi.logCare(plantId, actionType)
      toast.success(`${ACTION_LABELS[actionType]} выполнен(а)`)
      loadPlants()
    } catch (err: any) {
      const msg = err.response?.data?.detail
      if (err.response?.status === 409) {
        toast(`${ACTION_LABELS[actionType]} уже выполнен(а) сегодня`, {
          icon: '✅',
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
        })
      } else {
        toast.error(msg || 'Ошибка')
      }
    }
  }

  const handleDelete = async (plantId: number) => {
    if (!confirm('Удалить растение?')) return
    try {
      await myPlantsApi.delete(plantId)
      toast.success('Растение удалено')
      setPlantsWithSchedule((prev) => prev.filter((p) => p.plant.id !== plantId))
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const handlePhotoUpload = async (plantId: number, file: File) => {
    try {
      await myPlantsApi.uploadPhoto(plantId, file)
      toast.success('Фото обновлено')
      loadPlants()
    } catch {
      toast.error('Ошибка загрузки фото')
    }
  }

  const upcomingActions: UpcomingAction[] = []
  for (const { plant, schedule } of plantsWithSchedule) {
    if (!schedule) continue
    const name = plant.nickname || plant.catalog_plant.name
    for (const [type, item] of Object.entries(schedule) as [string, { date: string; overdue: boolean }][]) {
      upcomingActions.push({
        plantId: plant.id,
        plantName: name,
        actionType: type,
        dueDate: item.date,
        overdue: item.overdue,
      })
    }
  }
  upcomingActions.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const totalPlants = plantsWithSchedule.length
  const needsWatering = plantsWithSchedule.filter((p) => p.schedule?.watering.overdue).length
  const needsFertilizing = plantsWithSchedule.filter((p) => p.schedule?.fertilizing.overdue).length
  const overdueTotal = plantsWithSchedule.filter(
    (p) => p.schedule?.watering.overdue || p.schedule?.fertilizing.overdue || p.schedule?.repotting.overdue,
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-4xl animate-pulse">🌿</div>
    )
  }

  return (
    <div>
      {/* Section title */}
      <div className="bg-green-100 border border-green-200 px-4 py-2 mb-4 inline-block rounded-lg">
        <span className="text-green-800 font-medium text-sm">🌱 Мои растения</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatBox icon="🪴" label="Всего растений" value={totalPlants} />
        <StatBox icon="💧" label="Нужен полив" value={needsWatering} alert={needsWatering > 0} />
        <StatBox icon="🌱" label="Нужна подкормка" value={needsFertilizing} alert={needsFertilizing > 0} />
        <StatBox icon="⚠️" label="Просрочено" value={overdueTotal} alert={overdueTotal > 0} />
      </div>

      {/* Upcoming care section */}
      {upcomingActions.length > 0 && (
        <div className="border border-gray-200 bg-white mb-4 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-3 py-1.5">
            <span className="text-sm font-medium text-gray-700">📅 Предстоящий уход</span>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingActions.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-700">
                  {ACTION_LABELS[item.actionType]} — {item.plantName}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${item.overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {format(parseISO(item.dueDate), 'd MMM', { locale: ru })}
                  </span>
                  <button
                    onClick={() => handleAction(item.plantId, item.actionType)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 transition-colors rounded-lg"
                    title="Подтвердить действие"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plant list */}
      {plantsWithSchedule.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="text-6xl mb-3">🌵</div>
          <p className="text-gray-600 font-medium">Пока здесь пусто</p>
          <p className="text-sm text-gray-400 mt-1">Добавьте своё первое растение из каталога</p>
          <Link
            to="/catalog"
            className="inline-block mt-3 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors rounded-lg"
          >
            Открыть каталог
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 divide-y divide-gray-100 bg-white rounded-xl overflow-hidden shadow-sm">
          {plantsWithSchedule.map(({ plant, schedule }) => (
            <PlantRow
              key={plant.id}
              plant={plant}
              schedule={schedule}
              onAction={handleAction}
              onDelete={handleDelete}
              onPhotoUpload={handlePhotoUpload}
              onInspect={() => navigate('/diagnostics')}
            />
          ))}
        </div>
      )}

      {/* Add plant link */}
      <div className="mt-3 text-right">
        <Link
          to="/catalog"
          className="text-sm text-green-600 hover:text-green-800 underline"
        >
          + Добавить растение
        </Link>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value, alert }: { icon: string; label: string; value: number; alert?: boolean }) {
  return (
    <div className={`border p-2 text-center bg-white rounded-xl shadow-sm ${alert ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
      <div className="text-xl mb-0.5">{icon}</div>
      <div className={`text-xl font-bold ${alert ? 'text-orange-600' : 'text-gray-800'}`}>{value}</div>
      <div className="text-xs text-gray-500 leading-tight mt-0.5">{label}</div>
    </div>
  )
}

function PlantInfoModal({ plant, onClose }: { plant: UserPlant; onClose: () => void }) {
  const cp = plant.catalog_plant
  const photoSrc = plant.photo_path ? `/${plant.photo_path}` : cp.image_url ?? null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 py-6">
        <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-lg rounded-2xl overflow-hidden">
          <div className="sticky top-0 bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
            <span className="font-medium text-sm">🌿 {plant.nickname || cp.name}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
          </div>
          <div className="p-4">
            {photoSrc && (
              <img
                src={photoSrc}
                alt={cp.name}
                className="w-full h-48 object-cover mb-4 rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
            {plant.nickname && <p className="text-xs text-gray-400 italic mb-1">{cp.name}</p>}
            {cp.latin_name && <p className="text-xs text-gray-400 italic mb-2">{cp.latin_name}</p>}
            {cp.description && <p className="text-sm text-gray-600 mb-4">{cp.description}</p>}

            {plant.location && (
              <p className="text-xs text-gray-500 mb-3">📍 Расположение: {plant.location}</p>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              {cp.ideal_light && (
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <span className="mr-1">☀️</span>
                  <span className="text-gray-400 text-xs">Свет: </span>
                  <span className="text-gray-700">{cp.ideal_light}</span>
                </div>
              )}
              {cp.ideal_humidity && (
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <span className="mr-1">💧</span>
                  <span className="text-gray-400 text-xs">Влажность: </span>
                  <span className="text-gray-700">{cp.ideal_humidity}</span>
                </div>
              )}
              {cp.ideal_temperature && (
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <span className="mr-1">🌡️</span>
                  <span className="text-gray-400 text-xs">Температура: </span>
                  <span className="text-gray-700">{cp.ideal_temperature}</span>
                </div>
              )}
              {cp.difficulty && (
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <span className="mr-1">⭐</span>
                  <span className="text-gray-400 text-xs">Сложность: </span>
                  <span className="text-gray-700">{cp.difficulty}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 mb-4 text-sm rounded-xl">
              <p className="font-medium text-blue-800 mb-1">График ухода:</p>
              <p className="text-blue-700">💧 Полив: каждые {cp.watering_interval_days} дн.</p>
              <p className="text-blue-700">🌱 Подкормка: каждые {cp.fertilizing_interval_days} дн.</p>
              <p className="text-blue-700">🪴 Пересадка: каждые {Math.round(cp.repotting_interval_days / 30)} мес.</p>
            </div>

            {cp.care_notes && (
              <div className="bg-green-50 border border-green-200 p-3 text-sm text-green-800 rounded-xl">
                <p className="font-medium mb-1">Особенности ухода:</p>
                <p>{cp.care_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlantRow({
  plant,
  schedule,
  onAction,
  onDelete,
  onPhotoUpload,
  onInspect,
}: {
  plant: UserPlant
  schedule: CareSchedule | null
  onAction: (id: number, type: string) => void
  onDelete: (id: number) => void
  onPhotoUpload: (id: number, file: File) => void
  onInspect: () => void
}) {
  const [showInfo, setShowInfo] = useState(false)
  const displayName = plant.nickname || plant.catalog_plant.name
  const photoSrc = plant.photo_path
    ? `/${plant.photo_path}`
    : plant.catalog_plant.image_url ?? null
  const needsWatering = schedule?.watering.overdue
  const needsFertilizing = schedule?.fertilizing.overdue

  return (
    <div className="px-3 py-2">
      {showInfo && <PlantInfoModal plant={plant} onClose={() => setShowInfo(false)} />}

      {/* Plant info row */}
      <div className="flex items-center gap-2 mb-2">
        {photoSrc ? (
          <img src={photoSrc} alt={displayName} className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 bg-green-100 flex items-center justify-center text-xl flex-shrink-0 rounded-lg border border-gray-200">
            🌿
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfo(true)}
              className="font-medium text-sm text-green-700 hover:text-green-900 hover:underline truncate text-left"
            >
              {displayName}
            </button>
            {needsWatering && <span className="text-blue-500 text-xs">💧</span>}
            {needsFertilizing && <span className="text-yellow-500 text-xs">🌱</span>}
          </div>
          {plant.location && (
            <span className="text-xs text-gray-400">📍 {plant.location}</span>
          )}
        </div>
        <button
          onClick={() => onDelete(plant.id)}
          className="text-gray-300 hover:text-red-400 text-xs px-1 transition-colors flex-shrink-0"
          title="Удалить"
        >
          ✕
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-gray-400 mr-1">Действия вне плана:</span>
        {(['watering', 'fertilizing', 'repotting', 'pruning'] as const).map((type) => (
          <button
            key={type}
            onClick={() => onAction(plant.id, type)}
            title={ACTION_LABELS[type]}
            className="border border-gray-200 bg-gray-50 hover:bg-green-50 hover:border-green-400 px-2 py-0.5 text-base transition-colors rounded-lg"
          >
            {ACTION_ICONS[type]}
          </button>
        ))}
        <label
          title="Добавить фото"
          className="border border-gray-200 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 text-base cursor-pointer transition-colors rounded-lg"
        >
          📷
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPhotoUpload(plant.id, f)
            }}
          />
        </label>
        <button
          onClick={onInspect}
          title="Диагностика растения"
          className="border border-gray-200 bg-gray-50 hover:bg-green-50 hover:border-green-400 px-2 py-0.5 text-base transition-colors rounded-lg ml-auto"
        >
          🔍
        </button>
      </div>
    </div>
  )
}
