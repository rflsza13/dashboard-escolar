import { Fragment, useMemo } from "react";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import { DIAS_GRADE, INTERVALOS_GRADE, ROTULO_CATEGORIA, corValida, faixaDaAula, horaParaMin } from "utils/escola";

const borda = "1px solid rgba(120,120,120,0.35)";

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
  const alunosPorFaixa = useMemo(() => {
    const m = {};
    dados.matriculas.forEach((x) => {
      if (x.status !== "Ativa") return;
      if (horaParaMin(x.inicio) < 0) return;
      const k = `${x.dia}|${faixaDaAula(x.inicio)}`;
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [dados.matriculas]);

  return (
    <VuiBox sx={{ overflowX: "auto" }}>
      <VuiBox sx={{ display: "grid", gridTemplateColumns: "110px repeat(6, minmax(150px, 1fr))", minWidth: 110 + 6 * 150 }}>
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
              const nAlunos = alunosPorFaixa[`${d}|${faixa}`] || 0;
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
                  {naCelula.map((b) => {
                    const cor = corValida(b.professor.cor, "#F2F2F2");
                    return (
                      <VuiBox
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (podeEditar) onEditar(b);
                        }}
                        sx={{
                          cursor: podeEditar ? "pointer" : "default",
                          mb: "4px",
                          p: "5px 8px",
                          borderRadius: "10px",
                          borderLeft: `4px solid ${cor}`,
                          background: `${cor}26`,
                          "&:hover": podeEditar ? { background: `${cor}40` } : undefined,
                        }}
                      >
                        <VuiTypography variant="caption" color="white" fontWeight="bold" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {b.professor.nome}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text" sx={{ display: "block", lineHeight: 1.25 }}>
                          {b.inicio}–{b.fim}
                          {b.categoria ? ` · ${ROTULO_CATEGORIA[b.categoria]}` : ""}
                        </VuiTypography>
                      </VuiBox>
                    );
                  })}
                  {nAlunos > 0 && (
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", opacity: 0.8, fontSize: "10px" }}>
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
