import { useMemo, useState } from "react";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { formatarData, hojeIso } from "utils/escola";
import FormDialog from "layouts/shared/FormDialog";
import Tabela, { texto } from "layouts/shared/Tabela";

// Períodos de férias e recessos: as aulas regulares desses dias saem da grade, como nos feriados
function Ferias() {
  const { dados, pode, salvar, excluir } = useEscola();
  const [dlg, setDlg] = useState({ open: false, periodo: null });
  const hoje = hojeIso();

  const periodos = useMemo(() => [...(dados.ferias || [])].sort((a, b) => String(a.inicio).localeCompare(String(b.inicio))), [dados.ferias]);

  const situacao = (p) => (hoje > p.fim ? ["Encerrado", "text"] : hoje >= p.inicio ? ["Em andamento", "warning"] : ["Programado", "success"]);

  const linhas = periodos.map((p) => ({
    chave: p.id,
    onClick: pode.config ? () => setDlg({ open: true, periodo: p }) : undefined,
    celulas: [texto(p.nome, "white"), texto(`${formatarData(p.inicio)} a ${formatarData(p.fim)}`, "white"), texto(situacao(p)[0], situacao(p)[1])],
  }));

  return (
    <>
      <Card>
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="12px" mb="4px">
          <VuiTypography variant="lg" color="white" fontWeight="bold">
            Períodos de férias
          </VuiTypography>
          {pode.config && (
            <VuiButton size="small" color="info" variant="contained" onClick={() => setDlg({ open: true, periodo: null })}>
              Novo período
            </VuiButton>
          )}
        </VuiBox>
        <VuiTypography variant="caption" color="text" mb="16px" sx={{ display: "block" }}>
          Nos dias de férias as aulas regulares saem da grade e do dashboard, e o cabeçalho do dia mostra “Férias”. Aulas avulsas, reposições e experimentais já marcadas continuam.
          Para abrir um dia dentro das férias, cadastre-o em Feriados com a situação “Com aula”.
        </VuiTypography>
        <Tabela colunas={[{ nome: "Período" }, { nome: "Datas" }, { nome: "Situação" }]} linhas={linhas} vazio="Nenhum período de férias cadastrado." />
      </Card>

      <FormDialog
        open={dlg.open}
        titulo={dlg.periodo ? "Editar férias" : "Novo período de férias"}
        descricao="As aulas regulares dos dias do período, do primeiro ao último dia, saem da grade."
        campos={[
          { chave: "nome", rotulo: "Nome (ex.: Férias de julho)", obrigatorio: true, cheia: true },
          { chave: "inicio", rotulo: "Primeiro dia", tipo: "data", obrigatorio: true },
          { chave: "fim", rotulo: "Último dia", tipo: "data", obrigatorio: true },
        ]}
        inicial={dlg.periodo || {}}
        onSalvar={async (v) => {
          if (v.fim < v.inicio) {
            window.alert("O último dia deve ser igual ou depois do primeiro dia.");
            return false;
          }
          return !!(await salvar("Ferias", { ...dlg.periodo, ...v }));
        }}
        onExcluir={
          dlg.periodo
            ? async () => {
                if (window.confirm("Excluir este período de férias?")) {
                  if (await excluir("Ferias", dlg.periodo.id)) setDlg({ open: false, periodo: null });
                }
              }
            : null
        }
        onClose={() => setDlg({ open: false, periodo: null })}
      />
    </>
  );
}

export default Ferias;
