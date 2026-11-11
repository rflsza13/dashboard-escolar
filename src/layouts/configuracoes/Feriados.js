import { useMemo, useState } from "react";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { feriadoDoDia, formatarData, hojeIso, proximosFeriadosNacionais } from "utils/escola";
import FormDialog from "layouts/shared/FormDialog";
import Tabela, { texto } from "layouts/shared/Tabela";

// Feriados e dias sem aula: os nacionais são calculados sozinhos; aqui entram os estaduais, municipais, recessos e as exceções
function Feriados() {
  const { dados, pode, salvar, excluir } = useEscola();
  const [dlg, setDlg] = useState({ open: false, feriado: null });
  const hoje = hojeIso();

  const cadastrados = useMemo(() => [...(dados.feriados || [])].sort((a, b) => String(a.data).localeCompare(String(b.data))), [dados.feriados]);
  const proximos = useMemo(() => proximosFeriadosNacionais(hoje, 6), [hoje]);

  const linhas = cadastrados.map((f) => ({
    chave: f.id,
    onClick: pode.admin ? () => setDlg({ open: true, feriado: f }) : undefined,
    celulas: [
      texto(formatarData(f.data), "white"),
      texto(f.nome, "white"),
      texto(String(f.aula).toLowerCase() === "sim" ? "Com aula" : "Sem aula", String(f.aula).toLowerCase() === "sim" ? "success" : "warning"),
    ],
  }));

  return (
    <>
      <Card>
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="12px" mb="4px">
          <VuiTypography variant="lg" color="white" fontWeight="bold">
            Feriados e dias sem aula
          </VuiTypography>
          {pode.admin && (
            <VuiButton size="small" color="info" variant="contained" onClick={() => setDlg({ open: true, feriado: null })}>
              Novo feriado
            </VuiButton>
          )}
        </VuiBox>
        <VuiTypography variant="caption" color="text" mb="16px" sx={{ display: "block" }}>
          Os feriados nacionais (incluindo Carnaval e Corpus Christi) são identificados sozinhos, e as aulas regulares desses dias saem da grade.
          Cadastre aqui feriados estaduais e municipais, recessos e dias sem aula. Para uma escola que abre em um feriado, cadastre a data com “Com aula”.
        </VuiTypography>

        <Tabela colunas={[{ nome: "Data" }, { nome: "Nome" }, { nome: "Situação" }]} linhas={linhas} vazio="Nenhum feriado cadastrado." />

        <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mt: 3, mb: "6px" }}>
          Próximos feriados nacionais
        </VuiTypography>
        {proximos.map((p) => {
          const ajustado = feriadoDoDia(p.data, dados);
          return (
            <VuiTypography key={p.data} variant="caption" color="text" sx={{ display: "block" }}>
              {formatarData(p.data)} · {p.nome}
              {ajustado ? "" : " (cadastrado como dia com aula)"}
            </VuiTypography>
          );
        })}
      </Card>

      <FormDialog
        open={dlg.open}
        titulo={dlg.feriado ? "Editar feriado" : "Novo feriado"}
        descricao="Feriado ou dia sem aula. Use “Com aula” para manter as aulas num feriado nacional."
        campos={[
          { chave: "data", rotulo: "Data", tipo: "data", obrigatorio: true },
          { chave: "aula", rotulo: "Situação", tipo: "select", obrigatorio: true, opcoes: [{ valor: "Não", rotulo: "Sem aula" }, { valor: "Sim", rotulo: "Com aula" }] },
          { chave: "nome", rotulo: "Nome", obrigatorio: true, cheia: true },
        ]}
        inicial={dlg.feriado || { aula: "Não" }}
        onSalvar={async (v) => !!(await salvar("Feriados", { ...dlg.feriado, ...v }))}
        onExcluir={
          dlg.feriado
            ? async () => {
                if (window.confirm("Excluir este feriado?")) {
                  if (await excluir("Feriados", dlg.feriado.id)) setDlg({ open: false, feriado: null });
                }
              }
            : null
        }
        onClose={() => setDlg({ open: false, feriado: null })}
      />
    </>
  );
}

export default Feriados;
