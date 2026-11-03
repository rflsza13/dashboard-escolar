import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";
import IconButton from "@mui/material/IconButton";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoAdd, IoTrash, IoGift } from "react-icons/io5";

import { useEscola } from "context/escola";
import { formatarData, hojeIso } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import Tabela, { texto } from "layouts/shared/Tabela";
import FormDialog from "layouts/shared/FormDialog";
import { NativeSelect } from "layouts/shared/fields";

const PASSO = 20;

function Pontos() {
  const { dados, pode, user, salvar, excluir, resgatar } = useEscola();
  const history = useHistory();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [limite, setLimite] = useState(PASSO);
  const [lancar, setLancar] = useState(false);
  const [resgate, setResgate] = useState(false);
  const [premio, setPremio] = useState({ open: false, premio: null });

  const nomeDe = useMemo(() => dados.alunos.reduce((m, a) => ({ ...m, [a.id]: a.nome }), {}), [dados.alunos]);

  const saldos = useMemo(() => {
    const por = {};
    dados.pontos.forEach((p) => {
      if (!por[p.alunoId]) por[p.alunoId] = { ganhos: 0, resgates: 0 };
      if (p.tipo === "Resgate") por[p.alunoId].resgates += Number(p.pontos) || 0;
      else por[p.alunoId].ganhos += Number(p.pontos) || 0;
    });
    return dados.alunos
      .filter((a) => a.ativo !== "Não" || por[a.id])
      .map((a) => {
        const x = por[a.id] || { ganhos: 0, resgates: 0 };
        return { aluno: a, ...x, saldo: x.ganhos - x.resgates };
      })
      .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"));
  }, [dados.alunos, dados.pontos]);

  const q = busca.trim().toLowerCase();
  const saldosFiltrados = saldos.filter((s) => !q || s.aluno.nome.toLowerCase().includes(q));
  const historico = useMemo(
    () =>
      dados.pontos
        .filter((p) => (!tipo || p.tipo === tipo) && (!q || `${nomeDe[p.alunoId] || ""} ${p.descricao}`.toLowerCase().includes(q)))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [dados.pontos, tipo, q, nomeDe]
  );

  const podeApagar = (p) => pode.admin || (pode.professor && p.tipo === "Ganho (manual)");
  const apagar = (p) => {
    if (window.confirm(`Excluir este lançamento (${p.descricao || p.tipo}, ${p.pontos} ponto(s))?`)) excluir("Pontos", p.id);
  };

  const alunosAtivos = dados.alunos.filter((a) => a.ativo !== "Não");
  const saldoDe = (id) => (saldos.find((s) => s.aluno.id === id) || { saldo: 0 }).saldo;
  const premiosAtivos = dados.premios.filter((p) => p.ativo !== "Não");

  const colSaldo = [{ nome: "#" }, { nome: "Aluno" }, { nome: "Ganhos", align: "right" }, { nome: "Resgates", align: "right" }, { nome: "Saldo", align: "right" }];
  const linhasSaldo = saldosFiltrados.map((s, i) => ({
    chave: s.aluno.id,
    onClick: () => history.push(`/alunos/${s.aluno.id}`),
    celulas: [texto(String(i + 1)), texto(s.aluno.nome, "white"), texto(String(s.ganhos), "success"), texto(String(s.resgates)), texto(String(s.saldo), "white")],
  }));

  const colHist = [{ nome: "Data" }, { nome: "Aluno" }, { nome: "Tipo" }, { nome: "Descrição" }, { nome: "Pontos", align: "right" }, { nome: "" }];
  const linhasHist = historico.slice(0, limite).map((p) => ({
    chave: p.id,
    celulas: [
      texto(formatarData(p.data)),
      texto(nomeDe[p.alunoId] || "Aluno removido", "white"),
      texto(p.tipo, p.tipo === "Resgate" ? "error" : "success"),
      texto(p.descricao || "—"),
      <VuiTypography key="v" variant="button" fontWeight="bold" sx={{ color: p.tipo === "Resgate" ? "#E31A1A" : "#01B574" }}>
        {p.tipo === "Resgate" ? "−" : "+"}
        {p.pontos}
      </VuiTypography>,
      podeApagar(p) ? (
        <IconButton key="a" size="small" aria-label="Excluir" onClick={() => apagar(p)} sx={{ color: "#a0aec0" }}>
          <IoTrash size="14px" />
        </IconButton>
      ) : null,
    ],
  }));

  const colPremio = [{ nome: "Prêmio" }, { nome: "Custo", align: "right" }, { nome: "Situação" }];
  const linhasPremio = dados.premios.map((p) => ({
    chave: p.id,
    onClick: pode.admin ? () => setPremio({ open: true, premio: p }) : undefined,
    celulas: [texto(p.nome, "white"), texto(`${p.custo} pts`), texto(p.ativo === "Não" ? "Inativo" : "Disponível")],
  }));

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Pontos e prêmios
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Saldo de todos os alunos, histórico de lançamentos e catálogo de prêmios.
            </VuiTypography>
          </VuiBox>
          {pode.professor && (
            <VuiBox display="flex" gap="8px" flexWrap="wrap">
              <VuiButton color="info" variant="outlined" onClick={() => setResgate(true)}>
                <IoGift size="16px" style={{ marginRight: 8 }} />
                Resgatar prêmio
              </VuiButton>
              <VuiButton color="info" variant="contained" onClick={() => setLancar(true)}>
                <IoAdd size="16px" style={{ marginRight: 8 }} />
                Lançar pontos
              </VuiButton>
            </VuiBox>
          )}
        </VuiBox>

        <VuiBox mb={3} sx={{ maxWidth: 420 }}>
          <VuiInput placeholder="Buscar por aluno ou descrição…" value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(PASSO); }} fullWidth />
        </VuiBox>

        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} xl={7}>
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Saldo por aluno
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="regular" mb="12px" sx={{ display: "block" }}>
                  Clique em um aluno para abrir o acompanhamento.
                </VuiTypography>
                <VuiBox sx={{ maxHeight: 420, overflowY: "auto" }}>
                  <Tabela colunas={colSaldo} linhas={linhasSaldo} vazio="Nenhum aluno encontrado." />
                </VuiBox>
              </Card>
            </Grid>
            <Grid item xs={12} xl={5}>
              <Card sx={{ height: "100%" }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    Catálogo de prêmios
                  </VuiTypography>
                  {pode.admin && (
                    <VuiButton size="small" color="info" variant="outlined" onClick={() => setPremio({ open: true, premio: null })}>
                      Novo prêmio
                    </VuiButton>
                  )}
                </VuiBox>
                <Tabela colunas={colPremio} linhas={linhasPremio} vazio="Nenhum prêmio cadastrado." />
              </Card>
            </Grid>
          </Grid>
        </VuiBox>

        <Card>
          <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="12px" mb={2}>
            <VuiTypography variant="lg" color="white" fontWeight="bold">
              Histórico de lançamentos
            </VuiTypography>
            <VuiBox sx={{ width: 220 }}>
              <NativeSelect value={tipo} onChange={(e) => { setTipo(e.target.value); setLimite(PASSO); }}>
                <option value="">Todos os tipos</option>
                <option value="Ganho (módulo)">Ganho (módulo)</option>
                <option value="Ganho (manual)">Ganho (manual)</option>
                <option value="Resgate">Resgate</option>
              </NativeSelect>
            </VuiBox>
          </VuiBox>
          <Tabela colunas={colHist} linhas={linhasHist} vazio="Nenhum lançamento encontrado." />
          <VuiBox display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <VuiTypography variant="caption" color="text">
              {historico.length} lançamento(s)
            </VuiTypography>
            {historico.length > limite && (
              <VuiButton size="small" color="info" variant="outlined" onClick={() => setLimite((l) => l + PASSO)}>
                Mostrar mais
              </VuiButton>
            )}
          </VuiBox>
        </Card>
      </VuiBox>

      <FormDialog
        open={lancar}
        titulo="Lançar pontos"
        descricao="Pontos extras, por exemplo por participação ou desempenho. Os pontos de módulo concluído entram sozinhos."
        campos={[
          { chave: "alunoId", rotulo: "Aluno", tipo: "select", obrigatorio: true, cheia: true, opcoes: alunosAtivos.map((a) => ({ valor: a.id, rotulo: a.nome })) },
          { chave: "pontos", rotulo: "Pontos", tipo: "numero", min: 1, inteira: true, obrigatorio: true },
          { chave: "descricao", rotulo: "Motivo", obrigatorio: true, cheia: true },
        ]}
        onSalvar={async (v) =>
          !!(await salvar("Pontos", { data: hojeIso(), alunoId: v.alunoId, tipo: "Ganho (manual)", pontos: v.pontos, descricao: v.descricao, moduloId: "", registradoPor: user ? user.email : "" }))
        }
        onClose={() => setLancar(false)}
      />

      <FormDialog
        open={resgate}
        titulo="Resgatar prêmio"
        descricao="Desconta os pontos do aluno e registra o resgate no histórico."
        textoSalvar="Resgatar"
        campos={[
          { chave: "alunoId", rotulo: "Aluno", tipo: "select", obrigatorio: true, cheia: true, opcoes: alunosAtivos.map((a) => ({ valor: a.id, rotulo: `${a.nome} (saldo ${saldoDe(a.id)})` })) },
          { chave: "premioId", rotulo: "Prêmio", tipo: "select", obrigatorio: true, cheia: true, opcoes: premiosAtivos.map((p) => ({ valor: p.id, rotulo: `${p.nome} (${p.custo} pts)` })) },
        ]}
        onSalvar={async (v) => {
          const p = dados.premios.find((x) => x.id === v.premioId);
          if (p && saldoDe(v.alunoId) < Number(p.custo)) return `Saldo insuficiente: o aluno tem ${saldoDe(v.alunoId)} ponto(s) e o prêmio custa ${p.custo}.`;
          const r = await resgatar(v.alunoId, v.premioId);
          return r.ok ? true : r.erro || "Não foi possível resgatar.";
        }}
        onClose={() => setResgate(false)}
      />

      <FormDialog
        open={premio.open}
        titulo={premio.premio ? "Editar prêmio" : "Novo prêmio"}
        campos={[
          { chave: "nome", rotulo: "Prêmio", obrigatorio: true, cheia: true },
          { chave: "custo", rotulo: "Custo (pontos)", tipo: "numero", min: 1, inteira: true, obrigatorio: true },
          { chave: "ativo", rotulo: "Disponível para resgate", tipo: "select", obrigatorio: true, opcoes: [{ valor: "Sim", rotulo: "Sim" }, { valor: "Não", rotulo: "Não" }] },
        ]}
        inicial={premio.premio || { ativo: "Sim" }}
        onSalvar={async (v) => !!(await salvar("Premios", { ...premio.premio, ...v }))}
        onExcluir={
          premio.premio
            ? async () => {
                if (window.confirm("Excluir este prêmio do catálogo? Os resgates já feitos continuam no histórico.")) {
                  if (await excluir("Premios", premio.premio.id)) setPremio({ open: false, premio: null });
                }
              }
            : null
        }
        onClose={() => setPremio({ open: false, premio: null })}
      />
    </DashboardLayout>
  );
}

export default Pontos;
