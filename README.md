# 🌿 Трекер комнатных растений

Приложение для ухода за комнатными растениями с каталогом, коллекцией, планировщиком ухода, журналом и диагностикой.

## Технологии

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI (Python) + SQLAlchemy
- **База данных:** SQLite

## Требования

- Python 3.10+
- Node.js 18+

## Запуск

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Или двойной клик на `start_backend.bat`

API будет доступно на: http://localhost:8000  
Документация API: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Или двойной клик на `start_frontend.bat`

Приложение откроется на: http://localhost:3000

## Функции

| Страница | Описание |
|---|---|
| **Мои растения** | Коллекция с графиком ухода, быстрые действия, фото |
| **Журнал ухода** | История действий с фильтрами по растению и времени |
| **Каталог** | 12 растений с поиском, фильтрами и подробным описанием |
| **Диагностика** | Пошаговый опросник для определения проблем |
