import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { catalogApi, myPlantsApi } from '../api'
import type { CatalogPlant } from '../types'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const DIFFICULTY_OPTIONS = ['Лёгкая', 'Средняя', 'Сложная']

function PlantDetailModal({
  plant,
  onClose,
  onAdd,
}: {
  plant: CatalogPlant
  onClose: () => void
  onAdd: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 py-6">
      <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-lg rounded-2xl overflow-hidden">
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <span className="font-medium text-sm">🌿 {plant.name}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>
        <div className="p-4">
          {plant.image_url && (
            <img
              src={plant.image_url}
              alt={plant.name}
              className="w-full h-48 object-cover mb-4 rounded-xl"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
          {plant.latin_name && <p className="text-xs text-gray-400 italic mb-2">{plant.latin_name}</p>}
          {plant.description && <p className="text-sm text-gray-600 mb-4">{plant.description}</p>}

          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            {plant.ideal_light && <InfoRow icon="☀️" label="Свет" value={plant.ideal_light} />}
            {plant.ideal_humidity && <InfoRow icon="💧" label="Влажность" value={plant.ideal_humidity} />}
            {plant.ideal_temperature && <InfoRow icon="🌡️" label="Температура" value={plant.ideal_temperature} />}
            {plant.difficulty && <InfoRow icon="⭐" label="Сложность" value={plant.difficulty} />}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 mb-4 text-sm rounded-xl">
            <p className="font-medium text-blue-800 mb-1">График ухода:</p>
            <p className="text-blue-700">💧 Полив: каждые {plant.watering_interval_days} дн.</p>
            <p className="text-blue-700">🌱 Подкормка: каждые {plant.fertilizing_interval_days} дн.</p>
            <p className="text-blue-700">🪴 Пересадка: каждые {Math.round(plant.repotting_interval_days / 30)} мес.</p>
          </div>

          {plant.care_notes && (
            <div className="bg-green-50 border border-green-200 p-3 mb-4 text-sm text-green-800 rounded-xl">
              <p className="font-medium mb-1">Особенности ухода:</p>
              <p>{plant.care_notes}</p>
            </div>
          )}

          <button
            onClick={onAdd}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-medium transition-colors rounded-lg"
          >
            ➕ Добавить
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
      <span className="mr-1">{icon}</span>
      <span className="text-gray-400 text-xs">{label}: </span>
      <span className="text-gray-700">{value}</span>
    </div>
  )
}

function AddPlantModal({
  plant,
  onClose,
  onSuccess,
}: {
  plant: CatalogPlant
  onClose: () => void
  onSuccess: () => void
}) {
  const [nickname, setNickname] = useState('')
  const [location, setLocation] = useState('')
  const [addedDate, setAddedDate] = useState(new Date().toISOString().split('T')[0])
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await myPlantsApi.add({
        catalog_plant_id: plant.id,
        nickname: nickname,
        location: location || undefined,
        added_date: addedDate,
      })
      if (photo) await myPlantsApi.uploadPhoto(res.data.id, photo)
      toast.success('Растение добавлено!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <span className="font-medium text-sm">🪴 Добавление</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
              placeholder={plant.name}
              required
            />
            <p className="text-xs text-gray-400 mt-0.5">Уникальное имя — можно добавить несколько одинаковых растений</p>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Расположение</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
              placeholder="Кухня, гостиная..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Дата появления</label>
            <input
              type="date"
              value={addedDate}
              onChange={(e) => setAddedDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Фото</label>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg">
              <span className="text-sm text-gray-500">{photo ? photo.name : '...'}</span>
              <span className="ml-auto text-sm text-gray-400">добавить фото</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-medium mt-1 transition-colors disabled:opacity-50 rounded-lg"
          >
            {loading ? '⏳ ...' : '🌿 добавить растение'}
          </button>
          <p className="text-xs text-gray-400 text-center">после нажатия появится в «Мои растения»</p>
        </form>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [plants, setPlants] = useState<CatalogPlant[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailPlant, setDetailPlant] = useState<CatalogPlant | null>(null)
  const [addingPlant, setAddingPlant] = useState<CatalogPlant | null>(null)
  const [myPlantCounts, setMyPlantCounts] = useState<Record<number, number>>({})

  const loadPlants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await catalogApi.getAll({
        search: search || undefined,
        category: category || undefined,
        difficulty: difficulty || undefined,
      })
      setPlants(res.data)
    } catch {
      toast.error('Ошибка загрузки каталога')
    } finally {
      setLoading(false)
    }
  }, [search, category, difficulty])

  useEffect(() => {
    catalogApi.getCategories().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!token) return
    myPlantsApi.getAll().then((r) => {
      const counts: Record<number, number> = {}
      for (const p of r.data) {
        counts[p.catalog_plant_id] = (counts[p.catalog_plant_id] || 0) + 1
      }
      setMyPlantCounts(counts)
    }).catch(() => {})
  }, [token])

  useEffect(() => {
    const timer = setTimeout(loadPlants, 300)
    return () => clearTimeout(timer)
  }, [loadPlants])

  return (
    <div>
      {/* Section title */}
      <div className="bg-blue-100 border border-blue-200 px-4 py-2 mb-4 inline-block rounded-lg">
        <span className="text-blue-800 font-medium text-sm">🌺 Каталог растений</span>
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 min-w-[120px] border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
        >
          <option value="">Категория</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
        >
          <option value="">Сложность</option>
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Plant cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-4xl animate-pulse">🌿</div>
      ) : plants.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 bg-white text-gray-400 rounded-xl">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm">Ничего не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              myCount={myPlantCounts[plant.id] || 0}
              onDetail={() => setDetailPlant(plant)}
              onAdd={() => setAddingPlant(plant)}
            />
          ))}
        </div>
      )}

      {detailPlant && (
        <PlantDetailModal
          plant={detailPlant}
          onClose={() => setDetailPlant(null)}
          onAdd={() => { setDetailPlant(null); setAddingPlant(detailPlant) }}
        />
      )}
      {addingPlant && (
        <AddPlantModal
          plant={addingPlant}
          onClose={() => setAddingPlant(null)}
          onSuccess={() => { setAddingPlant(null); navigate('/plants') }}
        />
      )}
    </div>
  )
}

function PlantCard({
  plant,
  myCount,
  onDetail,
  onAdd,
}: {
  plant: CatalogPlant
  myCount: number
  onDetail: () => void
  onAdd: () => void
}) {
  return (
    <div className="border border-gray-200 bg-white flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Plant image */}
      <div className="h-40 bg-green-50 overflow-hidden flex items-center justify-center">
        {plant.image_url ? (
          <img
            src={plant.image_url}
            alt={plant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.currentTarget
              t.style.display = 'none'
              t.nextElementSibling?.removeAttribute('style')
            }}
          />
        ) : null}
        <span className="text-6xl" style={plant.image_url ? { display: 'none' } : {}}>🌿</span>
      </div>

      <div className="p-3 flex-1">
        <div className="flex gap-1 mb-1 flex-wrap">
          {plant.category && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{plant.category}</span>
          )}
          {plant.difficulty && (
            <span className={`text-xs border px-2 py-0.5 rounded-full ${
              plant.difficulty === 'Лёгкая' ? 'bg-green-50 text-green-600 border-green-200' :
              plant.difficulty === 'Средняя' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-600 border-red-200'
            }`}>{plant.difficulty}</span>
          )}
          {myCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full ml-auto">
              ✓ {myCount} шт.
            </span>
          )}
        </div>
        <h3 className="font-medium text-gray-900 text-sm italic">{plant.name}</h3>
        {plant.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plant.description}</p>
        )}
      </div>

      {/* Two buttons at bottom */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={onDetail}
          className="flex-1 py-2 text-xs text-green-700 hover:bg-green-50 border-r border-gray-100 transition-colors"
        >
          Подробнее
        </button>
        <button
          onClick={onAdd}
          className="flex-1 py-2 text-xs text-white bg-green-600 hover:bg-green-700 transition-colors font-medium"
        >
          Добавить
        </button>
      </div>
    </div>
  )
}
