import React from "react";

interface Logo3DProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const Logo3D: React.FC<Logo3DProps> = ({ size = 80, className = "", animate = true }) => {
  return (
    <div
      className={`inline-block select-none ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{ width: size, height: size, position: "relative" }}
    >
      <img 
        src="/logo.png" 
        alt="VibeMeet"
        style={{ 
          width: size, 
          height: size, 
          objectFit: "contain", 
          display: "block", 
          filter: `drop-shadow(0px 0px ${size * 0.05}px rgba(236,72,153,0.4)) drop-shadow(0px 0px ${size * 0.1}px rgba(59,130,246,0.3))`
        }} 
      />
    </div>
  );
};

export default Logo3D;
