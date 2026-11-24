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
import { DIAS_GRADE, DIAS_LONGOS, hojeIso, siglaDia, somarDias } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";

// Converte a aula experimental em matrícula: o aluno passa a ter dia e horário fixos na grade
function ConverterExperimentalDialog({ open, matricula, nomeAluno, nomeCurso, onClose }) {
  const { converterExperimental, toast } = useEscola();
  const [f, setF] = useState({ dia: "Seg", inicio: "", modalidade: "Presencial", dataInicio: "" });
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open || !matricula) return;
    const hoje = hojeIso();
    const dataExp = matricula.dataInicio || hoje;
    // a primeira aula regular vale a partir do dia seguinte à experimental (ou de hoje, se a experimental já passou)
    const inicio = somarDias(dataExp, 1) > hoje ? somarDias(dataExp, 1) : hoje;
    setF({ dia: DIAS_GRADE.includes(matricula.dia) ? matricula.dia : siglaDia(inicio), inicio: matricula.inicio || "", modalidade: matricula.modalidade || "Presencial", dataInicio: inicio });
    setErro("");
  }, [open, matricula]);

  if (!matricula) return null;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const confirmar = async () => {
    if (!/^\d{1,2}:\d{2}$/.test(f.inicio)) return setErro("Informe o horário da aula.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dataInicio)) return setErro("Informe a data de início.");
    setErro("");
    setOcupado(true);
    const r = await converterExperimental({ matriculaId: matricula.id, ...f });
    setOcupado(false);
    if (r.ok) {
      toast(`${nomeAluno} agora é aluno matriculado em ${nomeCurso} ✓`, "success");
      onClose();
    } else setErro(r.erro || "Não foi possível converter.");
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          Converter em matrícula
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
          {nomeAluno} · {nomeCurso}. A matrícula passa a ser “Ativa”, o aluno fica ativo e as aulas semanais entram na grade a partir da data de início. A conversão aparece no relatório de aulas experimentais.
        </VuiTypography>
        <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
          <VuiBox>
            <FieldLabel>Dia da semana</FieldLabel>
            <NativeSelect value={f.dia} onChange={set("dia")}>
              {DIAS_GRADE.map((d) => (
                <option key={d} value={d}>
                  {DIAS_LONGOS[d]}
                </option>
              ))}
            </NativeSelect>
          </VuiBox>
          <VuiBox>
            <FieldLabel>Horário</FieldLabel>
            <VuiInput fullWidth type="time" value={f.inicio} onChange={set("inicio")} inputProps={{ style: { colorScheme: "dark" } }} />
          </VuiBox>
          <VuiBox>
            <FieldLabel>Modalidade</FieldLabel>
            <NativeSelect value={f.modalidade} onChange={set("modalidade")}>
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </NativeSelect>
          </VuiBox>
          <VuiBox>
            <FieldLabel>Início das aulas</FieldLabel>
            <VuiInput fullWidth type="date" value={f.dataInicio} onChange={set("dataInicio")} inputProps={{ style: { colorScheme: "dark" } }} />
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
          {ocupado ? "Salvando…" : "Converter"}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

ConverterExperimentalDialog.defaultProps = { matricula: null, nomeAluno: "", nomeCurso: "" };
ConverterExperimentalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  matricula: PropTypes.object,
  nomeAluno: PropTypes.string,
  nomeCurso: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ConverterExperimentalDialog;
