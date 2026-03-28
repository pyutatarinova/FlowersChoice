import React, { useState, useMemo } from 'react';
import {
    buildUpcomingWateringDates,
    getLatestWateringDate,
    normalizeWateringHistory,
    toISODateString
} from '../../lib/wateringUtils';

const WateringCalendarModal = ({ plant, onClose }) => {
    const [date, setDate] = useState(new Date());

    const wateringHistory = useMemo(
        () => normalizeWateringHistory(plant.wateringHistory),
        [plant.wateringHistory]
    );

    const lastWateringDate = useMemo(
        () => getLatestWateringDate(wateringHistory, plant.lastWateringDate),
        [wateringHistory, plant.lastWateringDate]
    );

    const plannedWateringDates = useMemo(
        () => buildUpcomingWateringDates(lastWateringDate, plant.wateringSchedule),
        [lastWateringDate, plant.wateringSchedule]
    );

    const wateredDatesSet = useMemo(() => new Set(wateringHistory), [wateringHistory]);
    const plannedDatesSet = useMemo(() => new Set(plannedWateringDates), [plannedWateringDates]);

    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const blanks = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handlePrevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    const handleNextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));

    const todayKey = toISODateString(new Date());

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-20 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-emerald-800 mb-4 text-center">График полива: {plant.name}</h3>

                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                    <div className="font-semibold text-lg">{monthNames[date.getMonth()]} {date.getFullYear()}</div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {weekDays.map((day) => <div key={day} className="font-bold text-gray-500">{day}</div>)}
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {daysArray.map((day) => {
                        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
                        const dateKey = toISODateString(currentDate);
                        const isWatered = wateredDatesSet.has(dateKey);
                        const isPlanned = plannedDatesSet.has(dateKey);
                        const isToday = dateKey === todayKey;

                        let baseClass = 'w-9 h-9 flex items-center justify-center rounded-full transition-colors '; 
                        if (isWatered) {
                            baseClass += 'bg-lime-500 text-white';
                        } else if (isPlanned) {
                            baseClass += 'bg-emerald-100 text-emerald-700 border border-emerald-300';
                        } else {
                            baseClass += 'bg-gray-100 text-gray-700';
                        }

                        if (isToday) {
                            baseClass += ' ring-2 ring-amber-400 ring-offset-1';
                        }

                        return (
                            <div key={day} className={baseClass}>
                                {day}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 text-xs text-emerald-700 space-y-1">
                    <div className="flex items-center"><span className="inline-block w-3 h-3 rounded-full bg-lime-500 mr-2"></span>Прошлые поливы</div>
                    <div className="flex items-center"><span className="inline-block w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300 mr-2"></span>Запланированные даты</div>
                    <div className="flex items-center"><span className="inline-block w-3 h-3 rounded-full border-2 border-amber-400 mr-2"></span>Сегодня</div>
                </div>

                <button onClick={onClose} className="mt-6 w-full py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors">Закрыть</button>
            </div>
        </div>
    );
};

export default WateringCalendarModal;
