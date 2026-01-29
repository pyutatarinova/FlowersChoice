import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

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
        {/* <button
          onClick={() => {
            localStorage.removeItem('userProfile');
            setUserProfile({});
            setAppState('home');
          }}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors flex items-center"
          title="Начать сначала"
        >
          <RefreshCcw className="w-4 h-4" />
        </button> */}
      </nav>
    </div>
  </header>
);

export default Header;