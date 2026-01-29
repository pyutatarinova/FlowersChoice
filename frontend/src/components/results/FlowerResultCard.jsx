import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

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

export default FlowerResultCard;