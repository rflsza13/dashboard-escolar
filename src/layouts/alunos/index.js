import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoPersonAdd } from "react-icons/io5";

import { useEscola } from "context/escola";
import { indexarAulas, resumoAluno } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import Tabela, { texto } from "layouts/shared/Tabela";
import { NativeSelect } from "layouts/shared/fields";
import { AlunoNovoDialog } from "layouts/shared/CadastroDialogs";

const PASSO = 25;

export const corPresenca = (p) => (p === null ? "#A0AEC0" : p >= 0.85 ? "#01B574" : p >= 0.7 ? "#F6AD55" : "#E31A1A");

function BarraProgresso({ pct, cor }) {
  return (
    <VuiBox sx={{ width: 110, height: 6, borderRadius: 3, background: "#2A2A2A", flexShrink: 0 }}>
      <VuiBox sx={{ width: `${Math.round(pct * 100)}%`, height: 6, borderRadius: 3, background: cor }} />
    </VuiBox>
  );
}

function Alunos() {
  const { dados, pode, recursos } = useEscola();
  const history = useHistory();
  const [busca, setBusca] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [mostrar, setMostrar] = useState("ativos");
  const [limite, setLimite] = useState(PASSO);
  const [novo, setNovo] = useState(false);

  const idx = useMemo(() => indexarAulas(dados), [dados]);
  const todos = useMemo(
    () => dados.alunos.map((a) => ({ aluno: a, r: resumoAluno(dados, a.id, idx) })).sort((x, y) => x.aluno.nome.localeCompare(y.aluno.nome, "pt-BR")),
    [dados, idx]
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todos.filter(
      ({ aluno, r }) =>
        (mostrar === "todos" || (mostrar === "ativos" ? aluno.ativo !== "Não" : aluno.ativo === "Não")) &&
        (!cursoId || r.matriculas.some((m) => m.matricula.cursoId === cursoId)) &&
        (!q || `${aluno.nome} ${aluno.responsavel}`.toLowerCase().includes(q))
    );
  }, [todos, busca, cursoId, mostrar]);

  const colunas = [{ nome: "Aluno" }, { nome: "Cursos e andamento" }, { nome: "Presença", align: "right" }, ...(recursos.pontos ? [{ nome: "Pontos", align: "right" }] : [])];

  const linhas = filtrados.slice(0, limite).map(({ aluno, r }) => ({
    chave: aluno.id,
    onClick: () => history.push(`/alunos/${aluno.id}`),
    celulas: [
      <VuiBox key="n">
        <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
          {aluno.nome}
        </VuiTypography>
        <VuiTypography variant="caption" color="text">
          {aluno.ativo === "Não" ? "Inativo" : aluno.responsavel || aluno.contato || "—"}
        </VuiTypography>
      </VuiBox>,
      <VuiBox key="c">
        {r.matriculas.length === 0 && texto("Sem matrícula")}
        {r.matriculas.map(({ matricula, curso, progresso }) => (
          <VuiBox key={matricula.id} display="flex" alignItems="center" gap="10px" mb="4px">
            <VuiBox sx={{ width: 10, height: 10, borderRadius: "3px", background: curso.cor || "#E3242B", flexShrink: 0 }} />
            <VuiTypography variant="caption" color="white" sx={{ minWidth: 110 }}>
              {curso.nome}
            </VuiTypography>
            {matricula.status === "Experimental" ? (
              <VuiTypography variant="caption" color="text">
                Aula experimental
              </VuiTypography>
            ) : (
              <>
                <BarraProgresso pct={progresso.pct} cor={curso.cor || "#E3242B"} />
                <VuiTypography variant="caption" color="text">
                  {matricula.status === "Concluída" ? "Concluído" : `Módulo ${matricula.moduloAtual} de ${progresso.total || "?"}`} · {Math.round(progresso.pct * 100)}%
                  {matricula.status === "Trancada" ? " · trancada" : ""}
                </VuiTypography>
              </>
            )}
          </VuiBox>
        ))}
      </VuiBox>,
      <VuiBox key="p">
        <VuiTypography variant="button" fontWeight="bold" sx={{ color: corPresenca(r.pctPresenca), display: "block" }}>
          {r.pctPresenca === null ? "—" : `${Math.round(r.pctPresenca * 100)}%`}
        </VuiTypography>
        <VuiTypography variant="caption" color="text">
          {r.presencas} pres. · {r.faltas} falta(s)
        </VuiTypography>
      </VuiBox>,
      ...(recursos.pontos ? [texto(String(r.saldo), "white")] : []),
    ],
  }));

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Alunos
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              {filtrados.length} aluno(s). Clique em um aluno para ver o acompanhamento.
            </VuiTypography>
          </VuiBox>
          {pode.admin && (
            <VuiButton color="info" variant="contained" onClick={() => setNovo(true)}>
              <IoPersonAdd size="16px" style={{ marginRight: 8 }} />
              Novo aluno na grade
            </VuiButton>
          )}
        </VuiBox>

        <Card>
          <VuiBox mb={2} sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <VuiInput placeholder="Buscar aluno ou responsável…" value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(PASSO); }} fullWidth />
            <NativeSelect value={cursoId} onChange={(e) => { setCursoId(e.target.value); setLimite(PASSO); }}>
              <option value="">Todos os cursos</option>
              {dados.cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect value={mostrar} onChange={(e) => { setMostrar(e.target.value); setLimite(PASSO); }}>
              <option value="ativos">Só ativos</option>
              <option value="inativos">Só inativos</option>
              <option value="todos">Todos</option>
            </NativeSelect>
          </VuiBox>
          <Tabela colunas={colunas} linhas={linhas} vazio="Nenhum aluno encontrado." />
          {filtrados.length > limite && (
            <VuiBox mt={2}>
              <VuiButton size="small" color="info" variant="outlined" onClick={() => setLimite((l) => l + PASSO)}>
                Mostrar mais
              </VuiButton>
            </VuiBox>
          )}
        </Card>
      </VuiBox>
      <AlunoNovoDialog open={novo} onClose={() => setNovo(false)} />
    </DashboardLayout>
  );
}

export default Alunos;
