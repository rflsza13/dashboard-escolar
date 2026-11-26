/* Cálculos extras da tela de Relatórios (build 1.1.3).
   Tudo aqui lê só os dados já carregados (nada novo é gravado na planilha). */
import {
  DIAS_GRADE,
  GRUPOS_CURSO,
  GRUPO_DO_TIPO,
  INTERVALOS_GRADE,
  blocosDaEscala,
  certificadosPendentes,
  cursosComCor,
  ehFalta,
  ehPresenca,
  faixaDaAula,
  horaParaMin,
  hojeIso,
  montarSessoes,
  segundaDaSemana,
  siglaDia,
  somarDias,
} from "utils/escola";

const mapa = (lista) => {
  const o = {};
  (lista || []).forEach((x) => {
    o[x.id] = x;
  });
  return o;
};
const dia = (iso) => String(iso || "").slice(0, 10);
const arred1 = (n) => Math.round(n * 10) / 10;
const ehConcluida = (s) => /^conclu/i.test(String(s || "").trim());
const MATRICULA_EFETIVA = ["Ativa", "Concluída", "Trancada", "Saiu"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/* ---------- janelas de tempo ---------- */
// periodo = nº de dias (30, 90, 365) ou null (histórico completo). "anterior" é a janela de mesmo tamanho logo antes.
export function janelaDoPeriodo(periodo, hoje = hojeIso()) {
  if (!periodo) return { de: null, ate: hoje, anterior: null };
  return {
    de: somarDias(hoje, -periodo),
    ate: hoje,
    anterior: { de: somarDias(hoje, -2 * periodo), ate: somarDias(hoje, -periodo - 1) },
  };
}
const dentro = (iso, j) => Boolean(iso) && (!j.de || iso >= j.de) && iso <= j.ate;

/* ---------- 1. funil das aulas experimentais ---------- */
// futuro = true: conta também as marcadas para datas que ainda vão acontecer (como o card "Conversão Exp.")
export function funilExperimentais(dados, j, futuro = true) {
  const mats = mapa(dados.matriculas);
  const alunos = mapa(dados.alunos);
  const cursos = mapa(dados.cursos);
  const hoje = hojeIso();
  const porAluno = {};
  (dados.aulas || []).forEach((a) => {
    if (a.tipo !== "Experimental" || a.status === "Cancelada" || !a.data) return;
    if (j.de && a.data < j.de) return;
    if (!futuro && a.data > j.ate) return;
    const m = mats[a.matriculaId];
    if (!m) return;
    const e = porAluno[m.alunoId] || (porAluno[m.alunoId] = { alunoId: m.alunoId, primeira: a.data, cursoId: m.cursoId, compareceu: false, faltou: false, futura: false, semRegistro: false, obs: "" });
    if (a.data < e.primeira) {
      e.primeira = a.data;
      e.cursoId = m.cursoId;
    }
    if (ehPresenca(a.status)) e.compareceu = true;
    else if (ehFalta(a.status)) e.faltou = true;
    else if (a.data >= hoje) e.futura = true;
    else e.semRegistro = true;
    const obs = String(m.obs || a.obs || "").trim();
    if (obs && !e.obs) e.obs = obs;
  });
  const ids = Object.keys(porAluno);
  const matricula = (id) =>
    (dados.matriculas || []).find((m) => m.alunoId === id && MATRICULA_EFETIVA.includes(m.status) && (!m.dataInicio || m.dataInicio >= porAluno[id].primeira));

  let compareceram = 0;
  let matriculados = 0;
  const motivos = {};
  const pushMotivo = (chave, rotulo, cor, item) => {
    (motivos[chave] = motivos[chave] || { chave, rotulo, cor, itens: [] }).itens.push(item);
  };
  ids.forEach((id) => {
    const e = porAluno[id];
    if (e.compareceu) compareceram += 1;
    const fechou = e.compareceu && matricula(id);
    if (fechou) {
      matriculados += 1;
      return;
    }
    const item = { alunoId: id, nome: (alunos[id] || {}).nome || "Aluno removido", curso: (cursos[e.cursoId] || {}).nome || "—", data: e.primeira, obs: e.obs };
    if (e.compareceu) pushMotivo("decidindo", "Compareceu e ainda não matriculou", "#FFB547", item);
    else if (e.faltou) pushMotivo("faltou", "Não compareceu", "#E31A1A", item);
    else if (e.futura) pushMotivo("futura", "Aula ainda vai acontecer", "#2CD9FF", item);
    else pushMotivo("semregistro", "Aula passou sem registro de presença", "#A060FF", item);
  });
  const ordem = ["decidindo", "faltou", "semregistro", "futura"];
  return {
    marcadas: ids.length,
    compareceram,
    matriculados,
    taxaComparecimento: ids.length ? Math.round((compareceram / ids.length) * 100) : 0,
    taxaConversao: compareceram ? Math.round((matriculados / compareceram) * 100) : 0,
    taxaGeral: ids.length ? Math.round((matriculados / ids.length) * 100) : 0,
    motivos: ordem.filter((k) => motivos[k]).map((k) => ({ ...motivos[k], itens: motivos[k].itens.sort((a, b) => String(b.data).localeCompare(String(a.data))) })),
  };
}

/* ---------- novos, saídas e conclusões ---------- */
function alunosNovosNo(dados, j) {
  const primeira = {};
  (dados.matriculas || []).forEach((m) => {
    if (m.status === "Experimental" || !m.dataInicio) return;
    if (!primeira[m.alunoId] || m.dataInicio < primeira[m.alunoId]) primeira[m.alunoId] = m.dataInicio;
  });
  return Object.keys(primeira).filter((id) => dentro(primeira[id], j));
}
const saidasNo = (dados, j) => {
  const vistos = new Set();
  (dados.movimentacoes || []).forEach((x) => {
    if (x.tipo === "Saída" && dentro(dia(x.data), j)) vistos.add(x.matriculaId || x.id);
  });
  return vistos.size;
};
// data em que cada matrícula concluída terminou (registro de Conclusão; senão, o último módulo concluído)
function datasDeConclusao(dados) {
  const mov = {};
  const prog = {};
  (dados.movimentacoes || []).forEach((x) => {
    if (x.tipo !== "Conclusão" || !x.data) return;
    const d = dia(x.data);
    if (!mov[x.matriculaId] || d > mov[x.matriculaId]) mov[x.matriculaId] = d;
  });
  (dados.progresso || []).forEach((p) => {
    if (!p.concluidoEm) return;
    const d = dia(p.concluidoEm);
    if (!prog[p.matriculaId] || d > prog[p.matriculaId]) prog[p.matriculaId] = d;
  });
  return { ...prog, ...mov };
}

/* ---------- 10. resumo de um período (base da comparação com o período anterior) ---------- */
export function resumoPeriodo(dados, j, futuroExp = false) {
  let presencas = 0;
  let faltas = 0;
  (dados.aulas || []).forEach((a) => {
    if (!dentro(a.data, j)) return;
    if (ehPresenca(a.status)) presencas += 1;
    else if (ehFalta(a.status)) faltas += 1;
  });
  const funil = funilExperimentais(dados, j, futuroExp);
  const novos = alunosNovosNo(dados, j).length;
  const saidas = saidasNo(dados, j);
  return {
    presencas,
    faltas,
    frequencia: presencas + faltas ? arred1((presencas / (presencas + faltas)) * 100) : null,
    expMarcadas: funil.marcadas,
    conversaoExp: funil.compareceram ? funil.taxaConversao : null,
    novos,
    saidas,
    saldo: novos - saidas,
    modulos: (dados.progresso || []).filter((p) => dentro(dia(p.concluidoEm), j)).length,
  };
}

/* ---------- 6. evolução de alunos (acompanha o período escolhido no topo da tela) ---------- */
// 30 e 90 dias: uma barra por semana (segunda a domingo), só com o que cai dentro do período.
// 12 meses ("Este ano"): um ponto por mês. Histórico completo: um ponto por mês desde o primeiro registro.
export function evolucaoPorPeriodo(dados, periodo, hoje = hojeIso()) {
  // datas de cada tipo de evento
  const novos = [];
  const primeira = {};
  (dados.matriculas || []).forEach((m) => {
    if (m.status === "Experimental" || !m.dataInicio) return;
    if (!primeira[m.alunoId] || m.dataInicio < primeira[m.alunoId]) primeira[m.alunoId] = m.dataInicio;
  });
  Object.values(primeira).forEach((d) => novos.push(dia(d)));
  const saidas = [];
  const visto = new Set();
  (dados.movimentacoes || []).forEach((mv) => {
    if (mv.tipo !== "Saída" || !mv.data) return;
    const k = `${mv.matriculaId || mv.id}`;
    if (visto.has(k)) return;
    visto.add(k);
    saidas.push(dia(mv.data));
  });
  const conclusoes = datasDeConclusao(dados);
  const concluidos = (dados.matriculas || []).filter((m) => ehConcluida(m.status) && conclusoes[m.id]).map((m) => conclusoes[m.id]);

  const montar = (chaves, chaveDe, rotuloDe, de) => {
    const por = {};
    chaves.forEach((c) => {
      por[c] = { chave: c, rotulo: rotuloDe(c), novos: 0, saidas: 0, concluidos: 0 };
    });
    [["novos", novos], ["saidas", saidas], ["concluidos", concluidos]].forEach(([campo, datas]) => {
      datas.forEach((d) => {
        if (d > hoje || (de && d < de)) return;
        const x = por[chaveDe(d)];
        if (x) x[campo] += 1;
      });
    });
    return chaves.map((c) => ({ ...por[c], saldo: por[c].novos - por[c].saidas }));
  };

  const mesDe = (d) => d.slice(0, 7);
  const rotuloMes = (c) => `${MESES[Number(c.slice(5, 7)) - 1]}/${c.slice(2, 4)}`;
  const idxMes = (iso) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
  const chaveMes = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
  const mesesDe = (ini, fim) => Array.from({ length: fim - ini + 1 }, (_, k) => chaveMes(ini + k));

  if (periodo && periodo <= 120) {
    const de = somarDias(hoje, -periodo);
    const chaves = [];
    for (let sem = segundaDaSemana(de); sem <= hoje; sem = somarDias(sem, 7)) chaves.push(sem);
    return {
      tipo: "semana",
      descricao: `por semana, nos últimos ${periodo} dias`,
      pontos: montar(chaves, (d) => segundaDaSemana(d), (c) => `${c.slice(8, 10)}/${c.slice(5, 7)}`, de),
    };
  }
  const fim = idxMes(hoje);
  if (periodo) {
    return { tipo: "mes", descricao: "por mês, nos últimos 12 meses", pontos: montar(mesesDe(fim - 11, fim), mesDe, rotuloMes, null) };
  }
  // histórico completo: do primeiro registro até hoje (no mínimo 6 e no máximo 60 meses)
  const primeiraData = [...novos, ...saidas, ...concluidos].filter((d) => d && d <= hoje).sort()[0];
  const ini = Math.max(fim - 59, Math.min(primeiraData ? idxMes(primeiraData) : fim, fim - 5));
  const chaves = mesesDe(ini, fim);
  return { tipo: "mes", descricao: `por mês, desde ${rotuloMes(chaves[0])}`, pontos: montar(chaves, mesDe, rotuloMes, null) };
}

/* ---------- 7. saídas por motivo ---------- */
export function saidasPorMotivo(dados, j) {
  const por = {};
  const vistos = new Set();
  (dados.movimentacoes || []).forEach((x) => {
    if (x.tipo !== "Saída" || !dentro(dia(x.data), j)) return;
    const k = x.matriculaId || x.id;
    if (vistos.has(k)) return;
    vistos.add(k);
    const motivo = String(x.motivo || "").trim() || "Não informado";
    const chave = motivo.toLowerCase();
    por[chave] = por[chave] || { motivo, total: 0 };
    por[chave].total += 1;
  });
  const lista = Object.values(por).sort((a, b) => b.total - a.total || a.motivo.localeCompare(b.motivo, "pt-BR"));
  const total = lista.reduce((s, x) => s + x.total, 0);
  return { total, lista: lista.map((x) => ({ ...x, pct: total ? Math.round((x.total / total) * 100) : 0 })) };
}

/* ---------- 2. faltas por dia da semana e por horário ---------- */
export function faltasPorDiaHorario(dados, j) {
  const mats = mapa(dados.matriculas);
  const celulas = {};
  DIAS_GRADE.forEach((d) => {
    celulas[d] = {};
    INTERVALOS_GRADE.forEach((f) => {
      celulas[d][f] = { faltas: 0, total: 0 };
    });
  });
  const porDia = {};
  const porFaixa = {};
  DIAS_GRADE.forEach((d) => {
    porDia[d] = { dia: d, faltas: 0, total: 0 };
  });
  INTERVALOS_GRADE.forEach((f) => {
    porFaixa[f] = { faixa: f, faltas: 0, total: 0 };
  });
  (dados.aulas || []).forEach((a) => {
    if ((a.tipo || "Regular") === "Experimental" || !dentro(a.data, j)) return;
    const falta = ehFalta(a.status);
    if (!falta && !ehPresenca(a.status)) return;
    const d = siglaDia(a.data);
    if (!porDia[d]) return;
    const m = mats[a.matriculaId];
    const faixa = faixaDaAula(a.hora || (m && m.inicio) || "");
    [porDia[d], porFaixa[faixa], celulas[d][faixa]].forEach((x) => {
      if (!x) return;
      x.total += 1;
      if (falta) x.faltas += 1;
    });
  });
  const pct = (x) => (x.total ? Math.round((x.faltas / x.total) * 100) : 0);
  const comPct = (x) => ({ ...x, pct: pct(x) });
  const dias = DIAS_GRADE.map((d) => comPct(porDia[d]));
  const faixas = INTERVALOS_GRADE.map((f) => comPct(porFaixa[f]));
  const minimo = 5; // poucas aulas não indicam tendência
  const pior = (lista) => lista.filter((x) => x.total >= minimo).sort((a, b) => b.pct - a.pct || b.faltas - a.faltas)[0] || null;
  let piorCelula = null;
  DIAS_GRADE.forEach((d) =>
    INTERVALOS_GRADE.forEach((f) => {
      const c = celulas[d][f];
      if (c.total >= minimo && (!piorCelula || pct(c) > piorCelula.pct || (pct(c) === piorCelula.pct && c.faltas > piorCelula.faltas))) piorCelula = { dia: d, faixa: f, ...c, pct: pct(c) };
    })
  );
  return { dias, faixas, celulas, piorDia: pior(dias), piorFaixa: pior(faixas), piorCelula, minimo, total: dias.reduce((s, x) => s + x.total, 0) };
}

/* ---------- 3. reposições ---------- */
export function reposicoes(dados, j, hoje = hojeIso()) {
  const alunos = mapa(dados.alunos);
  const mats = mapa(dados.matriculas);
  const cursos = mapa(dados.cursos);
  const aulas = dados.aulas || [];
  const reposPorFalta = {};
  aulas.forEach((a) => {
    if (a.tipo === "Reposição" && a.reposicaoDe && a.status !== "Cancelada") reposPorFalta[a.reposicaoDe] = a;
  });
  const faltas = aulas.filter((a) => ehFalta(a.status) && (a.tipo || "Regular") !== "Reposição" && (a.tipo || "Regular") !== "Experimental" && dentro(a.data, j));
  let agendadas = 0;
  let realizadas = 0;
  let vencidas = 0;
  let somaDias = 0;
  let contDias = 0;
  const semReposicao = [];
  faltas.forEach((f) => {
    const r = reposPorFalta[f.id];
    if (!r) {
      const m = mats[f.matriculaId] || {};
      semReposicao.push({
        alunoId: m.alunoId,
        nome: (alunos[m.alunoId] || {}).nome || "Aluno removido",
        curso: (cursos[m.cursoId] || {}).nome || "—",
        data: f.data,
        diasDesde: Math.max(0, Math.round((new Date(`${hoje}T12:00:00`) - new Date(`${dia(f.data)}T12:00:00`)) / 86400000)),
      });
      return;
    }
    if (r.status === "Reposição realizada") realizadas += 1;
    else {
      agendadas += 1;
      if (r.data < hoje) vencidas += 1;
    }
    const intervalo = Math.round((new Date(`${dia(r.data)}T12:00:00`) - new Date(`${dia(f.data)}T12:00:00`)) / 86400000);
    if (Number.isFinite(intervalo) && intervalo >= 0) {
      somaDias += intervalo;
      contDias += 1;
    }
  });
  semReposicao.sort((a, b) => b.diasDesde - a.diasDesde);
  return {
    faltas: faltas.length,
    agendadas,
    realizadas,
    vencidas,
    semReposicao,
    tempoMedioDias: contDias ? arred1(somaDias / contDias) : null,
    taxa: faltas.length ? Math.round(((agendadas + realizadas) / faltas.length) * 100) : null,
  };
}

/* ---------- 4. ocupação da grade ---------- */
export function ocupacaoGrade(dados) {
  const celulas = {};
  DIAS_GRADE.forEach((d) => {
    celulas[d] = {};
    INTERVALOS_GRADE.forEach((f) => {
      celulas[d][f] = { alunos: 0, professores: 0 };
    });
  });
  (dados.matriculas || []).forEach((m) => {
    if (m.status !== "Ativa" || !celulas[m.dia]) return;
    celulas[m.dia][faixaDaAula(m.inicio)].alunos += 1;
  });
  const blocos = blocosDaEscala(dados, cursosComCor(dados.cursos));
  const temEscala = blocos.length > 0;
  if (temEscala) {
    DIAS_GRADE.forEach((d) =>
      INTERVALOS_GRADE.forEach((f) => {
        const ini = horaParaMin(f.split(" - ")[0]);
        celulas[d][f].professores = new Set(blocos.filter((b) => b.dia === d && b.iniMin <= ini && ini < b.fimMin).map((b) => b.professor.id)).size;
      })
    );
  }
  const lista = [];
  DIAS_GRADE.forEach((d) => INTERVALOS_GRADE.forEach((f) => lista.push({ dia: d, faixa: f, ...celulas[d][f] })));
  const maximo = Math.max(1, ...lista.map((x) => x.alunos));
  return {
    celulas,
    maximo,
    temEscala,
    totalAlunos: lista.reduce((s, x) => s + x.alunos, 0),
    faixasTotal: lista.length,
    vazias: lista.filter((x) => x.alunos === 0),
    ociosas: lista.filter((x) => x.alunos === 0 && x.professores > 0),
    maisCheias: lista.filter((x) => x.alunos > 0).sort((a, b) => b.alunos - a.alunos).slice(0, 3),
  };
}

/* ---------- 5. carga por professor ---------- */
// O professor de cada aula vem da escala (e, nas experimentais, do cadastro da aula). Horário com mais de um professor conta para todos.
export function cargaPorProfessor(dados, j, hoje = hojeIso()) {
  if (!(dados.professores || []).length) return [];
  let de = j.de;
  if (!de) {
    const datas = (dados.aulas || []).map((a) => dia(a.data)).filter(Boolean).sort();
    de = datas[0] || hoje;
  }
  const por = {};
  (dados.professores || []).forEach((p) => {
    if (p.ativo !== "Não") por[p.nome] = { professorId: p.id, nome: p.nome, cor: p.cor, presentes: 0, faltas: 0, semRegistro: 0, turnos: new Set() };
  });
  montarSessoes(dados, de, hoje).forEach((s) => {
    (s.professores || []).forEach((nome) => {
      const x = por[nome];
      if (!x) return;
      if (ehPresenca(s.status)) {
        x.presentes += 1;
        x.turnos.add(`${s.data}|${s.hora}`);
      } else if (ehFalta(s.status)) x.faltas += 1;
      else if (!s.cancelada && s.data < hoje && s.tipo !== "Reposição") x.semRegistro += 1;
    });
  });
  return Object.values(por)
    .map((x) => {
      const marcadas = x.presentes + x.faltas;
      return { professorId: x.professorId, nome: x.nome, cor: x.cor, turnos: x.turnos.size, atendimentos: x.presentes, faltas: x.faltas, semRegistro: x.semRegistro, pctFaltas: marcadas ? Math.round((x.faltas / marcadas) * 100) : 0 };
    })
    .filter((x) => x.atendimentos + x.faltas + x.semRegistro > 0)
    .sort((a, b) => b.atendimentos - a.atendimentos || a.nome.localeCompare(b.nome, "pt-BR"));
}

/* ---------- 8. tempo médio por módulo ---------- */
export function tempoPorModulo(dados, hoje = hojeIso()) {
  const cursos = cursosComCor(dados.cursos);
  const mods = {};
  (dados.modulos || []).forEach((m) => {
    (mods[m.cursoId] = mods[m.cursoId] || []).push(m);
  });
  const progPorMat = {};
  (dados.progresso || []).forEach((p) => {
    (progPorMat[p.matriculaId] = progPorMat[p.matriculaId] || []).push(p);
  });
  const dias = (a, b) => Math.round((new Date(`${dia(b)}T12:00:00`) - new Date(`${dia(a)}T12:00:00`)) / 86400000);
  const resultado = [];
  cursos.forEach((c) => {
    const lista = (mods[c.id] || []).slice().sort((a, b) => Number(a.ordem) - Number(b.ordem));
    if (!lista.length) return;
    const porModulo = lista.map((mod) => ({ moduloId: mod.id, ordem: Number(mod.ordem), nome: mod.nome, soma: 0, n: 0, andamento: 0, atrasados: 0, andamentoDias: [] }));
    (dados.matriculas || []).forEach((m) => {
      if (m.cursoId !== c.id) return;
      const feitos = {};
      (progPorMat[m.id] || []).forEach((p) => {
        feitos[p.moduloId] = dia(p.concluidoEm);
      });
      let anterior = m.dataInicio ? dia(m.dataInicio) : "";
      lista.forEach((mod, i) => {
        const fim = feitos[mod.id];
        if (fim && anterior) {
          const d = dias(anterior, fim);
          if (d >= 0 && d < 400) {
            porModulo[i].soma += d;
            porModulo[i].n += 1;
          }
        }
        if (fim) anterior = fim;
      });
      if (m.status === "Ativa") {
        const atual = lista.findIndex((mod) => !feitos[mod.id] && Number(mod.ordem) >= Number(m.moduloAtual || 1));
        if (atual >= 0 && anterior) {
          porModulo[atual].andamento += 1;
          porModulo[atual].andamentoDias.push(Math.max(0, dias(anterior, hoje)));
        }
      }
    });
    const comMedia = porModulo.filter((x) => x.n > 0);
    const mediaCurso = comMedia.length ? comMedia.reduce((s, x) => s + x.soma / x.n, 0) / comMedia.length : 0;
    const itens = porModulo.map((x) => {
      const media = x.n ? arred1(x.soma / x.n) : null;
      const atrasados = media === null ? 0 : x.andamentoDias.filter((d) => d > media * 1.5).length;
      return { moduloId: x.moduloId, ordem: x.ordem, nome: x.nome, mediaDias: media, concluidos: x.n, andamento: x.andamento, atrasados, lento: media !== null && x.n >= 2 && mediaCurso > 0 && media > mediaCurso * 1.3 };
    });
    resultado.push({ cursoId: c.id, curso: c.nome, cor: c.cor, mediaCurso: arred1(mediaCurso), itens });
  });
  return resultado.filter((c) => c.itens.some((x) => x.concluidos > 0 || x.andamento > 0));
}

/* ---------- 9. conclusões e certificados ---------- */
export function conclusoesCertificados(dados, j, hoje = hojeIso()) {
  const movs = dados.movimentacoes || [];
  const conclusoes = datasDeConclusao(dados);
  const concluidosNoPeriodo = (dados.matriculas || []).filter((m) => ehConcluida(m.status) && dentro(conclusoes[m.id], j)).length;
  const emitidosNoPeriodo = movs.filter((x) => x.tipo === "Certificado" && dentro(dia(x.data), j)).length;
  // tempo médio entre concluir e emitir o certificado
  let soma = 0;
  let cont = 0;
  movs.forEach((x) => {
    if (x.tipo !== "Certificado") return;
    const c = conclusoes[x.matriculaId];
    if (!c) return;
    const d = Math.round((new Date(`${dia(x.data)}T12:00:00`) - new Date(`${c}T12:00:00`)) / 86400000);
    if (d >= 0) {
      soma += d;
      cont += 1;
    }
  });
  const pendentes = certificadosPendentes(dados, hoje, 3650).map((x) => ({
    ...x,
    diasEspera: Math.max(0, Math.round((new Date(`${hoje}T12:00:00`) - new Date(`${dia(x.concluidoEm)}T12:00:00`)) / 86400000)),
  }));
  pendentes.sort((a, b) => b.diasEspera - a.diasEspera);
  return { concluidosNoPeriodo, emitidosNoPeriodo, tempoMedioEmissao: cont ? arred1(soma / cont) : null, pendentes };
}

/* ---------- performance por curso, agrupada (Programação, Robótica e Inglês) ---------- */
export function performanceAgrupada(dados, j) {
  const cursos = cursosComCor(dados.cursos);
  const matsPorCurso = {};
  (dados.matriculas || []).forEach((m) => {
    (matsPorCurso[m.cursoId] = matsPorCurso[m.cursoId] || []).push(m);
  });
  const avaliacoes = dados.avaliacoes || [];
  const progresso = dados.progresso || [];
  const aulasPeriodo = (dados.aulas || []).filter((a) => dentro(a.data, j));
  const linhas = cursos.map((c) => {
    const mats = matsPorCurso[c.id] || [];
    const ids = new Set(mats.map((m) => m.id));
    let presencas = 0;
    let faltas = 0;
    aulasPeriodo.forEach((a) => {
      if (!ids.has(a.matriculaId)) return;
      if (ehPresenca(a.status)) presencas += 1;
      else if (ehFalta(a.status)) faltas += 1;
    });
    const notas = avaliacoes.filter((av) => ids.has(av.matriculaId) && av.nota !== "" && av.nota !== null && !Number.isNaN(Number(av.nota))).map((av) => Number(av.nota));
    return {
      cursoId: c.id,
      nome: c.nome,
      cor: c.cor,
      tipo: c.tipo,
      grupo: GRUPO_DO_TIPO[c.tipo] || "Programação",
      alunosAtivos: mats.filter((m) => m.status === "Ativa").length,
      presencas,
      faltas,
      frequencia: presencas + faltas ? arred1((presencas / (presencas + faltas)) * 100) : 100,
      mediaNota: notas.length ? arred1(notas.reduce((s, n) => s + n, 0) / notas.length) : null,
      notas: notas.length,
      modulosConcluidos: progresso.filter((p) => ids.has(p.matriculaId) && (!j.de || (p.concluidoEm && dia(p.concluidoEm) >= j.de))).length,
    };
  });
  return GRUPOS_CURSO.map((grupo) => {
    const lista = linhas.filter((l) => l.grupo === grupo);
    if (!lista.length) return null;
    const pres = lista.reduce((s, x) => s + x.presencas, 0);
    const falt = lista.reduce((s, x) => s + x.faltas, 0);
    const todasNotas = lista.reduce((s, x) => s + x.notas, 0);
    const somaNotas = lista.reduce((s, x) => s + (x.mediaNota === null ? 0 : x.mediaNota * x.notas), 0);
    return {
      grupo,
      cor: lista[0].cor,
      cursos: lista,
      alunosAtivos: lista.reduce((s, x) => s + x.alunosAtivos, 0),
      frequencia: pres + falt ? arred1((pres / (pres + falt)) * 100) : 100,
      mediaNota: todasNotas ? arred1(somaNotas / todasNotas) : null,
      modulosConcluidos: lista.reduce((s, x) => s + x.modulosConcluidos, 0),
    };
  }).filter(Boolean);
}
