import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

import VuiTypography from "components/VuiTypography";
import colors from "assets/theme/base/colors";
import themeConfig from "themeConfig";

const { inputColors, dark, white } = colors;

export const NativeSelect = styled("select")({
  width: "100%",
  height: "40px",
  padding: "0 12px",
  borderRadius: "15px",
  border: `1px solid ${inputColors.borderColor?.main || "#3A3A3A"}`,
  background: inputColors.backgroundColor || "transparent",
  color: inputColors.color || "#fff",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
  "&:focus": {
    borderColor: inputColors.borderColor?.focus || themeConfig.primary || "#E3242B",
    boxShadow: `0 0 0 2px ${inputColors.boxShadow || "rgba(227, 36, 43, 0.35)"}`,
  },
  "& option": {
    background: dark.body || "#141414",
    color: inputColors.color || "#fff",
  },
});

export function FieldLabel({ children }) {
  return (
    <VuiTypography component="label" variant="caption" color="text" fontWeight="medium" sx={{ display: "block", mb: "6px" }}>
      {children}
    </VuiTypography>
  );
}
FieldLabel.propTypes = { children: PropTypes.node.isRequired };

export const dialogPaper = {
  sx: {
    background: (themeConfig.cards && themeConfig.cards.background) || "#141414",
    backdropFilter: (themeConfig.cards && themeConfig.cards.backdropFilter) || "blur(120px)",
    WebkitBackdropFilter: (themeConfig.cards && themeConfig.cards.backdropFilter) || "blur(120px)",
    backgroundImage: "none",
    border: `1px solid ${(themeConfig.cards && themeConfig.cards.borderColor) || "#3A3A3A"}`,
    borderRadius: "20px",
    color: (themeConfig.fonts && themeConfig.fonts.primary) || "#fff",
  },
};
