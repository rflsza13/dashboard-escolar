import { useEffect, useRef, useState } from "react";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import themeConfig from "themeConfig";
import { CLIENT_ID } from "services/api";
import { useEscola } from "context/escola";

const L = themeConfig.login || {};
const LOGO = L.logo || {};

// endereço completo, data: ou caminho absoluto ficam como estão; nome de arquivo vem da pasta public
const resolverImagem = (v) => (/^(https?:|data:|\/|blob:)/i.test(v) ? v : `${process.env.PUBLIC_URL}/${v}`);

function Login() {
  const { fase, erro, entrar, sair } = useEscola();
  const botao = useRef(null);
  const negado = fase === "negado";
  const [semGoogle, setSemGoogle] = useState(false);

  useEffect(() => {
    if (negado || !CLIENT_ID) return undefined;
    let tentativas = 0;
    const t = setInterval(() => {
      tentativas += 1;
      if (window.google && window.google.accounts && botao.current) {
        clearInterval(t);
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (r) => entrar(r.credential), auto_select: false });
        window.google.accounts.id.renderButton(botao.current, { theme: "filled_black", size: "large", text: "signin_with", shape: "pill", locale: "pt-BR", width: 280 });
      } else if (tentativas > 50) {
        clearInterval(t);
        setSemGoogle(true);
      }
    }, 200);
    return () => clearInterval(t);
  }, [entrar, negado]);

  const fundoImagem = L.imageUrl
    ? `${L.imageOverlay || "none"}, url("${resolverImagem(L.imageUrl)}") ${L.imagePosition || "center"} / ${L.imageSize || "cover"} no-repeat ${L.imageColor || "#0b0b0b"}`
    : L.fallbackBackground || "#0b0b0b";

  return (
    <VuiBox sx={{ minHeight: "100vh", display: "flex", flexDirection: { xs: "column", md: "row" }, background: "#070707" }}>
      {/* lado esquerdo: imagem */}
      <VuiBox sx={{ flex: { xs: "0 0 28vh", md: "1 1 55%" }, background: fundoImagem, minHeight: { xs: "28vh", md: "100vh" } }} />

      {/* lado direito: painel fosco com a cor dos cards */}
      <VuiBox
        sx={{
          flex: { xs: "1 1 auto", md: "0 0 45%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, md: 6 },
          background: themeConfig.background.gradient,
        }}
      >
        <VuiBox
          sx={{
            width: "100%",
            maxWidth: 440,
            p: { xs: 3, md: 5 },
            textAlign: "center",
            borderRadius: "24px",
            background: themeConfig.cards.background,
            backdropFilter: L.panelBlur || themeConfig.cards.backdropFilter,
            WebkitBackdropFilter: L.panelBlur || themeConfig.cards.backdropFilter,
            border: `1px solid ${themeConfig.cards.borderColor}`,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
          }}
        >
          {LOGO.file && Number(LOGO.size) > 0 && (
            <img
              src={resolverImagem(LOGO.file)}
              alt=""
              width={Number(LOGO.size)}
              height={Number(LOGO.size)}
              style={{
                width: Number(LOGO.size),
                height: Number(LOGO.size),
                boxSizing: "border-box",
                padding: LOGO.padding || 0,
                objectFit: "contain",
                display: "block",
                margin: "0 auto 20px",
                background: LOGO.background || "transparent",
                borderRadius: LOGO.radius || 0,
              }}
            />
          )}
          <VuiTypography variant="h3" color="white" fontWeight="bold" mb={1.5}>
            {L.title || "Bem-vindo(a)!"}
          </VuiTypography>
          <VuiTypography variant="button" color="text" fontWeight="regular" mb={4} sx={{ display: "block", lineHeight: 1.6 }}>
            {L.message || "Entre com a conta Google da escola."}
          </VuiTypography>

          {erro && (
            <VuiBox mb={3} p="12px 16px" sx={{ borderRadius: "15px", border: "1px solid #E31A1A", background: "rgba(227,26,26,0.12)" }}>
              <VuiTypography variant="button" color="white" fontWeight="regular">
                {erro}
              </VuiTypography>
            </VuiBox>
          )}

          {!CLIENT_ID && (
            <VuiTypography variant="button" color="warning" fontWeight="regular">
              Falta configurar REACT_APP_GOOGLE_CLIENT_ID no arquivo .env.
            </VuiTypography>
          )}

          {semGoogle && !negado && (
            <VuiTypography variant="caption" color="warning" fontWeight="regular" mb={2} sx={{ display: "block" }}>
              Não foi possível carregar o login do Google. Verifique a internet e atualize o Chrome (e o Android System WebView) deste aparelho.
            </VuiTypography>
          )}

          {negado ? (
            <VuiButton color="info" variant="contained" onClick={() => sair()}>
              Tentar com outra conta
            </VuiButton>
          ) : (
            <VuiBox sx={{ display: "flex", justifyContent: "center" }}>
              <div ref={botao} />
            </VuiBox>
          )}
        </VuiBox>
      </VuiBox>
    </VuiBox>
  );
}

export default Login;
