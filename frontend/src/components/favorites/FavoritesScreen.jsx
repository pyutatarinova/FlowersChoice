import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import FavoriteItem from '../../components/favorites/FavoriteItem';

const FavoritesScreen = ({ favorites, setFavorites, onNavigate }) => {
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [detailedPlantId, setDetailedPlantId] = useState(null);

  const handleAddToMyPlants = async (plant) => {
    if (window.AppFunctions?.addToMyPlants) window.AppFunctions.addToMyPlants(plant);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Необходимо авторизоваться');
        return;
      }

      const response = await fetch('http://localhost:3001/api/add-my-plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plant_id: plant.id })
      });

      const result = await response.json();
      
    } catch (error) {
      console.error('Error adding plant to my plants:', error);
      alert('Ошибка при добавлении растения');
    }
  };
  
  const handleRemoveFavorite = async (id) => {
  const token = localStorage.getItem('authToken');

    try {
    if (token) {
      await fetch('http://localhost:3001/api/set-plant-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flag: 'favorite',
          plant_id: id
        })
      });
    }
    
    setFavorites(prev => prev.filter(p => p.id !== id));
    setSelectedForComparison(prev => prev.filter(pId => pId !== id));

    } catch (e) {
      console.error('Ошибка удаления из избранного:', e);
    }
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

export default FavoritesScreen;