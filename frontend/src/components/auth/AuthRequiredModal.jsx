import React from 'react';
import { Leaf } from 'lucide-react';

function AuthRequiredModal({ onClose, onLogin, onRegister }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
        <div className="flex items-center justify-center mb-4">
          <Leaf className="w-8 h-8 text-emerald-600 mr-2" />
          <h3 className="text-2xl font-bold text-emerald-800">Требуется авторизация</h3>
        </div>
        <p className="text-gray-700 mb-6 text-center">
          Пожалуйста, войдите в аккаунт или зарегистрируйтесь, чтобы использовать эту функцию.
        </p>
        <div className="flex gap-3 flex-col">
          <button
            type="button"
            onClick={onLogin}
            className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors"
          >
            Войти
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="py-2 px-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold rounded-lg transition-colors"
          >
            Зарегистрироваться
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthRequiredModal;
