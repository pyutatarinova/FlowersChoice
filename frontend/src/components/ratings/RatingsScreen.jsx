import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, Thermometer, X } from 'lucide-react';
import RatingPlantCard from '../../components/ratings/RatingPlantCard';

const GROWTH_RATE_OPTIONS = [
  "Быстрый",
  "Медленный",
  "От медленного до умеренного",
  "Умеренный"
];

const RatingsScreen = ({ favorites, setFavorites }) => {
  const PER_PAGE = 20;

  const [searchTerm, setSearchTerm] = useState('');

  const [temperatureFilter, setTemperatureFilter] = useState('');
  const [floweringMistingFilter, setFloweringMistingFilter] = useState('');
  const [growthRateFilter, setGrowthRateFilter] = useState('');

  const [draftTemperature, setDraftTemperature] = useState('');
  const [draftFloweringMisting, setDraftFloweringMisting] = useState('');
  const [draftGrowthRate, setDraftGrowthRate] = useState('');

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [detailedPlantId, setDetailedPlantId] = useState(null);
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') setIsFiltersOpen(false);
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  useEffect(() => {
    const loadRatings = async () => {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          page: '1',
          per_page: '200',
        });

        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }

        if (temperatureFilter.trim()) {
          params.set('comfort_temp', temperatureFilter.trim());
        }

        if (floweringMistingFilter !== '') {
          params.set('flowering_misting', floweringMistingFilter);
        }

        if (growthRateFilter.trim()) {
          params.set('growth_rate', growthRateFilter.trim());
        }

        const response = await fetch(`http://127.0.0.1:3001/api/plants-rating/filter?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Не удалось загрузить рейтинг растений');
        }

        setPlants(Array.isArray(data.plants) ? data.plants : []);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки рейтинга');
      } finally {
        setIsLoading(false);
      }
    };

    loadRatings();
  }, [searchTerm, temperatureFilter, floweringMistingFilter, growthRateFilter]);

  const totalFiltered = plants.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));

  const paginatedPlants = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    return plants.slice(start, end);
  }, [plants, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, temperatureFilter, floweringMistingFilter, growthRateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visiblePages = useMemo(() => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const handleToggleDetails = (id) => {
    setDetailedPlantId((prev) => (prev === id ? null : id));
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setDetailedPlantId(null);
    setCurrentPage(page);
  };

  const handleAddToFavorites = async (plant) => {
    if (favorites.some((item) => item.id === plant.id)) return;
    setFavorites((prev) => [...prev, plant]);

    const token = localStorage.getItem('authToken');

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('http://127.0.0.1:3001/api/savefavourites', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plant_id: plant.id }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Ошибка при добавлении в избранное');
      }
    } catch (e) {
      console.error(e.message || 'Ошибка при добавлении в избранное');
    }
  };

  const openFilters = () => {
    setDraftTemperature(temperatureFilter);
    setDraftFloweringMisting(floweringMistingFilter);
    setDraftGrowthRate(growthRateFilter);
    setIsFiltersOpen(true);
  };

  const applyFilters = () => {
    setTemperatureFilter(draftTemperature.trim());
    setFloweringMistingFilter(draftFloweringMisting);
    setGrowthRateFilter(draftGrowthRate);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftTemperature('');
    setDraftFloweringMisting('');
    setDraftGrowthRate('');

    setTemperatureFilter('');
    setFloweringMistingFilter('');
    setGrowthRateFilter('');
    setSearchTerm('');

    setIsFiltersOpen(false);
  };

  const hasActiveFilters =
    temperatureFilter.trim() !== '' ||
    floweringMistingFilter !== '' ||
    growthRateFilter.trim() !== '';

  return (
    <div className="relative">
      <div className="relative mb-6">
        <h2 className="text-3xl font-bold text-emerald-800 text-center">Рейтинг растений</h2>
        <button
          onClick={openFilters}
          className={`absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors ${
            hasActiveFilters
              ? 'bg-lime-500 text-white border-lime-500 shadow-md shadow-lime-200/70'
              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-lime-500 focus:border-lime-500"
        />
      </div>

      {isFiltersOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <button
            aria-label="Закрыть фильтры"
            className="absolute inset-0 bg-emerald-950/30 backdrop-blur-[2px]"
            onClick={() => setIsFiltersOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Thermometer className="w-5 h-5 text-lime-600" />
                <h3 className="font-semibold">Фильтры рейтинга</h3>
              </div>
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-800">Комфортная температура (°C)</label>
                <input
                  type="number"
                  value={draftTemperature}
                  onChange={(e) => setDraftTemperature(e.target.value)}
                  placeholder="Например, 18"
                  className="w-full p-3 border border-emerald-200 rounded-xl bg-white text-emerald-900 placeholder:text-emerald-200/95 focus:ring-lime-500 focus:border-lime-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-800">Flowering misting</label>
                <select
                  value={draftFloweringMisting}
                  onChange={(e) => setDraftFloweringMisting(e.target.value)}
                  className="w-full p-3 border border-emerald-200 rounded-xl bg-white text-emerald-900 focus:ring-lime-500 focus:border-lime-500"
                >
                  <option value="">Не выбрано</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-800">Уровень роста</label>
                <select
                  value={draftGrowthRate}
                  onChange={(e) => setDraftGrowthRate(e.target.value)}
                  className="w-full p-3 border border-emerald-200 rounded-xl bg-white text-emerald-900 focus:ring-lime-500 focus:border-lime-500"
                >
                  <option value="">Не выбрано</option>
                  {GROWTH_RATE_OPTIONS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-emerald-100 bg-emerald-50/40 rounded-b-2xl">
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-white transition-colors"
              >
                Сбросить
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 rounded-xl bg-lime-500 text-white hover:bg-lime-600 transition-colors shadow-md shadow-lime-200/70"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-emerald-600">Загружаем рейтинг растений...</p>
        </div>
      )}

      {!isLoading && !error && paginatedPlants.length > 0 && (
        paginatedPlants.map((plant) => (
          <RatingPlantCard
            key={plant.id}
            plant={plant}
            isFavorite={favorites.some((f) => f.id === plant.id)}
            onToggleDetails={handleToggleDetails}
            isDetailed={detailedPlantId === plant.id}
            onAddToFavorites={() => handleAddToFavorites(plant)}
          />
        ))
      )}

      {!isLoading && error && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && plants.length === 0 && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-emerald-600">Растения не найдены.</p>
        </div>
      )}

      {!isLoading && !error && totalFiltered > PER_PAGE && (
        <div className="mt-8 bg-white border border-emerald-100 rounded-2xl shadow-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-emerald-700">Показано {paginatedPlants.length} из {totalFiltered} растений</p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>

              {visiblePages[0] > 1 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="min-w-10 h-10 px-3 rounded-xl border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
                  >
                    1
                  </button>
                  {visiblePages[0] > 2 && <span className="px-1 text-emerald-400">...</span>}
                </>
              )}

              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-10 h-10 px-3 rounded-xl border transition-colors ${
                    page === currentPage
                      ? 'bg-lime-500 border-lime-500 text-white shadow-md shadow-lime-200/70'
                      : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              {visiblePages[visiblePages.length - 1] < totalPages && (
                <>
                  {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-emerald-400">...</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="min-w-10 h-10 px-3 rounded-xl border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-colors"
              >
                Вперед
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingsScreen;
