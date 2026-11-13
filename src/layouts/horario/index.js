import { useMemo, useState } from "react";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoChevronBack, IoChevronForward, IoAdd } from "react-icons/io5";

import { useEscola } from "context/escola";
import { CAT_INGLES, CAT_PROGRAMACAO, DEFAULT_CONFIG, DIAS_GRADE, ROTULO_CATEGORIA, formatarData, hojeIso, feriadoDaData, fimDaAula, legendaDeCursos, montarSessoes, segundaDaSemana, somarDias } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import AulaDialog from "layouts/shared/AulaDialog";
import NovaAulaDialog from "layouts/shared/NovaAulaDialog";
import GradeSemanal from "layouts/horario/components/GradeSemanal";

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

function Horario() {
  const { dados, pode, excluir, recursos, areaPerfil } = useEscola();
  const cfg = { ...DEFAULT_CONFIG, ...dados.config };
  const [segunda, setSegunda] = useState(segundaDaSemana(hojeIso()));
  const [filtroEscolhido, setCursoFiltro] = useState(CAT_PROGRAMACAO);
  // instrutor vê só a aba da própria área; os demais, as abas liberadas em Configurações
  const opcoesCurso = areaPerfil ? [areaPerfil] : recursos.ingles ? OPCOES_CURSO : [CAT_PROGRAMACAO];
  const cursoFiltro = opcoesCurso.includes(filtroEscolhido) ? filtroEscolhido : opcoesCurso[0];
  const [aula, setAula] = useState(null);
  const [nova, setNova] = useState(false);

  const dias = useMemo(() => DIAS_GRADE.map((_, i) => somarDias(segunda, i)), [segunda]);

  const todas = useMemo(() => montarSessoes(dados, dias[0], dias[5], { comCanceladas: true }).filter((s) => s.categoria === cursoFiltro), [dados, dias, cursoFiltro]);
  const sessoes = useMemo(() => todas.filter((s) => !s.cancelada), [todas]);
  const canceladas = useMemo(() => todas.filter((s) => s.cancelada), [todas]);
  const feriadosSemana = useMemo(() => dias.map((d) => feriadoDaData(dados, d)), [dados, dias]);

  const legenda = useMemo(() => legendaDeCursos(dados.cursos), [dados.cursos]);
  const semanaAtual = segunda === segundaDaSemana(hojeIso());

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
              {formatarData(dias[0])} a {formatarData(dias[5])}
              {semanaAtual ? " · semana atual" : ""}
            </VuiTypography>
          </VuiBox>
          <VuiBox display="flex" flexWrap="wrap" alignItems="center" gap="8px">
            <VuiButton size="small" color="info" variant="outlined" onClick={() => setSegunda(somarDias(segunda, -7))}>
              <IoChevronBack size="14px" />
            </VuiButton>
            <VuiButton size="small" color="info" variant="outlined" disabled={semanaAtual} onClick={() => setSegunda(segundaDaSemana(hojeIso()))}>
              Hoje
            </VuiButton>
            <VuiButton size="small" color="info" variant="outlined" onClick={() => setSegunda(somarDias(segunda, 7))}>
              <IoChevronForward size="14px" />
            </VuiButton>

            {pode.professor && (
              <VuiButton size="small" color="info" variant="contained" onClick={() => setNova(true)}>
                <IoAdd size="14px" style={{ marginRight: 4 }} />
                Nova aula
              </VuiButton>
            )}
          </VuiBox>
        </VuiBox>

        {/* Abas / Botões alternadores no topo da grade */}
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
                sx={{
                  borderRadius: "8px",
                  px: 2,
                  py: 0.8,
                  textTransform: "none",
                  fontWeight: ativo ? "bold" : "regular",
                }}
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
          <GradeSemanal dias={dias} sessoes={sessoes} feriados={feriadosSemana} onSelecionar={setAula} />
          {sessoes.length === 0 && (
            <VuiTypography variant="button" color="text" fontWeight="regular" mt={2} sx={{ display: "block" }}>
              Nenhuma aula encontrada para o filtro selecionado nesta semana.
            </VuiTypography>
          )}
        </Card>

        {canceladas.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
              Aulas canceladas nesta semana
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
      <NovaAulaDialog open={nova} dataInicial={dias.includes(hojeIso()) ? hojeIso() : dias[0]} onClose={() => setNova(false)} />
    </DashboardLayout>
  );
}

export default Horario;
