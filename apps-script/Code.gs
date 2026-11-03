/**
 * Backend do sistema da escola (Google Apps Script).
 * Deve ficar "preso" à planilha: Extensões > Apps Script, dentro do arquivo da escola.
 *
 * Segurança: o site faz login com Google (ID token). Este script confere o token e só deixa
 * passar e-mails ativos listados na aba Usuarios, aplicando o perfil (Admin, Professor, Consulta).
 */

// ID de cliente OAuth (Google Cloud > APIs e serviços > Credenciais). É público, não é segredo.
const CLIENT_ID = 'COLE-AQUI-O-ID-DE-CLIENTE.apps.googleusercontent.com';

const SCHEMA = {
  Alunos:     [['id','t'],['nome','t'],['responsavel','t'],['contato','t'],['ativo','t'],['obs','t']],
  Cursos:     [['id','t'],['nome','t'],['cor','t'],['ativo','t'],['grupo','t']],
  Professores: [['id','t'],['nome','t'],['contato','t'],['cor','t'],['ativo','t'],['obs','t']],
  Escala:     [['id','t'],['professorId','t'],['dia','t'],['inicio','h'],['fim','h'],['cursoId','t'],['obs','t']],
  Modulos:    [['id','t'],['cursoId','t'],['ordem','n'],['nome','t'],['pontos','n']],
  Matriculas: [['id','t'],['alunoId','t'],['cursoId','t'],['dia','t'],['inicio','h'],['duracao','n'],['modalidade','t'],['moduloAtual','n'],['dataInicio','d'],['status','t'],['obs','t']],
  Aulas:      [['id','t'],['data','d'],['matriculaId','t'],['status','t'],['tipo','t'],['hora','h'],['modalidade','t'],['modulo','n'],['reposicaoDe','t'],['obs','t'],['professorId','t']],
  Progresso:  [['id','t'],['matriculaId','t'],['moduloId','t'],['concluidoEm','d'],['obs','t']],
  Pontos:     [['id','t'],['data','d'],['alunoId','t'],['tipo','t'],['pontos','n'],['descricao','t'],['moduloId','t'],['registradoPor','t']],
  Premios:    [['id','t'],['nome','t'],['custo','n'],['ativo','t']],
  Usuarios:   [['email','t'],['nome','t'],['perfil','t'],['ativo','t']]
};
const CHAVE_DADOS = { Alunos: 'alunos', Professores: 'professores', Escala: 'escala', Cursos: 'cursos', Modulos: 'modulos', Matriculas: 'matriculas', Aulas: 'aulas', Progresso: 'progresso', Pontos: 'pontos', Premios: 'premios' };
const PREFIXO = { Alunos: 'A', Professores: 'PRF', Escala: 'ESC', Cursos: 'C', Modulos: 'MOD', Matriculas: 'MAT', Aulas: 'AUL', Progresso: 'PRG', Pontos: 'P', Premios: 'PR' };
const QUEM_GRAVA = {
  Aulas: ['Admin', 'Professor'], Pontos: ['Admin', 'Professor'],
  Alunos: ['Admin'], Cursos: ['Admin'], Modulos: ['Admin'], Matriculas: ['Admin'], Progresso: ['Admin'], Premios: ['Admin'],
  Professores: ['Admin'], Escala: ['Admin']
};
// Abas criadas pela função prepararNovidades; se ainda não existirem, o sistema segue funcionando sem elas
const OPCIONAIS = ['Professores', 'Escala'];
const OBRIGATORIOS = {
  Alunos: ['nome'], Cursos: ['nome'], Modulos: ['cursoId', 'ordem', 'nome'],
  Matriculas: ['alunoId', 'cursoId', 'dia', 'inicio', 'modalidade', 'status'],
  Aulas: ['data', 'matriculaId', 'tipo'], Progresso: ['matriculaId', 'moduloId', 'concluidoEm'],
  Pontos: ['data', 'alunoId', 'tipo', 'pontos'], Premios: ['nome', 'custo'],
  Professores: ['nome'], Escala: ['professorId', 'dia', 'inicio', 'fim']
};
const VALORES = {
  'Aulas.tipo': ['Regular', 'Reposição', 'Avulsa', 'Experimental'],
  'Aulas.status': ['', 'Presente', 'Falta', 'Reposição agendada', 'Reposição realizada'],
  'Aulas.modalidade': ['', 'Presencial', 'Online'],
  'Matriculas.status': ['Ativa', 'Concluída', 'Trancada', 'Experimental'],
  'Matriculas.modalidade': ['Presencial', 'Online'],
  'Matriculas.dia': ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  'Pontos.tipo': ['Ganho (módulo)', 'Ganho (manual)', 'Resgate'],
  'Escala.dia': ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
};
// Não deixa excluir um registro se outro aponta para ele
const REFERENCIAS = {
  Alunos: [['Matriculas', 'alunoId'], ['Pontos', 'alunoId']],
  Cursos: [['Matriculas', 'cursoId'], ['Modulos', 'cursoId'], ['Escala', 'cursoId']],
  Professores: [['Escala', 'professorId']],
  Modulos: [['Progresso', 'moduloId']],
  Matriculas: [['Aulas', 'matriculaId'], ['Progresso', 'matriculaId']]
};
const CONFIG_CHAVES = {
  'Nome da escola': 'nomeEscola', 'Pontos padrão por módulo': 'pontosPadrao', 'Ranking de faltas: janela (dias)': 'rankingDias',
  'Grade: hora inicial': 'gradeInicio', 'Grade: hora final': 'gradeFim', 'Cor: aulas online': 'corOnline',
  'Cor: reposições': 'corReposicao', 'Cor: aula experimental': 'corExperimental',
  'Recurso: pontos e recompensas': 'recursoPontos', 'Recurso: professores e escala': 'recursoProfessores', 'Recurso: aulas experimentais': 'recursoExperimentais'
};
// Funcionalidades ligáveis/desligáveis (valor Sim/Não na aba Config; sem a linha, a funcionalidade fica ligada)
function ehRecurso(chave) { return chave.indexOf('recurso') === 0; }
function simNao(v) { return ['não', 'nao', 'false', '0', 'n'].indexOf(String(v).trim().toLowerCase()) === -1; }

/* ---------- entrada ---------- */

function doGet() {
  return saida({ ok: true, msg: 'API da escola ativa. Use POST.' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const usuario = autenticar(req.token);
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      return saida(executar(req, usuario));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return saida({ ok: false, code: err.code || 'ERRO', error: String(err.message || err) });
  }
}

// Rode UMA vez no editor (botão Executar) para o Google pedir as permissões necessárias.
function autorizar() {
  UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=teste', { muteHttpExceptions: true });
  Logger.log('Autorizado para: ' + planilha().getName());
}

function executar(req, u) {
  switch (req.action) {
    case 'entrar':
      return { ok: true, sessao: criarSessao(u.email) };
    case 'sair':
      encerrarSessao(req.token);
      return { ok: true };
    case 'carregar':
      return carregar(u);
    case 'salvar': {
      exigir(u, QUEM_GRAVA[req.tabela]);
      const reg = req.registro || {};
      if (req.tabela === 'Pontos' && u.perfil !== 'Admin') {
        if (reg.tipo !== 'Ganho (manual)') throw falha('FORBIDDEN', 'Seu perfil só pode lançar pontos manuais.');
        const T = lerTabela('Pontos');
        const atual = T.registros.find(function (r) { return r.id === reg.id; });
        if (atual && atual.tipo !== 'Ganho (manual)') throw falha('FORBIDDEN', 'Este lançamento só pode ser alterado por um Admin.');
      }
      const salvo = salvarRegistro(req.tabela, reg, u);
      return { ok: true, id: salvo.id, registro: salvo };
    }
    case 'excluir': {
      exigir(u, QUEM_GRAVA[req.tabela]);
      if (req.tabela === 'Pontos' && u.perfil !== 'Admin') {
        const T = lerTabela('Pontos');
        const atual = T.registros.find(function (r) { return r.id === req.id; });
        if (atual && atual.tipo !== 'Ganho (manual)') throw falha('FORBIDDEN', 'Este lançamento só pode ser excluído por um Admin.');
      }
      excluirRegistro(req.tabela, req.id);
      return { ok: true };
    }
    case 'concluirModulo':
      exigir(u, ['Admin', 'Professor']);
      return concluirModulo(req, u);
    case 'resgatar':
      exigir(u, ['Admin', 'Professor']);
      return resgatar(req.alunoId, req.premioId, u);
    case 'criarExperimental':
      exigir(u, ['Admin', 'Professor']);
      return criarExperimental(req, u);
    case 'salvarConfig':
      exigir(u, ['Admin']);
      return salvarConfig(req.config || {});
    default:
      throw falha('ERRO', 'Ação desconhecida: ' + req.action);
  }
}

/* ---------- autenticação (login Google) ---------- */

// Sessão própria: depois de entrar com a conta Google uma vez, o app guarda um código de sessão (válido por SESSAO_DIAS)
// e não precisa mais pedir o login do Google. O código de sessão começa com 'S1.'.
const SESSAO_DIAS = 180;
function hashDe(txt) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, txt));
}
function emailDaSessao(token) {
  const cache = CacheService.getScriptCache();
  const chave = 'ss_' + hashDe(token);
  const emCache = cache.get(chave);
  if (emCache) return emCache;
  const props = PropertiesService.getScriptProperties();
  const bruto = props.getProperty('sess_' + hashDe(token));
  if (!bruto) throw falha('AUTH', 'Sua sessão expirou. Entre novamente.');
  const s = JSON.parse(bruto);
  if (Number(s.exp) <= Date.now()) {
    props.deleteProperty('sess_' + hashDe(token));
    throw falha('AUTH', 'Sua sessão expirou. Entre novamente.');
  }
  cache.put(chave, s.email, 300);
  return s.email;
}
function criarSessao(email) {
  const props = PropertiesService.getScriptProperties();
  const todas = props.getProperties();
  Object.keys(todas).forEach(function (k) {
    if (k.indexOf('sess_') !== 0) return;
    try { if (Number(JSON.parse(todas[k]).exp) <= Date.now()) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); }
  });
  const token = 'S1.' + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('sess_' + hashDe(token), JSON.stringify({ email: email, exp: Date.now() + SESSAO_DIAS * 24 * 3600 * 1000 }));
  return token;
}
function encerrarSessao(token) {
  if (!token || String(token).indexOf('S1.') !== 0) return;
  PropertiesService.getScriptProperties().deleteProperty('sess_' + hashDe(token));
  CacheService.getScriptCache().remove('ss_' + hashDe(token));
}

function autenticar(token) {
  if (!token) throw falha('AUTH', 'Faça login para continuar.');
  const cache = CacheService.getScriptCache();
  const sessao = String(token).indexOf('S1.') === 0;
  const chave = 'tk_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  let email = sessao ? emailDaSessao(token) : cache.get(chave);
  if (!email) {
    const resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) throw falha('AUTH', 'Sessão inválida ou expirada. Entre novamente.');
    const info = JSON.parse(resp.getContentText());
    const agora = Math.floor(Date.now() / 1000);
    if (info.aud !== CLIENT_ID) throw falha('AUTH', 'Token de outro aplicativo.');
    if (String(info.email_verified) !== 'true') throw falha('AUTH', 'E-mail não verificado.');
    if (Number(info.exp) <= agora) throw falha('AUTH', 'Sessão expirada. Entre novamente.');
    email = String(info.email).toLowerCase();
    cache.put(chave, email, Math.max(30, Math.min(600, Number(info.exp) - agora - 30)));
  }
  const linha = lerTabela('Usuarios').registros.find(function (r) { return String(r.email).toLowerCase() === email; });
  if (!linha || String(linha.ativo).toLowerCase() === 'não' || String(linha.ativo).toLowerCase() === 'nao') {
    throw falha('NOUSER', 'O e-mail ' + email + ' não tem acesso. Peça para ser incluído na aba Usuarios.');
  }
  return { email: email, nome: linha.nome || email, perfil: linha.perfil || 'Consulta' };
}

function exigir(u, perfis) {
  if (!perfis || perfis.indexOf(u.perfil) === -1) throw falha('FORBIDDEN', 'Seu perfil (' + u.perfil + ') não pode fazer esta alteração.');
}

/* ---------- utilidades ---------- */

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function falha(code, msg) {
  const e = new Error(msg);
  e.code = code;
  return e;
}
function planilha() { return SpreadsheetApp.getActiveSpreadsheet(); }
function fuso() { return planilha().getSpreadsheetTimeZone(); }
function hojeIso() { return Utilities.formatDate(new Date(), fuso(), 'yyyy-MM-dd'); }
function novoId(nome) { return PREFIXO[nome] + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); }
function siglaDia(iso) {
  const p = iso.split('-');
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
}

function paraIso(v) {
  if (v instanceof Date) return Utilities.formatDate(v, fuso(), 'yyyy-MM-dd');
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}
function paraHora(v) {
  if (v instanceof Date) return Utilities.formatDate(v, fuso(), 'HH:mm');
  const m = String(v || '').trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : '';
}
function paraNumero(v) {
  if (typeof v === 'number') return v;
  let s = String(v || '').replace(/\s/g, '');
  if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function deCelula(tipo, v) {
  if (v === '' || v === null || v === undefined) return tipo === 'n' ? null : '';
  if (tipo === 'n') return paraNumero(v);
  if (tipo === 'd') return paraIso(v);
  if (tipo === 'h') return paraHora(v);
  return String(v).trim();
}
function paraCelula(tipo, v) {
  if (v === '' || v === null || v === undefined) return '';
  if (tipo === 'n') return Number(v);
  if (tipo === 'd') {
    const p = String(v).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
  }
  return String(v);
}

/* ---------- leitura e escrita genéricas ---------- */

// A aba Aulas ganhou a coluna K "ProfessorID" (professor responsável pela aula experimental). Em planilhas antigas ela é
// criada sozinha na primeira leitura, empurrando as colunas calculadas (Aluno, Curso) para a direita.
let _colunaProfessorOk = false;
function garantirColunaProfessorAulas() {
  if (_colunaProfessorOk) return;
  const sh = planilha().getSheetByName('Aulas');
  if (sh) {
    if (String(sh.getRange(1, 11).getValue()).indexOf('ProfessorID') !== 0) {
      sh.insertColumnBefore(11);
      sh.getRange(1, 10).copyTo(sh.getRange(1, 11), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      sh.getRange(1, 11).setValue('ProfessorID (aula experimental)');
      sh.setColumnWidth(11, 180);
      sh.getRange(2, 11, Math.max(sh.getMaxRows() - 1, 1), 1).clearContent().clearDataValidations();
    }
  }
  _colunaProfessorOk = true;
}

function lerTabela(nome) {
  if (nome === 'Aulas') garantirColunaProfessorAulas();
  const campos = SCHEMA[nome];
  const n = campos.length;
  const sh = planilha().getSheetByName(nome);
  if (!sh && OPCIONAIS.indexOf(nome) > -1) return { sh: null, registros: [], linhas: [], livre: 2 };
  if (!sh) throw falha('ERRO', 'A aba "' + nome + '" não existe na planilha.');
  const max = sh.getMaxRows();
  const valores = max > 1 ? sh.getRange(2, 1, max - 1, n).getValues() : [];
  const registros = [];
  const linhas = [];
  const semId = [];
  let livre = -1;
  valores.forEach(function (row, i) {
    const vazio = row.every(function (v) { return v === '' || v === null; });
    if (vazio) { if (livre === -1) livre = i; return; }
    const reg = {};
    campos.forEach(function (c, j) { reg[c[0]] = deCelula(c[1], row[j]); });
    if (nome !== 'Usuarios' && !reg.id) { reg.id = novoId(nome); semId.push([i + 2, reg.id]); }
    registros.push(reg);
    linhas.push(i + 2);
  });
  semId.forEach(function (p) { sh.getRange(p[0], 1).setValue(p[1]); });
  return { sh: sh, registros: registros, linhas: linhas, livre: livre === -1 ? max + 1 : livre + 2 };
}

function gravarLinha(nome, T, linha, reg) {
  const campos = SCHEMA[nome];
  const sh = T.sh;
  if (!sh) throw falha('ERRO', 'A aba "' + nome + '" ainda não existe. Rode a função prepararNovidades no Apps Script.');
  if (linha > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 50);
  // a coluna cursoId da Escala guarda a área (ex.: "area:Inglês"); uma lista de validação antiga com os IDs dos cursos bloquearia a gravação
  if (nome === 'Escala') sh.getRange(linha, 6).clearDataValidations();
  campos.forEach(function (c, j) {
    if (c[1] === 'h') sh.getRange(linha, j + 1).setNumberFormat('@');
    if (c[1] === 'd') sh.getRange(linha, j + 1).setNumberFormat('dd/mm/yyyy');
  });
  sh.getRange(linha, 1, 1, campos.length).setValues([campos.map(function (c) { return paraCelula(c[1], reg[c[0]]); })]);
}

function validar(nome, reg) {
  (OBRIGATORIOS[nome] || []).forEach(function (k) {
    if (reg[k] === '' || reg[k] === null || reg[k] === undefined) throw falha('VALIDACAO', 'Campo obrigatório: ' + k + ' (' + nome + ').');
  });
  SCHEMA[nome].forEach(function (c) {
    const v = reg[c[0]];
    if (c[1] === 'd' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw falha('VALIDACAO', 'Data inválida em ' + c[0] + '.');
    if (c[1] === 'n' && v !== '' && v !== null && v !== undefined && isNaN(Number(v))) throw falha('VALIDACAO', 'Número inválido em ' + c[0] + '.');
  });
  Object.keys(VALORES).forEach(function (chave) {
    const p = chave.split('.');
    if (p[0] !== nome) return;
    const v = reg[p[1]] === undefined || reg[p[1]] === null ? '' : String(reg[p[1]]);
    if (VALORES[chave].indexOf(v) === -1) throw falha('VALIDACAO', 'Valor inválido em ' + p[1] + ': "' + v + '".');
  });
  if (nome === 'Pontos' && !(Number(reg.pontos) > 0)) throw falha('VALIDACAO', 'Pontos deve ser maior que zero.');
  if (nome === 'Premios' && !(Number(reg.custo) > 0)) throw falha('VALIDACAO', 'O custo deve ser maior que zero.');
  if (nome === 'Escala') {
    const h = function (x) { const m = String(x).match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };
    if (h(reg.inicio) < 0 || h(reg.fim) < 0) throw falha('VALIDACAO', 'Horário inválido na escala.');
    if (h(reg.fim) <= h(reg.inicio)) throw falha('VALIDACAO', 'O horário final deve ser depois do inicial.');
  }
}

function salvarRegistro(nome, reg, usuario) {
  if (!SCHEMA[nome] || nome === 'Usuarios') throw falha('ERRO', 'Tabela inválida: ' + nome);
  validar(nome, reg);
  const T = lerTabela(nome);
  let i = reg.id ? T.registros.findIndex(function (r) { return r.id === reg.id; }) : -1;
  // evita duplicar a marcação de uma mesma aula regular (mesma matrícula e data)
  if (i === -1 && nome === 'Aulas' && (reg.tipo || 'Regular') === 'Regular') {
    i = T.registros.findIndex(function (r) {
      return r.matriculaId === reg.matriculaId && r.data === reg.data && (r.tipo || 'Regular') === 'Regular';
    });
  }
  let id, linha;
  if (i >= 0) {
    id = T.registros[i].id;
    linha = T.linhas[i];
  } else {
    const ok = reg.id && /^[A-Z]{1,3}[0-9A-Z]{3,12}$/.test(reg.id) && !T.registros.some(function (r) { return r.id === reg.id; });
    id = ok ? reg.id : novoId(nome);
    linha = T.livre;
  }
  const final = Object.assign({}, reg, { id: id });
  if (nome === 'Pontos' && i === -1) final.registradoPor = usuario.email;
  gravarLinha(nome, T, linha, final);
  return final;
}

function excluirRegistro(nome, id) {
  if (!SCHEMA[nome] || nome === 'Usuarios') throw falha('ERRO', 'Tabela inválida: ' + nome);
  (REFERENCIAS[nome] || []).forEach(function (ref) {
    const T2 = lerTabela(ref[0]);
    if (T2.registros.some(function (r) { return r[ref[1]] === id; })) {
      throw falha('REFERENCIA', 'Não dá para excluir: há registros em ' + ref[0] + ' ligados a este item. Desative ou encerre em vez de excluir.');
    }
  });
  const T = lerTabela(nome);
  const i = T.registros.findIndex(function (r) { return r.id === id; });
  if (i === -1) throw falha('ERRO', 'Registro não encontrado. Recarregue a página.');
  if (!T.sh) throw falha('ERRO', 'Aba inexistente.');
  T.sh.getRange(T.linhas[i], 1, 1, SCHEMA[nome].length).clearContent();
}

function lerConfig() {
  const cfg = {};
  const sh = planilha().getSheetByName('Config');
  if (!sh || sh.getLastRow() < 2) return cfg;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
    const k = CONFIG_CHAVES[String(r[0]).trim()];
    if (k && r[1] !== '') cfg[k] = ehRecurso(k) ? simNao(r[1]) : r[1];
  });
  return cfg;
}

// Grava na aba Config (colunas: Parâmetro | Valor | O que faz) só os parâmetros conhecidos de CONFIG_CHAVES.
function salvarConfig(cfg) {
  const sh = planilha().getSheetByName('Config');
  if (!sh) throw falha('ERRO', 'A aba Config não existe na planilha.');
  const COR = /^#[0-9a-fA-F]{6}$/;
  const validar = {
    nomeEscola: function (v) { v = String(v).trim(); if (!v || v.length > 60) throw falha('ERRO', 'Nome da escola: de 1 a 60 caracteres.'); return v; },
    pontosPadrao: function (v) { v = Number(v); if (!isFinite(v) || v < 0 || Math.floor(v) !== v) throw falha('ERRO', 'Pontos padrão: número inteiro, 0 ou mais.'); return v; },
    rankingDias: function (v) { v = Number(v); if (!isFinite(v) || v < 1 || Math.floor(v) !== v) throw falha('ERRO', 'Janela do ranking: número inteiro de dias, 1 ou mais.'); return v; },
    gradeInicio: function (v) { v = Number(v); if (!isFinite(v) || v < 0 || v > 23) throw falha('ERRO', 'Hora inicial inválida.'); return v; },
    gradeFim: function (v) { v = Number(v); if (!isFinite(v) || v < 1 || v > 24) throw falha('ERRO', 'Hora final inválida.'); return v; },
    corOnline: corValida, corReposicao: corValida, corExperimental: corValida,
    recursoPontos: boolSim, recursoProfessores: boolSim, recursoExperimentais: boolSim
  };
  function boolSim(v) { return v === true || String(v).trim().toLowerCase() === 'sim' || String(v).trim().toLowerCase() === 'true' ? 'Sim' : 'Não'; }
  function corValida(v) { v = String(v).trim(); if (!COR.test(v)) throw falha('ERRO', 'Cor inválida (use o formato #RRGGBB).'); return v.toUpperCase(); }
  const ultima = sh.getLastRow();
  const rotulos = ultima > 1 ? sh.getRange(2, 1, ultima - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  let proxima = Math.max(ultima, 1) + 1;
  Object.keys(CONFIG_CHAVES).forEach(function (rotulo) {
    const chave = CONFIG_CHAVES[rotulo];
    if (!(chave in cfg) || !validar[chave]) return;
    const valor = validar[chave](cfg[chave]);
    const i = rotulos.indexOf(rotulo);
    if (i === -1) { sh.getRange(proxima, 1, 1, 2).setValues([[rotulo, valor]]); proxima += 1; }
    else sh.getRange(i + 2, 2).setValue(valor);
  });
  return { ok: true, config: lerConfig() };
}

function carregar(u) {
  const dados = {};
  Object.keys(CHAVE_DADOS).forEach(function (nome) { dados[CHAVE_DADOS[nome]] = lerTabela(nome).registros; });
  return { ok: true, eu: u, dados: dados, config: lerConfig() };
}

/* ---------- ações compostas ---------- */

// Pontos ao concluir o módulo = pontos do módulo (ou o padrão da Config) + bônus de bom comportamento
const BONUS_BOM_COMPORTAMENTO = 10;

function concluirModulo(req, u) {
  const matriculaId = req.matriculaId;
  const bom = req.bomComportamento === true || String(req.bomComportamento) === 'true';
  const obsModulo = String(req.obs || '').slice(0, 300);
  const TM = lerTabela('Matriculas');
  const mat = TM.registros.find(function (r) { return r.id === matriculaId; });
  if (!mat) throw falha('ERRO', 'Matrícula não encontrada.');
  if (mat.status !== 'Ativa') throw falha('VALIDACAO', 'Só é possível concluir módulos de matrículas ativas.');
  const modulos = lerTabela('Modulos').registros
    .filter(function (m) { return m.cursoId === mat.cursoId; })
    .sort(function (a, b) { return a.ordem - b.ordem; });
  const atual = modulos.find(function (m) { return Number(m.ordem) === Number(mat.moduloAtual); });
  if (!atual) throw falha('VALIDACAO', 'O módulo atual não existe no curso. Confira a aba Modulos.');
  const prog = lerTabela('Progresso').registros;
  if (prog.some(function (p) { return p.matriculaId === mat.id && p.moduloId === atual.id; })) {
    throw falha('VALIDACAO', 'Este módulo já foi concluído.');
  }
  const curso = lerTabela('Cursos').registros.find(function (c) { return c.id === mat.cursoId; });
  const cfg = lerConfig();
  const hoje = hojeIso();

  const progresso = salvarRegistro('Progresso', { matriculaId: mat.id, moduloId: atual.id, concluidoEm: hoje, obs: obsModulo }, u);
  const base = atual.pontos !== null && atual.pontos !== '' ? Number(atual.pontos) : Number(cfg.pontosPadrao || 10);
  const pts = base + (bom ? BONUS_BOM_COMPORTAMENTO : 0);
  let pontos = null;
  const jaTem = lerTabela('Pontos').registros.some(function (p) {
    return p.alunoId === mat.alunoId && p.moduloId === atual.id && p.tipo === 'Ganho (módulo)';
  });
  if (pts > 0 && !jaTem && cfg.recursoPontos !== false) {
    pontos = salvarRegistro('Pontos', {
      data: hoje, alunoId: mat.alunoId, tipo: 'Ganho (módulo)', pontos: pts,
      descricao: 'Concluiu o módulo ' + atual.ordem + ' de ' + (curso ? curso.nome : '') + (bom ? ' (bom comportamento)' : ''), moduloId: atual.id
    }, u);
  }
  const proximo = modulos.find(function (m) { return Number(m.ordem) > Number(atual.ordem); });
  const novaMat = Object.assign({}, mat);
  if (proximo) novaMat.moduloAtual = proximo.ordem; else novaMat.status = 'Concluída';
  salvarRegistro('Matriculas', novaMat, u);

  const mudancas = { matriculas: [novaMat], progresso: [progresso] };
  if (pontos) mudancas.pontos = [pontos];
  return { ok: true, mudancas: mudancas, pontosGanhos: pontos ? pts : 0, concluiuCurso: !proximo };
}

function resgatar(alunoId, premioId, u) {
  const premio = lerTabela('Premios').registros.find(function (p) { return p.id === premioId; });
  if (!premio || String(premio.ativo).toLowerCase() === 'não') throw falha('VALIDACAO', 'Prêmio não disponível.');
  const aluno = lerTabela('Alunos').registros.find(function (a) { return a.id === alunoId; });
  if (!aluno) throw falha('VALIDACAO', 'Aluno não encontrado.');
  let saldo = 0;
  lerTabela('Pontos').registros.forEach(function (p) {
    if (p.alunoId !== alunoId) return;
    if (p.tipo === 'Resgate') saldo -= Number(p.pontos); else saldo += Number(p.pontos);
  });
  if (saldo < Number(premio.custo)) throw falha('VALIDACAO', 'Saldo insuficiente: ' + saldo + ' ponto(s), o prêmio custa ' + premio.custo + '.');
  const reg = salvarRegistro('Pontos', {
    data: hojeIso(), alunoId: alunoId, tipo: 'Resgate', pontos: Number(premio.custo), descricao: 'Resgate: ' + premio.nome, moduloId: ''
  }, u);
  return { ok: true, mudancas: { pontos: [reg] } };
}

function criarExperimental(req, u) {
  if (!req.nome || !String(req.nome).trim()) throw falha('VALIDACAO', 'Informe o nome do aluno.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.data || '')) throw falha('VALIDACAO', 'Data inválida.');
  if (!/^\d{1,2}:\d{2}$/.test(req.hora || '')) throw falha('VALIDACAO', 'Hora inválida.');
  const curso = lerTabela('Cursos').registros.find(function (c) { return c.id === req.cursoId; });
  if (!curso) throw falha('VALIDACAO', 'Curso não encontrado.');
  const modalidade = req.modalidade === 'Online' ? 'Online' : 'Presencial';
  const professorId = String(req.professorId || '').trim();
  if (professorId && !lerTabela('Professores').registros.some(function (p) { return p.id === professorId; })) throw falha('VALIDACAO', 'Professor não encontrado.');
  const aluno = salvarRegistro('Alunos', { nome: String(req.nome).trim(), responsavel: '', contato: req.contato || '', ativo: 'Não', obs: 'Aula experimental' }, u);
  const mat = salvarRegistro('Matriculas', {
    alunoId: aluno.id, cursoId: curso.id, dia: siglaDia(req.data), inicio: req.hora, duracao: Number(req.duracao) || 60,
    modalidade: modalidade, moduloAtual: 1, dataInicio: req.data, status: 'Experimental', obs: ''
  }, u);
  const aula = salvarRegistro('Aulas', {
    data: req.data, matriculaId: mat.id, status: '', tipo: 'Experimental', hora: req.hora, modalidade: '', modulo: 1, reposicaoDe: '', obs: '', professorId: professorId
  }, u);
  return { ok: true, mudancas: { alunos: [aluno], matriculas: [mat], aulas: [aula] } };
}

/* ---------- atualização de uma planilha já em uso ---------- */

// Rode UMA vez (botão Executar) se a sua planilha foi criada antes dos professores e do grupo da legenda.
// Cria as abas Professores e Escala e a coluna "Grupo (legenda)" em Cursos, sem mexer nos seus dados.
function prepararNovidades() {
  const ss = planilha();
  const ATE = 500;
  const cabecalho = function (sh, titulos, larguras) {
    sh.getRange(1, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#111111').setHorizontalAlignment('center');
    larguras.forEach(function (w, i) { sh.setColumnWidth(i + 1, w * 7); });
    sh.setFrozenRows(1);
  };
  const lista = function (sh, col, valores) {
    sh.getRange(2, col, ATE - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(false).build());
  };
  const ref = function (sh, col, intervalo) {
    sh.getRange(2, col, ATE - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(ss.getRange(intervalo), true).setAllowInvalid(false).build());
  };
  const busca = function (aba, colRet, chave) {
    const f = [];
    for (let r = 2; r <= ATE; r++) f.push(['=IFERROR(INDEX(' + aba + '!$' + colRet + '$2:$' + colRet + '$' + ATE + ',MATCH(' + chave + r + ',' + aba + '!$A$2:$A$' + ATE + ',0)),"")']);
    return f;
  };

  if (!ss.getSheetByName('Professores')) {
    const sh = ss.insertSheet('Professores');
    cabecalho(sh, ['ID', 'Nome', 'Contato', 'Cor (hex)', 'Ativo', 'Observações'], [12, 30, 22, 14, 10, 40]);
    lista(sh, 5, ['Sim', 'Não']);
  }
  if (!ss.getSheetByName('Escala')) {
    const sh = ss.insertSheet('Escala');
    cabecalho(sh, ['ID', 'ProfessorID', 'Dia', 'Início', 'Fim', 'Área (ou CursoID)', 'Observações', 'Professor', 'Curso'], [12, 14, 8, 10, 10, 20, 32, 26, 28]);
    sh.getRange(2, 4, ATE - 1, 2).setNumberFormat('@');
    lista(sh, 3, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    ref(sh, 2, 'Professores!A2:A' + ATE);
    sh.getRange(2, 8, ATE - 1, 1).setFormulas(busca('Professores', 'B', 'B'));
    sh.getRange(2, 9, ATE - 1, 1).setFormulas(busca('Cursos', 'B', 'F'));
  }
  garantirColunaProfessorAulas();
  const escala = ss.getSheetByName('Escala');
  if (escala) {
    escala.getRange(2, 6, ATE - 1, 1).clearDataValidations();
    escala.getRange(1, 6).setValue('Área (ou CursoID)');
  }
  const cursos = ss.getSheetByName('Cursos');
  if (cursos && !String(cursos.getRange(1, 5).getValue()).trim()) {
    cursos.getRange(1, 4).copyTo(cursos.getRange(1, 5), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    cursos.getRange(1, 5).setValue('Grupo (legenda)');
    cursos.setColumnWidth(5, 170);
  }
  Logger.log('Planilha atualizada. Agora crie uma nova versão da implantação (Implantar > Gerenciar implantações).');
}
