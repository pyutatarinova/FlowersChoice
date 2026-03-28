import React, { useState, useEffect, useRef } from 'react';
import { Droplets, X, Calendar, Notebook, Star, BarChart3 } from 'lucide-react';
import WateringCalendarModal from '../../components/my-plants/WateringCalendarModal';
import { getWateringStatus, formatDate, normalizeWateringHistory, toISODateString } from '../../lib/wateringUtils';

const MyPlantCard = ({ plant, onUpdate, onRemove }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { status, isDue, lastWatered } = getWateringStatus(
        plant.wateringHistory,
        plant.wateringSchedule,
        plant.lastWateringDate
    );
    const [newNotes, setNewNotes] = useState(plant.notes || '');
    const currentRating = Number.isFinite(Number(plant.rating)) ? Number(plant.rating) : 0;
    const timeoutRef = useRef(null);

    useEffect(() => {
        timeoutRef.current = setTimeout(() => {
            if (newNotes !== plant.notes) onUpdate(plant.id, { notes: newNotes });
        }, 3000);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [newNotes, plant.notes, plant.id, onUpdate]);

    const handleNotesBlur = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (newNotes !== plant.notes) onUpdate(plant.id, { notes: newNotes });
    };

    const handleScheduleChange = (event) => {
        const value = event.target.value;
        const nextSchedule = value === '' ? null : parseInt(value, 10);
        const currentHistory = normalizeWateringHistory(plant.wateringHistory);
        const currentLastWateringDate = toISODateString(plant.lastWateringDate) || currentHistory[currentHistory.length - 1] || null;
        onUpdate(plant.id, {
            wateringSchedule: Number.isFinite(nextSchedule) ? nextSchedule : null,
            wateringHistory: currentHistory,
            lastWateringDate: currentLastWateringDate
        });
    };

    const handleRatingChange = (newRating) => onUpdate(plant.id, { rating: newRating });

    const handleWatering = () => {
        const today = toISODateString(new Date());
        const currentHistory = normalizeWateringHistory(plant.wateringHistory);
        onUpdate(plant.id, {
            wateringHistory: normalizeWateringHistory([...currentHistory, today]),
            lastWateringDate: today,
            wateredNow: true
        });
    };

    return (
        <>
            {isCalendarOpen && <WateringCalendarModal plant={plant} onClose={() => setIsCalendarOpen(false)} />}
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 mb-6 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center border-r md:border-r-2 border-emerald-50 pr-4">
                    <img src={plant.image} alt={plant.name} className="w-24 h-24 object-cover rounded-lg shadow-md mb-3" />
                    <h4 className="text-xl font-bold text-emerald-800">{plant.name}</h4>
                    <p className="text-xs italic text-emerald-500">{plant.latin}</p>
                    <button onClick={() => onRemove(plant.id)} className="mt-3 text-red-500 hover:text-red-700 text-sm flex items-center">
                        <X className="w-4 h-4 mr-1" />Удалить
                    </button>
                </div>

                <div className="md:border-r-2 border-emerald-50 pr-4">
                    <h5 className="text-lg font-semibold text-lime-700 mb-3 flex items-center"><Calendar className="w-5 h-5 mr-2" /> Уход</h5>
                    <div className="p-3 rounded-lg flex items-center justify-between text-sm font-medium mb-3" style={{ backgroundColor: isDue ? '#FEE2E2' : '#D1FAE5', color: isDue ? '#EF4444' : '#059669' }}>{status}</div>
                    <p className="text-sm text-emerald-600 mb-2">Последний полив: <span className="font-semibold">{formatDate(lastWatered)}</span></p>
                    <div className="flex items-center space-x-2 text-sm text-emerald-600 mb-4">
                        <span>График полива (дни):</span>
                        <select value={plant.wateringSchedule ?? ''} onChange={handleScheduleChange} className="p-1 border border-emerald-300 rounded-md bg-white focus:ring-lime-500 focus:border-lime-500">
                            <option value="">Не выбрано</option>
                            {[3, 5, 7, 10, 14, 21, 30].map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={handleWatering} className="flex-1 py-2 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition-colors shadow-md flex items-center justify-center text-sm">
                            <Droplets className="w-4 h-4 mr-1" />Я полил(а)!
                        </button>
                        <button onClick={() => setIsCalendarOpen(true)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" title="График полива">
                            <BarChart3 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div>
                    <h5 className="text-lg font-semibold text-lime-700 mb-3 flex items-center"><Notebook className="w-5 h-5 mr-2" /> Журнал</h5>
                    <div className="flex items-center space-x-1 mb-3">
                        {[1, 2, 3, 4, 5].map((rating) => <Star key={rating} className={`w-6 h-6 cursor-pointer transition-colors ${currentRating >= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => handleRatingChange(rating)} />)}
                        <span className="text-sm text-emerald-500 ml-2">({currentRating} из 5)</span>
                    </div>
                    <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} onBlur={handleNotesBlur} placeholder="Ваши заметки..." rows="4" className="w-full p-2 border border-emerald-300 rounded-lg focus:ring-lime-500 focus:border-lime-500 transition-all text-sm" />
                </div>
            </div>
        </>
    );
};

export default MyPlantCard;
