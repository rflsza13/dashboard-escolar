import PropTypes from "prop-types";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

// Cartão de indicador (número grande + detalhe + linha de comparação opcional)
export function CardKpi({ titulo, valor, detalhe, icone: Icone, cor, extra }) {
  return (
    <Card sx={{ height: "100%", p: "18px 20px" }}>
      <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <VuiTypography variant="caption" color="text" fontWeight="medium" textTransform="uppercase" sx={{ fontSize: "11px", letterSpacing: "0.5px" }}>
          {titulo}
        </VuiTypography>
        {Icone && (
          <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: `${cor}22`, display: "flex", alignItems: "center", justifyContent: "center", color: cor }}>
            <Icone size="18px" />
          </VuiBox>
        )}
      </VuiBox>
      <VuiTypography variant="h3" color="white" fontWeight="bold" sx={{ mb: 0.5, lineHeight: 1.1 }}>
        {valor}
      </VuiTypography>
      {detalhe && (
        <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px", opacity: 0.85, display: "block" }}>
          {detalhe}
        </VuiTypography>
      )}
      {extra}
    </Card>
  );
}
CardKpi.defaultProps = { detalhe: "", icone: null, cor: "#e3242b", extra: null };
CardKpi.propTypes = { titulo: PropTypes.string.isRequired, valor: PropTypes.node.isRequired, detalhe: PropTypes.node, icone: PropTypes.elementType, cor: PropTypes.string, extra: PropTypes.node };

// Barra de distribuição proporcional com dimensões exatas em CSS (sem conflito de temas)
export function BarraDistribuicao({ rotulo, total, totalGeral, cor }) {
  const pct = totalGeral > 0 ? Math.round((total / totalGeral) * 100) : 0;
  return (
    <VuiBox mb={2}>
      <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
        <VuiTypography variant="caption" color="white" fontWeight="medium" sx={{ fontSize: "12px" }}>
          {rotulo}
        </VuiTypography>
        <VuiTypography variant="caption" color="text" sx={{ fontSize: "12px" }}>
          <strong style={{ color: "#fff" }}>{total}</strong> ({pct}%)
        </VuiTypography>
      </VuiBox>
      <VuiBox sx={{ width: "100%", height: 9, borderRadius: "5px", backgroundColor: "rgba(255, 255, 255, 0.08)", overflow: "hidden", position: "relative" }}>
        <VuiBox
          sx={{
            width: `${Math.max(pct, total > 0 ? 3 : 0)}%`,
            height: "100%",
            borderRadius: "5px",
            backgroundColor: cor,
            boxShadow: `0 0 8px ${cor}55`,
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </VuiBox>
    </VuiBox>
  );
}
BarraDistribuicao.defaultProps = { cor: "#e3242b" };
BarraDistribuicao.propTypes = { rotulo: PropTypes.string.isRequired, total: PropTypes.number.isRequired, totalGeral: PropTypes.number.isRequired, cor: PropTypes.string };

// Seta de comparação: sentido up/down/igual; "bom" pinta de verde (true) ou vermelho (false)
export function Seta({ sentido, bom, texto }) {
  const cor = sentido === "igual" || bom === null ? "rgba(255,255,255,0.55)" : bom ? "#01B574" : "#E31A1A";
  const simbolo = sentido === "up" ? "↑" : sentido === "down" ? "↓" : "→";
  return (
    <VuiTypography variant="caption" sx={{ display: "block", mt: "6px", fontSize: "11px", fontWeight: "bold", color: cor }}>
      {simbolo} {texto}
    </VuiTypography>
  );
}
Seta.defaultProps = { bom: null };
Seta.propTypes = { sentido: PropTypes.oneOf(["up", "down", "igual"]).isRequired, bom: PropTypes.bool, texto: PropTypes.string.isRequired };

const fmt = (n) => String(Math.round(Math.abs(n) * 10) / 10).replace(".", ",");

// Compara o valor atual com o do período anterior. melhorSeMenor: quanto menor, melhor (ex.: saídas)
export function Variacao({ atual, anterior, sufixo, melhorSeMenor }) {
  if (atual === null || atual === undefined || anterior === null || anterior === undefined) return null;
  const dif = atual - anterior;
  if (Math.abs(dif) < 0.05) return <Seta sentido="igual" texto="igual ao período anterior" />;
  const sobe = dif > 0;
  return <Seta sentido={sobe ? "up" : "down"} bom={melhorSeMenor ? !sobe : sobe} texto={`${fmt(dif)}${sufixo} ${sobe ? "a mais" : "a menos"} que no período anterior`} />;
}
Variacao.defaultProps = { sufixo: "", melhorSeMenor: false, atual: null, anterior: null };
Variacao.propTypes = { atual: PropTypes.number, anterior: PropTypes.number, sufixo: PropTypes.string, melhorSeMenor: PropTypes.bool };

// Moldura padrão dos cards de análise
export function CartaoSecao({ titulo, subtitulo, icone: Icone, cor, direita, children }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" gap="12px" mb={2}>
        <VuiBox display="flex" alignItems="center" gap="10px">
          {Icone && (
            <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: `${cor}22`, display: "flex", alignItems: "center", justifyContent: "center", color: cor, flexShrink: 0 }}>
              <Icone size="18px" />
            </VuiBox>
          )}
          <VuiBox>
            <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
              {titulo}
            </VuiTypography>
            {subtitulo && (
              <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                {subtitulo}
              </VuiTypography>
            )}
          </VuiBox>
        </VuiBox>
        {direita}
      </VuiBox>
      <VuiBox sx={{ flexGrow: 1 }}>{children}</VuiBox>
    </Card>
  );
}
CartaoSecao.defaultProps = { subtitulo: "", icone: null, cor: "#2CD9FF", direita: null };
CartaoSecao.propTypes = { titulo: PropTypes.string.isRequired, subtitulo: PropTypes.string, icone: PropTypes.elementType, cor: PropTypes.string, direita: PropTypes.node, children: PropTypes.node.isRequired };

export function Vazio({ texto }) {
  return (
    <VuiBox sx={{ textAlign: "center", py: 3 }}>
      <VuiTypography variant="caption" color="text">
        {texto}
      </VuiTypography>
    </VuiBox>
  );
}
Vazio.propTypes = { texto: PropTypes.string.isRequired };

export const estiloTh = { padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 };
