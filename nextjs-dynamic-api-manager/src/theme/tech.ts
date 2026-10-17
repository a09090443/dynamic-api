import { createTheme } from '@mui/material/styles';

export const techTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e676',
      light: '#5efc82',
      dark: '#00b248',
      contrastText: '#000000',
    },
    secondary: {
      main: '#00bcd4',
      light: '#62efff',
      dark: '#008ba3',
      contrastText: '#000000',
    },
    error: {
      main: '#ff5722',
      light: '#ff8a50',
      dark: '#c41c00',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff6d00',
      light: '#ff9d3f',
      dark: '#c43e00',
      contrastText: '#000000',
    },
    info: {
      main: '#03a9f4',
      light: '#67daff',
      dark: '#007ac1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23',
      contrastText: '#000000',
    },
    background: {
      default: '#0a0a0a',
      paper: 'rgba(30, 30, 30, 0.9)',
    },
    text: {
      primary: '#ededed',
      secondary: 'rgba(237, 237, 237, 0.7)',
    },
    divider: 'rgba(0, 230, 118, 0.2)',
  },
  typography: {
    fontFamily: '"Roboto Mono", "Monaco", "Courier New", monospace',
    h1: {
      fontWeight: 700,
      textShadow: '0 0 10px rgba(0, 230, 118, 0.3)',
    },
    h2: {
      fontWeight: 600,
      textShadow: '0 0 8px rgba(0, 230, 118, 0.3)',
    },
    h3: {
      fontWeight: 600,
      textShadow: '0 0 6px rgba(0, 230, 118, 0.3)',
    },
    h4: {
      fontWeight: 600,
      textShadow: '0 0 4px rgba(0, 230, 118, 0.3)',
    },
    h5: {
      fontWeight: 500,
      textShadow: '0 0 2px rgba(0, 230, 118, 0.3)',
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
      letterSpacing: '1px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          border: '1px solid rgba(0, 230, 118, 0.3)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #00e676, #00bcd4)',
          color: '#000000',
          '&:hover': {
            background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 230, 118, 0.5)',
          color: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.05)',
          '&:hover': {
            borderColor: '#00e676',
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
        elevation8: {
          boxShadow: '0 0 20px rgba(0, 230, 118, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.1), rgba(0, 188, 212, 0.1))',
          '& .MuiTableCell-head': {
            color: '#00e676',
            fontWeight: 600,
            textShadow: '0 0 5px rgba(0, 230, 118, 0.3)',
            borderBottom: '2px solid rgba(0, 230, 118, 0.3)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            background: 'rgba(0, 230, 118, 0.05)',
            boxShadow: 'inset 0 0 10px rgba(0, 230, 118, 0.1)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 230, 118, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            '& fieldset': {
              borderColor: 'rgba(0, 230, 118, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 230, 118, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00e676',
              boxShadow: '0 0 10px rgba(0, 230, 118, 0.3)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(237, 237, 237, 0.7)',
            '&.Mui-focused': {
              color: '#00e676',
            },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '& .MuiSwitch-thumb': {
            backgroundColor: '#00e676',
            boxShadow: '0 0 10px rgba(0, 230, 118, 0.5)',
          },
          '&.Mui-checked': {
            '& .MuiSwitch-track': {
              backgroundColor: 'rgba(0, 230, 118, 0.3)',
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: '#00e676',
              boxShadow: '0 0 15px rgba(0, 230, 118, 0.8)',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 230, 118, 0.7)',
          '&.Mui-checked': {
            color: '#00e676',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            transform: 'scale(1.1)',
            boxShadow: '0 0 10px rgba(0, 230, 118, 0.3)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(0, 230, 118, 0.3)',
          boxShadow: '0 0 30px rgba(0, 230, 118, 0.2)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.1), rgba(0, 188, 212, 0.1))',
          color: '#00e676',
          textShadow: '0 0 8px rgba(0, 230, 118, 0.3)',
          borderBottom: '1px solid rgba(0, 230, 118, 0.3)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 230, 118, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 230, 118, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00e676',
            boxShadow: '0 0 10px rgba(0, 230, 118, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          color: '#00e676',
          border: '1px solid rgba(0, 230, 118, 0.3)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid',
        },
        standardError: {
          backgroundColor: 'rgba(255, 87, 34, 0.1)',
          borderColor: 'rgba(255, 87, 34, 0.5)',
          color: '#ff5722',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 109, 0, 0.1)',
          borderColor: 'rgba(255, 109, 0, 0.5)',
          color: '#ff6d00',
        },
        standardInfo: {
          backgroundColor: 'rgba(3, 169, 244, 0.1)',
          borderColor: 'rgba(3, 169, 244, 0.5)',
          color: '#03a9f4',
        },
        standardSuccess: {
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          borderColor: 'rgba(0, 230, 118, 0.5)',
          color: '#00e676',
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
});