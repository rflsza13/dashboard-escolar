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

import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";

const num = (v) => {
  const s = String(v).trim();
  if (!s) return NaN;
  return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
};

/*
  campos: [{ chave, rotulo, tipo: texto|numero|data|hora|select|cor, opcoes: [{valor, rotulo}], sugestoes: [texto], obrigatorio, min, inteira }]
  Chamamos onSalvar(valores) com os números já convertidos; se devolver false, o diálogo continua aberto.
*/
function FormDialog({ open, titulo, descricao, campos, inicial, textoSalvar, onSalvar, onExcluir, onClose }) {
  const [v, setV] = useState({});
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [erroGeral, setErroGeral] = useState("");

  useEffect(() => {
    if (!open) return;
    setErros({});
    setErroGeral("");
    const base = {};
    campos.forEach((c) => {
      const x = inicial && inicial[c.chave] !== undefined && inicial[c.chave] !== null ? inicial[c.chave] : "";
      base[c.chave] = c.tipo === "cor" && !x ? "#E3242B" : String(x);
    });
    setV(base);
    /* eslint-disable-next-line */
  }, [open, inicial]);

  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  const validar = () => {
    const e = {};
    const saida = {};
    campos.forEach((c) => {
      const bruto = (v[c.chave] || "").trim();
      if (c.obrigatorio && !bruto) {
        e[c.chave] = "Campo obrigatório.";
        return;
      }
      if (c.tipo === "numero") {
        if (!bruto) {
          saida[c.chave] = "";
          return;
        }
        const n = num(bruto);
        if (!Number.isFinite(n)) e[c.chave] = "Informe um número.";
        else if (c.min !== undefined && n < c.min) e[c.chave] = `Mínimo: ${c.min}.`;
        else if (c.inteira && !Number.isInteger(n)) e[c.chave] = "Use um número inteiro.";
        else saida[c.chave] = n;
        return;
      }
      if (c.tipo === "hora" && bruto && !/^\d{1,2}:\d{2}$/.test(bruto)) {
        e[c.chave] = "Horário inválido.";
        return;
      }
      saida[c.chave] = bruto;
    });
    setErros(e);
    return Object.keys(e).length ? null : saida;
  };

  const salvar = async () => {
    const saida = validar();
    if (!saida) return;
    setErroGeral("");
    setOcupado(true);
    const r = await onSalvar(saida);
    setOcupado(false);
    if (typeof r === "string") setErroGeral(r);
    else if (r !== false) onClose();
  };

  const campo = (c) => {
    const erro = erros[c.chave];
    let entrada;
    if (c.tipo === "select") {
      entrada = (
        <NativeSelect value={v[c.chave] || ""} onChange={set(c.chave)}>
          {!c.obrigatorio || !(c.opcoes || []).some((o) => o.valor === v[c.chave]) ? <option value="">{c.obrigatorio ? "Escolha…" : "—"}</option> : null}
          {(c.opcoes || []).map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </NativeSelect>
      );
    } else if (c.tipo === "cor") {
      entrada = (
        <VuiBox display="flex" alignItems="center" gap="10px">
          <input type="color" value={v[c.chave] || "#E3242B"} onChange={set(c.chave)} style={{ width: 48, height: 36, border: "none", background: "transparent", cursor: "pointer" }} />
          <VuiTypography variant="caption" color="text">
            {v[c.chave]}
          </VuiTypography>
        </VuiBox>
      );
    } else {
      const tipo = c.tipo === "data" ? "date" : c.tipo === "hora" ? "time" : "text";
      entrada = (
        <VuiInput
          fullWidth
          type={tipo}
          value={v[c.chave] || ""}
          onChange={set(c.chave)}
          error={Boolean(erro)}
          inputProps={{ inputMode: c.tipo === "numero" ? "decimal" : undefined, style: tipo !== "text" ? { colorScheme: "dark" } : undefined, list: c.sugestoes && c.sugestoes.length ? `sug-${c.chave}` : undefined }}
        />
      );
    }
    return (
      <VuiBox key={c.chave} sx={c.cheia ? { gridColumn: "1 / -1" } : undefined}>
        <FieldLabel>{c.rotulo}</FieldLabel>
        {entrada}
        {c.sugestoes && c.sugestoes.length > 0 && (
          <datalist id={`sug-${c.chave}`}>
            {c.sugestoes.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        )}
        {erro && (
          <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: "4px" }}>
            {erro}
          </VuiTypography>
        )}
      </VuiBox>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          {titulo}
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        {descricao && (
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2, mt: 1 }}>
            {descricao}
          </VuiTypography>
        )}
        <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", mt: 1 }}>{campos.map(campo)}</VuiBox>
        {erroGeral && (
          <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: 2 }}>
            {erroGeral}
          </VuiTypography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px", gap: "8px" }}>
        {onExcluir && (
          <VuiButton color="error" variant="text" onClick={onExcluir} sx={{ mr: "auto" }}>
            Excluir
          </VuiButton>
        )}
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        <VuiButton color="info" variant="contained" disabled={ocupado} onClick={salvar}>
          {ocupado ? "Salvando…" : textoSalvar}
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

FormDialog.defaultProps = { descricao: "", inicial: null, textoSalvar: "Salvar", onExcluir: null };
FormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  titulo: PropTypes.string.isRequired,
  descricao: PropTypes.string,
  campos: PropTypes.array.isRequired,
  inicial: PropTypes.object,
  textoSalvar: PropTypes.string,
  onSalvar: PropTypes.func.isRequired,
  onExcluir: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

export default FormDialog;
