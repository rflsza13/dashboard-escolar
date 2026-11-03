import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

export const COR_STATUS = {
  Agendada: "#A0AEC0",
  Presente: "#01B574",
  Falta: "#E31A1A",
  "Reposição agendada": "#FF8A3D",
  "Reposição realizada": "#01B574",
};

function StatusChip({ status }) {
  const cor = COR_STATUS[status] || "#A0AEC0";
  return (
    <VuiBox sx={{ display: "inline-flex", alignItems: "center", gap: "6px", p: "2px 10px", borderRadius: "20px", border: `1px solid ${cor}`, background: `${cor}1F` }}>
      <VuiBox sx={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />
      <VuiTypography variant="caption" color="white" fontWeight="medium">
        {status}
      </VuiTypography>
    </VuiBox>
  );
}
StatusChip.propTypes = { status: PropTypes.string.isRequired };

export default StatusChip;
