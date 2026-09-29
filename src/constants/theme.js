/**
 * Tema unificado do AppCondominio.
 * Fonte única para cores, espaçamentos, tipografia e sombras.
 * @see docs/ARCHITECTURE.md
 */
export const theme = {
  colors: {
    primary: "#007AFF",
    primaryDark: "#0051D5",
    secondary: "#2C3E50",
    accent: "#00D4FF",
    background: "#F8F9FA",
    backgroundDark: "#1A1A1A",
    card: "#FFFFFF",
    white: "#FFFFFF",
    black: "#000000",
    text: "#2C3E50",
    textLight: "#6C757D",
    textDark: "#1A1A1A",
    border: "#E9ECEF",
    success: "#28A745",
    error: "#DC3545",
    warning: "#FFC107",
    info: "#17A2B8",
    gradient: {
      primary: ["#007AFF", "#00D4FF"],
      secondary: ["#2C3E50", "#34495E"],
      success: ["#28A745", "#20C997"],
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadow: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
