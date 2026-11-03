import { useMemo, useState } from "react";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoAdd, IoPersonAdd } from "react-icons/io5";

import { useEscola } from "context/escola";
import { DEFAULT_CONFIG, blocosDaEscala, corValida } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import { NativeSelect } from "layouts/shared/fields";
import GradeProfessores from "layouts/professores/components/GradeProfessores";
import { EscalaDialog, ProfessorDialog } from "layouts/professores/components/Dialogos";

function Professores() {
  const { dados, pode } = useEscola();
  const cfg = { ...DEFAULT_CONFIG, ...dados.config };
  const [filtro, setFiltro] = useState("");
  const [profDlg, setProfDlg] = useState({ open: false, professor: null });
  const [escDlg, setEscDlg] = useState({ open: false, bloco: null, dia: "", hora: "" });

  const todosBlocos = useMemo(() => blocosDaEscala(dados), [dados]);
  const blocos = useMemo(() => todosBlocos.filter((b) => !filtro || b.professorId === filtro), [todosBlocos, filtro]);
  const horasDe = (id) => todosBlocos.filter((b) => b.professorId === id).reduce((t, b) => t + (b.fimMin - b.iniMin) / 60, 0);
  const ordenados = useMemo(
    () => dados.professores.slice().sort((a, b) => (a.ativo === "Não") - (b.ativo === "Não") || a.nome.localeCompare(b.nome, "pt-BR")),
    [dados.professores]
  );

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Professores
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Escala semanal da equipe.
              {pode.admin ? " Clique em um horário para editar ou em um espaço vazio para adicionar." : ""}
            </VuiTypography>
          </VuiBox>
          {pode.admin && (
            <VuiBox display="flex" gap="8px" flexWrap="wrap">
              <VuiButton color="info" variant="outlined" onClick={() => setProfDlg({ open: true, professor: null })}>
                <IoPersonAdd size="16px" style={{ marginRight: 8 }} />
                Novo professor
              </VuiButton>
              <VuiButton color="info" variant="contained" onClick={() => setEscDlg({ open: true, bloco: null, dia: "", hora: "" })}>
                <IoAdd size="16px" style={{ marginRight: 8 }} />
                Horários da semana
              </VuiButton>
            </VuiBox>
          )}
        </VuiBox>

        <VuiBox mb={3}>
          <Card>
            <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="12px" mb={2}>
              <VuiTypography variant="lg" color="white" fontWeight="bold">
                Equipe
              </VuiTypography>
              <VuiBox sx={{ width: 220 }}>
                <NativeSelect value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="">Todos os professores</option>
                  {ordenados.filter((p) => p.ativo !== "Não").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </NativeSelect>
              </VuiBox>
            </VuiBox>
            {ordenados.length === 0 && (
              <VuiTypography variant="button" color="text" fontWeight="regular">
                Nenhum professor cadastrado ainda.
              </VuiTypography>
            )}
            <VuiBox display="flex" flexWrap="wrap" gap="10px">
              {ordenados.map((p) => {
                const cor = corValida(p.cor, "#F2F2F2");
                return (
                  <VuiBox
                    key={p.id}
                    onClick={pode.admin ? () => setProfDlg({ open: true, professor: p }) : undefined}
                    sx={{ cursor: pode.admin ? "pointer" : "default", p: "8px 12px", borderRadius: "12px", borderLeft: `4px solid ${cor}`, background: `${cor}1F`, opacity: p.ativo === "Não" ? 0.5 : 1 }}
                  >
                    <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                      {p.nome}
                      {p.ativo === "Não" ? " (inativo)" : ""}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {horasDe(p.id)}h por semana{p.contato ? ` · ${p.contato}` : ""}
                    </VuiTypography>
                  </VuiBox>
                );
              })}
            </VuiBox>
          </Card>
        </VuiBox>

        <Card>
          <GradeProfessores
            blocos={blocos}
            dados={dados}
            config={cfg}
            podeEditar={pode.admin}
            onEditar={(b) => setEscDlg({ open: true, bloco: b, dia: "", hora: "" })}
            onNovo={(dia, hora) => setEscDlg({ open: true, bloco: null, dia, hora })}
          />
          {todosBlocos.length === 0 && (
            <VuiTypography variant="button" color="text" fontWeight="regular" mt={2} sx={{ display: "block" }}>
              Nenhum horário na escala ainda.
            </VuiTypography>
          )}
        </Card>
      </VuiBox>

      <ProfessorDialog open={profDlg.open} professor={profDlg.professor} onClose={() => setProfDlg({ open: false, professor: null })} />
      <EscalaDialog open={escDlg.open} bloco={escDlg.bloco} diaInicial={escDlg.dia} horaInicial={escDlg.hora} onClose={() => setEscDlg({ open: false, bloco: null, dia: "", hora: "" })} />
    </DashboardLayout>
  );
}

export default Professores;
