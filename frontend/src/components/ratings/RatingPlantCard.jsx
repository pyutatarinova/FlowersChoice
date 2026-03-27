import React, { useState } from 'react';
import { Heart, ChevronRight, Minus, Maximize2, X } from 'lucide-react';
import PlantShareMenu from '../share/PlantShareMenu';
import { getPlantPath } from '../../utils/plantLinks';

const StarIcon = ({ fillFraction = 0, uniqueId }) => {
  const clamped = Math.max(0, Math.min(1, fillFraction));
  const clipId = `star-fill-${uniqueId}`;

  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={24 * clamped} height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.5l2.86 5.79 6.39.93-4.63 4.51 1.09 6.36L12 17.77 6.29 20.09l1.09-6.36L2.75 9.22l6.39-.93L12 2.5z"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.5l2.86 5.79 6.39.93-4.63 4.51 1.09 6.36L12 17.77 6.29 20.09l1.09-6.36L2.75 9.22l6.39-.93L12 2.5z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="1.2"
        strokeLinejoin="round"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
};

const formatRating = (ratingValue) => {
  const num = Number(ratingValue ?? 0);
  if (!Number.isFinite(num)) return '0/5';
  const rounded = Number(num.toFixed(1));
  const display = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  return `${display}/5`;
};

const RatingPlantCard = ({ plant, isFavorite, onToggleDetails, isDetailed, onAddToFavorites, onOpenPlant }) => {
  const rating = Number(plant.avg_score ?? 0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const plantPath = getPlantPath(plant);

  const handleOpenPlant = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) {
      return;
    }
    event.preventDefault();
    if (onOpenPlant) {
      onOpenPlant(plant);
      return;
    }
    window.location.href = plantPath;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-4 overflow-visible">
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-3 sm:gap-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => setIsImageExpanded(!isImageExpanded)}
          >
            <img
              src={plant.photo}
              alt={plant.plant_name}
              className="w-12 h-12 object-cover rounded-lg transition-transform duration-200 group-hover:scale-110"
            />
            <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          </div>
          <div className="min-w-0">
            <a
              href={plantPath}
              onClick={handleOpenPlant}
              className="text-lg font-semibold text-emerald-800 hover:text-lime-600 hover:underline underline-offset-4 transition-colors block truncate"
              title="Открыть страницу растения"
            >
              {plant.plant_name}
            </a>

            <div className="flex items-center mt-1 gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const fillFraction = Math.max(0, Math.min(1, rating - (starIndex - 1)));
                  return <StarIcon key={starIndex} fillFraction={fillFraction} uniqueId={`${plant.id}-${starIndex}`} />;
                })}
              </div>
              <span className="text-xs font-semibold text-emerald-700">{formatRating(rating)}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2">
          <PlantShareMenu plant={plant} />

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

      {isImageExpanded && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsImageExpanded(false)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute top-3 right-3 z-10 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-lg"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-emerald-100 bg-white">
              <h3 className="text-xl font-semibold text-emerald-800">{plant.plant_name}</h3>
              <p className="text-sm text-emerald-600 mt-2">{plant.brief_description}</p>
            </div>

            <div className="flex-1 flex items-center justify-center bg-emerald-50 p-4">
              <img
                src={plant.photo}
                alt={plant.plant_name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingPlantCard;
