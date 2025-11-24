import React, { useEffect, useState } from 'react';
import './LockedState.css';

const LockedState = ({ intervention, student }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!intervention || !intervention.expires_at) return;

      const expiresAt = new Date(intervention.expires_at);
      const now = new Date();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [intervention]);

  return (
    <div className="locked-state-container">
      <div className="locked-state-card">
        <div className="locked-icon">⏳</div>
        <h1>Analysis in Progress</h1>
        <p className="locked-message">
          Your stats suggest you need a quick intervention.
        </p>

        <div className="stats-display">
          <div className="stat-item">
            <span className="stat-label">Quiz Score</span>
            <span className="stat-value">4 / 10</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Focus Time</span>
            <span className="stat-value">30 / 60 min</span>
          </div>
        </div>

        <div className="waiting-section">
          <div className="spinner"></div>
          <p className="waiting-text">Waiting for Mentor...</p>
          <p className="waiting-detail">(Mentor is reviewing your case)</p>
        </div>

        <div className="timeout-warning">
          <p>
            <strong>Auto-unlock in:</strong> {timeLeft}
          </p>
          <small>
            If your mentor doesn't respond within 12 hours, you'll be automatically unlocked.
          </small>
        </div>
      </div>
    </div>
  );
};

export default LockedState;
