import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-96">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-lime-500"></div>
    <p className="mt-6 text-xl font-semibold text-emerald-700">
      Генерируем идеальную подборку...
    </p>
    <p className="text-emerald-500 mt-2 text-sm">
      Используем магию природы и немного машинного обучения.
    </p>
  </div>
);

export default LoadingScreen;