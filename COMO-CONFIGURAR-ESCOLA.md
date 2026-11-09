# Gestão da escola — como colocar para rodar

Use uma **cópia nova** da pasta original `vision-ui-dashboard-react` (não a pasta do dashboard financeiro).

## 1. Aplicar as alterações
1. Extraia este zip por cima da cópia do projeto (aceite sobrescrever).
2. No terminal, dentro da pasta: `npm install` e `npm start`.

Sem configurar nada, o app abre em **modo demonstração** (dados fictícios, só no navegador, sem login).
Dá para testar a tela, a grade, as marcações e o módulo/pontos antes de ligar a planilha.

## 2. Planilha no Drive da escola
1. Envie `escola-modelo.xlsx` para o Drive da escola e salve como Planilhas Google
   (Arquivo → Salvar como Planilhas Google).
2. Na aba **Usuarios**, troque a linha de exemplo pelo e-mail da conta Google da escola de quem vai usar,
   com o perfil: **Admin** (tudo), **Professor** (aulas, presenças, pontos, concluir módulo) ou **Consulta** (só leitura).
3. Apague as linhas "Exemplo" das outras abas quando terminar os testes.
   Não renomeie abas nem cabeçalhos.

## 3. ID de cliente do Google (para o login)
1. Acesse console.cloud.google.com e crie (ou escolha) um projeto.
2. **APIs e serviços → Tela de permissão OAuth**: se a escola usa Google Workspace, escolha tipo **Interno**
   (só contas da escola entram). Preencha nome do app e e-mail de suporte.
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   Em "Origens JavaScript autorizadas" coloque `http://localhost:3000` (e, no futuro, o endereço onde o site for publicado).
4. Copie o ID do cliente (termina em `.apps.googleusercontent.com`). Ele é público, não é segredo.

## 4. Script (Apps Script)
1. Na planilha: **Extensões → Apps Script**. Apague o conteúdo e cole `apps-script/Code.gs`.
2. No topo, troque `CLIENT_ID` pelo ID do passo 3.
3. Selecione a função `autorizar` e clique em **Executar**; aceite as permissões do Google (uma vez).
4. **Implantar → Nova implantação → App da Web**: Executar como **Eu**; Quem tem acesso: **Qualquer pessoa**.
   (É seguro: o script recusa qualquer pedido sem login Google válido de um e-mail ativo da aba Usuarios.)
5. Copie a URL que termina em `/exec`.
6. Se alterar o código depois: **Implantar → Gerenciar implantações → editar → nova versão**.

## 5. Ligar o site
Copie `.env.example` para `.env`, preencha as duas linhas e reinicie o `npm start`:
```
REACT_APP_SCRIPT_URL=<URL /exec>
REACT_APP_GOOGLE_CLIENT_ID=<ID do cliente>
```

## Observações
- Depois do primeiro login com a conta Google, o site guarda uma sessão de 180 dias (até clicar em sair). Veja `SESSAO_DIAS` no `Code.gs`.
- O site atualiza os dados sozinho a cada 2 minutos (vários professores podem usar ao mesmo tempo).
- Mantenha na planilha só o necessário sobre os alunos e compartilhe o arquivo apenas com a equipe.

## O que tem em cada tela
- **Dashboard:** data e hora, atalho para a grade, aulas de hoje por curso (clique no aluno para marcar), ranking de faltas.
- **Horário das aulas:** grade de segunda a sábado; clique no aluno para presente, falta, reposição ou concluir módulo; "Nova aula" para experimental ou avulsa.
- **Alunos:** lista com andamento de cada curso, presença e pontos; "Novo aluno na grade" (Admin) cadastra o aluno e já coloca as aulas semanais; clique para abrir a ficha.
- **Ficha do aluno:** informações do curso ao lado de um gráfico de rosca dos módulos (verde = concluído, azul = atual, cinza = a cursar), presenças e faltas por mês, frequência acumulada, histórico e pontos.
- **Cursos e turmas:** módulos de cada curso (Admin edita) e os alunos matriculados por dia e horário.
- **Pontos e prêmios:** saldo de todos os alunos, histórico com busca, lançar pontos, resgatar prêmio e catálogo de prêmios.

Perfis: **Admin** faz tudo; **Professor** marca aulas, conclui módulos e lança/resgata pontos; **Consulta** só visualiza.

## Atualizando uma planilha que já está em uso (professores, escala e grupo de cursos)
Se a sua planilha foi criada antes desta versão:
1. No Apps Script, substitua todo o conteúdo pelo novo `apps-script/Code.gs` e **mantenha o seu CLIENT_ID** no topo.
2. Selecione a função `prepararNovidades` e clique em **Executar**. Ela cria as abas **Professores** e **Escala** e a coluna
   **Grupo (legenda)** em Cursos, sem mexer nos seus dados. (Sem isso o site continua funcionando, só não grava professores.)
3. **Implantar → Gerenciar implantações → editar → nova versão**.
4. Extraia o zip por cima do projeto e reinicie o `npm start`.

## Professores, escala e legenda
- **Professores** (menu): grade semanal da equipe. "Novo professor" cadastra (nome, contato, cor); "Novo horário" ou um clique num espaço vazio da grade
  adiciona a escala (dá para marcar vários dias de uma vez); clicar num bloco edita ou remove.
- Os cards da grade de alunos mostram **Prof.: nomes** de quem tem escala cobrindo o dia e o horário da aula.
  Se a escala tiver um curso, vale só para ele (e para os cursos do mesmo grupo).
- **Grupo (legenda)**, em Cursos: cursos com o mesmo grupo (ex.: Informática) aparecem como uma só entrada na legenda e usam a cor do primeiro curso do grupo.
  Nos cards dos alunos continua o nome de cada curso.
- **Tema:** vermelho e preto. Para ajustar o tom de vermelho, troque `#E3242B` em `src/assets/theme/base/colors.js` (e no `MiniStatisticsCard`).

## Durações, áreas e filtro (atualização)
- **Duração fixa:** aulas regulares, reposições e avulsas = **1h30**; experimentais = **1h**. Os cards da grade mostram início–fim
  (ex.: 18:00–19:30) e o campo "Duração" saiu dos formulários. A coluna `duracao` da planilha deixa de ser usada na exibição.
- **Áreas:** todo curso é **Inglês** (se o nome ou o grupo tiver "inglês") ou **Programação** (todos os outros: robótica, informática, Scratch, Python…).
  A legenda mostra só "Programação" e "Inglês", e o seletor da grade tem só essas duas opções (sem "Todos").
- **Professores:** o horário da escala agora exige um curso, que define a área. O professor só aparece nas aulas da própria área.
  Horários antigos sem curso valem para as áreas dos outros horários do mesmo professor; edite-os escolhendo um curso.

## Tipos de curso e tela de Configurações (atualização)
- **Tipos de curso** (pelo nome): Programação, Robótica 1, Robótica 2 e Inglês, cada um com sua cor e uma entrada na legenda.
  Qualquer outro nome conta como Programação. O seletor da grade continua com "Programação / Robótica" (reúne os três) e "Inglês".
  O campo "Grupo" saiu do cadastro de curso.
- **Configurações** (menu): edita na própria tela os parâmetros da aba **Config** (nome da escola, pontos padrão, janela do ranking de faltas e
  as cores de online, reposição e experimental). Só o perfil Admin altera; as mudanças são gravadas direto na planilha.
  As linhas "Grade: hora inicial/final" da planilha não afetam mais a grade (os intervalos são fixos) e por isso não aparecem na tela.
- **Para ligar a gravação da Config:** no Apps Script, substitua todo o código pelo novo `apps-script/Code.gs` (mantenha o seu CLIENT_ID),
  depois **Implantar → Gerenciar implantações → editar → nova versão**.

## Cores dos cursos e horários dos professores (atualização)
- **Configurações → Cores dos cursos:** uma cor por tipo (Programação, Robótica 1, Robótica 2, Inglês). Ao salvar, vale para todos os cursos do tipo.
  A cor de cada curso continua editável em Cursos e turmas.
- **Professores → Horários da semana:** cada horário tem seus dias (marque vários), início, fim e curso. "Adicionar outro horário"
  cria outra linha, para quem tem horários diferentes em cada dia. Tudo é salvo de uma vez. Para editar, clique no bloco da grade.

## Escala dos professores por área (atualização)
- Ao cadastrar o horário de um professor, em vez de escolher um curso você escolhe a **área**: "Programação / Robótica (todos os cursos)" ou
  "Inglês (todos os cursos)". O professor aparece nas aulas de todos os cursos da área (Programação, Robótica 1, Robótica 2…), nunca na outra.
  Quem atende as duas áreas ganha um horário para cada.
- Na planilha, a coluna **CursoID** da aba Escala passa a guardar `area:Programação` ou `area:Inglês` (a coluna "Curso" calculada fica em branco
  nessas linhas). Horários antigos com o ID de um curso continuam valendo, com a área do curso; ao editar, o sistema grava a área.

## Correção: gravação dos horários dos professores e checkbox (atualização)
- **Planilha:** a coluna F da aba Escala (agora "Área (ou CursoID)") não pode ter lista de validação com os cursos, senão a planilha recusa
  valores como `area:Inglês` e o horário não é salvo. O novo `Code.gs` já limpa essa validação ao gravar; para limpar a coluna inteira,
  rode uma vez `prepararNovidades` (e crie uma nova versão da implantação). O `escola-modelo.xlsx` já vem sem essa validação.
- **Cores:** a caixa de seleção (ex.: "Bom comportamento") agora usa `checkbox` em `src/themeConfig.js`
  (`borderColor`, `checkedBackground`, `checkColor`).

## Professor da aula experimental, login único e tela de login (atualização)
- **Aula experimental:** o cadastro pede o **professor responsável** (obrigatório quando há professores cadastrados). Ele aparece no card da
  aula e no detalhe, onde também dá para trocar. Na planilha, a aba **Aulas** ganhou a coluna K **ProfessorID (aula experimental)**; as colunas
  calculadas Aluno e Curso foram para L e M. Em planilhas antigas a coluna é criada sozinha no primeiro acesso depois de colar o novo `Code.gs`
  (ou ao rodar `prepararNovidades`). O `escola-modelo.xlsx` já vem assim.
- **Login só uma vez:** depois do primeiro login com a conta Google, o Apps Script emite uma sessão própria, guardada no navegador por
  **180 dias** (`SESSAO_DIAS` no `Code.gs`). Ela vale até clicar em sair, e a conta continua sendo conferida na aba Usuarios a cada acesso:
  quem for desativado lá perde o acesso na hora. Precisa colar o novo `Code.gs` e criar uma nova versão da implantação.
- **Tela de login:** imagem à esquerda e painel fosco à direita, na cor de `cards.background`. Tudo fica em `login` no `src/themeConfig.js`:
  `imageUrl` (URL da imagem), `title`, `message`, `panelBlur`, `imageOverlay` e `fallbackBackground` (fundo usado quando não há imagem).

## Barra de rolagem e funcionalidades ligáveis (atualização)
- **Barra de rolagem:** fina e na cor do tema (`primary`, com `accent` ao passar o mouse). Para ajustar, use `scrollbar` em `src/themeConfig.js`
  (`width`, `color`, `hoverColor`; vazio usa as cores do tema).
- **Configurações → Funcionalidades:** interruptores para **Pontos e recompensas**, **Professores e escala** e **Aulas experimentais**.
  Desligar esconde menu, telas e campos da funcionalidade; os dados continuam na planilha. Ficam na aba **Config** como linhas
  "Recurso: …" com Sim/Não (criadas ao salvar pela primeira vez; sem a linha, a funcionalidade fica ligada). Só o perfil Admin altera.
  Para criar um novo interruptor, adicione uma entrada em `RECURSOS` (`utils/escola.js`) e em `CONFIG_CHAVES` (`Code.gs`).
- **Login:** a sessão de 180 dias (`SESSAO_DIAS` no `Code.gs`) pode ser reduzida se o painel for aberto em computadores compartilhados.

## Bom comportamento, menu no celular e limpeza (atualização)
- **Pontos:** ao concluir um módulo, o aluno ganha os pontos do módulo (ou o padrão da Config) **mais 10** se a caixa "Bom comportamento" estiver marcada
  (`BONUS_BOM_COMPORTAMENTO`, no site e no `Code.gs`). A observação digitada vai para a aba Progresso. Cole o novo `Code.gs` e crie uma nova versão da implantação.
- **Menu no celular:** botão flutuante no canto superior esquerdo abre o menu em telas pequenas; no desktop o menu continua expandindo com o mouse.
- **Limpeza:** os comentários do topo dos arquivos de `src` foram removidos. O `LICENSE.md` (MIT, Creative Tim) foi mantido de propósito.

## Saldo do sistema anterior (atualização)
- Na **ficha do aluno** há o bloco **Saldo do sistema anterior**, com um contador (− / número / +) de **presenças**, **faltas** e **reposições pendentes** por matrícula.
  Os valores são somados às presenças e faltas lançadas no sistema novo (cards e % de presença) e as reposições pendentes entram no card **reposições pendentes**
  (faltas sem reposição agendada + as lançadas aqui). Admin e Professor podem lançar e corrigir; salvar de novo atualiza a mesma linha.
- Na planilha, a aba **Migracao** (uma linha por matrícula) é criada sozinha na primeira leitura depois de colar o novo `Code.gs` (ou ao rodar `prepararNovidades`).
- O saldo não tem data, então não entra no ranking de faltas por período do dashboard nem nos gráficos por mês.
