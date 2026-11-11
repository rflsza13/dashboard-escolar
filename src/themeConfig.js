const themeConfig = {
  primary: "#e3242b",
  accent: "#ff5a4f",
  background: {
    customImageUrl: "",
    useDefaultImage: false,
    gradient:
      "radial-gradient(900px 500px at 88% -8%, rgba(227, 36, 43, 0.20), transparent 60%), radial-gradient(700px 400px at -5% 105%, rgba(227, 36, 43, 0.08), transparent 60%), #070707",
  },
  cards: {
    background: "rgba(40, 6, 6, 0.74)",
    backdropFilter: "blur(120px)",
    borderColor: "rgba(255, 255, 255, 0.125)",
  },
  fonts: {
    primary: "#ffffff",
    secondary: "#a0aec0",
  },
  // Caixa de seleção (ex.: "Bom comportamento"): borda, fundo quando marcada e cor do "visto"
  checkbox: {
    borderColor: "rgba(255, 255, 255, 0.65)",
    checkedBackground: "#01b574",
    checkColor: "#ffffff",
  },
  // Tela de login: imagem à esquerda (cole a URL em imageUrl; vazio usa um fundo em degradê) e painel fosco à direita.
  // O painel usa a cor de cards.background.
  login: {
    // imageUrl aceita um endereço (https://...) ou o nome de um arquivo da pasta public (ex.: "login.jpg")
    imageUrl: "",
    // tamanho e posição da imagem de fundo: imageSize aceita "cover" (preenche, pode cortar), "contain" (inteira, pode sobrar borda),
    // "auto" (tamanho original), porcentagem ("80%") ou pixels ("600px"); imageColor é a cor que aparece onde a imagem não alcança
    imageSize: "cover",
    imagePosition: "center",
    imageColor: "#0b0b0b",
    // logo no painel de login: arquivo da pasta public e tamanho em pixels (size 0 esconde)
    logo: {
      file: "favicon.png",
      size: 72,
      background: "transparent",
      padding: 0,
      radius: 0,
    },
    imageOverlay: "linear-gradient(135deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55))",
    fallbackBackground:
      "radial-gradient(700px 500px at 20% 20%, rgba(227, 36, 43, 0.55), transparent 65%), radial-gradient(600px 500px at 80% 90%, rgba(255, 90, 79, 0.25), transparent 60%), #0b0b0b",
    title: "Bem-vindo(a)!",
    message: "Acesse o painel de gestão da escola com a conta Google cadastrada.",
    panelBlur: "blur(18px)",
  },
  // Ícone ao lado do nome da escola no menu lateral: arquivo da pasta public, tamanho e um fundo opcional
  // (se a imagem for escura, use background "#ffffff" e padding 3 para ela aparecer no menu escuro).
  sidenavIcon: {
    file: "favicon.png",
    size: 30,
    background: "transparent",
    padding: 0,
    radius: 0,
  },
  // Nome da escola no topo do menu lateral: o tamanho da letra diminui sozinho para nomes longos, sempre em uma linha.
  // maxFontSize/minFontSize em pixels; areaPx é a largura disponível ao lado do ícone com o menu aberto; letterSpacing em em.
  sidenavTitle: {
    maxFontSize: 14,
    minFontSize: 9,
    areaPx: 148,
    letterSpacing: 0.12,
  },
  // Barra de rolagem minimalista. Sem color/hoverColor, usa primary e accent.
  scrollbar: {
    width: 6,
    color: "",
    hoverColor: "",
  },
  inputs: {
    backgroundColor: "rgba(53, 15, 15, 0.6)",
    color: "#ffffff",
    placeholderColor: "#a0aec0",
    borderColor: "rgba(226, 232, 240, 0.3)",
    focusBorderColor: "#e3242b",
    focusBoxShadow: "rgba(227, 36, 43, 0.35)",
  },
};

export default themeConfig;
