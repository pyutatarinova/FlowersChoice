import React from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

const ProfileScreen = ({ userProfile, onShowAuth, onLogout }) => {
  const isRegistered = Boolean(userProfile?.name && userProfile?.name != 'Гость');
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

export default ProfileScreen;