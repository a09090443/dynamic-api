'use client';

import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { useEffect, useState } from 'react';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg) }
  33% { transform: translateY(-10px) rotate(1deg) }
  66% { transform: translateY(5px) rotate(-1deg) }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3 }
  50% { opacity: 0.8 }
`;

const scanning = keyframes`
  0% { transform: translateY(-100%) }
  100% { transform: translateY(100vh) }
`;

// 預定義的固定圖形數據，避免 hydration 問題
const STATIC_SHAPES = [
  { width: 45, height: 32, left: 12, top: 8, isCircle: true, duration: 4.2, delay: 0.3 },
  { width: 38, height: 56, left: 23, top: 15, isCircle: false, duration: 5.8, delay: 1.1 },
  { width: 62, height: 41, left: 67, top: 22, isCircle: true, duration: 3.7, delay: 0.8 },
  { width: 33, height: 48, left: 89, top: 35, isCircle: false, duration: 6.2, delay: 1.9 },
  { width: 51, height: 29, left: 45, top: 72, isCircle: true, duration: 4.5, delay: 0.5 },
  { width: 42, height: 55, left: 78, top: 58, isCircle: false, duration: 5.1, delay: 1.4 },
  { width: 36, height: 44, left: 15, top: 83, isCircle: true, duration: 3.9, delay: 2.1 },
  { width: 58, height: 31, left: 92, top: 12, isCircle: false, duration: 4.8, delay: 0.7 },
  { width: 47, height: 39, left: 56, top: 45, isCircle: true, duration: 5.5, delay: 1.6 },
  { width: 34, height: 52, left: 73, top: 78, isCircle: false, duration: 4.1, delay: 0.9 },
  { width: 49, height: 37, left: 28, top: 62, isCircle: true, duration: 6.0, delay: 1.3 },
  { width: 41, height: 46, left: 84, top: 89, isCircle: false, duration: 3.6, delay: 2.2 },
  { width: 53, height: 35, left: 19, top: 34, isCircle: true, duration: 5.3, delay: 0.4 },
  { width: 39, height: 57, left: 91, top: 51, isCircle: false, duration: 4.7, delay: 1.8 },
  { width: 46, height: 43, left: 61, top: 19, isCircle: true, duration: 5.9, delay: 1.0 },
  { width: 37, height: 50, left: 37, top: 91, isCircle: false, duration: 4.3, delay: 1.7 },
  { width: 55, height: 33, left: 76, top: 67, isCircle: true, duration: 3.8, delay: 0.6 },
  { width: 43, height: 48, left: 52, top: 28, isCircle: false, duration: 5.7, delay: 2.0 },
  { width: 50, height: 40, left: 25, top: 74, isCircle: true, duration: 4.4, delay: 1.2 },
  { width: 35, height: 54, left: 87, top: 43, isCircle: false, duration: 5.2, delay: 1.5 },
];

const CyberpunkBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 只在客戶端掛載後才渲染動態元素
  if (!mounted) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden',
        }}
      >
        {/* 網格背景 - 靜態，不會導致 hydration 問題 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.3,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {/* 網格背景 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />
      
      {/* 浮動的幾何圖形 - 使用預定義數據 */}
      {STATIC_SHAPES.map((shape, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: shape.width,
            height: shape.height,
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: shape.isCircle ? '50%' : '0',
            animation: `${float} ${shape.duration}s ease-in-out infinite ${shape.delay}s, ${pulse} ${shape.duration - 1}s ease-in-out infinite`,
            background: `rgba(0, 255, 255, ${0.05 + (i % 3) * 0.02})`,
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
          }}
        />
      ))}
      
      {/* 掃描線 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
          animation: `${scanning} 8s linear infinite`,
          boxShadow: '0 0 20px #00ffff',
        }}
      />
    </Box>
  );
};

export default CyberpunkBackground;