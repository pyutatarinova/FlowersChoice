import React from 'react';
import { Plus, Minus, ChevronRight, X } from 'lucide-react';


const FavoriteItem = ({ plant, onRemove, onToggleDetails, isDetailed, onToggleSelect, isSelected, onAddToMyPlants }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-4 overflow-hidden">

      <div className="p-4 flex items-center justify-between">
        
        <div className="w-1/12">
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(plant.id)}
            className="w-5 h-5 text-lime-500 bg-gray-100 border-gray-300 rounded focus:ring-lime-500 cursor-pointer"
          />
        </div>

        <div className="w-6/12 flex items-center space-x-4">
          <img
            src={plant.photo}
            alt={plant.plant_name}
            className="w-12 h-12 object-cover rounded-lg"
            onError={(e) => { e.target.src = "https://placehold.co/100x100/ccc/333?text=Img" }}
          />
          <div>
            <h4 className="text-lg font-semibold text-emerald-800">
              {plant.plant_name}
            </h4>
          </div>
        </div>

        <div className="w-5/12 flex justify-end space-x-2">

          <button onClick={() => onAddToMyPlants(plant)} className="p-2 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200">
            <Plus className="w-5 h-5" />
          </button>

          <button onClick={() => onToggleDetails(plant.id)} className="p-2 bg-lime-100 text-lime-600 rounded-full hover:bg-lime-200">
            {isDetailed ? <Minus className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <button onClick={() => onRemove(plant.id)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
            <X className="w-5 h-5" />
          </button>

        </div>
      </div>

      {isDetailed && (
        <div className="p-4 pt-0 border-t border-emerald-100 bg-emerald-50">
          <p className="text-sm text-emerald-700 mb-2"><b>Описание:</b> {plant.brief_description}</p>

          <div className="space-y-1 text-emerald-600 text-sm">
            <p><b>💡 Свет:</b> {plant.light_requirements}</p>
            <p><b>💧 Полив:</b> {plant.watering_frequency}</p>
            <p><b>🌡 Темпер.:</b> {plant.comfort_temp}</p>
            <p><b>📏 Размер:</b> {plant.mature_size}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default FavoriteItem;