import React, { useState, useEffect } from 'react';
import './FocusTimer.css';

const FocusTimer = ({ onSubmit, disabled = false }) => {
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [quizScore, setQuizScore] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
        setFocusMinutes(Math.floor(time / 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const handleStartTimer = () => {
    setTime(0);
    setIsRunning(true);
  };

  const handleStopTimer = () => {
    setIsRunning(false);
  };

  const handleSubmit = () => {
    if (!quizScore || quizScore < 0 || quizScore > 10) {
      alert('Please enter a valid quiz score (0-10)');
      return;
    }
    onSubmit(parseInt(quizScore), focusMinutes);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="focus-timer">
      <div className="timer-display">
        <h2>⏱️ Focus Timer</h2>
        <div className="timer-time">{formatTime(time)}</div>
        <div className="timer-minutes">Focus Time: {focusMinutes}/90 min</div>
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button onClick={handleStartTimer} disabled={disabled}>
            Start Focus Timer
          </button>
        ) : (
          <button onClick={handleStopTimer} disabled={disabled}>
            Stop Timer
          </button>
        )}
      </div>

      <div className="quiz-section">
        <h3>📝 Daily Quiz</h3>
        <input
          type="number"
          min="0"
          max="10"
          value={quizScore}
          onChange={(e) => setQuizScore(e.target.value)}
          placeholder="Enter score (0-10)"
          disabled={disabled}
          className="quiz-input"
        />
        <span className="score-display"> / 10</span>
      </div>

      <button onClick={handleSubmit} disabled={disabled || !quizScore} className="submit-btn">
        SUBMIT CHECK-IN
      </button>
    </div>
  );
};

export default FocusTimer;
