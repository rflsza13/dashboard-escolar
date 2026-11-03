import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoAdd } from "react-icons/io5";

import { useEscola } from "context/escola";
import { DIAS_GRADE, cursosComCor, horaParaMin, tipoDoCurso } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import Tabela, { texto } from "layouts/shared/Tabela";
import FormDialog from "layouts/shared/FormDialog";
import { MatriculaDialog } from "layouts/shared/CadastroDialogs";

function Cursos() {
  const { dados, pode, salvar, excluir, recursos } = useEscola();
  const history = useHistory();
  const [sel, setSel] = useState("");
  const [cursoDlg, setCursoDlg] = useState({ open: false, curso: null });
  const [moduloDlg, setModuloDlg] = useState({ open: false, modulo: null });
  const [matDlg, setMatDlg] = useState({ open: false, matricula: null });

  const curso = dados.cursos.find((c) => c.id === sel) || dados.cursos[0] || null;
  const alunos = useMemo(() => dados.alunos.reduce((m, a) => ({ ...m, [a.id]: a }), {}), [dados.alunos]);
  const modulos = useMemo(() => (curso ? dados.modulos.filter((m) => m.cursoId === curso.id).sort((a, b) => a.ordem - b.ordem) : []), [dados.modulos, curso]);
  const turma = useMemo(
    () =>
      curso
        ? dados.matriculas
            .filter((m) => m.cursoId === curso.id && (m.status === "Ativa" || m.status === "Trancada"))
            .sort((a, b) => DIAS_GRADE.indexOf(a.dia) - DIAS_GRADE.indexOf(b.dia) || horaParaMin(a.inicio) - horaParaMin(b.inicio))
        : [],
    [dados.matriculas, curso]
  );
  const cursosCor = useMemo(() => cursosComCor(dados.cursos), [dados.cursos]);
  const contagem = (c) => dados.matriculas.filter((m) => m.cursoId === c.id && m.status === "Ativa").length;

  const colMod = [{ nome: "#" }, { nome: "Módulo" }, ...(recursos.pontos ? [{ nome: "Pontos", align: "right" }] : [])];
  const linhasMod = modulos.map((m) => ({
    chave: m.id,
    onClick: pode.admin ? () => setModuloDlg({ open: true, modulo: m }) : undefined,
    celulas: [texto(String(m.ordem)), texto(m.nome, "white"), ...(recursos.pontos ? [texto(m.pontos === null || m.pontos === "" ? `${dados.config.pontosPadrao} (padrão)` : String(m.pontos))] : [])],
  }));

  const colTurma = [{ nome: "Dia" }, { nome: "Horário" }, { nome: "Aluno" }, { nome: "Modalidade" }, { nome: "Módulo" }, { nome: "Situação" }];
  const linhasTurma = turma.map((m) => ({
    chave: m.id,
    onClick: () => history.push(`/alunos/${m.alunoId}`),
    celulas: [texto(m.dia), texto(m.inicio), texto((alunos[m.alunoId] || {}).nome || "Aluno removido", "white"), texto(m.modalidade), texto(String(m.moduloAtual)), texto(m.status === "Trancada" ? "Trancada" : "Ativa")],
  }));

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Cursos e turmas
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Módulos de cada curso e os alunos matriculados por dia e horário.
            </VuiTypography>
          </VuiBox>
          {pode.admin && (
            <VuiButton color="info" variant="contained" onClick={() => setCursoDlg({ open: true, curso: null })}>
              <IoAdd size="16px" style={{ marginRight: 8 }} />
              Novo curso
            </VuiButton>
          )}
        </VuiBox>

        {dados.cursos.length === 0 && texto("Nenhum curso cadastrado.")}

        {curso && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={3}>
              <Card>
                {cursosCor.map((c) => (
                  <VuiBox
                    key={c.id}
                    onClick={() => setSel(c.id)}
                    sx={{ cursor: "pointer", p: "10px 12px", mb: "6px", borderRadius: "12px", borderLeft: `4px solid ${c.cor}`, background: c.id === curso.id ? "rgba(227,36,43,0.20)" : "rgba(255,255,255,0.03)" }}
                  >
                    <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                      {c.nome}
                      {c.ativo === "Não" ? " (inativo)" : ""}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {tipoDoCurso(c)} ·{" "}
                      {contagem(c)} aluno(s) ativo(s) · {dados.modulos.filter((m) => m.cursoId === c.id).length} módulo(s)
                    </VuiTypography>
                  </VuiBox>
                ))}
              </Card>
            </Grid>

            <Grid item xs={12} lg={9}>
              <VuiBox mb={3}>
                <Card>
                  <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="8px" mb="12px">
                    <VuiTypography variant="lg" color="white" fontWeight="bold">
                      Módulos de {curso.nome}
                    </VuiTypography>
                    {pode.admin && (
                      <VuiBox display="flex" gap="8px">
                        <VuiButton size="small" color="info" variant="text" onClick={() => setCursoDlg({ open: true, curso })}>
                          Editar curso
                        </VuiButton>
                        <VuiButton size="small" color="info" variant="outlined" onClick={() => setModuloDlg({ open: true, modulo: null })}>
                          Novo módulo
                        </VuiButton>
                      </VuiBox>
                    )}
                  </VuiBox>
                  <Tabela colunas={colMod} linhas={linhasMod} vazio="Este curso ainda não tem módulos." />
                </Card>
              </VuiBox>

              <Card>
                <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="8px" mb="12px">
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    Turma
                  </VuiTypography>
                  {pode.admin && (
                    <VuiButton size="small" color="info" variant="outlined" onClick={() => setMatDlg({ open: true, matricula: null })}>
                      Nova matrícula neste curso
                    </VuiButton>
                  )}
                </VuiBox>
                <Tabela colunas={colTurma} linhas={linhasTurma} vazio="Nenhum aluno matriculado." />
              </Card>
            </Grid>
          </Grid>
        )}
      </VuiBox>

      <FormDialog
        open={cursoDlg.open}
        titulo={cursoDlg.curso ? "Editar curso" : "Novo curso"}
        descricao="O tipo do curso (Programação, Robótica 1, Robótica 2 ou Inglês) vem do nome: cursos do mesmo tipo usam a mesma cor na grade, a do primeiro curso do tipo. Use “Robótica 1”, “Robótica 2” ou “Inglês” no nome."
        campos={[
          { chave: "nome", rotulo: "Nome do curso", obrigatorio: true, cheia: true },
          { chave: "cor", rotulo: "Cor na grade", tipo: "cor" },
          { chave: "ativo", rotulo: "Curso ativo", tipo: "select", obrigatorio: true, opcoes: [{ valor: "Sim", rotulo: "Sim" }, { valor: "Não", rotulo: "Não" }] },
        ]}
        inicial={cursoDlg.curso || { ativo: "Sim", cor: "#8E7CFF" }}
        onSalvar={async (v) => {
          const id = await salvar("Cursos", { ...cursoDlg.curso, ...v });
          if (id) setSel(id);
          return !!id;
        }}
        onExcluir={
          cursoDlg.curso
            ? async () => {
                if (window.confirm("Excluir este curso? Só é possível se não houver módulos nem matrículas ligados a ele.")) {
                  if (await excluir("Cursos", cursoDlg.curso.id)) {
                    setSel("");
                    setCursoDlg({ open: false, curso: null });
                  }
                }
              }
            : null
        }
        onClose={() => setCursoDlg({ open: false, curso: null })}
      />

      <FormDialog
        open={moduloDlg.open}
        titulo={moduloDlg.modulo ? "Editar módulo" : "Novo módulo"}
        descricao={recursos.pontos ? "Deixe os pontos em branco para usar o padrão definido na aba Config." : ""}
        campos={[
          { chave: "ordem", rotulo: "Ordem (1, 2, 3…)", tipo: "numero", min: 1, inteira: true, obrigatorio: true },
          ...(recursos.pontos ? [{ chave: "pontos", rotulo: "Pontos ao concluir (opcional)", tipo: "numero", min: 0 }] : []),
          { chave: "nome", rotulo: "Nome do módulo", obrigatorio: true, cheia: true },
        ]}
        inicial={moduloDlg.modulo || { ordem: modulos.length + 1 }}
        onSalvar={async (v) => !!(await salvar("Modulos", { ...moduloDlg.modulo, ...v, cursoId: curso.id }))}
        onExcluir={
          moduloDlg.modulo
            ? async () => {
                if (window.confirm("Excluir este módulo? Só é possível se nenhum aluno já o concluiu.")) {
                  if (await excluir("Modulos", moduloDlg.modulo.id)) setModuloDlg({ open: false, modulo: null });
                }
              }
            : null
        }
        onClose={() => setModuloDlg({ open: false, modulo: null })}
      />

      <MatriculaDialog open={matDlg.open} matricula={matDlg.matricula} cursoId={curso ? curso.id : ""} onClose={() => setMatDlg({ open: false, matricula: null })} />
    </DashboardLayout>
  );
}

export default Cursos;
