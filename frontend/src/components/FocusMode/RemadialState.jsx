import React from 'react';
import './RemadialState.css';

const RemedialState = ({ intervention, onComplete, loading }) => {
  return (
    <div className="remedial-state-container">
      <div className="remedial-state-card">
        <div className="remedial-header">
          <div className="remedial-icon">📚</div>
          <h1>Your Focus Task</h1>
        </div>

        <div className="task-content">
          <div className="task-card">
            <h3>Task Assignment</h3>
            <p className="task-text">{intervention?.remedial_task || 'Complete your assigned task'}</p>

            <div className="task-meta">
              <div className="meta-item">
                <span className="meta-label">Assigned by</span>
                <span className="meta-value">Mentor</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value remedial">In Progress</span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-label">
                <span>Progress</span>
                <span>50%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>

          <div className="instructions">
            <h4>📋 Instructions</h4>
            <ul>
              <li>Complete the assigned task carefully</li>
              <li>Focus on understanding the material</li>
              <li>Mark complete when you're done</li>
              <li>You'll then be able to return to normal focus mode</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onComplete}
          disabled={loading}
          className="complete-btn"
        >
          {loading ? 'Marking Complete...' : '✓ Mark Complete'}
        </button>
      </div>
    </div>
  );
};

export default RemedialState;
