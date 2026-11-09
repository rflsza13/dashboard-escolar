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
import { MOTIVOS_SAIDA, hojeIso } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";

const TITULOS = { "Saída": "Registrar saída", Trancamento: "Trancar matrícula", Retorno: "Reativar matrícula" };
const TEXTOS = {
  "Saída": "A matrícula passa para “Saiu” e some da grade. O histórico de aulas e presenças continua guardado.",
  Trancamento: "A matrícula passa para “Trancada” e some da grade até ser reativada.",
  Retorno: "A matrícula volta para “Ativa” e reaparece na grade no dia e horário cadastrados.",
};

// itens: [{ matricula, curso }] das matrículas que podem receber essa movimentação
function MovimentacaoDialog({ open, tipo, itens, onClose }) {
  const { movimentar } = useEscola();
  const [sel, setSel] = useState([]);
  const [data, setData] = useState(hojeIso());
  const [motivo, setMotivo] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSel(itens.map((i) => i.matricula.id));
    setData(hojeIso());
    setMotivo("");
    setObs("");
    setErro("");
    // eslint-disable-next-line
  }, [open, tipo]);

  const alternar = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const confirmar = async () => {
    if (!sel.length) return setErro("Escolha pelo menos uma matrícula.");
    if (tipo === "Saída" && !motivo) return setErro("Escolha o motivo da saída.");
    if (!data) return setErro("Informe a data.");
    setErro("");
    setOcupado(true);
    const r = await movimentar({ tipo, matriculaIds: sel, data, motivo, obs });
    setOcupado(false);
    if (r.ok) onClose();
    else setErro(r.erro || "Não foi possível salvar.");
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          {TITULOS[tipo] || "Movimentação"}
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
          {TEXTOS[tipo]}
        </VuiTypography>
        <VuiBox sx={{ display: "grid", gap: "14px" }}>
          {itens.length > 1 && (
            <VuiBox>
              <FieldLabel>Matrículas</FieldLabel>
              {itens.map((i) => (
                <FormControlLabel
                  key={i.matricula.id}
                  sx={{ display: "flex", ml: 0 }}
                  control={<Checkbox checked={sel.includes(i.matricula.id)} onChange={() => alternar(i.matricula.id)} />}
                  label={
                    <VuiTypography variant="button" color="white" fontWeight="regular">
                      {i.curso.nome} · {i.matricula.dia} {i.matricula.inicio} ({i.matricula.status})
                    </VuiTypography>
                  }
                />
              ))}
            </VuiBox>
          )}
          {itens.length === 1 && (
            <VuiTypography variant="button" color="white" fontWeight="medium">
              {itens[0].curso.nome} · {itens[0].matricula.dia} {itens[0].matricula.inicio}
            </VuiTypography>
          )}

          <VuiBox>
            <FieldLabel>Data</FieldLabel>
            <VuiInput fullWidth type="date" value={data} onChange={(e) => setData(e.target.value)} inputProps={{ style: { colorScheme: "dark" } }} />
          </VuiBox>

          {tipo !== "Retorno" && (
            <VuiBox>
              <FieldLabel>{tipo === "Saída" ? "Motivo da saída" : "Motivo (opcional)"}</FieldLabel>
              <NativeSelect value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">{tipo === "Saída" ? "Escolha…" : "—"}</option>
                {MOTIVOS_SAIDA.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </NativeSelect>
            </VuiBox>
          )}

          <VuiBox>
            <FieldLabel>Observações (opcional)</FieldLabel>
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
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        <VuiButton color="info" variant="contained" disabled={ocupado} onClick={confirmar}>
          {ocupado ? "Salvando…" : "Confirmar"}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

export default MovimentacaoDialog;
