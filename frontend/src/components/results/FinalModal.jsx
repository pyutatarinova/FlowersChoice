import React from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

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

export default FinalModal;