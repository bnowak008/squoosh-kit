import { useState, useEffect } from "react";
import "./AnimatedCharacter.css";

interface AnimatedCharacterProps {
  state: 'idle' | 'thinking' | 'working' | 'success' | 'error';
  className?: string;
}

export function AnimatedCharacter({ state, className = "" }: AnimatedCharacterProps) {
  const [blink, setBlink] = useState(false);

  // Random blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, Math.random() * 3000 + 2000);

    return () => clearInterval(interval);
  }, []);

  const getCharacterState = () => {
    switch (state) {
      case 'thinking':
        return {
          eyeOffset: 2,
          mouthPath: "M 20 35 Q 25 40 30 35",
          eyebrowOffset: -2,
          animation: "thinking"
        };
      case 'working':
        return {
          eyeOffset: 0,
          mouthPath: "M 18 35 Q 25 38 32 35",
          eyebrowOffset: -1,
          animation: "working"
        };
      case 'success':
        return {
          eyeOffset: 0,
          mouthPath: "M 15 30 Q 25 40 35 30",
          eyebrowOffset: 0,
          animation: "success"
        };
      case 'error':
        return {
          eyeOffset: 0,
          mouthPath: "M 20 40 Q 25 35 30 40",
          eyebrowOffset: -3,
          animation: "error"
        };
      default:
        return {
          eyeOffset: 0,
          mouthPath: "M 18 35 Q 25 38 32 35",
          eyebrowOffset: 0,
          animation: "idle"
        };
    }
  };

  const characterState = getCharacterState();

  return (
    <div className={`character-container ${className}`}>
      <svg
        width="160"
        height="160"
        viewBox="0 0 80 80"
        className={`character-svg ${characterState.animation}`}
      >
        {/* Body */}
        <ellipse
          cx="40"
          cy="55"
          rx="18"
          ry="12"
          fill="#f4e4bc"
          stroke="#d4c4a8"
          strokeWidth="1.5"
          className="character-body"
        />
        
        {/* Head */}
        <circle
          cx="40"
          cy="35"
          r="18"
          fill="#f4e4bc"
          stroke="#d4c4a8"
          strokeWidth="1.5"
          className="character-head"
        />
        
        {/* Hair */}
        <path
          d="M 25 20 Q 30 15 35 18 Q 40 12 45 18 Q 50 15 55 20 Q 55 25 50 28 Q 45 25 40 30 Q 35 25 30 28 Q 25 25 25 20"
          fill="#8b4513"
          className="character-hair"
        />
        
        {/* Eyebrows */}
        <path
          d="M 28 28 Q 32 26 36 28"
          stroke="#8b4513"
          strokeWidth="2"
          fill="none"
          transform={`translate(0, ${characterState.eyebrowOffset})`}
          className="character-eyebrow"
        />
        <path
          d="M 44 28 Q 48 26 52 28"
          stroke="#8b4513"
          strokeWidth="2"
          fill="none"
          transform={`translate(0, ${characterState.eyebrowOffset})`}
          className="character-eyebrow"
        />
        
        {/* Eyes */}
        <circle
          cx="32"
          cy="32"
          r="3"
          fill="#2c3e50"
          transform={`translate(${characterState.eyeOffset}, 0)`}
          className={blink ? "character-eye blink" : "character-eye"}
        />
        <circle
          cx="48"
          cy="32"
          r="3"
          fill="#2c3e50"
          transform={`translate(${characterState.eyeOffset}, 0)`}
          className={blink ? "character-eye blink" : "character-eye"}
        />
        
        {/* Eye highlights */}
        <circle
          cx="33"
          cy="31"
          r="1"
          fill="#ecf0f1"
          transform={`translate(${characterState.eyeOffset}, 0)`}
          className="character-highlight"
        />
        <circle
          cx="49"
          cy="31"
          r="1"
          fill="#ecf0f1"
          transform={`translate(${characterState.eyeOffset}, 0)`}
          className="character-highlight"
        />
        
        {/* Nose */}
        <ellipse
          cx="40"
          cy="36"
          rx="1.5"
          ry="2"
          fill="#d4c4a8"
          className="character-nose"
        />
        
        {/* Mouth */}
        <path
          d={characterState.mouthPath}
          stroke="#8b4513"
          strokeWidth="2"
          fill="none"
          className="character-mouth"
        />
        
        {/* Arms */}
        <ellipse
          cx="25"
          cy="50"
          rx="4"
          ry="12"
          fill="#f4e4bc"
          stroke="#d4c4a8"
          strokeWidth="1.5"
          transform="rotate(-20 25 50)"
          className="character-arm"
        />
        <ellipse
          cx="55"
          cy="50"
          rx="4"
          ry="12"
          fill="#f4e4bc"
          stroke="#d4c4a8"
          strokeWidth="1.5"
          transform="rotate(20 55 50)"
          className="character-arm"
        />
        
        {/* Hands */}
        <circle
          cx="22"
          cy="58"
          r="3"
          fill="#f4e4bc"
          stroke="#d4c4a8"
          strokeWidth="1.5"
          className="character-hand"
        />
        <circle
          cx="58"
          cy="58"
          r="3"
          fill="#f4e4bc"
          stroke="#d4c4a8"
          strokeWidth="1.5"
          className="character-hand"
        />
      </svg>
    </div>
  );
}
