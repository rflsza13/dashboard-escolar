export const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DIAS_GRADE = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const INTERVALOS_GRADE = [
  '09:00 - 10:30',
  '10:30 - 12:00',
  '14:00 - 15:30',
  '16:00 - 17:30',
  '18:00 - 19:30',
  '19:00 - 20:30',
];
// Duração fixa das aulas: regulares/reposições/avulsas 1h30, experimentais 1h
export const DURACAO_AULA = 90;
export const DURACAO_EXPERIMENTAL = 60;
export const duracaoDaAula = (tipo) => (tipo === "Experimental" ? DURACAO_EXPERIMENTAL : DURACAO_AULA);

export const DIAS_LONGOS = { Seg: "Segunda", Ter: "Terça", Qua: "Quarta", Qui: "Quinta", Sex: "Sexta", Sáb: "Sábado", Dom: "Domingo" };

export const DEFAULT_CONFIG = {
  nomeEscola: "Escola",
  pontosPadrao: 10,
  rankingDias: 90,
  gradeInicio: 7,
  gradeFim: 21,
  corOnline: "#2CD9FF",
  corReposicao: "#FF8A3D",
  corExperimental: "#FFD93D",
  recursoPontos: true,
  recursoProfessores: true,
  recursoExperimentais: true,
  recursoAvaliacoes: true,
  recursoAlertas: true,
  recursoMigracao: false,
  recursoFeriados: true,
  recursoIngles: true,
  riscoFaltasSeguidas: 3,
  riscoReposicoes: 2,
};

// Bônus de pontos do "bom comportamento" ao concluir um módulo (o servidor usa o mesmo valor)
export const BONUS_BOM_COMPORTAMENTO = 10;

// Funcionalidades que podem ser ligadas/desligadas em Configurações (gravadas na aba Config como Sim/Não)
export const RECURSOS = [
  { chave: "recursoPontos", rotulo: "Pontos e recompensas", ajuda: "Menu Pontos e prêmios, pontos nas fichas, nos módulos e na conclusão de módulo." },
  { chave: "recursoProfessores", rotulo: "Professores e escala", ajuda: "Menu Professores, nomes dos professores nas aulas e escala do dia no dashboard." },
  { chave: "recursoExperimentais", rotulo: "Aulas experimentais", ajuda: "Opção de cadastrar aula experimental em Nova aula." },
  { chave: "recursoAvaliacoes", rotulo: "Avaliações (notas e avaliação final)", ajuda: "Nota de cada módulo, avaliação final do curso, ficha do aluno e boletim." },
  { chave: "recursoMigracao", rotulo: "Saldo do sistema anterior (migração)", ajuda: "Mostra na ficha do aluno os contadores para lançar presenças, faltas e reposições pendentes do sistema antigo. Desligado, o bloco some, mas o que já foi lançado continua somando." },
  { chave: "recursoFeriados", rotulo: "Feriados e férias", ajuda: "Tira as aulas regulares dos feriados nacionais, dos dias cadastrados e dos períodos de férias de Configurações." },
  { chave: "recursoIngles", rotulo: "Curso de inglês", ajuda: "Desligado, esconde tudo do inglês (cursos, alunos, aulas, escala e a aba Inglês da grade). Os dados continuam salvos e voltam ao religar." },
  { chave: "recursoAlertas", rotulo: "Alertas de risco de evasão", ajuda: "Card Alunos em risco no dashboard e marcação na lista e na ficha do aluno." },
];
export function recursoLigado(cfg, chave) {
  const v = cfg ? cfg[chave] : undefined;
  if (v === undefined || v === null || v === "") return chave in DEFAULT_CONFIG ? DEFAULT_CONFIG[chave] !== false : true;
  if (typeof v === "boolean") return v;
  return !["não", "nao", "false", "0", "n"].includes(String(v).trim().toLowerCase());
}

const p2 = (n) => String(n).padStart(2, "0");

/* ---------- datas (sempre em ISO "AAAA-MM-DD", no fuso local) ---------- */
export const isoDe = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const dataDeIso = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const hojeIso = () => isoDe(new Date());
export const somarDias = (iso, n) => {
  const d = dataDeIso(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
};
export const segundaDaSemana = (iso) => {
  const d = dataDeIso(iso);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return isoDe(d);
};
export const siglaDia = (iso) => DIAS[dataDeIso(iso).getDay()];
export const formatarData = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};
export const formatarDataCurta = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}` : "";
};

/* ---------- horas ("HH:MM") ---------- */
export const horaParaMin = (h) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(h || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};
export const minParaHora = (min) => `${p2(Math.floor(min / 60) % 24)}:${p2(min % 60)}`;
export const fimDaAula = (hora, duracao) => {
  const ini = horaParaMin(hora);
  return ini < 0 ? "" : minParaHora(ini + (Number(duracao) || DURACAO_AULA));
};

// Faixa da grade em que uma aula que começa em "hora" aparece: a faixa que contém o início
// (se duas contêm, vale a que começa mais tarde, ex.: 19:00 → 19:00-20:30); senão, a de início mais próximo.
export function faixaDaAula(hora) {
  const min = horaParaMin(hora);
  if (min < 0) return INTERVALOS_GRADE[0];
  let melhor = null;
  let melhorIni = -1;
  INTERVALOS_GRADE.forEach((faixa) => {
    const [a, b] = faixa.split(" - ");
    const ini = horaParaMin(a);
    if (min >= ini && min < horaParaMin(b) && ini > melhorIni) {
      melhor = faixa;
      melhorIni = ini;
    }
  });
  if (melhor) return melhor;
  let menor = Infinity;
  INTERVALOS_GRADE.forEach((faixa) => {
    const dif = Math.abs(min - horaParaMin(faixa.split(" - ")[0]));
    if (dif < menor) {
      menor = dif;
      melhor = faixa;
    }
  });
  return melhor;
}

export const novoId = (prefixo) => prefixo + Math.random().toString(36).slice(2, 8).toUpperCase();
export const corValida = (c, fallback = "#8A8A8A") => (/^#[0-9a-fA-F]{6}$/.test(c || "") ? c : fallback);
const mapa = (lista) => (lista || []).reduce((acc, x) => ({ ...acc, [x.id]: x }), {});

/* ---------- cursos: tipo (cor/legenda) e área (filtro da grade e professores) ----------
   Tipos: Programação, Robótica 1, Robótica 2 e Inglês (definidos pelo nome do curso; qualquer outro
   curso conta como Programação). Cada tipo tem uma entrada na legenda, com a cor do primeiro curso do tipo.
   Áreas: "Inglês" ou "Programação" (que reúne Programação e as Robóticas). O seletor da grade e a
   escala dos professores usam a área. */
export const CAT_PROGRAMACAO = "Programação";
export const CAT_INGLES = "Inglês";
export const CATEGORIAS = [CAT_PROGRAMACAO, CAT_INGLES];
export const ROTULO_CATEGORIA = { [CAT_PROGRAMACAO]: "Programação / Robótica", [CAT_INGLES]: "Inglês" };
// Na escala, a coluna cursoId guarda a área escolhida no formato "area:Programação" / "area:Inglês"
// (horários antigos ainda podem trazer o ID de um curso; a área vem do curso).
export const PREFIXO_AREA = "area:";
export const valorDeArea = (area) => `${PREFIXO_AREA}${area}`;
export function areaDaEscala(cursoId, cursos) {
  const v = String(cursoId || "");
  if (v.startsWith(PREFIXO_AREA)) {
    const a = v.slice(PREFIXO_AREA.length);
    return CATEGORIAS.includes(a) ? a : "";
  }
  const c = (cursos || {})[v];
  return c ? categoriaDoCurso(c) : "";
}

export const TIPOS_CURSO = ["Programação", "Robótica 1", "Robótica 2", "Inglês"];

export function tipoDoCurso(c) {
  const txt = `${(c && c.nome) || ""} ${(c && c.grupo) || ""}`.toLowerCase();
  if (/ingl[eê]s|english/.test(txt)) return "Inglês";
  if (/rob[oó]tica/.test(txt)) return /(^|\D)2(\D|$)|\bii\b/.test(txt.replace(/rob[oó]tica/, "")) ? "Robótica 2" : "Robótica 1";
  return "Programação";
}

export const categoriaDoCurso = (c) => (tipoDoCurso(c) === "Inglês" ? CAT_INGLES : CAT_PROGRAMACAO);

export function cursosComCor(cursos) {
  const lista = cursos || [];
  const corDoTipo = {};
  lista.forEach((c) => {
    const k = tipoDoCurso(c);
    if (!corDoTipo[k] && /^#[0-9a-fA-F]{6}$/.test(c.cor || "")) corDoTipo[k] = c.cor;
  });
  return lista.map((c) => {
    const k = tipoDoCurso(c);
    return { ...c, tipo: k, categoria: categoriaDoCurso(c), cor: corValida(corDoTipo[k] || c.cor) };
  });
}

export function legendaDeCursos(cursos) {
  const ativos = cursosComCor(cursos).filter((c) => c.ativo !== "Não");
  return TIPOS_CURSO.map((k) => ({ chave: k, rotulo: k, cor: (ativos.find((c) => c.tipo === k) || {}).cor })).filter((l) => l.cor);
}

/* ---------- professores: escala semanal ---------- */
export function blocosDaEscala(dados, cursosCor) {
  const profs = mapa(dados.professores);
  const cursos = mapa(cursosCor || cursosComCor(dados.cursos));
  const base = (dados.escala || [])
    .map((b) => {
      const professor = profs[b.professorId];
      if (!professor || professor.ativo === "Não") return null;
      const categoria = areaDaEscala(b.cursoId, cursos);
      return { ...b, professor, iniMin: horaParaMin(b.inicio), fimMin: horaParaMin(b.fim), categoria };
    })
    .filter((b) => b && b.iniMin >= 0 && b.fimMin > b.iniMin);
  // horário sem curso: vale para as categorias dos outros horários do mesmo professor (não para todas)
  const catsDoProf = {};
  base.forEach((b) => {
    if (b.categoria) catsDoProf[b.professorId] = [...new Set([...(catsDoProf[b.professorId] || []), b.categoria])];
  });
  return base.map((b) => ({ ...b, categorias: b.categoria ? [b.categoria] : catsDoProf[b.professorId] || CATEGORIAS }));
}

// nomes dos professores cuja escala cobre o dia/hora e a categoria do curso (Programação ou Inglês)
export function professoresNoHorario(blocos, dia, hora, curso) {
  const min = horaParaMin(hora);
  if (min < 0) return [];
  const cat = categoriaDoCurso(curso);
  const nomes = [];
  blocos.forEach((b) => {
    if (b.dia !== dia || min < b.iniMin || min >= b.fimMin) return;
    if (!b.categorias.includes(cat)) return;
    if (!nomes.includes(b.professor.nome)) nomes.push(b.professor.nome);
  });
  return nomes;
}

// quem atende num dia (para o dashboard): [{ professor, faixas: [{ inicio, fim, curso }] }]
export function escalaDoDia(dados, iso) {
  const dia = siglaDia(iso);
  const por = {};
  blocosDaEscala(dados).forEach((b) => {
    if (b.dia !== dia) return;
    if (!por[b.professor.id]) por[b.professor.id] = { professor: b.professor, faixas: [] };
    por[b.professor.id].faixas.push({ inicio: b.inicio, fim: b.fim, ini: b.iniMin, curso: b.categoria ? ROTULO_CATEGORIA[b.categoria] : "" });
  });
  return Object.values(por)
    .map((x) => ({ ...x, faixas: x.faixas.sort((a, b) => a.ini - b.ini) }))
    .sort((a, b) => a.faixas[0].ini - b.faixas[0].ini || a.professor.nome.localeCompare(b.professor.nome, "pt-BR"));
}

/* ---------- status ---------- */
export const ehPresenca = (s) => s === "Presente" || s === "Reposição realizada";
export const ehFalta = (s) => s === "Falta";
export const marcada = (s) => ehPresenca(s) || ehFalta(s);

/* ---------- sessões (aulas num período) ----------
   Uma sessão é uma aula numa data. Vem de duas fontes:
   - linhas da aba Aulas (qualquer tipo): têm status e podem ter hora própria;
   - matrículas Ativas, que se repetem toda semana no mesmo dia/horário (status "Agendada"
     enquanto ninguém registrar nada). */
function criarSessao(m, aula, data, tipo, cfg, alunos, cursos, blocos, profs) {
  const aluno = alunos[m.alunoId];
  const curso = cursos[m.cursoId];
  const modalidade = (aula && aula.modalidade) || m.modalidade || "Presencial";
  let status = (aula && aula.status) || "Agendada";
  if (tipo === "Reposição" && status === "Agendada") status = "Reposição agendada";
  let cor = corValida(curso && curso.cor);
  const tags = [];
  if (tipo === "Experimental") tags.push("Experimental");
  if (tipo === "Reposição") tags.push("Reposição");
  if (tipo === "Avulsa") tags.push("Avulsa");
  if (modalidade === "Online") tags.push("Online");
  // cores fixas têm prioridade sobre a cor do curso: experimental > reposição > online
  if (tipo === "Experimental") cor = corValida(cfg.corExperimental, "#FFD93D");
  else if (tipo === "Reposição") cor = corValida(cfg.corReposicao, "#FF8A3D");
  else if (modalidade === "Online") cor = corValida(cfg.corOnline, "#2CD9FF");
  const hora = (aula && aula.hora) || m.inicio || "";
  return {
    chave: `${m.id}|${data}|${tipo}|${(aula && aula.id) || "x"}`,
    data,
    hora,
    // aula experimental: vale o professor responsável escolhido no cadastro; as demais seguem a escala da grade
    cancelada: !!(aula && aula.status === "Cancelada"),
    professorId: (aula && aula.professorId) || "",
    professores: !recursoLigado(cfg, "recursoProfessores")
      ? []
      : tipo === "Experimental" && aula && aula.professorId && profs[aula.professorId]
      ? [profs[aula.professorId].nome]
      : professoresNoHorario(blocos, siglaDia(data), hora, curso),
    duracao: duracaoDaAula(tipo),
    categoria: categoriaDoCurso(curso),
    matriculaId: m.id,
    alunoId: m.alunoId,
    aluno: aluno ? aluno.nome : "Aluno removido",
    cursoId: m.cursoId,
    curso: curso ? curso.nome : "Curso removido",
    modalidade,
    tipo,
    status,
    aulaId: aula ? aula.id : null,
    moduloOrdem: (aula && aula.modulo) || m.moduloAtual || "",
    reposicaoDe: (aula && aula.reposicaoDe) || "",
    obs: (aula && aula.obs) || "",
    cor,
    tags,
  };
}

export function montarSessoes(dados, deIso, ateIso, opcoes = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...(dados.config || {}) };
  const alunos = mapa(dados.alunos);
  const cursosCor = cursosComCor(dados.cursos);
  const cursos = mapa(cursosCor);
  const blocos = blocosDaEscala(dados, cursosCor);
  const profs = mapa(dados.professores);
  const mats = mapa(dados.matriculas);
  const sessoes = [];
  const cobertas = new Set();

  (dados.aulas || []).forEach((a) => {
    if (!a.data || a.data < deIso || a.data > ateIso) return;
    const m = mats[a.matriculaId];
    if (!m) return;
    const tipo = a.tipo || "Regular";
    if (tipo === "Regular") cobertas.add(`${a.matriculaId}|${a.data}`);
    sessoes.push(criarSessao(m, a, a.data, tipo, cfg, alunos, cursos, blocos, profs));
  });

  for (let d = deIso; d <= ateIso; d = somarDias(d, 1)) {
    // feriado: as aulas regulares do dia não são geradas (aulas avulsas, reposições e experimentais já cadastradas continuam)
    if (feriadoDaData(dados, d)) continue;
    const sigla = siglaDia(d);
    (dados.matriculas || []).forEach((m) => {
      if (m.status !== "Ativa" || m.dia !== sigla) return;
      if (m.dataInicio && d < m.dataInicio) return;
      if (cobertas.has(`${m.id}|${d}`)) return;
      sessoes.push(criarSessao(m, null, d, "Regular", cfg, alunos, cursos, blocos, profs));
    });
  }

  return sessoes
    .filter((s) => opcoes.comCanceladas || !s.cancelada)
    .sort((a, b) => a.data.localeCompare(b.data) || horaParaMin(a.hora) - horaParaMin(b.hora) || a.aluno.localeCompare(b.aluno, "pt-BR"));
}

/* ---------- indicadores ---------- */
export function andamentoPorCurso(sessoes) {
  const grupos = {};
  sessoes.forEach((s) => {
    if (!grupos[s.cursoId]) grupos[s.cursoId] = { cursoId: s.cursoId, curso: s.curso, total: 0, marcadas: 0, presentes: 0, faltas: 0, sessoes: [] };
    const g = grupos[s.cursoId];
    g.total += 1;
    if (marcada(s.status)) g.marcadas += 1;
    if (ehPresenca(s.status)) g.presentes += 1;
    if (ehFalta(s.status)) g.faltas += 1;
    g.sessoes.push(s);
  });
  return Object.values(grupos).sort((a, b) => horaParaMin(a.sessoes[0].hora) - horaParaMin(b.sessoes[0].hora));
}

export function rankingFaltas(dados, hoje, dias, limite = 8) {
  const de = somarDias(hoje, -dias);
  const mats = mapa(dados.matriculas);
  const alunos = mapa(dados.alunos);
  const porAluno = {};
  (dados.aulas || []).forEach((a) => {
    if (!a.data || a.data < de || a.data > hoje || !marcada(a.status)) return;
    const m = mats[a.matriculaId];
    if (!m) return;
    if (!porAluno[m.alunoId]) porAluno[m.alunoId] = { alunoId: m.alunoId, nome: (alunos[m.alunoId] || {}).nome || "Aluno removido", faltas: 0, total: 0 };
    porAluno[m.alunoId].total += 1;
    if (ehFalta(a.status)) porAluno[m.alunoId].faltas += 1;
  });
  return Object.values(porAluno)
    .filter((x) => x.faltas > 0)
    .map((x) => ({ ...x, pct: x.total ? x.faltas / x.total : 0 }))
    .sort((a, b) => b.faltas - a.faltas || b.pct - a.pct)
    .slice(0, limite);
}

export function faltasSemReposicao(dados, hoje, dias = 60) {
  const de = somarDias(hoje, -dias);
  const comReposicao = new Set((dados.aulas || []).filter((a) => a.reposicaoDe).map((a) => a.reposicaoDe));
  return (dados.aulas || []).filter(
    (a) => ehFalta(a.status) && a.data >= de && a.data <= hoje && (a.tipo || "Regular") !== "Reposição" && !comReposicao.has(a.id)
  );
}

export function saldoDePontos(pontos, alunoId) {
  return (pontos || []).reduce((acc, p) => {
    if (p.alunoId !== alunoId) return acc;
    return acc + (p.tipo === "Resgate" ? -Number(p.pontos) : Number(p.pontos));
  }, 0);
}

/* ---------- andamento do aluno ---------- */
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function indexarAulas(dados) {
  const idx = {};
  (dados.aulas || []).forEach((a) => {
    if (!idx[a.matriculaId]) idx[a.matriculaId] = [];
    idx[a.matriculaId].push(a);
  });
  return idx;
}

// Estado de cada módulo do curso para uma matrícula: concluído, atual ou pendente
export function progressoMatricula(dados, mat) {
  const modulos = (dados.modulos || []).filter((m) => m.cursoId === mat.cursoId).sort((a, b) => a.ordem - b.ordem);
  const prog = (dados.progresso || []).filter((p) => p.matriculaId === mat.id);
  const itens = modulos.map((modulo) => {
    const reg = prog.find((p) => p.moduloId === modulo.id);
    const concluido = !!reg || Number(modulo.ordem) < Number(mat.moduloAtual) || mat.status === "Concluída";
    const estado = concluido ? "concluido" : Number(modulo.ordem) === Number(mat.moduloAtual) ? "atual" : "pendente";
    const nota = reg && reg.nota !== "" && reg.nota !== null && reg.nota !== undefined && Number.isFinite(Number(reg.nota)) ? Number(reg.nota) : null;
    return { modulo, estado, data: reg ? reg.concluidoEm : "", nota, temRegistro: !!reg };
  });
  const concluidos = itens.filter((i) => i.estado === "concluido").length;
  const notas = itens.filter((i) => i.nota !== null).map((i) => i.nota);
  return {
    itens,
    concluidos,
    media: notas.length ? notas.reduce((t, n) => t + n, 0) / notas.length : null,
    total: itens.length,
    pct: itens.length ? concluidos / itens.length : 0,
    atual: itens.find((i) => i.estado === "atual") || null,
  };
}

export function resumoAluno(dados, alunoId, idx) {
  const cursos = mapa(cursosComCor(dados.cursos));
  const mats = (dados.matriculas || []).filter((m) => m.alunoId === alunoId);
  let presencas = 0;
  let faltas = 0;
  let reposicoes = 0;
  const aulas = [];
  // saldo do sistema anterior (aba Migracao): soma às presenças/faltas lançadas aqui e às reposições pendentes
  const idsMat = new Set(mats.map((m) => m.id));
  const migrado = (dados.migracao || [])
    .filter((x) => idsMat.has(x.matriculaId))
    .reduce(
      (t, x) => ({
        presencas: t.presencas + (Number(x.presencas) || 0),
        faltas: t.faltas + (Number(x.faltas) || 0),
        reposicoesPendentes: t.reposicoesPendentes + (Number(x.reposicoesPendentes) || 0),
      }),
      { presencas: 0, faltas: 0, reposicoesPendentes: 0 }
    );
  mats.forEach((m) =>
    (idx[m.id] || []).forEach((a) => {
      aulas.push(a);
      if (ehPresenca(a.status)) presencas += 1;
      if (ehFalta(a.status)) faltas += 1;
      if (a.status === "Reposição realizada") reposicoes += 1;
    })
  );
  const comReposicao = new Set((dados.aulas || []).filter((a) => a.reposicaoDe).map((a) => a.reposicaoDe));
  const faltasSemRep = aulas.filter((a) => ehFalta(a.status) && (a.tipo || "Regular") !== "Reposição" && !comReposicao.has(a.id)).length;
  // reposição marcada sem falta de origem (ex.: falta do sistema anterior) abate o saldo pendente lançado em Migracao
  const reposSemOrigem = aulas.filter((a) => (a.tipo || "Regular") === "Reposição" && !a.reposicaoDe && a.status !== "Cancelada").length;
  const migradoPendente = Math.max(0, migrado.reposicoesPendentes - reposSemOrigem);
  presencas += migrado.presencas;
  faltas += migrado.faltas;
  const marcadas = presencas + faltas;
  return {
    migrado,
    reposicoesPendentes: faltasSemRep + migradoPendente,
    matriculas: mats.map((m) => ({ matricula: m, curso: cursos[m.cursoId] || { nome: "Curso removido", cor: "#E3242B" }, progresso: progressoMatricula(dados, m) })),
    aulas,
    presencas,
    faltas,
    reposicoes,
    pctPresenca: marcadas ? presencas / marcadas : null,
    saldo: saldoDePontos(dados.pontos, alunoId),
  };
}

export function serieMensal(aulas, meses = 12) {
  const por = {};
  aulas.forEach((a) => {
    if (!a.data || !marcada(a.status)) return;
    const k = a.data.slice(0, 7);
    if (!por[k]) por[k] = { presencas: 0, faltas: 0 };
    if (ehPresenca(a.status)) por[k].presencas += 1;
    else por[k].faltas += 1;
  });
  const chaves = Object.keys(por).sort().slice(-meses);
  return {
    labels: chaves.map((k) => `${MESES_CURTOS[Number(k.slice(5, 7)) - 1]}/${k.slice(2, 4)}`),
    presencas: chaves.map((k) => por[k].presencas),
    faltas: chaves.map((k) => por[k].faltas),
  };
}

export function frequenciaAcumulada(aulas) {
  const marcadas = aulas.filter((a) => a.data && marcada(a.status)).sort((a, b) => a.data.localeCompare(b.data));
  let pres = 0;
  const labels = [];
  const valores = [];
  marcadas.forEach((a, i) => {
    if (ehPresenca(a.status)) pres += 1;
    labels.push(formatarDataCurta(a.data));
    valores.push(Math.round((pres / (i + 1)) * 100));
  });
  return { labels, valores };
}

/* ---------- fases dos cursos ---------- */
export const faseDoModulo = (m) => String((m && m.fase) || "").trim();

// fases do curso na ordem em que aparecem nos módulos (vazio se o curso não usa fases)
export function fasesDoCurso(modulos, cursoId) {
  const lista = (modulos || []).filter((m) => m.cursoId === cursoId).sort((a, b) => Number(a.ordem) - Number(b.ordem));
  const fases = [];
  lista.forEach((m) => {
    const f = faseDoModulo(m);
    if (f && !fases.includes(f)) fases.push(f);
  });
  return fases;
}

// "Fase 2 · módulo 3 de 6" (curso com fases) ou "módulo 5 de 12" (sem fases)
export function descricaoModulo(modulosDoCurso, m) {
  if (!m) return "";
  const todos = [...(modulosDoCurso || [])].sort((a, b) => Number(a.ordem) - Number(b.ordem));
  const fase = faseDoModulo(m);
  if (!fase) return `módulo ${m.ordem} de ${todos.length}`;
  const daFase = todos.filter((x) => faseDoModulo(x) === fase);
  const pos = daFase.findIndex((x) => x.id === m.id) + 1;
  return `${fase} · módulo ${pos || m.ordem} de ${daFase.length}`;
}

/* ---------- saída, trancamento e histórico ---------- */
export const MOTIVOS_SAIDA = ["Mudança de cidade", "Financeiro", "Horário incompatível", "Insatisfação", "Foi para outra escola", "Outro"];
export const CONCEITOS = ["Excelente", "Muito bom", "Bom", "Regular", "Precisa melhorar"];

export const rotuloSituacao = (status) => (status === "Saiu" ? "Saiu" : status === "Trancada" ? "Trancada" : status === "Concluída" ? "Concluída" : status === "Experimental" ? "Experimental" : "Ativa");

/* ---------- alertas de risco de evasão ---------- */
// Um aluno entra em risco com N faltas seguidas (sem presença no meio) ou M reposições pendentes.
export function alertasDeRisco(dados, cfg) {
  const limFaltas = Number(cfg && cfg.riscoFaltasSeguidas) || 3;
  const limRep = Number(cfg && cfg.riscoReposicoes) || 2;
  const idx = indexarAulas(dados);
  const cursos = mapa(dados.cursos);
  const alunos = mapa(dados.alunos);
  const ids = [...new Set((dados.matriculas || []).filter((m) => m.status === "Ativa").map((m) => m.alunoId))];
  const lista = [];
  ids.forEach((alunoId) => {
    const aluno = alunos[alunoId];
    if (!aluno) return;
    const motivos = [];
    (dados.matriculas || [])
      .filter((m) => m.alunoId === alunoId && m.status === "Ativa")
      .forEach((m) => {
        const marcadas = (idx[m.id] || [])
          .filter((a) => (a.tipo || "Regular") !== "Experimental" && ["Presente", "Falta", "Reposição realizada"].includes(a.status))
          .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
        let seguidas = 0;
        for (let i = 0; i < marcadas.length && ehFalta(marcadas[i].status); i += 1) seguidas += 1;
        if (seguidas >= limFaltas) motivos.push(`${seguidas} faltas seguidas em ${(cursos[m.cursoId] || {}).nome || "curso"}`);
      });
    const pendentes = resumoAluno(dados, alunoId, idx).reposicoesPendentes;
    if (pendentes >= limRep) motivos.push(`${pendentes} reposições pendentes`);
    if (motivos.length) lista.push({ aluno, motivos, nivel: motivos.length > 1 ? "alto" : "medio" });
  });
  return lista.sort((a, b) => b.motivos.length - a.motivos.length || a.aluno.nome.localeCompare(b.aluno.nome));
}

// Nota de 0 a 10 escrita pelo usuário ("8,5" ou "8.5"): "" = sem nota, null = inválida
export function lerNota(texto) {
  const t = String(texto === null || texto === undefined ? "" : texto).trim();
  if (!t) return "";
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 10 ? Math.round(n * 10) / 10 : null;
}
export const formatarNota = (n) => (n === null || n === undefined || n === "" ? "—" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

/* ---------- feriados ---------- */
// Páscoa (algoritmo de Meeus/Jones/Butcher), em AAAA-MM-DD
function pascoaIso(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const cacheFeriados = {};
// feriados nacionais (e o Carnaval e o Corpus Christi, pontos facultativos em que a maioria das escolas não funciona) de um ano
export function feriadosNacionais(ano) {
  if (cacheFeriados[ano]) return cacheFeriados[ano];
  const p = pascoaIso(ano);
  const f = {};
  f[`${ano}-01-01`] = "Confraternização Universal";
  f[somarDias(p, -48)] = "Carnaval";
  f[somarDias(p, -47)] = "Carnaval";
  f[somarDias(p, -2)] = "Sexta-feira Santa";
  f[`${ano}-04-21`] = "Tiradentes";
  f[`${ano}-05-01`] = "Dia do Trabalho";
  f[somarDias(p, 60)] = "Corpus Christi";
  f[`${ano}-09-07`] = "Independência do Brasil";
  f[`${ano}-10-12`] = "Nossa Senhora Aparecida";
  f[`${ano}-11-02`] = "Finados";
  f[`${ano}-11-15`] = "Proclamação da República";
  if (ano >= 2024) f[`${ano}-11-20`] = "Dia da Consciência Negra";
  f[`${ano}-12-25`] = "Natal";
  cacheFeriados[ano] = f;
  return f;
}

// Dia sem aula: um dia cadastrado ("Sem aula"), um período de férias ou um feriado nacional.
// Um dia cadastrado como "Com aula" vale mais que as férias e que o feriado nacional.
export function feriadoDoDia(iso, dados) {
  if (!iso) return null;
  const cadastrado = ((dados && dados.feriados) || []).find((x) => x.data === iso);
  if (cadastrado) return String(cadastrado.aula || "").trim().toLowerCase() === "sim" ? null : { nome: cadastrado.nome, origem: "cadastrado" };
  const ferias = ((dados && dados.ferias) || []).find((x) => x.inicio && x.fim && iso >= x.inicio && iso <= x.fim);
  if (ferias) return { nome: ferias.nome, origem: "ferias", fim: ferias.fim };
  const nome = feriadosNacionais(Number(String(iso).slice(0, 4)))[iso];
  return nome ? { nome, origem: "nacional" } : null;
}

// igual a feriadoDoDia, mas respeita o interruptor "Feriados" de Configurações
export function feriadoDaData(dados, iso) {
  return recursoLigado({ ...DEFAULT_CONFIG, ...((dados && dados.config) || {}) }, "recursoFeriados") ? feriadoDoDia(iso, dados) : null;
}

// próximos feriados nacionais a partir de uma data (para consulta em Configurações)
export function proximosFeriadosNacionais(deIso, quantidade = 6) {
  const ano = Number(deIso.slice(0, 4));
  return [...Object.entries(feriadosNacionais(ano)), ...Object.entries(feriadosNacionais(ano + 1))]
    .filter(([iso]) => iso >= deIso)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, quantidade)
    .map(([iso, nome]) => ({ data: iso, nome }));
}

/* ---------- andamento do dia por horário ---------- */
export function andamentoPorHorario(sessoes) {
  const grupos = {};
  sessoes.forEach((s) => {
    const k = s.hora || "--:--";
    if (!grupos[k]) grupos[k] = { hora: k, total: 0, marcadas: 0, presentes: 0, faltas: 0, sessoes: [] };
    const g = grupos[k];
    g.total += 1;
    if (marcada(s.status)) g.marcadas += 1;
    if (ehPresenca(s.status)) g.presentes += 1;
    if (ehFalta(s.status)) g.faltas += 1;
    g.sessoes.push(s);
  });
  return Object.values(grupos)
    .map((g) => ({ ...g, sessoes: [...g.sessoes].sort((a, b) => a.aluno.localeCompare(b.aluno, "pt-BR")) }))
    .sort((a, b) => horaParaMin(a.hora) - horaParaMin(b.hora));
}

/* ---------- esconder o curso de inglês ---------- */
// Visão dos dados sem nada do inglês: cursos, módulos, matrículas e o que depende delas, alunos que só têm inglês e a escala "Inglês".
// Os dados continuam na planilha; só deixam de aparecer enquanto o interruptor "Curso de inglês" estiver desligado.
export function semIngles(dados) {
  const cursosIng = new Set((dados.cursos || []).filter((c) => tipoDoCurso(c) === "Inglês").map((c) => c.id));
  const ehEscalaIngles = (b) => b.cursoId === `${PREFIXO_AREA}${CAT_INGLES}` || cursosIng.has(b.cursoId);
  const temEscalaIngles = (dados.escala || []).some(ehEscalaIngles);
  if (!cursosIng.size && !temEscalaIngles) return dados;
  const matsIng = (dados.matriculas || []).filter((m) => cursosIng.has(m.cursoId));
  const mats = (dados.matriculas || []).filter((m) => !cursosIng.has(m.cursoId));
  const idsMat = new Set(mats.map((m) => m.id));
  const idsMatIng = new Set(matsIng.map((m) => m.id));
  const comOutros = new Set(mats.map((m) => m.alunoId));
  const ocultos = new Set(matsIng.map((m) => m.alunoId).filter((id) => !comOutros.has(id)));
  const dosVisiveis = (lista) => (lista || []).filter((x) => !idsMatIng.has(x.matriculaId));
  return {
    ...dados,
    cursos: (dados.cursos || []).filter((c) => !cursosIng.has(c.id)),
    modulos: (dados.modulos || []).filter((m) => !cursosIng.has(m.cursoId)),
    matriculas: mats,
    alunos: (dados.alunos || []).filter((a) => !ocultos.has(a.id)),
    aulas: (dados.aulas || []).filter((a) => idsMat.has(a.matriculaId) || !idsMatIng.has(a.matriculaId)),
    progresso: dosVisiveis(dados.progresso),
    migracao: dosVisiveis(dados.migracao),
    movimentacoes: dosVisiveis(dados.movimentacoes),
    avaliacoes: dosVisiveis(dados.avaliacoes),
    pontos: (dados.pontos || []).filter((p) => !ocultos.has(p.alunoId)),
    escala: (dados.escala || []).filter((b) => !ehEscalaIngles(b)),
  };
}

/* ---------- perfis de usuário ---------- */
// Admin altera tudo (inclusive Configurações); Secretaria e Diretor gerenciam cadastros e movimentações;
// Informática e Inglês veem só a própria área e marcam aulas, pontos manuais, notas e avaliações dela.
// "Professor" (antigo) vale como instrutor das duas áreas e "Consulta" é somente leitura.
export const PERFIS = ["Admin", "Informática", "Inglês", "Secretaria", "Diretor"];
export const PERFIS_GESTAO = ["Admin", "Secretaria", "Diretor"];
export const PERFIS_INSTRUTOR = ["Informática", "Inglês", "Professor"];
export const areaDoPerfil = (perfil) => (perfil === "Informática" ? CAT_PROGRAMACAO : perfil === "Inglês" ? CAT_INGLES : "");

// Visão dos dados só da área do usuário (o servidor já filtra; aqui vale também para o modo demonstração)
export function apenasArea(dados, area) {
  if (!area) return dados;
  const cursos = (dados.cursos || []).filter((c) => categoriaDoCurso(c) === area);
  const idsCurso = new Set(cursos.map((c) => c.id));
  const mats = (dados.matriculas || []).filter((m) => idsCurso.has(m.cursoId));
  const idsMat = new Set(mats.map((m) => m.id));
  const idsAluno = new Set(mats.map((m) => m.alunoId));
  const daMat = (lista) => (lista || []).filter((x) => idsMat.has(x.matriculaId));
  return {
    ...dados,
    cursos,
    modulos: (dados.modulos || []).filter((m) => idsCurso.has(m.cursoId)),
    matriculas: mats,
    alunos: (dados.alunos || []).filter((a) => idsAluno.has(a.id)),
    aulas: daMat(dados.aulas),
    progresso: daMat(dados.progresso),
    migracao: daMat(dados.migracao),
    avaliacoes: daMat(dados.avaliacoes),
    movimentacoes: daMat(dados.movimentacoes),
    pontos: (dados.pontos || []).filter((p) => idsAluno.has(p.alunoId)),
    escala: (dados.escala || []).filter((b) => !b.cursoId || b.cursoId === `${PREFIXO_AREA}${area}` || idsCurso.has(b.cursoId)),
  };
}
