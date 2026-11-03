import { useMemo } from "react";
import PropTypes from "prop-types";
import Chart from "react-apexcharts";

const texto = { colors: "#c8cfca", fontSize: "11px" };
const COR = { concluido: "#01B574", atual: "#FFFFFF", pendente: "#3F3F3F" };
const ROTULO = { concluido: "Concluído", atual: "Em andamento", pendente: "A cursar" };

// Rosca com uma fatia por módulo: verde = concluído, azul = atual, cinza = a cursar
export function RoscaModulos({ itens, concluidos, total }) {
  const options = useMemo(
    () => ({
      chart: { type: "donut", background: "transparent" },
      labels: itens.map((i) => `${i.modulo.ordem}. ${i.modulo.nome}`),
      colors: itens.map((i) => COR[i.estado]),
      stroke: { width: 3, colors: ["#141414"] },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: { theme: "dark", y: { formatter: (v, o) => ROTULO[itens[o.seriesIndex].estado] } },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: { show: true, color: "#A0AEC0", fontSize: "12px", offsetY: 20 },
              value: { show: true, color: "#fff", fontSize: "30px", fontWeight: 700, offsetY: -14, formatter: () => `${concluidos}/${total}` },
              total: { show: true, showAlways: true, label: "módulos concluídos", color: "#A0AEC0", fontSize: "12px", formatter: () => `${concluidos}/${total}` },
            },
          },
        },
      },
    }),
    [itens, concluidos, total]
  );
  const series = useMemo(() => itens.map(() => 1), [itens]);
  return <Chart options={options} series={series} type="donut" width="100%" height="100%" />;
}
RoscaModulos.propTypes = { itens: PropTypes.array.isRequired, concluidos: PropTypes.number.isRequired, total: PropTypes.number.isRequired };

export function PresencaMensalChart({ serie }) {
  const series = useMemo(() => [{ name: "Presenças", data: serie.presencas }, { name: "Faltas", data: serie.faltas }], [serie]);
  const options = useMemo(
    () => ({
      chart: { stacked: true, toolbar: { show: false }, background: "transparent" },
      colors: ["#01B574", "#E31A1A"],
      plotOptions: { bar: { columnWidth: "45%", borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories: serie.labels, labels: { style: texto }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: texto, formatter: (v) => String(Math.round(v)) } },
      grid: { strokeDashArray: 5, borderColor: "#3A3A3A" },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: "#fff" } },
      tooltip: { theme: "dark" },
    }),
    [serie]
  );
  return <Chart options={options} series={series} type="bar" width="100%" height="100%" />;
}
PresencaMensalChart.propTypes = { serie: PropTypes.object.isRequired };

export function FrequenciaChart({ freq }) {
  const series = useMemo(() => [{ name: "Presença acumulada", data: freq.valores }], [freq]);
  const options = useMemo(
    () => ({
      chart: { toolbar: { show: false }, background: "transparent" },
      colors: ["#E3242B"],
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] } },
      dataLabels: { enabled: false },
      xaxis: { categories: freq.labels, labels: { style: texto, hideOverlappingLabels: true }, axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: Math.min(8, freq.labels.length) },
      yaxis: { min: 0, max: 100, labels: { style: texto, formatter: (v) => `${Math.round(v)}%` } },
      grid: { strokeDashArray: 5, borderColor: "#3A3A3A" },
      legend: { show: false },
      tooltip: { theme: "dark", y: { formatter: (v) => `${v}%` } },
    }),
    [freq]
  );
  return <Chart options={options} series={series} type="area" width="100%" height="100%" />;
}
FrequenciaChart.propTypes = { freq: PropTypes.object.isRequired };
