# Dashboard Escolar

Painel de gestão para escolas de **programação, robótica e inglês**: grade semanal de aulas, presenças, faltas e reposições, acompanhamento pedagógico de cada aluno, professores, pontos e prêmios, avaliação final e boletim. Os dados ficam numa **planilha do Google** da própria escola, e o login é feito com a **conta Google**.

> **Projeto base:** este painel é uma adaptação do [Vision UI Dashboard Free React](https://www.creative-tim.com/product/vision-ui-dashboard-free-react), criado por [Simmmple](https://simmmple.com) e [Creative Tim](https://www.creative-tim.com) e distribuído sob a licença MIT. Veja os detalhes em [Créditos e licença](#créditos-e-licença).

## Sumário

- [O que o painel faz](#o-que-o-painel-faz)
- [Como funciona](#como-funciona)
- [Tecnologias](#tecnologias)
- [Primeiros passos](#primeiros-passos)
- [Planilha e perfis de acesso](#planilha-e-perfis-de-acesso)
- [Personalização](#personalização)
- [Publicação](#publicação)
- [Compatibilidade de navegadores](#compatibilidade-de-navegadores)
- [Segurança](#segurança)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Documentação adicional](#documentação-adicional)
- [Créditos e licença](#créditos-e-licença)

## O que o painel faz

**Dia a dia**
- **Dashboard** com relógio, aulas e andamento dos cursos do dia, presenças e faltas de hoje, alunos que mais faltam, **alunos em risco de evasão** e professores do dia.
- **Horário das aulas** em grade semanal de segunda a sábado, com os intervalos da escola (aulas de 1h30 e experimentais de 1h). Seletor entre **Programação / Robótica** e **Inglês**, com cores por tipo de curso, por modalidade online, por reposição e por aula experimental. Presença, falta e reposição são marcadas direto na grade.
- **Aulas avulsas e experimentais**, com o professor responsável pela experimental.
- **Atualização automática** dos dados a cada 2 minutos, para vários professores usarem ao mesmo tempo.

**Alunos e cursos**
- **Cadastro de aluno já na grade**, com um ou mais cursos e horários, e **ficha do aluno** com presença, faltas, reposições pendentes, módulo atual, gráficos de acompanhamento e pontos.
- **Cursos e módulos**, com **fases** (por exemplo nos cursos de robótica, em que cada fase tem vários módulos). Tipos de curso: Programação, Robótica 1, Robótica 2 e Inglês.
- **Saldo do sistema anterior**: contadores de presenças, faltas e reposições pendentes para quem veio de outro sistema.
- **Saída, trancamento e reativação** de matrículas, com motivo e **histórico de movimentações**.
- **Avaliação final do curso** (conceito, nota opcional e comentário) e **boletim** do aluno para imprimir ou salvar em PDF.
- **Alertas de risco de evasão**: faltas seguidas ou reposições pendentes acima do limite que você define.

**Equipe**
- **Professores** com cadastro, dias e horários de trabalho, escala por área (Programação / Robótica ou Inglês) e grade própria. Os nomes aparecem nas aulas.

**Motivação**
- **Pontos e prêmios**: pontos por módulo concluído (com bônus de bom comportamento), pontos manuais, catálogo de prêmios, resgates e ranking.

**Administração**
- **Configurações** pelo próprio painel: nome da escola, pontos padrão, limites dos alertas, cores da grade e dos cursos, e **interruptores** para ligar ou desligar funcionalidades (pontos, professores, aulas experimentais, avaliações e alertas). Tudo é gravado na aba `Config` da planilha.
- **Login com a conta Google uma única vez** (a sessão dura 180 dias, até clicar em sair) e **três perfis de acesso**.
- **Visual próprio**: tema vermelho e preto, cards foscos transparentes, tela de login com imagem, barra de rolagem na cor do tema e menu lateral que expande com o mouse (e abre por um botão no celular).
- **Modo demonstração**: sem configurar nada, o painel abre com dados fictícios guardados no navegador, ótimo para testar.

## Como funciona

```
Navegador (site React)  ──►  Web app do Google Apps Script  ──►  Planilha Google (Drive da escola)
   login com Google             confere o login e o perfil           uma aba por tipo de dado
```

O site é estático. A cada ação ele chama o web app do Apps Script (`apps-script/Code.gs`), que confere o login Google, o e-mail na aba `Usuarios` e o perfil, e então lê ou grava na planilha. Não há servidor próprio nem banco de dados à parte.

## Tecnologias

- [React](https://reactjs.org) 18 e [React Router](https://reactrouter.com) 5
- [Material UI](https://mui.com) 5 (base do tema Vision UI)
- [ApexCharts](https://apexcharts.com) para os gráficos
- Create React App (`react-scripts` 5)
- Google Apps Script, Planilhas Google e Google Identity Services (login)

## Primeiros passos

Requisito: [Node.js](https://nodejs.org) 16 ou mais novo.

```bash
npm install
npm start
```

O painel abre em `http://localhost:3000` em **modo demonstração**.

Para ligar a planilha e o login:

1. Copie `.env.example` para `.env` e preencha:
   ```
   REACT_APP_SCRIPT_URL=<URL do web app, termina em /exec>
   REACT_APP_GOOGLE_CLIENT_ID=<ID de cliente OAuth do Google>
   ```
2. Envie `apps-script/escola-modelo.xlsx` para o Drive da escola e salve como Planilhas Google.
3. Na planilha, em **Extensões → Apps Script**, cole `apps-script/Code.gs`, troque o `CLIENT_ID` no topo e implante como **App da Web**.
4. Reinicie o `npm start`.

O passo a passo completo, com os detalhes do Google Cloud e do Apps Script, está em [`COMO-CONFIGURAR-ESCOLA.md`](COMO-CONFIGURAR-ESCOLA.md).

| Comando | O que faz |
|---|---|
| `npm start` | Servidor de desenvolvimento |
| `npm run build` | Gera o site pronto para publicar, na pasta `build` |

## Planilha e perfis de acesso

**Abas da planilha:** `Config`, `Usuarios`, `Alunos`, `Cursos`, `Modulos`, `Matriculas`, `Aulas`, `Progresso`, `Pontos`, `Premios`, `Professores` e `Escala`. As abas `Migracao`, `Movimentacoes` e `Avaliacoes` e algumas colunas novas são criadas sozinhas na primeira leitura. Não renomeie abas nem cabeçalhos.

**Perfis** (definidos na aba `Usuarios`, por e-mail):

| Perfil | O que pode |
|---|---|
| **Admin** | Tudo: cadastros, configurações, saída e trancamento de alunos, prêmios e demais dados |
| **Professor** | Marcar presença, falta e reposição, concluir módulo, lançar pontos manuais, criar aula avulsa ou experimental, avaliação final e saldo do sistema anterior |
| **Consulta** | Somente leitura |

## Personalização

- **Cores, fundo e login:** `src/themeConfig.js` concentra a cor principal, o fundo (imagem por URL ou degradê), os cards foscos, a barra de rolagem, a caixa de seleção e a tela de login (imagem, título e mensagem de boas-vindas).
- **Nomes do menu lateral:** `src/routes.js`, no campo `name` de cada item.
- **Parâmetros do dia a dia:** tela **Configurações** do próprio painel (nome da escola, pontos, limites de alerta, cores e interruptores).
- **Novo interruptor de funcionalidade:** adicione uma entrada em `RECURSOS` (`src/utils/escola.js`) e em `CONFIG_CHAVES` (`apps-script/Code.gs`).

## Publicação

```bash
npm run build
```

Publique a pasta `build` em qualquer hospedagem de site estático. O arquivo `genezio.yaml` já deixa o projeto pronto para a [Genezio](https://genezio.com): ele instala com `npm install --legacy-peer-deps`, gera o `build` e publica essa pasta.

Depois de publicar, adicione o endereço do site em **Origens JavaScript autorizadas** do ID de cliente OAuth, no Google Cloud. Ao alterar o `Code.gs`, crie uma **nova versão da implantação** no Apps Script.

## Compatibilidade de navegadores

O site é compilado para **Chrome 64 ou mais novo**, Android 5, Safari e iOS 11, Firefox 68 e Edge 79 ou mais novos, e carrega recursos de compatibilidade (`core-js`) para aparelhos mais antigos. Se o painel não abrir, aparece uma tela com o erro e a versão do navegador. O login do Google também exige um navegador relativamente recente: nesses casos, atualize o Chrome e o Android System WebView.

## Segurança

- O Apps Script recusa qualquer pedido sem login Google válido de um e-mail ativo na aba `Usuarios` e confere o perfil em cada gravação.
- Depois do primeiro login, o site guarda uma sessão própria de 180 dias (`SESSAO_DIAS` no `Code.gs`), que pode ser encurtada para computadores compartilhados. Desativar um e-mail na aba `Usuarios` corta o acesso na hora.
- O `.env` não vai para o Git (está no `.gitignore`). O ID de cliente do Google é público, não é segredo.
- Compartilhe a planilha só com a equipe e use verificação em duas etapas nas contas de Admin e de professores. Mantenha na planilha apenas o necessário sobre os alunos.

## Estrutura de pastas

```
apps-script/        Code.gs (backend) e escola-modelo.xlsx (planilha modelo)
public/             index.html, ícones e manifest
src/
  layouts/          telas: dashboard, horario, professores, alunos (ficha e boletim),
                    cursos, pontos, configuracoes, auth (login) e shared (diálogos e campos)
  context/escola.js estado do painel, login, sessão e ações
  services/api.js   chamadas ao Apps Script e modo demonstração
  utils/escola.js   regras: grade, presenças, fases, alertas, pontos
  themeConfig.js    cores, fundo, cards, login e barra de rolagem
  routes.js         rotas e itens do menu lateral
  assets/theme      tema do Material UI (base Vision UI)
  examples/         menu lateral, barra superior e layouts do projeto base
  components/       componentes visuais do projeto base (VuiBox, VuiButton...)
```

## Documentação adicional

- [`COMO-CONFIGURAR-ESCOLA.md`](COMO-CONFIGURAR-ESCOLA.md): configuração completa e histórico das atualizações.
- [`CHANGELOG.md`](CHANGELOG.md): histórico do projeto base (Vision UI).

## Créditos e licença

Este projeto é uma **adaptação independente** do **Vision UI Dashboard Free React**, criado por **[Simmmple](https://simmmple.com)** e **[Creative Tim](https://www.creative-tim.com)**, e **não tem vínculo nem aprovação** dos autores originais.

- Produto: <https://www.creative-tim.com/product/vision-ui-dashboard-free-react>
- Repositório: <https://github.com/creativetimofficial/vision-ui-dashboard-react>
- Demonstração: <https://demos.creative-tim.com/vision-ui-dashboard-react>

**O que vem do projeto base:** a estrutura em React e Material UI, o tema, os componentes visuais (`VuiBox`, `VuiButton` e outros), os layouts, o menu lateral e a barra superior.

**O que foi desenvolvido para a escola:** o backend em Apps Script e a planilha, o login com sessão, as telas e regras de gestão (grade, presenças, professores, alunos, cursos, pontos, avaliações, boletim, alertas e configurações), o visual personalizado e a compatibilidade com navegadores antigos.

**Licença:** MIT, mantida do projeto base. Copyright (c) 2013-2021 Creative Tim. O texto completo está em [`LICENSE.md`](LICENSE.md) e deve acompanhar qualquer cópia deste código.

**Agradecimentos** às bibliotecas de código aberto usadas pelo projeto base e por este: [Material UI](https://mui.com), [ApexCharts.js](https://apexcharts.com), [React](https://reactjs.org), [React Router](https://reactrouter.com) e [core-js](https://github.com/zloirock/core-js).
