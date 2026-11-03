import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { DIAS_GRADE, DURACAO_AULA, DURACAO_EXPERIMENTAL, hojeIso } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";
import FormDialog from "layouts/shared/FormDialog";

const SIM_NAO = [{ valor: "Sim", rotulo: "Sim" }, { valor: "Não", rotulo: "Não" }];
const MODALIDADES = [{ valor: "Presencial", rotulo: "Presencial" }, { valor: "Online", rotulo: "Online" }];
const DIAS = DIAS_GRADE.map((d) => ({ valor: d, rotulo: d }));

/* ---------- editar dados do aluno ---------- */
export function AlunoDialog({ open, aluno, onClose }) {
  const { salvar } = useEscola();
  const campos = [
    { chave: "nome", rotulo: "Nome", obrigatorio: true, cheia: true },
    { chave: "responsavel", rotulo: "Responsável" },
    { chave: "contato", rotulo: "Contato" },
    { chave: "ativo", rotulo: "Aluno ativo", tipo: "select", opcoes: SIM_NAO, obrigatorio: true },
    { chave: "obs", rotulo: "Observações", cheia: true },
  ];
  return (
    <FormDialog
      open={open}
      titulo="Dados do aluno"
      campos={campos}
      inicial={aluno}
      onSalvar={async (v) => !!(await salvar("Alunos", { ...aluno, ...v }))}
      onClose={onClose}
    />
  );
}
AlunoDialog.defaultProps = { aluno: null };
AlunoDialog.propTypes = { open: PropTypes.bool.isRequired, aluno: PropTypes.object, onClose: PropTypes.func.isRequired };

/* ---------- matrícula (criar/editar) ---------- */
export function MatriculaDialog({ open, matricula, alunoId, cursoId, onClose }) {
  const { dados, salvar, excluir } = useEscola();
  const editando = Boolean(matricula);
  const campos = useMemo(() => {
    const lista = [];
    if (!alunoId) {
      lista.push({
        chave: "alunoId", rotulo: "Aluno", tipo: "select", obrigatorio: true, cheia: true,
        opcoes: dados.alunos.filter((a) => a.ativo !== "Não").map((a) => ({ valor: a.id, rotulo: a.nome })),
      });
    }
    lista.push(
      { chave: "cursoId", rotulo: "Curso", tipo: "select", obrigatorio: true, opcoes: dados.cursos.map((c) => ({ valor: c.id, rotulo: c.nome })) },
      { chave: "modalidade", rotulo: "Modalidade", tipo: "select", obrigatorio: true, opcoes: MODALIDADES },
      { chave: "dia", rotulo: "Dia da semana", tipo: "select", obrigatorio: true, opcoes: DIAS },
      { chave: "inicio", rotulo: "Horário", tipo: "hora", obrigatorio: true },
      { chave: "moduloAtual", rotulo: "Módulo atual (número)", tipo: "numero", min: 1, inteira: true, obrigatorio: true },
      { chave: "dataInicio", rotulo: "Data de início", tipo: "data" },
      {
        chave: "status", rotulo: "Situação", tipo: "select", obrigatorio: true,
        opcoes: ["Ativa", "Trancada", "Concluída", "Experimental"].map((s) => ({ valor: s, rotulo: s })),
      }
    );
    return lista;
  }, [dados.alunos, dados.cursos, alunoId]);

  const inicial = useMemo(
    () => matricula || { alunoId: alunoId || "", cursoId: cursoId || "", modalidade: "Presencial", dia: "Seg", inicio: "", moduloAtual: 1, dataInicio: hojeIso(), status: "Ativa" },
    [matricula, alunoId, cursoId]
  );

  return (
    <FormDialog
      open={open}
      titulo={editando ? "Editar matrícula" : "Nova matrícula"}
      descricao="A aula se repete toda semana no dia e horário escolhidos, enquanto a situação for Ativa."
      campos={campos}
      inicial={inicial}
      onSalvar={async (v) => !!(await salvar("Matriculas", { obs: "", ...matricula, ...v, alunoId: alunoId || v.alunoId, duracao: v.status === "Experimental" ? DURACAO_EXPERIMENTAL : DURACAO_AULA }))}
      onExcluir={
        editando
          ? async () => {
              if (window.confirm("Excluir esta matrícula? Se já houver aulas registradas, o sistema não deixa excluir (use a situação Trancada ou Concluída).")) {
                if (await excluir("Matriculas", matricula.id)) onClose();
              }
            }
          : null
      }
      onClose={onClose}
    />
  );
}
MatriculaDialog.defaultProps = { matricula: null, alunoId: "", cursoId: "" };
MatriculaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  matricula: PropTypes.object,
  alunoId: PropTypes.string,
  cursoId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

/* ---------- cadastro de aluno novo já na grade ---------- */
const novoHorario = () => ({ dia: "Seg", hora: "", modalidade: "Presencial" });

export function AlunoNovoDialog({ open, onClose }) {
  const { dados, salvar } = useEscola();
  const history = useHistory();
  const [f, setF] = useState({ nome: "", responsavel: "", contato: "", obs: "", cursoId: "", modulo: "1", dataInicio: hojeIso() });
  const [horarios, setHorarios] = useState([novoHorario()]);
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErros({});
    setF({ nome: "", responsavel: "", contato: "", obs: "", cursoId: (dados.cursos[0] || {}).id || "", modulo: "1", dataInicio: hojeIso() });
    setHorarios([novoHorario()]);
    /* eslint-disable-next-line */
  }, [open]);

  const modulosDoCurso = dados.modulos.filter((m) => m.cursoId === f.cursoId).sort((a, b) => a.ordem - b.ordem);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setH = (i, k, valor) => setHorarios((hs) => hs.map((h, j) => (j === i ? { ...h, [k]: valor } : h)));
  const colegas = (h) => dados.matriculas.filter((m) => m.status === "Ativa" && m.dia === h.dia && m.inicio === h.hora).length;

  const validar = () => {
    const e = {};
    if (!f.nome.trim()) e.nome = "Informe o nome.";
    if (!f.cursoId) e.cursoId = "Escolha o curso.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dataInicio)) e.dataInicio = "Informe a data de início.";
    if (horarios.some((h) => !/^\d{1,2}:\d{2}$/.test(h.hora))) e.horarios = "Preencha o horário de todas as aulas.";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const cadastrar = async () => {
    if (!validar()) return;
    setOcupado(true);
    const alunoId = await salvar("Alunos", { nome: f.nome.trim(), responsavel: f.responsavel.trim(), contato: f.contato.trim(), ativo: "Sim", obs: f.obs.trim() });
    let tudo = !!alunoId;
    for (let i = 0; tudo && i < horarios.length; i += 1) {
      const h = horarios[i];
      // eslint-disable-next-line no-await-in-loop
      const id = await salvar("Matriculas", {
        alunoId, cursoId: f.cursoId, dia: h.dia, inicio: h.hora, duracao: DURACAO_AULA, modalidade: h.modalidade,
        moduloAtual: Number(f.modulo) || 1, dataInicio: f.dataInicio, status: "Ativa", obs: "",
      });
      tudo = !!id;
    }
    setOcupado(false);
    if (alunoId) {
      onClose();
      history.push(`/alunos/${alunoId}`);
    }
  };

  const erro = (k) =>
    erros[k] ? (
      <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: "4px" }}>
        {erros[k]}
      </VuiTypography>
    ) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          Novo aluno na grade
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
          Cadastra o aluno e já coloca as aulas semanais dele no horário. Para matricular em outro curso depois, use a ficha do aluno.
        </VuiTypography>

        <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
          Dados do aluno
        </VuiTypography>
        <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", mb: 3 }}>
          <VuiBox>
            <FieldLabel>Nome</FieldLabel>
            <VuiInput fullWidth value={f.nome} onChange={set("nome")} error={Boolean(erros.nome)} />
            {erro("nome")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Responsável</FieldLabel>
            <VuiInput fullWidth value={f.responsavel} onChange={set("responsavel")} />
          </VuiBox>
          <VuiBox>
            <FieldLabel>Contato</FieldLabel>
            <VuiInput fullWidth value={f.contato} onChange={set("contato")} />
          </VuiBox>
          <VuiBox>
            <FieldLabel>Observações</FieldLabel>
            <VuiInput fullWidth value={f.obs} onChange={set("obs")} />
          </VuiBox>
        </VuiBox>

        <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
          Curso e horários
        </VuiTypography>
        <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px", mb: 2 }}>
          <VuiBox>
            <FieldLabel>Curso</FieldLabel>
            <NativeSelect value={f.cursoId} onChange={(e) => setF((x) => ({ ...x, cursoId: e.target.value, modulo: "1" }))}>
              {dados.cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </NativeSelect>
            {erro("cursoId")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Módulo inicial</FieldLabel>
            <NativeSelect value={f.modulo} onChange={set("modulo")}>
              {modulosDoCurso.length === 0 && <option value="1">1</option>}
              {modulosDoCurso.map((m) => (
                <option key={m.id} value={m.ordem}>
                  {m.ordem} · {m.nome}
                </option>
              ))}
            </NativeSelect>
          </VuiBox>
          <VuiBox>
            <FieldLabel>Início das aulas</FieldLabel>
            <VuiInput fullWidth type="date" value={f.dataInicio} onChange={set("dataInicio")} error={Boolean(erros.dataInicio)} inputProps={{ style: { colorScheme: "dark" } }} />
            {erro("dataInicio")}
          </VuiBox>
        </VuiBox>

        {horarios.map((h, i) => (
          <VuiBox key={i} sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", alignItems: "end", mb: 1.5 }}>
            <VuiBox>
              <FieldLabel>Dia da semana</FieldLabel>
              <NativeSelect value={h.dia} onChange={(e) => setH(i, "dia", e.target.value)}>
                {DIAS_GRADE.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </NativeSelect>
            </VuiBox>
            <VuiBox>
              <FieldLabel>Horário</FieldLabel>
              <VuiInput fullWidth type="time" value={h.hora} onChange={(e) => setH(i, "hora", e.target.value)} inputProps={{ style: { colorScheme: "dark" } }} />
            </VuiBox>
            <VuiBox>
              <FieldLabel>Modalidade</FieldLabel>
              <NativeSelect value={h.modalidade} onChange={(e) => setH(i, "modalidade", e.target.value)}>
                <option value="Presencial">Presencial</option>
                <option value="Online">Online</option>
              </NativeSelect>
            </VuiBox>
            <VuiBox display="flex" alignItems="center" gap="8px" sx={{ minHeight: 40 }}>
              {horarios.length > 1 && (
                <VuiButton size="small" color="error" variant="text" onClick={() => setHorarios((hs) => hs.filter((_, j) => j !== i))}>
                  Remover
                </VuiButton>
              )}
              {/^\d{1,2}:\d{2}$/.test(h.hora) && colegas(h) > 0 && (
                <VuiTypography variant="caption" color="text">
                  {colegas(h)} aluno(s) já têm aula nesse horário
                </VuiTypography>
              )}
            </VuiBox>
          </VuiBox>
        ))}
        {erro("horarios")}
        <VuiButton size="small" color="info" variant="outlined" onClick={() => setHorarios((hs) => [...hs, novoHorario()])}>
          Adicionar outro dia/horário
        </VuiButton>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px", gap: "8px" }}>
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        <VuiButton color="info" variant="contained" disabled={ocupado} onClick={cadastrar}>
          {ocupado ? "Cadastrando…" : "Cadastrar aluno"}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}
AlunoNovoDialog.propTypes = { open: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired };
