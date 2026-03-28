import React, { useState } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import FinalModal from '../../components/results/FinalModal';
import FlowerResultCard from '../../components/results/FlowerResultCard';
import { mockResults } from '../../constants/mockResults';

const ResultsScreen = ({ favorites, setFavorites, onNavigate, isGuest, onShowAuth }) => {
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const plant = mockResults[currentPlantIndex];
  const isLastCard = currentPlantIndex === mockResults.length - 1;
  const isLiked = favorites.some(f => f.id === plant?.id);

  const handleLike = async () => {
    if (!isLiked && plant) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/savefavourites', {
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
          // Успешно добавлено в избранное
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
      {isGuest && (
        <div className="mb-6 text-center text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
          <div className="mb-2">Зарегистрируйтесь, чтобы сохранить выбранные растения</div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => onShowAuth && onShowAuth('register')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-lime-500 text-white hover:bg-lime-600 transition-colors">
              Зарегистрироваться
            </button>
            <button  onClick={() => onShowAuth && onShowAuth('login')} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors" >
                   Войти
            </button>
          </div>
        </div>
      )}
      <FlowerResultCard plant={plant} onLike={handleLike} onSkip={handleSkip} isLiked={isLiked} />
      <div className="w-full bg-emerald-200 rounded-full h-2.5 mt-4">
        <div className="bg-lime-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentPlantIndex + 1) / mockResults.length) * 100}%` }}></div>
      </div>
    </div>
  );
};

export default ResultsScreen;


