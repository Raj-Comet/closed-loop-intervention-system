import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export const StudentContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState('normal'); // 'normal', 'locked', 'in_remedial'
  const [intervention, setIntervention] = useState(null);
  const [lastLog, setLastLog] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get student ID from localStorage or URL
  const getStudentId = () => {
    return localStorage.getItem('studentId') || new URLSearchParams(window.location.search).get('student_id');
  };

  // Initialize socket connection
  useEffect(() => {
    const studentId = getStudentId();
    if (!studentId) return;

    const newSocket = io(SOCKET_URL, {
      query: { studentId },
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('student:register', studentId);
    });

    newSocket.on('state:changed', (data) => {
      console.log('State changed:', data);
      setStatus(data.status);
      setIntervention(data.intervention_id ? { id: data.intervention_id, task: data.remedial_task } : null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch student state
  const fetchStudentState = async () => {
    try {
      const studentId = getStudentId();
      if (!studentId) {
        setError('No student ID provided');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/student/${studentId}`);
      setStudent(response.data);
      setLastLog(response.data.last_log);

      // Determine status based on student.status and intervention
      if (response.data.intervention && response.data.intervention.status === 'approved') {
        setStatus('in_remedial');
        setIntervention(response.data.intervention);
      } else if (response.data.intervention && response.data.intervention.status === 'pending') {
        setStatus('locked');
        setIntervention(response.data.intervention);
      } else {
        setStatus('normal');
        setIntervention(null);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching student state:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const studentId = getStudentId();
    if (studentId) {
      fetchStudentState();
      // Poll every 5 seconds for updates
      const interval = setInterval(fetchStudentState, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const submitCheckin = async (quizScore, focusMinutes) => {
    try {
      const studentId = getStudentId();
      const response = await axios.post(`${API_URL}/daily-checkin`, {
        student_id: studentId,
        quiz_score: quizScore,
        focus_minutes: focusMinutes,
      });

      await fetchStudentState();
      return response.data;
    } catch (err) {
      console.error('Error submitting checkin:', err);
      throw err;
    }
  };

  const completeRemedial = async () => {
    try {
      const studentId = getStudentId();
      const response = await axios.post(`${API_URL}/complete-remedial`, {
        student_id: studentId,
        intervention_id: intervention.id,
      });

      await fetchStudentState();
      return response.data;
    } catch (err) {
      console.error('Error completing remedial:', err);
      throw err;
    }
  };

  return (
    <StudentContext.Provider
      value={{
        student,
        status,
        intervention,
        lastLog,
        loading,
        error,
        socket,
        submitCheckin,
        completeRemedial,
        refetchStudent: fetchStudentState,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};
