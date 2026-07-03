import { useState, useEffect, useRef } from 'react';
import './Loader.css';

const LOADING_MESSAGES = [
  'Loading Patient Records',
  'Preparing Dashboard',
  'Connecting Departments',
  'Loading Appointments',
  'Syncing Hospital Data',
  'Almost Ready',
];

const MESSAGE_INTERVAL_MS = 2000;

/**
 * Loader — A lightweight, branded loading screen.
 *
 * Props:
 *   message   (string)  Optional. If provided, the rotating messages are
 *                        skipped and this static message is shown instead.
 *   overlay   (boolean) If true, renders as a fixed overlay (default false).
 *                        Use overlay for API calls within the app.
 */
export default function Loader({ message, overlay = false }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Only rotate messages when no static message is provided
    if (message) return;

    timerRef.current = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [message]);

  const displayMessage = message || LOADING_MESSAGES[msgIndex];

  return (
    <div className={`loader-container${overlay ? ' loader-overlay' : ''}`}>
      {/* Soft orange radial glow */}
      <div className="loader-glow" aria-hidden="true" />

      {/* Animated SVG ECG line */}
      <div className="loader-ecg" aria-hidden="true">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none">
          <polyline
            className="loader-ecg-path"
            points="0,30 20,30 30,30 40,10 50,50 60,30 80,30 90,30 100,30 110,30 120,10 130,50 140,30 160,30 170,30 180,30 200,30"
          />
        </svg>
      </div>


      {/* Brand title */}
      <h1 className="loader-title">
        Medora<span>360</span>
      </h1>

      {/* Subtitle */}
      <p className="loader-subtitle">Hospital Management System</p>

      {/* Animated loading message */}
      <div className="loader-message-container">
        <span className="loader-message" key={displayMessage}>
          {displayMessage}
          <span className="loader-dots">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </span>
      </div>
    </div>
  );
}