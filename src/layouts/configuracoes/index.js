import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import VuiSwitch from "components/VuiSwitch";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import { IoSave } from "react-icons/io5";

import { useEscola } from "context/escola";
import { DEFAULT_CONFIG, RECURSOS, TIPOS_CURSO, cursosComCor, recursoLigado, tipoDoCurso } from "utils/escola";

import BarraStatus from "layouts/shared/BarraStatus";
import { FieldLabel } from "layouts/shared/fields";

const COR = /^#[0-9a-fA-F]{6}$/;
const recursosDe = (cfg) => RECURSOS.reduce((o, r) => ({ ...o, [r.chave]: recursoLigado(cfg, r.chave) }), {});

// Parâmetros da aba Config da planilha que podem ser editados aqui
const CAMPOS = [
  { grupo: "Geral", itens: [
    { chave: "nomeEscola", rotulo: "Nome da escola", ajuda: "Aparece no menu lateral do dashboard.", tipo: "texto" },
    { chave: "pontosPadrao", rotulo: "Pontos padrão por módulo", ajuda: "Usado quando o módulo não tem pontuação própria.", tipo: "inteiro", min: 0 },
    { chave: "rankingDias", rotulo: "Ranking de faltas: janela (dias)", ajuda: "Período considerado no ranking de alunos que mais faltam.", tipo: "inteiro", min: 1 },
  ] },
  { grupo: "Cores da grade", itens: [
    { chave: "corOnline", rotulo: "Aulas online", ajuda: "Cor das aulas da modalidade online.", tipo: "cor" },
    { chave: "corReposicao", rotulo: "Reposições", ajuda: "Cor das aulas de reposição.", tipo: "cor" },
    { chave: "corExperimental", rotulo: "Aula experimental", ajuda: "Cor das aulas experimentais.", tipo: "cor" },
  ] },
];
const TODOS = CAMPOS.reduce((l, g) => [...l, ...g.itens], []);

const paraTexto = (cfg) => TODOS.reduce((o, c) => ({ ...o, [c.chave]: String(cfg[c.chave] === undefined || cfg[c.chave] === null ? "" : cfg[c.chave]) }), {});

// uma cor por tipo de curso (Programação, Robótica 1, Robótica 2, Inglês): a do primeiro curso do tipo
const coresDosTipos = (cursos) => {
  const m = {};
  cursosComCor(cursos).forEach((c) => {
    if (!m[c.tipo]) m[c.tipo] = c.cor;
  });
  return m;
};

function Configuracoes() {
  const { dados, pode, salvarConfig, salvar: salvarRegistro } = useEscola();
  const [coresTipo, setCoresTipo] = useState(() => coresDosTipos(dados.cursos));
  const [recs, setRecs] = useState(() => recursosDe(dados.config));
  const [v, setV] = useState(() => paraTexto({ ...DEFAULT_CONFIG, ...dados.config }));
  const [erros, setErros] = useState({});
  const [msg, setMsg] = useState({ tipo: "", texto: "" });
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setV(paraTexto({ ...DEFAULT_CONFIG, ...dados.config }));
  }, [dados.config]);

  useEffect(() => {
    setRecs(recursosDe(dados.config));
  }, [dados.config]);

  useEffect(() => {
    setCoresTipo(coresDosTipos(dados.cursos));
  }, [dados.cursos]);

  const tiposComCurso = TIPOS_CURSO.filter((t) => dados.cursos.some((c) => tipoDoCurso(c) === t));
  const mudarCorTipo = (t) => (e) => {
    setCoresTipo((x) => ({ ...x, [t]: e.target.value }));
    setMsg({ tipo: "", texto: "" });
  };

  const set = (k) => (e) => {
    setV((x) => ({ ...x, [k]: e.target.value }));
    setMsg({ tipo: "", texto: "" });
  };

  const salvar = async () => {
    const e = {};
    const saida = {};
    TODOS.forEach((c) => {
      const bruto = String(v[c.chave] || "").trim();
      if (c.tipo === "texto") {
        if (!bruto || bruto.length > 60) e[c.chave] = "Informe de 1 a 60 caracteres.";
        else saida[c.chave] = bruto;
      } else if (c.tipo === "inteiro") {
        const n = Number(bruto.replace(",", "."));
        if (!bruto || !Number.isInteger(n) || n < c.min) e[c.chave] = `Número inteiro, mínimo ${c.min}.`;
        else saida[c.chave] = n;
      } else if (!COR.test(bruto)) e[c.chave] = "Cor inválida.";
      else saida[c.chave] = bruto.toUpperCase();
    });
    RECURSOS.forEach((r) => {
      saida[r.chave] = Boolean(recs[r.chave]);
    });
    setErros(e);
    if (Object.keys(e).length) return;
    setOcupado(true);
    const r = await salvarConfig(saida);
    if (!r.ok) {
      setOcupado(false);
      setMsg({ tipo: "erro", texto: r.erro || "Não foi possível salvar." });
      return;
    }
    // cores dos cursos: grava a cor escolhida em todos os cursos do tipo que ainda têm outra cor
    let okCursos = true;
    const atuais = coresDosTipos(dados.cursos);
    for (let t = 0; okCursos && t < tiposComCurso.length; t += 1) {
      const tipo = tiposComCurso[t];
      const nova = String(coresTipo[tipo] || "").toUpperCase();
      if (COR.test(nova) && nova !== String(atuais[tipo] || "").toUpperCase()) {
        const cursosDoTipo = dados.cursos.filter((c) => tipoDoCurso(c) === tipo && String(c.cor || "").toUpperCase() !== nova);
        for (let k = 0; okCursos && k < cursosDoTipo.length; k += 1) {
          // eslint-disable-next-line no-await-in-loop
          okCursos = !!(await salvarRegistro("Cursos", { ...cursosDoTipo[k], cor: nova }));
        }
      }
    }
    setOcupado(false);
    setMsg(okCursos ? { tipo: "ok", texto: "Configurações salvas na planilha." } : { tipo: "erro", texto: "As configurações foram salvas, mas não foi possível salvar a cor de algum curso." });
  };

  const campo = (c) => (
    <VuiBox key={c.chave}>
      <FieldLabel>{c.rotulo}</FieldLabel>
      {c.tipo === "cor" ? (
        <VuiBox display="flex" alignItems="center" gap="10px">
          <input
            type="color"
            value={COR.test(v[c.chave]) ? v[c.chave] : "#E3242B"}
            disabled={!pode.admin}
            onChange={set(c.chave)}
            style={{ width: 48, height: 36, border: "none", background: "transparent", cursor: pode.admin ? "pointer" : "default" }}
          />
          <VuiTypography variant="caption" color="text">
            {v[c.chave]}
          </VuiTypography>
        </VuiBox>
      ) : (
        <VuiInput fullWidth value={v[c.chave]} onChange={set(c.chave)} disabled={!pode.admin} error={Boolean(erros[c.chave])} inputProps={{ inputMode: c.tipo === "inteiro" ? "numeric" : undefined }} />
      )}
      <VuiTypography variant="caption" color={erros[c.chave] ? "error" : "text"} sx={{ display: "block", mt: "4px" }}>
        {erros[c.chave] || c.ajuda}
      </VuiTypography>
    </VuiBox>
  );

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <BarraStatus />
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="16px" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Configurações
            </VuiTypography>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Parâmetros da aba Config da planilha.{pode.admin ? " As alterações são gravadas direto nela." : " Só o perfil Admin pode alterar."}
            </VuiTypography>
          </VuiBox>
          {pode.admin && (
            <VuiButton color="info" variant="contained" disabled={ocupado} onClick={salvar}>
              <IoSave size="16px" style={{ marginRight: 8 }} />
              {ocupado ? "Salvando…" : "Salvar alterações"}
            </VuiButton>
          )}
        </VuiBox>

        {msg.texto && (
          <VuiTypography variant="button" color={msg.tipo === "ok" ? "success" : "error"} fontWeight="medium" mb={2} sx={{ display: "block" }}>
            {msg.texto}
          </VuiTypography>
        )}

        <Grid container spacing={3}>
          {CAMPOS.map((g) => (
            <Grid item xs={12} xl={6} key={g.grupo}>
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">
                  {g.grupo}
                </VuiTypography>
                <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>{g.itens.map(campo)}</VuiBox>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} xl={6}>
            <Card>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                Funcionalidades
              </VuiTypography>
              <VuiTypography variant="caption" color="text" mb="16px" sx={{ display: "block" }}>
                Desligar esconde a funcionalidade do dashboard (menu, telas e campos). Os dados continuam salvos na planilha e voltam ao ligar de novo.
              </VuiTypography>
              {RECURSOS.map((r) => (
                <VuiBox key={r.chave} display="flex" alignItems="center" justifyContent="space-between" gap="16px" mb={2}>
                  <VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                      {r.rotulo}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {r.ajuda}
                    </VuiTypography>
                  </VuiBox>
                  <VuiSwitch
                    color="info"
                    checked={Boolean(recs[r.chave])}
                    disabled={!pode.admin}
                    onChange={(e) => {
                      setRecs((x) => ({ ...x, [r.chave]: e.target.checked }));
                      setMsg({ tipo: "", texto: "" });
                    }}
                  />
                </VuiBox>
              ))}
            </Card>
          </Grid>

          {tiposComCurso.length > 0 && (
            <Grid item xs={12} xl={6}>
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                  Cores dos cursos
                </VuiTypography>
                <VuiTypography variant="caption" color="text" mb="16px" sx={{ display: "block" }}>
                  Uma cor por tipo de curso na grade e na legenda. Ao salvar, vale para todos os cursos do tipo. Também dá para mudar a cor de um curso em Cursos e turmas.
                </VuiTypography>
                <VuiBox sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
                  {tiposComCurso.map((t) => (
                    <VuiBox key={t}>
                      <FieldLabel>{t}</FieldLabel>
                      <VuiBox display="flex" alignItems="center" gap="10px">
                        <input
                          type="color"
                          value={COR.test(coresTipo[t]) ? coresTipo[t] : "#E3242B"}
                          disabled={!pode.admin}
                          onChange={mudarCorTipo(t)}
                          style={{ width: 48, height: 36, border: "none", background: "transparent", cursor: pode.admin ? "pointer" : "default" }}
                        />
                        <VuiTypography variant="caption" color="text">
                          {coresTipo[t]}
                        </VuiTypography>
                      </VuiBox>
                      <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "4px" }}>
                        {dados.cursos.filter((c) => tipoDoCurso(c) === t).map((c) => c.nome).join(", ")}
                      </VuiTypography>
                    </VuiBox>
                  ))}
                </VuiBox>
              </Card>
            </Grid>
          )}
        </Grid>
      </VuiBox>
    </DashboardLayout>
  );
}

export default Configuracoes;
