import React from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';

const AuthRequiredModal = ({ onClose, onLogin, onRegister }) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <button
        aria-label="Закрыть"
        className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
          <h3 className="text-lg font-semibold text-emerald-800">Требуется авторизация</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-emerald-700">
            Чтобы добавить растение в «Мои растения», войдите в аккаунт или зарегистрируйтесь.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              onClick={onLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </button>
            <button
              onClick={onRegister}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-lime-500 px-4 py-3 text-white font-semibold hover:bg-lime-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Зарегистрироваться
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
