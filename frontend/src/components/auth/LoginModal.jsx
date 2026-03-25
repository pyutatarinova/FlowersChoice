import React from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

function LoginModal({ onClose, onLogin }) {
  const [form, setForm] = React.useState({
    email: '',
    password: ''
  });
  const [error, setError] = React.useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data); // data может содержать профиль
      } else {
        const err = await res.json();
        setError(err.message || 'Ошибка входа.');
      }
    } catch {
      setError('Ошибка соединения с сервером.');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
        <h3 className="text-2xl font-bold text-emerald-800 mb-4 text-center">Вход</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Почта *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-3 justify-center mt-4">
          <button type="submit" className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg">Войти</button>
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg">Отмена</button>
        </div>
      </form>
    </div>
  );
}

export default LoginModal;

