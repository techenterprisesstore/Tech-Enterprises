import { createTheme } from '@mui/material/styles';

// Material You / Minimal font
const fontStack = [
  '-apple-system',
  'BlinkMacSystemFont',
  'system-ui',
  'Roboto',
  '"Segoe UI"',
  'Arial',
  'sans-serif'
].join(',');

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e4bf7',
      light: '#5a6ff9',
      dark: '#1e35c4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#34C759',
      light: '#5CD87A',
      dark: '#28A745',
    },
    error: {
      main: '#FF3B30',
    },
    success: {
      main: '#34C759',
    },
    warning: {
      main: '#FF9500',
    },
    background: {
      default: '#FAFAF9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6C757D',
    },
    divider: '#E9ECEF',
  },
  typography: {
    fontFamily: fontStack,
    h1: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: 0,
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: 0,
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: 0,
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.9375rem',
      letterSpacing: 0,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
      fontSize: '0.9375rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.04)',
    '0 2px 8px rgba(0,0,0,0.06)',
    '0 4px 12px rgba(0,0,0,0.06)',
    '0 6px 16px rgba(0,0,0,0.08)',
    '0 8px 24px rgba(0,0,0,0.08)',
    '0 12px 32px rgba(0,0,0,0.08)',
    '0 16px 40px rgba(0,0,0,0.08)',
    '0 20px 48px rgba(0,0,0,0.08)',
    '0 24px 56px rgba(0,0,0,0.08)',
    '0 28px 64px rgba(0,0,0,0.08)',
    '0 32px 72px rgba(0,0,0,0.08)',
    '0 36px 80px rgba(0,0,0,0.08)',
    '0 40px 88px rgba(0,0,0,0.08)',
    '0 44px 96px rgba(0,0,0,0.08)',
    '0 48px 104px rgba(0,0,0,0.08)',
    '0 52px 112px rgba(0,0,0,0.08)',
    '0 56px 120px rgba(0,0,0,0.08)',
    '0 60px 128px rgba(0,0,0,0.08)',
    '0 64px 136px rgba(0,0,0,0.08)',
    '0 68px 144px rgba(0,0,0,0.08)',
    '0 72px 152px rgba(0,0,0,0.08)',
    '0 76px 160px rgba(0,0,0,0.08)',
    '0 80px 168px rgba(0,0,0,0.08)',
    '0 84px 176px rgba(0,0,0,0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#F8F9FA',
            '& fieldset': {
              borderColor: '#E9ECEF',
            },
            '&:hover fieldset': {
              borderColor: '#DEE2E6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2e4bf7',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.875rem',
          boxShadow: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;
