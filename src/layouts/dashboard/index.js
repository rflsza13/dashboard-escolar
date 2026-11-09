import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";

import { IoSchool, IoCheckmarkDone, IoCloseCircle, IoRepeat, IoCalendar } from "react-icons/io5";

import { useEscola } from "context/escola";
import {
  alertasDeRisco, andamentoPorCurso, DEFAULT_CONFIG, ehFalta, ehPresenca, escalaDoDia, faltasSemReposicao, fimDaAula, hojeIso, montarSessoes,
  rankingFaltas, segundaDaSemana, somarDias,
} from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import AulaDialog from "layouts/shared/AulaDialog";
import StatusChip from "layouts/shared/StatusChip";
import RelogioCard from "layouts/dashboard/components/RelogioCard";

const icone = (Comp) => <Comp size="22px" color="white" />;

function Dashboard() {
  const { dados, recursos } = useEscola();
  const history = useHistory();
  const [aula, setAula] = useState(null);
  const hoje = hojeIso();
  const cfg = { ...DEFAULT_CONFIG, ...dados.config };

  const sessoesHoje = useMemo(() => montarSessoes(dados, hoje, hoje), [dados, hoje]);
  const segunda = segundaDaSemana(hoje);
  const sessoesSemana = useMemo(() => montarSessoes(dados, segunda, somarDias(segunda, 5)), [dados, segunda]);
  const cursosDoDia = useMemo(() => andamentoPorCurso(sessoesHoje), [sessoesHoje]);
  const ranking = useMemo(() => rankingFaltas(dados, hoje, Number(cfg.rankingDias) || 90, 8), [dados, hoje, cfg.rankingDias]);
  const semReposicao = useMemo(() => faltasSemReposicao(dados, hoje, 60), [dados, hoje]);
  const equipeHoje = useMemo(() => escalaDoDia(dados, hoje), [dados, hoje]);
  const emRisco = useMemo(() => (recursos.alertas ? alertasDeRisco(dados, cfg) : []), [dados, cfg, recursos.alertas]);

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
                Andamento dos cursos de hoje
              </VuiTypography>
              <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px" sx={{ display: "block" }}>
                Clique em um aluno para marcar presença, falta ou reposição.
              </VuiTypography>
              {cursosDoDia.length === 0 && (
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Nenhuma aula marcada para hoje.
                </VuiTypography>
              )}
              {cursosDoDia.map((g) => {
                const pct = g.total ? (g.marcadas / g.total) * 100 : 0;
                return (
                  <VuiBox key={g.cursoId} mb={3}>
                    <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb="6px">
                      <VuiBox display="flex" alignItems="center" gap="8px">
                        <VuiBox sx={{ width: 10, height: 10, borderRadius: "3px", background: g.sessoes[0].cor }} />
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {g.curso}
                        </VuiTypography>
                      </VuiBox>
                      <VuiTypography variant="caption" color="text">
                        {g.marcadas}/{g.total} registradas · {g.presentes} presença(s) · {g.faltas} falta(s)
                      </VuiTypography>
                    </VuiBox>
                    <VuiProgress value={pct} color="info" sx={{ background: "#2A2A2A" }} />
                    <VuiBox mt={1.5}>
                      {g.sessoes.map((s) => (
                        <VuiBox
                          key={s.chave}
                          onClick={() => setAula(s)}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          gap="12px"
                          sx={{ cursor: "pointer", p: "8px 10px", mb: "6px", borderRadius: "10px", borderLeft: `4px solid ${s.cor}`, background: `${s.cor}1A`, "&:hover": { background: `${s.cor}33` } }}
                        >
                          <VuiBox>
                            <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                              {s.hora}
                              {fimDaAula(s.hora, s.duracao) ? `–${fimDaAula(s.hora, s.duracao)}` : ""} · {s.aluno}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text">
                              {s.tags.length ? s.tags.join(" · ") : "Aula regular"}
                              {s.moduloOrdem ? ` · módulo ${s.moduloOrdem}` : ""}
                              {s.professores.length ? ` · Prof.: ${s.professores.join(", ")}` : ""}
                            </VuiTypography>
                          </VuiBox>
                          <StatusChip status={s.status} />
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
            {recursos.alertas && (
              <Card sx={{ borderLeft: "4px solid #F5A524" }}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Alunos em risco
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  {cfg.riscoFaltasSeguidas} faltas seguidas ou {cfg.riscoReposicoes} reposições pendentes
                </VuiTypography>
                {emRisco.length === 0 && (
                  <VuiTypography variant="caption" color="text">
                    Nenhum aluno em risco agora.
                  </VuiTypography>
                )}
                {emRisco.slice(0, 8).map(({ aluno, motivos }) => (
                  <VuiBox key={aluno.id} onClick={() => history.push(`/alunos/${aluno.id}`)} sx={{ cursor: "pointer", mb: "10px", p: "8px 10px", borderRadius: "12px", background: "rgba(245,165,36,0.08)" }}>
                    <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                      {aluno.nome}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {motivos.join(" · ")}
                    </VuiTypography>
                  </VuiBox>
                ))}
                {emRisco.length > 8 && (
                  <VuiTypography variant="caption" color="text">
                    + {emRisco.length - 8} aluno(s). Veja na lista de Alunos (marca RISCO).
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
