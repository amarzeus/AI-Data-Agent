import { createTheme, ThemeOptions } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    neumorphic: {
      light: string
      dark: string
      shadow: string
      highlight: string
    }
    gradients: {
      primary: string
      secondary: string
      accent: string
    }
  }
  interface PaletteOptions {
    neumorphic?: {
      light?: string
      dark?: string
      shadow?: string
      highlight?: string
    }
    gradients?: {
      primary?: string
      secondary?: string
      accent?: string
    }
  }
}

const neumorphicColors = {
  light: '#f0f0f3',
  dark: '#d1d9e6',
  shadow: 'rgba(163, 177, 198, 0.6)',
  highlight: 'rgba(255, 255, 255, 0.8)'
}

const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
}

export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',
      light: '#8b5cf6',
      dark: '#4f46e5'
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b'
    },
    neumorphic: neumorphicColors,
    gradients
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em'
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6
    }
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#bfbfbf #f0f0f3',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#f0f0f3',
            width: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#bfbfbf',
            minHeight: 24
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#a8a8a8'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: `6px 6px 12px ${neumorphicColors.shadow}, -6px -6px 12px ${neumorphicColors.highlight}`,
          borderRadius: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        elevation1: {
          boxShadow: `3px 3px 6px ${neumorphicColors.shadow}, -3px -3px 6px ${neumorphicColors.highlight}`
        },
        elevation2: {
          boxShadow: `4px 4px 8px ${neumorphicColors.shadow}, -4px -4px 8px ${neumorphicColors.highlight}`
        },
        elevation3: {
          boxShadow: `5px 5px 10px ${neumorphicColors.shadow}, -5px -5px 10px ${neumorphicColors.highlight}`
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: `3px 3px 6px ${neumorphicColors.shadow}, -3px -3px 6px ${neumorphicColors.highlight}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `2px 2px 4px ${neumorphicColors.shadow}, -2px -2px 4px ${neumorphicColors.highlight}`,
            transform: 'translateY(-1px)'
          },
          '&:active': {
            boxShadow: `inset 2px 2px 4px ${neumorphicColors.shadow}, inset -2px -2px 4px ${neumorphicColors.highlight}`,
            transform: 'translateY(0px)'
          }
        },
        contained: {
          background: gradients.primary,
          color: '#ffffff',
          boxShadow: `4px 4px 8px ${neumorphicColors.shadow}, -4px -4px 8px ${neumorphicColors.highlight}`,
          '&:hover': {
            background: gradients.primary,
            boxShadow: `3px 3px 6px ${neumorphicColors.shadow}, -3px -3px 6px ${neumorphicColors.highlight}`
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: neumorphicColors.light,
            boxShadow: `inset 3px 3px 6px ${neumorphicColors.shadow}, inset -3px -3px 6px ${neumorphicColors.highlight}`,
            transition: 'all 0.3s ease',
            '& fieldset': {
              border: 'none'
            },
            '&:hover': {
              boxShadow: `inset 2px 2px 4px ${neumorphicColors.shadow}, inset -2px -2px 4px ${neumorphicColors.highlight}`
            },
            '&.Mui-focused': {
              boxShadow: `inset 1px 1px 2px ${neumorphicColors.shadow}, inset -1px -1px 2px ${neumorphicColors.highlight}`,
              backgroundColor: neumorphicColors.light
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: `8px 8px 16px ${neumorphicColors.shadow}, -8px -8px 16px ${neumorphicColors.highlight}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `12px 12px 24px ${neumorphicColors.shadow}, -12px -12px 24px ${neumorphicColors.highlight}`,
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: gradients.primary,
          boxShadow: `0 2px 8px ${neumorphicColors.shadow}`,
          borderRadius: 0
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: `2px 2px 4px ${neumorphicColors.shadow}, -2px -2px 4px ${neumorphicColors.highlight}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `1px 1px 2px ${neumorphicColors.shadow}, -1px -1px 2px ${neumorphicColors.highlight}`
          }
        }
      }
    }
  }
}

export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed'
    },
    secondary: {
      main: '#f472b6',
      light: '#fbbf24',
      dark: '#ec4899'
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b'
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1'
    },
    neumorphic: {
      light: '#1e293b',
      dark: '#0f172a',
      shadow: 'rgba(0, 0, 0, 0.3)',
      highlight: 'rgba(30, 41, 59, 0.2)'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#475569 #1e293b',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#1e293b',
            width: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#475569',
            minHeight: 24
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#64748b'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
          boxShadow: `8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(30, 41, 59, 0.2)`,
          borderRadius: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          backgroundColor: '#1e293b',
          boxShadow: `4px 4px 8px rgba(0, 0, 0, 0.3), -4px -4px 8px rgba(30, 41, 59, 0.2)`,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#1e293b',
            boxShadow: `3px 3px 6px rgba(0, 0, 0, 0.3), -3px -3px 6px rgba(30, 41, 59, 0.2)`,
            transform: 'translateY(-1px)'
          },
          '&:active': {
            boxShadow: `inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(30, 41, 59, 0.2)`,
            transform: 'translateY(0px)'
          }
        },
        contained: {
          background: gradients.primary,
          color: '#ffffff',
          boxShadow: `4px 4px 8px rgba(0, 0, 0, 0.3), -4px -4px 8px rgba(30, 41, 59, 0.2)`,
          '&:hover': {
            background: gradients.primary,
            boxShadow: `3px 3px 6px rgba(0, 0, 0, 0.3), -3px -3px 6px rgba(30, 41, 59, 0.2)`
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: '#1e293b',
            boxShadow: `inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(30, 41, 59, 0.2)`,
            transition: 'all 0.3s ease',
            '& fieldset': {
              border: 'none'
            },
            '&:hover': {
              boxShadow: `inset 3px 3px 6px rgba(0, 0, 0, 0.3), inset -3px -3px 6px rgba(30, 41, 59, 0.2)`
            },
            '&.Mui-focused': {
              boxShadow: `inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(30, 41, 59, 0.2)`,
              backgroundColor: '#1e293b'
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: '#1e293b',
          boxShadow: `12px 12px 24px rgba(0, 0, 0, 0.3), -12px -12px 24px rgba(30, 41, 59, 0.2)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `16px 16px 32px rgba(0, 0, 0, 0.3), -16px -16px 32px rgba(30, 41, 59, 0.2)`,
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: gradients.primary,
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.3)`
        }
      }
    }
  }
}

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme(mode === 'light' ? lightTheme : darkTheme)
}

export default createAppTheme
