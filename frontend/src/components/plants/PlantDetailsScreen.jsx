import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, Leaf, Star } from 'lucide-react';
import PlantShareMenu from '../share/PlantShareMenu';

const FEATURE_LABELS = {
  origin: 'Происхождение',
  light_requirements: 'Освещение',
  watering_frequency: 'Полив',
  comfort_temp: 'Температура',
  mature_size: 'Размер',
  soil_type: 'Почва',
  humidity_preference: 'Влажность',
  fertilizer_needs: 'Подкормка',
  growth_rate: 'Темп роста',
  toxicity: 'Токсичность',
  maintenance_level: 'Сложность ухода',
  repotting_frequency: 'Пересадка',
  common_pests: 'Частые вредители',
  common_diseases: 'Частые болезни',
  common_issues: 'Типичные проблемы',
  health_benefits: 'Польза',
  legend_of_plant: 'Легенда о растении',
  flowering: 'Цветение',
  fragrance: 'Аромат',
  misting: 'Опрыскивание',
  flowering_misting: 'Опрыскивание во время цветения',
};

const MAIN_FEATURE_KEYS = [
  'light_requirements',
  'watering_frequency',
  'comfort_temp',
  'mature_size',
  'growth_rate',
  'toxicity',
];

const HIDDEN_FEATURE_KEYS = new Set([
  'photo',
  'brief_description',
  'plant_name',
  'plant_name_eng',
  'brief_description_eng',
  'origin_eng',
  'light_requirements_eng',
  'watering_frequency_eng',
  'soil_type_eng',
  'humidity_preference_eng',
  'fertilizer_needs_eng',
  'growth_rate_eng',
  'mature_size_eng',
  'toxicity_eng',
  'maintenance_level_eng',
  'repotting_frequency_eng',
  'common_pests_eng',
  'common_diseases_eng',
  'common_issues_eng',
  'legend_of_plant_eng',
  'health_benefits_eng',
]);

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(1);
  return String(value);
};

const toFeatureList = (plant) => {
  const features = typeof plant?.features === 'object' && plant.features ? plant.features : {};
  return Object.entries(features)
    .filter(([key, value]) => !HIDDEN_FEATURE_KEYS.has(key) && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      label: FEATURE_LABELS[key] || key.replace(/_/g, ' '),
      value: formatValue(value),
    }));
};

const getStars = (score) => {
  const numeric = Number(score ?? 0);
  const filled = Math.max(0, Math.min(5, Math.round(numeric)));
  return [1, 2, 3, 4, 5].map((index) => (
    <Star
      key={index}
      className={`w-4 h-4 ${index <= filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
      aria-hidden="true"
    />
  ));
};

const PlantDetailsScreen = ({ plantId, initialPlant = null, onNavigate, favorites = [], setFavorites, onRequireAuth }) => {
  const [plant, setPlant] = useState(initialPlant);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plantId) {
      setError('Некорректная ссылка на растение');
      return;
    }

    setPlant(initialPlant);

    let isMounted = true;

    const loadPlant = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/plants/${plantId}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload?.success || !payload?.plant) {
          throw new Error(payload?.message || 'Не удалось загрузить карточку растения');
        }

        if (isMounted) {
          setPlant(payload.plant);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || 'Ошибка загрузки растения');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPlant();

    return () => {
      isMounted = false;
    };
  }, [plantId, initialPlant]);

  const allFeatureItems = useMemo(() => toFeatureList(plant), [plant]);
  const mainFeatureItems = useMemo(
    () => MAIN_FEATURE_KEYS.map((key) => allFeatureItems.find((item) => item.key === key)).filter(Boolean),
    [allFeatureItems]
  );
  const extraFeatureItems = useMemo(
    () => allFeatureItems.filter((item) => !MAIN_FEATURE_KEYS.includes(item.key)),
    [allFeatureItems]
  );

  const plantName = plant?.plant_name || initialPlant?.plant_name || initialPlant?.name || 'Растение';
  const description = plant?.brief_description || initialPlant?.brief_description || 'Описание скоро появится.';
  const plantImage = plant?.photo || initialPlant?.photo;
  const ratingValue = Number(plant?.avg_score ?? 0);
  const ratingCount = Number(plant?.rating_count ?? 0);
  const activePlant = plant || initialPlant;
  const activePlantId = Number(activePlant?.id);
  const isFavorite = Number.isFinite(activePlantId) && favorites.some((item) => Number(item?.id) === activePlantId);

  const handleAddToFavorites = async () => {
    if (!activePlant || !Number.isFinite(activePlantId) || activePlantId <= 0 || isFavorite) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setFavorites?.((prev) => [...prev, activePlant]);

    try {
      const response = await fetch('/api/savefavourites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plant_id: activePlantId }),
      });

      const result = await response.json().catch(() => ({}));

      // 409 means the plant is already in favorites on backend side.
      if (!response.ok && response.status !== 409) {
        throw new Error(result?.message || 'Ошибка при добавлении в избранное');
      }
    } catch (requestError) {
      setFavorites?.((prev) => prev.filter((item) => Number(item?.id) !== activePlantId));
      console.error(requestError.message || 'Ошибка при добавлении в избранное');
    }
  };

  if (isLoading && !plant) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white shadow-xl p-8 text-center">
        <p className="text-emerald-700">Загружаем страницу растения...</p>
      </div>
    );
  }

  if (error && !plant) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white shadow-xl p-8 text-center">
        <p className="text-rose-600 mb-4">{error}</p>
        <button
          onClick={() => onNavigate('ratings')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к рейтингу
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('ratings')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          К рейтингу
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToFavorites}
            disabled={isFavorite}
            className={`p-2 rounded-full transition-colors ${
              isFavorite
                ? 'bg-red-100 text-red-300 cursor-not-allowed'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
            aria-label="Добавить в избранное"
            title={isFavorite ? 'Уже в избранном' : 'Добавить в избранное'}
          >
            <Heart className="w-5 h-5" />
          </button>
          <PlantShareMenu plant={activePlant} />
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-0">
          <div className="relative min-h-[260px] sm:min-h-[360px] bg-emerald-100/60">
            {plantImage ? (
              <img src={plantImage} alt={plantName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-emerald-700">
                <Leaf className="w-14 h-14 mb-3 text-emerald-500" />
                <span className="text-sm">Фото пока не добавлено</span>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-7 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wider uppercase text-emerald-500">Страница растения</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-emerald-900 leading-tight">{plantName}</h1>
            <p className="mt-3 text-emerald-700 leading-relaxed">{description}</p>

            <div className="mt-5 inline-flex items-center gap-3 rounded-xl bg-white/80 border border-emerald-100 px-3 py-2 w-fit">
              <div className="flex items-center gap-1">{getStars(ratingValue)}</div>
              <span className="text-sm font-semibold text-emerald-900">
                {ratingValue.toFixed(1)} / 5
              </span>
              <span className="text-xs text-emerald-600">
                {ratingCount > 0 ? `${ratingCount} оценок` : 'Пока нет оценок'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {mainFeatureItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {mainFeatureItems.map((item) => (
            <article key={item.key} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">{item.label}</p>
              <p className="mt-2 text-sm text-emerald-900 leading-relaxed">{item.value}</p>
            </article>
          ))}
        </div>
      )}

      {extraFeatureItems.length > 0 && (
        <div className="rounded-3xl border border-emerald-100 bg-white shadow-md p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-emerald-900 mb-4">Дополнительные свойства</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {extraFeatureItems.map((item) => (
              <div key={item.key} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{item.label}</p>
                <p className="mt-1 text-sm text-emerald-900 leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Актуальные данные не обновились: {error}
        </div>
      )}
    </section>
  );
};

export default PlantDetailsScreen;
