'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import { Menu as MenuIcon, ExpandMore } from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { keyframes } from '@mui/system';

const glitch = keyframes`
  0%, 100% { transform: translate(0) }
  20% { transform: translate(-1px, 1px) }
  40% { transform: translate(-1px, -1px) }
  60% { transform: translate(1px, 1px) }
  80% { transform: translate(1px, -1px) }
`;

const neonPulse = keyframes`
  0%, 100% { 
    text-shadow: 
      0 0 5px #00ffff,
      0 0 10px #00ffff,
      0 0 15px #00ffff;
  }
  50% { 
    text-shadow: 
      0 0 2px #00ffff,
      0 0 5px #00ffff,
      0 0 8px #00ffff;
  }
`;

const Header: React.FC = () => {
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/endpoint':
        return 'ENDPOINT CONTROL';
      case '/response':
        return 'RESPONSE MATRIX';
      case '/restful':
        return 'RESTFUL PROTOCOL';
      default:
        return 'DYNAMIC API SYSTEM';
    }
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        mb: 3,
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(0, 255, 255, 0.5)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
      }}
    >
      <Toolbar>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontFamily: '"Orbitron", monospace',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#00ffff',
            animation: `${neonPulse} 3s ease-in-out infinite`,
            '&:hover': {
              animation: `${glitch} 0.5s ease-in-out, ${neonPulse} 3s ease-in-out infinite`,
            }
          }}
        >
          {getPageTitle()}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            color="inherit"
            onClick={handleMenuOpen}
            endIcon={<ExpandMore />}
            startIcon={<MenuIcon />}
            sx={{
              color: '#00ffff',
              border: '1px solid rgba(0, 255, 255, 0.5)',
              background: 'rgba(0, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              fontFamily: '"Orbitron", monospace',
              fontWeight: 600,
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(0, 255, 255, 0.2)',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            MENU
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPaper-root': {
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 255, 255, 0.2)',
              },
            }}
          >
            <MenuItem 
              onClick={handleMenuClose}
              sx={{
                color: '#00ffff',
                fontFamily: '"Roboto Mono", monospace',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(0, 255, 255, 0.1)',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                },
              }}
            >
              <Link href="/endpoint" style={{ textDecoration: 'none', color: 'inherit' }}>
                ◆ ENDPOINT CONTROL
              </Link>
            </MenuItem>
            <MenuItem 
              onClick={handleMenuClose}
              sx={{
                color: '#00ffff',
                fontFamily: '"Roboto Mono", monospace',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(0, 255, 255, 0.1)',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                },
              }}
            >
              <Link href="/restful" style={{ textDecoration: 'none', color: 'inherit' }}>
                ◆ RESTFUL PROTOCOL
              </Link>
            </MenuItem>
            <MenuItem 
              onClick={handleMenuClose}
              sx={{
                color: '#888888',
                fontFamily: '"Roboto Mono", monospace',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(136, 136, 136, 0.1)',
                },
              }}
            >
              <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
                ◇ SYSTEM INFO
              </Link>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;