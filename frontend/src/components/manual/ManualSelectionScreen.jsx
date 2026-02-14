import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';
import { mockResults } from '../../constants/mockResults';
import ManualSelectionCard from './ManualSelectionCard';

let manualCache = null;
let manualLoadPromise = null;

const shufflePlants = (plants) => {
  const list = [...plants];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const ManualSelectionScreen = ({ favorites, setFavorites }) => {
  const [allPlants, setAllPlants] = useState(manualCache?.allPlants || []);
  const [currentPair, setCurrentPair] = useState(manualCache?.currentPair || []);
  const [isLoading, setIsLoading] = useState(!manualCache);
  const [isReady, setIsReady] = useState(!!manualCache);

  const poolRef = useRef([]);
  const cursorRef = useRef(0);
  const viewedRef = useRef(new Set());

  const getNextPlant = useCallback(() => {
    const pool = poolRef.current;
    let i = cursorRef.current;
    while (i < pool.length && viewedRef.current.has(pool[i]?.id)) i += 1;
    if (i >= pool.length) {
      cursorRef.current = pool.length;
      return null;
    }
    const next = pool[i];
    cursorRef.current = i + 1;
    if (next?.id) viewedRef.current.add(next.id);
    return next;
  }, []);

  const initPool = useCallback((plants) => {
    const shuffled = shufflePlants(plants);
    poolRef.current = shuffled;
    cursorRef.current = 0;
    viewedRef.current = new Set();
    const first = getNextPlant();
    const second = getNextPlant();
    const pair = [first, second].filter(Boolean);
    setCurrentPair(pair);
    return pair;
  }, [getNextPlant]);

  useEffect(() => {
    const loadPlants = async () => {
      if (manualCache) {
        poolRef.current = manualCache.pool || [];
        cursorRef.current = manualCache.cursor || 0;
        viewedRef.current = new Set(manualCache.viewed || []);
        setAllPlants(manualCache.allPlants || []);
        setCurrentPair(manualCache.currentPair || []);
        setIsLoading(false);
        setIsReady(true);
        return;
      }

      setIsLoading(true);
      try {
        if (!manualLoadPromise) {
          manualLoadPromise = fetch('http://localhost:3001/api/plants-rating?page=1&per_page=50')
            .then(res => res.json())
            .then(data => {
              if (data && data.success && Array.isArray(data.plants) && data.plants.length > 0) {
                return data.plants;
              }
              return mockResults;
            })
            .catch(() => mockResults);
        }

        const plants = await manualLoadPromise;
        setAllPlants(plants);
        const pair = initPool(plants);
        setIsReady(true);
        manualCache = {
          allPlants: plants,
          pool: poolRef.current,
          cursor: cursorRef.current,
          viewed: Array.from(viewedRef.current),
          currentPair: pair
        };
      } catch (e) {
        console.error('Ошибка загрузки растений для ручного режима:', e);
        const plants = mockResults;
        setAllPlants(plants);
        const pair = initPool(plants);
        setIsReady(true);
        manualCache = {
          allPlants: plants,
          pool: poolRef.current,
          cursor: cursorRef.current,
          viewed: Array.from(viewedRef.current),
          currentPair: pair
        };
      } finally {
        setIsLoading(false);
      }
    };

    loadPlants();
  }, [initPool]);

  useEffect(() => {
    if (!isReady) return;
    manualCache = {
      allPlants,
      pool: poolRef.current,
      cursor: cursorRef.current,
      viewed: Array.from(viewedRef.current),
      currentPair
    };
  }, [allPlants, currentPair, isReady]);

  const replaceCard = useCallback((indexToReplace, keepIfNone) => {
    const next = getNextPlant();
    setCurrentPair(prev => {
      const updated = [...prev];
      if (next) updated[indexToReplace] = next;
      else if (!keepIfNone) updated.splice(indexToReplace, 1);
      return updated.filter(Boolean);
    });
  }, [getNextPlant]);

  const handleSelect = (index) => {
    const otherIndex = index === 0 ? 1 : 0;
    replaceCard(otherIndex, true);
  };

  const handleAddToFavorites = async (plant, index) => {
    if (!plant) return;

    const alreadyFavorite = favorites.some(f => f.id === plant.id);
    if (!alreadyFavorite) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3001/api/savefavourites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plant_id: plant.id })
        });
        const result = await response.json();
        setFavorites(prev => [...prev, plant]);
        if (!response.ok) {
          console.error(result.message || 'Ошибка добавления в избранное');
        }
      } catch (e) {
        console.error('Ошибка сети при добавлении в избранное:', e);
        setFavorites(prev => [...prev, plant]);
      }
    }

    replaceCard(index, false);
  };

  if (isLoading || !isReady) {
    return (
      <div className="text-center text-lg text-emerald-500 p-8 bg-white rounded-xl shadow-lg">
        Загружаем растения для ручного выбора...
      </div>
    );
  }

  if (!currentPair || currentPair.length === 0) {
    return (
      <div className="text-center text-lg text-emerald-500 p-8 bg-white rounded-xl shadow-lg">
        Карточки закончились. Попробуйте обновить страницу позже.
      </div>
    );
  }

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold text-emerald-800 mb-3 text-center">Режим ручного выбора</h2>
      <p className="text-center text-emerald-600 mb-8">
        Смотрите случайные карточки и добавляйте понравившиеся в избранное.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentPair.map((plant, index) => (
          <ManualSelectionCard
            key={plant.id}
            plant={plant}
            isFavorite={favorites.some(f => f.id === plant.id)}
            onSelect={() => handleSelect(index)}
            onAddToFavorites={() => handleAddToFavorites(plant, index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ManualSelectionScreen;
