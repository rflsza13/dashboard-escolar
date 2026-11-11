import { useEffect, useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { hojeIso, lerNota } from "utils/escola";
import { FieldLabel, dialogPaper } from "layouts/shared/fields";

// item: { matricula, modulo, nota, temRegistro }. Sem registro de conclusão (módulo concluído antes do sistema novo), pede a data.
function NotaModuloDialog({ open, item, onClose }) {
  const { salvarNotaModulo } = useEscola();
  const [nota, setNota] = useState("");
  const [data, setData] = useState(hojeIso());
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setNota(item.nota === null || item.nota === undefined ? "" : String(item.nota).replace(".", ","));
    setData(hojeIso());
    setErro("");
  }, [open, item]);

  if (!item) return null;

  const salvar = async () => {
    const n = lerNota(nota);
    if (n === null) return setErro("A nota deve estar entre 0 e 10.");
    setErro("");
    setOcupado(true);
    const r = await salvarNotaModulo({ matriculaId: item.matricula.id, moduloId: item.modulo.id, nota: n, data });
    setOcupado(false);
    if (r.ok) onClose();
    else setErro(r.erro || "Não foi possível salvar.");
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          Nota do módulo
        </VuiTypography>
        <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
          Módulo {item.modulo.ordem} · {item.modulo.nome}
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiBox sx={{ display: "grid", gap: "14px", mt: 1 }}>
          <VuiBox>
            <FieldLabel>Nota de 0 a 10 (deixe vazio para tirar a nota)</FieldLabel>
            <VuiInput fullWidth value={nota} onChange={(e) => setNota(e.target.value)} inputProps={{ inputMode: "decimal" }} />
          </VuiBox>
          {!item.temRegistro && (
            <VuiBox>
              <FieldLabel>Data em que o módulo foi concluído</FieldLabel>
              <VuiInput fullWidth type="date" value={data} onChange={(e) => setData(e.target.value)} inputProps={{ style: { colorScheme: "dark" } }} />
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "4px" }}>
                Este módulo foi concluído antes do sistema novo. Se não souber a data, use a de hoje.
              </VuiTypography>
            </VuiBox>
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

export default NotaModuloDialog;
