import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, addDays, subDays, setHours, setMinutes } from 'date-fns';
import ro from 'date-fns/locale/ro';
import { useApp } from '../context/AppContext';

const Calendar = () => {
  const { rooms, reservations, addReservation, updateReservation, deleteReservation, checkRoomAvailability } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    roomId: '',
    startTime: '',
    endTime: '',
    guestName: '',
    notes: '',
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (date) => {
    const minutes = date.getMinutes();
    if (minutes === 0) {
      return format(date, 'HH:00');
    }
    return format(date, 'HH:mm');
  };

  const formatHour = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getReservationsForDate = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return reservations.filter(r =>
      r.startTime <= dayEnd && r.endTime >= dayStart
    );
  };

  const getReservationsForHour = (date, hour) => {
    const hourStart = new Date(date);
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date(date);
    hourEnd.setHours(hour, 59, 59, 999);

    return reservations.filter(r =>
      r.startTime <= hourEnd && r.endTime >= hourStart
    );
  };

  const openCreateModal = (date, hour) => {
    const start = setMinutes(setHours(new Date(date), hour), 0);
    const end = setMinutes(setHours(new Date(date), hour + 1), 0);

    setFormData({
      roomId: rooms[0]?.id || '',
      startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
      guestName: '',
      notes: '',
    });
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      roomId: reservation.roomId,
      startTime: format(reservation.startTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(reservation.endTime, "yyyy-MM-dd'T'HH:mm"),
      guestName: reservation.guestName || '',
      notes: reservation.notes || '',
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (startTime >= endTime) {
      alert('Ora de început trebuie să fie înainte de ora de sfârșit');
      return;
    }

    if (modalMode === 'create') {
      if (!checkRoomAvailability(formData.roomId, startTime, endTime)) {
        alert('Cameră ocupată în acest interval!');
        return;
      }
      addReservation({
        roomId: parseInt(formData.roomId),
        startTime,
        endTime,
        guestName: formData.guestName,
        notes: formData.notes,
      });
    } else {
      if (!checkRoomAvailability(formData.roomId, startTime, endTime, selectedReservation.id)) {
        alert('Cameră ocupată în acest interval!');
        return;
      }
      updateReservation(selectedReservation.id, {
        roomId: parseInt(formData.roomId),
        startTime,
        endTime,
        guestName: formData.guestName,
        notes: formData.notes,
      });
    }

    setShowModal(false);
    setFormData({
      roomId: '',
      startTime: '',
      endTime: '',
      guestName: '',
      notes: '',
    });
  };

  const handleDelete = () => {
    if (selectedReservation && window.confirm('Sigur vrei să ștergi această rezervare?')) {
      deleteReservation(selectedReservation.id);
      setShowModal(false);
    }
  };

  const renderDayView = () => {
    const dayReservations = getReservationsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {format(currentDate, "EEEE, d MMMM yyyy", { locale: ro })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(subDays(currentDate, 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Astăzi
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {dayReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">Nu există rezervări pentru această zi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayReservations.map((reservation) => {
                const room = rooms.find(r => r.id === reservation.roomId);
                return (
                  <div
                    key={reservation.id}
                    className="bg-red-500 text-white p-4 rounded-lg cursor-pointer hover:bg-red-600"
                    onClick={() => openEditModal(reservation)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-lg">{room?.name}</div>
                        <div className="text-sm mt-1">
                          {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </div>
                        {reservation.guestName && (
                          <div className="text-sm mt-1 opacity-90">{reservation.guestName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ro });
    const weekEnd = endOfWeek(currentDate, { locale: ro });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {format(weekStart, 'd MMM', { locale: ro })} -{' '}
              {format(weekEnd, 'd MMM yyyy', { locale: ro })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Astăzi
              </button>
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Ora</div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-l dark:border-gray-700 ${isToday ? 'bg-yellow-100 dark:bg-yellow-900/30 font-semibold' : ''
                      }`}
                  >
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {format(day, 'EEE', { locale: ro })}
                    </div>
                    <div className="text-lg">{format(day, 'd')}</div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b dark:border-gray-700">
                  <div className="p-3 text-sm text-gray-600 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900">
                    {formatHour(hour)}
                  </div>
                  {weekDays.map((day) => {
                    const hourReservations = getReservationsForHour(day, hour);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={`p-2 border-l dark:border-gray-700 min-h-[50px] ${isToday ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                          }`}
                      >
                        {hourReservations.map((reservation) => {
                          const room = rooms.find((r) => r.id === reservation.roomId);
                          return (
                            <div
                              key={reservation.id}
                              className="bg-red-500 text-white p-2 rounded mb-1 cursor-pointer hover:bg-red-600 text-xs"
                              onClick={() => openEditModal(reservation)}
                            >
                              {room?.name}
                            </div>
                          );
                        })}
                        {hourReservations.length === 0 && (
                          <div
                            className="bg-green-50 text-green-700 p-1 rounded cursor-pointer hover:bg-green-100 text-center text-xs opacity-0 hover:opacity-100 transition-opacity"
                            onClick={() => openCreateModal(day, hour)}
                          >
                            +
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekStart = startOfWeek(monthStart, { locale: ro });
    const calendarDays = [];

    // zile goale înainte de prima zi din lună
    const leadingEmpty =
      weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1;
    for (let i = 0; i < leadingEmpty; i++) {
      calendarDays.push(null);
    }

    monthDays.forEach((day) => calendarDays.push(day));

    // completează ultima săptămână până la 7 zile
    while (calendarDays.length % 7 !== 0) {
      calendarDays.push(null);
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {format(currentDate, 'MMMM yyyy', { locale: ro })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Astăzi
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 min-w-[700px]">
            {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-w-[700px]">
            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="p-3 min-h-[120px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                );
              }

              const dayReservations = getReservationsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 min-h-[120px] border border-gray-200 dark:border-gray-700 ${isToday ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-gray-800'
                    } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`text-base font-semibold mb-2 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'
                      }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayReservations.slice(0, 2).map((reservation) => {
                      const room = rooms.find(
                        (r) => r.id === reservation.roomId
                      );
                      return (
                        <div
                          key={reservation.id}
                          className="bg-red-500 text-white p-1.5 rounded text-xs cursor-pointer hover:bg-red-600"
                          onClick={() => openEditModal(reservation)}
                        >
                          {room?.name}
                        </div>
                      );
                    })}
                    {dayReservations.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayReservations.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Calendar
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const now = new Date();
              const start = setMinutes(setHours(now, now.getHours() + 1), 0);
              const end = setMinutes(setHours(now, now.getHours() + 3), 0);
              setFormData({
                roomId: rooms[0]?.id || '',
                startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
                endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
                guestName: '',
                notes: '',
              });
              setModalMode('create');
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Adaugă Rezervare
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg transition ${view === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              Zi
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg transition ${view === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              Săptămână
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg transition ${view === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              Lună
            </button>
          </div>
        </div>
      </div>

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {modalMode === 'create' ? 'Adaugă Rezervare' : 'Editează Rezervare'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cameră
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selectează cameră</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ora început
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ora sfârșit
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nume client
                </label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nume client"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Note adiționale"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                >
                  {modalMode === 'create' ? 'Adaugă' : 'Salvează'}
                </button>
                {modalMode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Șterge
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;

