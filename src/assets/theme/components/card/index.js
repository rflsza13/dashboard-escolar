import borders from "assets/theme/base/borders";
import boxShadows from "assets/theme/base/boxShadows";
import themeConfig from "themeConfig";

const { borderWidth, borderRadius } = borders;
const { xxl } = boxShadows;

export default {
  styleOverrides: {
    root: {
      display: "flex",
      flexDirection: "column",
      background: (themeConfig.cards && themeConfig.cards.background) || "rgba(6, 11, 40, 0.74)",
      backdropFilter: (themeConfig.cards && themeConfig.cards.backdropFilter) || "blur(120px)",
      WebkitBackdropFilter: (themeConfig.cards && themeConfig.cards.backdropFilter) || "blur(120px)",
      position: "relative",
      minWidth: 0,
      padding: "22px",
      wordWrap: "break-word",
      backgroundClip: "border-box",
      border: `${borderWidth[1] || "1px"} solid ${(themeConfig.cards && themeConfig.cards.borderColor) || "rgba(255, 255, 255, 0.125)"}`,
      borderRadius: borderRadius.xl,
      boxShadow: xxl,
    },
  },
};
