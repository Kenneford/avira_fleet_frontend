import { createTheme, alpha } from "@mui/material/styles";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const red = "#D32F2F";
const redLight = "#EF5350";
const redDark = "#B71C1C";

// ─── Dark surface tokens ──────────────────────────────────────────────────────
const D = {
  bg: "#0F0F0F",
  paper: "#161616",
  surface2: "#1E1E1E",
  surface3: "#252525",
  border: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.12)",
  textPri: "#FFFFFF",
  textSec: "#999999",
  textDis: "#555555",
  sidebar: "#0A0A0A",
};

// ─── Light surface tokens ─────────────────────────────────────────────────────
const L = {
  bg: "#F4F5F7",
  paper: "#FFFFFF",
  surface2: "#F8F9FA",
  surface3: "#EDEEF0",
  border: "rgba(0,0,0,0.09)",
  borderMid: "rgba(0,0,0,0.15)",
  textPri: "#0D0D0D",
  textSec: "#555555",
  textDis: "#AAAAAA",
  sidebar: "#FFFFFF",
};

export function createFleetTheme(mode = "light") {
  const isDark = mode === "dark";
  const T = isDark ? D : L;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: red,
        light: redLight,
        dark: redDark,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: isDark ? "#FFFFFF" : "#0D0D0D",
        contrastText: isDark ? "#0D0D0D" : "#FFFFFF",
      },
      success: { main: "#388E3C", light: "#66BB6A", dark: "#2E7D32" },
      warning: { main: "#F57C00", light: "#FFB74D", dark: "#E65100" },
      error: { main: "#D32F2F", light: "#EF5350", dark: "#B71C1C" },
      info: { main: "#1565C0", light: "#42A5F5", dark: "#0D47A1" },
      background: { default: T.bg, paper: T.paper },
      text: { primary: T.textPri, secondary: T.textSec, disabled: T.textDis },
      divider: T.border,
    },

    typography: {
      fontFamily: "'Roboto', sans-serif",
      h1: { fontFamily: "'Poppins', sans-serif", fontWeight: 800 },
      h2: { fontFamily: "'Poppins', sans-serif", fontWeight: 800 },
      h3: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
      h4: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
      h5: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
      h6: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
      overline: {
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.15em",
        fontSize: "0.68rem",
        color: red,
      },
      caption: { color: T.textSec },
      body1: { fontSize: "0.8rem", lineHeight: 1.6 },
      body2: { color: isDark ? "#CCCCCC" : "#333333", lineHeight: 1.6, fontSize: "0.8rem" },
    },

    shape: { borderRadius: 6 },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: T.bg,
            scrollbarWidth: "thin",
            scrollbarColor: isDark
              ? `${T.surface3} ${T.surface2}`
              : `${T.surface3} ${T.paper}`,
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            borderRadius: 4,
            boxShadow: "none",
            fontSize: "0.8rem",
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: {
            color: "#FFFFFF",
            background: red,
            "&:hover": { background: redDark, transform: "translateY(-1px)" },
            transition: "background 0.2s, transform 0.2s",
          },
          outlinedPrimary: {
            borderColor: alpha(red, 0.45),
            color: red,
            "&:hover": { borderColor: red, background: alpha(red, 0.06) },
          },
          containedError: { color: "#fff" },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            background: T.paper,
            border: `1px solid ${T.border}`,
            boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.07)",
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            background: T.paper,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.07)",
            backgroundImage: "none",
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: T.sidebar,
            border: "none",
            borderRight: `1px solid ${T.border}`,
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            background: T.sidebar,
            borderBottom: `1px solid ${T.border}`,
            boxShadow: "none",
            backgroundImage: "none",
            color: T.textPri,
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-root": {
              background: T.surface2,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isDark ? "#888888" : "#666666",
              borderBottom: `1px solid ${T.borderMid}`,
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${T.border}`,
            fontSize: "0.8rem",
            padding: "12px 16px",
            color: T.textPri,
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": {
              background: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
            },
            "&:last-child td": { borderBottom: "none" },
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              background: T.surface2,
              fontSize: "0.9rem",
              "& fieldset": { borderColor: T.border },
              "&:hover fieldset": { borderColor: alpha(red, 0.45) },
              "&.Mui-focused fieldset": { borderColor: red, borderWidth: 2 },
            },
            "& .MuiInputLabel-root": {
              fontSize: "0.85rem",
              color: T.textSec,
              "&.Mui-focused": { color: red },
            },
          },
        },
      },

      MuiSelect: {
        styleOverrides: {
          root: { background: T.surface2 },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.04em",
            height: 26,
            borderRadius: 4,
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            background: T.paper,
            border: `1px solid ${T.borderMid}`,
            borderRadius: 10,
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: { background: T.surface2, border: `1px solid ${T.borderMid}` },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            background: T.surface3,
            fontSize: "0.78rem",
            border: `1px solid ${T.borderMid}`,
            color: T.textPri,
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 6 },
          message: { fontSize: "0.8rem" },
          standardWarning: {
            background: alpha("#F57C00", 0.1),
            border: `1px solid ${alpha("#F57C00", 0.3)}`,
          },
          standardError: {
            background: alpha("#D32F2F", 0.1),
            border: `1px solid ${alpha("#D32F2F", 0.3)}`,
          },
          standardSuccess: {
            background: alpha("#388E3C", 0.1),
            border: `1px solid ${alpha("#388E3C", 0.3)}`,
          },
          standardInfo: {
            background: alpha("#1565C0", 0.1),
            border: `1px solid ${alpha("#1565C0", 0.3)}`,
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, background: T.surface3 },
          barColorPrimary: { background: red },
        },
      },

      MuiDivider: {
        styleOverrides: { root: { borderColor: T.border } },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            margin: "1px 0",
            "&.Mui-selected": {
              background: alpha(red, 0.1),
              color: red,
              "&:hover": { background: alpha(red, 0.16) },
              "& .MuiListItemIcon-root": { color: red },
            },
            "&:hover": {
              background: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
          },
        },
      },

      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: 38, color: isDark ? "#777" : "#666" },
        },
      },

      MuiListItemText: {
        styleOverrides: {
          primary: { color: T.textPri },
        },
      },

      MuiPopover: {
        styleOverrides: {
          paper: {
            background: T.paper,
            border: `1px solid ${T.borderMid}`,
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          switchBase: { "&.Mui-checked": { color: red } },
          track: {
            ".Mui-checked.Mui-checked + &": {
              backgroundColor: alpha(red, 0.5),
            },
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              background: alpha(red, 0.12),
              color: red,
              "&:hover": { background: alpha(red, 0.18) },
            },
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "none",
            fontSize: "0.85rem",
            "&.Mui-selected": { color: red },
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: red },
        },
      },
    },
  });
}

// Default light export for any legacy imports
export default createFleetTheme("light");
