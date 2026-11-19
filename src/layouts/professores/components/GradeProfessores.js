import { Fragment } from "react";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import { DIAS_GRADE, INTERVALOS_GRADE, ROTULO_CATEGORIA, corValida, faixaDaAula, horaParaMin } from "utils/escola";

const borda = "1px solid rgba(255, 255, 255, 0.07)";

// Determina se o bloco do professor cobre/cruza a faixa de horário
function blocoCruzaFaixa(b, faixa) {
  const [iniStr, fimStr] = faixa.split(" - ");
  const faixaIni = horaParaMin(iniStr);
  const faixaFim = horaParaMin(fimStr);
  return b.iniMin < faixaFim && b.fimMin > faixaIni;
}

// Encontra o intervalo mais próximo do início para vincular novos cliques
function horaInicioFaixa(faixa) {
  return faixa.split(" - ")[0];
}

function GradeProfessores({ blocos, dados, podeEditar, onEditar, onNovo }) {
  // quantos alunos têm aula fixa em cada dia e faixa
  const alunosPorFaixa = (d, faixa) => {
    let count = 0;
    (dados.matriculas || []).forEach((x) => {
      if (x.status !== "Ativa" || x.dia !== d) return;
      if (horaParaMin(x.inicio) < 0) return;
      if (faixaDaAula(x.inicio) === faixa) count += 1;
    });
    return count;
  };

  return (
    <VuiBox sx={{ overflowX: "auto" }}>
      <VuiBox sx={{ display: "grid", gridTemplateColumns: "110px repeat(6, minmax(160px, 1fr))", minWidth: 110 + 6 * 160 }}>
        <VuiBox />
        {DIAS_GRADE.map((d) => (
          <VuiBox key={d} sx={{ p: "8px", textAlign: "center" }}>
            <VuiTypography variant="button" color="white" fontWeight="bold">
              {d}
            </VuiTypography>
          </VuiBox>
        ))}
        {INTERVALOS_GRADE.map((faixa) => (
          <Fragment key={faixa}>
            <VuiBox sx={{ borderTop: borda, p: "6px 8px 0 0", textAlign: "right" }}>
              <VuiTypography variant="caption" color="text" fontWeight="medium" sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                {faixa}
              </VuiTypography>
            </VuiBox>
            {DIAS_GRADE.map((d) => {
              const naCelula = blocos.filter((b) => b.dia === d && blocoCruzaFaixa(b, faixa));
              const nAlunos = alunosPorFaixa(d, faixa);

              return (
                <VuiBox
                  key={`${d}|${faixa}`}
                  onClick={podeEditar ? () => onNovo(d, horaInicioFaixa(faixa)) : undefined}
                  sx={{
                    borderTop: borda,
                    borderLeft: borda,
                    p: "4px",
                    minHeight: 68,
                    cursor: podeEditar ? "copy" : "default",
                    "&:hover": podeEditar ? { background: "rgba(255,255,255,0.025)" } : undefined,
                  }}
                >
                  <VuiBox display="flex" flexDirection="column" gap="3px">
                    {naCelula.map((b) => {
                      const cor = corValida(b.professor.cor, "#F2F2F2");
                      return (
                        <VuiBox
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (podeEditar) onEditar(b);
                          }}
                          title={`${b.professor.nome} (${b.inicio}–${b.fim})${b.categoria ? ` · ${ROTULO_CATEGORIA[b.categoria]}` : ""}`}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            position: "relative",
                            overflow: "hidden",
                            cursor: podeEditar ? "pointer" : "default",
                            px: "6px",
                            py: "3px",
                            minHeight: "24px",
                            borderRadius: "6px",
                            borderLeft: `3px solid ${cor}`,
                            background: `${cor}26`,
                            "&:hover": podeEditar ? { background: `${cor}40` } : undefined,
                          }}
                        >
                          <VuiTypography
                            variant="caption"
                            color="white"
                            fontWeight="bold"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "11px",
                              lineHeight: 1.2,
                              mr: 1,
                              flex: 1,
                            }}
                          >
                            {b.professor.nome}
                          </VuiTypography>

                          <VuiTypography
                            variant="caption"
                            color="text"
                            sx={{
                              fontSize: "10px",
                              whiteSpace: "nowrap",
                              opacity: 0.9,
                              flexShrink: 0,
                            }}
                          >
                            {b.inicio}–{b.fim}
                          </VuiTypography>
                        </VuiBox>
                      );
                    })}
                  </VuiBox>

                  {nAlunos > 0 && (
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", opacity: 0.8, fontSize: "10px", mt: "4px" }}>
                      {nAlunos} aluno(s) neste horário
                    </VuiTypography>
                  )}
                </VuiBox>
              );
            })}
          </Fragment>
        ))}
      </VuiBox>
    </VuiBox>
  );
}

GradeProfessores.defaultProps = {
  config: {},
};

GradeProfessores.propTypes = {
  blocos: PropTypes.array.isRequired,
  dados: PropTypes.object.isRequired,
  config: PropTypes.object,
  podeEditar: PropTypes.bool.isRequired,
  onEditar: PropTypes.func.isRequired,
  onNovo: PropTypes.func.isRequired,
};

export default GradeProfessores;
