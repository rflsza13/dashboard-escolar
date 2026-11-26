import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Chart from "react-apexcharts";

import { Card } from "@mui/material";
import {
  IoAlertCircleOutline,
  IoCalendarOutline,
  IoChevronDown,
  IoGridOutline,
  IoPeopleOutline,
  IoRepeatOutline,
  IoRibbonOutline,
  IoSpeedometerOutline,
  IoStatsChartOutline,
  IoTrendingDown,
  IoFunnelOutline,
} from "react-icons/io5";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import { DIAS_GRADE, INTERVALOS_GRADE, formatarData } from "utils/escola";
import { BarraDistribuicao, CartaoSecao, Vazio, estiloTh } from "layouts/relatorios/componentes";

const eixo = { colors: "#c8cfca", fontSize: "11px" };
const rotuloFaixa = (f) => f.replace(" - ", "–");
const fmt = (n) => (n === null || n === undefined ? "—" : String(n).replace(".", ","));

function Mini({ rotulo, valor, cor, detalhe }) {
  return (
    <VuiBox sx={{ flex: "1 1 120px", p: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${cor}` }}>
      <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {rotulo}
      </VuiTypography>
      <VuiTypography variant="h5" color="white" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
        {valor}
      </VuiTypography>
      {detalhe && (
        <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px" }}>
          {detalhe}
        </VuiTypography>
      )}
    </VuiBox>
  );
}
Mini.defaultProps = { cor: "#2CD9FF", detalhe: "" };
Mini.propTypes = { rotulo: PropTypes.string.isRequired, valor: PropTypes.node.isRequired, cor: PropTypes.string, detalhe: PropTypes.string };

function GraficoMensal({ tipo, labels, series, cores, altura }) {
  const options = useMemo(
    () => ({
      chart: { toolbar: { show: false }, zoom: { enabled: false }, background: "transparent" },
      colors: cores,
      stroke: tipo === "line" ? { curve: "smooth", width: series.map(() => 3), dashArray: series.map((_, i) => (i === 2 ? 6 : 0)) } : { width: 0 },
      markers: { size: tipo === "line" ? 4 : 0 },
      dataLabels: { enabled: false },
      plotOptions: { bar: { columnWidth: "45%", borderRadius: 4 } },
      xaxis: { categories: labels, labels: { style: eixo }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: eixo, formatter: (v) => String(Math.round(v)) } },
      grid: { strokeDashArray: 5, borderColor: "#3A3A3A" },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: "#fff" } },
      tooltip: { theme: "dark" },
    }),
    [tipo, labels, series, cores]
  );
  return <Chart options={options} series={series} type={tipo} width="100%" height={altura} />;
}
GraficoMensal.defaultProps = { altura: 260 };
GraficoMensal.propTypes = { tipo: PropTypes.string.isRequired, labels: PropTypes.array.isRequired, series: PropTypes.array.isRequired, cores: PropTypes.array.isRequired, altura: PropTypes.number };

/* 6. evolução mensal */
export function EvolucaoMensal({ serie, descricao }) {
  const novos = serie.reduce((s, x) => s + x.novos, 0);
  const saidas = serie.reduce((s, x) => s + x.saidas, 0);
  const labels = useMemo(() => serie.map((x) => x.rotulo), [serie]);
  const series = useMemo(
    () => [
      { name: "Novos alunos", data: serie.map((x) => x.novos) },
      { name: "Saídas", data: serie.map((x) => x.saidas) },
      { name: "Saldo", data: serie.map((x) => x.saldo) },
    ],
    [serie]
  );
  return (
    <CartaoSecao titulo="Evolução de alunos" subtitulo={`Alunos novos, saídas e saldo ${descricao}`} icone={IoStatsChartOutline} cor="#2CD9FF">
      <VuiBox display="flex" gap="10px" flexWrap="wrap" mb={1}>
        <Mini rotulo="Novos" valor={novos} cor="#01B574" />
        <Mini rotulo="Saídas" valor={saidas} cor="#E31A1A" />
        <Mini rotulo="Saldo" valor={`${novos - saidas > 0 ? "+" : ""}${novos - saidas}`} cor="#2CD9FF" />
      </VuiBox>
      <GraficoMensal tipo="line" labels={labels} series={series} cores={["#01B574", "#E31A1A", "#2CD9FF"]} />
      <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px" }}>
        “Novo” é o aluno cuja primeira matrícula (que não seja experimental) começou no intervalo. Saídas vêm da aba Movimentacoes. Nas semanas, o rótulo é a segunda-feira.
      </VuiTypography>
    </CartaoSecao>
  );
}
EvolucaoMensal.propTypes = { serie: PropTypes.array.isRequired, descricao: PropTypes.string.isRequired };

/* 7. saídas por motivo */
export function SaidasPorMotivo({ dados }) {
  return (
    <CartaoSecao
      titulo="Saídas por motivo"
      subtitulo="Por que os alunos deixaram a escola no período"
      icone={IoTrendingDown}
      cor="#E31A1A"
      direita={
        <VuiTypography variant="caption" sx={{ background: "rgba(227,36,43,0.15)", color: "#E31A1A", px: 1.5, py: 0.4, borderRadius: "20px", fontWeight: "bold", whiteSpace: "nowrap" }}>
          {dados.total} saída(s)
        </VuiTypography>
      }
    >
      {dados.lista.length === 0 ? (
        <Vazio texto="Nenhuma saída registrada no período. O motivo é guardado quando a saída é registrada na ficha do aluno." />
      ) : (
        <VuiBox mt={1}>
          {dados.lista.slice(0, 8).map((x, i) => (
            <BarraDistribuicao key={x.motivo} rotulo={x.motivo} total={x.total} totalGeral={dados.total} cor={["#E31A1A", "#FF8A3D", "#FFB547", "#A060FF", "#2CD9FF", "#01B574", "#F883DD", "#8A8A8A"][i % 8]} />
          ))}
          {dados.lista.length > 8 && (
            <VuiTypography variant="caption" color="text">
              + {dados.lista.length - 8} outro(s) motivo(s)
            </VuiTypography>
          )}
        </VuiBox>
      )}
    </CartaoSecao>
  );
}
SaidasPorMotivo.propTypes = { dados: PropTypes.object.isRequired };

/* 1. funil das experimentais */
export function FunilExperimentais({ funil, onAbrirAluno }) {
  const etapas = [
    { rotulo: "Aulas experimentais marcadas", valor: funil.marcadas, cor: "#FFD93D", pct: 100 },
    { rotulo: "Compareceram", valor: funil.compareceram, cor: "#2CD9FF", pct: funil.taxaComparecimento },
    { rotulo: "Viraram matrícula", valor: funil.matriculados, cor: "#01B574", pct: funil.taxaGeral },
  ];
  return (
    <CartaoSecao titulo="Funil das experimentais" subtitulo="Marcadas → compareceram → matriculadas" icone={IoFunnelOutline} cor="#FFD93D">
      {funil.marcadas === 0 ? (
        <Vazio texto="Nenhuma aula experimental marcada no período." />
      ) : (
        <>
          {etapas.map((e) => (
            <VuiBox key={e.rotulo} mb={1.5}>
              <VuiBox display="flex" justifyContent="space-between" mb="4px">
                <VuiTypography variant="caption" color="white" fontWeight="medium" sx={{ fontSize: "12px" }}>
                  {e.rotulo}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ fontSize: "12px" }}>
                  <strong style={{ color: "#fff" }}>{e.valor}</strong> ({e.pct}%)
                </VuiTypography>
              </VuiBox>
              <VuiBox sx={{ width: "100%", height: 14, borderRadius: "7px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <VuiBox sx={{ width: `${Math.max(e.pct, e.valor > 0 ? 4 : 0)}%`, height: "100%", borderRadius: "7px", background: e.cor, transition: "width 0.6s ease" }} />
              </VuiBox>
            </VuiBox>
          ))}
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
            Comparecimento de {funil.taxaComparecimento}% · de quem compareceu, {funil.taxaConversao}% se matriculou.
          </VuiTypography>

          <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
            Quem não fechou
          </VuiTypography>
          {funil.motivos.length === 0 ? (
            <Vazio texto="Todos os visitantes do período se matricularam." />
          ) : (
            funil.motivos.map((g) => (
              <VuiBox key={g.chave} mb={1.5}>
                <VuiTypography variant="caption" sx={{ display: "inline-block", fontWeight: "bold", color: g.cor, background: `${g.cor}22`, px: 1.2, py: 0.2, borderRadius: "20px", mb: "6px" }}>
                  {g.rotulo} · {g.itens.length}
                </VuiTypography>
                {g.itens.slice(0, 5).map((it) => (
                  <VuiBox key={it.alunoId} display="flex" justifyContent="space-between" alignItems="baseline" gap="8px" sx={{ py: "3px" }}>
                    <VuiBox sx={{ minWidth: 0 }}>
                      <VuiTypography variant="caption" color="white" fontWeight="medium" onClick={() => onAbrirAluno(it.alunoId)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                        {it.nome}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                        {" "}
                        · {it.curso} · {formatarData(it.data)}
                      </VuiTypography>
                      {it.obs && (
                        <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "11px", fontStyle: "italic" }}>
                          “{it.obs}”
                        </VuiTypography>
                      )}
                    </VuiBox>
                  </VuiBox>
                ))}
                {g.itens.length > 5 && (
                  <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                    + {g.itens.length - 5} aluno(s)
                  </VuiTypography>
                )}
              </VuiBox>
            ))
          )}
          <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px", mt: 1 }}>
            O motivo é deduzido da situação da aula. Anotações em Observações da matrícula do visitante aparecem junto ao nome.
          </VuiTypography>
        </>
      )}
    </CartaoSecao>
  );
}
FunilExperimentais.propTypes = { funil: PropTypes.object.isRequired, onAbrirAluno: PropTypes.func.isRequired };

/* 9. conclusões e certificados */
export function ConclusoesCertificados({ dados, serie, descricao, onAbrirAluno }) {
  const labels = useMemo(() => serie.map((x) => x.rotulo), [serie]);
  const series = useMemo(() => [{ name: "Cursos concluídos", data: serie.map((x) => x.concluidos) }], [serie]);
  return (
    <CartaoSecao titulo="Conclusões e certificados" subtitulo={`Cursos concluídos ${descricao} e certificados a emitir`} icone={IoRibbonOutline} cor="#FFB547">
      <VuiBox display="flex" gap="10px" flexWrap="wrap" mb={1}>
        <Mini rotulo="Concluídos no período" valor={dados.concluidosNoPeriodo} cor="#01B574" />
        <Mini rotulo="Certificados emitidos" valor={dados.emitidosNoPeriodo} cor="#2CD9FF" detalhe={dados.tempoMedioEmissao !== null ? `em média ${fmt(dados.tempoMedioEmissao)} dia(s) após concluir` : ""} />
        <Mini rotulo="Pendentes" valor={dados.pendentes.length} cor={dados.pendentes.length ? "#FFB547" : "#01B574"} />
      </VuiBox>
      <GraficoMensal tipo="bar" labels={labels} series={series} cores={["#01B574"]} altura={200} />
      {dados.pendentes.length > 0 && (
        <VuiBox mt={1}>
          <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
            Certificados pendentes (os mais antigos primeiro)
          </VuiTypography>
          {dados.pendentes.slice(0, 6).map((p) => (
            <VuiBox key={p.matriculaId} display="flex" justifyContent="space-between" alignItems="baseline" gap="8px" sx={{ py: "3px" }}>
              <VuiBox>
                <VuiTypography variant="caption" color="white" fontWeight="medium" onClick={() => onAbrirAluno(p.alunoId)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                  {p.aluno}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                  {" "}
                  · {p.curso} · concluído em {formatarData(p.concluidoEm)}
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="caption" sx={{ fontWeight: "bold", whiteSpace: "nowrap", color: p.diasEspera > 15 ? "#E31A1A" : "#FFB547" }}>
                {p.diasEspera} dia(s)
              </VuiTypography>
            </VuiBox>
          ))}
          {dados.pendentes.length > 6 && (
            <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
              + {dados.pendentes.length - 6} pendente(s). A tela inicial tem o botão “Marcar como emitido”.
            </VuiTypography>
          )}
        </VuiBox>
      )}
    </CartaoSecao>
  );
}
ConclusoesCertificados.propTypes = { dados: PropTypes.object.isRequired, serie: PropTypes.array.isRequired, descricao: PropTypes.string.isRequired, onAbrirAluno: PropTypes.func.isRequired };

/* 2. faltas por dia da semana e por horário (mapa de calor) */
export function FaltasDiaHorario({ dados }) {
  const celula = (d, f) => dados.celulas[d][f];
  const alpha = (c) => (c.total >= dados.minimo ? 0.1 + Math.min(1, c.faltas / c.total / 0.4) * 0.7 : 0.05);
  return (
    <CartaoSecao titulo="Faltas por dia e horário" subtitulo="Onde as faltas se concentram (faltas / aulas registradas)" icone={IoCalendarOutline} cor="#E31A1A">
      {dados.total === 0 ? (
        <Vazio texto="Nenhuma presença ou falta registrada no período." />
      ) : (
        <>
          <VuiBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, minWidth: 460 }}>
              <thead>
                <tr>
                  <th style={{ ...estiloTh, textAlign: "left" }}>Horário</th>
                  {DIAS_GRADE.map((d) => (
                    <th key={d} style={{ ...estiloTh, textAlign: "center" }}>
                      {d}
                    </th>
                  ))}
                  <th style={{ ...estiloTh, textAlign: "center" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {INTERVALOS_GRADE.map((f, i) => (
                  <tr key={f}>
                    <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                      <VuiTypography variant="caption" color="white" sx={{ fontSize: "11px" }}>
                        {rotuloFaixa(f)}
                      </VuiTypography>
                    </td>
                    {DIAS_GRADE.map((d) => {
                      const c = celula(d, f);
                      return (
                        <td
                          key={d}
                          title={c.total ? `${d} ${rotuloFaixa(f)}: ${c.faltas} falta(s) em ${c.total} aula(s)${c.total < dados.minimo ? " (poucas aulas para concluir algo)" : ""}` : "Sem aulas registradas"}
                          style={{ textAlign: "center", padding: "7px 4px", borderRadius: 6, background: c.total ? `rgba(227,36,43,${alpha(c)})` : "rgba(255,255,255,0.03)" }}
                        >
                          <VuiTypography variant="caption" color={c.total ? "white" : "text"} sx={{ fontSize: "11px", opacity: c.total < dados.minimo && c.total ? 0.7 : 1 }}>
                            {c.total ? `${c.faltas}/${c.total}` : "—"}
                          </VuiTypography>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "center", padding: "7px 4px" }}>
                      <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px", fontWeight: "bold" }}>
                        {dados.faixas[i].total ? `${dados.faixas[i].pct}%` : "—"}
                      </VuiTypography>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "4px 8px" }}>
                    <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px", fontWeight: "bold" }}>
                      Total
                    </VuiTypography>
                  </td>
                  {dados.dias.map((d) => (
                    <td key={d.dia} style={{ textAlign: "center", padding: "7px 4px" }}>
                      <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px", fontWeight: "bold" }}>
                        {d.total ? `${d.pct}%` : "—"}
                      </VuiTypography>
                    </td>
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          </VuiBox>
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 1 }}>
            {dados.piorDia && (
              <>
                Pior dia: <strong style={{ color: "#fff" }}>{dados.piorDia.dia}</strong> ({dados.piorDia.pct}% de faltas).{" "}
              </>
            )}
            {dados.piorFaixa && (
              <>
                Pior horário: <strong style={{ color: "#fff" }}>{rotuloFaixa(dados.piorFaixa.faixa)}</strong> ({dados.piorFaixa.pct}%).{" "}
              </>
            )}
            {dados.piorCelula && (
              <>
                Maior concentração: <strong style={{ color: "#fff" }}>{dados.piorCelula.dia} {rotuloFaixa(dados.piorCelula.faixa)}</strong> ({dados.piorCelula.faltas} de {dados.piorCelula.total} aulas).
              </>
            )}
            {!dados.piorDia && !dados.piorFaixa && `Poucos registros: só entram nas conclusões dias e horários com ${dados.minimo} aulas ou mais.`}
          </VuiTypography>
        </>
      )}
    </CartaoSecao>
  );
}
FaltasDiaHorario.propTypes = { dados: PropTypes.object.isRequired };

/* 3. reposições */
export function Reposicoes({ dados, onAbrirAluno }) {
  return (
    <CartaoSecao titulo="Reposições" subtitulo="O que acontece depois de cada falta no período" icone={IoRepeatOutline} cor="#FF8A3D">
      {dados.faltas === 0 ? (
        <Vazio texto="Nenhuma falta registrada no período." />
      ) : (
        <>
          <VuiBox display="flex" gap="10px" flexWrap="wrap" mb={2}>
            <Mini rotulo="Faltas" valor={dados.faltas} cor="#E31A1A" />
            <Mini rotulo="Realizadas" valor={dados.realizadas} cor="#01B574" />
            <Mini rotulo="Agendadas" valor={dados.agendadas} cor="#FF8A3D" detalhe={dados.vencidas ? `${dados.vencidas} com data vencida` : ""} />
            <Mini rotulo="Sem reposição" valor={dados.semReposicao.length} cor={dados.semReposicao.length ? "#E31A1A" : "#01B574"} />
            <Mini rotulo="Tempo médio" valor={dados.tempoMedioDias !== null ? `${fmt(dados.tempoMedioDias)} dias` : "—"} cor="#2CD9FF" detalhe="da falta até a reposição" />
          </VuiBox>
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 1 }}>
            {dados.taxa}% das faltas já têm reposição realizada ou agendada.
          </VuiTypography>
          {dados.vencidas > 0 && (
            <VuiTypography variant="caption" sx={{ display: "block", color: "#FFB547", mb: 1 }}>
              {dados.vencidas} reposição(ões) agendada(s) já passaram da data: registre a presença ou a falta na grade.
            </VuiTypography>
          )}
          {dados.semReposicao.length > 0 && (
            <>
              <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
                Faltas sem reposição (as mais antigas primeiro)
              </VuiTypography>
              {dados.semReposicao.slice(0, 6).map((x, i) => (
                <VuiBox key={`${x.alunoId}_${x.data}_${i}`} display="flex" justifyContent="space-between" alignItems="baseline" gap="8px" sx={{ py: "3px" }}>
                  <VuiBox>
                    <VuiTypography variant="caption" color="white" fontWeight="medium" onClick={() => x.alunoId && onAbrirAluno(x.alunoId)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                      {x.nome}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                      {" "}
                      · {x.curso} · {formatarData(x.data)}
                    </VuiTypography>
                  </VuiBox>
                  <VuiTypography variant="caption" sx={{ fontWeight: "bold", whiteSpace: "nowrap", color: x.diasDesde > 30 ? "#E31A1A" : "#FFB547" }}>
                    há {x.diasDesde} dia(s)
                  </VuiTypography>
                </VuiBox>
              ))}
              {dados.semReposicao.length > 6 && (
                <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                  + {dados.semReposicao.length - 6} falta(s) sem reposição.
                </VuiTypography>
              )}
            </>
          )}
        </>
      )}
    </CartaoSecao>
  );
}
Reposicoes.propTypes = { dados: PropTypes.object.isRequired, onAbrirAluno: PropTypes.func.isRequired };

/* 4. ocupação da grade */
export function OcupacaoGrade({ dados }) {
  return (
    <CartaoSecao titulo="Ocupação da grade" subtitulo="Alunos ativos por dia e horário (aulas semanais)" icone={IoGridOutline} cor="#2CD9FF">
      {dados.totalAlunos === 0 ? (
        <Vazio texto="Nenhuma matrícula ativa com dia e horário." />
      ) : (
        <>
          <VuiBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, minWidth: 440 }}>
              <thead>
                <tr>
                  <th style={{ ...estiloTh, textAlign: "left" }}>Horário</th>
                  {DIAS_GRADE.map((d) => (
                    <th key={d} style={{ ...estiloTh, textAlign: "center" }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INTERVALOS_GRADE.map((f) => (
                  <tr key={f}>
                    <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                      <VuiTypography variant="caption" color="white" sx={{ fontSize: "11px" }}>
                        {rotuloFaixa(f)}
                      </VuiTypography>
                    </td>
                    {DIAS_GRADE.map((d) => {
                      const c = dados.celulas[d][f];
                      const ociosa = c.alunos === 0 && c.professores > 0;
                      return (
                        <td
                          key={d}
                          title={`${d} ${rotuloFaixa(f)}: ${c.alunos} aluno(s)${dados.temEscala ? `, ${c.professores} professor(es) na escala` : ""}${ociosa ? " (faixa vazia com professor escalado)" : ""}`}
                          style={{
                            textAlign: "center",
                            padding: "7px 4px",
                            borderRadius: 6,
                            background: c.alunos ? `rgba(44,217,255,${0.12 + (c.alunos / dados.maximo) * 0.6})` : "rgba(255,255,255,0.03)",
                            border: ociosa ? "1px dashed #FFB547" : "1px solid transparent",
                          }}
                        >
                          <VuiTypography variant="caption" color={c.alunos ? "white" : "text"} sx={{ fontSize: "11px", fontWeight: c.alunos ? "bold" : "regular" }}>
                            {c.alunos || "—"}
                          </VuiTypography>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </VuiBox>
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 1 }}>
            {dados.vazias.length} de {dados.faixasTotal} faixas sem alunos
            {dados.temEscala ? (
              <>
                , <strong style={{ color: "#FFB547" }}>{dados.ociosas.length}</strong> delas com professor na escala (borda tracejada).
              </>
            ) : (
              "."
            )}
            {dados.maisCheias.length > 0 && ` Mais cheias: ${dados.maisCheias.map((x) => `${x.dia} ${rotuloFaixa(x.faixa)} (${x.alunos})`).join(", ")}.`}
          </VuiTypography>
        </>
      )}
    </CartaoSecao>
  );
}
OcupacaoGrade.propTypes = { dados: PropTypes.object.isRequired };

/* 5. carga por professor */
export function CargaProfessor({ lista }) {
  return (
    <CartaoSecao titulo="Carga por professor" subtitulo="Aulas atendidas e faltas dos alunos em cada professor" icone={IoPeopleOutline} cor="#A060FF">
      {lista.length === 0 ? (
        <Vazio texto="Sem dados: cadastre a escala dos professores para ver a carga de cada um." />
      ) : (
        <>
          <VuiBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ ...estiloTh, textAlign: "left" }}>Professor</th>
                  <th style={{ ...estiloTh, textAlign: "center" }}>Turnos</th>
                  <th style={{ ...estiloTh, textAlign: "center" }}>Atendimentos</th>
                  <th style={{ ...estiloTh, textAlign: "center" }}>Faltas</th>
                  <th style={{ ...estiloTh, textAlign: "center" }}>% faltas</th>
                  <th style={{ ...estiloTh, textAlign: "center" }}>Sem registro</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.professorId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px" }}>
                      <VuiBox display="flex" alignItems="center" gap="8px">
                        <VuiBox sx={{ width: 10, height: 10, borderRadius: "50%", background: /^#[0-9a-fA-F]{6}$/.test(p.cor || "") ? p.cor : "#8A8A8A", flexShrink: 0 }} />
                        <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "13px" }}>
                          {p.nome}
                        </VuiTypography>
                      </VuiBox>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      <VuiTypography variant="button" color="white">
                        {p.turnos}
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      <VuiTypography variant="button" color="white">
                        {p.atendimentos}
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      <VuiTypography variant="button" color="white">
                        {p.faltas}
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      <VuiTypography variant="button" color={p.pctFaltas <= 10 ? "success" : p.pctFaltas <= 20 ? "warning" : "error"} fontWeight="bold">
                        {p.pctFaltas}%
                      </VuiTypography>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      <VuiTypography variant="button" color={p.semRegistro ? "warning" : "text"}>
                        {p.semRegistro}
                      </VuiTypography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </VuiBox>
          <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px", mt: 1 }}>
            O professor de cada aula vem da escala; horário com mais de um professor conta para todos. Turno = dia e horário com pelo menos um aluno presente. “Sem registro” são aulas passadas em que ninguém marcou presença ou falta.
          </VuiTypography>
        </>
      )}
    </CartaoSecao>
  );
}
CargaProfessor.propTypes = { lista: PropTypes.array.isRequired };

/* 8. tempo médio por módulo */
export function TempoPorModulo({ cursos }) {
  const [sel, setSel] = useState(null);
  const atual = cursos.find((c) => c.cursoId === sel) || cursos[0];
  const maximo = atual ? Math.max(1, ...atual.itens.map((i) => i.mediaDias || 0)) : 1;
  return (
    <CartaoSecao titulo="Tempo médio por módulo" subtitulo="Dias que os alunos levam em cada módulo (histórico completo)" icone={IoSpeedometerOutline} cor="#01B574">
      {!atual ? (
        <Vazio texto="Ainda não há módulos concluídos para calcular." />
      ) : (
        <>
          <VuiBox display="flex" gap="6px" flexWrap="wrap" mb={2}>
            {cursos.map((c) => (
              <VuiButton
                key={c.cursoId}
                size="small"
                color="info"
                variant={atual.cursoId === c.cursoId ? "contained" : "outlined"}
                onClick={() => setSel(c.cursoId)}
                sx={{ borderRadius: "16px", textTransform: "none", fontSize: "11px", px: 1.5, py: 0.3 }}
              >
                {c.curso}
              </VuiButton>
            ))}
          </VuiBox>
          {atual.itens.map((i) => (
            <VuiBox key={i.moduloId} mb={1.5}>
              <VuiBox display="flex" justifyContent="space-between" gap="8px" mb="4px">
                <VuiTypography variant="caption" color="white" fontWeight="medium" sx={{ fontSize: "12px" }}>
                  {i.ordem}. {i.nome}
                  {i.lento && (
                    <span style={{ color: "#E31A1A", marginLeft: 6, fontSize: 10 }}>
                      <IoAlertCircleOutline style={{ verticalAlign: "-2px" }} /> mais lento que a média
                    </span>
                  )}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                  <strong style={{ color: "#fff" }}>{i.mediaDias !== null ? `${fmt(i.mediaDias)} dias` : "—"}</strong>
                </VuiTypography>
              </VuiBox>
              <VuiBox sx={{ width: "100%", height: 8, borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <VuiBox sx={{ width: `${i.mediaDias ? Math.max(4, (i.mediaDias / maximo) * 100) : 0}%`, height: "100%", borderRadius: "4px", background: i.lento ? "#E31A1A" : atual.cor }} />
              </VuiBox>
              <VuiTypography variant="caption" color="text" sx={{ fontSize: "10px" }}>
                {i.concluidos} concluído(s)
                {i.andamento > 0 && ` · ${i.andamento} em andamento${i.atrasados ? ` (${i.atrasados} acima de 1,5× a média)` : ""}`}
              </VuiTypography>
            </VuiBox>
          ))}
          <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px" }}>
            Conta da conclusão do módulo anterior (ou do início da matrícula) até a conclusão do módulo. Média do curso: {fmt(atual.mediaCurso)} dias.
          </VuiTypography>
        </>
      )}
    </CartaoSecao>
  );
}
TempoPorModulo.propTypes = { cursos: PropTypes.array.isRequired };

/* performance por curso, em accordion por grupo */
export function PerformanceAgrupada({ grupos }) {
  const [aberto, setAberto] = useState(null);
  const corFreq = (f) => (f >= 85 ? "success" : f >= 70 ? "warning" : "error");
  const alternar = (g) => setAberto((x) => (x === g ? null : g));
  return (
    <Card sx={{ mb: 3 }}>
      <VuiBox mb={2}>
        <VuiTypography variant="lg" color="white" fontWeight="bold" sx={{ display: "block" }}>
          Performance por Curso
        </VuiTypography>
        <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
          Assiduidade, média de notas e módulos concluídos por tipo de curso. Clique em um grupo para ver cada curso.
        </VuiTypography>
      </VuiBox>
      {grupos.length === 0 && <Vazio texto="Nenhum curso cadastrado." />}
      {grupos.map((g) => {
        const abertoAqui = aberto === g.grupo;
        return (
          <VuiBox key={g.grupo} sx={{ mb: 1.5, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", borderLeft: `4px solid ${g.cor}`, overflow: "hidden" }}>
            <VuiBox
              role="button"
              tabIndex={0}
              aria-expanded={abertoAqui}
              onClick={() => alternar(g.grupo)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  alternar(g.grupo);
                }
              }}
              sx={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", p: "14px 16px", cursor: "pointer", background: abertoAqui ? "rgba(255,255,255,0.05)" : "transparent", "&:hover": { background: "rgba(255,255,255,0.05)" } }}
            >
              <VuiBox sx={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 180px" }}>
                <IoChevronDown size="18px" color="#fff" style={{ transition: "transform 0.2s", transform: abertoAqui ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
                <VuiBox>
                  <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block" }}>
                    {g.grupo}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                    {g.cursos.length} curso(s)
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
              {[
                ["Alunos ativos", g.alunosAtivos, "white"],
                ["Frequência", `${g.frequencia}%`, corFreq(g.frequencia)],
                ["Média de notas", g.mediaNota !== null ? `${fmt(g.mediaNota)} / 10` : "—", "white"],
                ["Módulos concluídos", g.modulosConcluidos, "white"],
              ].map(([rotulo, valor, cor]) => (
                <VuiBox key={rotulo} sx={{ textAlign: "center", flex: "1 1 100px" }}>
                  <VuiTypography variant="caption" color="text" sx={{ display: "block", fontSize: "10px", textTransform: "uppercase" }}>
                    {rotulo}
                  </VuiTypography>
                  <VuiTypography variant="button" color={cor} fontWeight="bold">
                    {valor}
                  </VuiTypography>
                </VuiBox>
              ))}
            </VuiBox>
            {/* sempre no HTML (some só na tela) para o PDF sair com todos os cursos */}
            <VuiBox className="acordeon-conteudo" sx={{ display: abertoAqui ? "block" : "none", p: "4px 12px 12px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ ...estiloTh, textAlign: "left" }}>Curso</th>
                    <th style={{ ...estiloTh, textAlign: "center" }}>Alunos ativos</th>
                    <th style={{ ...estiloTh, textAlign: "center" }}>Frequência</th>
                    <th style={{ ...estiloTh, textAlign: "center" }}>Média de notas</th>
                    <th style={{ ...estiloTh, textAlign: "center" }}>Módulos concluídos</th>
                  </tr>
                </thead>
                <tbody>
                  {g.cursos.map((c) => (
                    <tr key={c.cursoId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <VuiBox display="flex" alignItems="center" gap="10px">
                          <VuiBox sx={{ width: 10, height: 10, borderRadius: "50%", background: c.cor, flexShrink: 0 }} />
                          <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ fontSize: "13px" }}>
                            {c.nome}
                          </VuiTypography>
                          {c.tipo !== g.grupo && (
                            <VuiTypography variant="caption" color="text" sx={{ fontSize: "10px" }}>
                              ({c.tipo})
                            </VuiTypography>
                          )}
                        </VuiBox>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 10px" }}>
                        <VuiTypography variant="button" color="white">
                          {c.alunosAtivos}
                        </VuiTypography>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 10px" }}>
                        <VuiTypography variant="button" color={corFreq(c.frequencia)} fontWeight="bold">
                          {c.frequencia}%
                        </VuiTypography>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 10px" }}>
                        <VuiTypography variant="button" color="white">
                          {c.mediaNota !== null ? `${fmt(c.mediaNota)} / 10` : "—"}
                        </VuiTypography>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 10px" }}>
                        <VuiTypography variant="button" color="white" fontWeight="medium">
                          {c.modulosConcluidos}
                        </VuiTypography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </VuiBox>
          </VuiBox>
        );
      })}
    </Card>
  );
}
PerformanceAgrupada.propTypes = { grupos: PropTypes.array.isRequired };

