import React, { useState } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

function AuthModal({ onClose, onRegister }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    has_children: false,
    has_pets: false,
    has_allergies: false,
    preferences: ''
  });
  const [error, setError] = useState('');

  const isPasswordValid = (password) => {
    if (typeof password !== 'string') return false;
    if (password.length < 6) return false;
    const hasLetter = /\p{L}/u.test(password);
    const hasDigit = /\p{N}/u.test(password);
    return hasLetter && hasDigit;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Пожалуйста, заполните все обязательные поля.');
      return;
    }
    if (!isPasswordValid(form.password)) {
      setError('Пароль должен быть не короче 6 символов и содержать буквы и цифры.');
      return;
    }
    setError('');
    const result = await onRegister(form);
    if (result && result.success === false) {
      setError(result.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
        <h3 className="text-2xl font-bold text-emerald-800 mb-4 text-center">Регистрация пользователя</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Почта *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
            minLength={6}
            title="Минимум 6 символов, обязательно буквы и цифры"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Есть ли у вас дети?</label>
          <input type="checkbox" name="has_children" checked={form.has_children} onChange={handleChange} className="mr-2" /> Да
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Есть ли у вас домашние животные?</label>
          <input type="checkbox" name="has_pets" checked={form.has_pets} onChange={handleChange} className="mr-2" /> Да
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Есть ли аллергия на цветы?</label>
          <input type="checkbox" name="has_allergies" checked={form.has_allergies} onChange={handleChange} className="mr-2" /> Да
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ваши предпочтения по цветам</label>
          <textarea name="preferences" value={form.preferences} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Опишите ваши пожелания..." />
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-3 justify-center mt-4">
          <button type="submit" className="py-2 px-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-lg">Зарегистрироваться</button>
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg">Отмена</button>
        </div>
      </form>
    </div>
  );
}

export default AuthModal;
