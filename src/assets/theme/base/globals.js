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
      "radial-gradient(900px 500px at 88% -8%, rgba(227, 36, 43, 0.20), transparent 60%), radial-gradient(700px 400px at -5% 105%, rgba(227, 36, 43, 0.08), transparent 60%), #070707";

export default {
  html: {
    scrollBehavior: "smooth",
    background: dark.body,
  },
  body: {
    background: bodyBackground,
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
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
