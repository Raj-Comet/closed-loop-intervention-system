import React from 'react';
import { StudentProvider } from './context/StudentContext';
import FocusMode from './components/FocusMode/FocusMode';
import './App.css';

function App() {
  return (
    <StudentProvider>
      <FocusMode />
    </StudentProvider>
  );
}

export default App;
