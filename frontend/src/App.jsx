// --- Модальное окно регистрации ---
function AuthModal({ onClose, onRegister }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    has_children: false,
    has_pets: false,
    has_allergies: false,
    preferences: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Пожалуйста, заполните все обязательные поля.');
      return;
    }
    setError('');
    onRegister(form);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
        <h3 className="text-2xl font-bold text-emerald-800 mb-4 text-center">Регистрация пользователя</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Почта *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Есть ли у вас дети?</label>
          <input type="checkbox" name="has_children" checked={form.has_children} onChange={handleChange} className="mr-2" /> Да
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Есть ли у вас домашние животные?</label>
          <input type="checkbox" name="has_pets" checked={form.has_pets} onChange={handleChange} className="mr-2" /> Да
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Есть ли аллергия на цветы?</label>
          <input type="checkbox" name="has_allergies" checked={form.has_allergies} onChange={handleChange} className="mr-2" /> Да
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ваши предпочтения по цветам</label>
          <textarea name="preferences" value={form.preferences} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Опишите ваши пожелания..." />
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-3 justify-center mt-4">
          <button type="submit" className="py-2 px-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-lg">Зарегистрироваться</button>
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg">Отмена</button>
        </div>
      </form>
    </div>
  );
}

// --- Модальное окно логина ---
function LoginModal({ onClose, onLogin }) {
  const [form, setForm] = React.useState({
    email: '',
    password: ''
  });
  const [error, setError] = React.useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data); // data может содержать профиль
      } else {
        const err = await res.json();
        setError(err.message || 'Ошибка входа.');
      }
    } catch (e) {
      setError('Ошибка соединения с сервером.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
        <h3 className="text-2xl font-bold text-emerald-800 mb-4 text-center">Вход</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Почта *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-3 justify-center mt-4">
          <button type="submit" className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg">Войти</button>
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg">Отмена</button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

// --- FIREBASE IMPORTS (MANDATORY GLOBALS) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, addDoc, arrayUnion } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore'; // For debugging

// --- FIX: define globals for local run ---
const __app_id = 'local-dev';
const __firebase_config = JSON.stringify({
  apiKey: "fake-api-key",
  authDomain: "fake.firebaseapp.com",
  projectId: "fake-project",
});
const __initial_auth_token = 'fake-token';


// Firebase globals (MUST BE USED)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Утилиты для работы с датами и статистикой ---
const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getWateringStatus = (wateringHistory, wateringScheduleDays) => {
  if (!wateringHistory || wateringHistory.length === 0 || !wateringScheduleDays) return { status: 'Нет данных', isDue: false, daysLeft: null };
  
  const lastWateredDate = wateringHistory.reduce((latest, current) => {
      const currentDate = current.seconds ? new Date(current.seconds * 1000) : new Date(current);
      return currentDate > latest ? currentDate : latest;
  }, new Date(0));

  const nextWatering = new Date(lastWateredDate);
  nextWatering.setDate(nextWatering.getDate() + wateringScheduleDays);
  
  const now = new Date();
  const diffTime = nextWatering.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { status: 'Пора полить!', isDue: true, daysLeft: 0, lastWatered: lastWateredDate };
  } else {
    return { status: `Полить через ${diffDays} дн.`, isDue: false, daysLeft: diffDays, lastWatered: lastWateredDate };
  }
};


// --- Данные для вопросов ---
const QUESTIONS = {
  self: [
    {
      key: 'location',
      prompt: 'Где будет стоять растение?',
      placeholder: 'Например: "Рядом с южным окном" или "В глубине северной комнаты".',
      options: [
        { label: 'На ярком окне (юг/запад)', value: 'bright_window', icon: Sun },
        { label: 'В светлой комнате (восток/север)', value: 'light_room', icon: Feather },
        { label: 'В тени или глубине комнаты', value: 'shade', icon: Leaf },
        { label: 'На балконе (сезонно)', value: 'balcony', icon: Heart },
        { label: 'В ванной (влажно)', value: 'bathroom', icon: Droplets }, 
      ],
    },
    {
      key: 'care_regime',
      prompt: 'Какой уход ты готов(а) предоставить?',
      placeholder: 'Например: "Готов поливать раз в 3 дня" или "Только неприхотливое".',
      options: [
        { label: 'Уход 2-3 раза в неделю', value: 'high_care', icon: Heart },
        { label: 'Умеренный уход (раз в неделю)', value: 'medium_care', icon: Droplets },
        { label: 'Неприхотливое (редкий полив)', value: 'low_care', icon: Zap },
        { label: 'Часто опрыскивать/высокая влажность', value: 'high_humidity', icon: Droplets },
      ],
    },
    {
      key: 'function',
      prompt: 'Какую роль должно выполнять растение?',
      placeholder: 'Например: "Хочу, чтобы оно очищало воздух" или "Только для декора".',
      options: [
        { label: 'Очищало воздух (польза)', value: 'air_purifying', icon: Leaf },
        { label: 'Украшало интерьер (эстетика)', value: 'decorative', icon: Heart },
        { label: 'Просто зелень и умиротворение', value: 'greenery', icon: Feather }, 
        { label: 'Фон для фото', value: 'photo_background', icon: Gift },
      ],
    },
    {
      key: 'size_type',
      prompt: 'Предпочтения к размеру и форме?',
      placeholder: 'Например: "Нужно высокое напольное растение" или "Маленькое для стола".',
      options: [
        { label: 'Большое, напольное', value: 'large_floor', icon: Zap },
        { label: 'Подвесное, ампельное', value: 'hanging', icon: Droplets },
        { label: 'Маленькое, настольное', value: 'table_top', icon: Feather },
        { label: 'Разные размеры, главное, чтобы вписалось', value: 'any_size', icon: Heart },
      ],
    },
    {
      key: 'extra_notes',
      prompt: 'Ещё какие-то важные примечания?',
      placeholder: 'Например: "Хочу с красными листьями" или "Главное, чтобы не было запаха".',
      options: [
        { label: 'Безопасно для животных', value: 'safe_for_pets' },
        { label: 'Цветущее', value: 'flowering' },
        { label: 'С яркими листьями', value: 'colorful_leaves' },
        { label: 'Теневыносливое', value: 'shade_tolerant' },
        { label: 'Крупногабаритное', value: 'large_volume' },
      ]
    }
  ],
  gift: [
    {
      key: 'recipient',
      prompt: 'Кому ты хочешь подарить?',
      placeholder: 'Например: "Моей девушке" или "Начальнику".',
      options: [
        { label: 'Партнеру (романтика)', value: 'partner', icon: Heart },
        { label: 'Коллеге/Начальнику (сдержанность)', value: 'colleague', icon: User },
        { label: 'Маме/Родственнику (забота)', value: 'family', icon: Gift },
        { label: 'Человеку без опыта ухода', value: 'beginner', icon: Feather },
        { label: 'Опытному любителю цветов', value: 'expert', icon: Zap },
      ],
    },
    {
      key: 'occasion',
      prompt: 'Повод или настроение подарка?',
      placeholder: 'Например: "День рождения" или "Просто так, чтобы подбодрить".',
      options: [
        { label: 'День рождения / Юбилей', value: 'birthday', icon: Gift },
        { label: 'Романтика / Признание', value: 'romantic', icon: Heart },
        { label: 'Забота / Благодарность', value: 'care', icon: Leaf },
        { label: 'Символика (новая работа, переезд)', value: 'symbolic', icon: Zap },
      ],
    },
    {
      key: 'style',
      prompt: 'Предпочтения к внешнему виду подарка?',
      placeholder: 'Например: "Хочу что-то необычное и яркое" или "Сдержанное и зеленое".',
      options: [
        { label: 'Яркое, необычное, цветущее', value: 'expressive', icon: Zap },
        { label: 'Спокойное, зеленое, минималистичное', value: 'minimalist', icon: Feather },
        { label: 'С акцентом на форму (листья/ствол)', value: 'form_accent', icon: Leaf },
        { label: 'Небольшое, для рабочего стола', value: 'office_gift', icon: User },
      ],
    },
    {
      key: 'gift_location',
      prompt: 'Где, скорее всего, оно будет стоять?',
      placeholder: 'Например: "В офисе" или "На подоконнике в спальне".',
      options: [
        { label: 'Подоконник с солнцем', value: 'sunny_window', icon: Sun },
        { label: 'Офисный стол / Кабинет', value: 'office', icon: User },
        { label: 'Кухня или гостиная', value: 'living_area', icon: Heart },
        { label: 'Ванная (светлая или темная)', value: 'bathroom', icon: Droplets },
      ],
    },
    {
      key: 'extra_notes',
      prompt: 'Ещё какие-то важные примечания?',
      placeholder: 'Например: "Хочу с красными листьями" или "Главное, чтобы не было запаха".',
      options: [
        { label: 'Безопасно для животных', value: 'safe_for_pets' },
        { label: 'Цветущее', value: 'flowering' },
        { label: 'С яркими листьями', value: 'colorful_leaves' },
        { label: 'Теневыносливое', value: 'shade_tolerant' },
        { label: 'Долговечное', value: 'long_lasting' },
      ]
    }
  ],
};


// --- Мокированные результаты (10 растений) ---
const mockResults = [
  {
    id: 1,
    plant_name: "Monstera Deliciosa",
    photo: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
    light_requirements: "Bright Indirect Light",
    watering_frequency: "Water when the top 2–3 cm of soil are dry; about once a week in growing season",
    comfort_temp: "18–27°C",
    mature_size: "Climbing or trailing up to 2–3m indoors with support",
    brief_description: "Iconic Monstera with perforated leaves that brings a jungle feel indoors."
  },
  {
    id: 2,
    plant_name: "Snake Plant (Sansevieria)",
    photo: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format",
    light_requirements: "Low to Bright Indirect Light",
    watering_frequency: "Water every 2–3 weeks; allow soil to fully dry",
    comfort_temp: "15–29°C",
    mature_size: "60–100 cm tall depending on variety",
    brief_description: "Very resilient plant, great for beginners. Tolerates neglect and low light."
  },
  {
    id: 3,
    plant_name: "Pothos Golden",
    photo: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    light_requirements: "Low to Medium Indirect Light",
    watering_frequency: "Water when top 2 cm of soil are dry; roughly every 7–10 days",
    comfort_temp: "18–30°C",
    mature_size: "Trailing up to 2m indoors",
    brief_description: "Fast-growing vine with heart-shaped leaves. Great for shelves and hanging pots."
  }
];
// --- Компонент Header ---

const Header = ({ favoritesCount, myPlantsCount, onNavigate, userId, userName }) => (
  <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md border-b border-emerald-100 p-4">
    <div className="max-w-4xl mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-bold text-emerald-700 tracking-tight flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
        <Leaf className="w-6 h-6 mr-2 text-lime-500" />
        Flowers'Choice
      </h1>
      <nav className="flex space-x-2 sm:space-x-4 items-center">
        <button onClick={() => onNavigate('ratings')} className="flex items-center text-sm font-medium text-yellow-500 hover:text-yellow-700 transition-colors bg-yellow-50 p-2 rounded-full" title="Рейтинг растений">
            <Star className="w-5 h-5" />
        </button>
        <button onClick={() => onNavigate('my_plants')} className="relative flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-50 p-2 rounded-full" title="Мои растения">
          <Feather className="w-5 h-5" />
          {myPlantsCount > 0 && <span className="absolute -top-1 -right-1 bg-lime-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">{myPlantsCount}</span>}
        </button>
        <button onClick={() => onNavigate('favorites')} className="relative flex items-center text-sm font-medium text-red-500 hover:text-red-700 transition-colors bg-red-50 p-2 rounded-full" title="Избранное">
          <Heart className="w-5 h-5" />
          {favoritesCount > 0 && <span className="absolute -top-1 -right-1 bg-lime-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">{favoritesCount}</span>}
        </button>
        <button onClick={() => onNavigate('profile')} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-2" title={`Аккаунт (ID: ${userId || 'Гость'})`}>
          <User className="w-5 h-5" />
          {userName && <span className="ml-1 text-emerald-700 font-semibold">{userName}</span>}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('userProfile');
            setUserProfile({});
            setAppState('home');
          }}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors flex items-center"
          title="Начать сначала"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </nav>
    </div>
  </header>
);

// --- Компонент QuestionStep ---

const QuestionStep = ({ question, answer, setAnswer, onNext, isLastStep }) => {
  const initialData = answer[question.key] || { text: '', tags: [] };
  const [textAreaValue, setTextAreaValue] = useState(initialData.text);
  const [selectedTags, setSelectedTags] = useState(initialData.tags);

  // Сохраняем автоматически при изменении
  useEffect(() => {
    setAnswer({
      [question.key]: {
        text: textAreaValue,
        tags: selectedTags
      }
    });
  }, [textAreaValue, selectedTags]);
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const isAnswered = isLastStep ? true : (textAreaValue.trim().length > 0 || selectedTags.length > 0);
  const buttonText = isLastStep ? 'Сгенерировать подборку' : 'Далее';

  const handleNextClick = () => {
    // ❗ ГАРАНТИРУЕМ СОХРАНЕНИЕ ПЕРЕД ПЕРЕХОДОМ
    setAnswer({
      [question.key]: {
        text: textAreaValue,
        tags: selectedTags
      }
    });

    // Теперь можно переходить
    onNext();
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-emerald-800 mb-6 text-center">
        {question.prompt}
      </h2>
      
      <textarea
        value={textAreaValue}
        onChange={(e) => setTextAreaValue(e.target.value)}
        placeholder={question.placeholder}
        rows="4"
        className="w-full p-3 border border-emerald-300 rounded-lg focus:ring-lime-500 focus:border-lime-500 transition-all text-emerald-700"
      />

      <p className="text-sm font-medium text-emerald-600 my-4 text-center">
          Или просто выберите тэги:
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleTag(option.value)}
            className={`
              text-sm px-3 py-1.5 rounded-full transition-colors font-medium
              ${selectedTags.includes(option.value)
                ? 'bg-lime-500 text-white shadow-md'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNextClick}
          disabled={!isAnswered}
          className={`
            py-3 px-6 font-bold rounded-xl transition-all shadow-md flex items-center justify-center
            ${isAnswered
              ? 'bg-lime-500 text-white hover:bg-lime-600 shadow-lime-300/50'
              : 'bg-emerald-200 text-emerald-400 cursor-not-allowed'
            }
          `}
        >
          {isLastStep ? <Zap className="w-5 h-5 mr-2" /> : null}
          {buttonText}
        </button>
      </div>
    </div>
  );
};

// --- Компонент LoadingScreen ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-96">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-lime-500"></div>
    <p className="mt-6 text-xl font-semibold text-emerald-700">
      Генерируем идеальную подборку...
    </p>
    <p className="text-emerald-500 mt-2 text-sm">
      Используем магию природы и немного машинного обучения.
    </p>
  </div>
);

// --- Компонент FlowerResultCard ---
const FlowerResultCard = ({ plant, onLike, onSkip, isLiked }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row mb-6 border border-emerald-100">
    
    {/* фото + имя */}
    <div className="md:w-1/3 p-4 flex flex-col items-center justify-center bg-emerald-50">
      <img
        src={plant.photo}
        alt={plant.plant_name}
        className="w-full h-auto object-cover rounded-xl shadow-md"
        onError={(e) => { e.target.src = "https://placehold.co/400x400/ccc/333?text=No+Image"; }}
      />
      <h3 className="text-xl font-bold text-emerald-800 mt-3 text-center">
        {plant.plant_name}
      </h3>

      {plant.ai_choice && (
        <span className="mt-2 inline-flex items-center px-3 py-1 bg-lime-500 text-white text-sm font-semibold rounded-full shadow-lg">
          <Zap className="w-4 h-4 mr-1" />
          Выбор ИИ
        </span>
      )}
    </div>

    {/* параметры */}
    <div className="md:w-2/3 p-6 flex flex-col justify-between">

      <div>
        <div className="space-y-2 text-emerald-700">
          <p><span className="font-bold">💡 Свет:</span> {plant.light_requirements}</p>
          <p><span className="font-bold">💧 Полив:</span> {plant.watering_frequency}</p>
          <p><span className="font-bold">🌡 Температура:</span> {plant.comfort_temp}</p>
          <p><span className="font-bold">📏 Размер:</span> {plant.mature_size}</p>
        </div>

        <h4 className="text-lg font-semibold text-emerald-700 mb-2 mt-4">Описание:</h4>
        <p className="text-emerald-600 italic leading-relaxed bg-lime-50 p-3 rounded-lg border-l-4 border-lime-400">
          {plant.brief_description}
        </p>
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          onClick={onLike}
          disabled={isLiked}
          className={`flex-1 py-3 px-6 font-bold rounded-xl transition-all shadow-md flex items-center justify-center
            ${isLiked
              ? 'bg-red-400 text-white cursor-not-allowed'
              : 'bg-lime-500 text-white hover:bg-lime-600 shadow-lime-300/50'
            }
          `}
        >
          <ThumbsUp className="w-5 h-5 mr-2" />
          {isLiked ? 'В избранном' : 'Нравится'}
        </button>

        <button
          onClick={onSkip}
          className="flex-1 py-3 px-6 font-bold rounded-xl transition-all shadow-md bg-emerald-200 text-emerald-700 hover:bg-emerald-300 flex items-center justify-center"
        >
          <X className="w-5 h-5 mr-2" />
          Пропустить
        </button>
      </div>

    </div>
  </div>
);

// --- Компонент ComparisonScreen ---

const ComparisonScreen = ({ selectedPlants, onFinishComparison, onAddToMyPlants }) => {
    const [comparisonList, setComparisonList] = useState(selectedPlants);
    const [winner, setWinner] = useState(null);
    
    const [leftPlant, setLeftPlant] = useState(selectedPlants[0]);
    const [rightPlant, setRightPlant] = useState(selectedPlants.length > 1 ? selectedPlants[1] : null);
    const [nextIndex, setNextIndex] = useState(2);

    const handleChoice = (chosenPlant) => {
        const loserPlant = chosenPlant.id === leftPlant.id ? rightPlant : leftPlant;
        const remainingPlants = comparisonList.filter(p => p.id !== loserPlant.id);
        
        if (remainingPlants.length === 1) {
            setWinner(chosenPlant.id);
        } else {
            setComparisonList(remainingPlants); 
            const nextPlantInQueue = selectedPlants[nextIndex];
            if (nextPlantInQueue) {
                if (chosenPlant.id === leftPlant.id) setRightPlant(nextPlantInQueue);
                else setLeftPlant(nextPlantInQueue);
                setNextIndex(prev => prev + 1);
            } else {
                setWinner(chosenPlant.id); 
            }
        }
    };
    
    if (winner) {
        const finalWinner = mockResults.find(p => p.id === winner);

    if (!finalWinner) {
        return <div className="p-8 text-center text-red-500">Ошибка: победитель не найден</div>;
    }

    return (
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-lg mx-auto">
            <Gift className="w-12 h-12 text-lime-600 mx-auto mb-4" />

            <h3 className="text-3xl font-bold text-emerald-800 mb-3">
                Победитель Сравнения!
            </h3>

            <h4 className="text-2xl font-bold text-lime-700 mb-4">
                {finalWinner.plant_name}
            </h4>

            <img
                src={finalWinner.photo}
                alt={finalWinner.plant_name}
                className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 shadow-md"
            />

            <p className="text-emerald-600 mb-4">
                {finalWinner.brief_description}
            </p>

            <div className="text-sm text-emerald-700 space-y-1 mb-6">
                <p><b>💡 Свет:</b> {finalWinner.light_requirements}</p>
                <p><b>💧 Полив:</b> {finalWinner.watering_frequency}</p>
                <p><b>🌡 Темп.:</b> {finalWinner.comfort_temp}</p>
                <p><b>📏 Размер:</b> {finalWinner.mature_size}</p>
            </div>

            <button
                onClick={() => { onAddToMyPlants(finalWinner); onFinishComparison(); }}
                className="w-full py-3 px-6 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition"
            >
                Добавить в Мои растения
            </button>

            <button
                onClick={onFinishComparison}
                className="w-full mt-3 py-3 px-6 bg-lime-500 text-white font-bold rounded-xl hover:bg-lime-600 transition"
            >
                Вернуться в Избранное
            </button>
        </div>
    );
}
    
    if (!leftPlant || !rightPlant) {
        return <div className="text-center text-lg p-8">Недостаточно растений для сравнения. Выберите хотя бы два.</div>;
    }

    return (
        <div className="relative">
            <h2 className="text-3xl font-bold text-emerald-800 mb-8 text-center">
                Режим Сравнения (Осталось: {comparisonList.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ComparisonCard plant={leftPlant} isLeft={true} onSelect={handleChoice} />
                <ComparisonCard plant={rightPlant} isLeft={false} onSelect={handleChoice} />
            </div>
            <p className="text-center text-sm text-emerald-500 mt-6">
                Нажмите на карточку растения, которое вам нравится больше.
            </p>
        </div>
    );
};

// --- Компонент ComparisonCard ---

const ComparisonCard = ({ plant, isLeft, onSelect }) => (
  <div
    onClick={() => onSelect(plant)}
    className={`bg-white rounded-2xl shadow-xl p-6 border-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] text-center
      ${isLeft ? 'border-lime-300 hover:border-lime-500' : 'border-red-300 hover:border-red-500'}
    `}
  >
    <img
      src={plant.photo}
      alt={plant.plant_name}
      className="w-36 h-36 object-cover rounded-xl mb-4 shadow-md"
    />

    <h3 className="text-2xl font-bold text-emerald-800 mb-2">{plant.plant_name}</h3>

    <div className="text-left text-sm text-emerald-700 space-y-1">
      <p><b>💡 Свет:</b> {plant.light_requirements}</p>
      <p><b>💧 Полив:</b> {plant.watering_frequency}</p>
      <p><b>🌡 Темп.:</b> {plant.comfort_temp}</p>
      <p><b>📏 Размер:</b> {plant.mature_size}</p>
    </div>

    <p className="mt-4 text-xs italic text-emerald-500 bg-emerald-50 p-2 rounded-lg">
      {plant.brief_description}
    </p>

    <button
      className={`w-full mt-6 py-3 font-bold rounded-xl text-white shadow-lg 
        ${isLeft ? 'bg-lime-500 hover:bg-lime-600' : 'bg-red-500 hover:bg-red-600'}
      `}
    >
      Выбрать!
    </button>
  </div>
);


// --- Компонент WateringCalendarModal ---
const WateringCalendarModal = ({ plant, onClose }) => {
    const [date, setDate] = useState(new Date());

    const wateringDates = useMemo(() => {
        if (!plant.wateringHistory) return new Set();
        return new Set(
            plant.wateringHistory.map(ts => {
                const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
                return d.toDateString();
            })
        );
    }, [plant.wateringHistory]);

    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const blanks = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handlePrevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    const handleNextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-20 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-emerald-800 mb-4 text-center">График полива: {plant.name}</h3>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                    <div className="font-semibold text-lg">{monthNames[date.getMonth()]} {date.getFullYear()}</div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day} className="font-bold text-gray-500">{day}</div>)}
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {daysArray.map(day => {
                        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
                        const isWatered = wateringDates.has(currentDate.toDateString());
                        return (
                            <div key={day} className={`w-9 h-9 flex items-center justify-center rounded-full ${isWatered ? 'bg-lime-500 text-white' : 'bg-gray-100'}`}>
                                {day}
                            </div>
                        );
                    })}
                </div>
                 <button onClick={onClose} className="mt-6 w-full py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors">Закрыть</button>
            </div>
        </div>
    );
};

// --- Компонент MyPlantCard ---
const MyPlantCard = ({ plant, onUpdate, onRemove }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { status, isDue, lastWatered } = getWateringStatus(plant.wateringHistory, plant.wateringSchedule);
    const [newNotes, setNewNotes] = useState(plant.notes || '');
    
    useEffect(() => {
        const handler = setTimeout(() => {
            if (newNotes !== plant.notes) onUpdate(plant.id, { notes: newNotes });
        }, 1000);
        return () => clearTimeout(handler);
    }, [newNotes, plant.notes, plant.id, onUpdate]);
    
    const handleScheduleChange = (event) => onUpdate(plant.id, { wateringSchedule: parseInt(event.target.value, 10) });
    const handleRatingChange = (newRating) => onUpdate(plant.id, { rating: newRating });
    const handleWatering = () => onUpdate(plant.id, { wateringHistory: arrayUnion(new Date()) });

    return (
        <>
        {isCalendarOpen && <WateringCalendarModal plant={plant} onClose={() => setIsCalendarOpen(false)} />}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-6 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center border-r md:border-r-2 border-emerald-50 pr-4">
                <img src={plant.image} alt={plant.name} className="w-24 h-24 object-cover rounded-lg shadow-md mb-3"/>
                <h4 className="text-xl font-bold text-emerald-800">{plant.name}</h4>
                <p className="text-xs italic text-emerald-500">{plant.latin}</p>
                <button onClick={() => onRemove(plant.id)} className="mt-3 text-red-500 hover:text-red-700 text-sm flex items-center">
                    <X className="w-4 h-4 mr-1" />Удалить
                </button>
            </div>

            <div className="md:border-r-2 border-emerald-50 pr-4">
                <h5 className="text-lg font-semibold text-lime-700 mb-3 flex items-center"><Calendar className="w-5 h-5 mr-2"/> Уход</h5>
                <div className="p-3 rounded-lg flex items-center justify-between text-sm font-medium mb-3" style={{ backgroundColor: isDue ? '#FEE2E2' : '#D1FAE5', color: isDue ? '#EF4444' : '#059669' }}>{status}</div>
                <p className="text-sm text-emerald-600 mb-2">Последний полив: <span className="font-semibold">{formatDate(lastWatered)}</span></p>
                <div className="flex items-center space-x-2 text-sm text-emerald-600 mb-4">
                    <span>График полива (дни):</span>
                    <select value={plant.wateringSchedule || 7} onChange={handleScheduleChange} className="p-1 border border-emerald-300 rounded-md bg-white focus:ring-lime-500 focus:border-lime-500">
                        {[3, 5, 7, 10, 14, 21, 30].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleWatering} className="flex-1 py-2 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition-colors shadow-md flex items-center justify-center text-sm">
                        <Droplets className="w-4 h-4 mr-1" />Я полил(а)!
                    </button>
                    <button onClick={() => setIsCalendarOpen(true)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" title="График полива">
                        <BarChart3 className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            
            <div>
                <h5 className="text-lg font-semibold text-lime-700 mb-3 flex items-center"><Notebook className="w-5 h-5 mr-2"/> Журнал</h5>
                <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map(rating => <Star key={rating} className={`w-6 h-6 cursor-pointer transition-colors ${plant.rating >= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => handleRatingChange(rating)}/>)}
                    <span className="text-sm text-emerald-500 ml-2">({plant.rating || 0} из 5)</span>
                </div>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Ваши заметки..." rows="4" className="w-full p-2 border border-emerald-300 rounded-lg focus:ring-lime-500 focus:border-lime-500 transition-all text-sm"/>
            </div>
        </div>
        </>
    );
};


// --- Компонент MyPlantsScreen ---
const MyPlantsScreen = ({ myPlants, onUpdatePlant, onRemovePlant, onNavigate }) => {
    if (myPlants.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto">
                <Feather className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-emerald-800 mb-3">У вас еще нет растений</h3>
                <p className="text-emerald-600 mb-6">Добавьте растения из раздела "Избранное" или выберите новые в подборке.</p>
                <button onClick={() => onNavigate('home')} className="w-full py-3 px-6 bg-lime-500 text-white font-bold rounded-xl hover:bg-lime-600 transition-all shadow-lg shadow-lime-300/50">
                    <Zap className="w-5 h-5 inline mr-2" />Начать подбор
                </button>
            </div>
        );
    }
    
    const sortedPlants = [...myPlants].sort((a, b) => {
        const aStatus = getWateringStatus(a.wateringHistory, a.wateringSchedule);
        const bStatus = getWateringStatus(b.wateringHistory, b.wateringSchedule);
        if (aStatus.isDue && !bStatus.isDue) return -1;
        if (!aStatus.isDue && bStatus.isDue) return 1;
        return (aStatus.daysLeft || Infinity) - (bStatus.daysLeft || Infinity);
    });

    return (
        <div className="relative">
            <h2 className="text-3xl font-bold text-emerald-800 mb-8 text-center">Мои Растения ({myPlants.length})</h2>
            <div>
                {sortedPlants.map((plant) => (
                    <MyPlantCard key={plant.id} plant={plant} onUpdate={onUpdatePlant} onRemove={onRemovePlant} />
                ))}
            </div>
        </div>
    );
};

// --- Компонент ProfileScreen ---
const ProfileScreen = ({ userProfile, onShowAuth, onLogout }) => {
  const isRegistered = Boolean(userProfile?.name);
  if (!isRegistered) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-xl max-w-lg mx-auto text-center">
        <h2 className="text-3xl font-bold text-emerald-800 mb-4">Личный кабинет</h2>
        <p className="text-emerald-600 mb-6">Чтобы просматривать и редактировать профиль, войдите или зарегистрируйтесь.</p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => onShowAuth('login')} className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg">Войти</button>
          <button onClick={() => onShowAuth('register')} className="py-2 px-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-lg">Зарегистрироваться</button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl max-w-lg mx-auto text-left">
      <h2 className="text-3xl font-bold text-emerald-800 mb-4">Личный кабинет</h2>
      <div className="space-y-2">
        <div><span className="font-semibold text-emerald-700">Имя:</span> {userProfile?.name || '—'}</div>
        <div><span className="font-semibold text-emerald-700">Почта:</span> {userProfile?.email || '—'}</div>
        <div><span className="font-semibold text-emerald-700">Дети:</span> {userProfile?.features.has_children ? 'Да' : 'Нет'}</div>
        <div><span className="font-semibold text-emerald-700">Животные:</span> {userProfile?.features.has_pets ? 'Да' : 'Нет'}</div>
        <div><span className="font-semibold text-emerald-700">Аллергия на цветы:</span> {userProfile?.has_allergies ? 'Да' : 'Нет'}</div>
        <div><span className="font-semibold text-emerald-700">Предпочтения:</span> {userProfile?.features.preferences || '—'}</div>
      </div>
      <button
        onClick={onLogout}
        className="mt-6 w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
      >
        Выйти из профиля
      </button>
    </div>
  );
};

// --- НОВЫЙ Компонент RatingsScreen ---
const RatingsScreen = ({ myPlants, favorites, setFavorites, onNavigate, onAddToMyPlants }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [detailedPlantId, setDetailedPlantId] = useState(null);

    const filteredAndSortedPlants = useMemo(() => {
        return myPlants
            .filter(plant => plant.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }, [myPlants, searchTerm]);

    const handleToggleDetails = (id) => {
        setDetailedPlantId(prev => (prev === id ? null : id));
    };

    const handleAddToFavorites = (plant) => {
        // Find the full plant object from mockResults
        const fullPlantInfo = mockResults.find(p => p.id === plant.originalId);
        if (fullPlantInfo && !favorites.some(f => f.id === fullPlantInfo.id)) {
            setFavorites(prev => [...prev, fullPlantInfo]);
        }
    };
    
    return (
        <div className="relative">
            <h2 className="text-3xl font-bold text-emerald-800 mb-6 text-center">Рейтинг растений</h2>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-lime-500 focus:border-lime-500"
                />
            </div>

            {filteredAndSortedPlants.length > 0 ? (
                filteredAndSortedPlants.map(plant => (
                    <RatingPlantCard
                        key={plant.id}
                        plant={plant}
                        isFavorite={favorites.some(f => f.id === plant.originalId)}
                        onToggleDetails={handleToggleDetails}
                        isDetailed={detailedPlantId === plant.id}
                        onAddToFavorites={() => handleAddToFavorites(plant)}
                        onAddToMyPlants={() => onAddToMyPlants(mockResults.find(p => p.id === plant.originalId))}
                    />
                ))
            ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
                    <p className="text-emerald-600">Растения не найдены. Попробуйте изменить поисковый запрос или добавьте растения в "Мои растения".</p>
                </div>
            )}
        </div>
    );
};

const RatingPlantCard = ({ plant, isFavorite, onToggleDetails, isDetailed, onAddToFavorites }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-4 overflow-hidden">

      <div className="p-4 flex items-center justify-between">

        <div className="w-8/12 flex items-center space-x-4">
          <img src={plant.photo} alt={plant.plant_name} className="w-12 h-12 object-cover rounded-lg" />
          <div>
            <h4 className="text-lg font-semibold text-emerald-800">{plant.plant_name}</h4>

            <div className="flex items-center mt-1">
              {[1,2,3,4,5].map(r => 
                <Star key={r} className={`w-5 h-5 ${plant.rating >= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              )}
            </div>
          </div>
        </div>

        <div className="w-4/12 flex justify-end space-x-2">
          <button
            onClick={onAddToFavorites}
            disabled={isFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'bg-red-100 text-red-300' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          >
            <Heart className="w-5 h-5" />
          </button>

          <button
            onClick={() => onToggleDetails(plant.id)}
            className="p-2 bg-lime-100 text-lime-600 rounded-full hover:bg-lime-200"
          >
            {isDetailed ? <Minus className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {isDetailed && (
        <div className="p-4 pt-0 border-t border-emerald-100 bg-emerald-50">
          <p className="text-sm mb-2 text-emerald-700"><b>Описание:</b> {plant.brief_description}</p>

          <div className="text-sm text-emerald-600 space-y-1">
            <p><b>💡 Свет:</b> {plant.light_requirements}</p>
            <p><b>💧 Полив:</b> {plant.watering_frequency}</p>
            <p><b>🌡 Темп.:</b> {plant.comfort_temp}</p>
            <p><b>📏 Размер:</b> {plant.mature_size}</p>
          </div>

        </div>
      )}

    </div>
  );
};

// --- Главный компонент App ---
const App = () => {
  const [appState, setAppState] = useState('home');
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState([]); 
  const [comparisonPlants, setComparisonPlants] = useState([]); 
  const [showAuthWidget, setShowAuthWidget] = useState(false);
  const [showLoginWidget, setShowLoginWidget] = React.useState(false);
  const [authUser, setAuthUser] = useState(null);
  
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [myPlants, setMyPlants] = useState([]);
  // (Удалена очистка localStorage при загрузке страницы)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('userProfile');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // --- Загрузка профиля пользователя из userProfile.json при старте ---
  // Удаляем загрузку userProfile.json, теперь профиль только через /api/userinfo после логина/регистрации

  // --- FIRESTORE CRUD ---
  const addToMyPlants = useCallback(async (plant) => {
    if (!db || !userId) return;
    if (myPlants.some(p => p.originalId === plant.id)) return;

    const newPlantData = {originalId: plant.id, name: plant.plant_name, latin: plant.plant_name, image: plant.photo, details: plant.brief_description,
      traits: { light: plant.light_requirements, water: plant.watering_frequency, temp: plant.comfort_temp, size: plant.mature_size },
      notes: "", rating: 5, wateringSchedule: 7, wateringHistory: [new Date()], addedAt: new Date() };

    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/my_plants`), newPlantData);
      setFavorites(prev => prev.filter(f => f.id !== plant.id));
      navigate('my_plants');
    } catch (e) { console.error("Error adding document: ", e); }
  }, [db, userId, myPlants]);
  
  const updatePlant = useCallback(async (docId, data) => {
    if (!db || !userId) return;
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/my_plants`, docId), data);
    } catch (e) { console.error("Error updating document: ", e); }
  }, [db, userId]);

  const removePlant = useCallback(async (docId) => {
    if (!db || !userId) return;
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/my_plants`, docId));
    } catch (e) { console.error("Error removing document: ", e); }
  }, [db, userId]);
  
  const updateUserProfile = useCallback(async (data) => {
    if (!db || !userId) return;
    try {
        await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile`, 'user_data'), data, { merge: true });
    } catch (e) { console.error("Error updating profile: ", e); }
  }, [db, userId]);

  // --- FIREBASE SETUP ---
  useEffect(() => {
    if (!firebaseConfig) return;
    try {
      setLogLevel('debug');
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authService = getAuth(app);
      setDb(firestore);
      setAuth(authService);

      const authenticate = async () => {
        if (initialAuthToken) await signInWithCustomToken(authService, initialAuthToken);
        else await signInAnonymously(authService);
      };

      const unsubscribe = onAuthStateChanged(authService, (user) => {
        setUserId(user ? user.uid : crypto.randomUUID());
        setIsAuthReady(true);
      });

      authenticate();
      return () => unsubscribe();
    } catch (error) { console.error("Firebase initialization failed:", error); }
  }, []);
  
  // --- FIRESTORE DATA LISTENERS ---
  useEffect(() => {
    if (!db || !isAuthReady || !userId) return;
    const plantsUnsubscribe = onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/my_plants`)), (snapshot) => {
      setMyPlants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching my plants:", error));
    const profileUnsubscribe = onSnapshot(doc(db, `artifacts/${appId}/users/${userId}/profile`, 'user_data'), (doc) => {
        setUserProfile(doc.exists() ? doc.data() : { name: 'Гость', traits: {} });
    }, (error) => console.error("Error fetching profile:", error));
    return () => { plantsUnsubscribe(); profileUnsubscribe(); };
  }, [db, isAuthReady, userId]);

  // --- NAVIGATION & UTILS ---
  const currentQuestions = useMemo(() => mode ? QUESTIONS[mode] : [], [mode]);
  const totalSteps = currentQuestions.length;

  const navigate = (newState, payload = null) => {
    if (newState === 'compare' && payload) setComparisonPlants(payload);
    setAppState(newState);
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    else if (step === totalSteps) handleGenerate();
  };

  const selectMode = (selectedMode) => {
    setMode(selectedMode);
    setAppState('questionnaire');
    setStep(1); 
  };

  const handleSetAnswer = (newAnswer) => setAnswers((prev) => ({ ...prev, ...newAnswer }));

  const handleGenerate = async () => {
    setIsLoading(true);
    setAppState('loading');

    try {
      const response = await fetch("http://localhost:3001/api/generatePlants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers)
      });

      const data = await response.json();

      mockResults.length = 0;
      data.forEach(p => mockResults.push(p));

      setIsLoading(false);
      setAppState("results");
    } catch (e) {
      console.error("Ошибка API:", e);
      setIsLoading(false);
      setAppState("results");
    }
  };
  
  const handleFinishComparison = () => { setComparisonPlants([]); navigate('favorites'); };
  
  useEffect(() => { window.AppFunctions = { addToMyPlants }; }, [addToMyPlants]);


  // --- RENDER CONTENT ---
  const renderContent = () => {
    if (!isAuthReady) return <LoadingScreen />;
    switch (appState) {
      case 'home': return (
          <div className="p-6 bg-white rounded-2xl shadow-xl">
              <h2 className="text-3xl font-bold text-emerald-800 mb-4 text-center">Flowers'Choice: Подберите свой идеальный цветок</h2>
              <p className="text-emerald-600 text-lg mb-8 text-center">Ответьте на несколько вопросов, и наш сервис найдет растения, которые идеально впишутся в ваш дом или станут прекрасным подарком.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => selectMode('self')} className="flex flex-col items-center justify-center p-6 text-center h-full rounded-xl border-2 transition-all duration-200 shadow-sm bg-white border-emerald-200 text-emerald-800 hover:border-lime-500 hover:shadow-lg">
                      <User className="w-8 h-8 mb-2 text-lime-500" />
                      <span className="text-base font-semibold text-emerald-700">Выбираю для себя</span>
                  </button>
                  <button onClick={() => selectMode('gift')} className="flex flex-col items-center justify-center p-6 text-center h-full rounded-xl border-2 transition-all duration-200 shadow-sm bg-white border-emerald-200 text-emerald-800 hover:border-lime-500 hover:shadow-lg">
                      <Gift className="w-8 h-8 mb-2 text-lime-500" />
                      <span className="text-base font-semibold text-emerald-700">Выбираю в подарок</span>
                  </button>
              </div>
              <p className="text-center text-sm text-emerald-500 mt-6">Начните с выбора режима.</p>
          </div>
      );
      case 'questionnaire': 
          const currentQuestion = currentQuestions[step - 1];
          return (
              <>
                  <div className="flex justify-center items-center my-8"><div className="text-sm font-medium text-emerald-600">Шаг {step} из {totalSteps}</div></div>
                  <QuestionStep key={currentQuestion.key} question={currentQuestion} answer={answers} setAnswer={handleSetAnswer} onNext={nextStep} isLastStep={step === totalSteps} />
              </>
          );
      case 'loading': return <LoadingScreen />;
      case 'results': return <ResultsScreen favorites={favorites} setFavorites={setFavorites} onNavigate={navigate} />;
      case 'favorites': return <FavoritesScreen favorites={favorites} setFavorites={setFavorites} onNavigate={navigate} />;
      case 'compare': return <ComparisonScreen selectedPlants={comparisonPlants} onFinishComparison={handleFinishComparison} onAddToMyPlants={addToMyPlants} />;
      case 'my_plants': return <MyPlantsScreen myPlants={myPlants} onUpdatePlant={updatePlant} onRemovePlant={removePlant} onNavigate={navigate} />;
      case 'profile': return <ProfileScreen
        userProfile={userProfile}
        onShowAuth={(type) => {
          if (type === 'login') setShowLoginWidget(true);
          else setShowAuthWidget(true);
        }}
        onLogout={() => {
          localStorage.removeItem('userProfile');
          setUserProfile({});
          setAppState('home');
        }}
      />;
      case 'ratings': return <RatingsScreen myPlants={myPlants} favorites={favorites} setFavorites={setFavorites} onNavigate={navigate} onAddToMyPlants={addToMyPlants} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col font-sans antialiased">
      <Header favoritesCount={favorites.length} myPlantsCount={myPlants.length} onNavigate={navigate} userId={userId} userName={userProfile?.name || ''} />
      <main className="flex-grow p-4 sm:p-8 max-w-4xl w-full mx-auto">
        <div className="w-full h-full flex flex-col justify-center py-8">
          {renderContent()}
        </div>
      </main>
      {/* Модальное окно регистрации */}
      {showAuthWidget && (
        <AuthModal
          onClose={() => setShowAuthWidget(false)}
          onRegister={async (userData) => {
            let token = null;
            try {
              const res = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData, null, 2)
              });
              const result = await res.json();
              if (result.success && result.token) {
                token = result.token;
              } else {
                throw new Error(result.message || 'Ошибка регистрации');
              }
            } catch (e) {
              console.error('Ошибка сохранения профиля:', e);
              return;
            }
            // Получаем профиль пользователя через /api/userinfo
            try {
              const res = await fetch('http://localhost:3001/api/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success && data.user) {
                setUserProfile(data.user);
                localStorage.setItem('userProfile', JSON.stringify(data.user));
              }
            } catch (e) {
              console.error('Ошибка получения профиля:', e);
            }
            setShowAuthWidget(false);
            navigate('home');
          }}
        />
      )}
      {/* Модальное окно логина */}
      {showLoginWidget && (
        <LoginModal
          onClose={() => setShowLoginWidget(false)}
          onLogin={async (loginResult) => {
            // loginResult должен содержать token
            let token = loginResult.token;
            if (!token && loginResult && loginResult.success && loginResult.token) token = loginResult.token;
            if (!token) {
              setShowLoginWidget(false);
              return;
            }
            localStorage.setItem('authToken', token);
            try {
              const res = await fetch('http://localhost:3001/api/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success && data.user) {
                setUserProfile(data.user);
                localStorage.setItem('userProfile', JSON.stringify(data.user));
              }
            } catch (e) {
              console.error('Ошибка получения профиля:', e);
            }
            setShowLoginWidget(false);
            navigate('home');
          }}
        />
      )}
      <div className="p-4 text-center text-xs text-gray-400">
          {userId && `Текущий ID пользователя: ${userId}`}
      </div>
    </div>
  );
};

// --- Внутренние компоненты, которые используются в App ---

const ResultsScreen = ({ favorites, setFavorites, onNavigate }) => {
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const plant = mockResults[currentPlantIndex];
  const isLastCard = currentPlantIndex === mockResults.length - 1;
  const isLiked = favorites.some(f => f.id === plant?.id);

  const handleLike = async () => {
    if (!isLiked && plant) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3001/api/savefavourites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plant_id: plant.id })
        });
        const result = await response.json();
        setFavorites(prev => [...prev, plant]);
        if (response.ok) {
        } else {
          // Можно показать ошибку пользователю, если нужно
          console.error(result.message || 'Ошибка при добавлении в избранное');
        }
      } catch (e) {
        console.error('Ошибка сети при добавлении в избранное:', e);
      }
    }
    handleNext();
  };
  const handleSkip = () => handleNext();
  const handleNext = () => {
    if (isLastCard) setShowFinalModal(true);
    else setCurrentPlantIndex(prev => prev + 1);
  };
  
  if (showFinalModal) return <FinalModal favoritesCount={favorites.length} onNavigate={onNavigate} />;
  if (!plant) return <div className="text-center text-lg text-emerald-500 p-8 bg-white rounded-xl shadow-lg">Ошибка: Растения для показа не найдены.</div>;

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold text-emerald-800 mb-8 text-center">Ваша подборка ({currentPlantIndex + 1} из {mockResults.length})</h2>
      <FlowerResultCard plant={plant} onLike={handleLike} onSkip={handleSkip} isLiked={isLiked} />
      <div className="w-full bg-emerald-200 rounded-full h-2.5 mt-4">
        <div className="bg-lime-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentPlantIndex + 1) / mockResults.length) * 100}%` }}></div>
      </div>
    </div>
  );
};

const FinalModal = ({ favoritesCount, onNavigate }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-20 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <Gift className="w-12 h-12 text-lime-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-emerald-800 mb-3">Подборка завершена!</h3>
            <p className="text-lg text-emerald-600 mb-6">Вы просмотрели все 10 вариантов и выбрали <span className="font-extrabold text-lime-700">{favoritesCount}</span> {favoritesCount === 1 ? 'растение' : favoritesCount >= 2 && favoritesCount <= 4 ? 'растения' : 'растений'} в Избранное.</p>
            <button onClick={() => onNavigate('favorites')} className="w-full py-3 px-6 bg-lime-500 text-white font-bold rounded-xl hover:bg-lime-600 transition-all shadow-lg shadow-lime-300/50 flex items-center justify-center mx-auto">
                <Heart className="w-5 h-5 mr-2" />Перейти в Избранное
            </button>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-emerald-500 hover:text-emerald-700 transition-colors">Начать новый подбор</button>
        </div>
    </div>
);

const FavoriteItem = ({ plant, onRemove, onToggleDetails, isDetailed, onToggleSelect, isSelected, onAddToMyPlants }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-4 overflow-hidden">

      <div className="p-4 flex items-center justify-between">
        
        <div className="w-1/12">
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(plant.id)}
            className="w-5 h-5 text-lime-500 bg-gray-100 border-gray-300 rounded focus:ring-lime-500 cursor-pointer"
          />
        </div>

        <div className="w-6/12 flex items-center space-x-4">
          <img
            src={plant.photo}
            alt={plant.plant_name}
            className="w-12 h-12 object-cover rounded-lg"
            onError={(e) => { e.target.src = "https://placehold.co/100x100/ccc/333?text=Img" }}
          />
          <div>
            <h4 className="text-lg font-semibold text-emerald-800">
              {plant.plant_name}
            </h4>
          </div>
        </div>

        <div className="w-5/12 flex justify-end space-x-2">

          <button onClick={() => onAddToMyPlants(plant)} className="p-2 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200">
            <Plus className="w-5 h-5" />
          </button>

          <button onClick={() => onToggleDetails(plant.id)} className="p-2 bg-lime-100 text-lime-600 rounded-full hover:bg-lime-200">
            {isDetailed ? <Minus className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <button onClick={() => onRemove(plant.id)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
            <X className="w-5 h-5" />
          </button>

        </div>
      </div>

      {isDetailed && (
        <div className="p-4 pt-0 border-t border-emerald-100 bg-emerald-50">
          <p className="text-sm text-emerald-700 mb-2"><b>Описание:</b> {plant.brief_description}</p>

          <div className="space-y-1 text-emerald-600 text-sm">
            <p><b>💡 Свет:</b> {plant.light_requirements}</p>
            <p><b>💧 Полив:</b> {plant.watering_frequency}</p>
            <p><b>🌡 Темпер.:</b> {plant.comfort_temp}</p>
            <p><b>📏 Размер:</b> {plant.mature_size}</p>
          </div>
        </div>
      )}

    </div>
  );
};

const FavoritesScreen = ({ favorites, setFavorites, onNavigate }) => {
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [detailedPlantId, setDetailedPlantId] = useState(null);

  const handleAddToMyPlants = (plant) => {
    if (window.AppFunctions?.addToMyPlants) window.AppFunctions.addToMyPlants(plant);
  };
  const handleRemoveFavorite = (id) => {
    setFavorites(prev => prev.filter(p => p.id !== id));
    setSelectedForComparison(prev => prev.filter(pId => pId !== id)); 
  };
  const handleToggleDetails = (id) => setDetailedPlantId(detailedPlantId === id ? null : id);
  const handleToggleSelect = (id) => setSelectedForComparison(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  const handleSelectAll = () => {
      if (selectedForComparison.length === favorites.length) setSelectedForComparison([]);
      else setSelectedForComparison(favorites.map(f => f.id));
  };
  const startComparison = () => {
    if (selectedForComparison.length < 2) return;
    onNavigate('compare', favorites.filter(f => selectedForComparison.includes(f.id)));
  };
  
  if (favorites.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto">
        <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-emerald-800 mb-3">Ваш список избранного пуст</h3>
        <p className="text-emerald-600 mb-6">Чтобы начать, пройдите опрос и нажмите на сердечко у понравившихся растений.</p>
        <button onClick={() => onNavigate('home')} className="w-full py-3 px-6 bg-lime-500 text-white font-bold rounded-xl hover:bg-lime-600 transition-all shadow-lg shadow-lime-300/50">
            <Zap className="w-5 h-5 inline mr-2" />Начать подбор
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold text-emerald-800 mb-6 text-center">Избранное ({favorites.length} {favorites.length === 1 ? 'растение' : favorites.length >= 2 && favorites.length <= 4 ? 'растения' : 'растений'})</h2>
      <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center mb-6 border border-emerald-100">
        <div className="flex items-center space-x-3">
            <button onClick={handleSelectAll} className="flex items-center text-sm font-medium text-emerald-700 hover:text-lime-600 transition-colors p-2 rounded-lg bg-emerald-50">
                {selectedForComparison.length === favorites.length ? <Minus className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                {selectedForComparison.length === favorites.length ? 'Снять выделение' : 'Выбрать все'}
            </button>
            <span className="text-sm text-emerald-500">Выбрано: {selectedForComparison.length}</span>
        </div>
        <button onClick={startComparison} disabled={selectedForComparison.length < 2} className={`py-2 px-4 font-bold rounded-xl transition-all shadow-lg flex items-center ${selectedForComparison.length >= 2 ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-300/50' : 'bg-red-200 text-red-400 cursor-not-allowed'}`}>
          <GitCompare className="w-5 h-5 mr-2" />Режим Сравнения
        </button>
      </div>
      <div>
        {favorites.map((plant) => (
          <FavoriteItem key={plant.id} plant={plant} onRemove={handleRemoveFavorite} onToggleDetails={handleToggleDetails} isDetailed={detailedPlantId === plant.id} onToggleSelect={handleToggleSelect} isSelected={selectedForComparison.includes(plant.id)} onAddToMyPlants={handleAddToMyPlants} />
        ))}
      </div>
    </div>
  );
};

export default App;
