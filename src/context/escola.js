import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import PropTypes from "prop-types";

import api, { isDemo } from "services/api";
import { DEFAULT_CONFIG, novoId, recursoLigado } from "utils/escola";

const EscolaContext = createContext();
EscolaContext.displayName = "EscolaContext";

const CHAVE = { Alunos: "alunos", Professores: "professores", Escala: "escala", Cursos: "cursos", Modulos: "modulos", Matriculas: "matriculas", Aulas: "aulas", Progresso: "progresso", Pontos: "pontos", Premios: "premios", Migracao: "migracao", Movimentacoes: "movimentacoes", Avaliacoes: "avaliacoes", Feriados: "feriados" };
const PREFIXO = { Alunos: "A", Professores: "PRF", Escala: "ESC", Cursos: "C", Modulos: "MOD", Matriculas: "MAT", Aulas: "AUL", Progresso: "PRG", Pontos: "P", Premios: "PR", Migracao: "MIG", Movimentacoes: "MOV", Avaliacoes: "AVA", Feriados: "FER" };
const VAZIO = { alunos: [], professores: [], escala: [], cursos: [], modulos: [], matriculas: [], aulas: [], progresso: [], pontos: [], premios: [], migracao: [], movimentacoes: [], avaliacoes: [], feriados: [], config: DEFAULT_CONFIG };

const TOKEN_KEY = "escola-id-token";

/* ---------- token do login Google (ID token / JWT) ---------- */
export function lerPayload(token) {
  try {
    const base = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
// Código de sessão (começa com "S1."), emitido pelo Apps Script depois do primeiro login Google.
// Fica guardado no navegador, então o login com a conta Google só é pedido uma vez (até sair ou a sessão vencer).
function tokenGuardado() {
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t && t.startsWith("S1.")) return t;
  } catch (e) {
    // sem localStorage
  }
  return null;
}
function guardarToken(t) {
  try {
    if (t) window.localStorage.setItem(TOKEN_KEY, t);
    else window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignora
  }
}

/* ---------- estado ---------- */
const initial = { fase: "inicio", erro: null, user: null, dados: VAZIO, pendentes: 0 };

function upsertLista(lista, reg) {
  const i = lista.findIndex((r) => r.id === reg.id);
  if (i === -1) return [...lista, reg];
  const copia = lista.slice();
  copia[i] = reg;
  return copia;
}

function reducer(state, action) {
  switch (action.type) {
    case "FASE":
      return { ...state, fase: action.fase, erro: action.erro === undefined ? state.erro : action.erro };
    case "CARREGADO":
      return { ...state, fase: "pronto", erro: null, user: action.user, dados: { ...VAZIO, ...action.dados, config: { ...DEFAULT_CONFIG, ...action.config } } };
    case "ERRO":
      return { ...state, erro: action.value };
    case "CONFIG":
      return { ...state, dados: { ...state.dados, config: { ...DEFAULT_CONFIG, ...action.config } } };
    case "UPSERT": {
      const k = CHAVE[action.tabela];
      return { ...state, dados: { ...state.dados, [k]: upsertLista(state.dados[k], action.registro) } };
    }
    case "REMOVE": {
      const k = CHAVE[action.tabela];
      return { ...state, dados: { ...state.dados, [k]: state.dados[k].filter((r) => r.id !== action.id) } };
    }
    case "MERGE": {
      let dados = state.dados;
      Object.keys(action.mudancas || {}).forEach((k) => {
        dados = { ...dados, [k]: action.mudancas[k].reduce(upsertLista, dados[k]) };
      });
      return { ...state, dados };
    }
    case "PENDING":
      return { ...state, pendentes: Math.max(0, state.pendentes + action.delta) };
    case "SAIR":
      return { ...initial, fase: "login", erro: action.erro || null };
    default:
      throw new Error(`Ação desconhecida: ${action.type}`);
  }
}

export function EscolaProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const tokenRef = useRef(null);

  const sair = useCallback((mensagem) => {
    if (tokenRef.current && !isDemo) api.sair(tokenRef.current).catch(() => {});
    guardarToken(null);
    tokenRef.current = null;
    dispatch({ type: "SAIR", erro: mensagem || null });
  }, []);

  const tratarFalha = useCallback(
    (e, silencioso) => {
      if (e.code === "AUTH") return sair("Sua sessão expirou. Entre novamente.");
      if (e.code === "NOUSER") {
        guardarToken(null);
        tokenRef.current = null;
        return dispatch({ type: "FASE", fase: "negado", erro: e.message });
      }
      if (silencioso) return dispatch({ type: "ERRO", value: `Não foi possível atualizar: ${e.message}` });
      return dispatch({ type: "FASE", fase: "erro", erro: `Não foi possível carregar os dados: ${e.message}` });
    },
    [sair]
  );

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) dispatch({ type: "FASE", fase: "carregando", erro: null });
      try {
        const r = await api.carregar(tokenRef.current);
        dispatch({ type: "CARREGADO", user: r.eu, dados: r.dados, config: r.config });
      } catch (e) {
        tratarFalha(e, silencioso);
      }
    },
    [tratarFalha]
  );

  useEffect(() => {
    if (isDemo) {
      carregar();
      return;
    }
    const t = tokenGuardado();
    if (t) {
      tokenRef.current = t;
      carregar();
    } else {
      dispatch({ type: "FASE", fase: "login" });
    }
  }, [carregar]);

  const entrar = useCallback(
    async (credential) => {
      dispatch({ type: "FASE", fase: "carregando", erro: null });
      try {
        // troca o login do Google por uma sessão própria, que dura meses
        const r = await api.entrar(credential);
        guardarToken(r.sessao);
        tokenRef.current = r.sessao;
        carregar();
      } catch (e) {
        tratarFalha(e, false);
      }
    },
    [carregar, tratarFalha]
  );

  // atualização automática (vários professores usando ao mesmo tempo)
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      if (s.fase === "pronto" && s.pendentes === 0 && !document.hidden) carregar(true);
    }, 120000);
    return () => clearInterval(id);
  }, [carregar]);

  /* ----- gravações com atualização imediata na tela e desfazer se falhar ----- */
  const executar = useCallback(
    async (otimista, desfazer, requisicao) => {
      dispatch(otimista);
      dispatch({ type: "PENDING", delta: 1 });
      dispatch({ type: "ERRO", value: null });
      try {
        const dados = await requisicao();
        return { ok: true, dados };
      } catch (e) {
        dispatch(desfazer);
        if (e.code === "AUTH") sair("Sua sessão expirou. Entre novamente.");
        else dispatch({ type: "ERRO", value: `Não foi possível salvar: ${e.message}` });
        return { ok: false };
      } finally {
        dispatch({ type: "PENDING", delta: -1 });
      }
    },
    [sair]
  );

  // devolve o id do registro salvo (ou null se falhou)
  const salvar = useCallback(
    async (tabela, registro) => {
      const id = registro.id || novoId(PREFIXO[tabela]);
      const novo = { ...registro, id };
      const anterior = stateRef.current.dados[CHAVE[tabela]].find((r) => r.id === id);
      const r = await executar(
        { type: "UPSERT", tabela, registro: novo },
        anterior ? { type: "UPSERT", tabela, registro: anterior } : { type: "REMOVE", tabela, id },
        () => api.salvar(tokenRef.current, tabela, novo)
      );
      if (!r.ok) return null;
      const idServidor = r.dados && r.dados.id;
      if (idServidor && idServidor !== id) {
        dispatch({ type: "REMOVE", tabela, id });
        dispatch({ type: "UPSERT", tabela, registro: { ...novo, id: idServidor } });
      }
      return idServidor || id;
    },
    [executar]
  );

  const excluir = useCallback(
    async (tabela, id) => {
      const anterior = stateRef.current.dados[CHAVE[tabela]].find((r) => r.id === id);
      if (!anterior) return false;
      const r = await executar(
        { type: "REMOVE", tabela, id },
        { type: "UPSERT", tabela, registro: anterior },
        () => api.excluir(tokenRef.current, tabela, id)
      );
      return r.ok;
    },
    [executar]
  );

  // ações que mexem em várias linhas: o servidor devolve o que mudou
  const composto = useCallback(
    async (chamada) => {
      dispatch({ type: "PENDING", delta: 1 });
      dispatch({ type: "ERRO", value: null });
      try {
        const r = await chamada();
        dispatch({ type: "MERGE", mudancas: r.mudancas });
        return { ok: true, ...r };
      } catch (e) {
        if (e.code === "AUTH") sair("Sua sessão expirou. Entre novamente.");
        else dispatch({ type: "ERRO", value: e.message });
        return { ok: false, erro: e.message };
      } finally {
        dispatch({ type: "PENDING", delta: -1 });
      }
    },
    [sair]
  );

  const concluirModulo = useCallback((matriculaId, opts) => composto(() => api.concluirModulo(tokenRef.current, matriculaId, opts)), [composto]);
  const resgatar = useCallback((alunoId, premioId) => composto(() => api.resgatar(tokenRef.current, alunoId, premioId)), [composto]);
  // grava os parâmetros da aba Config; devolve { ok, erro } para a tela mostrar a mensagem
  const salvarConfig = useCallback(
    async (config) => {
      dispatch({ type: "PENDING", delta: 1 });
      try {
        const r = await api.salvarConfig(tokenRef.current, config);
        dispatch({ type: "CONFIG", config: r.config });
        return { ok: true };
      } catch (e) {
        if (e.code === "AUTH") sair("Sua sessão expirou. Entre novamente.");
        return { ok: false, erro: e.message };
      } finally {
        dispatch({ type: "PENDING", delta: -1 });
      }
    },
    [sair]
  );

  // saída, trancamento e retorno de matrículas (guarda o histórico em Movimentacoes)
  const movimentar = useCallback((form) => composto(() => api.movimentar(tokenRef.current, form)), [composto]);
  // avaliação final do curso (pode concluir o curso junto)
  const salvarAvaliacaoFinal = useCallback((form) => composto(() => api.avaliacaoFinal(tokenRef.current, form)), [composto]);

  // nota de um módulo já concluído
  const salvarNotaModulo = useCallback((form) => composto(() => api.notaModulo(tokenRef.current, form)), [composto]);

  const criarExperimental = useCallback((form) => composto(() => api.criarExperimental(tokenRef.current, form)), [composto]);

  /* ----- marcações da grade ----- */
  const moduloDa = useCallback((matriculaId) => {
    const m = stateRef.current.dados.matriculas.find((x) => x.id === matriculaId);
    return m ? m.moduloAtual : "";
  }, []);

  // acao: "Presente" | "Falta" | "Limpar"
  const marcarSessao = useCallback(
    async (sessao, acao) => {
      const existente = sessao.aulaId ? stateRef.current.dados.aulas.find((a) => a.id === sessao.aulaId) : null;
      if (acao === "Limpar") {
        if (!existente) return true;
        if (sessao.tipo === "Regular") return excluir("Aulas", existente.id);
        return !!(await salvar("Aulas", { ...existente, status: sessao.tipo === "Reposição" ? "Reposição agendada" : "" }));
      }
      const status = acao === "Presente" && sessao.tipo === "Reposição" ? "Reposição realizada" : acao;
      if (existente) return !!(await salvar("Aulas", { ...existente, status }));
      return !!(await salvar("Aulas", {
        data: sessao.data, matriculaId: sessao.matriculaId, status, tipo: sessao.tipo, hora: "", modalidade: "",
        modulo: moduloDa(sessao.matriculaId), reposicaoDe: "", obs: "",
      }));
    },
    [salvar, excluir, moduloDa]
  );

  // marca a aula original como Falta e cria a reposição na nova data
  const agendarReposicao = useCallback(
    async (sessao, { data, hora, modalidade }) => {
      const existente = sessao.aulaId ? stateRef.current.dados.aulas.find((a) => a.id === sessao.aulaId) : null;
      let origemId;
      if (existente) {
        origemId = existente.id;
        if (existente.status !== "Falta") origemId = await salvar("Aulas", { ...existente, status: "Falta" });
      } else {
        origemId = await salvar("Aulas", {
          data: sessao.data, matriculaId: sessao.matriculaId, status: "Falta", tipo: sessao.tipo, hora: "", modalidade: "",
          modulo: moduloDa(sessao.matriculaId), reposicaoDe: "", obs: "",
        });
      }
      if (!origemId) return false;
      return !!(await salvar("Aulas", {
        data, hora, modalidade, matriculaId: sessao.matriculaId, status: "Reposição agendada", tipo: "Reposição",
        modulo: moduloDa(sessao.matriculaId), reposicaoDe: origemId, obs: "",
      }));
    },
    [salvar, moduloDa]
  );

  const limparErro = useCallback(() => dispatch({ type: "ERRO", value: null }), []);

  const value = useMemo(() => {
    const perfil = state.user ? state.user.perfil : "";
    const cfgAtual = state.dados.config || {};
    return {
      ...state,
      isDemo,
      recursos: {
        pontos: recursoLigado(cfgAtual, "recursoPontos"),
        professores: recursoLigado(cfgAtual, "recursoProfessores"),
        experimentais: recursoLigado(cfgAtual, "recursoExperimentais"),
        avaliacoes: recursoLigado(cfgAtual, "recursoAvaliacoes"),
        alertas: recursoLigado(cfgAtual, "recursoAlertas"),
        migracao: recursoLigado(cfgAtual, "recursoMigracao"),
        feriados: recursoLigado(cfgAtual, "recursoFeriados"),
      },
      pode: { admin: perfil === "Admin", professor: perfil === "Admin" || perfil === "Professor" },
      entrar,
      sair,
      recarregar: () => carregar(true),
      limparErro,
      salvar,
      excluir,
      marcarSessao,
      agendarReposicao,
      concluirModulo,
      resgatar,
      criarExperimental,
      movimentar,
      salvarAvaliacaoFinal,
      salvarNotaModulo,
      salvarConfig,
    };
  }, [state, entrar, sair, carregar, limparErro, salvar, excluir, marcarSessao, agendarReposicao, concluirModulo, resgatar, criarExperimental, movimentar, salvarAvaliacaoFinal, salvarNotaModulo, salvarConfig]);

  return <EscolaContext.Provider value={value}>{children}</EscolaContext.Provider>;
}

EscolaProvider.propTypes = { children: PropTypes.node.isRequired };

export function useEscola() {
  const ctx = useContext(EscolaContext);
  if (!ctx) throw new Error("useEscola deve ser usado dentro de EscolaProvider");
  return ctx;
}
