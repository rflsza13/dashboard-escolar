import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { normalizarNome } from "utils/escola";

// Campo de pesquisa com lista de resultados (no lugar de um select enorme).
// opcoes: [{ valor, rotulo, detalhe }]; value é o "valor" escolhido ("" = nada escolhido)
function BuscaSelecao({ opcoes, value, onChange, placeholder, erro }) {
  const [texto, setTexto] = useState("");
  const [aberta, setAberta] = useState(false);
  const ref = useRef(null);

  const escolhida = useMemo(() => opcoes.find((o) => o.valor === value) || null, [opcoes, value]);

  const resultados = useMemo(() => {
    if (escolhida) return [];
    const q = normalizarNome(texto);
    // sem digitar nada, mostra as primeiras opções para quem prefere rolar a lista
    return opcoes.filter((o) => !q || normalizarNome(o.rotulo).includes(q)).slice(0, 8);
  }, [opcoes, texto, escolhida]);

  const escolher = (o) => {
    onChange(o.valor);
    setTexto("");
    setAberta(false);
  };
  const limpar = () => {
    onChange("");
    setTexto("");
    setAberta(true);
  };

  return (
    <VuiBox sx={{ position: "relative" }} ref={ref}>
      <VuiBox sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <VuiInput
          fullWidth
          placeholder={placeholder}
          value={escolhida ? escolhida.rotulo : texto}
          onChange={(e) => {
            if (escolhida) onChange("");
            setTexto(e.target.value);
            setAberta(true);
          }}
          onFocus={() => {
            if (!escolhida) setAberta(true);
          }}
          onBlur={() => setTimeout(() => setAberta(false), 150)}
          error={Boolean(erro)}
        />
        {(escolhida || texto) && (
          <VuiButton size="small" color="text" variant="text" onClick={limpar} sx={{ minWidth: 0, px: 1 }}>
            ✕
          </VuiButton>
        )}
      </VuiBox>
      {aberta && !escolhida && (
        <VuiBox
          sx={{
            position: "absolute",
            zIndex: 1300,
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(18,18,24,0.98)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            mt: "4px",
            maxHeight: "220px",
            overflowY: "auto",
            boxShadow: "0 12px 36px rgba(0,0,0,0.8)",
          }}
        >
          {resultados.length === 0 && (
            <VuiTypography variant="caption" color="text" sx={{ display: "block", p: "9px 14px" }}>
              Nenhum aluno encontrado.
            </VuiTypography>
          )}
          {resultados.map((o) => (
            <VuiBox
              key={o.valor}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => escolher(o)}
              sx={{ p: "9px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", "&:hover": { background: "rgba(227,36,43,0.15)" } }}
            >
              <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block", fontSize: "13px" }}>
                {o.rotulo}
              </VuiTypography>
              {o.detalhe && (
                <VuiTypography variant="caption" color="text" sx={{ fontSize: "11px" }}>
                  {o.detalhe}
                </VuiTypography>
              )}
            </VuiBox>
          ))}
        </VuiBox>
      )}
    </VuiBox>
  );
}

BuscaSelecao.defaultProps = { placeholder: "Digite o nome do aluno…", erro: false };
BuscaSelecao.propTypes = {
  opcoes: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  erro: PropTypes.bool,
};

export default BuscaSelecao;
