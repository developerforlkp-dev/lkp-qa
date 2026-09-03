import React from 'react';

const TravelJourneyIllustration = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.5
    }}>
      <svg 
        viewBox="0 0 1440 1024" 
        style={{ width: '100%', minWidth: '1440px', height: '100%' }}
        preserveAspectRatio="xMidYMid slice"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Continuous sprawling route lines */}
        <path 
          d="M -50 140 Q 150 50, 300 200 T 700 150 T 1100 250 T 1500 100" 
          stroke="#0097B2" strokeWidth="1.5" strokeDasharray="4 6"
        />
        <path 
          d="M 1500 350 Q 1200 450, 900 350 T 300 400 T -50 300" 
          stroke="#0097B2" strokeWidth="1.5" strokeDasharray="4 6"
        />
        <path 
          d="M -50 550 Q 200 650, 500 550 T 1000 600 T 1500 500" 
          stroke="#0097B2" strokeWidth="1.5" strokeDasharray="4 6"
        />
        <path 
          d="M 1500 800 Q 1100 700, 750 850 T 200 750 T -50 900" 
          stroke="#0097B2" strokeWidth="1.5" strokeDasharray="4 6"
        />

        {/* --- ROW 1 (Top) --- */}
        {/* Mountains & Airplane */}
        <g transform="translate(100, 80)">
          <path d="M 0 50 L 30 0 L 50 30 L 70 10 L 100 50 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M 30 0 L 30 15 M 70 10 L 70 25 M 20 20 L 40 20 M 60 25 L 80 25" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round"/>
          <g transform="translate(120, -30) rotate(15)">
            <path d="M 10 25 L 45 25 C 50 25, 55 22, 55 18 C 55 14, 50 11, 45 11 L 35 11 L 20 -5 L 10 -5 L 20 11 L 5 11 L 0 5 L -5 5 L 0 18 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          </g>
        </g>
        
        {/* Hot Air Balloon */}
        <g transform="translate(450, 50)">
          <path d="M 50 10 C 65 10, 75 25, 75 40 C 75 60, 50 75, 50 75 C 50 75, 25 60, 25 40 C 25 25, 35 10, 50 10 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 40 85 L 60 85 L 55 100 L 45 100 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 50 75 L 45 85 M 50 75 L 55 85" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="50" cy="90" r="4" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* Hotel/Resort */}
        <g transform="translate(750, 20)">
          <path d="M 0 100 L 140 100 L 140 30 L 110 30 L 110 0 L 30 0 L 30 30 L 0 30 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 55 100 L 55 70 L 85 70 L 85 100" stroke="#0097B2" strokeWidth="1.5"/>
          <rect x="45" y="15" width="50" height="40" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 15 45 L 25 45 L 25 55 L 15 55 Z M 115 45 L 125 45 L 125 55 L 115 55 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 15 70 L 25 70 L 25 80 L 15 80 Z M 115 70 L 125 70 L 125 80 L 115 80 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 150 40 C 150 30, 170 30, 180 20 C 195 10, 210 30, 200 40 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* Beach / Palm Trees */}
        <g transform="translate(1200, 80)">
          <path d="M 30 80 C 40 50, 30 20, 30 20 M 60 80 C 50 50, 60 30, 60 30" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 30 20 C 15 15, 0 30, 0 30 M 30 20 C 40 5, 55 15, 55 15 M 30 20 C 20 0, 5 10, 5 10" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 60 30 C 45 25, 35 40, 35 40 M 60 30 C 70 15, 85 25, 85 25 M 60 30 C 50 10, 35 20, 35 20" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M -10 80 L 100 80" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* --- ROW 2 (Upper Middle) --- */}
        {/* Camera */}
        <g transform="translate(200, 300)">
          <path d="M 0 15 L 15 15 L 20 5 L 40 5 L 45 15 L 60 15 L 60 50 L 0 50 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="30" cy="32" r="12" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="48" cy="22" r="3" fill="#0097B2"/>
        </g>

        {/* Ticket / Event */}
        <g transform="translate(600, 340)">
          <path d="M 0 15 L 60 15 L 60 55 L 0 55 Z M 20 15 C 20 22, 40 22, 40 15 M 20 55 C 20 48, 40 48, 40 55 M 15 35 L 45 35" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="10" cy="35" r="2" fill="#0097B2" />
          <circle cx="50" cy="35" r="2" fill="#0097B2" />
        </g>

        {/* Tent / Camping (Stay/Place) */}
        <g transform="translate(1000, 280)">
          <path d="M 40 0 L 80 60 L 0 60 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M 40 0 L 40 60 M 20 60 L 40 30 L 60 60" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 60 20 L 70 10 M 75 15 L 85 5" stroke="#0097B2" strokeWidth="1.5"/>
        </g>
        
        {/* Signpost */}
        <g transform="translate(1300, 360)">
          <path d="M 20 80 L 20 0 M 0 15 L 35 15 L 45 25 L 35 35 L 0 35 Z M 5 45 L 40 45 L 50 55 L 40 65 L 5 65 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
        </g>

        {/* --- ROW 3 (Lower Middle) --- */}
        {/* Compass (Experience) */}
        <g transform="translate(150, 520)">
          <circle cx="40" cy="40" r="35" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="40" cy="40" r="25" stroke="#0097B2" strokeWidth="1.5" strokeDasharray="2 4"/>
          <path d="M 40 15 L 48 40 L 40 65 L 32 40 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 40 15 L 40 65" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* Restaurant/Food Cloche & Drinks */}
        <g transform="translate(500, 500)">
          <path d="M 0 50 L 90 50" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 10 50 C 10 25, 25 15, 45 15 C 65 15, 80 25, 80 50" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="45" cy="10" r="5" stroke="#0097B2" strokeWidth="1.5"/>
          {/* Wine Glass */}
          <path d="M 100 15 L 120 15 L 120 30 C 120 40, 100 40, 100 30 Z M 110 38 L 110 50 M 100 50 L 120 50" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
        </g>

        {/* Map & Pin */}
        <g transform="translate(900, 550)">
          <path d="M 0 20 L 30 0 L 60 20 L 90 0 L 90 60 L 60 80 L 30 60 L 0 80 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M 30 0 L 30 60 M 60 20 L 60 80" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 45 30 C 45 30, 60 15, 60 5 C 60 -5, 50 -15, 45 -15 C 40 -15, 30 -5, 30 5 C 30 15, 45 30, 45 30 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="45" cy="0" r="4" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* Suitcase (Travel) */}
        <g transform="translate(1250, 520)">
          <path d="M 10 20 L 70 20 L 70 70 L 10 70 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M 25 20 L 25 10 L 55 10 L 55 20 M 20 20 L 20 70 M 60 20 L 60 70" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="15" cy="75" r="4" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="65" cy="75" r="4" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* --- ROW 4 (Bottom) --- */}
        {/* Bonfire (Experience) */}
        <g transform="translate(300, 750)">
          <path d="M 10 50 L 50 30 M 10 30 L 50 50" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M 30 35 C 10 35, 20 10, 30 0 C 40 10, 50 35, 30 35 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 25 35 C 20 30, 25 20, 30 15 C 35 20, 40 30, 25 35 Z" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* Passport & Tickets */}
        <g transform="translate(650, 800)">
          <path d="M 10 10 L 50 10 L 50 70 L 10 70 Z" stroke="#0097B2" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="30" cy="35" r="10" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 20 55 L 40 55 M 25 60 L 35 60" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 45 20 L 65 20 L 65 50 L 50 50" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* Coffee/Cafe (Food) */}
        <g transform="translate(1050, 780)">
          <path d="M 10 30 L 50 30 C 50 60, 10 60, 10 30 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 50 35 C 65 35, 65 50, 45 50" stroke="#0097B2" strokeWidth="1.5"/>
          <path d="M 0 55 L 60 55" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M 20 15 C 20 5, 25 10, 25 0 M 35 15 C 35 5, 40 10, 40 0" stroke="#0097B2" strokeWidth="1.5"/>
        </g>

        {/* Floating Location Pins */}
        <g transform="translate(100, 700)">
          <path d="M 15 30 C 15 30, 30 18, 30 9 C 30 3, 24 -3, 15 -3 C 6 -3, 0 3, 0 9 C 0 18, 15 30, 15 30 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="15" cy="9" r="4" stroke="#0097B2" strokeWidth="1.5"/>
        </g>
        <g transform="translate(1350, 850)">
          <path d="M 15 30 C 15 30, 30 18, 30 9 C 30 3, 24 -3, 15 -3 C 6 -3, 0 3, 0 9 C 0 18, 15 30, 15 30 Z" stroke="#0097B2" strokeWidth="1.5"/>
          <circle cx="15" cy="9" r="4" stroke="#0097B2" strokeWidth="1.5"/>
        </g>
      </svg>
    </div>
  );
};

export default TravelJourneyIllustration;
