import { useState, useEffect } from "react";

import { Route, Switch, Redirect, useLocation } from "react-router-dom";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import Card from "@mui/material/Card";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import { IoMenu } from "react-icons/io5";
import themeConfig from "themeConfig";

import Sidenav from "examples/Sidenav";
import theme from "assets/theme";
import routes from "routes";
import Login from "layouts/auth";

import { useVisionUIController, setMiniSidenav } from "context";
import { useEscola } from "context/escola";

function Mensagem({ texto, acao, rotulo }) {
  return (
    <VuiBox sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card sx={{ maxWidth: 460, textAlign: "center" }}>
        <VuiTypography variant="button" color="white" fontWeight="regular" mb={acao ? 2 : 0} sx={{ display: "block" }}>
          {texto}
        </VuiTypography>
        {acao && (
          <VuiBox>
            <VuiButton color="info" variant="contained" onClick={acao}>
              {rotulo}
            </VuiButton>
          </VuiBox>
        )}
      </Card>
    </VuiBox>
  );
}

export default function App() {
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, layout, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();
  const { fase, erro, dados, recarregar, recursos, pode } = useEscola();
  // rotas de funcionalidades desligadas em Configurações somem do menu e deixam de abrir (voltam ao dashboard)
  const rotasAtivas = routes.filter((r) => (!r.recurso || recursos[r.recurso]) && (!r.soAdmin || pode.config));

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) return getRoutes(route.collapse);
      if (route.route) return <Route exact path={route.route} component={route.component} key={route.key} />;
      return null;
    });

  let conteudo;
  if (fase === "login" || fase === "negado") conteudo = <Login />;
  else if (fase === "erro") conteudo = <Mensagem texto={erro} acao={recarregar} rotulo="Tentar de novo" />;
  else if (fase !== "pronto") conteudo = <Mensagem texto="Carregando…" />;
  else {
    conteudo = (
      <>
        {layout === "dashboard" && (
          <Sidenav
            color={sidenavColor}
            brand=""
            brandName={String((dados.config && dados.config.nomeEscola) || "Escola").toUpperCase()}
            routes={rotasAtivas}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
        )}
        {layout === "dashboard" && miniSidenav && (
          // botão de abrir o menu: só aparece em telas pequenas (no desktop o menu abre ao passar o mouse)
          <VuiBox
            role="button"
            aria-label="Abrir menu"
            onClick={() => setMiniSidenav(dispatch, false)}
            sx={{
              display: { xs: "flex", xl: "none" },
              position: "fixed",
              top: "calc(12px + env(safe-area-inset-top, 0px))",
              left: "12px",
              zIndex: 1100,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              cursor: "pointer",
              background: themeConfig.cards.background,
              backdropFilter: themeConfig.cards.backdropFilter,
              WebkitBackdropFilter: themeConfig.cards.backdropFilter,
              border: `1px solid ${themeConfig.cards.borderColor}`,
            }}
          >
            <IoMenu size="24px" color="#ffffff" />
          </VuiBox>
        )}
        <Switch>
          {getRoutes(rotasAtivas)}
          <Redirect from="*" to="/dashboard" />
        </Switch>
      </>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {conteudo}
    </ThemeProvider>
  );
}
