// src/common/ThemeControls.tsx
import { useContext } from "react";
import { AppThemeContext, type ThemeMode } from "../ThemeContext";
import { IconButton, Tooltip, Box, Button, Stack } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import InvertColorsIcon from "@mui/icons-material/InvertColors";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import { useNavigate } from "react-router-dom";

export default function ThemeControls() {
    const { mode, fontSize, toggleMode, cycleFontSize } = useContext(AppThemeContext);
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem("token");

    const contrastColor = "#FFD600";
    const iconColorSx = mode === "contrast" ? { color: contrastColor } : undefined;

    const fontSizeLabel =
        fontSize === "small"
            ? "Mała czcionka"
            : fontSize === "normal"
                ? "Normalna czcionka"
                : "Duża czcionka";

    const isSelected = (m: ThemeMode) => mode === m;

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            {/* 🔆 Tryby motywu */}
            <Tooltip title="Tryb jasny">
                <IconButton
                    color={isSelected("light") ? "primary" : "default"}
                    onClick={() => toggleMode("light")}
                    sx={iconColorSx}
                >
                    <LightModeIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Tryb ciemny">
                <IconButton
                    color={isSelected("dark") ? "primary" : "default"}
                    onClick={() => toggleMode("dark")}
                    sx={iconColorSx}
                >
                    <DarkModeIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Wysoki kontrast">
                <IconButton
                    color={isSelected("contrast") ? "primary" : "default"}
                    onClick={() => toggleMode("contrast")}
                    sx={iconColorSx}
                >
                    <InvertColorsIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title={fontSizeLabel}>
                <IconButton onClick={cycleFontSize} sx={iconColorSx}>
                    <TextIncreaseIcon />
                </IconButton>
            </Tooltip>

            {/* 🔒 Logowanie / Rejestracja / Wylogowanie */}
            <Box sx={{ ml: 2 }}>
                {!isLoggedIn ? (
                    <>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => navigate("/login")}
                            sx={{ textTransform: "none", mr: 1 }}
                        >
                            Zaloguj
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            onClick={() => navigate("/register")}
                            sx={{
                                textTransform: "none",
                                borderColor: "text.secondary",
                            }}
                        >
                            Zarejestruj się
                        </Button>
                    </>
                ) : (
                    <Button
                        color="inherit"
                        size="small"
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/");
                            window.location.reload();
                        }}
                        sx={{ textTransform: "none" }}
                    >
                        Wyloguj
                    </Button>
                )}
            </Box>
        </Stack>
    );
}
