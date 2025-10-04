import {createTheme, type ThemeOptions} from "@mui/material/styles";


const base: ThemeOptions = {
    typography: {
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    },
};


export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#fafafa",   // bardzo jasne tło
      paper: "#ffffff",     // karty i AppBar — czysto białe
    },
    primary: {
      main: "#34d399",      // zielono-miętowy z logo
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#00c896",      // drugi odcień z logo
      contrastText: "#ffffff",
    },
    text: {
      primary: "#111827",   // prawie czarny
      secondary: "#4b5563", // szary
    },
    divider: "#e5e7eb",     // jasne szarości jako linie
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});


export const darkTheme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#0d1117",
            paper: "#161b22",
        },
        primary: {
            main: "#34d399",
            contrastText: "#0d1117",
        },
        secondary: {
            main: "#00c896",
            contrastText: "#0d1117",
        },
        text: {
            primary: "#e6edf3",
            secondary: "#9ba4b5",
        },
        divider: "#21262d",
    },
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: {fontWeight: 600},
        h2: {fontWeight: 600},
        h3: {fontWeight: 600},
        button: {textTransform: "none", fontWeight: 600},
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
    },
});
export const contrastTheme = createTheme({
    ...base,
    palette: {
        mode: "light",
        primary: {main: "#000000"},
        secondary: {main: "#ff0000"},
        background: {default: "#ffffff", paper: "#ffffff"},
        text: {primary: "#000000", secondary: "#000000"},
    },
});