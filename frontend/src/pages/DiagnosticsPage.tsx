import { useEffect, useState } from 'react'
import { diagnosticsApi } from '../api'
import type { DiagnosticStep, DiagnosticAnswer } from '../types'
import toast from 'react-hot-toast'

interface HistoryEntry {
  step: DiagnosticStep
  answer: DiagnosticAnswer
}

export default function DiagnosticsPage() {
  const [currentStep, setCurrentStep] = useState<DiagnosticStep | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [result, setResult] = useState<{ diagnosis: string; recommendation: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadFirstStep = async () => {
    setLoading(true)
    try {
      const res = await diagnosticsApi.getStart()
      setCurrentStep(res.data)
      setHistory([])
      setResult(null)
    } catch {
      toast.error('Не удалось загрузить диагностику')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFirstStep()
  }, [])

  const handleAnswer = async (answer: DiagnosticAnswer) => {
    if (!currentStep) return
    const entry: HistoryEntry = { step: currentStep, answer }
    if (answer.diagnosis) {
      setHistory((prev) => [...prev, entry])
      setResult({ diagnosis: answer.diagnosis!, recommendation: answer.recommendation || '' })
      setCurrentStep(null)
      return
    }
    if (answer.next_step_id) {
      try {
        const res = await diagnosticsApi.getStep(answer.next_step_id)
        setHistory((prev) => [...prev, entry])
        setCurrentStep(res.data)
      } catch {
        toast.error('Ошибка загрузки шага')
      }
    }
  }

  const handleBack = async () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setResult(null)
    setCurrentStep(prev.step)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-4xl animate-pulse">🔍</div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="bg-purple-100 border border-purple-200 px-4 py-2 inline-block rounded-lg">
          <span className="text-purple-800 font-medium text-sm">🔍 Диагностика растения</span>
        </div>
        <button
          onClick={loadFirstStep}
          className="border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-sm transition-colors rounded-lg shadow-sm"
        >
          🔄 Начать заново
        </button>
      </div>

      {/* History breadcrumb */}
      {history.length > 0 && (
        <div className="mb-3">
          <button
            onClick={handleBack}
            className="text-green-600 hover:text-green-800 text-sm mb-2 flex items-center gap-1"
          >
            ← Назад
          </button>
          <div className="space-y-1.5 mb-3">
            {history.map((entry, i) => (
              <div key={i} className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm rounded-lg">
                <span className="text-gray-400 text-xs">Шаг {i + 1}: </span>
                <span className="text-gray-600">{entry.step.question}</span>
                <span className="text-green-700 ml-2">→ {entry.answer.answer_text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result ? (
        <div className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2">
            <span className="text-lg">🌡️</span>
            <span className="font-medium text-sm">Результат диагностики</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl">
              <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ Возможная проблема:</p>
              <p className="text-sm text-orange-900">{result.diagnosis}</p>
            </div>
            {result.recommendation && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl">
                <p className="text-xs font-semibold text-green-700 mb-1">💡 Рекомендация:</p>
                <p className="text-sm text-green-900">{result.recommendation}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={loadFirstStep}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 text-sm transition-colors rounded-lg"
              >
                🔄 Новая диагностика
              </button>
              <a
                href="/plants"
                className="flex-1 border border-gray-200 hover:bg-gray-50 py-2 text-sm text-center transition-colors rounded-lg"
              >
                🪴 К растениям
              </a>
            </div>
          </div>
        </div>
      ) : currentStep ? (
        <div className="border border-gray-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-2">
            <span className="text-xs text-gray-400">Шаг {history.length + 1}</span>
          </div>
          <div className="p-4">
            <p className="font-medium text-gray-800 mb-4">❓ {currentStep.question}</p>
            <div className="space-y-2">
              {currentStep.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswer(answer)}
                  className="w-full text-left px-4 py-2.5 border border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-800 transition-colors text-sm text-gray-700 rounded-lg"
                >
                  {answer.answer_text}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Hint */}
      <div className="mt-4 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 rounded-xl">
        💡 Отвечайте на вопросы, описывая симптомы вашего растения — диагностика найдёт проблему и даст совет.
      </div>
    </div>
  )
}
