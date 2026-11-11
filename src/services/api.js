import { BONUS_BOM_COMPORTAMENTO, DEFAULT_CONFIG, DIAS_GRADE, hojeIso, novoId, segundaDaSemana, siglaDia, somarDias, saldoDePontos } from "utils/escola";

const URL_SCRIPT = process.env.REACT_APP_SCRIPT_URL;
export const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
export const isDemo = !URL_SCRIPT;

/* ---------------- planilha real (Apps Script) ---------------- */
async function chamar(token, payload) {
  // Sem cabeçalhos customizados: evita preflight CORS no Apps Script.
  const res = await fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ ...payload, token }) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) {
    const e = new Error(data.error || "Erro desconhecido");
    e.code = data.code;
    throw e;
  }
  return data;
}

const remoto = {
  entrar: (googleToken) => chamar(googleToken, { action: "entrar" }),
  sair: (t) => chamar(t, { action: "sair" }),
  carregar: (t) => chamar(t, { action: "carregar" }),
  salvar: (t, tabela, registro) => chamar(t, { action: "salvar", tabela, registro }),
  excluir: (t, tabela, id) => chamar(t, { action: "excluir", tabela, id }),
  concluirModulo: (t, matriculaId, opts = {}) => chamar(t, { action: "concluirModulo", matriculaId, ...opts }),
  resgatar: (t, alunoId, premioId) => chamar(t, { action: "resgatar", alunoId, premioId }),
  criarExperimental: (t, dados) => chamar(t, { action: "criarExperimental", ...dados }),
  salvarConfig: (t, config) => chamar(t, { action: "salvarConfig", config }),
  movimentar: (t, form) => chamar(t, { action: "movimentar", ...form }),
  avaliacaoFinal: (t, form) => chamar(t, { action: "avaliacaoFinal", ...form }),
  notaModulo: (t, form) => chamar(t, { action: "notaModulo", ...form }),
};

/* ---------------- modo demonstração (localStorage) ---------------- */
const KEY = "escola-demo-v2";
const CHAVE = { Alunos: "alunos", Professores: "professores", Escala: "escala", Cursos: "cursos", Modulos: "modulos", Matriculas: "matriculas", Aulas: "aulas", Progresso: "progresso", Pontos: "pontos", Premios: "premios", Migracao: "migracao", Movimentacoes: "movimentacoes", Avaliacoes: "avaliacoes", Feriados: "feriados" };
const PREF = { Alunos: "A", Professores: "PRF", Escala: "ESC", Cursos: "C", Modulos: "MOD", Matriculas: "MAT", Aulas: "AUL", Progresso: "PRG", Pontos: "P", Premios: "PR", Migracao: "MIG", Movimentacoes: "MOV", Avaliacoes: "AVA", Feriados: "FER" };

function semear() {
  let s = 20261028;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const hoje = hojeIso();
  const segunda = segundaDaSemana(hoje);
  const cursos = [
    { id: "C01", nome: "Inglês", cor: "#8E7CFF", ativo: "Sim" },
    { id: "C02", nome: "Matemática", cor: "#01B574", ativo: "Sim" },
    { id: "C03", nome: "Redação", cor: "#E85D9A", ativo: "Sim" },
    { id: "C04", nome: "Informática Básica", cor: "#4DA3FF", ativo: "Sim", grupo: "Informática" },
    { id: "C05", nome: "Informática Avançada", cor: "#2E7DD1", ativo: "Sim", grupo: "Informática" },
    { id: "C06", nome: "Robótica 1", cor: "#F59E0B", ativo: "Sim" },
  ];
  const nomesMod = {
    C01: ["Fundamentos", "Conversação básica", "Gramática intermediária"],
    C02: ["Operações", "Frações e decimais", "Álgebra inicial"],
    C03: ["Estrutura do texto", "Argumentação", "Produção dissertativa"],
    C04: ["Windows e internet", "Pacote Office"],
    C05: ["Planilhas avançadas", "Introdução à programação"],
    C06: ["Montagem básica", "Sensores", "Motores", "Programação em blocos", "Desafios", "Projeto final"],
  };
  const modulos = [];
  cursos.forEach((c) =>
    nomesMod[c.id].forEach((n, i) => modulos.push({ id: `MOD${c.id.slice(1)}${i + 1}`, cursoId: c.id, ordem: i + 1, nome: n, pontos: null, fase: c.id === "C06" ? (i < 3 ? "Fase 1" : "Fase 2") : "" }))
  );
  const alunos = Array.from({ length: 8 }, (_, i) => ({
    id: `A00${i + 1}`, nome: `Aluno Exemplo ${i + 1}`, responsavel: "Responsável Exemplo", contato: `(00) 90000-000${i + 1}`, ativo: "Sim", obs: "",
  }));
  // [aluno, dia, hora, curso, modalidade, módulo atual]
  const slots = [
    [0, "Seg", "15:00", "C01", "Presencial", 2], [1, "Seg", "16:00", "C02", "Online", 1], [2, "Ter", "14:00", "C03", "Presencial", 1],
    [3, "Qua", "15:00", "C01", "Presencial", 3], [4, "Qua", "16:00", "C02", "Presencial", 2], [5, "Qua", "17:00", "C03", "Online", 2],
    [6, "Qui", "15:00", "C01", "Online", 1], [7, "Sex", "10:00", "C02", "Presencial", 1], [0, "Sex", "11:00", "C03", "Presencial", 1],
    [2, "Sáb", "09:00", "C01", "Presencial", 1], [1, "Qua", "15:00", "C03", "Presencial", 1], [3, "Ter", "16:00", "C02", "Presencial", 1],
    [4, "Ter", "15:00", "C04", "Presencial", 1], [5, "Ter", "15:00", "C05", "Presencial", 1], [6, "Qui", "16:00", "C04", "Online", 2], [7, "Qui", "17:00", "C06", "Presencial", 4],
  ];
  const pFalta = [0.05, 0.32, 0.1, 0.2, 0.08, 0.36, 0.15, 0.1];
  const matriculas = slots.map((x, i) => ({
    id: `MAT${String(i + 1).padStart(3, "0")}`, alunoId: alunos[x[0]].id, cursoId: x[3], dia: x[1], inicio: x[2], duracao: 90,
    modalidade: x[4], moduloAtual: x[5], dataInicio: somarDias(segunda, -63), status: "Ativa", obs: "",
  }));
  const aulas = [];
  const progresso = [];
  const pontos = [];
  let n = 1;
  matriculas.forEach((m, mi) => {
    const idxAluno = Number(m.alunoId.slice(1)) - 1;
    for (let w = -9; w <= 0; w += 1) {
      const data = somarDias(segunda, w * 7 + DIAS_GRADE.indexOf(m.dia));
      if (data >= hoje || data < m.dataInicio) continue;
      const falta = rnd() < pFalta[idxAluno];
      const id = `AUL${String(n++).padStart(4, "0")}`;
      aulas.push({ id, data, matriculaId: m.id, status: falta ? "Falta" : "Presente", tipo: "Regular", hora: "", modalidade: "", modulo: m.moduloAtual, reposicaoDe: "", obs: "" });
      if (falta && rnd() < 0.55) {
        const rep = somarDias(data, 3);
        aulas.push({ id: `AUL${String(n++).padStart(4, "0")}`, data: rep, matriculaId: m.id, status: rep < hoje ? "Reposição realizada" : "Reposição agendada", tipo: "Reposição", hora: "17:30", modalidade: "", modulo: m.moduloAtual, reposicaoDe: id, obs: "" });
      }
    }
    for (let o = 1; o < m.moduloAtual; o += 1) {
      const mod = modulos.find((x) => x.cursoId === m.cursoId && x.ordem === o);
      progresso.push({ id: `PRG${String(progresso.length + 1).padStart(3, "0")}`, matriculaId: m.id, moduloId: mod.id, concluidoEm: somarDias(hoje, -70 + mi * 3 + o * 20), obs: "" });
      pontos.push({ id: `P${String(pontos.length + 1).padStart(4, "0")}`, data: somarDias(hoje, -70 + mi * 3 + o * 20), alunoId: m.alunoId, tipo: "Ganho (módulo)", pontos: 10, descricao: `Concluiu o módulo ${o} de ${cursos.find((c) => c.id === m.cursoId).nome}`, moduloId: mod.id, registradoPor: "demo@escola.local" });
    }
  });
  // uma aula experimental hoje (ou amanhã, se hoje for domingo)
  const dataExp = siglaDia(hoje) === "Dom" ? somarDias(hoje, 1) : hoje;
  alunos.push({ id: "A009", nome: "Visitante Exemplo", responsavel: "", contato: "(00) 90000-0009", ativo: "Não", obs: "Aula experimental" });
  matriculas.push({ id: "MAT900", alunoId: "A009", cursoId: "C01", dia: siglaDia(dataExp), inicio: "18:00", duracao: 60, modalidade: "Presencial", moduloAtual: 1, dataInicio: dataExp, status: "Experimental", obs: "" });
  aulas.push({ id: "AUL9000", data: dataExp, matriculaId: "MAT900", status: "", tipo: "Experimental", hora: "18:00", modalidade: "", modulo: 1, reposicaoDe: "", obs: "", professorId: "PRF001" });
  pontos.push({ id: "P9001", data: somarDias(hoje, -12), alunoId: "A001", tipo: "Ganho (manual)", pontos: 5, descricao: "Participação em atividade", moduloId: "", registradoPor: "demo@escola.local" });
  pontos.push({ id: "P9002", data: somarDias(hoje, -5), alunoId: "A001", tipo: "Resgate", pontos: 5, descricao: "Resgate: Adesivo", moduloId: "", registradoPor: "demo@escola.local" });
  const premios = [
    { id: "PR01", nome: "Adesivo", custo: 5, ativo: "Sim" },
    { id: "PR02", nome: "Caneta personalizada", custo: 20, ativo: "Sim" },
    { id: "PR03", nome: "Aula livre de conversação", custo: 50, ativo: "Sim" },
  ];
  const professores = [
    { id: "PRF001", nome: "Professora Exemplo 1", contato: "(00) 91111-0001", cor: "#FF8A3D", ativo: "Sim", obs: "" },
    { id: "PRF002", nome: "Professor Exemplo 2", contato: "(00) 91111-0002", cor: "#4DA3FF", ativo: "Sim", obs: "" },
    { id: "PRF003", nome: "Professora Exemplo 3", contato: "(00) 91111-0003", cor: "#F2F2F2", ativo: "Sim", obs: "" },
  ];
  // [professor, dia, início, fim, curso (opcional)]
  const faixas = [
    ["PRF001", "Seg", "14:00", "18:00", ""], ["PRF001", "Qua", "14:00", "18:00", ""], ["PRF001", "Sex", "09:00", "12:00", ""], ["PRF001", "Sáb", "08:00", "12:00", ""],
    ["PRF002", "Ter", "14:00", "18:00", "C04"], ["PRF002", "Qui", "14:00", "18:00", "C04"],
    ["PRF003", "Ter", "14:00", "18:00", ""], ["PRF003", "Qui", "14:00", "18:00", ""], ["PRF003", "Qua", "15:00", "19:00", "C01"],
  ];
  const escala = faixas.map((f, i) => ({ id: `ESC${String(i + 1).padStart(3, "0")}`, professorId: f[0], dia: f[1], inicio: f[2], fim: f[3], cursoId: f[4], obs: "" }));
  return {
    dados: { alunos, professores, escala, cursos, modulos, matriculas, aulas, progresso, pontos, premios, migracao: [], movimentacoes: [], avaliacoes: [], feriados: [] },
    config: { ...DEFAULT_CONFIG, nomeEscola: "Escola Exemplo", gradeInicio: 8, gradeFim: 20 },
  };
}

function ler() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // cai no seed
  }
  const seed = semear();
  gravar(seed);
  return seed;
}
function gravar(db) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    // sem localStorage: segue só em memória
  }
}
const erro = (msg, code = "VALIDACAO") => Object.assign(new Error(msg), { code });

function upsert(db, tabela, reg) {
  if (!db.dados[CHAVE[tabela]]) db.dados[CHAVE[tabela]] = [];
  const lista = db.dados[CHAVE[tabela]];
  let i = reg.id ? lista.findIndex((r) => r.id === reg.id) : -1;
  if (i === -1 && tabela === "Migracao") i = lista.findIndex((r) => r.matriculaId === reg.matriculaId);
  if (i === -1 && tabela === "Aulas" && (reg.tipo || "Regular") === "Regular") {
    i = lista.findIndex((r) => r.matriculaId === reg.matriculaId && r.data === reg.data && (r.tipo || "Regular") === "Regular");
  }
  if (i >= 0) {
    const final = { ...reg, id: lista[i].id };
    lista[i] = final;
    return final;
  }
  const final = { ...reg, id: reg.id || novoId(PREF[tabela]) };
  lista.push(final);
  return final;
}

const REFS = {
  Alunos: [["matriculas", "alunoId"], ["pontos", "alunoId"]],
  Cursos: [["matriculas", "cursoId"], ["modulos", "cursoId"], ["escala", "cursoId"]],
  Professores: [["escala", "professorId"]],
  Modulos: [["progresso", "moduloId"]],
  Matriculas: [["aulas", "matriculaId"], ["progresso", "matriculaId"]],
};

const demo = {
  carregar: async () => {
    const db = ler();
    return { ok: true, eu: { email: "demo@escola.local", nome: "Modo demonstração", perfil: "Admin" }, dados: db.dados, config: db.config };
  },
  salvar: async (t, tabela, registro) => {
    const db = ler();
    const salvo = upsert(db, tabela, registro);
    gravar(db);
    return { ok: true, id: salvo.id, registro: salvo };
  },
  excluir: async (t, tabela, id) => {
    const db = ler();
    (REFS[tabela] || []).forEach(([chave, campo]) => {
      if (db.dados[chave].some((r) => r[campo] === id)) throw erro("Não dá para excluir: há registros ligados a este item. Desative ou encerre em vez de excluir.", "REFERENCIA");
    });
    db.dados[CHAVE[tabela]] = db.dados[CHAVE[tabela]].filter((r) => r.id !== id);
    gravar(db);
    return { ok: true };
  },
  concluirModulo: async (t, matriculaId, opts = {}) => {
    const db = ler();
    const d = db.dados;
    const mat = d.matriculas.find((m) => m.id === matriculaId);
    if (!mat || mat.status !== "Ativa") throw erro("Só é possível concluir módulos de matrículas ativas.");
    const mods = d.modulos.filter((m) => m.cursoId === mat.cursoId).sort((a, b) => a.ordem - b.ordem);
    const atual = mods.find((m) => Number(m.ordem) === Number(mat.moduloAtual));
    if (!atual) throw erro("O módulo atual não existe no curso.");
    if (d.progresso.some((p) => p.matriculaId === mat.id && p.moduloId === atual.id)) throw erro("Este módulo já foi concluído.");
    const curso = d.cursos.find((c) => c.id === mat.cursoId);
    const hoje = hojeIso();
    const obsTexto = (opts && opts.obs) || "";
    const notaMod = opts && opts.nota !== undefined && opts.nota !== "" && opts.nota !== null ? Number(String(opts.nota).replace(",", ".")) : "";
    if (notaMod !== "" && (!Number.isFinite(notaMod) || notaMod < 0 || notaMod > 10)) throw erro("A nota deve estar entre 0 e 10.");
    const progresso = upsert(db, "Progresso", { matriculaId: mat.id, moduloId: atual.id, concluidoEm: hoje, obs: obsTexto, nota: notaMod });
    const base = Number(atual.pontos !== null && atual.pontos !== "" && atual.pontos !== undefined ? atual.pontos : (db.config.pontosPadrao || 10));
    const pts = base + (opts && opts.bomComportamento ? BONUS_BOM_COMPORTAMENTO : 0);
    let pontos = null;
    if (pts > 0 && db.config.recursoPontos !== false && !d.pontos.some((p) => p.alunoId === mat.alunoId && p.moduloId === atual.id && p.tipo === "Ganho (módulo)")) {
      pontos = upsert(db, "Pontos", { data: hoje, alunoId: mat.alunoId, tipo: "Ganho (módulo)", pontos: pts, descricao: `Concluiu o módulo ${atual.ordem} de ${curso ? curso.nome : ""}${opts && opts.bomComportamento ? " (bom comportamento)" : ""}`, moduloId: atual.id, registradoPor: "demo@escola.local" });
    }
    const proximo = mods.find((m) => Number(m.ordem) > Number(atual.ordem));
    const novaMat = { ...mat, ...(proximo ? { moduloAtual: proximo.ordem } : { status: "Concluída" }) };
    upsert(db, "Matriculas", novaMat);
    gravar(db);
    const mudancas = { matriculas: [novaMat], progresso: [progresso] };
    if (pontos) mudancas.pontos = [pontos];
    if (!proximo) mudancas.movimentacoes = [upsert(db, "Movimentacoes", { data: hoje, alunoId: mat.alunoId, matriculaId: mat.id, tipo: "Conclusão", motivo: "Concluiu todos os módulos", obs: "", registradoPor: "demo@escola.local" })];
    gravar(db);
    return { ok: true, mudancas, pontosGanhos: pontos ? pts : 0, concluiuCurso: !proximo };
  },
  movimentar: async (t, f) => {
    const db = ler();
    const NOVO = { "Saída": "Saiu", Trancamento: "Trancada", Retorno: "Ativa" };
    if (!NOVO[f.tipo]) throw erro("Movimentação inválida.");
    const ids = f.matriculaIds || [];
    if (!ids.length) throw erro("Escolha pelo menos uma matrícula.");
    if (f.tipo === "Saída" && !String(f.motivo || "").trim()) throw erro("Informe o motivo da saída.");
    const matriculas = [];
    const movimentacoes = [];
    ids.forEach((id) => {
      const mat = db.dados.matriculas.find((m) => m.id === id);
      if (!mat) throw erro("Matrícula não encontrada.");
      const permitidos = f.tipo === "Retorno" ? ["Saiu", "Trancada"] : ["Ativa", "Trancada"];
      if (!permitidos.includes(mat.status)) throw erro(`A matrícula está com a situação "${mat.status}" e não pode receber essa movimentação.`);
      const nova = { ...mat, status: NOVO[f.tipo] };
      upsert(db, "Matriculas", nova);
      matriculas.push(nova);
      movimentacoes.push(upsert(db, "Movimentacoes", { data: f.data || hojeIso(), alunoId: mat.alunoId, matriculaId: mat.id, tipo: f.tipo, motivo: String(f.motivo || "").trim(), obs: String(f.obs || "").trim(), registradoPor: "demo@escola.local" }));
    });
    const alunos = [];
    [...new Set(matriculas.map((m) => m.alunoId))].forEach((alunoId) => {
      const aluno = db.dados.alunos.find((x) => x.id === alunoId);
      if (!aluno) return;
      const resta = db.dados.matriculas.some((m) => m.alunoId === alunoId && ["Ativa", "Trancada", "Experimental"].includes(m.status));
      const ativo = resta ? "Sim" : "Não";
      if (aluno.ativo !== ativo) alunos.push(upsert(db, "Alunos", { ...aluno, ativo }));
    });
    gravar(db);
    return { ok: true, mudancas: { matriculas, movimentacoes, alunos } };
  },
  notaModulo: async (t, f) => {
    const db = ler();
    const mat = db.dados.matriculas.find((m) => m.id === f.matriculaId);
    if (!mat) throw erro("Matrícula não encontrada.");
    const modulo = db.dados.modulos.find((m) => m.id === f.moduloId && m.cursoId === mat.cursoId);
    if (!modulo) throw erro("Módulo não encontrado neste curso.");
    const nota = f.nota === "" || f.nota === null || f.nota === undefined ? "" : Number(String(f.nota).replace(",", "."));
    if (nota !== "" && (!Number.isFinite(nota) || nota < 0 || nota > 10)) throw erro("A nota deve estar entre 0 e 10.");
    if (!db.dados.progresso) db.dados.progresso = [];
    const existente = db.dados.progresso.find((p) => p.matriculaId === mat.id && p.moduloId === modulo.id);
    if (!existente && !(mat.status === "Concluída" || Number(modulo.ordem) < Number(mat.moduloAtual))) throw erro("Só dá para dar nota a módulos já concluídos.");
    const reg = upsert(db, "Progresso", { id: existente ? existente.id : undefined, matriculaId: mat.id, moduloId: modulo.id, concluidoEm: existente ? existente.concluidoEm : f.data || hojeIso(), obs: existente ? existente.obs : "", nota });
    gravar(db);
    return { ok: true, mudancas: { progresso: [reg] } };
  },
  avaliacaoFinal: async (t, f) => {
    const db = ler();
    const mat = db.dados.matriculas.find((m) => m.id === f.matriculaId);
    if (!mat) throw erro("Matrícula não encontrada.");
    if (!["Ativa", "Concluída"].includes(mat.status)) throw erro("A avaliação final é para matrículas ativas ou concluídas.");
    const nota = f.nota === "" || f.nota === null || f.nota === undefined ? "" : Number(f.nota);
    if (nota !== "" && (!Number.isFinite(nota) || nota < 0 || nota > 10)) throw erro("A nota deve estar entre 0 e 10.");
    if (!f.conceito) throw erro("Escolha o conceito.");
    if (!db.dados.avaliacoes) db.dados.avaliacoes = [];
    const existente = db.dados.avaliacoes.find((a) => a.matriculaId === mat.id && a.tipo === "Final");
    const avaliacao = upsert(db, "Avaliacoes", { id: existente ? existente.id : undefined, matriculaId: mat.id, tipo: "Final", data: f.data || hojeIso(), conceito: f.conceito, nota, comentario: String(f.comentario || "").trim(), professorId: f.professorId || "" });
    const mudancas = { avaliacoes: [avaliacao] };
    if (f.concluir && mat.status === "Ativa") {
      const nova = { ...mat, status: "Concluída" };
      upsert(db, "Matriculas", nova);
      mudancas.matriculas = [nova];
      mudancas.movimentacoes = [upsert(db, "Movimentacoes", { data: f.data || hojeIso(), alunoId: mat.alunoId, matriculaId: mat.id, tipo: "Conclusão", motivo: "Avaliação final", obs: "", registradoPor: "demo@escola.local" })];
    }
    gravar(db);
    return { ok: true, mudancas };
  },
  resgatar: async (t, alunoId, premioId) => {
    const db = ler();
    const premio = db.dados.premios.find((p) => p.id === premioId);
    if (!premio || premio.ativo === "Não") throw erro("Prêmio não disponível.");
    const saldo = saldoDePontos(db.dados.pontos, alunoId);
    if (saldo < Number(premio.custo)) throw erro(`Saldo insuficiente: ${saldo} ponto(s), o prêmio custa ${premio.custo}.`);
    const reg = upsert(db, "Pontos", { data: hojeIso(), alunoId, tipo: "Resgate", pontos: Number(premio.custo), descricao: `Resgate: ${premio.nome}`, moduloId: "", registradoPor: "demo@escola.local" });
    gravar(db);
    return { ok: true, mudancas: { pontos: [reg] } };
  },
  entrar: async (googleToken) => ({ ok: true, sessao: googleToken }),
  sair: async () => ({ ok: true }),
  salvarConfig: async (t, config) => {
    const db = ler();
    db.config = { ...db.config, ...config };
    gravar(db);
    return { ok: true, config: db.config };
  },
  criarExperimental: async (t, f) => {
    const db = ler();
    if (!f.nome || !f.nome.trim()) throw erro("Informe o nome do aluno.");
    const aluno = upsert(db, "Alunos", { nome: f.nome.trim(), responsavel: "", contato: f.contato || "", ativo: "Não", obs: "Aula experimental" });
    const mat = upsert(db, "Matriculas", { alunoId: aluno.id, cursoId: f.cursoId, dia: siglaDia(f.data), inicio: f.hora, duracao: 60, modalidade: f.modalidade === "Online" ? "Online" : "Presencial", moduloAtual: 1, dataInicio: f.data, status: "Experimental", obs: "" });
    const aula = upsert(db, "Aulas", { data: f.data, matriculaId: mat.id, status: "", tipo: "Experimental", hora: f.hora, modalidade: "", modulo: 1, reposicaoDe: "", obs: "", professorId: f.professorId || "" });
    gravar(db);
    return { ok: true, mudancas: { alunos: [aluno], matriculas: [mat], aulas: [aula] } };
  },
};

export default isDemo ? demo : remoto;
