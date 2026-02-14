import React, { useState, useMemo } from 'react';
import { Leaf, Gift, User, Zap, Sun, Droplets, Heart, Feather, ThumbsUp, X, ChevronRight, Check, RefreshCcw, GitCompare, Minus, Plus, Settings, Calendar, Notebook, Star, BarChart3, Search } from 'lucide-react';

const WateringCalendarModal = ({ plant, onClose }) => {
    const [date, setDate] = useState(new Date());

    const wateringDates = useMemo(() => {
        if (!plant.wateringHistory) return new Set();
        return new Set(
            plant.wateringHistory.map(ts => {
                const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
                return d.toDateString();
            })
        );
    }, [plant.wateringHistory]);

    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const blanks = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handlePrevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    const handleNextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-20 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-emerald-800 mb-4 text-center">График полива: {plant.name}</h3>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                    <div className="font-semibold text-lg">{monthNames[date.getMonth()]} {date.getFullYear()}</div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day} className="font-bold text-gray-500">{day}</div>)}
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {daysArray.map(day => {
                        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
                        const isWatered = wateringDates.has(currentDate.toDateString());
                        return (
                            <div key={day} className={`w-9 h-9 flex items-center justify-center rounded-full ${isWatered ? 'bg-lime-500 text-white' : 'bg-gray-100'}`}>
                                {day}
                            </div>
                        );
                    })}
                </div>
                 <button onClick={onClose} className="mt-6 w-full py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors">Закрыть</button>
            </div>
        </div>
    );
};

export default WateringCalendarModal;