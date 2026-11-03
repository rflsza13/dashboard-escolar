import themeConfig from "themeConfig";

export default {
  // Vision UI Colors
  background: {
    default: "#f8f9fa",
  },

  sidenav: {
    button: "#1c1c1c",
  },

  text: {
    main: themeConfig.fonts.secondary || "#a0aec0",
    focus: themeConfig.fonts.primary || "#ffffff",
  },

  transparent: {
    main: "transparent",
  },

  white: {
    main: "#ffffff",
    focus: "#ffffff",
  },

  brand: {
    main: themeConfig.primary || "#e3242b",
    focus: themeConfig.accent || "#ff5a4f",
  },

  black: {
    light: "#141414",
    main: "#000000",
    focus: "#000000",
  },

  primary: {
    main: themeConfig.primary || "#e3242b",
    focus: themeConfig.accent || "#ff5a4f",
  },

  secondary: {
    main: "#141414",
    focus: "#1a1a1a",
  },

  lightblue: {
    main: "#4299e1",
    focus: "#4299e1",
  },

  orange: {
    main: "#f6ad55",
    focus: "#f6ad55",
  },

  grey: {
    100: "#edf2f7",
    200: "#e2e8f0",
    300: "#cbd5e0",
    400: "#a0aec0",
    500: "#718096",
    600: "#4a5568",
    700: "#2d3748",
    800: "#1a202a",
    900: "#171923",
  },

  borderCol: {
    main: "#3a3a3a",
    red: "#e31a1a",
    navbar: "rgba(226, 232, 240, 0.3)",
  },

  // Other colors
  info: {
    main: "#e3242b",
    focus: "#ff5a4f",
    charts: {
      100: "#f0555a",
      200: "#c4161c",
      300: "#c4161c",
      400: "#8f1015",
      500: "#650b0f",
      600: "#3d0609",
    },
  },

  success: {
    main: "#01b574",
    focus: "#35d28a",
  },

  warning: {
    main: "#ffb547",
    focus: "#ffcd75",
  },

  error: {
    main: "#e31a1a",
    focus: "#ee5d50",
  },

  light: {
    main: "#e9ecef",
    focus: "#ebeff4",
  },

  dark: {
    main: "#344767",
    focus: "#1a1a1a",
    body: "#050505",
  },

  gradients: {
    navbar: {
      deg: "123.64deg",
      main: "rgba(255, 255, 255, 0) -22.38%",
      state: "rgba(255, 255, 255, 0.039) 70.38%",
    },

    sidenav: {
      deg: "127.09",
      main: "rgba(18, 18, 18, 0.94) 19.41%",
      state: "rgba(10, 10, 10, 0.49) 76.65%",
    },

    borderLight: {
      angle: "94.43% 69.43% at 50% 50%",
      main: "#ffffff 0%",
      state: "rgba(255, 255, 255, 0) 100%",
    },

    borderDark: {
      angle: "69.43% 69.43% at 50% 50%",
      main: "#ffffff 0%",
      state: "rgba(255, 255, 255, 0) 100%",
    },

    cover: {
      deg: "159.02",
      main: "#1a1a1a 14.25%",
      state: "#101010 56.45%",
      stateSecondary: "#050505 86.14%",
    },

    cardDark: {
      deg: "126.97",
      main: "rgba(18, 18, 18, 0.74) 28.26%",
      state: "rgba(10, 10, 10, 0.71) 91.2%",
    },

    cardLight: {
      deg: "127.09",
      main: "rgba(18, 18, 18, 0.94) 19.41%",
      state: "rgba(10, 10, 10, 0.49) 76.65%",
    },

    card: {
      deg: "127.09",
      main: "rgba(18, 18, 18, 0.94) 19.41%",
      state: "rgba(10, 10, 10, 0.49) 76.65%",
    },

    menu: {
      deg: "126.97",
      main: "#1a1a1a 28.26%",
      state: "#2b0b0d 91.2%",
    },

    cardContent: {
      deg: "126.97",
      main: "rgb(18, 18, 18) 28.26%",
      state: "rgb(10, 10, 10) 91.2%",
    },

    box: {
      deg: "126.97",
      main: "rgba(18, 18, 18, 0.74) 28.26%",
      state: "rgba(10, 10, 10, 0.71) 91.2%",
    },

    bill: {
      deg: "127.09",
      main: "rgba(34, 34, 34, 0.94) 19.41%",
      state: "rgba(10, 10, 10, 0.49) 76.65%",
    },

    primary: {
      deg: "97.89",
      main: "#e3242b",
      state: "#ff5a4f",
    },

    secondary: {
      main: "#627594",
      state: "#a8b8d8",
    },

    logo: {
      deg: "97.89",
      main: "#ffffff 70.67%",
      state: "rgba(117, 122, 140, 0) 108.55%",
    },

    info: {
      main: "#e3242b",
      state: "#ff6a4d",
    },

    success: {
      main: "#01B574",
      state: "#c9fbd5",
    },

    warning: {
      main: "#f53939",
      state: "#fbcf33",
    },

    error: {
      main: "#f53c2b",
      state: "#f53c2b",
    },

    light: {
      main: "#ced4da",
      state: "#ebeff4",
    },

    dark: {
      main: "#141414",
      state: "#3a3a3a",
    },
  },

  socialMediaColors: {
    facebook: {
      main: "#3b5998",
      dark: "#344e86",
    },

    twitter: {
      main: "#55acee",
      dark: "#3ea1ec",
    },

    instagram: {
      main: "#125688",
      dark: "#0e456d",
    },

    linkedin: {
      main: "#0077b5",
      dark: "#00669c",
    },

    pinterest: {
      main: "#cc2127",
      dark: "#b21d22",
    },

    youtube: {
      main: "#e52d27",
      dark: "#d41f1a",
    },

    vimeo: {
      main: "#1ab7ea",
      dark: "#13a3d2",
    },

    slack: {
      main: "#3aaf85",
      dark: "#329874",
    },

    dribbble: {
      main: "#ea4c89",
      dark: "#e73177",
    },

    github: {
      main: "#24292e",
      dark: "#171a1d",
    },

    reddit: {
      main: "#ff4500",
      dark: "#e03d00",
    },

    tumblr: {
      main: "#35465c",
      dark: "#2a3749",
    },
  },

  alertColors: {
    primary: {
      main: "#7928ca",
      state: "#d6006c",
      border: "#efb6e2",
    },

    secondary: {
      main: "#627594",
      state: "#8ca1cb",
      border: "#dadee6",
    },

    info: {
      main: "#2152ff",
      state: "#02c6f3",
      border: "#b9ecf8",
    },

    success: {
      main: "#17ad37",
      state: "#84dc14",
      border: "#daf3b9",
    },

    warning: {
      main: "#f53939",
      state: "#fac60b",
      border: "#fef1c2",
    },

    error: {
      main: "#ea0606",
      state: "#ff3d59",
      border: "#f9b4b4",
    },

    light: {
      main: "#ced4da",
      state: "#d1dae6",
      border: "#f8f9fa",
    },

    dark: {
      main: "#141414",
      state: "#2c3154",
      border: "#c2c8d1",
    },
  },

  badgeColors: {
    primary: {
      basic: "#805ad5",
      background: "#f883dd",
      text: "#a3017e",
    },

    secondary: {
      basic: "#5974a2",
      background: "#e4e8ed",
      text: "#5974a2",
    },

    info: {
      basic: "#4299e1",
      background: "#abe9f7",
      text: "#08a1c4",
    },

    success: {
      basic: "#01b574",
      background: "#c9fbd5",
      text: "#01b574",
    },

    warning: {
      basic: "#ffb547",
      background: "#fef5d3",
      text: "#fbc400",
    },

    error: {
      basic: "#e31a1a",
      background: "#fc9797",
      text: "#bd0000",
    },

    light: {
      basic: "#ffffff",
      background: "#ffffff",
      text: "#c7d3de",
    },

    dark: {
      basic: "#1E244B",
      background: "#1E244B",
      text: "#fff",
    },
  },

    inputColors: {
    backgroundColor: (themeConfig.inputs && themeConfig.inputs.backgroundColor) || "#0f1535",
    borderColor: {
      main: (themeConfig.inputs && themeConfig.inputs.borderColor) || "rgba(226, 232, 240, 0.3)",
      focus: (themeConfig.inputs && themeConfig.inputs.focusBorderColor) || themeConfig.primary || "#e3242b",
    },
    boxShadow: (themeConfig.inputs && themeConfig.inputs.focusBoxShadow) || themeConfig.primary || "#e3242b",
    color: (themeConfig.inputs && themeConfig.inputs.color) || themeConfig.fonts.primary || "#ffffff",
    placeholder: (themeConfig.inputs && themeConfig.inputs.placeholderColor) || themeConfig.fonts.secondary || "#a0aec0",
    error: "#fd5c70",
    success: "#66d432",
  },

  sliderColors: {
    thumb: { borderColor: "#d9d9d9" },
  },

  circleSliderColors: {
    background: "#d3d3d3",
  },

  tabs: {
    indicator: { boxShadow: "#ddd" },
  },
};
