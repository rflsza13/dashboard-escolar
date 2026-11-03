import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useEscola } from "context/escola";
import { BONUS_BOM_COMPORTAMENTO, DIAS_LONGOS, fimDaAula, formatarData, siglaDia, somarDias, dataDeIso } from "utils/escola";
import { FieldLabel, NativeSelect, dialogPaper } from "layouts/shared/fields";
import StatusChip from "layouts/shared/StatusChip";

function AulaDialog({ sessao, onClose }) {
  const { dados, pode, marcarSessao, agendarReposicao, concluirModulo, salvar, recursos } = useEscola();
  const history = useHistory();
  const [modoRep, setModoRep] = useState(false);
  const [rep, setRep] = useState({ data: "", hora: "", modalidade: "Presencial" });
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Estados para conclusão de módulo
  const [bomComportamento, setBomComportamento] = useState(false);
  const [obsModulo, setObsModulo] = useState("");

  useEffect(() => {
    if (!sessao) return;
    setModoRep(false);
    setErro("");
    setBomComportamento(false);
    setObsModulo("");
    setRep({ data: somarDias(sessao.data, 7), hora: sessao.hora, modalidade: sessao.modalidade });
  }, [sessao]);

  if (!sessao) return null;

  const matricula = dados.matriculas.find((m) => m.id === sessao.matriculaId);
  const modulos = dados.modulos.filter((m) => matricula && m.cursoId === matricula.cursoId).sort((a, b) => a.ordem - b.ordem);
  const moduloAtual = matricula ? modulos.find((m) => Number(m.ordem) === Number(matricula.moduloAtual)) : null;
  const pontosBase = moduloAtual
    ? Number(moduloAtual.pontos !== null && moduloAtual.pontos !== "" && moduloAtual.pontos !== undefined ? moduloAtual.pontos : dados.config.pontosPadrao) || 0
    : 0;
  const podeConcluir = pode.professor && sessao.tipo === "Regular" && matricula && matricula.status === "Ativa" && moduloAtual;

  const marcar = async (acao) => {
    onClose();
    await marcarSessao(sessao, acao);
  };

  const confirmarReposicao = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rep.data)) return setErro("Informe a data da reposição.");
    if (!/^\d{1,2}:\d{2}$/.test(rep.hora)) return setErro("Informe o horário da reposição.");

    // Validação da regra de reposição:
    // Não permitir mais de 1 reposição para o mesmo aluno em intervalo < 30 dias,
    // porém permitindo até 2 reposições no mesmo dia.
    const alunoId = sessao.alunoId;
    const matriculasDoAluno = dados.matriculas.filter((m) => m.alunoId === alunoId).map((m) => m.id);
    const reposicoesAluno = dados.aulas.filter(
      (a) =>
        matriculasDoAluno.includes(a.matriculaId) &&
        (a.tipo === "Reposição" || a.status === "Reposição agendada" || a.status === "Reposição realizada") &&
        a.id !== sessao.aulaId
    );

    // Contagem de reposições já agendadas no MESMO dia escolhido
    const repsNoMesmoDia = reposicoesAluno.filter((r) => r.data === rep.data);
    if (repsNoMesmoDia.length >= 2) {
      return setErro("O aluno já atingiu o limite máximo de 2 reposições agendadas para este mesmo dia.");
    }

    // Se NÃO for no mesmo dia, verifica se houve alguma reposição nos últimos ou próximos 30 dias
    const dataAlvo = dataDeIso(rep.data).getTime();
    const trintaDiasMs = 30 * 24 * 60 * 60 * 1000;

    const violouIntervalo = reposicoesAluno.some((r) => {
      if (r.data === rep.data) return false; // Exceção: mesmo dia é permitido até 2
      const dataR = dataDeIso(r.data).getTime();
      return Math.abs(dataAlvo - dataR) < trintaDiasMs;
    });

    if (violouIntervalo) {
      return setErro("Não é permitido agendar mais de 1 reposição em um intervalo inferior a 30 dias (exceto até 2 no mesmo dia).");
    }

    onClose();
    return agendarReposicao(sessao, rep);
  };

  const concluir = async () => {
    const pts = pontosBase + (bomComportamento ? BONUS_BOM_COMPORTAMENTO : 0);
    if (
      !window.confirm(
        `Concluir o módulo ${moduloAtual.ordem} (${moduloAtual.nome}) de ${sessao.aluno}? ${recursos.pontos ? `O aluno ganhará ${pts} pontos.` : ""}`
      )
    ) {
      return;
    }
    setOcupado(true);
    const r = await concluirModulo(sessao.matriculaId, { bomComportamento, obs: obsModulo });
    setOcupado(false);
    if (r.ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" PaperProps={dialogPaper}>
      <DialogContent>
        <VuiBox display="flex" alignItems="center" gap="10px" mb="4px">
          <VuiBox sx={{ width: 12, height: 12, borderRadius: "4px", background: sessao.cor, flexShrink: 0 }} />
          <VuiTypography variant="lg" color="white" fontWeight="bold">
            {sessao.aluno}
          </VuiTypography>
        </VuiBox>
        <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block" }}>
          {sessao.curso} · {DIAS_LONGOS[siglaDia(sessao.data)]}, {formatarData(sessao.data)} · {sessao.hora}
          {fimDaAula(sessao.hora, sessao.duracao) ? `–${fimDaAula(sessao.hora, sessao.duracao)}` : ""}
        </VuiTypography>
        {recursos.professores && sessao.tipo === "Experimental" && sessao.aulaId && pode.professor ? (
          <VuiBox mt={1} mb={0.5}>
            <FieldLabel>Professor responsável</FieldLabel>
            <NativeSelect
              value={sessao.professorId || ""}
              onChange={async (e) => {
                const aula = dados.aulas.find((a) => a.id === sessao.aulaId);
                if (aula) await salvar("Aulas", { ...aula, professorId: e.target.value });
              }}
            >
              <option value="">Não definido</option>
              {dados.professores.filter((p) => p.ativo !== "Não" || p.id === sessao.professorId).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </NativeSelect>
          </VuiBox>
        ) : (
          sessao.professores.length > 0 && (
            <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block" }}>
              Professor(es): {sessao.professores.join(", ")}
            </VuiTypography>
          )
        )}
        <VuiBox display="flex" flexWrap="wrap" alignItems="center" gap="8px" mt={1.5} mb={2}>
          <StatusChip status={sessao.status} />
          {sessao.tags.map((t) => (
            <VuiTypography key={t} variant="caption" color="text" fontWeight="medium" sx={{ border: "1px solid #3A3A3A", borderRadius: "20px", p: "2px 10px" }}>
              {t}
            </VuiTypography>
          ))}
        </VuiBox>

        {!pode.professor && (
          <VuiTypography variant="caption" color="text">
            Seu perfil é somente leitura.
          </VuiTypography>
        )}

        {pode.professor && !modoRep && (
          <VuiBox display="flex" flexWrap="wrap" gap="8px">
            <VuiButton size="small" color="success" variant="contained" onClick={() => marcar("Presente")}>
              Presente
            </VuiButton>
            <VuiButton size="small" color="error" variant="contained" onClick={() => marcar("Falta")}>
              Falta
            </VuiButton>
            <VuiButton size="small" color="warning" variant="contained" onClick={() => setModoRep(true)}>
              Reposição
            </VuiButton>
            {sessao.aulaId && (
              <VuiButton size="small" color="text" variant="text" onClick={() => marcar("Limpar")}>
                Limpar marcação
              </VuiButton>
            )}
          </VuiBox>
        )}

        {pode.professor && modoRep && (
          <VuiBox>
            <VuiTypography variant="button" color="white" fontWeight="regular" sx={{ display: "block", mb: 1.5 }}>
              A aula de hoje fica como falta e a reposição é agendada na data abaixo.
            </VuiTypography>
            <VuiBox sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <VuiBox>
                <FieldLabel>Data da reposição</FieldLabel>
                <VuiInput fullWidth type="date" value={rep.data} onChange={(e) => setRep({ ...rep, data: e.target.value })} inputProps={{ style: { colorScheme: "dark" } }} />
              </VuiBox>
              <VuiBox>
                <FieldLabel>Horário</FieldLabel>
                <VuiInput fullWidth type="time" value={rep.hora} onChange={(e) => setRep({ ...rep, hora: e.target.value })} inputProps={{ style: { colorScheme: "dark" } }} />
              </VuiBox>
              <VuiBox sx={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Modalidade</FieldLabel>
                <NativeSelect value={rep.modalidade} onChange={(e) => setRep({ ...rep, modalidade: e.target.value })}>
                  <option value="Presencial">Presencial</option>
                  <option value="Online">Online</option>
                </NativeSelect>
              </VuiBox>
            </VuiBox>
            {erro && (
              <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                {erro}
              </VuiTypography>
            )}
            <VuiBox display="flex" gap="8px" mt={2}>
              <VuiButton size="small" color="warning" variant="contained" onClick={confirmarReposicao}>
                Agendar reposição
              </VuiButton>
              <VuiButton size="small" color="text" variant="text" onClick={() => setModoRep(false)}>
                Voltar
              </VuiButton>
            </VuiBox>
          </VuiBox>
        )}

        {podeConcluir && !modoRep && (
          <VuiBox mt={3} pt={2} sx={{ borderTop: "1px solid rgba(120,120,120,0.45)" }}>
            <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 1 }}>
              Módulo atual: {moduloAtual.ordem} de {modulos.length} · {moduloAtual.nome}
            </VuiTypography>

            {recursos.pontos && (
            <VuiBox mb={1.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bomComportamento}
                    onChange={(e) => setBomComportamento(e.target.checked)}
                  />
                }
                label={
                  <VuiTypography variant="button" color="white" fontWeight="medium">
                    Bom comportamento (+{BONUS_BOM_COMPORTAMENTO} pts) — Total: {pontosBase + (bomComportamento ? BONUS_BOM_COMPORTAMENTO : 0)} pts
                  </VuiTypography>
                }
              />
            </VuiBox>
            )}

            <VuiBox mb={2}>
              <FieldLabel>Observações</FieldLabel>
              <VuiInput
                fullWidth
                multiline
                rows={2}
                placeholder="Observações do módulo concluído..."
                value={obsModulo}
                onChange={(e) => setObsModulo(e.target.value)}
              />
            </VuiBox>

            <VuiButton size="small" color="info" variant="outlined" disabled={ocupado} onClick={concluir}>
              {ocupado ? "Concluindo…" : "Concluir módulo"}
            </VuiButton>
          </VuiBox>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "8px 24px 16px" }}>
        <VuiButton color="info" variant="text" onClick={() => { onClose(); history.push(`/alunos/${sessao.alunoId}`); }} sx={{ mr: "auto" }}>
          Ver acompanhamento
        </VuiButton>
        <VuiButton color="text" variant="text" onClick={onClose}>
          Fechar
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

AulaDialog.defaultProps = { sessao: null };
AulaDialog.propTypes = { sessao: PropTypes.object, onClose: PropTypes.func.isRequired };

export default AulaDialog;
