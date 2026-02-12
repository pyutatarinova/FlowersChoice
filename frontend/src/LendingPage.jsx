// LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, Zap, Gift, User, Heart, ChevronDown, 
  Sparkles, Droplets, Sun, Wind, Calendar, 
  Award, Shield, Brain, MessageCircle, 
  ArrowRight, Star, Trees, Flower2, 
  CheckCircle, HelpCircle, Bot, Palette
} from 'lucide-react';

const LandingPage = ({ onStartSelection, onShowAuth }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBlossoms, setActiveBlossoms] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  
  // Инициализация
  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const totalHeight = document.body.scrollHeight - windowHeight;
      const progress = Math.min(scrollPosition / totalHeight, 1);
      setScrollProgress(progress);
      
      // Активируем секции при скролле
      const sections = document.querySelectorAll('[data-blossom-section]');
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
          if (!activeBlossoms.includes(index)) {
            setActiveBlossoms(prev => [...prev, index]);
          }
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
// ======================
// HERO SECTION — ПОЛНОСТЬЮ ОБНОВЛЕНА
// ======================

  const HeroSection = () => {
    // Состояние для цветов — расцветают при скролле
    const [bloomedFlowers, setBloomedFlowers] = useState([]);

    useEffect(() => {
      const handleBloom = () => {
        const scrollY = window.scrollY;
        const heroBottom = window.innerHeight * 0.9; // нижняя граница Hero
        if (scrollY > 50 && scrollY < heroBottom) {
          // Чем больше скролл, тем больше цветов
          const count = Math.min(12, Math.floor(scrollY / 30));
          setBloomedFlowers(Array.from({ length: count }, (_, i) => i));
        } else {
          setBloomedFlowers([]);
        }
      };

      window.addEventListener('scroll', handleBloom);
      return () => window.removeEventListener('scroll', handleBloom);
    }, []);

    return (
      <section
        className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden"
        data-blossom-section="0"
      >
        {/* Градиент */}
        
        {/* Основной градиент неба — закатно-рассветный */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-emerald-50/40 to-emerald-100/30 z-0"></div>
        
        {/* Тёплое свечение слева сверху (солнце) */}
        <div className="absolute top-0 left-0 w-[900px] h-[900px] bg-gradient-to-br from-amber-200/40 via-yellow-200/30 to-transparent rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 z-0"></div>
        
        {/* Второй слой — зелёное сияние справа */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-emerald-200/40 via-lime-200/30 to-transparent rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 z-0"></div>
        
        {/* Третий слой — мягкое золото по центру */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/30 to-transparent rounded-full blur-3xl z-0"></div>

        {/* Нижнее свечение — переход к траве */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-emerald-300/50 via-emerald-200/40 to-transparent z-0"></div>

        {/* Контент */}
        
        <div
          className={`max-w-4xl mx-auto relative z-20 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {/* Заголовок */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="relative bg-gradient-to-br from-emerald-600 to-lime-500 p-6 rounded-2xl shadow-2xl">
                  <Leaf className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="ml-6 text-5xl md:text-7xl font-bold text-emerald-900">
                Flowers'<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-500">Choice</span>
              </h1>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-emerald-800 mb-6">
              Найди своего <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-lime-500">зелёного друга</span>
            </h2>

            <p className="text-xl text-emerald-700 max-w-2xl mx-auto font-light">
              Искусственный интеллект поможет подобрать идеальное растение
              для вашего дома или в качестве подарка
            </p>
          </div>

          {/* Главная кнопка */}
          <button
            onClick={() => onStartSelection && onStartSelection()}
            className="group relative px-12 py-5 bg-gradient-to-r from-emerald-600 to-lime-500 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-emerald-300/50 hover:shadow-3xl hover:shadow-emerald-400/50 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 mb-12"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-lime-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-center">
              <Zap className="w-6 h-6 mr-3 group-hover:animate-spin-slow" />
              Начать подбор
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>

          {/* Индикатор скролла */}
          <div className="absolute left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-emerald-600 flex flex-col items-center">
              <span className="text-sm mb-2">Листайте вниз</span>
              <ChevronDown className="w-6 h-6" />
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  // Карточки принципов
  const PrinciplesSection = () => (
    <section 
      className="min-h-screen py-20 px-4 relative"
      data-blossom-section="1"
    >
      {/* Светлый фон секции */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/10 to-white z-0"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-900 mb-4">
            Наши <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-500">принципы</span>
          </h2>
          <p className="text-xl text-emerald-600 max-w-3xl mx-auto">
            Мы строим наш сервис на трёх фундаментальных принципах
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              id: 1,
              icon: <Sparkles className="w-12 h-12" />,
              title: "Зелёный дом для каждого",
              description: "Превращаем любое пространство в уютный зелёный уголок, подбирая растения, которые идеально впишутся в ваш интерьер и образ жизни.",
              color: "from-emerald-500 to-emerald-600",
              delay: 0
            },
            {
              id: 2,
              icon: <Zap className="w-12 h-12" />,
              title: "Умный подход к выбору",
              description: "Используем современные технологии и экспертные знания, чтобы сделать выбор растений простым, быстрым и безошибочным.",
              color: "from-lime-500 to-lime-600",
              delay: 200
            },
            {
              id: 3,
              icon: <Heart className="w-12 h-12" />,
              title: "Забота от первой встречи",
              description: "Не просто подбираем растение, а учим ухаживать за ним. Наша миссия — помогать растениям и их хозяевам жить в гармонии.",
              color: "from-emerald-400 to-lime-500",
              delay: 400
            }
          ].map((principle, index) => (
            <div
              key={principle.id}
              className={`relative bg-white rounded-2xl p-8 shadow-xl border border-emerald-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                activeBlossoms.includes(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{
                transitionDelay: `${principle.delay}ms`
              }}
            >
              {/* Тонкий акцент сверху */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-lime-400 rounded-t-2xl"></div>
              
              <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br ${principle.color} flex items-center justify-center shadow-lg border-4 border-white`}>
                <div className="text-white">{principle.icon}</div>
              </div>
              
              <h3 className="text-2xl font-bold text-emerald-900 mt-6 mb-4 text-center">
                {principle.title}
              </h3>
              <p className="text-emerald-700 text-lg leading-relaxed">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  
  // Блок ухода за растениями
  const CareSection = () => (
    <section 
      className="min-h-screen py-20 px-4 relative"
      data-blossom-section="2"
    >
      {/* Легкий градиент для секции */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/5 to-white z-0"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`transition-all duration-1000 ${
            activeBlossoms.includes(2) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <h2 className="text-4xl font-bold text-emerald-900 mb-6">
              Поможем <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-500">ухаживать</span>
            </h2>
            <p className="text-xl text-emerald-600 mb-8">
              Мы не просто подбираем растения — мы помогаем им процветать в вашем доме
            </p>
            
            <div className="space-y-6">
              {[
                {
                  icon: <Calendar className="w-8 h-8" />,
                  title: "Умный календарь полива",
                  description: "Автоматические напоминания о поливе с учётом сезона и условий вашего дома"
                },
                {
                  icon: <Droplets className="w-8 h-8" />,
                  title: "Персональные рекомендации",
                  description: "Советы по уходу на основе состояния вашего растения и условий окружающей среды"
                },
                {
                  icon: <MessageCircle className="w-8 h-8" />,
                  title: "Поддержка 24/7",
                  description: "Ответы на любые вопросы по уходу от нашего сообщества и экспертов"
                }
              ].map((feature, i) => (
                <div key={i} className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-800 mb-1 group-hover:text-emerald-900 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-emerald-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => onStartSelection && onStartSelection()}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-emerald-600 to-lime-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Начать заботиться
            </button>
          </div>
          
          <div className={`relative transition-all duration-1000 ${
            activeBlossoms.includes(2) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="relative">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100">
                <h3 className="text-2xl font-bold text-emerald-900 mb-4">
                  Мои растения
                </h3>
                <div className="space-y-4">
                  {['Монстера', "Замиокулькас", "Фикус", "Суккуленты"].map((plant, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-lime-50 rounded-xl border border-emerald-100 group hover:border-emerald-300 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-lime-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-800 text-lg">{plant}</div>
                          <div className="text-sm text-emerald-500">Полить через {i+2} дня</div>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-lime-500 group-hover:scale-125 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
  
  // Блок выбора
  const SelectionSection = () => (
    <section 
      className="min-h-screen py-20 px-4 relative"
      data-blossom-section="3"
    >
      {/* Фон с очень светлым градиентом */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-emerald-50/5 z-0"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-900 mb-4">
            Выберите свой <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-500">путь</span>
          </h2>
          <p className="text-xl text-emerald-600 max-w-3xl mx-auto">
            Начните свой путь в мир растений с нами
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              mode: 'self',
              icon: <User className="w-16 h-16" />,
              title: "Для себя",
              description: "Подберите идеальное растение для вашего дома, офиса или квартиры",
              features: ["Персональные рекомендации", "Учёт ваших условий", "Постоянная поддержка"],
              color: "from-emerald-600 to-emerald-700",
              buttonText: "Выбрать для себя"
            },
            {
              mode: 'gift',
              icon: <Gift className="w-16 h-16" />,
              title: "В подарок",
              description: "Найдите идеальный подарок для близких, коллег или друзей",
              features: ["Готовые подарочные наборы", "Персонализация", "Сертификаты ухода"],
              color: "from-lime-600 to-lime-700",
              buttonText: "Выбрать подарок"
            }
          ].map((option, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-3xl p-1 shadow-2xl border border-emerald-100 transition-all duration-500 transform hover:-translate-y-2 ${
                activeBlossoms.includes(3) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{
                transitionDelay: `${index * 200}ms`
              }}
            >
              {/* Градиентная рамка */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${option.color} opacity-10`}></div>
              
              <div className="relative bg-white rounded-2xl p-8 h-full">
                <div className="text-center mb-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-emerald-50 to-lime-50 rounded-2xl mb-4 border border-emerald-100">
                    <div className="text-emerald-600">{option.icon}</div>
                  </div>
                  <h3 className="text-3xl font-bold text-emerald-900 mb-3">
                    {option.title}
                  </h3>
                  <p className="text-emerald-600 text-lg mb-6">
                    {option.description}
                  </p>
                </div>
                
                <div className="space-y-3 mb-8">
                  {option.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3 group">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-emerald-700 group-hover:text-emerald-900 transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => onStartSelection && onStartSelection(option.mode)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-lime-500 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  {option.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  
  // Преимущества
  const AdvantagesSection = () => (
    <section 
      className="min-h-screen py-20 px-4 relative"
      data-blossom-section="4"
    >
      {/* Минимальный фон */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-emerald-50/10 z-0"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-900 mb-4">
            Наши <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-500">преимущества</span>
          </h2>
          <p className="text-xl text-emerald-600 max-w-3xl mx-auto">
            Почему тысячи людей доверяют нам выбор своих растений
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Brain className="w-10 h-10" />,
              title: "Искусственный интеллект",
              description: "Продвинутые алгоритмы машинного обучения анализируют тысячи параметров для идеального подбора",
              color: "from-purple-500 to-pink-500"
            },
            {
              icon: <Shield className="w-10 h-10" />,
              title: "Гарантия совместимости",
              description: "98% наших клиентов остаются довольны выбранным растением благодаря точному алгоритму",
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: <Award className="w-10 h-10" />,
              title: "Экспертный подход",
              description: "Наши рекомендации основаны на знаниях биологов, дизайнеров и опытных садоводов",
              color: "from-amber-500 to-orange-500"
            },
            {
              icon: <Palette className="w-10 h-10" />,
              title: "Дизайн-решения",
              description: "Учитываем не только потребности растения, но и эстетику вашего интерьера",
              color: "from-emerald-500 to-green-500"
            }
          ].map((advantage, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 shadow-xl border border-emerald-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                activeBlossoms.includes(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{
                transitionDelay: `${index * 150}ms`
              }}
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${advantage.color} flex items-center justify-center mb-6 mx-auto border-4 border-white shadow-lg`}>
                <div className="text-white">{advantage.icon}</div>
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-3 text-center">
                {advantage.title}
              </h3>
              <p className="text-emerald-700 text-center">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  
  // FAQ
  const FAQSection = () => (
    <section 
      className="py-20 px-4 relative"
      data-blossom-section="5"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-900 mb-4">
            Частые <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-500">вопросы</span>
          </h2>
          <p className="text-xl text-emerald-600">
            Ответы на самые популярные вопросы
          </p>
        </div>
        
        <div className="space-y-4">
          {[
            {
              question: "Как работает ваш алгоритм подбора растений?",
              answer: "Наш ИИ анализирует более 50 параметров: освещённость, влажность, температуру в помещении, ваши привычки по уходу, наличие детей и животных, а также эстетические предпочтения."
            },
            {
              question: "Что делать, если растение не прижилось?",
              answer: "Мы предоставляем 30-дневную гарантию на все подобранные растения. Если возникли проблемы, наши эксперты помогут с диагностикой или предложат замену."
            },
            {
              question: "Можно ли доверить выбор подарка вашему сервису?",
              answer: "Да! У нас есть специальный режим 'Подарок', где мы учитываем характер получателя, повод и даже символическое значение разных растений."
            },
            {
              question: "Как часто нужно обновлять информацию о растениях?",
              answer: "Наша система автоматически отслеживает изменения условий (сезонность, переезды) и предлагает корректировки ухода. Вы также можете вручную обновлять информацию в любое время."
            },
            {
              question: "Есть ли мобильное приложение?",
              answer: "Да! Наше приложение доступно для iOS и Android. Оно включает все функции веб-версии плюс push-уведомления о поливе и фотодиагностику растений."
            }
          ].map((item, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 shadow-lg border border-emerald-100 transition-all duration-500 hover:shadow-xl ${
                activeBlossoms.includes(5) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`
              }}
            >
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2 group-hover:text-emerald-800 transition-colors">
                    {item.question}
                  </h3>
                  <p className="text-emerald-700">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  
  // Финальный призыв
  const CTASection = () => (
    <section 
      className="min-h-[60vh] relative overflow-hidden flex items-center justify-center px-4"
      data-blossom-section="6"
    >
      {/* Очень легкий градиент с едва заметными точками */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/5 to-white">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-200/30 rounded-full"
            style={{
              left: `${(i * 15) % 100}%`,
              top: `${(i * 20) % 100}%`,
              animation: `floatLight ${15 + i * 2}s ease-in-out infinite ${i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className={`mb-8 transition-all duration-1000 ${
          activeBlossoms.includes(6) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <h2 className="text-5xl font-bold text-emerald-900 mb-6">
            Готовы начать свой путь в мир растений?
          </h2>
          <p className="text-2xl text-emerald-600 mb-10 max-w-2xl mx-auto">
            Присоединяйтесь к сообществу любителей растений и откройте для себя гармонию природы дома
          </p>
          
          <button
            onClick={() => onStartSelection && onStartSelection()}
            className="group relative px-16 py-5 bg-gradient-to-r from-emerald-600 to-lime-500 text-white font-bold text-2xl rounded-2xl shadow-2xl shadow-emerald-300/50 hover:shadow-3xl hover:shadow-emerald-400/50 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-lime-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-center">
              <Trees className="w-8 h-8 mr-4 group-hover:animate-pulse" />
              Начать зелёное путешествие
              <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>
        
        {/* Счётчики */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { number: "10K+", label: "Счастливых растений" },
            { number: "95%", label: "Успешных подборов" },
            { number: "24/7", label: "Поддержка" },
            { number: "∞", label: "Зелёных возможностей" }
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="text-4xl font-bold text-emerald-600 mb-2 group-hover:scale-110 transition-transform duration-300">{stat.number}</div>
              <div className="text-emerald-500 group-hover:text-emerald-700 transition-colors">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  
  // Футер
  const Footer = () => (
    <footer className="mt-20 bg-emerald-900 text-emerald-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <Leaf className="w-8 h-8 text-lime-400 mr-2" />
              <span className="text-2xl font-bold">Flowers'Choice</span>
            </div>
            <p className="text-emerald-300">
              Делаем дома зеленее с помощью технологий и любви к природе
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Главная</a></li>
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">О нас</a></li>
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Растения</a></li>
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Блог</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Ресурсы</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Энциклопедия растений</a></li>
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Гид по уходу</a></li>
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Сообщество</a></li>
              <li><a href="#" className="text-emerald-300 hover:text-white transition-colors">Для бизнеса</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4">Контакты</h4>
            <ul className="space-y-2">
              <li className="text-emerald-300">Москва, ул. Примерная, 123</li>
              <li className="text-emerald-300">hello@flowerschoice.ru</li>
              <li className="text-emerald-300">+7 (999) 123-45-67</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-emerald-800 pt-8 text-center text-emerald-400">
          <p>© 2024 Flowers'Choice. Московский институт электроники и математики им. А. Н. Тихонова</p>
          <p className="mt-2 text-sm">Департамент компьютерной инженерии • Курс: Проектирование веб-приложений</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col">
      {/* Основные секции */}
      <div className="flex-1">
        <HeroSection />
        <PrinciplesSection />
        <CareSection />
        <SelectionSection />
        <AdvantagesSection />
        <FAQSection />
        <CTASection />
      </div>
      <Footer />
      
      {/* Глобальные стили анимаций */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes lineGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes floatLight {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.1; }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        /* Плавный скролл */
        html {
          scroll-behavior: smooth;
        }
        
        /* Стили для всего документа */
        body {
          background: white;
          font-family: system-ui, -apple-system, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
