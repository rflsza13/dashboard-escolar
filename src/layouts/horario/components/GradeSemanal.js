import { Fragment } from "react";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from "react-icons/io5";

import { DIAS_GRADE, INTERVALOS_GRADE, faixaDaAula, fimDaAula, formatarDataCurta, hojeIso } from "utils/escola";

function IconeStatus({ status }) {
  if (status === "Presente" || status === "Reposição realizada") return <IoCheckmarkCircle size="16px" color="#01B574" />;
  if (status === "Falta") return <IoCloseCircle size="16px" color="#E31A1A" />;
  return <IoTimeOutline size="16px" color="#A0AEC0" />;
}
IconeStatus.propTypes = { status: PropTypes.string.isRequired };

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
                {(porCelula[`${d}|${faixa}`] || []).map((s) => (
                  <VuiBox
                    key={s.chave}
                    onClick={() => onSelecionar(s)}
                    sx={{ cursor: "pointer", mb: "4px", p: "5px 8px", borderRadius: "10px", borderLeft: `4px solid ${s.cor}`, background: `${s.cor}26`, "&:hover": { background: `${s.cor}40` } }}
                  >
                    <VuiBox display="flex" justifyContent="space-between" alignItems="center" gap="6px">
                      <VuiTypography variant="caption" color="white" fontWeight="bold" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.hora}–{fimDaAula(s.hora, s.duracao)} · {s.aluno}
                      </VuiTypography>
                      <VuiBox sx={{ flexShrink: 0, display: "flex" }}>
                        <IconeStatus status={s.status} />
                      </VuiBox>
                    </VuiBox>
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", lineHeight: 1.25 }}>
                      {s.curso}
                      {s.tags.length ? ` · ${s.tags.join(" · ")}` : ""}
                    </VuiTypography>
                    {s.professores.length > 0 && (
                      <VuiTypography variant="caption" color="white" sx={{ display: "block", lineHeight: 1.25, opacity: 0.75 }}>
                        Prof.: {s.professores.join(", ")}
                      </VuiTypography>
                    )}
                  </VuiBox>
                ))}
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
