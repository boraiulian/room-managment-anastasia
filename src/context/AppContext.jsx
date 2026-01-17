import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialRooms } from '../data/mockData';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [roomsRes, resRes] = await Promise.all([
        fetch(`${API_URL}/rooms`, { headers }),
        fetch(`${API_URL}/reservations`, { headers })
      ]);

      if (roomsRes.ok && resRes.ok) {
        const roomsData = await roomsRes.json();
        const resData = await resRes.json();
        setRooms(roomsData.rooms);
        setReservations(resData.reservations.map(r => ({
          ...r,
          startTime: new Date(r.startTime),
          endTime: new Date(r.endTime)
        })));
      } else if (roomsRes.status === 401 || roomsRes.status === 403) {
        logout();
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setRooms([]);
    setReservations([]);
  };

  const addReservation = async (reservation) => {
    try {
      const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...reservation,
          roomId: parseInt(reservation.roomId)
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newRes = {
          ...reservation,
          id: data.id,
          roomId: parseInt(reservation.roomId)
        };
        setReservations([...reservations, newRes]);
        return newRes;
      }
    } catch (error) {
      console.error("Error adding reservation", error);
    }
  };

  const updateReservation = (id, updates) => {
    // Optimistic update
    setReservations(reservations.map(r =>
      r.id === id ? { ...r, ...updates } : r
    ));

    // API Call
    fetch(`${API_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    }).catch(err => {
      console.error("Error updating reservation", err);
      fetchData(); // Revert on error
    });
  };

  const deleteReservation = (id) => {
    // Optimistic update
    setReservations(reservations.filter(r => r.id !== id));

    // API Call
    fetch(`${API_URL}/reservations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(err => {
      console.error("Error deleting reservation", err);
      fetchData(); // Revert on error
    });
  };

  const checkRoomAvailability = (roomId, startTime, endTime, excludeReservationId = null) => {
    const conflicting = reservations.some(r => {
      // Ensure IDs are compared as numbers/strings consistently
      if (parseInt(r.roomId) !== parseInt(roomId)) return false;
      if (excludeReservationId && r.id === excludeReservationId) return false;

      const rStart = new Date(r.startTime).getTime();
      const rEnd = new Date(r.endTime).getTime();
      const checkStart = new Date(startTime).getTime();
      const checkEnd = new Date(endTime).getTime();

      return (
        (checkStart >= rStart && checkStart < rEnd) ||
        (checkEnd > rStart && checkEnd <= rEnd) ||
        (checkStart <= rStart && checkEnd >= rEnd)
      );
    });

    return !conflicting;
  };

  const getRoomStatus = (roomId, date = new Date()) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const hasReservation = reservations.some(r => {
      if (parseInt(r.roomId) !== parseInt(roomId)) return false;
      const rStart = new Date(r.startTime);
      const rEnd = new Date(r.endTime);
      return rStart <= dayEnd && rEnd >= dayStart;
    });

    return hasReservation ? 'occupied' : 'free';
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    rooms,
    setRooms,
    reservations,
    addReservation,
    updateReservation,
    deleteReservation,
    checkRoomAvailability,
    getRoomStatus,
    theme,
    toggleTheme,
    loading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
