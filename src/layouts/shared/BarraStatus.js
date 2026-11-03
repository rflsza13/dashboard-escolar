import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import { IoRefresh, IoLogOutOutline } from "react-icons/io5";

import { useEscola } from "context/escola";

function Aviso({ cor, children }) {
  return (
    <VuiBox mb={2} p="12px 16px" sx={{ borderRadius: "15px", border: `1px solid ${cor}`, background: `${cor}14` }}>
      <VuiTypography variant="button" color="white" fontWeight="regular">
        {children}
      </VuiTypography>
    </VuiBox>
  );
}

function BarraStatus() {
  const { isDemo, erro, limparErro, pendentes, user, recarregar, sair } = useEscola();
  const status = pendentes > 0 ? { texto: "Salvando…", cor: "#2CD9FF" } : erro ? { texto: "Atenção", cor: "#E31A1A" } : { texto: "Sincronizado", cor: "#01B574" };

  return (
    <VuiBox mb={2}>
      {isDemo && (
        <Aviso cor="#F6AD55">
          Modo demonstração: dados fictícios guardados só neste navegador. Para usar a planilha da escola, configure REACT_APP_SCRIPT_URL e
          REACT_APP_GOOGLE_CLIENT_ID no arquivo .env.
        </Aviso>
      )}
      {erro && (
        <VuiBox mb={2} p="12px 16px" display="flex" justifyContent="space-between" alignItems="center" gap="12px" sx={{ borderRadius: "15px", border: "1px solid #E31A1A", background: "rgba(227,26,26,0.08)" }}>
          <VuiTypography variant="button" color="white" fontWeight="regular">
            {erro}
          </VuiTypography>
          <VuiButton size="small" color="error" variant="text" onClick={limparErro}>
            Fechar
          </VuiButton>
        </VuiBox>
      )}
      <VuiBox display="flex" flexWrap="wrap" justifyContent="flex-end" alignItems="center" gap="12px">
        <VuiBox display="flex" alignItems="center" gap="8px">
          <VuiBox sx={{ width: 8, height: 8, borderRadius: "50%", background: status.cor }} />
          <VuiTypography variant="caption" color="text">
            {status.texto}
          </VuiTypography>
        </VuiBox>
        {user && (
          <VuiTypography variant="caption" color="text">
            {user.nome} · {user.perfil}
          </VuiTypography>
        )}
        <VuiButton size="small" color="info" variant="text" onClick={recarregar}>
          <IoRefresh size="14px" style={{ marginRight: 4 }} />
          Atualizar
        </VuiButton>
        {!isDemo && (
          <VuiButton size="small" color="info" variant="text" onClick={() => sair()}>
            <IoLogOutOutline size="14px" style={{ marginRight: 4 }} />
            Sair
          </VuiButton>
        )}
      </VuiBox>
    </VuiBox>
  );
}

export default BarraStatus;
