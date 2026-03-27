import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Send, Share2, X } from 'lucide-react';
import { getPlantShareUrl, isProdShareBase } from '../../utils/plantLinks';

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

const buildTelegramShareUrl = (url, title) => {
  const params = new URLSearchParams({
    url,
    text: title,
  });
  return `https://t.me/share/url?${params.toString()}`;
};

const buildVkShareUrl = (url, title) => {
  const params = new URLSearchParams({
    url,
    title,
  });
  return `https://vk.com/share.php?${params.toString()}`;
};

const PlantShareMenu = ({ plant, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const rootRef = useRef(null);

  const plantName = plant?.plant_name || plant?.name || 'Растение';
  const shareUrl = useMemo(() => getPlantShareUrl(plant), [plant]);
  const canShareExternally = useMemo(() => isProdShareBase(), []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleWindowClick = (event) => {
      if (!rootRef.current || rootRef.current.contains(event.target)) return;
      setIsOpen(false);
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('mousedown', handleWindowClick);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('mousedown', handleWindowClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(''), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const setInfoStatus = useCallback((message, error = false) => {
    setIsError(error);
    setStatus(message);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await copyText(shareUrl);
      setInfoStatus('Ссылка скопирована');
      setIsOpen(false);
    } catch (error) {
      setInfoStatus('Не удалось скопировать ссылку', true);
      console.error('Copy share link failed:', error);
    }
  }, [setInfoStatus, shareUrl]);

  const handleExternalShare = useCallback(
    (target) => {
      if (!canShareExternally) {
        setInfoStatus('Публичный шэринг доступен только в prod', true);
        return;
      }

      const title = `Посмотри растение: ${plantName}`;
      const destination = target === 'tg' ? buildTelegramShareUrl(shareUrl, title) : buildVkShareUrl(shareUrl, title);
      window.open(destination, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    },
    [canShareExternally, plantName, setInfoStatus, shareUrl]
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
        aria-label="Поделиться растением"
        title="Поделиться"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-40 w-56 rounded-2xl border border-emerald-100 bg-white shadow-2xl p-2">
          <button
            onClick={handleCopy}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-emerald-800 hover:bg-emerald-50 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4 text-emerald-500" />
            Скопировать ссылку
          </button>
          <button
            onClick={() => handleExternalShare('tg')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
              canShareExternally
                ? 'text-sky-700 hover:bg-sky-50'
                : 'text-slate-400 bg-slate-50 cursor-not-allowed'
            }`}
            title={canShareExternally ? 'Поделиться в Telegram' : 'Доступно только в prod'}
          >
            <Send className="w-4 h-4" />
            Поделиться в TG
          </button>
          <button
            onClick={() => handleExternalShare('vk')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
              canShareExternally
                ? 'text-indigo-700 hover:bg-indigo-50'
                : 'text-slate-400 bg-slate-50 cursor-not-allowed'
            }`}
            title={canShareExternally ? 'Поделиться во ВКонтакте' : 'Доступно только в prod'}
          >
            <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
              VK
            </span>
            Поделиться в VK
          </button>

        </div>
      )}

      {status && (
        <div
          className={`absolute right-0 -bottom-10 z-40 px-3 py-1 rounded-lg text-xs shadow-md border ${
            isError
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {!isError && <Check className="w-3 h-3" />}
            {status}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlantShareMenu;
