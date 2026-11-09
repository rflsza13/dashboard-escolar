import { useMemo } from "react";

import { Card } from "@mui/material";

import VuiTypography from "components/VuiTypography";

import { useEscola } from "context/escola";
import { formatarData } from "utils/escola";
import Tabela, { texto } from "layouts/shared/Tabela";

// Entradas, saídas, trancamentos, retornos e conclusões do aluno (aba Movimentacoes)
function HistoricoMovimentacoes({ alunoId }) {
  const { dados } = useEscola();
  const linhas = useMemo(() => {
    const cursos = dados.cursos.reduce((m, c) => ({ ...m, [c.id]: c }), {});
    const mats = dados.matriculas.reduce((m, x) => ({ ...m, [x.id]: x }), {});
    return (dados.movimentacoes || [])
      .filter((x) => x.alunoId === alunoId)
      .sort((a, b) => String(b.data).localeCompare(String(a.data)))
      .map((x) => ({
        chave: x.id,
        celulas: [
          texto(formatarData(x.data)),
          texto(x.tipo, "white"),
          texto((cursos[(mats[x.matriculaId] || {}).cursoId] || {}).nome || "—"),
          texto([x.motivo, x.obs].filter(Boolean).join(" · ") || "—"),
        ],
      }));
  }, [dados.movimentacoes, dados.cursos, dados.matriculas, alunoId]);

  if (!linhas.length) return null;
  return (
    <Card sx={{ mb: 3 }}>
      <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
        Histórico de movimentações
      </VuiTypography>
      <VuiTypography variant="caption" color="text" mb="16px" sx={{ display: "block" }}>
        Saídas, trancamentos, retornos e conclusões de curso.
      </VuiTypography>
      <Tabela colunas={[{ nome: "Data" }, { nome: "Movimentação" }, { nome: "Curso" }, { nome: "Motivo e observações" }]} linhas={linhas} vazio="" />
    </Card>
  );
}

export default HistoricoMovimentacoes;
