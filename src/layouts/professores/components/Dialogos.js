import { useEffect, useState } from "react";
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
import { CATEGORIAS, DIAS_GRADE, ROTULO_CATEGORIA, horaParaMin, valorDeArea } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";
import FormDialog from "layouts/shared/FormDialog";

/* ---------- cadastro e edição de professor ---------- */
export function ProfessorDialog({ open, professor, onClose }) {
  const { salvar, excluir } = useEscola();
  return (
    <FormDialog
      open={open}
      titulo={professor ? "Editar professor" : "Novo professor"}
      descricao="A cor identifica o professor na grade de professores."
      campos={[
        { chave: "nome", rotulo: "Nome", obrigatorio: true, cheia: true },
        { chave: "contato", rotulo: "Contato" },
        { chave: "cor", rotulo: "Cor na grade", tipo: "cor" },
        { chave: "ativo", rotulo: "Professor ativo", tipo: "select", obrigatorio: true, opcoes: [{ valor: "Sim", rotulo: "Sim" }, { valor: "Não", rotulo: "Não" }] },
        { chave: "obs", rotulo: "Observações", cheia: true },
      ]}
      inicial={professor || { ativo: "Sim", cor: "#FF8A3D" }}
      onSalvar={async (v) => !!(await salvar("Professores", { obs: "", ...professor, ...v }))}
      onExcluir={
        professor
          ? async () => {
              if (window.confirm("Excluir este professor? Só é possível se ele não tiver horários na escala (senão, marque como inativo).")) {
                if (await excluir("Professores", professor.id)) onClose();
              }
            }
          : null
      }
      onClose={onClose}
    />
  );
}
ProfessorDialog.defaultProps = { professor: null };
ProfessorDialog.propTypes = { open: PropTypes.bool.isRequired, professor: PropTypes.object, onClose: PropTypes.func.isRequired };

/* ---------- horários de um professor na grade ----------
   Novo: o professor tem uma ou mais linhas; cada linha tem seus dias da semana, início, fim e área.
   Ex.: Seg/Qua 14:00–18:00 numa linha e Sáb 08:00–12:00 em outra, tudo salvo de uma vez.
   Edição: um único horário (um dia). */
const linhaVazia = (dia = "", inicio = "") => {
  const min = horaParaMin(inicio);
  const fim = min >= 0 ? `${String(Math.min(23, Math.floor(min / 60) + 4)).padStart(2, "0")}:00` : "";
  return { dias: dia ? [dia] : [], inicio, fim, area: "" };
};

export function EscalaDialog({ open, bloco, diaInicial, horaInicial, onClose }) {
  const { dados, salvar, excluir } = useEscola();
  const editando = Boolean(bloco);
  const [professorId, setProfessorId] = useState("");
  const [obs, setObs] = useState("");
  const [linhas, setLinhas] = useState([linhaVazia()]);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErro("");
    if (bloco) {
      setProfessorId(bloco.professorId);
      setObs(bloco.obs || "");
      setLinhas([{ dias: [bloco.dia], inicio: bloco.inicio, fim: bloco.fim, area: bloco.categoria || "" }]);
    } else {
      setProfessorId("");
      setObs("");
      setLinhas([linhaVazia(diaInicial, horaInicial || "")]);
    }
  }, [open, bloco, diaInicial, horaInicial]);

  const mudarLinha = (i, parte) => setLinhas((ls) => ls.map((l, k) => (k === i ? { ...l, ...parte } : l)));
  const alternarDia = (i, d) => {
    const atuais = linhas[i].dias;
    if (editando) mudarLinha(i, { dias: [d] });
    else mudarLinha(i, { dias: atuais.includes(d) ? atuais.filter((x) => x !== d) : [...atuais, d] });
  };
  const professores = dados.professores.filter((p) => p.ativo !== "Não" || p.id === professorId);

  const salvarEscala = async () => {
    if (!professorId) return setErro("Escolha o professor.");
    for (let i = 0; i < linhas.length; i += 1) {
      const l = linhas[i];
      const nome = linhas.length > 1 ? `Horário ${i + 1}: ` : "";
      if (!l.dias.length) return setErro(`${nome}escolha pelo menos um dia da semana.`);
      if (horaParaMin(l.inicio) < 0 || horaParaMin(l.fim) < 0) return setErro(`${nome}informe o horário inicial e o final.`);
      if (horaParaMin(l.fim) <= horaParaMin(l.inicio)) return setErro(`${nome}o horário final deve ser depois do inicial.`);
      if (!l.area) return setErro(`${nome}escolha a área: Programação / Robótica ou Inglês.`);
    }
    setErro("");
    setOcupado(true);
    let ok = true;
    for (let i = 0; ok && i < linhas.length; i += 1) {
      const l = linhas[i];
      for (let k = 0; ok && k < l.dias.length; k += 1) {
        // eslint-disable-next-line no-await-in-loop
        const id = await salvar("Escala", {
          id: editando ? bloco.id : undefined, professorId, dia: l.dias[k], inicio: l.inicio, fim: l.fim, cursoId: valorDeArea(l.area), obs: obs.trim(),
        });
        ok = !!id;
      }
    }
    setOcupado(false);
    if (ok) onClose();
    return ok;
  };

  const apagar = async () => {
    if (!window.confirm("Remover este horário da escala do professor?")) return;
    if (await excluir("Escala", bloco.id)) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          {editando ? "Editar horário do professor" : "Horários na grade"}
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiBox sx={{ display: "grid", gap: "16px", mt: 1 }}>
          <VuiBox>
            <FieldLabel>Professor</FieldLabel>
            <NativeSelect value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
              <option value="">Escolha…</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </NativeSelect>
            {dados.professores.length === 0 && (
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "4px" }}>
                Cadastre o professor primeiro (botão “Novo professor”).
              </VuiTypography>
            )}
          </VuiBox>

          {!editando && (
            <VuiTypography variant="caption" color="text">
              Marque os dias que têm o mesmo horário. Se os horários mudam de um dia para outro, use “Adicionar outro horário”.
            </VuiTypography>
          )}

          {linhas.map((l, i) => (
            <VuiBox key={i} sx={{ p: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              {!editando && linhas.length > 1 && (
                <VuiBox sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <VuiTypography variant="button" color="white" fontWeight="bold">
                    Horário {i + 1}
                  </VuiTypography>
                  <VuiButton size="small" color="error" variant="text" onClick={() => setLinhas((ls) => ls.filter((_, k) => k !== i))}>
                    Remover
                  </VuiButton>
                </VuiBox>
              )}
              <VuiBox sx={{ gridColumn: "1 / -1" }}>
                <FieldLabel>{editando ? "Dia da semana" : "Dias da semana (pode marcar vários)"}</FieldLabel>
                <VuiBox display="flex" flexWrap="wrap" gap="8px">
                  {DIAS_GRADE.map((d) => (
                    <VuiButton key={d} size="small" color="info" variant={l.dias.includes(d) ? "contained" : "outlined"} onClick={() => alternarDia(i, d)}>
                      {d}
                    </VuiButton>
                  ))}
                </VuiBox>
              </VuiBox>
              <VuiBox>
                <FieldLabel>Início</FieldLabel>
                <VuiInput fullWidth type="time" value={l.inicio} onChange={(e) => mudarLinha(i, { inicio: e.target.value })} inputProps={{ style: { colorScheme: "dark" } }} />
              </VuiBox>
              <VuiBox>
                <FieldLabel>Fim</FieldLabel>
                <VuiInput fullWidth type="time" value={l.fim} onChange={(e) => mudarLinha(i, { fim: e.target.value })} inputProps={{ style: { colorScheme: "dark" } }} />
              </VuiBox>
              <VuiBox sx={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Área</FieldLabel>
                <NativeSelect value={l.area} onChange={(e) => mudarLinha(i, { area: e.target.value })}>
                  <option value="">{editando && !bloco.categoria ? "Sem área definida — escolha uma" : "Escolha…"}</option>
                  {CATEGORIAS.map((a) => (
                    <option key={a} value={a}>
                      {ROTULO_CATEGORIA[a]} (todos os cursos)
                    </option>
                  ))}
                </NativeSelect>
              </VuiBox>
            </VuiBox>
          ))}

          {!editando && (
            <VuiBox>
              <VuiButton size="small" color="info" variant="outlined" onClick={() => setLinhas((ls) => [...ls, linhaVazia()])}>
                + Adicionar outro horário
              </VuiButton>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "6px" }}>
                O professor aparece nas aulas de todos os cursos da área escolhida, nunca na outra. Para atender as duas áreas, adicione um horário para cada.
              </VuiTypography>
            </VuiBox>
          )}

          <VuiBox>
            <FieldLabel>Observações</FieldLabel>
            <VuiInput fullWidth value={obs} onChange={(e) => setObs(e.target.value)} />
          </VuiBox>
        </VuiBox>
        {erro && (
          <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: 2 }}>
            {erro}
          </VuiTypography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px", gap: "8px" }}>
        {editando && (
          <VuiButton color="error" variant="text" onClick={apagar} sx={{ mr: "auto" }}>
            Remover
          </VuiButton>
        )}
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        <VuiButton color="info" variant="contained" disabled={ocupado} onClick={salvarEscala}>
          {ocupado ? "Salvando…" : "Salvar"}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}
EscalaDialog.defaultProps = { bloco: null, diaInicial: "", horaInicial: "" };
EscalaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  bloco: PropTypes.object,
  diaInicial: PropTypes.string,
  horaInicial: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
