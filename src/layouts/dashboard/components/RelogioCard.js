import { useEffect, useState } from "react";

import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

function RelogioCard() {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const segundos = agora.toLocaleTimeString("pt-BR", { second: "2-digit" }).padStart(2, "0");
  const data = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Card sx={{ height: "100%" }}>
      <VuiTypography variant="button" color="text" fontWeight="regular">
        Agora
      </VuiTypography>
      <VuiBox display="flex" alignItems="baseline" gap="8px" mt="6px">
        <VuiTypography variant="h1" color="white" fontWeight="bold" sx={{ fontSize: "44px", lineHeight: 1 }}>
          {hora}
        </VuiTypography>
        <VuiTypography variant="button" color="text" fontWeight="regular">
          :{segundos}
        </VuiTypography>
      </VuiBox>
      <VuiTypography variant="button" color="white" fontWeight="regular" mt="8px" sx={{ display: "block", textTransform: "capitalize" }}>
        {data}
      </VuiTypography>
    </Card>
  );
}

export default RelogioCard;
