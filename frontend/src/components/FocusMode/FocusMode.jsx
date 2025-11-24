import React, { useState, useEffect } from 'react';
import { useStudent } from '../../hooks/useStudent';
import { useVisibilityDetector } from '../../hooks/useVisibilityDetector';
import NormalState from './NormalState';
import LockedState from './LockedState';
import RemedialState from './RemadialState';
import FocusTimer from './FocusTimer';
import './FocusMode.css';

const FocusMode = () => {
  const { status, intervention, student, loading, error, submitCheckin, completeRemedial } = useStudent();
  const [blurWarning, setBlurWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bonus: Tab switch detection
  const { blurCount } = useVisibilityDetector(() => {
    setBlurWarning(true);
  });

  const handleSubmitCheckin = async (quizScore, focusMinutes) => {
    setIsSubmitting(true);
    try {
      await submitCheckin(quizScore, focusMinutes);
    } catch (error) {
      console.error('Error submitting checkin:', error);
      alert('Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRemedial = async () => {
    setIsSubmitting(true);
    try {
      await completeRemedial();
    } catch (error) {
      console.error('Error completing remedial:', error);
      alert('Failed to mark complete. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your focus mode...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="focus-mode-container">
      {blurWarning && (
        <div className="blur-warning">
          <p>⚠️ Tab switch detected! Be careful - excessive tab switches may flag your session.</p>
          <button onClick={() => setBlurWarning(false)}>Dismiss</button>
        </div>
      )}

      {status === 'normal' && (
        <NormalState
          onSubmit={<FocusTimer onSubmit={handleSubmitCheckin} disabled={isSubmitting} />}
          loading={isSubmitting}
        />
      )}

      {status === 'locked' && (
        <LockedState intervention={intervention} student={student} />
      )}

      {status === 'in_remedial' && (
        <RemedialState
          intervention={intervention}
          onComplete={handleCompleteRemedial}
          loading={isSubmitting}
        />
      )}
    </div>
  );
};

export default FocusMode;
