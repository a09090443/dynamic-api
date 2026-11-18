import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

const c = tokens.color;

// 明亮版主題：不載入外部字型，未安裝 Inter／Noto Sans TC 時退回 system-ui
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: c.primary, dark: c.primaryText, light: c.primarySoft, contrastText: '#ffffff' },
    success: { main: c.success, dark: c.successText, light: c.successSoft, contrastText: '#ffffff' },
    warning: { main: c.warning, dark: c.warningText, light: c.warningSoft, contrastText: '#ffffff' },
    error: { main: c.danger, dark: c.dangerText, contrastText: '#ffffff' },
    background: { default: c.background, paper: c.surface },
    text: { primary: c.text, secondary: c.textMuted, disabled: c.textDisabled },
    divider: c.border,
  },
  shape: { borderRadius: tokens.radius.button },
  typography: {
    fontFamily: tokens.font.family,
    fontSize: 14,
    h1: { fontSize: 24, fontWeight: 700, color: c.textStrong, lineHeight: 1.3 },
    h2: { fontSize: 16, fontWeight: 700, color: c.textStrong, lineHeight: 1.4 },
    body1: { fontSize: 14 },
    body2: { fontSize: 13 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: 14 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: c.background, color: c.text },
        a: { color: c.primaryText },
        'a:hover': { color: c.primaryHover },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { outline: `2px solid ${c.primary}`, outlineOffset: 2 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: tokens.size.buttonHeight, borderRadius: tokens.radius.button, paddingInline: 16 },
        sizeSmall: { minHeight: tokens.size.tableButtonHeight, borderRadius: tokens.radius.smallButton, paddingInline: 12, fontSize: 13 },
        outlined: { borderColor: c.borderInput, color: c.textSecondary, backgroundColor: c.surface },
        outlinedError: { borderColor: c.dangerBorder, color: c.dangerText },
        outlinedPrimary: { borderColor: c.borderInput, color: c.textSecondary },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.input,
          backgroundColor: c.surface,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: c.borderInput },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.primary, borderWidth: 1 },
          '&.Mui-focused': { boxShadow: tokens.shadow.focusRing },
        },
        input: { minHeight: 22 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        rounded: { borderRadius: tokens.radius.card },
        outlined: { borderColor: c.border },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '12px 16px', borderBottom: `1px solid ${c.borderRow}`, fontSize: 14 },
        head: { fontSize: 12, fontWeight: 600, color: c.textMuted, backgroundColor: c.surfaceMuted, borderBottom: `1px solid ${c.border}` },
        paddingCheckbox: { paddingLeft: 12, paddingRight: 0 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.chip, height: tokens.size.chipHeight, fontSize: 12, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: tokens.radius.card, boxShadow: tokens.shadow.dialog },
      },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 12 } },
    },
  },
});
