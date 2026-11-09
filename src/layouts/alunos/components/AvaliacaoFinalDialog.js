import { useEffect, useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { CONCEITOS, hojeIso } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";

// item: { matricula, curso }; existente: avaliação final já salva (ou undefined)
function AvaliacaoFinalDialog({ open, item, existente, onClose }) {
  const { dados, recursos, salvarAvaliacaoFinal } = useEscola();
  const [f, setF] = useState({ conceito: "", nota: "", comentario: "", data: hojeIso(), professorId: "" });
  const [concluir, setConcluir] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErro("");
    setConcluir(false);
    setF({
      conceito: existente ? existente.conceito : "",
      nota: existente && existente.nota !== "" && existente.nota !== null ? String(existente.nota).replace(".", ",") : "",
      comentario: existente ? existente.comentario || "" : "",
      data: existente && existente.data ? existente.data : hojeIso(),
      professorId: existente ? existente.professorId || "" : "",
    });
    // eslint-disable-next-line
  }, [open, existente]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ativa = item && item.matricula.status === "Ativa";
  const professores = recursos.professores ? dados.professores.filter((p) => p.ativo !== "Não" || p.id === f.professorId) : [];

  const salvar = async () => {
    if (!f.conceito) return setErro("Escolha o conceito.");
    let nota = "";
    if (f.nota.trim()) {
      nota = Number(f.nota.replace(",", "."));
      if (!Number.isFinite(nota) || nota < 0 || nota > 10) return setErro("A nota deve estar entre 0 e 10.");
    }
    setErro("");
    setOcupado(true);
    const r = await salvarAvaliacaoFinal({ matriculaId: item.matricula.id, data: f.data, conceito: f.conceito, nota, comentario: f.comentario, professorId: f.professorId, concluir });
    setOcupado(false);
    if (r.ok) onClose();
    else setErro(r.erro || "Não foi possível salvar.");
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          Avaliação final{item ? ` · ${item.curso.nome}` : ""}
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiBox sx={{ display: "grid", gap: "14px", mt: 1 }}>
          <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
            <VuiBox>
              <FieldLabel>Conceito</FieldLabel>
              <NativeSelect value={f.conceito} onChange={set("conceito")}>
                <option value="">Escolha…</option>
                {CONCEITOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </VuiBox>
            <VuiBox>
              <FieldLabel>Nota de 0 a 10 (opcional)</FieldLabel>
              <VuiInput fullWidth value={f.nota} onChange={set("nota")} inputProps={{ inputMode: "decimal" }} />
            </VuiBox>
            <VuiBox>
              <FieldLabel>Data</FieldLabel>
              <VuiInput fullWidth type="date" value={f.data} onChange={set("data")} inputProps={{ style: { colorScheme: "dark" } }} />
            </VuiBox>
          </VuiBox>

          {professores.length > 0 && (
            <VuiBox>
              <FieldLabel>Professor</FieldLabel>
              <NativeSelect value={f.professorId} onChange={set("professorId")}>
                <option value="">—</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </NativeSelect>
            </VuiBox>
          )}

          <VuiBox>
            <FieldLabel>Comentário do professor</FieldLabel>
            <VuiInput fullWidth multiline rows={4} value={f.comentario} onChange={set("comentario")} />
          </VuiBox>

          {ativa && (
            <FormControlLabel
              sx={{ ml: 0 }}
              control={<Checkbox checked={concluir} onChange={(e) => setConcluir(e.target.checked)} />}
              label={
                <VuiTypography variant="button" color="white" fontWeight="regular">
                  Marcar o curso como concluído
                </VuiTypography>
              }
            />
          )}
        </VuiBox>
        {erro && (
          <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: 2 }}>
            {erro}
          </VuiTypography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px", gap: "8px" }}>
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        <VuiButton color="info" variant="contained" disabled={ocupado} onClick={salvar}>
          {ocupado ? "Salvando…" : "Salvar"}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

export default AvaliacaoFinalDialog;
