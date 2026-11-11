import { useMemo } from "react";
import { useHistory, useParams } from "react-router-dom";

import PageLayout from "examples/LayoutContainers/PageLayout";

import { useEscola } from "context/escola";
import themeConfig from "themeConfig";
import { DIAS_LONGOS, descricaoModulo, faseDoModulo, formatarData, formatarNota, hojeIso, indexarAulas, resumoAluno, rotuloSituacao } from "utils/escola";

// Estilos de impressão: a folha vira a página inteira e os botões somem
const CSS_IMPRESSAO = `
  @page { size: A4; margin: 14mm; }
  @media print {
    html, body { background: #ffffff !important; }
    .no-print { display: none !important; }
    .folha-boletim { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; border-radius: 0 !important; }
    .bloco-boletim { break-inside: avoid; }
  }
`;

const cor = themeConfig.primary || "#e3242b";
const cinza = "#555555";

const Titulo = ({ children }) => (
  <h3 style={{ margin: "22px 0 8px", fontSize: 15, color: cor, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${cor}`, paddingBottom: 4 }}>{children}</h3>
);

const Info = ({ rotulo, valor }) => (
  <div style={{ minWidth: 130 }}>
    <div style={{ fontSize: 11, color: cinza, textTransform: "uppercase" }}>{rotulo}</div>
    <div style={{ fontSize: 16, fontWeight: 700 }}>{valor}</div>
  </div>
);

function Boletim() {
  const { id } = useParams();
  const history = useHistory();
  const { dados, recursos } = useEscola();
  const aluno = dados.alunos.find((a) => a.id === id);
  const idx = useMemo(() => indexarAulas(dados), [dados]);
  const r = useMemo(() => (aluno ? resumoAluno(dados, id, idx) : null), [dados, id, idx, aluno]);

  if (!aluno) {
    return (
      <PageLayout>
        <div style={{ padding: 32, color: "#fff", fontFamily: "Arial, sans-serif" }}>
          Aluno não encontrado.{" "}
          <button type="button" onClick={() => history.push("/alunos")}>
            Voltar
          </button>
        </div>
      </PageLayout>
    );
  }

  const profs = dados.professores.reduce((m, p) => ({ ...m, [p.id]: p }), {});
  const cursosPorId = dados.cursos.reduce((m, c) => ({ ...m, [c.id]: c }), {});
  const matriculas = r.matriculas.filter((x) => x.matricula.status !== "Experimental");
  const observacoes = r.aulas
    .filter((a) => a.obs && String(a.obs).trim())
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))
    .slice(0, 8)
    .map((a) => ({ ...a, curso: (cursosPorId[(dados.matriculas.find((m) => m.id === a.matriculaId) || {}).cursoId] || {}).nome || "" }));
  const escola = (dados.config && dados.config.nomeEscola) || "Escola";

  return (
    <PageLayout>
      <style>{CSS_IMPRESSAO}</style>
      <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", padding: "20px 16px 0", fontFamily: "Arial, sans-serif" }}>
        <button type="button" onClick={() => history.push(`/alunos/${id}`)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #888", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 14 }}>
          Voltar para a ficha
        </button>
        <button type="button" onClick={() => window.print()} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: cor, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          Imprimir / salvar PDF
        </button>
      </div>

      <div className="folha-boletim" style={{ background: "#ffffff", color: "#111111", maxWidth: 820, margin: "16px auto 40px", padding: "34px 38px", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.4)", fontFamily: "Arial, Helvetica, sans-serif", lineHeight: 1.45 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8, borderBottom: `4px solid ${cor}`, paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: cinza, textTransform: "uppercase", letterSpacing: "0.08em" }}>{escola}</div>
            <h1 style={{ margin: "2px 0 0", fontSize: 26 }}>Boletim do aluno</h1>
          </div>
          <div style={{ fontSize: 12, color: cinza }}>Emitido em {formatarData(hojeIso())}</div>
        </div>

        <div className="bloco-boletim" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{aluno.nome}</div>
          <div style={{ fontSize: 13, color: cinza }}>{[aluno.responsavel && `Responsável: ${aluno.responsavel}`, aluno.contato].filter(Boolean).join(" · ")}</div>
        </div>

        <Titulo>Resumo de frequência</Titulo>
        <div className="bloco-boletim" style={{ display: "flex", flexWrap: "wrap", gap: 22 }}>
          <Info rotulo="Presença" valor={r.pctPresenca === null ? "—" : `${Math.round(r.pctPresenca * 100)}%`} />
          <Info rotulo="Presenças" valor={r.presencas} />
          <Info rotulo="Faltas" valor={r.faltas} />
          <Info rotulo="Reposições pendentes" valor={r.reposicoesPendentes} />
          {recursos.pontos && <Info rotulo="Pontos (saldo)" valor={r.saldo} />}
        </div>

        {matriculas.length === 0 && <p style={{ color: cinza }}>Este aluno ainda não tem matrícula.</p>}

        {matriculas.map(({ matricula: m, curso, progresso }) => {
          const aval = (dados.avaliacoes || []).find((a) => a.matriculaId === m.id && a.tipo === "Final");
          const mods = progresso.itens.map((i) => i.modulo);
          return (
            <div key={m.id} className="bloco-boletim">
              <Titulo>{curso.nome}</Titulo>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginBottom: 10 }}>
                <Info rotulo="Situação" valor={rotuloSituacao(m.status)} />
                <Info rotulo="Aula" valor={`${DIAS_LONGOS[m.dia] || m.dia}, ${m.inicio}`} />
                <Info rotulo="Modalidade" valor={m.modalidade} />
                {m.dataInicio && <Info rotulo="Início" valor={formatarData(m.dataInicio)} />}
                <Info rotulo="Andamento" valor={`${progresso.concluidos} de ${progresso.total} módulos (${Math.round(progresso.pct * 100)}%)`} />
                {recursos.avaliacoes && progresso.media !== null && <Info rotulo="Média dos módulos" valor={formatarNota(progresso.media)} />}
              </div>
              {m.status === "Ativa" && progresso.atual && (
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <b>Módulo atual:</b> {descricaoModulo(mods, progresso.atual.modulo)} · {progresso.atual.modulo.nome}
                </div>
              )}
              {progresso.itens.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f2f2f2", textAlign: "left" }}>
                      <th style={{ padding: "6px 8px" }}>Módulo</th>
                      {progresso.itens.some((i) => faseDoModulo(i.modulo)) && <th style={{ padding: "6px 8px" }}>Fase</th>}
                      <th style={{ padding: "6px 8px" }}>Situação</th>
                      <th style={{ padding: "6px 8px" }}>Concluído em</th>
                      {recursos.avaliacoes && <th style={{ padding: "6px 8px", textAlign: "right" }}>Nota</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {progresso.itens.map((i) => (
                      <tr key={i.modulo.id} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td style={{ padding: "5px 8px" }}>
                          {i.modulo.ordem}. {i.modulo.nome}
                        </td>
                        {progresso.itens.some((x) => faseDoModulo(x.modulo)) && <td style={{ padding: "5px 8px" }}>{faseDoModulo(i.modulo) || "—"}</td>}
                        <td style={{ padding: "5px 8px" }}>{i.estado === "concluido" ? "Concluído" : i.estado === "atual" ? "Em andamento" : "A cursar"}</td>
                        <td style={{ padding: "5px 8px" }}>{i.data ? formatarData(i.data) : "—"}</td>
                        {recursos.avaliacoes && <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{formatarNota(i.nota)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {recursos.avaliacoes && aval && (
                <div style={{ marginTop: 12, padding: "10px 14px", border: `1px solid ${cor}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: cinza, textTransform: "uppercase" }}>Avaliação final · {formatarData(aval.data)}{aval.professorId && profs[aval.professorId] ? ` · ${profs[aval.professorId].nome}` : ""}</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>
                    {aval.conceito}
                    {aval.nota !== "" && aval.nota !== null ? ` · nota ${String(aval.nota).replace(".", ",")}` : ""}
                  </div>
                  {aval.comentario && <div style={{ fontSize: 13, marginTop: 4 }}>{aval.comentario}</div>}
                </div>
              )}
            </div>
          );
        })}

        {observacoes.length > 0 && (
          <div className="bloco-boletim">
            <Titulo>Observações dos professores</Titulo>
            {observacoes.map((o) => (
              <div key={o.id} style={{ fontSize: 13, marginBottom: 6 }}>
                <b>{formatarData(o.data)}</b>
                {o.curso ? ` · ${o.curso}` : ""}: {o.obs}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 40, marginTop: 56 }}>
          <div style={{ flex: 1, borderTop: "1px solid #111", paddingTop: 4, fontSize: 12, textAlign: "center" }}>Coordenação</div>
          <div style={{ flex: 1, borderTop: "1px solid #111", paddingTop: 4, fontSize: 12, textAlign: "center" }}>Responsável</div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Boletim;
