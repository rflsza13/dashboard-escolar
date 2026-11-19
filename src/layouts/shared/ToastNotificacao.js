import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useEscola } from "context/escola";

const CORES = {
  success: "#01B574",
  error:   "#E31A1A",
  warning: "#F6AD55",
  info:    "#2CD9FF",
};

export default function ToastNotificacao() {
  const { state, fecharToast } = useEscola();
  const toast = state?.toast;

  if (!toast) return null;

  const cor = CORES[toast.severidade] || CORES.success;

  return (
    <Snackbar
      key={toast.id}
      open
      autoHideDuration={3500}
      onClose={fecharToast}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: { xs: 2, md: 3 } }}
    >
      <Alert
        onClose={fecharToast}
        severity={toast.severidade || "success"}
        variant="filled"
        sx={{
          background: "rgba(18,18,24,0.97)",
          color: "#fff",
          border: `1px solid ${cor}`,
          borderRadius: "12px",
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${cor}22`,
          fontWeight: 500,
          fontSize: "0.84rem",
          backdropFilter: "blur(12px)",
          "& .MuiAlert-icon": { color: cor },
          "& .MuiAlert-action .MuiButtonBase-root": { color: "rgba(255,255,255,0.6)" },
        }}
      >
        {toast.mensagem}
      </Alert>
    </Snackbar>
  );
}
