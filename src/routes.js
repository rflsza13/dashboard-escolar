import Dashboard from "layouts/dashboard";
import Horario from "layouts/horario";
import Professores from "layouts/professores";
import Alunos from "layouts/alunos";
import FichaAluno from "layouts/alunos/ficha";
import Boletim from "layouts/alunos/boletim";
import Cursos from "layouts/cursos";
import Pontos from "layouts/pontos";
import Configuracoes from "layouts/configuracoes";

import { IoHome, IoCalendar, IoIdCard, IoPeople, IoLibrary, IoTrophy, IoSettings } from "react-icons/io5";

const icone = (Comp) => <Comp size="15px" color="inherit" />;

const routes = [
  { type: "collapse", name: "Dashboard", key: "dashboard", route: "/dashboard", icon: icone(IoHome), component: Dashboard, noCollapse: true },
  { type: "collapse", name: "Horário das aulas", key: "horario", route: "/horario", icon: icone(IoCalendar), component: Horario, noCollapse: true },
  { type: "collapse", name: "Professores", key: "professores", route: "/professores", icon: icone(IoIdCard), component: Professores, noCollapse: true, recurso: "professores" },
  { type: "collapse", name: "Alunos", key: "alunos", route: "/alunos", icon: icone(IoPeople), component: Alunos, noCollapse: true },
  { type: "hidden", name: "Boletim do aluno", key: "alunos-boletim", route: "/alunos/:id/boletim", component: Boletim },
  { type: "hidden", name: "Ficha do aluno", key: "alunos-ficha", route: "/alunos/:id", component: FichaAluno },
  { type: "collapse", name: "Cursos e turmas", key: "cursos", route: "/cursos", icon: icone(IoLibrary), component: Cursos, noCollapse: true },
  { type: "collapse", name: "Pontos e prêmios", key: "pontos", route: "/pontos", icon: icone(IoTrophy), component: Pontos, noCollapse: true, recurso: "pontos" },
  { type: "collapse", name: "Configurações", key: "configuracoes", route: "/configuracoes", icon: icone(IoSettings), component: Configuracoes, noCollapse: true },
];

export default routes;
