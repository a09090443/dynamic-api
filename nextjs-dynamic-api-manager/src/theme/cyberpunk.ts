import { createTheme } from '@mui/material/styles';

export const cyberpunkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff', // 青色霓虹
      light: '#64ffff',
      dark: '#00b2b2',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff0080', // 紫紅霓虹
      light: '#ff5aaa',
      dark: '#c20055',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0a', // 深黑背景
      paper: '#1a1a1a', // 稍亮的卡片背景
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    success: {
      main: '#00ff41', // 綠色霓虹
    },
    warning: {
      main: '#ffaa00', // 橙色霓虹
    },
    error: {
      main: '#ff0040', // 紅色霓虹
    },
    info: {
      main: '#0080ff', // 藍色霓虹
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto Mono", "Courier New", monospace',
    h1: {
      fontWeight: 700,
      letterSpacing: '0.1em',
      textShadow: '0 0 10px #00ffff',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '0.1em',
      textShadow: '0 0 8px #00ffff',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '0.08em',
      textShadow: '0 0 6px #00ffff',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '0.05em',
      textShadow: '0 0 5px #00ffff',
    },
    body1: {
      fontFamily: '"Roboto Mono", monospace',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a1a 100%)',
          minHeight: '100vh',
        },
        // 自定義滾動條
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: '#1a1a1a',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(45deg, #00ffff, #ff0080)',
          borderRadius: '4px',
          boxShadow: '0 0 5px #00ffff',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          boxShadow: '0 0 10px #00ffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          border: '1px solid #00ffff',
          background: 'rgba(0, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(0, 255, 255, 0.2)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #00ffff, #0080ff)',
          border: 'none',
          '&:hover': {
            background: 'linear-gradient(45deg, #00b2b2, #0060b2)',
          },
        },
        outlined: {
          borderColor: '#00ffff',
          color: '#00ffff',
          '&:hover': {
            borderColor: '#64ffff',
            background: 'rgba(0, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 26, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 255, 255, 0.1)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 10, 10, 0.95)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 128, 0.1))',
          '& .MuiTableCell-head': {
            color: '#00ffff',
            fontWeight: 600,
            textShadow: '0 0 5px #00ffff',
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(0, 255, 255, 0.05)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
          color: '#ffffff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#00ffff',
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
            },
            '&.Mui-focused': {
              borderColor: '#00ffff',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
            },
            '& fieldset': {
              border: 'none',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b0b0b0',
            '&.Mui-focused': {
              color: '#00ffff',
              textShadow: '0 0 5px #00ffff',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#00ffff',
          transition: 'all 0.3s ease',
          '&:hover': {
            color: '#64ffff',
            transform: 'scale(1.1)',
            textShadow: '0 0 10px #00ffff',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase': {
            color: '#666666',
            '&.Mui-checked': {
              color: '#00ffff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#00ffff',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              },
            },
          },
          '& .MuiSwitch-track': {
            backgroundColor: '#333333',
            border: '1px solid #666666',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.2), rgba(0, 128, 255, 0.2))',
          border: '1px solid rgba(0, 255, 255, 0.5)',
          color: '#00ffff',
          fontWeight: 500,
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
          '&:hover': {
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          borderRight: '1px solid rgba(0, 255, 255, 0.3)',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)',
        },
      },
    },
  },
});