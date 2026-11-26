import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import { Card, Grid } from "@mui/material";
import {
  IoDownloadOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoTrendingUp,
  IoPeopleOutline,
  IoTimeOutline,
  IoRibbonOutline,
  IoMaleFemaleOutline,
  IoPersonRemoveOutline,
  IoPersonAddOutline,
  IoCallOutline,
  IoSchoolOutline,
} from "react-icons/io5";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import BarraStatus from "layouts/shared/BarraStatus";
import { useEscola } from "context/escola";
import { calcularMetricasGerais, formatarData } from "utils/escola";
import {
  conclusoesCertificados,
  cargaPorProfessor,
  evolucaoPorPeriodo,
  faltasPorDiaHorario,
  funilExperimentais,
  janelaDoPeriodo,
  ocupacaoGrade,
  performanceAgrupada,
  reposicoes,
  resumoPeriodo,
  saidasPorMotivo,
  tempoPorModulo,
} from "utils/relatorios";
import { BarraDistribuicao, CardKpi, Seta, Variacao } from "layouts/relatorios/componentes";
import {
  CargaProfessor,
  ConclusoesCertificados,
  EvolucaoMensal,
  FaltasDiaHorario,
  FunilExperimentais,
  OcupacaoGrade,
  PerformanceAgrupada,
  Reposicoes,
  SaidasPorMotivo,
  TempoPorModulo,
} from "layouts/relatorios/secoes";

const OPCOES_PERIODO = [
  { rotulo: "Últimos 30 dias", valor: 30 },
  { rotulo: "Últimos 90 dias", valor: 90 },
  { rotulo: "Este ano", valor: 365 },
  { rotulo: "Histórico completo", valor: null },
];

export default function Relatorios() {
  const { dados, recursos } = useEscola();
  const history = useHistory();
  const [periodo, setPeriodo] = useState(30);

  const m = useMemo(() => calcularMetricasGerais(dados, periodo), [dados, periodo]);

  // análises da build 1.1.3 (todas recalculadas quando os dados ou o período mudam)
  const j = useMemo(() => janelaDoPeriodo(periodo), [periodo]);
  const atual = useMemo(() => resumoPeriodo(dados, j, false), [dados, j]);
  const anterior = useMemo(() => (j.anterior ? resumoPeriodo(dados, j.anterior, false) : null), [dados, j]);
  const funil = useMemo(() => funilExperimentais(dados, j, true), [dados, j]);
  const evolucao = useMemo(() => evolucaoPorPeriodo(dados, periodo), [dados, periodo]);
  const motivos = useMemo(() => saidasPorMotivo(dados, j), [dados, j]);
  const faltasDH = useMemo(() => faltasPorDiaHorario(dados, j), [dados, j]);
  const repos = useMemo(() => reposicoes(dados, j), [dados, j]);
  const ocupacao = useMemo(() => ocupacaoGrade(dados), [dados]);
  const carga = useMemo(() => (recursos.professores ? cargaPorProfessor(dados, j) : []), [dados, j, recursos.professores]);
  const tempoModulos = useMemo(() => tempoPorModulo(dados), [dados]);
  const concl = useMemo(() => conclusoesCertificados(dados, j), [dados, j]);
  const grupos = useMemo(() => performanceAgrupada(dados, j), [dados, j]);
  const abrirAluno = (id) => history.push(`/alunos/${id}`);

  const imprimirPdf = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      {/* Estilos para impressão limpa do relatório em PDF */}
      <style>
        {`
          @media print {
            body { background: #fff !important; color: #000 !important; }
            body::before { display: none !important; }
            nav, header, .sidenav, button, .nao-imprimir { display: none !important; }
            .MuiCard-root {
              background: #fff !important;
              color: #000 !important;
              border: 1px solid #ccc !important;
              box-shadow: none !important;
              page-break-inside: avoid;
              margin-bottom: 16px !important;
            }
            .MuiTypography-root { color: #111 !important; }
            .MuiTypography-caption { color: #555 !important; }
            .acordeon-conteudo { display: block !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border-bottom: 1px solid #ddd !important; padding: 6px !important; color: #111 !important; }
          }
        `}
      </style>

      <VuiBox py={3}>
        <BarraStatus />

        {/* Cabeçalho */}
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3} className="nao-imprimir">
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Relatório Geral & Indicadores
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Métricas consolidadas de permanência, retenção, presença e performance
            </VuiTypography>
          </VuiBox>

          <VuiBox display="flex" flexWrap="wrap" alignItems="center" gap="10px">
            {/* Seletor de Período */}
            <VuiBox display="flex" gap="6px" sx={{ background: "rgba(18,18,24,0.7)", p: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              {OPCOES_PERIODO.map((op) => {
                const ativo = periodo === op.valor;
                return (
                  <VuiButton
                    key={String(op.valor)}
                    size="small"
                    color="info"
                    variant={ativo ? "contained" : "text"}
                    onClick={() => setPeriodo(op.valor)}
                    sx={{
                      borderRadius: "7px",
                      px: 1.5,
                      py: 0.6,
                      fontSize: "11px",
                      textTransform: "none",
                      fontWeight: ativo ? 700 : 500,
                    }}
                  >
                    {op.rotulo}
                  </VuiButton>
                );
              })}
            </VuiBox>

            {/* Botão Baixar em PDF */}
            <VuiButton size="small" color="info" variant="outlined" onClick={imprimirPdf} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: "bold" }}>
              <IoDownloadOutline size="16px" style={{ marginRight: 6 }} />
              Baixar relatório em PDF
            </VuiButton>
          </VuiBox>
        </VuiBox>

        {/* 1. CARDS DE KPIS PRINCIPAIS */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Alunos Ativos"
              valor={m.alunosAtivos}
              detalhe={`${m.alunosInativos} saíram · ${m.alunosConcluidos || 0} formados`}
              icone={IoPeopleOutline}
              cor="#2CD9FF"
              extra={
                anterior && (
                  <Seta
                    sentido={atual.saldo > 0 ? "up" : atual.saldo < 0 ? "down" : "igual"}
                    bom={atual.saldo === 0 ? null : atual.saldo > 0}
                    texto={`saldo de ${atual.saldo > 0 ? "+" : ""}${atual.saldo} no período (${atual.novos} novos, ${atual.saidas} saídas)`}
                  />
                )
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Permanência Média"
              valor={`${m.permanenciaMediaMeses} meses`}
              detalhe="Tempo médio de casa por aluno"
              icone={IoTimeOutline}
              cor="#A060FF"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Taxa de Retenção"
              valor={`${m.taxaRetencao}%`}
              detalhe={`Evasão de ${m.taxaEvasao}% no período`}
              icone={IoTrendingUp}
              cor="#01B574"
              extra={anterior && <Variacao atual={atual.saidas} anterior={anterior.saidas} sufixo=" saída(s)" melhorSeMenor />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Frequência Média"
              valor={`${m.taxaPresenca}%`}
              detalhe={`${m.totalPresencas} presenças / ${m.totalFaltas} faltas`}
              icone={IoCheckmarkCircleOutline}
              cor="#38D79F"
              extra={anterior && <Variacao atual={atual.frequencia} anterior={anterior.frequencia} sufixo=" pp" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Conversão Exp."
              valor={`${m.taxaConversaoExp}%`}
              detalhe={`${m.matriculadosExp} de ${m.expRealizadas} realizadas (${m.totalExp} marcadas)`}
              icone={IoRibbonOutline}
              cor="#FFB547"
              extra={anterior && <Variacao atual={atual.conversaoExp} anterior={anterior.conversaoExp} sufixo=" pp" />}
            />
          </Grid>
        </Grid>

        {/* 2. EVOLUÇÃO DE ALUNOS (segue o período escolhido) E SAÍDAS POR MOTIVO */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} lg={8}>
            <EvolucaoMensal serie={evolucao.pontos} descricao={evolucao.descricao} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <SaidasPorMotivo dados={motivos} />
          </Grid>
        </Grid>

        {/* 2. DEMOGRAFIA, GÊNERO E TEMPO DE CASA */}
        <Grid container spacing={2.5} mb={3}>
          {/* Faixa Etária */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <VuiBox mb={2}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
                  Perfil por Faixa Etária
                </VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                  Distribuição dos alunos ativos por idade
                </VuiTypography>
              </VuiBox>
              <VuiBox mt={2}>
                {Object.entries(m.faixasEtarias).map(([faixa, qtd]) => (
                  <BarraDistribuicao
                    key={faixa}
                    rotulo={faixa}
                    total={qtd}
                    totalGeral={m.alunosAtivos}
                    cor={
                      faixa.startsWith("Kids")
                        ? "#2CD9FF"
                        : faixa.startsWith("Teens")
                        ? "#01B574"
                        : faixa.startsWith("Jovens")
                        ? "#FFB547"
                        : faixa.startsWith("Adultos")
                        ? "#A060FF"
                        : "rgba(255,255,255,0.3)"
                    }
                  />
                ))}
              </VuiBox>
            </Card>
          </Grid>

          {/* Meninos e Meninas (Distribuição de Gênero) */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <VuiBox>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
                    Meninos e Meninas
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                    Proporção de gênero entre alunos ativos
                  </VuiTypography>
                </VuiBox>
                <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: "rgba(44,217,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2CD9FF" }}>
                  <IoMaleFemaleOutline size="18px" />
                </VuiBox>
              </VuiBox>

              {/* Barra de comparação dupla (Segmentada Meninos vs Meninas) */}
              <VuiBox mb={2.5}>
                <VuiBox
                  sx={{
                    width: "100%",
                    height: 14,
                    borderRadius: "7px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    overflow: "hidden",
                    display: "flex",
                    mb: 1,
                  }}
                >
                  <VuiBox
                    title={`Meninos: ${m.distribuicaoGenero.meninos} (${m.distribuicaoGenero.pctMeninos}%)`}
                    sx={{
                      width: `${m.distribuicaoGenero.pctMeninos}%`,
                      height: "100%",
                      backgroundColor: "#2CD9FF",
                      boxShadow: "0 0 8px rgba(44,217,255,0.4)",
                      transition: "width 0.6s ease",
                    }}
                  />
                  <VuiBox
                    title={`Meninas: ${m.distribuicaoGenero.meninas} (${m.distribuicaoGenero.pctMeninas}%)`}
                    sx={{
                      width: `${m.distribuicaoGenero.pctMeninas}%`,
                      height: "100%",
                      backgroundColor: "#F883DD",
                      boxShadow: "0 0 8px rgba(248,131,221,0.4)",
                      transition: "width 0.6s ease",
                    }}
                  />
                  {m.distribuicaoGenero.pctNaoInformado > 0 && (
                    <VuiBox
                      title={`Não informado: ${m.distribuicaoGenero.naoInformado} (${m.distribuicaoGenero.pctNaoInformado}%)`}
                      sx={{
                        width: `${m.distribuicaoGenero.pctNaoInformado}%`,
                        height: "100%",
                        backgroundColor: "rgba(255,255,255,0.25)",
                      }}
                    />
                  )}
                </VuiBox>
              </VuiBox>

              {/* Detalhamento individual das barras */}
              <VuiBox>
                <BarraDistribuicao
                  rotulo="Meninos (Masculino)"
                  total={m.distribuicaoGenero.meninos}
                  totalGeral={m.alunosAtivos}
                  cor="#2CD9FF"
                />
                <BarraDistribuicao
                  rotulo="Meninas (Feminino)"
                  total={m.distribuicaoGenero.meninas}
                  totalGeral={m.alunosAtivos}
                  cor="#F883DD"
                />
                {m.distribuicaoGenero.naoInformado > 0 && (
                  <BarraDistribuicao
                    rotulo="Não informado"
                    total={m.distribuicaoGenero.naoInformado}
                    totalGeral={m.alunosAtivos}
                    cor="rgba(255,255,255,0.3)"
                  />
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Tempo de Permanência */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <VuiBox mb={2}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
                  Tempo de Permanência
                </VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                  Há quanto tempo os alunos estudam na escola
                </VuiTypography>
              </VuiBox>
              <VuiBox mt={2}>
                {Object.entries(m.faixasPermanencia).map(([faixa, qtd]) => (
                  <BarraDistribuicao
                    key={faixa}
                    rotulo={faixa}
                    total={qtd}
                    totalGeral={m.alunosAtivos}
                    cor={
                      faixa.includes("< 3")
                        ? "#FFB547"
                        : faixa.includes("3 a 6")
                        ? "#2CD9FF"
                        : faixa.includes("6 a 12")
                        ? "#01B574"
                        : "#A060FF"
                    }
                  />
                ))}
              </VuiBox>
            </Card>
          </Grid>
        </Grid>

        {/* 5. FALTAS POR DIA/HORÁRIO E REPOSIÇÕES */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} lg={6}>
            <FaltasDiaHorario dados={faltasDH} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Reposicoes dados={repos} onAbrirAluno={abrirAluno} />
          </Grid>
        </Grid>

        {/* 6. OCUPAÇÃO DA GRADE E TEMPO POR MÓDULO */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} lg={6}>
            <OcupacaoGrade dados={ocupacao} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <TempoPorModulo cursos={tempoModulos} />
          </Grid>
        </Grid>

        {/* 7. CARGA POR PROFESSOR (só com o recurso de professores ligado) */}
        {recursos.professores && (
          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12}>
              <CargaProfessor lista={carga} />
            </Grid>
          </Grid>
        )}

        {/* 8. FUNIL DAS EXPERIMENTAIS E CONCLUSÕES/CERTIFICADOS */}
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} lg={6}>
            <FunilExperimentais funil={funil} onAbrirAluno={abrirAluno} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <ConclusoesCertificados dados={concl} serie={evolucao.pontos} descricao={evolucao.descricao} onAbrirAluno={abrirAluno} />
          </Grid>
        </Grid>

        {/* 4. ALUNOS EM RISCO DE EVASÃO (AÇÃO PREVENTIVA) */}
        <Card sx={{ mb: 3 }}>
          <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <VuiBox>
              <VuiBox display="flex" alignItems="center" gap="8px">
                <IoAlertCircleOutline color="#E31A1A" size="20px" />
                <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
                  Alunos em Risco de Evasão
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="caption" color="text">
                Alunos ativos com 2 ou mais faltas recentes sem reposição agendada (últimos 60 dias)
              </VuiTypography>
            </VuiBox>
            <VuiTypography variant="caption" color="text" sx={{ background: "rgba(227,36,43,0.15)", color: "#e3242b", px: 1.5, py: 0.5, borderRadius: "20px", fontWeight: "bold" }}>
              {m.alunosRisco.length} em risco
            </VuiTypography>
          </VuiBox>

          {m.alunosRisco.length === 0 ? (
            <VuiBox sx={{ textAlign: "center", py: 4 }}>
              <IoCheckmarkCircleOutline color="#01B574" size="36px" />
              <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block", mt: 1 }}>
                Excelente! Nenhum aluno com faltas críticas acumuladas no momento.
              </VuiTypography>
              <VuiTypography variant="caption" color="text">
                A assiduidade dos alunos ativos está controlada.
              </VuiTypography>
            </VuiBox>
          ) : (
            <VuiBox sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Aluno</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Curso</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Contato</th>
                    <th style={{ textAlign: "center", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Faltas sem Reposição</th>
                    <th style={{ textAlign: "center", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Última Falta</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }} className="nao-imprimir">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {m.alunosRisco.map((al) => (
                    <tr key={al.alunoId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px" }}>
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {al.nome}
                        </VuiTypography>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <VuiTypography variant="caption" color="text">
                          {al.curso}
                        </VuiTypography>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <VuiTypography variant="caption" color="text">
                          {al.contato || "—"}
                        </VuiTypography>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px" }}>
                        <VuiTypography variant="button" color="error" fontWeight="bold">
                          {al.faltas} faltas
                        </VuiTypography>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px" }}>
                        <VuiTypography variant="caption" color="text">
                          {formatarData(al.ultimaFalta)}
                        </VuiTypography>
                      </td>
                      <td style={{ textAlign: "right", padding: "12px" }} className="nao-imprimir">
                        <VuiButton
                          size="small"
                          color="info"
                          variant="text"
                          onClick={() => history.push(`/alunos/${al.alunoId}`)}
                          sx={{ textTransform: "none", fontSize: "11px" }}
                        >
                          Ver ficha do aluno
                        </VuiButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </VuiBox>
          )}
        </Card>

        {/* 5. MOVIMENTAÇÕES & DETALHAMENTO EM 4 CARDS (2 POR LINHA) */}
        <VuiBox mt={3} mb={1.5}>
          <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
            Movimentações & Detalhamento de Alunos
          </VuiTypography>
          <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
            Acompanhamento de saídas, conclusões de curso e funil de conversão das aulas experimentais
          </VuiTypography>
        </VuiBox>

        <Grid container spacing={3} mb={3}>
          {/* Card 1: Alunos que Saíram do Curso */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <VuiBox display="flex" alignItems="center" gap="10px">
                  <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: "rgba(227,36,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E31A1A" }}>
                    <IoPersonRemoveOutline size="18px" />
                  </VuiBox>
                  <VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="bold">
                      Saíram do Curso
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                      Desistências, cancelamentos e inativos
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>
                <VuiTypography variant="caption" sx={{ background: "rgba(227,36,43,0.15)", color: "#E31A1A", px: 1.5, py: 0.4, borderRadius: "20px", fontWeight: "bold" }}>
                  {m.listaEvadidos.length} aluno(s)
                </VuiTypography>
              </VuiBox>

              <VuiBox sx={{ overflowX: "auto", maxHeight: "340px", overflowY: "auto", flexGrow: 1 }}>
                {m.listaEvadidos.length === 0 ? (
                  <VuiBox sx={{ textAlign: "center", py: 4 }}>
                    <VuiTypography variant="caption" color="text">
                      Nenhum aluno com status inativo ou saída registrado.
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, background: "rgba(18,18,24,0.95)", zIndex: 1 }}>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Aluno</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Curso</th>
                        <th style={{ textAlign: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Situação</th>
                        <th style={{ textAlign: "right", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }} className="nao-imprimir">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.listaEvadidos.map((al, idx) => (
                        <tr key={`${al.alunoId}_${idx}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "10px" }}>
                            <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "13px" }}>
                              {al.nome}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "11px" }}>
                              {al.contato || "—"}
                            </VuiTypography>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <VuiTypography variant="caption" color="text">
                              {al.curso}
                            </VuiTypography>
                          </td>
                          <td style={{ textAlign: "center", padding: "10px" }}>
                            <VuiTypography variant="caption" sx={{ color: "#E31A1A", fontWeight: "bold", background: "rgba(227,36,43,0.12)", px: 1, py: 0.3, borderRadius: "6px" }}>
                              {al.status}
                            </VuiTypography>
                          </td>
                          <td style={{ textAlign: "right", padding: "10px" }} className="nao-imprimir">
                            <VuiButton
                              size="small"
                              color="info"
                              variant="text"
                              onClick={() => history.push(`/alunos/${al.alunoId}`)}
                              sx={{ textTransform: "none", fontSize: "11px", p: "4px 8px" }}
                            >
                              Ver ficha
                            </VuiButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Card 2: Alunos que Concluíram o Curso */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <VuiBox display="flex" alignItems="center" gap="10px">
                  <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: "rgba(1,181,116,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#01B574" }}>
                    <IoSchoolOutline size="18px" />
                  </VuiBox>
                  <VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="bold">
                      Concluíram o Curso
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                      Alunos formados e cursos finalizados com êxito
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>
                <VuiTypography variant="caption" sx={{ background: "rgba(1,181,116,0.15)", color: "#01B574", px: 1.5, py: 0.4, borderRadius: "20px", fontWeight: "bold" }}>
                  {(m.listaConcluidos || []).length} concluído(s)
                </VuiTypography>
              </VuiBox>

              <VuiBox sx={{ overflowX: "auto", maxHeight: "340px", overflowY: "auto", flexGrow: 1 }}>
                {(m.listaConcluidos || []).length === 0 ? (
                  <VuiBox sx={{ textAlign: "center", py: 4 }}>
                    <VuiTypography variant="caption" color="text">
                      Nenhum aluno com conclusão registrada até o momento.
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, background: "rgba(18,18,24,0.95)", zIndex: 1 }}>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Aluno</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Curso Concluído</th>
                        <th style={{ textAlign: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Data / Mês</th>
                        <th style={{ textAlign: "right", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }} className="nao-imprimir">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(m.listaConcluidos || []).map((al, idx) => (
                        <tr key={`${al.alunoId}_${idx}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "10px" }}>
                            <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "13px" }}>
                              {al.nome}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "11px" }}>
                              {al.contato || "—"}
                            </VuiTypography>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <VuiTypography variant="caption" color="white" fontWeight="medium">
                              {al.curso}
                            </VuiTypography>
                          </td>
                          <td style={{ textAlign: "center", padding: "10px" }}>
                            <VuiTypography variant="caption" sx={{ color: "#01B574", fontWeight: "bold", background: "rgba(1,181,116,0.12)", px: 1, py: 0.3, borderRadius: "6px" }}>
                              {formatarData(al.dataConclusao)}
                            </VuiTypography>
                          </td>
                          <td style={{ textAlign: "right", padding: "10px" }} className="nao-imprimir">
                            <VuiButton
                              size="small"
                              color="info"
                              variant="text"
                              onClick={() => history.push(`/alunos/${al.alunoId}`)}
                              sx={{ textTransform: "none", fontSize: "11px", p: "4px 8px" }}
                            >
                              Ver ficha
                            </VuiButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Card 3: Matriculados pós-Aula Experimental */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <VuiBox display="flex" alignItems="center" gap="10px">
                  <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: "rgba(44,217,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2CD9FF" }}>
                    <IoPersonAddOutline size="18px" />
                  </VuiBox>
                  <VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="bold">
                      Matriculados pós-Experimental
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                      Conversões de visitantes para alunos matriculados
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>
                <VuiTypography variant="caption" sx={{ background: "rgba(44,217,255,0.15)", color: "#2CD9FF", px: 1.5, py: 0.4, borderRadius: "20px", fontWeight: "bold" }}>
                  {m.listaExpMatriculados.length} convertido(s)
                </VuiTypography>
              </VuiBox>

              <VuiBox sx={{ overflowX: "auto", maxHeight: "340px", overflowY: "auto", flexGrow: 1 }}>
                {m.listaExpMatriculados.length === 0 ? (
                  <VuiBox sx={{ textAlign: "center", py: 4 }}>
                    <VuiTypography variant="caption" color="text">
                      Nenhuma matrícula convertida no período selecionado.
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, background: "rgba(18,18,24,0.95)", zIndex: 1 }}>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Aluno</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Curso Matriculado</th>
                        <th style={{ textAlign: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Data Exp.</th>
                        <th style={{ textAlign: "right", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }} className="nao-imprimir">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.listaExpMatriculados.map((al) => (
                        <tr key={al.alunoId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "10px" }}>
                            <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "13px" }}>
                              {al.nome}
                            </VuiTypography>
                            <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "11px" }}>
                              {al.contato || "—"}
                            </VuiTypography>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <VuiTypography variant="caption" color="white" fontWeight="medium">
                              {al.cursoMatriculado}
                            </VuiTypography>
                          </td>
                          <td style={{ textAlign: "center", padding: "10px" }}>
                            <VuiTypography variant="caption" color="text">
                              {formatarData(al.dataExp)}
                            </VuiTypography>
                          </td>
                          <td style={{ textAlign: "right", padding: "10px" }} className="nao-imprimir">
                            <VuiButton
                              size="small"
                              color="info"
                              variant="text"
                              onClick={() => history.push(`/alunos/${al.alunoId}`)}
                              sx={{ textTransform: "none", fontSize: "11px", p: "4px 8px" }}
                            >
                              Ver ficha
                            </VuiButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </VuiBox>
            </Card>
          </Grid>

          {/* Card 4: Fizeram Experimental e Não Matricularam */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <VuiBox display="flex" alignItems="center" gap="10px">
                  <VuiBox sx={{ width: 34, height: 34, borderRadius: "8px", background: "rgba(255,181,71,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFB547" }}>
                    <IoCallOutline size="18px" />
                  </VuiBox>
                  <VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="bold">
                      Fizeram Exp. e Não Matricularam
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                      Visitantes que realizaram a aula mas ainda não fecharam (leads quentes)
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>
                <VuiTypography variant="caption" sx={{ background: "rgba(255,181,71,0.15)", color: "#FFB547", px: 1.5, py: 0.4, borderRadius: "20px", fontWeight: "bold" }}>
                  {m.listaExpNaoMatriculados.length} oportunidade(s)
                </VuiTypography>
              </VuiBox>

              <VuiBox sx={{ overflowX: "auto", maxHeight: "340px", overflowY: "auto", flexGrow: 1 }}>
                {m.listaExpNaoMatriculados.length === 0 ? (
                  <VuiBox sx={{ textAlign: "center", py: 4 }}>
                    <VuiTypography variant="caption" color="text">
                      Todos os visitantes que concluíram experimental efetivaram matrícula!
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, background: "rgba(18,18,24,0.95)", zIndex: 1 }}>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Visitante</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Curso Visitado</th>
                        <th style={{ textAlign: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Data Exp.</th>
                        <th style={{ textAlign: "right", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }} className="nao-imprimir">Contato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.listaExpNaoMatriculados.map((al) => {
                        const telLimpo = String(al.contato || "").replace(/\D/g, "");
                        return (
                          <tr key={al.alunoId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "10px" }}>
                              <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "13px" }}>
                                {al.nome}
                              </VuiTypography>
                              <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "11px" }}>
                                {al.contato || "Sem telefone"}
                              </VuiTypography>
                            </td>
                            <td style={{ padding: "10px" }}>
                              <VuiTypography variant="caption" color="text">
                                {al.cursoExp}
                              </VuiTypography>
                            </td>
                            <td style={{ textAlign: "center", padding: "10px" }}>
                              <VuiTypography variant="caption" color="text">
                                {formatarData(al.dataExp)}
                              </VuiTypography>
                            </td>
                            <td style={{ textAlign: "right", padding: "10px" }} className="nao-imprimir">
                              <VuiBox display="flex" justifyContent="flex-end" alignItems="center" gap="4px">
                                {telLimpo && (
                                  <VuiButton
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    component="a"
                                    href={`https://wa.me/55${telLimpo}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{ textTransform: "none", fontSize: "11px", p: "4px 8px" }}
                                  >
                                    WhatsApp
                                  </VuiButton>
                                )}
                                <VuiButton
                                  size="small"
                                  color="info"
                                  variant="text"
                                  onClick={() => history.push(`/alunos/${al.alunoId}`)}
                                  sx={{ textTransform: "none", fontSize: "11px", p: "4px 8px" }}
                                >
                                  Ficha
                                </VuiButton>
                              </VuiBox>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </VuiBox>
            </Card>
          </Grid>
        </Grid>

        {/* ÚLTIMO CARD: PERFORMANCE POR CURSO (accordion por tipo de curso, fechado por padrão) */}
        <PerformanceAgrupada grupos={grupos} />
      </VuiBox>
    </DashboardLayout>
  );
}
