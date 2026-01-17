import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import ro from 'date-fns/locale/ro';

const Dashboard = () => {
  const { rooms, reservations, getRoomStatus } = useApp();
  const navigate = useNavigate();
  const today = new Date();

  const stats = useMemo(() => {
    const occupied = rooms.filter(room =>
      getRoomStatus(room.id, today) === 'occupied'
    ).length;
    const free = rooms.length - occupied;

    return { total: rooms.length, occupied, free };
  }, [rooms, getRoomStatus, today]);

  const todayReservations = useMemo(() => {
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    return reservations.filter(r =>
      r.startTime <= dayEnd && r.endTime >= dayStart
    ).slice(0, 5);
  }, [reservations, today]);

  const freeRooms = useMemo(() => {
    return rooms.filter(room =>
      getRoomStatus(room.id, today) === 'free'
    );
  }, [rooms, getRoomStatus, today]);

  const handleQuickReservation = () => {
    navigate('/calendar');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Dashboard
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {format(today, "EEEE, d MMMM yyyy", { locale: ro })}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Camere</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Libere</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.free}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Ocupate</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.occupied}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            to="/calendar"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition duration-200 border-2 border-transparent hover:border-indigo-500"
          >
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Rezervări</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Vezi și gestionează rezervările
              </p>
            </div>
          </Link>

          <Link
            to="/rooms"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition duration-200 border-2 border-transparent hover:border-indigo-500"
          >
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Camere</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Vezi statusul tuturor camerelor
              </p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {freeRooms.length > 0 && (
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5">
                  Camere Libere ({freeRooms.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {freeRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 text-center"
                    >
                      <div className="font-semibold text-base sm:text-lg text-green-800 dark:text-green-300">
                        {room.name}
                      </div>
                      {room.type && (
                        <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-2">
                          {room.type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todayReservations.length > 0 && (
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Rezervări de astăzi
                </h3>
                <div className="space-y-3">
                  {todayReservations.map((reservation) => {
                    const room = rooms.find(r => r.id === reservation.roomId);
                    const formatTime = (date) => {
                      const minutes = date.getMinutes();
                      return minutes === 0 ? format(date, 'HH:00') : format(date, 'HH:mm');
                    };
                    return (
                      <div
                        key={reservation.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2"
                      >
                        <div>
                          <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-100">
                            {room?.name || 'Cameră necunoscută'}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                          </p>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          {reservation.guestName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 sticky top-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Acțiuni Rapide
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleQuickReservation}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition font-medium text-sm sm:text-base"
                >
                  Adaugă Rezervare
                </button>
                <Link
                  to="/calendar"
                  className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm sm:text-base text-center"
                >
                  Vezi Calendar
                </Link>
                <Link
                  to="/rooms"
                  className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm sm:text-base text-center"
                >
                  Vezi Camere
                </Link>
                {freeRooms.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {freeRooms.length} cameră{freeRooms.length !== 1 ? 'e' : ''} disponibilă{freeRooms.length !== 1 ? 'e' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

