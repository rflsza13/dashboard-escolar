import colors from "assets/theme/base/colors";
import themeConfig from "themeConfig";

const { info, dark } = colors;

const sb = themeConfig.scrollbar || {};
const sbCor = sb.color || themeConfig.primary || "#e3242b";
const sbHover = sb.hoverColor || themeConfig.accent || sbCor;
const sbLargura = sb.width || 6;

const bodyBackground =
  themeConfig.background && themeConfig.background.customImageUrl
    ? `url("${themeConfig.background.customImageUrl}")`
    : (themeConfig.background && themeConfig.background.gradient) ||
      "radial-gradient(1400px 900px at 80% 0%, rgba(227, 36, 43, 0.26), transparent 65%), radial-gradient(1100px 750px at 10% 90%, rgba(227, 36, 43, 0.14), transparent 65%), radial-gradient(900px 700px at 45% 40%, rgba(227, 36, 43, 0.07), transparent 70%), #08080b";

export default {
  html: {
    scrollBehavior: "smooth",
    background: dark.body,
  },
  body: {
    background: "#08080b",
    position: "relative",
  },
  "body::before": {
    content: '""',
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    background: bodyBackground,
    backgroundSize: "cover",
    backgroundPosition: "center",
    zIndex: -1,
    pointerEvents: "none",
    transform: "translate3d(0, 0, 0)",
    WebkitTransform: "translate3d(0, 0, 0)",
  },
  "*, *::before, *::after": {
    margin: 0,
    padding: 0,
  },
  // barra de rolagem fina, na cor do tema (Firefox usa scrollbar-color; Chrome/Edge/Safari usam ::-webkit-scrollbar)
  "*": {
    scrollbarWidth: "thin",
    scrollbarColor: `${sbCor} transparent`,
  },
  "*::-webkit-scrollbar": { width: `${sbLargura}px`, height: `${sbLargura}px` },
  "*::-webkit-scrollbar-track": { background: "transparent" },
  "*::-webkit-scrollbar-thumb": { background: sbCor, borderRadius: `${sbLargura}px` },
  "*::-webkit-scrollbar-thumb:hover": { background: sbHover },
  "*::-webkit-scrollbar-corner": { background: "transparent" },
  "a, a:link, a:visited": {
    textDecoration: "none !important",
  },
  "a.link, .link, a.link:link, .link:link, a.link:visited, .link:visited": {
    color: `${dark.main} !important`,
    transition: "color 150ms ease-in !important",
  },
  "a.link:hover, .link:hover, a.link:focus, .link:focus": {
    color: `${info.main} !important`,
  },
};
