import { useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";

import { IoArrowBack, IoCheckmarkDone, IoCloseCircle, IoStatsChart, IoTrophy, IoAdd } from "react-icons/io5";

import { useEscola } from "context/escola";
import { DIAS_LONGOS, DURACAO_AULA, DURACAO_EXPERIMENTAL, formatarData, frequenciaAcumulada, indexarAulas, resumoAluno, serieMensal } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import StatusChip from "layouts/shared/StatusChip";
import Tabela, { texto } from "layouts/shared/Tabela";
import { AlunoDialog, MatriculaDialog } from "layouts/shared/CadastroDialogs";
import { RoscaModulos, PresencaMensalChart, FrequenciaChart } from "layouts/alunos/components/Graficos";
import { corPresenca } from "layouts/alunos";

const icone = (Comp) => <Comp size="22px" color="white" />;
const COR_ESTADO = { concluido: "#01B574", atual: "#FFFFFF", pendente: "#3F3F3F" };
const TXT_ESTADO = { concluido: "Concluído", atual: "Em andamento", pendente: "A cursar" };

function FichaAluno() {
  const { id } = useParams();
  const history = useHistory();
  const { dados, pode, concluirModulo, recursos } = useEscola();
  const [editar, setEditar] = useState(false);
  const [mat, setMat] = useState({ open: false, matricula: null });
  const [limite, setLimite] = useState(15);
  const [filtroStatusHist, setFiltroStatusHist] = useState("Todos");
  const [concluindo, setConcluindo] = useState("");

  const aluno = dados.alunos.find((a) => a.id === id);
  const idx = useMemo(() => indexarAulas(dados), [dados]);
  const r = useMemo(() => (aluno ? resumoAluno(dados, id, idx) : null), [dados, id, idx, aluno]);
  const serie = useMemo(() => serieMensal(r ? r.aulas : []), [r]);
  const freq = useMemo(() => frequenciaAcumulada(r ? r.aulas : []), [r]);
  const pontosAluno = useMemo(() => dados.pontos.filter((p) => p.alunoId === id).sort((a, b) => b.data.localeCompare(a.data)), [dados.pontos, id]);

  const historico = useMemo(() => {
    if (!r) return [];
    const mats = dados.matriculas.reduce((m, x) => ({ ...m, [x.id]: x }), {});
    const cursos = dados.cursos.reduce((m, x) => ({ ...m, [x.id]: x }), {});
    return r.aulas
      .filter((a) => a.data)
      .map((a) => ({ ...a, curso: (cursos[(mats[a.matriculaId] || {}).cursoId] || {}).nome || "—" }))
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [r, dados.matriculas, dados.cursos]);

  if (!aluno) {
    return (
      <DashboardLayout>
        <VuiBox py={3}>
          <BarraStatus />
          <VuiTypography variant="button" color="text" sx={{ display: "block", mb: 2 }}>
            Aluno não encontrado.
          </VuiTypography>
          <VuiButton color="info" variant="outlined" onClick={() => history.push("/alunos")}>
            Voltar para a lista
          </VuiButton>
        </VuiBox>
      </DashboardLayout>
    );
  }

  const concluir = async (m, prog) => {
    const atual = prog.atual && prog.atual.modulo;
    if (!atual) return;
    const pts = atual.pontos !== null && atual.pontos !== "" && atual.pontos !== undefined ? atual.pontos : dados.config.pontosPadrao;
    if (!window.confirm(`Concluir o módulo ${atual.ordem} (${atual.nome})?${recursos.pontos ? ` ${aluno.nome} ganha ${pts} ponto(s).` : ""}`)) return;
    setConcluindo(m.id);
    await concluirModulo(m.id);
    setConcluindo("");
  };

  const colunasHist = [{ nome: "Data" }, { nome: "Curso" }, { nome: "Tipo" }, { nome: "Módulo" }, { nome: "Situação" }];
  const historicoFiltrado = useMemo(() => {
    return historico.filter((a) => {
      const st = a.status || (a.tipo === "Reposição" ? "Reposição agendada" : "Agendada");
      if (filtroStatusHist === "Presente") return st === "Presente" || st === "Reposição realizada";
      if (filtroStatusHist === "Falta") return st === "Falta";
      return true;
    });
  }, [historico, filtroStatusHist]);

  const linhasHist = historicoFiltrado.slice(0, limite).map((a) => ({
    chave: a.id,
    celulas: [texto(formatarData(a.data)), texto(a.curso, "white"), texto(a.tipo || "Regular"), texto(a.modulo ? `Módulo ${a.modulo}` : "—"), <StatusChip key="s" status={a.status || (a.tipo === "Reposição" ? "Reposição agendada" : "Agendada")} />],
  }));

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />

        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiButton size="small" color="info" variant="text" onClick={() => history.push("/alunos")} sx={{ mb: 1 }}>
              <IoArrowBack size="14px" style={{ marginRight: 4 }} />
              Alunos
            </VuiButton>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              {aluno.nome}
              {aluno.ativo === "Não" ? " (inativo)" : ""}
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              {[aluno.responsavel && `Responsável: ${aluno.responsavel}`, aluno.contato, aluno.obs].filter(Boolean).join(" · ") || "Sem contato cadastrado"}
            </VuiTypography>
          </VuiBox>
          {pode.admin && (
            <VuiBox display="flex" gap="8px" flexWrap="wrap">
              <VuiButton size="small" color="info" variant="outlined" onClick={() => setEditar(true)}>
                Editar dados
              </VuiButton>
              <VuiButton size="small" color="info" variant="contained" onClick={() => setMat({ open: true, matricula: null })}>
                <IoAdd size="14px" style={{ marginRight: 4 }} />
                Nova matrícula
              </VuiButton>
            </VuiBox>
          )}
        </VuiBox>

        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "presença", fontWeight: "regular" }} count={r.pctPresenca === null ? "—" : `${Math.round(r.pctPresenca * 100)}%`} percentage={{ color: r.pctPresenca !== null && r.pctPresenca < 0.7 ? "error" : "success", text: "" }} icon={{ color: "info", component: icone(IoStatsChart) }} />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "presenças" }} count={String(r.presencas)} percentage={{ color: "success", text: r.reposicoes ? `${r.reposicoes} em reposição` : "" }} icon={{ color: "info", component: icone(IoCheckmarkDone) }} />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "faltas" }} count={String(r.faltas)} percentage={{ color: "error", text: "" }} icon={{ color: "info", component: icone(IoCloseCircle) }} />
            </Grid>
            {recursos.pontos && (
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard title={{ text: "pontos (saldo)" }} count={String(r.saldo)} percentage={{ color: "success", text: "" }} icon={{ color: "info", component: icone(IoTrophy) }} />
            </Grid>
            )}
          </Grid>
        </VuiBox>

        {r.matriculas.length === 0 && (
          <Card sx={{ mb: 3 }}>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Este aluno ainda não tem matrícula.
            </VuiTypography>
          </Card>
        )}

        {r.matriculas.map(({ matricula: m, curso, progresso }) => (
          <VuiBox key={m.id} mb={3}>
            <Card>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                  <VuiBox display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="8px" mb={1}>
                    <VuiBox display="flex" alignItems="center" gap="10px">
                      <VuiBox sx={{ width: 14, height: 14, borderRadius: "4px", background: curso.cor || "#E3242B" }} />
                      <VuiTypography variant="lg" color="white" fontWeight="bold">
                        {curso.nome}
                      </VuiTypography>
                    </VuiBox>
                    <VuiTypography variant="caption" color="text" sx={{ border: "1px solid #3A3A3A", borderRadius: "20px", p: "2px 10px" }}>
                      {m.status}
                    </VuiTypography>
                  </VuiBox>
                  <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block" }}>
                    {DIAS_LONGOS[m.dia] || m.dia}, {m.inicio} · {m.status === "Experimental" ? DURACAO_EXPERIMENTAL : DURACAO_AULA} min · {m.modalidade}
                    {m.dataInicio ? ` · desde ${formatarData(m.dataInicio)}` : ""}
                  </VuiTypography>

                  {m.status === "Experimental" ? (
                    <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block", mt: 2 }}>
                      Aula experimental. Para matricular o aluno de vez, edite esta matrícula e mude a situação para Ativa (e marque o aluno como ativo).
                    </VuiTypography>
                  ) : (
                    <>
                      <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block", mt: 2, mb: 1.5 }}>
                        {m.status === "Concluída" ? "Curso concluído" : progresso.atual ? `Módulo atual: ${progresso.atual.modulo.ordem} de ${progresso.total} · ${progresso.atual.modulo.nome}` : "Sem módulos cadastrados para este curso"}
                      </VuiTypography>
                      {progresso.itens.map((i) => (
                        <VuiBox key={i.modulo.id} display="flex" alignItems="center" justifyContent="space-between" gap="12px" sx={{ p: "6px 10px", mb: "4px", borderRadius: "10px", borderLeft: `4px solid ${COR_ESTADO[i.estado]}`, background: `${COR_ESTADO[i.estado]}1A` }}>
                          <VuiTypography variant="caption" color="white" fontWeight="medium">
                            {i.modulo.ordem}. {i.modulo.nome}
                          </VuiTypography>
                          <VuiTypography variant="caption" color="text">
                            {TXT_ESTADO[i.estado]}
                            {i.data ? ` em ${formatarData(i.data)}` : ""}
                          </VuiTypography>
                        </VuiBox>
                      ))}
                    </>
                  )}

                  <VuiBox display="flex" flexWrap="wrap" gap="8px" mt={2}>
                    {pode.professor && m.status === "Ativa" && progresso.atual && (
                      <VuiButton size="small" color="info" variant="contained" disabled={concluindo === m.id} onClick={() => concluir(m, progresso)}>
                        {concluindo === m.id ? "Concluindo…" : "Concluir módulo atual"}
                      </VuiButton>
                    )}
                    {pode.admin && (
                      <VuiButton size="small" color="info" variant="outlined" onClick={() => setMat({ open: true, matricula: m })}>
                        Editar matrícula
                      </VuiButton>
                    )}
                  </VuiBox>
                </Grid>
                <Grid item xs={12} lg={5}>
                  <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block", textAlign: "center" }}>
                    Andamento no curso
                  </VuiTypography>
                  <VuiBox sx={{ height: 280 }}>
                    {progresso.total > 0 ? (
                      <RoscaModulos itens={progresso.itens} concluidos={progresso.concluidos} total={progresso.total} />
                    ) : (
                      <VuiTypography variant="caption" color="text" sx={{ display: "block", textAlign: "center", mt: 8 }}>
                        Cadastre os módulos do curso para ver o gráfico.
                      </VuiTypography>
                    )}
                  </VuiBox>
                  <VuiBox display="flex" justifyContent="center" gap="14px" flexWrap="wrap">
                    {["concluido", "atual", "pendente"].map((e) => (
                      <VuiBox key={e} display="flex" alignItems="center" gap="6px">
                        <VuiBox sx={{ width: 10, height: 10, borderRadius: "3px", background: COR_ESTADO[e] }} />
                        <VuiTypography variant="caption" color="text">
                          {TXT_ESTADO[e]}
                        </VuiTypography>
                      </VuiBox>
                    ))}
                  </VuiBox>
                </Grid>
              </Grid>
            </Card>
          </VuiBox>
        ))}

        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Presenças e faltas por mês
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  Últimos 12 meses com aulas registradas
                </VuiTypography>
                <VuiBox sx={{ height: 260 }}>
                  {serie.labels.length ? <PresencaMensalChart serie={serie} /> : texto("Ainda não há aulas registradas.")}
                </VuiBox>
              </Card>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Frequência acumulada
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  % de presença ao longo das aulas
                  {r.pctPresenca !== null && (
                    <span style={{ color: corPresenca(r.pctPresenca) }}> · hoje {Math.round(r.pctPresenca * 100)}%</span>
                  )}
                </VuiTypography>
                <VuiBox sx={{ height: 260 }}>{freq.labels.length ? <FrequenciaChart freq={freq} /> : texto("Ainda não há aulas registradas.")}</VuiBox>
              </Card>
            </Grid>
          </Grid>
        </VuiBox>

        <Grid container spacing={3}>
          <Grid item xs={12} xl={8}>
            <Card>
              <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="10px" mb="16px">
                <VuiTypography variant="lg" color="white" fontWeight="bold">
                  Histórico de aulas
                </VuiTypography>
                <VuiBox display="flex" gap="6px">
                  {["Todos", "Presente", "Falta"].map((st) => (
                    <VuiButton
                      key={st}
                      size="small"
                      color="info"
                      variant={filtroStatusHist === st ? "contained" : "outlined"}
                      onClick={() => setFiltroStatusHist(st)}
                      sx={{ py: 0.4, px: 1.5, fontSize: "11px", textTransform: "none" }}
                    >
                      {st}
                    </VuiButton>
                  ))}
                </VuiBox>
              </VuiBox>
              <Tabela colunas={colunasHist} linhas={linhasHist} vazio="Nenhuma aula registrada." />
              {historicoFiltrado.length > limite && (
                <VuiBox mt={2}>
                  <VuiButton size="small" color="info" variant="outlined" onClick={() => setLimite((l) => l + 15)}>
                    Mostrar mais
                  </VuiButton>
                </VuiBox>
              )}
            </Card>
          </Grid>
          {recursos.pontos && (
            <Grid item xs={12} xl={4}>
              <Card sx={{ height: "100%" }}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Pontos
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px" sx={{ display: "block" }}>
                  Saldo: {r.saldo} ponto(s)
                </VuiTypography>
                {pontosAluno.length === 0 && texto("Nenhum lançamento.")}
                {pontosAluno.slice(0, 8).map((p) => (
                  <VuiBox key={p.id} display="flex" justifyContent="space-between" gap="12px" mb={1.5}>
                    <VuiBox>
                      <VuiTypography variant="button" color="white" fontWeight="regular" sx={{ display: "block" }}>
                        {p.descricao || p.tipo}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {formatarData(p.data)}
                      </VuiTypography>
                    </VuiBox>
                    <VuiTypography variant="button" fontWeight="bold" sx={{ color: p.tipo === "Resgate" ? "#E31A1A" : "#01B574", whiteSpace: "nowrap" }}>
                      {p.tipo === "Resgate" ? "−" : "+"}
                      {p.pontos}
                    </VuiTypography>
                  </VuiBox>
                ))}
                <VuiButton size="small" color="info" variant="text" onClick={() => history.push("/pontos")}>
                  Ver pontos de todos os alunos
                </VuiButton>
              </Card>
            </Grid>
          )}
        </Grid>
      </VuiBox>
      <AlunoDialog open={editar} aluno={aluno} onClose={() => setEditar(false)} />
      <MatriculaDialog open={mat.open} matricula={mat.matricula} alunoId={aluno.id} onClose={() => setMat({ open: false, matricula: null })} />
    </DashboardLayout>
  );
}

export default FichaAluno;
