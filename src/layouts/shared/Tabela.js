import PropTypes from "prop-types";

import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

export const texto = (t, cor = "text") => (
  <VuiTypography variant="button" color={cor} fontWeight="regular">
    {t}
  </VuiTypography>
);

// colunas: [{ nome, align }]; linhas: [{ chave, celulas: [node], onClick }]
function Tabela({ colunas, linhas, vazio }) {
  const celula = { p: "10px 12px", borderBottom: "1px solid rgba(120,120,120,0.35)", verticalAlign: "middle" };
  return (
    <TableContainer>
      <MuiTable>
        <VuiBox component="thead">
          <TableRow>
            {colunas.map((c, i) => (
              <VuiBox
                key={`${c.nome}-${i}`}
                component="th"
                textAlign={c.align || "left"}
                sx={{ p: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#a0aec0", textTransform: "uppercase", borderBottom: "1px solid #3A3A3A", whiteSpace: "nowrap" }}
              >
                {c.nome}
              </VuiBox>
            ))}
          </TableRow>
        </VuiBox>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.chave} onClick={l.onClick} sx={l.onClick ? { cursor: "pointer", "&:hover td": { background: "rgba(255,255,255,0.03)" } } : undefined}>
              {l.celulas.map((c, i) => (
                <VuiBox key={`${l.chave}-${i}`} component="td" textAlign={colunas[i].align || "left"} sx={celula}>
                  {c}
                </VuiBox>
              ))}
            </TableRow>
          ))}
          {!linhas.length && (
            <TableRow>
              <VuiBox component="td" colSpan={colunas.length} sx={{ p: "24px", textAlign: "center" }}>
                {texto(vazio)}
              </VuiBox>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}

Tabela.defaultProps = { vazio: "Nada encontrado." };
Tabela.propTypes = {
  colunas: PropTypes.array.isRequired,
  linhas: PropTypes.array.isRequired,
  vazio: PropTypes.string,
};

export default Tabela;
