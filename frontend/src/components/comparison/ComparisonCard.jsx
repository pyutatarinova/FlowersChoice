import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

const ComparisonCard = ({ plant, isLeft, onSelect }) => (
  <div
    onClick={() => onSelect(plant)}
    className={`bg-white rounded-2xl shadow-xl p-6 border-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] text-center border-lime-300 hover:border-lime-500 h-full flex flex-col`}
  >
    <img
      src={plant.photo}
      alt={plant.plant_name}
      className="w-36 h-36 object-cover rounded-xl mb-4 shadow-md mx-auto"
    />

    <h3 className="text-2xl font-bold text-emerald-800 mb-2">{plant.plant_name}</h3>

    <div className="text-left text-sm text-emerald-700 space-y-1">
      <p><b>💡 Свет:</b> {plant.light_requirements}</p>
      <p><b>💧 Полив:</b> {plant.watering_frequency}</p>
      <p><b>🌡 Темп.:</b> {plant.comfort_temp}</p>
      <p><b>📏 Размер:</b> {plant.mature_size}</p>
    </div>

    <p className="mt-4 mb-4 text-xs italic text-emerald-500 bg-emerald-50 p-2 rounded-lg">
      {plant.brief_description}
    </p>

    <button
      className={`w-full mt-6 py-3 font-bold rounded-xl text-white shadow-lg bg-lime-500 hover:bg-lime-600 mt-auto`}
    >
      Выбрать!
    </button>
  </div>
);

export default ComparisonCard;
