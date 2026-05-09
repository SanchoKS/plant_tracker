import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function Layout() {
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    try {
      await authApi.deleteAccount()
      logout()
      navigate('/login')
      toast.success('Аккаунт удалён')
    } catch {
      toast.error('Ошибка при удалении аккаунта')
    }
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `px-5 py-2 text-sm font-medium border-r border-gray-300 transition-colors ${
      isActive
        ? 'bg-green-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-green-200 shadow-sm">
        <div className="flex items-stretch justify-between">
          {/* Left: tab navigation */}
          <nav className="flex items-stretch">
            <NavLink to="/plants" className={tabClass}>
              🪴 Мои растения
            </NavLink>
            <NavLink to="/journal" className={tabClass}>
              📋 Журнал ухода
            </NavLink>
            <NavLink to="/catalog" className={tabClass}>
              🔍 Каталог
            </NavLink>
          </nav>

          {/* Right: username + action buttons */}
          <div className="flex items-center gap-1 px-3 border-l border-gray-300">
            <span className="text-sm text-gray-700 mr-2 hidden sm:block">👤 {username}</span>
            <button
              onClick={() => setShowConfirmDelete(true)}
              title="Удалить аккаунт"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              {/* Trash icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              title="Выйти из аккаунта"
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            >
              {/* Logout icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        <Outlet />
      </main>

      {/* Delete account modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 shadow-xl p-6 max-w-sm w-full rounded-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">🗑️ Удалить аккаунт?</h3>
            <p className="text-gray-500 text-sm mb-5">Все данные будут безвозвратно удалены.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 border border-gray-300 py-2 text-sm hover:bg-gray-50 transition-colors rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 text-sm transition-colors rounded-lg"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
