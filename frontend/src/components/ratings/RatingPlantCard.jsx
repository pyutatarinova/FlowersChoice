import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

const RatingPlantCard = ({ plant, isFavorite, onToggleDetails, isDetailed, onAddToFavorites }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-4 overflow-hidden">

      <div className="p-4 flex items-center justify-between">

        <div className="w-8/12 flex items-center space-x-4">
          <img src={plant.photo} alt={plant.plant_name} className="w-12 h-12 object-cover rounded-lg" />
          <div>
            <h4 className="text-lg font-semibold text-emerald-800">{plant.plant_name}</h4>

            <div className="flex items-center mt-1">
              {[1,2,3,4,5].map(r => 
                <Star key={r} className={`w-5 h-5 ${plant.rating >= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              )}
            </div>
          </div>
        </div>

        <div className="w-4/12 flex justify-end space-x-2">
          <button
            onClick={onAddToFavorites}
            disabled={isFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'bg-red-100 text-red-300' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          >
            <Heart className="w-5 h-5" />
          </button>

          <button
            onClick={() => onToggleDetails(plant.id)}
            className="p-2 bg-lime-100 text-lime-600 rounded-full hover:bg-lime-200"
          >
            {isDetailed ? <Minus className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {isDetailed && (
        <div className="p-4 pt-0 border-t border-emerald-100 bg-emerald-50">
          <p className="text-sm mb-2 text-emerald-700"><b>Описание:</b> {plant.brief_description}</p>

          <div className="text-sm text-emerald-600 space-y-1">
            <p><b>💡 Свет:</b> {plant.light_requirements}</p>
            <p><b>💧 Полив:</b> {plant.watering_frequency}</p>
            <p><b>🌡 Темп.:</b> {plant.comfort_temp}</p>
            <p><b>📏 Размер:</b> {plant.mature_size}</p>
          </div>

        </div>
      )}

    </div>
  );
};

export default RatingPlantCard;