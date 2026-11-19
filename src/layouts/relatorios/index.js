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
} from "react-icons/io5";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import BarraStatus from "layouts/shared/BarraStatus";
import { useEscola } from "context/escola";
import { calcularMetricasGerais, formatarData } from "utils/escola";

const OPCOES_PERIODO = [
  { rotulo: "Últimos 30 dias", valor: 30 },
  { rotulo: "Últimos 90 dias", valor: 90 },
  { rotulo: "Este ano", valor: 365 },
  { rotulo: "Histórico completo", valor: null },
];

function CardKpi({ titulo, valor, detalhe, icone: Icone, cor = "#e3242b" }) {
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
        <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px", opacity: 0.85 }}>
          {detalhe}
        </VuiTypography>
      )}
    </Card>
  );
}

// Barra de distribuição proporcional com dimensões exatas em CSS (sem conflito de temas)
function BarraDistribuicao({ rotulo, total, totalGeral, cor = "#e3242b" }) {
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
      <VuiBox
        sx={{
          width: "100%",
          height: 9,
          borderRadius: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
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

export default function Relatorios() {
  const { dados } = useEscola();
  const history = useHistory();
  const [periodo, setPeriodo] = useState(30);

  const m = useMemo(() => calcularMetricasGerais(dados, periodo), [dados, periodo]);

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
              detalhe={`${m.alunosInativos} inativos cadastrados`}
              icone={IoPeopleOutline}
              cor="#2CD9FF"
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
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Frequência Média"
              valor={`${m.taxaPresenca}%`}
              detalhe={`${m.totalPresencas} presenças / ${m.totalFaltas} faltas`}
              icone={IoCheckmarkCircleOutline}
              cor="#38D79F"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <CardKpi
              titulo="Conversão Exp."
              valor={`${m.taxaConversaoExp}%`}
              detalhe={`${m.matriculadosExp} alunos de ${m.totalExp} exp.`}
              icone={IoRibbonOutline}
              cor="#FFB547"
            />
          </Grid>
        </Grid>

        {/* 2. DEMOGRAFIA, GÊNERO E TEMPO DE CASA */}
        <Grid container spacing={2.5} mb={3}>
          {/* Faixa Etária */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <VuiBox mb={2}>
                <VuiTypography variant="lg" color="white" fontWeight="bold">
                  Perfil por Faixa Etária
                </VuiTypography>
                <VuiTypography variant="caption" color="text">
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
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    Meninos e Meninas
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text">
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
                <VuiTypography variant="lg" color="white" fontWeight="bold">
                  Tempo de Permanência
                </VuiTypography>
                <VuiTypography variant="caption" color="text">
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

        {/* 3. PERFORMANCE POR CURSO */}
        <Card sx={{ mb: 3 }}>
          <VuiBox mb={2}>
            <VuiTypography variant="lg" color="white" fontWeight="bold">
              Performance por Curso
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              Comparativo de assiduidade, média de notas e módulos concluídos
            </VuiTypography>
          </VuiBox>

          <VuiBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Curso</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Alunos Ativos</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Frequência</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Média de Notas</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase" }}>Módulos Concluídos</th>
                </tr>
              </thead>
              <tbody>
                {m.performanceCursos.map((c) => (
                  <tr key={c.cursoId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 12px" }}>
                      <VuiBox display="flex" alignItems="center" gap="10px">
                        <VuiBox sx={{ width: 10, height: 10, borderRadius: "50%", background: c.cor, flexShrink: 0 }} />
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {c.nome}
                        </VuiTypography>
                      </VuiBox>
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 12px" }}>
                      <VuiTypography variant="button" color="white">
                        {c.alunosAtivos}
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 12px" }}>
                      <VuiTypography variant="button" color={c.frequencia >= 85 ? "success" : c.frequencia >= 70 ? "warning" : "error"} fontWeight="bold">
                        {c.frequencia}%
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 12px" }}>
                      <VuiTypography variant="button" color="white">
                        {c.mediaNota !== null ? `${c.mediaNota} / 10` : "—"}
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 12px" }}>
                      <VuiTypography variant="button" color="white" fontWeight="medium">
                        {c.modulosConcluidos}
                      </VuiTypography>
                    </td>
                  </tr>
                ))}
                {m.performanceCursos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "24px" }}>
                      <VuiTypography variant="caption" color="text">
                        Nenhum curso cadastrado.
                      </VuiTypography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </VuiBox>
        </Card>

        {/* 4. ALUNOS EM RISCO DE EVASÃO (AÇÃO PREVENTIVA) */}
        <Card>
          <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <VuiBox>
              <VuiBox display="flex" alignItems="center" gap="8px">
                <IoAlertCircleOutline color="#E31A1A" size="20px" />
                <VuiTypography variant="lg" color="white" fontWeight="bold">
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
      </VuiBox>
    </DashboardLayout>
  );
}
