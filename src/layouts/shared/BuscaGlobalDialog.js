import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { IoSearchOutline, IoPersonOutline, IoChevronForward } from "react-icons/io5";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { useEscola } from "context/escola";

export default function BuscaGlobalDialog({ open, onClose }) {
  const { dados } = useEscola();
  const history = useHistory();
  const [termo, setTermo] = useState("");

  useEffect(() => {
    if (open) setTermo("");
  }, [open]);

  const resultados = termo.trim().length >= 2
    ? dados.alunos
        .filter((a) => {
          const q = termo.toLowerCase();
          return (
            (a.nome && a.nome.toLowerCase().includes(q)) ||
            (a.responsavel && a.responsavel.toLowerCase().includes(q)) ||
            (a.contato && a.contato.toLowerCase().includes(q))
          );
        })
        .slice(0, 8)
    : [];

  const navegarParaAluno = (id) => {
    onClose();
    history.push(`/alunos/${id}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          background: "#121218",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          color: "#fff",
          p: "8px",
          top: "-15%",
        },
      }}
    >
      <DialogContent sx={{ p: "12px" }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Buscar aluno por nome, responsável ou telefone... (Ctrl+K)"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <IoSearchOutline size="20px" color="#e3242b" />
              </InputAdornment>
            ),
            sx: {
              color: "#fff",
              fontSize: "15px",
              pb: "10px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            },
          }}
        />

        <VuiBox mt={2}>
          {termo.trim().length < 2 && (
            <VuiTypography variant="caption" color="text" sx={{ display: "block", textAlign: "center", py: 2, color: "#8c9ba5" }}>
              Digite ao menos 2 letras para buscar...
            </VuiTypography>
          )}

          {termo.trim().length >= 2 && resultados.length === 0 && (
            <VuiTypography variant="caption" color="text" sx={{ display: "block", textAlign: "center", py: 2, color: "#8c9ba5" }}>
              Nenhum aluno encontrado para "{termo}".
            </VuiTypography>
          )}

          {resultados.map((aluno) => (
            <VuiBox
              key={aluno.id}
              onClick={() => navegarParaAluno(aluno.id)}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 150ms ease",
                "&:hover": { background: "rgba(227, 36, 43, 0.12)" },
              }}
            >
              <VuiBox display="flex" alignItems="center" gap="12px">
                <VuiBox
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "#fff",
                  }}
                >
                  <IoPersonOutline size="16px" />
                </VuiBox>
                <VuiBox>
                  <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", fontSize: "13px" }}>
                    {aluno.nome}
                    {aluno.ativo === "Não" && (
                      <span style={{ fontSize: "10px", marginLeft: 6, opacity: 0.6 }}>(inativo)</span>
                    )}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px", color: "#8c9ba5" }}>
                    {[aluno.responsavel && `Resp: ${aluno.responsavel}`, aluno.contato].filter(Boolean).join(" · ") || "Sem telefone"}
                  </VuiTypography>
                </VuiBox>
              </VuiBox>

              <IoChevronForward size="16px" color="#8c9ba5" />
            </VuiBox>
          ))}
        </VuiBox>
      </DialogContent>
    </Dialog>
  );
}

BuscaGlobalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
