import { useMemo, useState } from "react";

import { Card, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoChevronBack, IoChevronForward, IoAdd } from "react-icons/io5";

import { useEscola } from "context/escola";
import { CAT_INGLES, CAT_PROGRAMACAO, DEFAULT_CONFIG, DIAS_GRADE, DIAS_LONGOS, ROTULO_CATEGORIA, siglaDia, barraDoStatus, fimDaAula, formatarData, formatarDataCurta, hojeIso, feriadoDaData, legendaDeCursos, misturarCor, montarSessoes, segundaDaSemana, somarDias } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import AulaDialog from "layouts/shared/AulaDialog";
import NovaAulaDialog from "layouts/shared/NovaAulaDialog";
import GradeSemanal from "layouts/horario/components/GradeSemanal";

const FUNDO_CARD = "#150a0b";

function Legenda({ cor, texto }) {
  return (
    <VuiBox display="flex" alignItems="center" gap="6px">
      <VuiBox sx={{ width: 12, height: 12, borderRadius: "4px", background: cor }} />
      <VuiTypography variant="caption" color="text">
        {texto}
      </VuiTypography>
    </VuiBox>
  );
}

const OPCOES_CURSO = [CAT_PROGRAMACAO, CAT_INGLES];

// Vista mobile: lista vertical das aulas de um dia
function ListaDiaria({ dia, sessoes, feriado, onSelecionar }) {
  const aulasDoDia = sessoes.filter((s) => s.data === dia).sort((a, b) => a.hora.localeCompare(b.hora));

  if (feriado) {
    return (
      <VuiBox sx={{ textAlign: "center", py: 4 }}>
        <VuiTypography variant="button" color="text" sx={{ color: "#F5A524" }}>
          {feriado.origem === "ferias" ? "🏖️ Férias" : "🎉 Feriado"} · {feriado.nome}
        </VuiTypography>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 1 }}>
          Sem aulas neste dia.
        </VuiTypography>
      </VuiBox>
    );
  }

  if (aulasDoDia.length === 0) {
    return (
      <VuiBox sx={{ textAlign: "center", py: 4 }}>
        <VuiTypography variant="button" color="text">
          Nenhuma aula neste dia.
        </VuiTypography>
      </VuiBox>
    );
  }

  return (
    <VuiBox sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: "8px", mt: 1 }}>
      {aulasDoDia.map((s) => {
        const barra = barraDoStatus(s.status);
        return (
          <VuiBox
            key={s.chave}
            onClick={() => onSelecionar(s)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              p: "10px 14px",
              borderRadius: "10px",
              borderLeft: `4px solid ${s.cor}`,
              background: misturarCor(s.cor, FUNDO_CARD, 0.34),
              cursor: "pointer",
              "&:hover": { background: misturarCor(s.cor, FUNDO_CARD, 0.52) },
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* barra de status no canto direito */}
            <VuiBox
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
            <VuiBox sx={{ flex: 1, minWidth: 0 }}>
              <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.aluno}
              </VuiTypography>
              <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                {s.curso} · {s.hora}{fimDaAula(s.hora, s.duracao) ? `–${fimDaAula(s.hora, s.duracao)}` : ""}
              </VuiTypography>
            </VuiBox>
            <VuiTypography variant="caption" sx={{ color: barra.cor, fontWeight: 700, flexShrink: 0, mr: "12px", fontSize: "11px" }}>
              {barra.rotulo}
            </VuiTypography>
          </VuiBox>
        );
      })}
    </VuiBox>
  );
}

function Horario() {
  const { dados, pode, excluir, recursos, areaPerfil } = useEscola();
  const cfg = { ...DEFAULT_CONFIG, ...dados.config };
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [segunda, setSegunda] = useState(segundaDaSemana(hojeIso()));
  const [filtroEscolhido, setCursoFiltro] = useState(CAT_PROGRAMACAO);
  const [aula, setAula] = useState(null);
  const [nova, setNova] = useState(false);
  const [novaInicial, setNovaInicial] = useState({ data: "", hora: "" });

  // instrutor vê só a aba da própria área; os demais, as abas liberadas em Configurações
  const opcoesCurso = areaPerfil ? [areaPerfil] : recursos.ingles ? OPCOES_CURSO : [CAT_PROGRAMACAO];
  const cursoFiltro = opcoesCurso.includes(filtroEscolhido) ? filtroEscolhido : opcoesCurso[0];

  const dias = useMemo(() => DIAS_GRADE.map((_, i) => somarDias(segunda, i)), [segunda]);

  // Visão: só o dia (começa em hoje, deixa mais espaço para os cards) ou a semana completa.
  // No celular já é uma lista por dia, então lá vale sempre a semana (com as abas de dia).
  const [visao, setVisao] = useState("dia");
  const [diaSel, setDiaSel] = useState(hojeIso());
  const usarSemana = isMobile || visao === "semana";
  const diasVisiveis = useMemo(() => (usarSemana ? dias : [diaSel]), [usarSemana, dias, diaSel]);

  // Tab mobile: qual dia está selecionado (índice 0-5)
  const diaHojeIdx = dias.indexOf(hojeIso());
  const [tabDia, setTabDia] = useState(diaHojeIdx >= 0 ? diaHojeIdx : 0);

  const todas = useMemo(
    () => montarSessoes(dados, diasVisiveis[0], diasVisiveis[diasVisiveis.length - 1], { comCanceladas: true }).filter((s) => s.categoria === cursoFiltro),
    [dados, diasVisiveis, cursoFiltro]
  );
  const sessoes = useMemo(() => todas.filter((s) => !s.cancelada), [todas]);
  const canceladas = useMemo(() => todas.filter((s) => s.cancelada), [todas]);
  const feriadosSemana = useMemo(() => diasVisiveis.map((d) => feriadoDaData(dados, d)), [dados, diasVisiveis]);

  const legenda = useMemo(() => legendaDeCursos(dados.cursos), [dados.cursos]);
  const semanaAtual = segunda === segundaDaSemana(hojeIso());

  // pula o domingo ao andar dia a dia (a grade vai de segunda a sábado)
  const passoDia = (d, n) => {
    const x = somarDias(d, n);
    return siglaDia(x) === "Dom" ? somarDias(x, n) : x;
  };
  const irAnterior = () => {
    if (usarSemana) {
      setSegunda(somarDias(segunda, -7));
      setTabDia(0);
    } else setDiaSel(passoDia(diaSel, -1));
  };
  const irProxima = () => {
    if (usarSemana) {
      setSegunda(somarDias(segunda, 7));
      setTabDia(0);
    } else setDiaSel(passoDia(diaSel, 1));
  };
  const irHoje = () => {
    setSegunda(segundaDaSemana(hojeIso()));
    setDiaSel(hojeIso());
    const idx = dias.indexOf(hojeIso());
    setTabDia(idx >= 0 ? idx : 0);
  };
  const trocarVisao = (v) => {
    if (v === visao) return;
    if (v === "semana") setSegunda(segundaDaSemana(diaSel));
    else setDiaSel(dias.includes(hojeIso()) ? hojeIso() : dias[0]);
    setVisao(v);
  };
  const noPresente = usarSemana ? semanaAtual : diaSel === hojeIso();

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />

        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Horário das aulas
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              {usarSemana ? (
                <>
                  {formatarData(dias[0])} a {formatarData(dias[5])}
                  {semanaAtual ? " · semana atual" : ""}
                </>
              ) : (
                <>
                  {DIAS_LONGOS[siglaDia(diaSel)]}, {formatarData(diaSel)}
                  {diaSel === hojeIso() ? " · hoje" : ""}
                </>
              )}
            </VuiTypography>
          </VuiBox>
          <VuiBox display="flex" flexWrap="wrap" alignItems="center" gap="8px">
            <VuiButton size="small" color="info" variant="outlined" onClick={irAnterior}>
              <IoChevronBack size="14px" />
            </VuiButton>
            <VuiButton size="small" color="info" variant="outlined" disabled={noPresente} onClick={irHoje}>
              Hoje
            </VuiButton>
            <VuiButton size="small" color="info" variant="outlined" onClick={irProxima}>
              <IoChevronForward size="14px" />
            </VuiButton>

            {pode.professor && (
              <VuiButton size="small" color="info" variant="contained" onClick={() => { setNovaInicial({ data: "", hora: "" }); setNova(true); }}>
                <IoAdd size="14px" style={{ marginRight: 4 }} />
                Nova aula
              </VuiButton>
            )}
          </VuiBox>
        </VuiBox>

        {/* Visão da grade: dia ou semana completa (no celular a grade já é por dia) */}
        {!isMobile && (
          <VuiBox display="flex" alignItems="center" gap="10px" mb={2}>
            {[["dia", "Dia"], ["semana", "Semana completa"]].map(([v, rotulo]) => (
              <VuiButton
                key={v}
                size="small"
                color="info"
                variant={visao === v ? "contained" : "outlined"}
                onClick={() => trocarVisao(v)}
                sx={{ borderRadius: "8px", px: 2, py: 0.8, textTransform: "none", fontWeight: visao === v ? "bold" : "regular" }}
              >
                {rotulo}
              </VuiButton>
            ))}
          </VuiBox>
        )}

        {/* Abas de categoria (Programação / Inglês) */}
        <VuiBox display="flex" alignItems="center" gap="10px" mb={2}>
          {opcoesCurso.length > 1 && opcoesCurso.map((opcao) => {
            const ativo = cursoFiltro === opcao;
            return (
              <VuiButton
                key={opcao}
                size="small"
                color="info"
                variant={ativo ? "contained" : "outlined"}
                onClick={() => setCursoFiltro(opcao)}
                sx={{ borderRadius: "8px", px: 2, py: 0.8, textTransform: "none", fontWeight: ativo ? "bold" : "regular" }}
              >
                {ROTULO_CATEGORIA[opcao]}
              </VuiButton>
            );
          })}
        </VuiBox>

        <Card>
          <VuiBox display="flex" flexWrap="wrap" gap="16px" mb={2}>
            <Legenda cor={cfg.corOnline} texto="Online" />
            <Legenda cor={cfg.corReposicao} texto="Reposição" />
            <Legenda cor={cfg.corExperimental} texto="Aula experimental" />
            {legenda.map((l) => (
              <Legenda key={l.chave} cor={l.cor} texto={l.rotulo} />
            ))}
          </VuiBox>

          {isMobile ? (
            /* ── Vista Mobile: tabs por dia + lista vertical ── */
            <>
              <Tabs
                value={tabDia}
                onChange={(_, v) => setTabDia(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 2,
                  "& .MuiTabs-indicator": { background: "#e3242b", height: "3px", borderRadius: "2px" },
                  "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontSize: "12px", minWidth: 0, px: 1.5, textTransform: "none" },
                  "& .Mui-selected": { color: "#fff !important", fontWeight: 700 },
                }}
              >
                {dias.map((d, i) => {
                  const ehHoje = d === hojeIso();
                  const countAulas = sessoes.filter((s) => s.data === d).length;
                  return (
                    <Tab
                      key={d}
                      label={
                        <VuiBox sx={{ textAlign: "center" }}>
                          <VuiTypography variant="caption" sx={{ display: "block", fontSize: "11px", fontWeight: ehHoje ? 800 : 500, color: "inherit", lineHeight: 1 }}>
                            {DIAS_GRADE[i]}
                          </VuiTypography>
                          <VuiTypography variant="caption" sx={{ display: "block", fontSize: "10px", color: "inherit", opacity: 0.7, lineHeight: 1.3 }}>
                            {formatarDataCurta(d)}
                          </VuiTypography>
                          {countAulas > 0 && (
                            <VuiBox sx={{ width: 6, height: 6, borderRadius: "50%", background: ehHoje ? "#e3242b" : "rgba(255,255,255,0.4)", margin: "2px auto 0" }} />
                          )}
                        </VuiBox>
                      }
                      sx={{ background: ehHoje ? "rgba(227,36,43,0.12)" : "transparent", borderRadius: "8px 8px 0 0" }}
                    />
                  );
                })}
              </Tabs>
              <ListaDiaria
                dia={dias[tabDia]}
                sessoes={sessoes}
                feriado={feriadosSemana[tabDia]}
                onSelecionar={setAula}
              />
            </>
          ) : (
            /* ── Vista Desktop: grade semanal completa ── */
            <>
              <GradeSemanal
                dias={diasVisiveis}
                sessoes={sessoes}
                feriados={feriadosSemana}
                onSelecionar={setAula}
                onNovaCelula={pode.professor ? (data, hora) => { setNovaInicial({ data, hora }); setNova(true); } : undefined}
              />
              {sessoes.length === 0 && (
                <VuiTypography variant="button" color="text" fontWeight="regular" mt={2} sx={{ display: "block" }}>
                  {usarSemana ? "Nenhuma aula encontrada para o filtro selecionado nesta semana." : "Nenhuma aula encontrada para o filtro selecionado neste dia."}
                </VuiTypography>
              )}
            </>
          )}
        </Card>

        {canceladas.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
              {usarSemana ? "Aulas canceladas nesta semana" : "Aulas canceladas neste dia"}
            </VuiTypography>
            <VuiTypography variant="caption" color="text" mb="14px" sx={{ display: "block" }}>
              Elas não aparecem na grade nem contam como falta. Use Restaurar para devolver a aula à grade.
            </VuiTypography>
            {canceladas.map((s) => (
              <VuiBox key={s.chave} display="flex" alignItems="center" justifyContent="space-between" gap="12px" sx={{ p: "8px 10px", mb: "6px", borderRadius: "10px", background: "rgba(255,255,255,0.04)" }}>
                <VuiTypography variant="button" color="white" fontWeight="regular">
                  {formatarData(s.data)} · {s.hora}–{fimDaAula(s.hora, s.duracao)} · {s.aluno} — {s.curso}
                </VuiTypography>
                {pode.professor && (
                  <VuiButton size="small" color="info" variant="outlined" onClick={() => s.aulaId && excluir("Aulas", s.aulaId)}>
                    Restaurar
                  </VuiButton>
                )}
              </VuiBox>
            ))}
          </Card>
        )}
      </VuiBox>
      <AulaDialog sessao={aula} onClose={() => setAula(null)} />
      <NovaAulaDialog
        open={nova}
        dataInicial={novaInicial.data || (diasVisiveis.includes(hojeIso()) ? hojeIso() : diasVisiveis[0])}
        horaInicial={novaInicial.hora}
        onClose={() => setNova(false)}
      />
    </DashboardLayout>
  );
}

export default Horario;
