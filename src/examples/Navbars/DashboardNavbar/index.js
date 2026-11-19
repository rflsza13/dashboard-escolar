import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

// Vision UI Dashboard React example components
import Breadcrumbs from "examples/Breadcrumbs";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Vision UI Dashboard React context
import {
  useVisionUIController,
  setTransparentNavbar,
  setMiniSidenav,
} from "context";

import { useEscola } from "context/escola";
import BuscaGlobalDialog from "layouts/shared/BuscaGlobalDialog";

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar } = controller;
  const { user } = useEscola();
  const route = useLocation().pathname.split("/").slice(1);
  const [buscaOpen, setBuscaOpen] = useState(false);

  useEffect(() => {
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    let ultimoTransparente = (fixedNavbar && window.scrollY === 0) || !fixedNavbar;

    function handleTransparentNavbar() {
      const novoValor = (fixedNavbar && window.scrollY === 0) || !fixedNavbar;
      if (novoValor !== ultimoTransparente) {
        ultimoTransparente = novoValor;
        setTransparentNavbar(dispatch, novoValor);
      }
    }

    window.addEventListener("scroll", handleTransparentNavbar, { passive: true });
    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  // Atalho global Ctrl+K / Cmd+K para abrir busca rápida
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setBuscaOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

  return (
    <>
      <AppBar
        position={absolute ? "absolute" : navbarType}
        color="inherit"
        sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
      >
        <Toolbar sx={(theme) => navbarContainer(theme)}>
          <VuiBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
            <Breadcrumbs icon="home" title={route[route.length - 1] || "dashboard"} route={route} light={light} />
          </VuiBox>
          {isMini ? null : (
            <VuiBox sx={(theme) => navbarRow(theme, { isMini })} display="flex" alignItems="center" gap="8px">
              {/* Botão de Busca Rápida (Ctrl+K) */}
              <VuiBox
                onClick={() => setBuscaOpen(true)}
                display="flex"
                alignItems="center"
                gap="8px"
                sx={{
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  px: "12px",
                  py: "6px",
                  transition: "background 150ms ease, border-color 150ms ease",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.09)",
                    borderColor: "rgba(255, 255, 255, 0.25)",
                  },
                }}
              >
                <Icon sx={{ color: "#a0aec0", fontSize: "16px !important" }}>search</Icon>
                <VuiTypography variant="caption" color="text" sx={{ fontSize: "12px", color: "#8c9ba5" }}>
                  Buscar aluno...
                </VuiTypography>
                <VuiBox
                  sx={{
                    ml: 1,
                    px: "5px",
                    py: "1px",
                    borderRadius: "4px",
                    background: "rgba(255, 255, 255, 0.1)",
                    fontSize: "10px",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Ctrl+K
                </VuiBox>
              </VuiBox>

              {user && (
                <VuiBox display="flex" alignItems="center" gap="6px" sx={{ ml: 1 }}>
                  <Icon sx={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "18px !important" }}>account_circle</Icon>
                  <VuiTypography variant="caption" color="white" fontWeight="medium">
                    {user.nome ? user.nome.split(" ")[0] : "Usuário"}
                  </VuiTypography>
                </VuiBox>
              )}

              <IconButton
                size="small"
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon className={"text-white"}>{miniSidenav ? "menu_open" : "menu"}</Icon>
              </IconButton>
            </VuiBox>
          )}
        </Toolbar>
      </AppBar>

      <BuscaGlobalDialog open={buscaOpen} onClose={() => setBuscaOpen(false)} />
    </>
  );
}

DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
