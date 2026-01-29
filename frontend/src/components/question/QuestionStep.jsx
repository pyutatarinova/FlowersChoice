import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

const QuestionStep = ({ question, answer, setAnswer, onNext, isLastStep }) => {
  const initialData = answer[question.key] || { text: '', tags: [] };
  const [textAreaValue, setTextAreaValue] = useState(initialData.text);
  const [selectedTags, setSelectedTags] = useState(initialData.tags);

  // Сохраняем автоматически при изменении
  useEffect(() => {
    setAnswer({
      [question.key]: {
        text: textAreaValue,
        tags: selectedTags
      }
    });
  }, [textAreaValue, selectedTags]);
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const isAnswered = isLastStep ? true : (textAreaValue.trim().length > 0 || selectedTags.length > 0);
  const buttonText = isLastStep ? 'Сгенерировать подборку' : 'Далее';

  const handleNextClick = () => {
    // ❗ ГАРАНТИРУЕМ СОХРАНЕНИЕ ПЕРЕД ПЕРЕХОДОМ
    setAnswer({
      [question.key]: {
        text: textAreaValue,
        tags: selectedTags
      }
    });

    // Теперь можно переходить
    onNext();
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-emerald-800 mb-6 text-center">
        {question.prompt}
      </h2>
      
      <textarea
        value={textAreaValue}
        onChange={(e) => setTextAreaValue(e.target.value)}
        placeholder={question.placeholder}
        rows="4"
        className="w-full p-3 border border-emerald-300 rounded-lg focus:ring-lime-500 focus:border-lime-500 transition-all text-emerald-700"
      />

      <p className="text-sm font-medium text-emerald-600 my-4 text-center">
          Или просто выберите тэги:
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleTag(option.value)}
            className={`
              text-sm px-3 py-1.5 rounded-full transition-colors font-medium
              ${selectedTags.includes(option.value)
                ? 'bg-lime-500 text-white shadow-md'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleNextClick}
          disabled={!isAnswered}
          className={`
            py-3 px-6 font-bold rounded-xl transition-all shadow-md flex items-center justify-center
            ${isAnswered
              ? 'bg-lime-500 text-white hover:bg-lime-600 shadow-lime-300/50'
              : 'bg-emerald-200 text-emerald-400 cursor-not-allowed'
            }
          `}
        >
          {isLastStep ? <Zap className="w-5 h-5 mr-2" /> : null}
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default QuestionStep;