import React from 'react';
import './NormalState.css';

const NormalState = ({ onSubmit, loading }) => {
  return (
    <div className="normal-state-container">
      <div className="normal-state-card">
        <h1>📚 Focus Mode</h1>
        <p className="subtitle">Complete your daily check-in to stay on track</p>
        
        <div className="normal-content">
          <div className="info-box">
            <h3>✨ You're On Track!</h3>
            <p>Keep up with your daily check-ins to maintain your progress.</p>
          </div>

          {onSubmit}
        </div>
      </div>
    </div>
  );
};

export default NormalState;
