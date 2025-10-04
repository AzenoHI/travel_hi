import { useContext } from "react";
import { AppThemeContext } from "../ThemeContext";
import { IconButton, Tooltip, Box } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import InvertColorsIcon from "@mui/icons-material/InvertColors";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";

export default function ThemeControls() {
  const { mode, fontSize, toggleMode, cycleFontSize } = useContext(AppThemeContext);

  const contrastColor = mode === "contrast" ? "#FFD600" : undefined;

  const fontSizeLabel =
    fontSize === "small"
      ? "Mała czcionka"
      : fontSize === "normal"
      ? "Normalna czcionka"
      : "Duża czcionka";

  // @ts-ignore
    return (
    <Box display="flex" gap={1}>
      <Tooltip title="Light mode">
        <IconButton
          color={mode === "light" && mode !== "contrast" ? "primary" : "default"}
          onClick={() => toggleMode("light")}
          sx={{ color: mode === "contrast" ? contrastColor : undefined }}
        >
          <LightModeIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Dark mode">
        <IconButton
          color={mode === "dark" && mode !== "contrast" ? "primary" : "default"}
          onClick={() => toggleMode("dark")}
          sx={{ color: mode === "contrast" ? contrastColor : undefined }}
        >
          <DarkModeIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="High contrast">
        <IconButton
          color={mode === "contrast" ? "primary" : "default"}
          onClick={() => toggleMode("contrast")}
          sx={{ color: mode === "contrast" ? contrastColor : undefined }}
        >
          <InvertColorsIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title={fontSizeLabel}>
        <IconButton
          onClick={cycleFontSize}
          sx={{ color: mode === "contrast" ? contrastColor : undefined }}
        >
          <TextIncreaseIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}