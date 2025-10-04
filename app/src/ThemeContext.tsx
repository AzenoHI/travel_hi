import {createContext, useMemo, useState, type ReactNode} from "react";
import {ThemeProvider, CssBaseline} from "@mui/material";
import {lightTheme, darkTheme, contrastTheme} from "./theme";

export type ThemeMode = "light" | "dark" | "contrast";
export type FontSize = "small" | "normal" | "large";

type ThemeContextType = {
    mode: ThemeMode;
    fontSize: FontSize;
    cycleFontSize: () => void;
    toggleMode: (newMode: ThemeMode) => void;
    toggleFontSize: (size: FontSize) => void;
};

export const AppThemeContext = createContext<ThemeContextType>({
    mode: "light",
    fontSize: "normal",
    toggleMode: () => {
    },
    cycleFontSize: () => {
    },
    toggleFontSize: () => {
    },
});

export function AppThemeProvider({children}: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>("dark");
    const [fontSize, setFontSize] = useState<FontSize>("normal");

    const cycleFontSize = () => {
        setFontSize((prev) =>
            prev === "small" ? "normal" : prev === "normal" ? "large" : "small"
        );
    };

    const theme = useMemo(() => {
        let baseTheme;
        switch (mode) {
            case "dark":
                baseTheme = darkTheme;
                break;
            case "light":
                baseTheme = lightTheme;
                break;
            case "contrast":
                baseTheme = contrastTheme;
                break;
            default:
                baseTheme = darkTheme;
        }

        const sizeMap = {
            small: 12,
            normal: 14,
            large: 18,
        };

        return {
            ...baseTheme,
            typography: {
                ...baseTheme.typography,
                fontSize: sizeMap[fontSize],
            },
        };
    }, [mode, fontSize]);

    return (
        <AppThemeContext.Provider
            value={{
                mode,
                fontSize,
                toggleMode: setMode,
                cycleFontSize,
            }}
        >
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {children}
            </ThemeProvider>
        </AppThemeContext.Provider>
    );
}