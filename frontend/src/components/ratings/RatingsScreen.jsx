import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import RatingPlantCard from '../../components/ratings/RatingPlantCard';

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

export default RatingsScreen;