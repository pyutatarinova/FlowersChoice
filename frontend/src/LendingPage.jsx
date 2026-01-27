// LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Zap, Gift, User, Heart, ChevronRight } from 'lucide-react';

const LandingPage = ({ onStartSelection, onShowAuth, onShowLogin }) => {
  const [animatedElements, setAnimatedElements] = useState([]);
  const containerRef = useRef(null);
  
  // Анимация появления элементов
  useEffect(() => {
    const elements = [];
    
    // Создаем анимированные элементы растений
    const plantShapes = [
      { type: 'leaf', color: '#10b981', size: 40, x: 10, y: 20, delay: 0 },
      { type: 'flower', color: '#ef4444', size: 35, x: 85, y: 15, delay: 200 },
      { type: 'leaf', color: '#22c55e', size: 30, x: 25, y: 70, delay: 400 },
      { type: 'stem', color: '#16a34a', size: 50, x: 60, y: 40, delay: 600 },
      { type: 'flower', color: '#8b5cf6', size: 25, x: 75, y: 75, delay: 800 },
    ];
    
    let delay = 0;
    plantShapes.forEach(shape => {
      setTimeout(() => {
        elements.push(shape);
        setAnimatedElements([...elements]);
      }, shape.delay);
    });
    
    // Очистка через 5 секунд (после завершения анимации)
    const clearTimer = setTimeout(() => {
      setAnimatedElements([]);
    }, 5000);
    
    return () => {
      clearTimeout(clearTimer);
      plantShapes.forEach(shape => {
        clearTimeout(shape.delay);
      });
    };
  }, []);
  
  // Функция для отрисовки SVG-фигур растений
  const renderPlantShape = (shape, index) => {
    switch(shape.type) {
      case 'leaf':
        return (
          <svg
            key={index}
            className="absolute animate-float"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.size,
              height: shape.size,
              animationDelay: `${index * 0.2}s`,
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
            viewBox="0 0 100 100"
          >
            <path
              d="M50,10 C70,10 90,30 90,50 C90,70 70,90 50,90 C30,90 10,70 10,50 C10,30 30,10 50,10 Z"
              fill={shape.color}
              opacity="0.8"
            />
            <path
              d="M50,10 C30,30 30,70 50,90 M50,10 C70,30 70,70 50,90"
              stroke="#ffffff"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        );
      case 'flower':
        return (
          <svg
            key={index}
            className="absolute animate-pulse"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.size,
              height: shape.size,
              animationDelay: `${index * 0.3}s`,
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="20" fill={shape.color} opacity="0.9" />
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = angle * Math.PI / 180;
              const x1 = 50 + 15 * Math.cos(rad);
              const y1 = 50 + 15 * Math.sin(rad);
              const x2 = 50 + 35 * Math.cos(rad);
              const y2 = 50 + 35 * Math.sin(rad);
              return (
                <ellipse
                  key={i}
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  rx="12"
                  ry="8"
                  fill={shape.color}
                  opacity="0.7"
                  transform={`rotate(${angle}, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}
                />
              );
            })}
            <circle cx="50" cy="50" r="10" fill="#fbbf24" />
          </svg>
        );
      case 'stem':
        return (
          <svg
            key={index}
            className="absolute"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.size,
              height: shape.size,
            }}
            viewBox="0 0 100 100"
          >
            <rect x="45" y="10" width="10" height="80" rx="5" fill={shape.color} />
            {[0, 30, 60, 90, 120].map((offset, i) => (
              <rect
                key={i}
                x="40"
                y={10 + offset}
                width="20"
                height="5"
                rx="2"
                fill="#22c55e"
                transform={`rotate(${i % 2 === 0 ? -15 : 15}, 50, ${12.5 + offset})`}
              />
            ))}
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white overflow-hidden">
      {/* Анимированный фон с растениями */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      >
        {animatedElements.map((shape, index) => renderPlantShape(shape, index))}
        
        {/* Статичный декор */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-100/50 to-transparent"></div>
        <div className="absolute top-1/4 left-10 w-24 h-24 rounded-full bg-lime-200/20 blur-3xl"></div>
        <div className="absolute bottom-1/3 right-10 w-32 h-32 rounded-full bg-emerald-300/20 blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        {/* Главный контент */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="text-center">
            {/* Логотип и заголовок */}
            <div className="flex justify-center items-center mb-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-lime-500/20 rounded-full blur-xl"></div>
                <div className="relative bg-gradient-to-br from-emerald-600 to-lime-500 p-6 rounded-2xl shadow-2xl">
                  <Leaf className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold text-emerald-900 mb-6 tracking-tight">
              Flowers'<span className="text-lime-600">Choice</span>
            </h1>
            
            <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-lime-500 mx-auto mb-8 rounded-full"></div>
            
            {/* Анимированный текст */}
            <div className="h-24 mb-8 overflow-hidden">
              <div className="animate-slide-up">
                <p className="text-2xl sm:text-3xl font-semibold text-emerald-800 mb-2">
                  Подберите своё идеальное растение
                </p>
                <div className="flex justify-center items-center space-x-4 text-lg text-emerald-600">
                  <span className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-400" />
                    Без стресса
                  </span>
                  <span className="flex items-center">
                    <Leaf className="w-5 h-5 mr-2 text-emerald-500" />
                    С заботой
                  </span>
                  <span className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    С ИИ
                  </span>
                </div>
              </div>
            </div>
            
            {/* Описание платформы */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-100">
                <div className="space-y-4 text-lg text-emerald-700">
                  <p className="flex items-start">
                    <span className="inline-block w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-emerald-600 font-bold">1</span>
                    </span>
                    <span className="font-medium">Сделаем дома людей зеленее и чище. Помогаем каждому легко найти идеальное растение — без стресса и ошибок.</span>
                  </p>
                  
                  <p className="flex items-start">
                    <span className="inline-block w-8 h-8 bg-lime-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-lime-600 font-bold">2</span>
                    </span>
                    <span className="font-medium">Упрощаем выбор комнатных растений с помощью фильтров и рейтинговой системы, чтобы природа появилась в доме за пару кликов.</span>
                  </p>
                  
                  <p className="flex items-start">
                    <span className="inline-block w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-emerald-600 font-bold">3</span>
                    </span>
                    <span className="font-medium">Соединяем технологии ИИ и любовь к природе, чтобы любой мог быстро и точно подобрать растение, на 100% подходящее его стилю жизни.</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Кнопки действий */}
            <div className="max-w-md mx-auto space-y-4 mb-12">
              <button
                onClick={onStartSelection}
                className="group w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-lime-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-emerald-300/50 hover:shadow-xl hover:shadow-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
              >
                <Zap className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                Начать подбор
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onShowAuth('register')}
                  className="py-3 px-6 bg-white text-emerald-700 font-semibold rounded-xl border-2 border-emerald-200 hover:border-lime-500 hover:bg-emerald-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                >
                  <User className="w-5 h-5 mr-2" />
                  Зарегистрироваться
                </button>
                
                <button
                  onClick={() => onShowAuth('login')}
                  className="py-3 px-6 bg-emerald-700 text-white font-semibold rounded-xl border-2 border-emerald-700 hover:bg-emerald-800 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                >
                  <User className="w-5 h-5 mr-2" />
                  Войти
                </button>
              </div>
            </div>
            
            {/* Быстрый выбор */}
            <div className="max-w-2xl mx-auto">
              <p className="text-emerald-600 mb-4">Или начните сразу:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => onStartSelection && onStartSelection('self')}
                  className="group p-6 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-emerald-100 hover:border-lime-400 hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-lime-100 transition-colors">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-800">Для себя</h3>
                  </div>
                  <p className="text-emerald-600">Подберу растение для своего дома</p>
                </button>
                
                <button
                  onClick={() => onStartSelection && onStartSelection('gift')}
                  className="group p-6 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-emerald-100 hover:border-lime-400 hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-lime-100 transition-colors">
                      <Gift className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-800">В подарок</h3>
                  </div>
                  <p className="text-emerald-600">Хочу выбрать растение в качестве подарка</p>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Футер */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-emerald-100 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-emerald-600">
            <p className="mb-2">Московский институт электроники и математики им. А. Н. Тихонова</p>
            <p className="text-sm">Департамент компьютерной инженерии • Курс: Проектирование веб-приложений</p>
            <p className="text-xs mt-4 text-emerald-500">© 2025 Flowers'Choice. Сделано с любовью к природе.</p>
          </div>
        </div>
      </div>
      
      {/* CSS анимации */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes slide-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;