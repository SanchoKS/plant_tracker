import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api'
import toast from 'react-hot-toast'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tab === 'register' && password !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      const res =
        tab === 'login'
          ? await authApi.login(username, password)
          : await authApi.register(username, password)
      setAuth(res.data.access_token, res.data.username)
      navigate('/plants')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-xl w-full max-w-xs rounded-2xl overflow-hidden">
        {/* Title bar */}
        <div className="bg-green-200 border-b border-gray-300 px-4 py-2 text-center">
          <span className="text-green-900 italic font-medium text-sm">🌿 трекер комнатных растений</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-bold tracking-wide transition-colors ${
              tab === 'login'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ВОЙТИ
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-sm font-bold tracking-wide transition-colors border-l border-gray-300 ${
              tab === 'register'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            РЕГИСТРАЦИЯ
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
              placeholder="..."
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
              placeholder="..."
              required
              minLength={4}
            />
          </div>
          {tab === 'register' && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Повторить пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-500 rounded-lg"
                placeholder="..."
                required
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-medium mt-1 disabled:opacity-50 transition-colors rounded-lg"
          >
            {loading ? '⏳ ...' : tab === 'login' ? '🚪 Войти' : '✅ Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  )
}
