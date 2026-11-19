import PropTypes from "prop-types";

import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { IoFolderOpenOutline } from "react-icons/io5";

export const texto = (t, cor = "text") => (
  <VuiTypography variant="button" color={cor} fontWeight="regular">
    {t}
  </VuiTypography>
);

// colunas: [{ nome, align }]; linhas: [{ chave, celulas: [node], onClick }]
function Tabela({ colunas, linhas, vazio }) {
  const celula = {
    p: "12px 14px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    verticalAlign: "middle",
    transition: "background 150ms ease",
  };

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
                sx={{
                  p: "12px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  color: "#8c9ba5",
                  textTransform: "uppercase",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {c.nome}
              </VuiBox>
            ))}
          </TableRow>
        </VuiBox>
        <TableBody>
          {linhas.map((l, index) => (
            <TableRow
              key={l.chave}
              onClick={l.onClick}
              sx={{
                background: index % 2 === 1 ? "rgba(255, 255, 255, 0.015)" : "transparent",
                cursor: l.onClick ? "pointer" : "default",
                "&:hover td": {
                  background: l.onClick ? "rgba(227, 36, 43, 0.06) !important" : "rgba(255, 255, 255, 0.03)",
                },
              }}
            >
              {l.celulas.map((c, i) => (
                <VuiBox key={`${l.chave}-${i}`} component="td" textAlign={colunas[i].align || "left"} sx={celula}>
                  {c}
                </VuiBox>
              ))}
            </TableRow>
          ))}
          {!linhas.length && (
            <TableRow>
              <VuiBox component="td" colSpan={colunas.length} sx={{ p: "36px 16px", textAlign: "center" }}>
                <VuiBox display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap="8px">
                  <VuiBox sx={{ color: "rgba(255, 255, 255, 0.25)", display: "flex" }}>
                    <IoFolderOpenOutline size="36px" />
                  </VuiBox>
                  <VuiTypography variant="button" color="text" fontWeight="medium" sx={{ color: "#8c9ba5" }}>
                    {vazio}
                  </VuiTypography>
                </VuiBox>
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
