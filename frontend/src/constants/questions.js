import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

export const QUESTIONS = {
  self: [
    {
      key: 'location',
      prompt: 'Где будет стоять растение?',
      placeholder: 'Например: "Рядом с южным окном" или "В глубине северной комнаты".',
      options: [
        { label: 'На ярком окне (юг/запад)', value: 'bright window', icon: Sun },
        { label: 'В светлой комнате (восток/север)', value: 'light room', icon: Feather },
        { label: 'В тени или глубине комнаты', value: 'shade', icon: Leaf },
        { label: 'На балконе (сезонно)', value: 'balcony', icon: Heart },
        { label: 'В ванной (влажно)', value: 'bathroom', icon: Droplets }, 
      ],
    },
    {
      key: 'care_regime',
      prompt: 'Какой уход ты готов(а) предоставить?',
      placeholder: 'Например: "Готов поливать раз в 3 дня" или "Только неприхотливое".',
      options: [
        { label: 'Уход 2-3 раза в неделю', value: 'high care', icon: Heart },
        { label: 'Умеренный уход (раз в неделю)', value: 'medium care', icon: Droplets },
        { label: 'Неприхотливое (редкий полив)', value: 'low care', icon: Zap },
        { label: 'Часто опрыскивать/высокая влажность', value: 'high humidity', icon: Droplets },
      ],
    },
    {
      key: 'function',
      prompt: 'Какую роль должно выполнять растение?',
      placeholder: 'Например: "Хочу, чтобы оно очищало воздух" или "Только для декора".',
      options: [
        { label: 'Очищало воздух (польза)', value: 'air purifying', icon: Leaf },
        { label: 'Украшало интерьер (эстетика)', value: 'decorative', icon: Heart },
        { label: 'Просто зелень и умиротворение', value: 'greenery', icon: Feather }, 
        { label: 'Фон для фото', value: 'photo_background', icon: Gift },
      ],
    },
    {
      key: 'size_type',
      prompt: 'Предпочтения к размеру и форме?',
      placeholder: 'Например: "Нужно высокое напольное растение" или "Маленькое для стола".',
      options: [
        { label: 'Большое, напольное', value: 'large floor', icon: Zap },
        { label: 'Подвесное, ампельное', value: 'hanging', icon: Droplets },
        { label: 'Маленькое, настольное', value: 'table top', icon: Feather },
        { label: 'Разные размеры, главное, чтобы вписалось', value: 'any size', icon: Heart },
      ],
    },
    {
      key: 'extra_notes',
      prompt: 'Ещё какие-то важные примечания?',
      placeholder: 'Например: "Хочу с красными листьями" или "Главное, чтобы не было запаха".',
      options: [
        { label: 'Безопасно для животных', value: 'safe for pets' },
        { label: 'Цветущее', value: 'flowering' },
        { label: 'С яркими листьями', value: 'colorful leaves' },
        { label: 'Теневыносливое', value: 'shade tolerant' },
        { label: 'Крупногабаритное', value: 'large volume' },
      ]
    }
  ],
  gift: [
    {
      key: 'recipient',
      prompt: 'Кому ты хочешь подарить?',
      placeholder: 'Например: "Моей девушке" или "Начальнику".',
      options: [
        { label: 'Партнеру (романтика)', value: 'partner', icon: Heart },
        { label: 'Коллеге/Начальнику (сдержанность)', value: 'colleague', icon: User },
        { label: 'Маме/Родственнику (забота)', value: 'family', icon: Gift },
        { label: 'Человеку без опыта ухода', value: 'beginner', icon: Feather },
        { label: 'Опытному любителю цветов', value: 'expert', icon: Zap },
      ],
    },
    {
      key: 'occasion',
      prompt: 'Повод или настроение подарка?',
      placeholder: 'Например: "День рождения" или "Просто так, чтобы подбодрить".',
      options: [
        { label: 'День рождения / Юбилей', value: 'birthday', icon: Gift },
        { label: 'Романтика / Признание', value: 'romantic', icon: Heart },
        { label: 'Забота / Благодарность', value: 'care', icon: Leaf },
        { label: 'Символика (новая работа, переезд)', value: 'symbolic', icon: Zap },
      ],
    },
    {
      key: 'style',
      prompt: 'Предпочтения к внешнему виду подарка?',
      placeholder: 'Например: "Хочу что-то необычное и яркое" или "Сдержанное и зеленое".',
      options: [
        { label: 'Яркое, необычное, цветущее', value: 'expressive', icon: Zap },
        { label: 'Спокойное, зеленое, минималистичное', value: 'minimalist', icon: Feather },
        { label: 'С акцентом на форму (листья/ствол)', value: 'form_accent', icon: Leaf },
        { label: 'Небольшое, для рабочего стола', value: 'office_gift', icon: User },
      ],
    },
    {
      key: 'gift_location',
      prompt: 'Где, скорее всего, оно будет стоять?',
      placeholder: 'Например: "В офисе" или "На подоконнике в спальне".',
      options: [
        { label: 'Подоконник с солнцем', value: 'sunny_window', icon: Sun },
        { label: 'Офисный стол / Кабинет', value: 'office', icon: User },
        { label: 'Кухня или гостиная', value: 'living_area', icon: Heart },
        { label: 'Ванная (светлая или темная)', value: 'bathroom', icon: Droplets },
      ],
    },
    {
      key: 'extra_notes',
      prompt: 'Ещё какие-то важные примечания?',
      placeholder: 'Например: "Хочу с красными листьями" или "Главное, чтобы не было запаха".',
      options: [
        { label: 'Безопасно для животных', value: 'safe_for_pets' },
        { label: 'Цветущее', value: 'flowering' },
        { label: 'С яркими листьями', value: 'colorful_leaves' },
        { label: 'Теневыносливое', value: 'shade_tolerant' },
        { label: 'Долговечное', value: 'long_lasting' },
      ]
    }
  ],
};