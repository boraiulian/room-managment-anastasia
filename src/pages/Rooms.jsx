import { useState } from 'react';
import { format } from 'date-fns';
import ro from 'date-fns/locale/ro';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Rooms = () => {
  const {
    rooms,
    reservations,
    getRoomStatus,
    addReservation,
    checkRoomAvailability,
    deleteReservation,
  } = useApp();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    guestName: '',
    notes: '',
  });

  const getRoomReservations = (roomId) => {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    return reservations
      .filter(r => r.roomId === roomId && r.startTime <= dayEnd && r.endTime >= dayStart)
      .sort((a, b) => a.startTime - b.startTime);
  };

  const openReservationModal = (room) => {
    setSelectedRoom(room);
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0);
    const end = new Date(now);
    end.setHours(end.getHours() + 2);
    end.setMinutes(0);

    setFormData({
      startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(end, "yyyy-MM-dd'T'HH:mm"),
      guestName: '',
      notes: '',
    });
    setShowReservationModal(true);
  };

  const handleReservationSubmit = (e) => {
    e.preventDefault();

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (startTime >= endTime) {
      alert('Ora de început trebuie să fie înainte de ora de sfârșit');
      return;
    }

    if (!checkRoomAvailability(selectedRoom.id, startTime, endTime)) {
      alert('Cameră ocupată în acest interval!');
      return;
    }

    addReservation({
      roomId: selectedRoom.id,
      startTime,
      endTime,
      guestName: formData.guestName,
      notes: formData.notes,
    });

    setShowReservationModal(false);
    setSelectedRoom(null);
  };

  const toggleRoomStatus = (room) => {
    const status = getRoomStatus(room.id);
    const todayReservations = getRoomReservations(room.id);
    const manualReservations = todayReservations.filter(
      (reservation) =>
        reservation.guestName === 'Marcat manual' &&
        reservation.notes === 'Status schimbat manual'
    );

    if (status === 'occupied') {
      if (manualReservations.length > 0) {
        manualReservations.forEach((reservation) => deleteReservation(reservation.id));
        return;
      }
      if (todayReservations.length > 0) {
        alert('Cameră are rezervări active. Șterge rezervările pentru a o marca ca liberă.');
        return;
      }
    }

    if (status === 'free') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      if (checkRoomAvailability(room.id, start, end)) {
        addReservation({
          roomId: room.id,
          startTime: start,
          endTime: end,
          guestName: 'Marcat manual',
          notes: 'Status schimbat manual',
        });
      }
    }
  };

  const formatTime = (date) => {
    const minutes = date.getMinutes();
    return minutes === 0 ? format(date, 'HH:00') : format(date, 'HH:mm');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Lista Camere</h2>
        <button
          onClick={() => navigate('/calendar')}
          className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Vezi Calendar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {rooms.map((room) => {
          const status = getRoomStatus(room.id);
          const todayReservations = getRoomReservations(room.id);
          const isOccupied = status === 'occupied';

          return (
            <div
              key={room.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 ${isOccupied ? 'border-red-500 dark:border-red-700' : 'border-green-500 dark:border-green-700'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{room.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{room.type}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Capacitate: {room.capacity} persoane</p>
                </div>
                <div
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ml-2 ${isOccupied
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                    : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                    }`}
                >
                  {isOccupied ? (
                    (() => {
                      const now = new Date();
                      const activeReservation = reservations.find(r =>
                        r.roomId === room.id &&
                        r.startTime <= now &&
                        r.endTime >= now
                      );
                      if (activeReservation) {
                        return (
                          <div className="flex flex-col items-end">
                            <span className="text-gray-800 dark:text-gray-100">Ocupat</span>
                            <span className="text-[10px] sm:text-xs text-red-700 dark:text-red-300 font-normal">
                              {format(activeReservation.startTime, 'dd MMM HH:mm')} - {format(activeReservation.endTime, 'dd MMM HH:mm')}
                            </span>
                          </div>
                        );
                      }
                      return <span className="text-gray-800 dark:text-gray-100">Ocupat</span>;
                    })()
                  ) : (
                    <span className="text-green-800 dark:text-green-300">Liber</span>
                  )}
                </div>
              </div>

              {todayReservations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Rezervări de astăzi:</p>
                  <div className="space-y-2">
                    {todayReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-2"
                      >
                        <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                          {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </div>
                        {reservation.guestName && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">{reservation.guestName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={() => openReservationModal(room)}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Adaugă Rezervare
                </button>
                <button
                  onClick={() => toggleRoomStatus(room)}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition text-xs sm:text-sm font-medium ${isOccupied
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  {isOccupied ? 'Marchează Liber' : 'Marchează Ocupat'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showReservationModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Rezervare rapidă - {selectedRoom.name}
            </h3>

            <form onSubmit={handleReservationSubmit} className="space-y-4">
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
                  Adaugă Rezervare
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedRoom(null);
                  }}
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

export default Rooms;

