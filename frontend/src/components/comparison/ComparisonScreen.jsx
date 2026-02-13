import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import ComparisonCard from '../../components/comparison/ComparisonCard';


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
            setWinner(chosenPlant);
        } else {
            setComparisonList(remainingPlants); 
            const nextPlantInQueue = selectedPlants[nextIndex];
            if (nextPlantInQueue) {
                if (chosenPlant.id === leftPlant.id) setRightPlant(nextPlantInQueue);
                else setLeftPlant(nextPlantInQueue);
                setNextIndex(prev => prev + 1);
            } else {
                setWinner(chosenPlant); 
            }
        }
    };
    
    if (winner) {
        const finalWinner = winner;

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

export default ComparisonScreen;
