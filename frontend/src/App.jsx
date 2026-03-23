import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import LandingPage from './LendingPage';

// header
import Header from './components/header/Header';

// auth
import AuthModal from './components/auth/AuthModal';
import LoginModal from './components/auth/LoginModal';
import AuthRequiredModal from './components/auth/AuthRequiredModal';

// questionnaire
import QuestionStep from './components/question/QuestionStep';

// ui
import LoadingScreen from './components/ui/LoadingScreen';

// results
import ResultsScreen from './components/results/ResultsScreen';
import ComparisonScreen from './components/comparison/ComparisonScreen';

// favorites
import FavoritesScreen from './components/favorites/FavoritesScreen';

// manual selection
import ManualSelectionScreen from './components/manual/ManualSelectionScreen';

// my plants
import MyPlantsScreen from './components/my-plants/MyPlantsScreen';

// ratings
import RatingsScreen from './components/ratings/RatingsScreen';

// profile
import ProfileScreen from './components/profile/ProfileScreen';

// constants
import { QUESTIONS } from './constants/questions';
import { mockResults } from './constants/mockResults';

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

// --- Главный компонент App ---
const App = () => {
  const [appState, setAppState] = useState('landing');
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState([]); 
  const [comparisonPlants, setComparisonPlants] = useState([]); 
  const [showAuthWidget, setShowAuthWidget] = useState(false);
  const [showLoginWidget, setShowLoginWidget] = React.useState(false);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  
  // eslint-disable-next-line no-unused-vars
  const [userId, setUserId] = useState(null);
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
  // --- STUBS for plant actions (replace with backend logic if needed) ---
  const addToMyPlants = useCallback(async (plant) => {
    if (!plant || !plant.id) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      setShowAuthRequired(true);
      return;
    }
    // Проверяем по id и originalId (на случай разных структур)
    if (myPlants.some(p => p.originalId === plant.id || p.id === plant.id)) return;
    // Унифицируем структуру для MyPlants
    const newPlantData = {
      id: plant.id, // для локального отображения
      originalId: plant.id,
      name: plant.name || plant.plant_name || '',
      latin: plant.latin || plant.plant_name || '',
      image: plant.image || plant.photo || '',
      details: plant.details || plant.brief_description || '',
      traits: plant.traits || {
        light: plant.light_requirements,
        water: plant.watering_frequency,
        temp: plant.comfort_temp,
        size: plant.mature_size
      },
      notes: '',
      rating: 0,
      wateringSchedule: 7,
      wateringHistory: [new Date()],
      addedAt: new Date()
    };
    setMyPlants(prev => [...prev, newPlantData]);
    setFavorites(prev => prev.filter(f => f.id !== plant.id));
    navigate('my_plants');
  }, [myPlants]);

  const updatePlant = useCallback(async (docId, data) => {
    setMyPlants(prev => prev.map(p => p.id === docId ? { ...p, ...data } : p));

    if (Object.prototype.hasOwnProperty.call(data, 'rating')) {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('/api/update-plant-score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plant_id: docId,
            score: data.rating
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      } catch (e) {
        console.error('Ошибка обновления оценки растения:', e);
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'notes')) {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('/api/update-plant-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plant_id: docId,
            notes: data.notes
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      } catch (e) {
        console.error('Ошибка обновления заметок растения:', e);
      }
    }
  }, []);

  const removePlant = useCallback(async (docId) => {
  const token = localStorage.getItem('authToken');

  try {
    if (token) {
      await fetch('/api/remove-plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flag: 'my_plant',
          plant_id: docId
        })
      });
    }

    setMyPlants(prev => prev.filter(p => p.id !== docId));

    } catch (e) {
      console.error('Ошибка удаления из моих растений:', e);
    }
  }, []);

  // eslint-disable-next-line no-unused-vars
  const updateUserProfile = useCallback(async (data) => {
    setUserProfile(prev => ({ ...prev, ...data }));
  }, []);

  const transformMyPlants = useCallback((plants = []) => {
    return plants.map(plant => ({
      id: plant.id,
      originalId: plant.id,
      name: plant.plant_name,
      latin: plant.plant_name,
      image: plant.photo,
      details: plant.brief_description,
      traits: {
        light: plant.light_requirements,
        water: plant.watering_frequency,
        temp: plant.comfort_temp,
        size: plant.mature_size
      },
      notes: plant.notes || '',
      rating: plant.score || 0,
      wateringSchedule: 7,
      wateringHistory: [new Date()],
      addedAt: new Date()
    }));
  }, []);

  const loadUserPlantsData = useCallback(async (token) => {
    if (!token) {
      setFavorites([]);
      setMyPlants([]);
      return;
    }

    try {
      const favRes = await fetch('/api/userplants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (favRes.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
        setFavorites([]);
        setMyPlants([]);
        setUserProfile({});
        return;
      }

      const favData = await favRes.json();
      if (favData.success) {
        setFavorites(Array.isArray(favData.favorite) ? favData.favorite : []);
        setMyPlants(transformMyPlants(Array.isArray(favData.my_plant) ? favData.my_plant : []));
      } else {
        setFavorites([]);
        setMyPlants([]);
      }
    } catch (e) {
      console.error('Ошибка получения растений пользователя:', e);
      setFavorites([]);
      setMyPlants([]);
    }
  }, [transformMyPlants]);

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

  const handleSetAnswer = useCallback((newAnswer) => {
    setAnswers((prev) => ({ ...prev, ...newAnswer }));
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setAppState('loading');

    try {
      const token = localStorage.getItem('authToken');
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/search-plants", {
        method: "POST",
        headers,
        body: JSON.stringify(answers)
      });

      const data = await response.json();

      mockResults.length = 0;
      data.forEach(p => mockResults.push(p));

      setAnswers({});
      setStep(0);
      setMode(null);

      setIsLoading(false);
      setAppState("results");
    } catch (e) {
      console.error("Ошибка API:", e);
      setAnswers({});
      setStep(0);
      setMode(null);
      setIsLoading(false);
      setAppState("results");
    }
  };
  
  const handleFinishComparison = () => { setComparisonPlants([]); navigate('favorites'); };
  
  useEffect(() => { window.AppFunctions = { addToMyPlants }; }, [addToMyPlants]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setFavorites([]);
      setMyPlants([]);
      return;
    }
    loadUserPlantsData(token);
  }, [loadUserPlantsData]);


  // --- RENDER CONTENT ---
  const renderContent = () => {

    switch (appState) {
      case 'landing': return (
        <LandingPage
          onStartSelection={(selectedMode) => {
            if (selectedMode === 'self' || selectedMode === 'gift') {
              selectMode(selectedMode);
              return;
            }
            navigate('home');
          }}
          onShowAuth={(type) => {
            if (type === 'login') setShowLoginWidget(true);
            else setShowAuthWidget(true);
          }}
        />
      );
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
                            <p className="text-center text-sm text-emerald-600 mt-5">
                <span onClick={() => navigate('manual_selection')} className="underline cursor-pointer hover:text-emerald-700">
                  Режим ручного выбора
                </span>
              </p>
<p className="text-center text-sm text-emerald-500 mt-6">Начните с выбора режима.</p>
          </div>
      );
      case 'questionnaire': {
          const currentQuestion = currentQuestions[step - 1];
          return (
              <>
                  <div className="flex justify-center items-center my-8"><div className="text-sm font-medium text-emerald-600">Шаг {step} из {totalSteps}</div></div>
                  <QuestionStep key={currentQuestion.key} question={currentQuestion} answer={answers} setAnswer={handleSetAnswer} onNext={nextStep} isLastStep={step === totalSteps} />
              </>
          );
      }
      case 'loading': return <LoadingScreen />;
      case 'results': return <ResultsScreen favorites={favorites} setFavorites={setFavorites} onNavigate={navigate} />;
      case 'favorites': return <FavoritesScreen favorites={favorites} setFavorites={setFavorites} onNavigate={navigate} onAddToMyPlants={addToMyPlants} onRequireAuth={() => setShowAuthRequired(true)} />;
      case 'manual_selection': return <ManualSelectionScreen favorites={favorites} setFavorites={setFavorites} onNavigate={navigate} />;
      case 'compare': return <ComparisonScreen selectedPlants={comparisonPlants} onFinishComparison={handleFinishComparison} onAddToMyPlants={addToMyPlants} onRequireAuth={() => setShowAuthRequired(true)} />;
      case 'my_plants': return <MyPlantsScreen myPlants={myPlants} onUpdatePlant={updatePlant} onRemovePlant={removePlant} onNavigate={navigate} />;
      case 'profile': return <ProfileScreen
        userProfile={userProfile}
        onShowAuth={(type) => {
          if (type === 'login') setShowLoginWidget(true);
          else setShowAuthWidget(true);
        }}
        onLogout={() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          setFavorites([]);
          setMyPlants([]);
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
      <main className={appState === 'landing' ? 'flex-grow' : 'flex-grow p-4 sm:p-8 max-w-4xl w-full mx-auto'}>
        {appState === 'landing' ? (
          renderContent()
        ) : (
          <div className="w-full h-full flex flex-col justify-center py-8">
            {renderContent()}
          </div>
        )}
      </main>
      {/* Модальное окно регистрации */}
      {showAuthWidget && (
        <AuthModal
          onClose={() => setShowAuthWidget(false)}
          onRegister={async (userData) => {
            let token = null;
            try {
              const res = await fetch('/api/register', {
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
            localStorage.setItem('authToken', token);
            // Получаем профиль пользователя через /api/userinfo
            try {
              const res = await fetch('/api/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success && data.user) {
                setUserProfile(data.user);
                localStorage.setItem('userProfile', JSON.stringify(data.user));
              }
              
              // Загружаем избранные растения пользователя (для нового пользователя пустой список)
              const favRes = await fetch('/api/userplants', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const favData = await favRes.json();
              if (favData.success) {
                setFavorites(favData.favorite);
                // Преобразуем my_plant в формат для myPlants
                const transformedMyPlants = favData.my_plant.map(plant => ({
                  id: plant.id,
                  originalId: plant.id,
                  name: plant.plant_name,
                  latin: plant.plant_name,
                  image: plant.photo,
                  details: plant.brief_description,
                  traits: {
                    light: plant.light_requirements,
                    water: plant.watering_frequency,
                    temp: plant.comfort_temp,
                    size: plant.mature_size
                  },
                  notes: '',
                  rating: Number.isFinite(Number(plant.score)) ? Number(plant.score) : 0,
                  wateringSchedule: 7,
                  wateringHistory: [new Date()],
                  addedAt: new Date()
                }));
                setMyPlants(transformedMyPlants);
              }
              await loadUserPlantsData(token);
            } catch (e) {
              console.error('Ошибка получения профиля или избранных:', e);
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
              const res = await fetch('/api/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success && data.user) {
                setUserProfile(data.user);
                localStorage.setItem('userProfile', JSON.stringify(data.user));
              }
              
              // Загружаем избранные растения пользователя
              const favRes = await fetch('/api/userplants', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const favData = await favRes.json();
              if (favData.success) {
                setFavorites(favData.favorite);
                // Преобразуем my_plant в формат для myPlants
                const transformedMyPlants = favData.my_plant.map(plant => ({
                  id: plant.id,
                  originalId: plant.id,
                  name: plant.plant_name,
                  latin: plant.plant_name,
                  image: plant.photo,
                  details: plant.brief_description,
                  traits: {
                    light: plant.light_requirements,
                    water: plant.watering_frequency,
                    temp: plant.comfort_temp,
                    size: plant.mature_size
                  },
                  notes: '',
                  rating: Number.isFinite(Number(plant.score)) ? Number(plant.score) : 0,
                  wateringSchedule: 7,
                  wateringHistory: [new Date()],
                  addedAt: new Date()
                }));
                setMyPlants(transformedMyPlants);
              }
              await loadUserPlantsData(token);
            } catch (e) {
              console.error('Ошибка получения профиля или избранных:', e);
            }
            setShowLoginWidget(false);
            navigate('home');
          }}
        />
      )}
      {showAuthRequired && (
        <AuthRequiredModal
          onClose={() => setShowAuthRequired(false)}
          onLogin={() => {
            setShowAuthRequired(false);
            setShowLoginWidget(true);
          }}
          onRegister={() => {
            setShowAuthRequired(false);
            setShowAuthWidget(true);
          }}
        />
      )}
      {userId && (
        <div className="p-4 text-center text-xs text-gray-400">
          {`Текущий ID пользователя: ${userId}`}
        </div>
      )}
    </div>
  );
};


export default App;
// eslint-disable-next-line react-refresh/only-export-components
export { getWateringStatus, formatDate };
