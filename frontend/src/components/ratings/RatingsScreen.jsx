import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import RatingPlantCard from '../../components/ratings/RatingPlantCard';

const RatingsScreen = ({ favorites, setFavorites }) => {
  const PER_PAGE = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [detailedPlantId, setDetailedPlantId] = useState(null);
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadRatings = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`http://127.0.0.1:3001/api/plants-rating?page=${currentPage}&per_page=${PER_PAGE}`);
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Не удалось загрузить рейтинг растений');
        }

        setPlants(Array.isArray(data.plants) ? data.plants : []);
        setTotalPages(Number(data.total_pages ?? 1));
        setTotalCount(Number(data.total_count ?? 0));
      } catch (e) {
        setError(e.message || 'Ошибка загрузки рейтинга');
      } finally {
        setIsLoading(false);
      }
    };

    loadRatings();
  }, [currentPage]);

  const filteredAndSortedPlants = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return plants
      .filter((plant) => plant.plant_name?.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => Number(b.avg_score ?? 0) - Number(a.avg_score ?? 0));
  }, [plants, searchTerm]);

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

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold text-emerald-800 mb-6 text-center">Рейтинг растений</h2>

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

      {isLoading && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-emerald-600">Загружаем рейтинг растений...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredAndSortedPlants.length > 0 && (
        filteredAndSortedPlants.map((plant) => (
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

      {!isLoading && !error && filteredAndSortedPlants.length === 0 && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-emerald-600">Растения не найдены.</p>
        </div>
      )}

      {!isLoading && !error && totalPages > 1 && (
        <div className="mt-8 bg-white border border-emerald-100 rounded-2xl shadow-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-emerald-700">Показано {plants.length} из {totalCount} растений</p>

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
