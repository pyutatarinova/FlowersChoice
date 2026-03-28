import React from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import MyPlantCard from '../../components/my-plants/MyPlantCard';
import { getWateringStatus } from '../../lib/wateringUtils';

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
        const aStatus = getWateringStatus(a.wateringHistory, a.wateringSchedule, a.lastWateringDate);
        const bStatus = getWateringStatus(b.wateringHistory, b.wateringSchedule, b.lastWateringDate);
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

export default MyPlantsScreen;
