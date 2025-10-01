'use client';

import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const glitch = keyframes`
  0%, 100% { transform: translate(0) }
  20% { transform: translate(-2px, 2px) }
  40% { transform: translate(-2px, -2px) }
  60% { transform: translate(2px, 2px) }
  80% { transform: translate(2px, -2px) }
`;

const neonGlow = keyframes`
  0%, 100% { 
    text-shadow: 
      0 0 5px #00ffff,
      0 0 10px #00ffff,
      0 0 15px #00ffff,
      0 0 20px #00ffff;
  }
  50% { 
    text-shadow: 
      0 0 2px #00ffff,
      0 0 5px #00ffff,
      0 0 8px #00ffff,
      0 0 12px #00ffff;
  }
`;

const scanning = keyframes`
  0% { transform: translateY(-100%) }
  100% { transform: translateY(100vh) }
`;

const CyberpunkLoader = ({ loading }: { loading: boolean }) => {
  if (!loading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* 掃描線效果 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
          animation: `${scanning} 2s ease-in-out infinite`,
          boxShadow: '0 0 20px #00ffff',
        }}
      />
      
      <Box textAlign="center">
        <Typography
          variant="h4"
          sx={{
            color: '#00ffff',
            fontFamily: '"Orbitron", monospace',
            fontWeight: 700,
            letterSpacing: '0.1em',
            animation: `${neonGlow} 2s ease-in-out infinite, ${glitch} 3s ease-in-out infinite`,
            mb: 2,
          }}
        >
          LOADING...
        </Typography>
        
        {/* Loading 條 */}
        <Box
          sx={{
            width: '200px',
            height: '4px',
            background: 'rgba(0, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: '50px',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
              position: 'absolute',
              animation: `${scanning} 1.5s ease-in-out infinite`,
              boxShadow: '0 0 10px #00ffff',
            }}
          />
        </Box>
        
        <Typography
          variant="body2"
          sx={{
            color: '#b0b0b0',
            fontFamily: '"Roboto Mono", monospace',
            mt: 2,
            letterSpacing: '0.05em',
          }}
        >
          INITIALIZING SYSTEM...
        </Typography>
      </Box>
    </Box>
  );
};

export default CyberpunkLoader;