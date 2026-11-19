import { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import { DIAS_GRADE, INTERVALOS_GRADE, barraDoStatus, faixaDaAula, fimDaAula, formatarDataCurta, hojeIso, misturarCor } from "utils/escola";

// fundo escuro do card, sobre o qual a cor do curso é misturada (sólido, sem transparência)
const FUNDO_CARD = "#150a0b";

// Converte "HH:MM" em minutos desde meia-noite
function horaEmMinutos(hora) {
  if (!hora || typeof hora !== "string") return 0;
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Retorna o horário atual como "HH:MM"
function horaAtualStr() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Calcula posição percentual da hora atual dentro de uma faixa
// Faixas têm formato "09:00 - 10:30"
function posicaoNaFaixa(faixa, horaAtual) {
  const partes = faixa.split(" - ");
  if (partes.length < 2) return null;
  const inicioFaixa = horaEmMinutos(partes[0].trim());
  const fimFaixa = horaEmMinutos(partes[1].trim());
  const duracao = fimFaixa - inicioFaixa;
  if (duracao <= 0) return null;
  const atual = horaEmMinutos(horaAtual);
  if (atual < inicioFaixa || atual >= fimFaixa) return null;
  return ((atual - inicioFaixa) / duracao) * 100;
}

function horaInicioFaixa(faixa) {
  return faixa.split(" - ")[0].trim();
}

function GradeSemanal({ dias, sessoes, onSelecionar, feriados, onNovaCelula }) {
  const hoje = hojeIso();

  // Atualiza hora atual a cada minuto
  const [horaAtual, setHoraAtual] = useState(horaAtualStr);
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(horaAtualStr()), 60000);
    return () => clearInterval(timer);
  }, []);

  const porCelula = {};
  sessoes.forEach((s) => {
    const faixa = faixaDaAula(s.hora);
    const k = `${s.data}|${faixa}`;
    if (!porCelula[k]) porCelula[k] = [];
    porCelula[k].push(s);
  });

  const borda = "1px solid rgba(255, 255, 255, 0.07)";
  const indiceHoje = dias.indexOf(hoje); // -1 se a semana exibida não inclui hoje

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

        {INTERVALOS_GRADE.map((faixa) => {
          // Posição percentual da linha de tempo dentro desta faixa (null se não estiver nela)
          // Mostra sempre que o horário atual cai nesta faixa e a semana inclui hoje
          const posLinha = indiceHoje >= 0 ? posicaoNaFaixa(faixa, horaAtual) : null;

          return (
            <Fragment key={faixa}>
              <VuiBox sx={{ borderTop: borda, p: "6px 8px 0 0", textAlign: "right" }}>
                <VuiTypography variant="caption" color="text" fontWeight="medium" sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                  {faixa}
                </VuiTypography>
              </VuiBox>
              {dias.map((d, i) => {
                const aulas = porCelula[`${d}|${faixa}`] || [];

                return (
                  <VuiBox
                    key={`${d}|${faixa}`}
                    onClick={onNovaCelula ? () => onNovaCelula(d, horaInicioFaixa(faixa)) : undefined}
                    sx={{
                      borderTop: borda,
                      borderLeft: borda,
                      p: "4px",
                      minHeight: 70,
                      position: "relative",
                      cursor: onNovaCelula ? "copy" : "default",
                      background: feriados[i] ? "rgba(245,165,36,0.07)" : d === hoje ? "rgba(227,36,43,0.07)" : "transparent",
                      "&:hover": onNovaCelula
                        ? { background: feriados[i] ? "rgba(245,165,36,0.12)" : d === hoje ? "rgba(227,36,43,0.13)" : "rgba(255,255,255,0.03)" }
                        : undefined,
                    }}
                  >
                    {/* Linha vermelha de "Tempo Agora" cruzando toda a grade */}
                    {posLinha !== null && (
                      <VuiBox
                        sx={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: `${posLinha}%`,
                          height: "2px",
                          background: i === indiceHoje
                            ? "linear-gradient(90deg, #e3242b 0%, rgba(227,36,43,0.9) 100%)"
                            : "rgba(227,36,43,0.45)",
                          boxShadow: i === indiceHoje ? "0 0 8px #e3242b" : "0 0 3px rgba(227,36,43,0.4)",
                          zIndex: 10,
                          pointerEvents: "none",
                          ...(i === 0
                            ? {
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  left: -4,
                                  top: -4,
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: "#e3242b",
                                  boxShadow: "0 0 8px #e3242b",
                                },
                              }
                            : {}),
                        }}
                      />
                    )}

                    <VuiBox display="flex" flexDirection="column" gap="3px">
                      {aulas.map((s) => {
                        const barra = barraDoStatus(s.status);
                        return (
                          <VuiBox
                            key={s.chave}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelecionar(s);
                            }}
                            title={`${s.aluno} (${s.hora}–${fimDaAula(s.hora, s.duracao)}) · ${barra.rotulo}`}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              position: "relative",
                              overflow: "hidden",
                              cursor: "pointer",
                              pl: "6px",
                              pr: barra.marcada ? "14px" : "11px",
                              py: "3px",
                              minHeight: "24px",
                              borderRadius: "6px",
                              borderLeft: `3px solid ${s.cor}`,
                              background: misturarCor(s.cor, FUNDO_CARD, 0.34),
                              "&:hover": { background: misturarCor(s.cor, FUNDO_CARD, 0.52) },
                            }}
                          >
                            {/* barra de situação no canto direito: verde = presente, vermelha = falta, cinza = pendente */}
                            <VuiBox
                              data-status={barra.rotulo}
                              sx={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: barra.marcada ? "8px" : "5px",
                                background: barra.cor,
                                boxShadow: barra.marcada ? `0 0 8px ${barra.cor}` : "none",
                              }}
                            />

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
                              {s.aluno}
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
                              {s.hora}
                            </VuiTypography>
                          </VuiBox>
                        );
                      })}
                    </VuiBox>
                  </VuiBox>
                );
              })}
            </Fragment>
          );
        })}
      </VuiBox>
    </VuiBox>
  );
}

GradeSemanal.defaultProps = { feriados: [], onNovaCelula: null };
GradeSemanal.propTypes = {
  feriados: PropTypes.array,
  dias: PropTypes.arrayOf(PropTypes.string).isRequired,
  sessoes: PropTypes.array.isRequired,
  onSelecionar: PropTypes.func.isRequired,
  onNovaCelula: PropTypes.func,
};

export default GradeSemanal;
