import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { DURACAO_EXPERIMENTAL, ehFalta, formatarData, hojeIso, dataDeIso } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";

const vazio = () => ({ tipo: "Experimental", nome: "", contato: "", cursoId: "", professorId: "", matriculaId: "", faltaId: "", data: hojeIso(), hora: "", modalidade: "Presencial" });

function NovaAulaDialog({ open, dataInicial, onClose }) {
  const { dados, salvar, criarExperimental, recursos } = useEscola();
  const [f, setF] = useState(vazio());
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErros({});
    setF({ ...vazio(), tipo: recursos.experimentais ? "Experimental" : "Avulsa", data: dataInicial || hojeIso(), cursoId: (dados.cursos[0] || {}).id || "" });
  }, [open, dataInicial, dados.cursos, recursos.experimentais]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const alunoDe = (id) => (dados.alunos.find((a) => a.id === id) || {}).nome || "?";
  const cursoDe = (id) => (dados.cursos.find((c) => c.id === id) || {}).nome || "?";
  const matriculasAtivas = dados.matriculas.filter((m) => m.status === "Ativa");
  const experimental = f.tipo === "Experimental";
  const reposicao = f.tipo === "Reposição";

  // faltas da matrícula escolhida que ainda não têm reposição agendada (a mais antiga primeiro)
  const pendentesDe = (matId) => {
    const comRep = new Set(dados.aulas.filter((a) => a.reposicaoDe).map((a) => a.reposicaoDe));
    return dados.aulas
      .filter((a) => a.matriculaId === matId && ehFalta(a.status) && (a.tipo || "Regular") !== "Reposição" && !comRep.has(a.id))
      .sort((a, b) => String(a.data).localeCompare(String(b.data)));
  };
  const faltasPendentes = useMemo(() => (f.matriculaId ? pendentesDe(f.matriculaId) : []), [dados.aulas, f.matriculaId]); // eslint-disable-line
  const escolherMatricula = (e) => {
    const matId = e.target.value;
    const pend = matId ? pendentesDe(matId) : [];
    setF((x) => ({ ...x, matriculaId: matId, faltaId: pend.length ? pend[0].id : "" }));
  };
  const professoresAtivos = recursos.professores ? dados.professores.filter((p) => p.ativo !== "Não") : [];

  const validar = () => {
    const e = {};
    if (experimental && !f.nome.trim()) e.nome = "Informe o nome.";
    if (experimental && !f.cursoId) e.cursoId = "Escolha o curso.";
    if (experimental && professoresAtivos.length && !f.professorId) e.professorId = "Escolha o professor responsável.";
    if (!experimental && !f.matriculaId) e.matriculaId = "Escolha o aluno e o curso.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) e.data = "Informe a data.";
    if (!/^\d{1,2}:\d{2}$/.test(f.hora)) e.hora = "Informe o horário.";
    if (f.tipo === "Reposição" && f.matriculaId && f.data) {
      const mat = dados.matriculas.find((m) => m.id === f.matriculaId);
      if (mat) {
        const matIds = dados.matriculas.filter((m) => m.alunoId === mat.alunoId).map((m) => m.id);
        const reposAluno = dados.aulas.filter(
          (a) => matIds.includes(a.matriculaId) && (a.tipo === "Reposição" || a.status === "Reposição agendada" || a.status === "Reposição realizada")
        );
        const repsMesmoDia = reposAluno.filter((r) => r.data === f.data);
        if (repsMesmoDia.length >= 2) {
          e.data = "Limite de 2 reposições no mesmo dia atingido.";
        } else {
          const alvo = dataDeIso(f.data).getTime();
          const trintaDias = 30 * 24 * 60 * 60 * 1000;
          const violou = reposAluno.some((r) => r.data !== f.data && Math.abs(alvo - dataDeIso(r.data).getTime()) < trintaDias);
          if (violou) e.data = "Intervalo inferior a 30 dias de outra reposição deste aluno.";
        }
      }
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvarAula = async () => {
    if (!validar()) return;
    setOcupado(true);
    let ok;
    if (experimental) {
      const r = await criarExperimental({ nome: f.nome.trim(), contato: f.contato.trim(), cursoId: f.cursoId, professorId: f.professorId, data: f.data, hora: f.hora, duracao: DURACAO_EXPERIMENTAL, modalidade: f.modalidade });
      ok = r.ok;
    } else if (reposicao) {
      const m = dados.matriculas.find((x) => x.id === f.matriculaId);
      ok = !!(await salvar("Aulas", { data: f.data, matriculaId: f.matriculaId, status: "Reposição agendada", tipo: "Reposição", hora: f.hora, modalidade: f.modalidade, modulo: m ? m.moduloAtual : "", reposicaoDe: f.faltaId || "", obs: "" }));
    } else {
      const m = dados.matriculas.find((x) => x.id === f.matriculaId);
      ok = !!(await salvar("Aulas", { data: f.data, matriculaId: f.matriculaId, status: "", tipo: "Avulsa", hora: f.hora, modalidade: f.modalidade, modulo: m ? m.moduloAtual : "", reposicaoDe: "", obs: "" }));
    }
    setOcupado(false);
    if (ok) onClose();
  };

  const erro = (k) =>
    erros[k] ? (
      <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: "4px" }}>
        {erros[k]}
      </VuiTypography>
    ) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          Nova aula
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiBox display="flex" gap="8px" mb={2} mt={1}>
          {[...(recursos.experimentais ? ["Experimental"] : []), "Avulsa", "Reposição"].map((t) => (
            <VuiButton key={t} size="small" color="info" variant={f.tipo === t ? "contained" : "outlined"} onClick={() => setF((x) => ({ ...x, tipo: t }))}>
              {t === "Experimental" ? "Aula experimental" : t === "Avulsa" ? "Aula avulsa" : "Aula de reposição"}
            </VuiButton>
          ))}
        </VuiBox>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
          {experimental
            ? "Para um visitante: ele é cadastrado como não ativo e a aula aparece só na data escolhida."
            : reposicao
            ? "Repõe uma falta do aluno. A falta escolhida deixa de contar como reposição pendente. Regras: no máximo 2 reposições no mesmo dia e 30 dias entre reposições do aluno."
            : "Aula extra de um aluno já matriculado, fora do dia e horário fixos."}
        </VuiTypography>

        <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
          {experimental ? (
            <>
              <VuiBox>
                <FieldLabel>Nome do aluno</FieldLabel>
                <VuiInput fullWidth value={f.nome} onChange={set("nome")} error={Boolean(erros.nome)} />
                {erro("nome")}
              </VuiBox>
              <VuiBox>
                <FieldLabel>Contato (opcional)</FieldLabel>
                <VuiInput fullWidth value={f.contato} onChange={set("contato")} />
              </VuiBox>
              <VuiBox sx={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Curso</FieldLabel>
                <NativeSelect value={f.cursoId} onChange={set("cursoId")}>
                  <option value="">Escolha…</option>
                  {dados.cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </NativeSelect>
                {erro("cursoId")}
              </VuiBox>
              {professoresAtivos.length > 0 && (
                <VuiBox sx={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Professor responsável</FieldLabel>
                  <NativeSelect value={f.professorId} onChange={set("professorId")}>
                    <option value="">Escolha…</option>
                    {professoresAtivos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </NativeSelect>
                  {erro("professorId")}
                </VuiBox>
              )}
            </>
          ) : (
            <VuiBox sx={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Aluno e curso</FieldLabel>
              <NativeSelect value={f.matriculaId} onChange={escolherMatricula}>
                <option value="">Escolha…</option>
                {matriculasAtivas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {alunoDe(m.alunoId)} — {cursoDe(m.cursoId)}
                  </option>
                ))}
              </NativeSelect>
              {erro("matriculaId")}
              {reposicao && f.matriculaId && (
                <VuiBox mt={2}>
                  <FieldLabel>Falta que será reposta</FieldLabel>
                  <NativeSelect value={f.faltaId} onChange={set("faltaId")}>
                    <option value="">Sem falta registrada (ex.: falta do sistema anterior)</option>
                    {faltasPendentes.map((a) => (
                      <option key={a.id} value={a.id}>
                        Falta de {formatarData(a.data)}
                      </option>
                    ))}
                  </NativeSelect>
                  {faltasPendentes.length === 0 && (
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "4px" }}>
                      Este aluno não tem faltas pendentes de reposição registradas aqui.
                    </VuiTypography>
                  )}
                </VuiBox>
              )}
            </VuiBox>
          )}
          <VuiBox>
            <FieldLabel>Data</FieldLabel>
            <VuiInput fullWidth type="date" value={f.data} onChange={set("data")} error={Boolean(erros.data)} inputProps={{ style: { colorScheme: "dark" } }} />
            {erro("data")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Horário</FieldLabel>
            <VuiInput fullWidth type="time" value={f.hora} onChange={set("hora")} error={Boolean(erros.hora)} inputProps={{ style: { colorScheme: "dark" } }} />
            {erro("hora")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Modalidade</FieldLabel>
            <NativeSelect value={f.modalidade} onChange={set("modalidade")}>
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </NativeSelect>
          </VuiBox>
        </VuiBox>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px", gap: "8px" }}>
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        <VuiButton color="info" variant="contained" disabled={ocupado} onClick={salvarAula}>
          {ocupado ? "Salvando…" : "Salvar"}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

NovaAulaDialog.defaultProps = { dataInicial: "" };
NovaAulaDialog.propTypes = { open: PropTypes.bool.isRequired, dataInicial: PropTypes.string, onClose: PropTypes.func.isRequired };

export default NovaAulaDialog;
