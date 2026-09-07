import React from 'react';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, SearchX, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../components/JUI/Theme';

const StayNotFound = () => {
  const { tokens: { BG, FG, S, M, W, B, AL } } = useTheme();
  const history = useHistory();

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      color: FG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, sans-serif'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: S,
          border: `1px solid ${B}`,
          borderRadius: 24,
          padding: 48,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 32px 64px rgba(0,0,0,0.06)'
        }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
          style={{
            width: 96,
            height: 96,
            background: AL,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px auto'
          }}
        >
          <SearchX size={48} color="#0097B2" />
        </motion.div>
        
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: FG }}>Stay Not Found</h1>
        <p style={{ fontSize: 16, color: M, lineHeight: 1.6, marginBottom: 32 }}>
          We couldn't find the stay you're looking for. It might have been removed, or the link is incorrect.
        </p>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={() => history.goBack()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 12,
              border: `1px solid ${B}`,
              background: 'transparent',
              color: FG,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = S}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <button
            onClick={() => history.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#0097B2',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 151, 178, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Home size={18} />
            Go to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StayNotFound;
