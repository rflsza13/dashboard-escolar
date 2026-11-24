import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";
import IconButton from "@mui/material/IconButton";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";

import { IoSchool, IoCheckmarkDone, IoCloseCircle, IoRepeat, IoCalendar, IoCheckmark, IoClose, IoRibbonOutline } from "react-icons/io5";

import { useEscola } from "context/escola";
import {
  TIPO_CERTIFICADO, certificadosPendentes, cursosNoFim,
  alertasDeRisco, andamentoPorHorario, DEFAULT_CONFIG, feriadoDaData, formatarData, marcada, ehFalta, ehPresenca, escalaDoDia, faltasSemReposicao, fimDaAula, hojeIso, montarSessoes,
  rankingFaltas, segundaDaSemana, somarDias,
} from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import AulaDialog from "layouts/shared/AulaDialog";
import StatusChip from "layouts/shared/StatusChip";
import RelogioCard from "layouts/dashboard/components/RelogioCard";

const icone = (Comp) => <Comp size="22px" color="white" />;

function Dashboard() {
  const { dados, recursos, pode, user, marcarSessao, salvar, toast } = useEscola();
  const history = useHistory();
  const [aula, setAula] = useState(null);
  const hoje = hojeIso();
  const cfg = { ...DEFAULT_CONFIG, ...dados.config };

  const sessoesHoje = useMemo(() => montarSessoes(dados, hoje, hoje), [dados, hoje]);
  const segunda = segundaDaSemana(hoje);
  const sessoesSemana = useMemo(() => montarSessoes(dados, segunda, somarDias(segunda, 5)), [dados, segunda]);
  const horariosDoDia = useMemo(() => andamentoPorHorario(sessoesHoje), [sessoesHoje]);
  const feriadoHoje = feriadoDaData(dados, hoje);
  const ranking = useMemo(() => rankingFaltas(dados, hoje, Number(cfg.rankingDias) || 90, 8), [dados, hoje, cfg.rankingDias]);
  const semReposicao = useMemo(() => faltasSemReposicao(dados, hoje, 60), [dados, hoje]);
  const equipeHoje = useMemo(() => escalaDoDia(dados, hoje), [dados, hoje]);
  const emRisco = useMemo(() => (recursos.alertas ? alertasDeRisco(dados, cfg) : []), [dados, cfg, recursos.alertas]);
  // Na Home: apenas casos realmente urgentes (3 ou mais faltas seguidas consecutivas)
  const emRiscoUrgente = useMemo(
    () => emRisco.filter(({ motivos }) => motivos.some((m) => m.includes("faltas seguidas"))),
    [emRisco]
  );

  // cursos chegando ao fim e certificados a emitir
  const noFim = useMemo(() => cursosNoFim(dados), [dados]);
  const certificados = useMemo(() => certificadosPendentes(dados, hoje), [dados, hoje]);

  // atalho do card: presença ou falta sem abrir a janela da aula
  const marcarRapido = async (e, s, acao) => {
    e.stopPropagation();
    const ok = await marcarSessao(s, acao);
    if (ok) toast(acao === "Presente" ? `Presença de ${s.aluno} confirmada ✓` : `Falta de ${s.aluno} registrada`, acao === "Presente" ? "success" : "warning");
  };

  const marcarCertificado = async (c) => {
    if (!window.confirm(`Marcar o certificado de ${c.aluno} (${c.curso}) como emitido? O aviso some da tela inicial.`)) return;
    const id = await salvar("Movimentacoes", { data: hoje, alunoId: c.alunoId, matriculaId: c.matriculaId, tipo: TIPO_CERTIFICADO, motivo: "Certificado emitido", obs: "", registradoPor: user ? user.email : "" });
    if (id) toast(`Certificado de ${c.aluno} marcado como emitido ✓`, "success");
  };

  const presentesHoje = sessoesHoje.filter((s) => ehPresenca(s.status)).length;
  const faltasHoje = sessoesHoje.filter((s) => ehFalta(s.status)).length;
  const maxFaltas = ranking.length ? ranking[0].faltas : 1;

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />

        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} xl={6}>
              <RelogioCard />
            </Grid>
            <Grid item xs={12} md={6} xl={6}>
              <Card sx={{ height: "100%" }}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Grade semanal
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  {sessoesSemana.length} aula(s) nesta semana, de segunda a sábado.
                </VuiTypography>
                <VuiBox>
                  <VuiButton color="info" variant="contained" onClick={() => history.push("/horario")}>
                    <IoCalendar size="16px" style={{ marginRight: 8 }} />
                    Abrir horário das aulas
                  </VuiButton>
                </VuiBox>
              </Card>
            </Grid>
          </Grid>
        </VuiBox>

        {certificados.length > 0 && (
          <VuiBox mb={3}>
            <Card sx={{ borderLeft: "4px solid #FFD93D" }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="8px" mb="4px">
                <VuiBox display="flex" alignItems="center" gap="10px">
                  <IoRibbonOutline size="22px" color="#FFD93D" />
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    Certificados para emitir
                  </VuiTypography>
                </VuiBox>
                <VuiTypography variant="caption" sx={{ background: "rgba(255,217,61,0.16)", color: "#FFD93D", px: 1.2, py: 0.3, borderRadius: "20px", fontWeight: "bold" }}>
                  {certificados.length} {certificados.length === 1 ? "aluno concluiu" : "alunos concluíram"} o curso
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="button" color="text" fontWeight="regular" mb="14px" sx={{ display: "block" }}>
                Conclusões dos últimos 90 dias sem certificado emitido.
              </VuiTypography>
              <Grid container spacing={1.5}>
                {certificados.slice(0, 6).map((c) => (
                  <Grid item xs={12} md={6} xl={4} key={c.matriculaId}>
                    <VuiBox sx={{ p: "10px 12px", borderRadius: "12px", borderLeft: `4px solid ${c.cor}`, background: `${c.cor}1A`, height: "100%" }}>
                      <VuiTypography variant="button" color="white" fontWeight="medium" onClick={() => history.push(`/alunos/${c.alunoId}`)} sx={{ display: "block", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                        {c.aluno}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                        {c.curso} · concluído em {formatarData(c.concluidoEm)}
                      </VuiTypography>
                      {pode.admin && (
                        <VuiBox mt={1}>
                          <VuiButton size="small" color="success" variant="outlined" onClick={() => marcarCertificado(c)}>
                            Marcar como emitido
                          </VuiButton>
                        </VuiBox>
                      )}
                    </VuiBox>
                  </Grid>
                ))}
              </Grid>
              {certificados.length > 6 && (
                <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 1.5 }}>
                  + {certificados.length - 6} aluno(s) com certificado pendente.
                </VuiTypography>
              )}
            </Card>
          </VuiBox>
        )}

        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "aulas hoje", fontWeight: "regular" }} count={String(sessoesHoje.length)} percentage={{ color: "success", text: "" }} icon={{ color: "info", component: icone(IoSchool) }} />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "presenças hoje" }} count={String(presentesHoje)} percentage={{ color: "success", text: "" }} icon={{ color: "info", component: icone(IoCheckmarkDone) }} />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "faltas hoje" }} count={String(faltasHoje)} percentage={{ color: "error", text: "" }} icon={{ color: "info", component: icone(IoCloseCircle) }} />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "faltas sem reposição (60 dias)" }} count={String(semReposicao.length)} percentage={{ color: "warning", text: "" }} icon={{ color: "info", component: icone(IoRepeat) }} />
            </Grid>
          </Grid>
        </VuiBox>

        <Grid container spacing={3}>
          <Grid item xs={12} xl={8}>
            <Card>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                Andamento das aulas de hoje
              </VuiTypography>
              <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px" sx={{ display: "block" }}>
                Por horário, só o que ainda falta registrar. Passe o mouse sobre o aluno para marcar presença ou falta na hora, ou clique para ver mais opções (reposição, reagendar…).
              </VuiTypography>
              {feriadoHoje && (
                <VuiBox sx={{ mb: 2, p: "10px 14px", borderRadius: "12px", borderLeft: "4px solid #F5A524", background: "rgba(245,165,36,0.10)" }}>
                  <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block" }}>
                    {feriadoHoje.origem === "ferias" ? `Estamos em férias: ${feriadoHoje.nome}` : `Hoje é feriado: ${feriadoHoje.nome}`}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text">
                    {feriadoHoje.origem === "ferias" ? `Até ${formatarData(feriadoHoje.fim)}. ` : ""}As aulas regulares não aparecem hoje. Aulas avulsas, reposições e experimentais já marcadas continuam na lista.
                  </VuiTypography>
                </VuiBox>
              )}
              {horariosDoDia.length === 0 && (
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  {feriadoHoje ? (feriadoHoje.origem === "ferias" ? "Sem aulas durante as férias." : "Sem aulas hoje.") : "Nenhuma aula marcada para hoje."}
                </VuiTypography>
              )}
              {horariosDoDia.length > 0 && horariosDoDia.every((g) => g.sessoes.every((s) => marcada(s.status))) && (
                <VuiTypography variant="button" color="success" fontWeight="medium" sx={{ display: "block", mb: 2 }}>
                  Todas as aulas de hoje já foram registradas.
                </VuiTypography>
              )}
              {horariosDoDia.map((g) => {
                const pendentes = g.sessoes.filter((s) => !marcada(s.status));
                if (!pendentes.length) return null;
                const pct = g.total ? (g.marcadas / g.total) * 100 : 0;
                return (
                  <VuiBox key={g.hora} mb={3}>
                    <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb="6px">
                      <VuiBox display="flex" alignItems="baseline" gap="8px">
                        <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "16px" }}>
                          {g.hora}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text">
                          {pendentes.length} {pendentes.length === 1 ? "pendente" : "pendentes"}
                        </VuiTypography>
                      </VuiBox>
                      <VuiTypography variant="caption" color="text">
                        {g.marcadas}/{g.total} registradas · {g.presentes} presença(s) · {g.faltas} falta(s)
                      </VuiTypography>
                    </VuiBox>
                    <VuiProgress value={pct} color="info" sx={{ background: "#2A2A2A" }} />
                    <VuiBox mt={1.5}>
                      {pendentes.map((s) => (
                        <VuiBox
                          key={s.chave}
                          onClick={() => setAula(s)}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          gap="12px"
                          sx={{
                            cursor: "pointer",
                            p: "8px 10px",
                            mb: "6px",
                            borderRadius: "10px",
                            borderLeft: `4px solid ${s.cor}`,
                            background: `${s.cor}1A`,
                            minHeight: 52,
                            "&:hover": { background: `${s.cor}33` },
                            // no mouse, os botões aparecem ao passar por cima; no celular (sem hover) ficam sempre visíveis
                            "& .acoes-rapidas": { display: "none" },
                            "&:hover .acoes-rapidas": { display: "flex" },
                            ...(pode.professor
                              ? {
                                  "&:hover .chip-status": { display: "none" },
                                  "@media (hover: none)": { "& .acoes-rapidas": { display: "flex" }, "& .chip-status": { display: "none" } },
                                }
                              : {}),
                          }}
                        >
                          <VuiBox>
                            <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                              {s.aluno}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text">
                              {s.curso} · {s.tags.length ? s.tags.join(" · ") : "Aula regular"}
                              {fimDaAula(s.hora, s.duracao) ? ` · até ${fimDaAula(s.hora, s.duracao)}` : ""}
                              {s.moduloOrdem ? ` · módulo ${s.moduloOrdem}` : ""}
                              {s.professores.length ? ` · Prof.: ${s.professores.join(", ")}` : ""}
                            </VuiTypography>
                          </VuiBox>
                          <VuiBox className="chip-status" sx={{ display: "flex" }}>
                            <StatusChip status={s.status} />
                          </VuiBox>
                          {pode.professor && (
                            <VuiBox className="acoes-rapidas" sx={{ alignItems: "center", gap: "8px" }}>
                              <IconButton
                                size="small"
                                title="Marcar presença"
                                aria-label={`Marcar presença de ${s.aluno}`}
                                onClick={(e) => marcarRapido(e, s, "Presente")}
                                sx={{ width: 34, height: 34, color: "#fff", background: "#01B574", "&:hover": { background: "#019a63" } }}
                              >
                                <IoCheckmark size="18px" />
                              </IconButton>
                              <IconButton
                                size="small"
                                title="Marcar falta"
                                aria-label={`Marcar falta de ${s.aluno}`}
                                onClick={(e) => marcarRapido(e, s, "Falta")}
                                sx={{ width: 34, height: 34, color: "#fff", background: "#E31A1A", "&:hover": { background: "#bf1414" } }}
                              >
                                <IoClose size="18px" />
                              </IconButton>
                            </VuiBox>
                          )}
                        </VuiBox>
                      ))}
                    </VuiBox>
                  </VuiBox>
                );
              })}
            </Card>
          </Grid>

          <Grid item xs={12} xl={4}>
            <VuiBox sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                Cursos chegando ao fim
              </VuiTypography>
              <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                Alunos no último módulo ou com 80% do curso concluído
              </VuiTypography>
              {noFim.length === 0 && (
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Nenhum aluno perto de concluir o curso.
                </VuiTypography>
              )}
              {noFim.slice(0, 8).map((x) => (
                <VuiBox key={x.matriculaId} mb={2}>
                  <VuiBox display="flex" justifyContent="space-between" alignItems="baseline" gap="8px" mb="6px">
                    <VuiTypography variant="button" color="white" fontWeight="medium" onClick={() => history.push(`/alunos/${x.alunoId}`)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                      {x.aluno}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ textAlign: "right" }}>
                      {x.restantes === 1 ? "falta 1 módulo" : `faltam ${x.restantes} módulos`}
                    </VuiTypography>
                  </VuiBox>
                  <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "6px" }}>
                    {x.curso} · {x.concluidos}/{x.total} módulos{x.moduloAtual ? ` · atual: ${x.moduloAtual}` : ""}
                  </VuiTypography>
                  <VuiBox sx={{ height: 6, borderRadius: 3, background: "#2A2A2A" }}>
                    <VuiBox sx={{ height: 6, borderRadius: 3, width: `${Math.round(x.pct * 100)}%`, background: x.cor }} />
                  </VuiBox>
                </VuiBox>
              ))}
              {noFim.length > 8 && (
                <VuiTypography variant="caption" color="text">
                  + {noFim.length - 8} aluno(s). Veja na lista de Alunos.
                </VuiTypography>
              )}
            </Card>
            <Card>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                Alunos que mais faltam
              </VuiTypography>
              <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px" sx={{ display: "block" }}>
                Últimos {cfg.rankingDias} dias
              </VuiTypography>
              {ranking.length === 0 && (
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Nenhuma falta registrada no período.
                </VuiTypography>
              )}
              {ranking.map((r, i) => (
                <VuiBox key={r.alunoId} mb={2}>
                  <VuiBox display="flex" justifyContent="space-between" mb="6px">
                    <VuiTypography variant="button" color="white" fontWeight="medium" onClick={() => history.push(`/alunos/${r.alunoId}`)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                      {i + 1}. {r.nome}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {r.faltas} falta(s) em {r.total} aula(s) · {Math.round(r.pct * 100)}%
                    </VuiTypography>
                  </VuiBox>
                  <VuiBox sx={{ height: 6, borderRadius: 3, background: "#2A2A2A" }}>
                    <VuiBox sx={{ height: 6, borderRadius: 3, width: `${(r.faltas / maxFaltas) * 100}%`, background: "#E31A1A" }} />
                  </VuiBox>
                </VuiBox>
              ))}
            </Card>
            {recursos.alertas && emRiscoUrgente.length > 0 && (
              <Card sx={{ borderLeft: "4px solid #E31A1A" }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb="4px">
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    Alunos em risco crítico
                  </VuiTypography>
                  <VuiTypography variant="caption" sx={{ background: "rgba(227,36,43,0.18)", color: "#ff5a4f", px: 1.2, py: 0.3, borderRadius: "20px", fontWeight: "bold" }}>
                    Urgente
                  </VuiTypography>
                </VuiBox>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  Alunos com 3 ou mais faltas seguidas sem reposição
                </VuiTypography>
                {emRiscoUrgente.slice(0, 8).map(({ aluno, motivos }) => (
                  <VuiBox key={aluno.id} onClick={() => history.push(`/alunos/${aluno.id}`)} sx={{ cursor: "pointer", mb: "10px", p: "8px 10px", borderRadius: "12px", background: "rgba(227,36,43,0.08)", "&:hover": { background: "rgba(227,36,43,0.16)" } }}>
                    <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                      {aluno.nome}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {motivos.join(" · ")}
                    </VuiTypography>
                  </VuiBox>
                ))}
                {emRiscoUrgente.length > 8 && (
                  <VuiTypography variant="caption" color="text">
                    + {emRiscoUrgente.length - 8} aluno(s). Veja na página de Relatórios.
                  </VuiTypography>
                )}
              </Card>
            )}
            {recursos.professores && (
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Professores hoje
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  Conforme a escala cadastrada
                </VuiTypography>
                {equipeHoje.length === 0 && (
                  <VuiTypography variant="button" color="text" fontWeight="regular">
                    Nenhum professor escalado para hoje.
                  </VuiTypography>
                )}
                {equipeHoje.map((e) => (
                  <VuiBox key={e.professor.id} display="flex" alignItems="flex-start" gap="10px" mb={1.5}>
                    <VuiBox sx={{ width: 10, height: 10, borderRadius: "50%", background: /^#[0-9a-fA-F]{6}$/.test(e.professor.cor || "") ? e.professor.cor : "#F2F2F2", mt: "6px", flexShrink: 0 }} />
                    <VuiBox>
                      <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                        {e.professor.nome}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {e.faixas.map((f) => `${f.inicio}–${f.fim}${f.curso ? ` (${f.curso})` : ""}`).join(" · ")}
                      </VuiTypography>
                    </VuiBox>
                  </VuiBox>
                ))}
                <VuiBox mt={1}>
                  <VuiButton size="small" color="info" variant="text" onClick={() => history.push("/professores")}>
                    Ver escala dos professores
                  </VuiButton>
                </VuiBox>
              </Card>
            )}
            </VuiBox>
          </Grid>
        </Grid>
      </VuiBox>
      <AulaDialog sessao={aula} onClose={() => setAula(null)} />
    </DashboardLayout>
  );
}

export default Dashboard;
