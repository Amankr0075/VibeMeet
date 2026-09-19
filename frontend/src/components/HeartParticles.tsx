import React from 'react';
import './HeartParticles.css';

const HeartParticles: React.FC = () => {
  const hearts = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="heart-particles">
      {hearts.map(i => (
        <span key={i} className="heart" style={{ animationDelay: `${Math.random() * 5}s` }} />
      ))}
    </div>
  );
};

export default HeartParticles;
