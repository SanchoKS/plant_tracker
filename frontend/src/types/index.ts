export interface CatalogPlant {
  id: number
  name: string
  latin_name?: string
  description?: string
  ideal_light?: string
  ideal_humidity?: string
  ideal_temperature?: string
  watering_interval_days: number
  fertilizing_interval_days: number
  repotting_interval_days: number
  care_notes?: string
  difficulty?: string
  category?: string
  image_url?: string
}

export interface UserPlant {
  id: number
  catalog_plant_id: number
  nickname?: string
  location?: string
  added_date?: string
  photo_path?: string
  last_watered?: string
  last_fertilized?: string
  last_repotted?: string
  notes?: string
  catalog_plant: CatalogPlant
}

export interface CareLog {
  id: number
  user_plant_id: number
  action_type: string
  action_date: string
  notes?: string
  plant_name?: string
  plant_nickname?: string
}

export interface CareStats {
  total: number
  by_action: Record<string, number>
}

export interface DiagnosticAnswer {
  id: number
  answer_text: string
  next_step_id?: number
  diagnosis?: string
  recommendation?: string
}

export interface DiagnosticStep {
  id: number
  question: string
  answers: DiagnosticAnswer[]
}

export interface CareScheduleItem {
  date: string
  overdue: boolean
}

export interface CareSchedule {
  watering: CareScheduleItem
  fertilizing: CareScheduleItem
  repotting: CareScheduleItem
}

export const ACTION_LABELS: Record<string, string> = {
  watering: '💧 Полив',
  fertilizing: '🌱 Подкормка',
  repotting: '🪴 Пересадка',
  pruning: '✂️ Обрезка',
  inspection: '🔍 Осмотр',
}

export const ACTION_COLORS: Record<string, string> = {
  watering: 'bg-blue-100 text-blue-800',
  fertilizing: 'bg-yellow-100 text-yellow-800',
  repotting: 'bg-orange-100 text-orange-800',
  pruning: 'bg-purple-100 text-purple-800',
  inspection: 'bg-gray-100 text-gray-800',
}
