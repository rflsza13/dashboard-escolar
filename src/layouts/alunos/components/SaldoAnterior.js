import { useEffect, useState } from "react";

import Card from "@mui/material/Card";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";

import { useEscola } from "context/escola";
import { corValida } from "utils/escola";

const CAMPOS = [
  { chave: "presencas", rotulo: "Presenças" },
  { chave: "faltas", rotulo: "Faltas" },
  { chave: "reposicoesPendentes", rotulo: "Reposições pendentes" },
];

const inteiro = (v) => {
  const n = Math.floor(Number(String(v).replace(",", ".")));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function Contador({ rotulo, valor, onChange, desabilitado }) {
  const mudar = (n) => onChange(String(Math.max(0, n)));
  return (
    <VuiBox sx={{ minWidth: 150 }}>
      <VuiTypography variant="caption" color="text" fontWeight="medium" sx={{ display: "block", mb: "6px" }}>
        {rotulo}
      </VuiTypography>
      <VuiBox display="flex" alignItems="center" gap="8px">
        <VuiButton size="small" color="info" variant="outlined" disabled={desabilitado || inteiro(valor) <= 0} onClick={() => mudar(inteiro(valor) - 1)} sx={{ minWidth: 36, px: 0 }}>
          −
        </VuiButton>
        <VuiInput
          value={valor}
          disabled={desabilitado}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={() => mudar(inteiro(valor))}
          inputProps={{ inputMode: "numeric", style: { textAlign: "center", width: 56 } }}
        />
        <VuiButton size="small" color="info" variant="outlined" disabled={desabilitado} onClick={() => mudar(inteiro(valor) + 1)} sx={{ minWidth: 36, px: 0 }}>
          +
        </VuiButton>
      </VuiBox>
    </VuiBox>
  );
}

// Um bloco por matrícula: o saldo que o aluno já tinha no sistema anterior
function Bloco({ item }) {
  const { dados, salvar, pode } = useEscola();
  const { matricula, curso } = item;
  const existente = (dados.migracao || []).find((x) => x.matriculaId === matricula.id);
  const origem = {
    presencas: String(existente ? Number(existente.presencas) || 0 : 0),
    faltas: String(existente ? Number(existente.faltas) || 0 : 0),
    reposicoesPendentes: String(existente ? Number(existente.reposicoesPendentes) || 0 : 0),
  };
  const [v, setV] = useState(origem);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setV(origem);
  }, [existente && existente.presencas, existente && existente.faltas, existente && existente.reposicoesPendentes, matricula.id]);

  const alterado = CAMPOS.some((c) => inteiro(v[c.chave]) !== inteiro(origem[c.chave]));

  const gravar = async () => {
    setOcupado(true);
    const id = await salvar("Migracao", {
      id: existente ? existente.id : undefined,
      matriculaId: matricula.id,
      presencas: inteiro(v.presencas),
      faltas: inteiro(v.faltas),
      reposicoesPendentes: inteiro(v.reposicoesPendentes),
      obs: existente ? existente.obs || "" : "",
    });
    setOcupado(false);
    setMsg(id ? "Saldo salvo." : "");
  };

  return (
    <VuiBox sx={{ p: "14px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", borderLeft: `4px solid ${corValida(curso.cor)}`, mb: 2 }}>
      <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mb: "12px" }}>
        {curso.nome}
      </VuiTypography>
      <VuiBox display="flex" flexWrap="wrap" alignItems="flex-end" gap="24px">
        {CAMPOS.map((c) => (
          <Contador
            key={c.chave}
            rotulo={c.rotulo}
            valor={v[c.chave]}
            desabilitado={!pode.professor || ocupado}
            onChange={(novo) => {
              setV((x) => ({ ...x, [c.chave]: novo }));
              setMsg("");
            }}
          />
        ))}
        {pode.professor && (
          <VuiBox display="flex" alignItems="center" gap="12px">
            <VuiButton color="info" variant="contained" disabled={!alterado || ocupado} onClick={gravar}>
              {ocupado ? "Salvando…" : "Salvar saldo"}
            </VuiButton>
            {msg && (
              <VuiTypography variant="caption" color="success">
                {msg}
              </VuiTypography>
            )}
          </VuiBox>
        )}
      </VuiBox>
    </VuiBox>
  );
}

function SaldoAnterior({ matriculas }) {
  if (!matriculas.length) return null;
  return (
    <Card sx={{ mb: 3 }}>
      <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
        Saldo do sistema anterior
      </VuiTypography>
      <VuiTypography variant="caption" color="text" mb="16px" sx={{ display: "block" }}>
        Para alunos que vieram do sistema antigo: lance aqui o que eles já tinham. Os valores são somados às presenças e faltas registradas no sistema novo,
        e as reposições pendentes entram na conta de reposições do aluno. Use − e + ou digite o número.
      </VuiTypography>
      {matriculas.map((item) => (
        <Bloco key={item.matricula.id} item={item} />
      ))}
    </Card>
  );
}

export default SaldoAnterior;
