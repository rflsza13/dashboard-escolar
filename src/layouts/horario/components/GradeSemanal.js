import { Fragment } from "react";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import { DIAS_GRADE, INTERVALOS_GRADE, barraDoStatus, faixaDaAula, fimDaAula, formatarDataCurta, hojeIso, misturarCor } from "utils/escola";

// fundo escuro do card, sobre o qual a cor do curso é misturada (sólido, sem transparência)
const FUNDO_CARD = "#150a0b";

function GradeSemanal({ dias, sessoes, onSelecionar, feriados }) {
  const hoje = hojeIso();

  const porCelula = {};
  sessoes.forEach((s) => {
    const faixa = faixaDaAula(s.hora);
    const k = `${s.data}|${faixa}`;
    if (!porCelula[k]) porCelula[k] = [];
    porCelula[k].push(s);
  });

  const borda = "1px solid rgba(120,120,120,0.35)";

  return (
    <VuiBox sx={{ overflowX: "auto" }}>
      <VuiBox sx={{ display: "grid", gridTemplateColumns: "110px repeat(6, minmax(160px, 1fr))", minWidth: 110 + 6 * 160 }}>
        <VuiBox />
        {dias.map((d, i) => (
          <VuiBox key={d} sx={{ p: "8px", textAlign: "center", borderRadius: "10px 10px 0 0", background: d === hoje ? "rgba(227,36,43,0.20)" : "transparent" }}>
            <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block" }}>
              {DIAS_GRADE[i]}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {formatarDataCurta(d)}
            </VuiTypography>
            {feriados[i] && (
              <VuiTypography variant="caption" sx={{ display: "block", mt: "2px", color: "#F5A524", fontWeight: 700, lineHeight: 1.2 }}>
                {feriados[i].origem === "ferias" ? "Férias" : "Feriado"} · {feriados[i].nome}
              </VuiTypography>
            )}
          </VuiBox>
        ))}

        {INTERVALOS_GRADE.map((faixa) => (
          <Fragment key={faixa}>
            <VuiBox sx={{ borderTop: borda, p: "6px 8px 0 0", textAlign: "right" }}>
              <VuiTypography variant="caption" color="text" fontWeight="medium" sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                {faixa}
              </VuiTypography>
            </VuiBox>
            {dias.map((d, i) => (
              <VuiBox key={`${d}|${faixa}`} sx={{ borderTop: borda, borderLeft: borda, p: "4px", minHeight: 70, background: feriados[i] ? "rgba(245,165,36,0.07)" : d === hoje ? "rgba(227,36,43,0.07)" : "transparent" }}>
                {(porCelula[`${d}|${faixa}`] || []).map((s) => {
                  const barra = barraDoStatus(s.status);
                  return (
                  <VuiBox
                    key={s.chave}
                    onClick={() => onSelecionar(s)}
                    title={barra.rotulo}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      mb: "4px",
                      p: "5px 18px 5px 8px",
                      borderRadius: "10px",
                      borderLeft: `4px solid ${s.cor}`,
                      background: misturarCor(s.cor, FUNDO_CARD, 0.34),
                      "&:hover": { background: misturarCor(s.cor, FUNDO_CARD, 0.46) },
                    }}
                  >
                    {/* barra de situação no canto direito: verde = presente, vermelha = falta, cinza = pendente */}
                    <VuiBox
                      data-status={barra.rotulo}
                      sx={{ position: "absolute", top: 0, right: 0, bottom: 0, width: barra.marcada ? "11px" : "8px", background: barra.cor, boxShadow: barra.marcada ? `0 0 10px ${barra.cor}` : "none" }}
                    />
                    <VuiTypography variant="caption" color="white" fontWeight="bold" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                      {s.aluno}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10.5px", lineHeight: 1.2, mt: "2px" }}>
                      {s.hora}–{fimDaAula(s.hora, s.duracao)}
                    </VuiTypography>
                  </VuiBox>
                  );
                })}
              </VuiBox>
            ))}
          </Fragment>
        ))}
      </VuiBox>
    </VuiBox>
  );
}

GradeSemanal.defaultProps = { feriados: [] };
GradeSemanal.propTypes = {
  feriados: PropTypes.array,
  dias: PropTypes.arrayOf(PropTypes.string).isRequired,
  sessoes: PropTypes.array.isRequired,
  onSelecionar: PropTypes.func.isRequired,
};

export default GradeSemanal;
