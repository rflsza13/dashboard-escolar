import borders from "assets/theme/base/borders";
import colors from "assets/theme/base/colors";

// Vision UI Dashboard React helper functions
import pxToRem from "assets/theme/functions/pxToRem";
import themeConfig from "themeConfig";

const { borderWidth } = borders;
const { transparent, info } = colors;
const cfg = themeConfig.checkbox || {};
const bordaCaixa = cfg.borderColor || "rgba(255, 255, 255, 0.65)";
const fundoMarcada = cfg.checkedBackground || "#01b574";
const corVisto = encodeURIComponent(cfg.checkColor || "#ffffff");
const marcada = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 22 22'%3e%3cpath fill='none' stroke='${corVisto}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M6 10l3 3l6-6'/%3e%3c/svg%3e")`,
  backgroundColor: fundoMarcada,
  borderColor: fundoMarcada,
};

export default {
  styleOverrides: {
    root: {
      backgroundPosition: "center",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      width: pxToRem(20),
      height: pxToRem(20),
      marginRight: pxToRem(6),
      padding: 0,
      color: transparent.main,
      border: `${borderWidth[1]} solid ${bordaCaixa}`,
      borderRadius: pxToRem(5.6),
      transition: "all 250ms ease",

      "&:hover": {
        backgroundColor: transparent.main,
      },

      "& .MuiSvgIcon-root": {
        fill: transparent.main,
      },

      "&.Mui-focusVisible": {
        border: `${borderWidth[2]} solid ${info.main} !important`,
      },
    },

    colorPrimary: {
      backgroundColor: transparent.main,

      "&.Mui-checked": { ...marcada },

      "&:hover": {
        backgroundColor: transparent.main,
      },
      "&.Mui-checked:hover": { backgroundColor: fundoMarcada },
    },

    colorSecondary: {
      backgroundColor: transparent.main,

      "&.Mui-checked": { ...marcada },

      "&:hover": {
        backgroundColor: transparent.main,
      },
    },
  },
};
