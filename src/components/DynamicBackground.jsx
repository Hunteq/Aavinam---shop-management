import React from 'react';

const DynamicBackground = () => {
  return (
    <div className="dynamic-bg-wrapper">
      {/* Animated Gradient Base */}
      <div className="gradient-base"></div>

      {/* Floating Particles */}
      <div className="particles-container">
        {/* Milk Bottles */}
        <div className="particle bottle milk-bottle-1">
          <svg width="40" height="60" viewBox="0 0 40 60">
            <path d="M12 5h16v8l4 4v38H8V17l4-4V5z" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
            <path d="M14 6h12v6h-12z" fill="#3b82f6" opacity="0.3" />
            <path d="M10 20h20v4H10z" fill="#3b82f6" opacity="0.1" />
          </svg>
        </div>
        <div className="particle bottle milk-bottle-2">
          <svg width="30" height="45" viewBox="0 0 40 60">
            <path d="M12 5h16v8l4 4v38H8V17l4-4V5z" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="20" cy="35" r="5" fill="#3b82f6" opacity="0.2" />
          </svg>
        </div>

        {/* Juice Bottles */}
        <div className="particle bottle juice-bottle-1">
          <svg width="35" height="55" viewBox="0 0 40 60">
            <path d="M12 5h16v8l4 4v38H8V17l4-4V5z" fill="#fbbf24" opacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M8 25h24v20H8z" fill="#f59e0b" opacity="0.4" />
          </svg>
        </div>

        {/* Milk Drops */}
        {[...Array(5)].map((_, i) => (
          <div key={`drop-${i}`} className={`particle drop drop-${i + 1}`}>
            <svg width="20" height="25" viewBox="0 0 20 25">
              <path d="M10 2C10 2 4 10 4 15C4 18.3 6.7 21 10 21C13.3 21 16 18.3 16 15C16 10 10 2 10 2Z" fill="white" stroke="#3b82f6" strokeWidth="1" />
            </svg>
          </div>
        ))}

        {/* Fruit Slices */}
        <div className="particle fruit orange-slice">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#fb923c" opacity="0.6" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="5 2" />
            {[...Array(8)].map((_, i) => (
              <line key={i} x1="20" y1="20" x2={20 + 15 * Math.cos(i * Math.PI / 4)} y2={20 + 15 * Math.sin(i * Math.PI / 4)} stroke="white" strokeWidth="1.5" />
            ))}
          </svg>
        </div>

        <div className="particle fruit lemon-slice">
          <svg width="35" height="35" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#facc15" opacity="0.6" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 2" />
            {[...Array(6)].map((_, i) => (
              <line key={i} x1="20" y1="20" x2={20 + 15 * Math.cos(i * Math.PI / 3)} y2={20 + 15 * Math.sin(i * Math.PI / 3)} stroke="white" strokeWidth="1.5" />
            ))}
          </svg>
        </div>

        <div className="particle fruit strawberry-slice">
          <svg width="30" height="35" viewBox="0 0 40 40">
            <path d="M20 5C10 5 5 15 5 25C5 33 12 38 20 38C28 38 35 33 35 25C35 15 30 5 20 5Z" fill="#f43f5e" opacity="0.6" />
            <circle cx="15" cy="15" r="1.5" fill="white" />
            <circle cx="25" cy="18" r="1.5" fill="white" />
            <circle cx="20" cy="25" r="1.5" fill="white" />
            <circle cx="12" cy="28" r="1.5" fill="white" />
            <circle cx="28" cy="30" r="1.5" fill="white" />
            <path d="M15 8C17 12 23 12 25 8" stroke="#15803d" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* Water Bubbles */}

        {[...Array(6)].map((_, i) => (
          <div key={`bubble-${i}`} className={`particle bubble bubble-${i + 1}`}>
            <svg width="25" height="25" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="12" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
              <circle cx="10" cy="10" r="3" fill="white" opacity="0.8" />
            </svg>
          </div>
        ))}

        {/* Leaves */}
        <div className="particle leaf leaf-1">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 2 8.5a7 7 0 0 1-10 9.5Z" />
            <path d="M11 20c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3Z" opacity="0.3" fill="#22c55e" />
          </svg>
        </div>
      </div>

      {/* Wave Section at the Bottom */}
      <div className="waves-container">
        <svg className="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className="parallax-waves">
            <use href="#gentle-wave" x="48" y="0" fill="rgba(37, 99, 235, 0.05)" />
            <use href="#gentle-wave" x="48" y="3" fill="rgba(37, 99, 235, 0.1)" />
            <use href="#gentle-wave" x="48" y="5" fill="rgba(255, 255, 255, 0.3)" />
            <use href="#gentle-wave" x="48" y="7" fill="rgba(255, 255, 255, 0.5)" />
          </g>
        </svg>
      </div>

      <style>{`
        .dynamic-bg-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
          background: #ffffff;
        }

        .gradient-base {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #fde68a 100%);
          opacity: 0.4;
          animation: gradientShift 15s ease infinite alternate;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .particles-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .particle {
          position: absolute;
          filter: blur(0.5px);
          opacity: 0;
          animation: floatParticle 10s infinite ease-in-out;
        }

        @keyframes floatParticle {
          0% {
            transform: translateY(110vh) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-20vh) rotate(360deg) translateX(50px);
            opacity: 0;
          }
        }

        /* Particle Variations */
        .milk-bottle-1 { left: 10%; animation-duration: 25s; animation-delay: 0s; }
        .milk-bottle-2 { left: 85%; animation-duration: 30s; animation-delay: 5s; }
        .juice-bottle-1 { left: 45%; animation-duration: 28s; animation-delay: 12s; }
        
        .drop-1 { left: 20%; animation-duration: 18s; animation-delay: 2s; }
        .drop-2 { left: 70%; animation-duration: 22s; animation-delay: 8s; }
        .drop-3 { left: 40%; animation-duration: 20s; animation-delay: 15s; }
        .drop-4 { left: 15%; animation-duration: 24s; animation-delay: 4s; }
        .drop-5 { left: 90%; animation-duration: 19s; animation-delay: 1s; }

        .bubble-1 { left: 5%; animation-duration: 15s; animation-delay: 0s; }
        .bubble-2 { left: 35%; animation-duration: 12s; animation-delay: 6s; }
        .bubble-3 { left: 65%; animation-duration: 14s; animation-delay: 3s; }
        .bubble-4 { left: 55%; animation-duration: 16s; animation-delay: 9s; }
        .bubble-5 { left: 95%; animation-duration: 13s; animation-delay: 11s; }
        .bubble-6 { left: 25%; animation-duration: 17s; animation-delay: 5s; }

        .orange-slice { left: 75%; animation-duration: 35s; animation-delay: 2s; }
        .lemon-slice { left: 15%; animation-duration: 32s; animation-delay: 10s; }
        .strawberry-slice { left: 30%; animation-duration: 38s; animation-delay: 6s; }
        .leaf-1 { left: 50%; animation-duration: 26s; animation-delay: 7s; }


        /* Bouncing/Rotation Overrides */
        .fruit {
          animation-name: floatAndRotate !important;
        }

        @keyframes floatAndRotate {
          0% {
            transform: translateY(110vh) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.4; }
          100% {
            transform: translateY(-20vh) rotate(720deg);
            opacity: 0;
          }
        }

        .bottle {
          animation-name: floatAndSway !important;
        }

        @keyframes floatAndSway {
          0% {
            transform: translateY(110vh) rotate(-5deg);
            opacity: 0;
          }
          10% { opacity: 0.5; }
          50% { transform: translateY(45vh) rotate(5deg) translateX(20px); }
          100% {
            transform: translateY(-20vh) rotate(-5deg) translateX(-20px);
            opacity: 0;
          }
        }

        /* Waves Animation */
        .waves-container {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 15vh;
          min-height: 100px;
          max-height: 150px;
        }

        .waves {
          position: relative;
          width: 100%;
          height: 15vh;
          margin-bottom: -7px; /* Fix for safari gap */
          min-height: 100px;
          max-height: 150px;
        }

        .parallax-waves > use {
          animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
        }
        .parallax-waves > use:nth-child(1) {
          animation-delay: -2s;
          animation-duration: 7s;
        }
        .parallax-waves > use:nth-child(2) {
          animation-delay: -3s;
          animation-duration: 10s;
        }
        .parallax-waves > use:nth-child(3) {
          animation-delay: -4s;
          animation-duration: 13s;
        }
        .parallax-waves > use:nth-child(4) {
          animation-delay: -5s;
          animation-duration: 20s;
        }

        @keyframes move-forever {
          0% {
           transform: translate3d(-90px,0,0);
          }
          100% { 
            transform: translate3d(85px,0,0);
          }
        }

        /* Glassmorphism support classes */
        .glass-bg {
          background: rgba(255, 255, 255, 0.4) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        @media (max-width: 768px) {
          .waves-container {
            height: 10vh;
          }
          .particle {
            transform: scale(0.7);
          }
        }
      `}</style>
    </div>
  );
};

export default DynamicBackground;
