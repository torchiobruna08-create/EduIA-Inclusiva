// ==========================================================================
// ESTADO GLOBAL DO APLICATIVO (SEM CRONÔMETROS NEM CONTAGENS REGRESSIVAS)
// ==========================================================================
const estado = {
  dificuldade: 'Baixo',
  estilo: 'quadrinhos',
  tutorAtivo: 'Sim',
  termoHiperfoco: '',
  hiperfocoDetectado: false,
  modoFoco: false,
  lendoAudio: false,
  tamanhoFonte: 18
};

// ==========================================================================
// BANCO DE DADOS HISTORIOGRÁFICO EXPANDIDO - ENSINO MÉDIO
// ==========================================================================
const conteudoLicao = {
  geral: {
    titulo: "A Estrutura e Dinâmica do Feudalismo na Europa Ocidental",
    introducao: "O feudalismo consolidou-se na Europa Ocidental a partir da fragmentação do Império Carolíngio e das invasões dos séculos IX e X. O sistema caracterizou-se pela descentralização política, economia agrária de subsistência e forte imobilidade social sustentada por laços de dependência pessoal.",
    politica: "No âmbito político-institucional, vigoravam as relações feudo-vassálicas entre nobres, regidas por juramentos solenes de homenagem e fidelidade. O suserano concedia o feudo (terras, direitos de tributação ou rendas) e garantia proteção, enquanto o vassalo prestava auxílio militar compulsório (auxilium) e aconselhamento nas decisões senhoriais (consilium).",
    sociedade: "A sociedade feudal organizava-se de forma estamental e hierarquizada, legitimada pela ideologia eclesiástica das Três Ordens: o Clero (Oratores - os que oram), a Nobreza (Bellatores - os que combatem e detêm a terra) e os Servos (Laboratores - a ampla base camponesa desprovida de privilégios que sustentava as ordens superiores)."
  },
  hiperfocoMecanico: {
    titulo: "Engenharia Mecânica Medieval: O Feudo como Sistema Tecnológico Integrado",
    resumo: "Sob a perspectiva da história da tecnologia e da física aplicada, o feudo operava como um sistema mecânico integrado de conversão e transferência de energia. A difusão dos moinhos hidráulicos e de vento, equipados com eixos de cames e engrenagens de madeira, revolucionou o processamento de grãos, a moagem e a forja, tornando o controle tecnológico um instrumento central de poder senhorial."
  },
  tabelaMecanicaObrigacoes: [
    {
      componente: "Moinho Hidráulico & Roda d'Água",
      funcao: "Conversão de energia cinética hídrica em trabalho mecânico para moagem de grãos e serragem.",
      obrigacao: "Banalidades",
      explicacao: "Taxa compulsória cobrada pelo senhor pelo uso exclusivo das instalações mecânicas do feudo (moinho, forno e lagar)."
    },
    {
      componente: "Charrua com Aiveca de Ferro",
      funcao: "Instrumento de tração animal pesada para revolver solos profundos e compactos do norte europeu.",
      obrigacao: "Corveia",
      explicacao: "Trabalho braçal gratuito obrigatório realizado nos campos exclusivos do senhor (Manso Senhorial) durante 3 a 4 dias na semana."
    },
    {
      componente: "Cotas de Malha, Armaduras e Armamentos",
      funcao: "Mecanismos de defesa e impacto cinético para a infantaria e cavalaria pesada senhorial.",
      obrigacao: "Talha",
      explicacao: "Entrega de parcela considerável (cerca de 30% a 50%) de tudo o que os servos produziam em seus lotes (Manso Servil)."
    }
  ],
  tabelaObrigacoesGeral: [
    {
      obrigacao: "Corveia",
      tipo: "Trabalho Compulsório",
      descricao: "Trabalho gratuito dos servos durante 3 a 4 dias por semana nas terras exclusivas do senhor (Manso Senhorial), realizando aragem, plantio, colheita e manutenção de fortificações."
    },
    {
      obrigacao: "Talha",
      tipo: "Tributo em Produtos",
      descricao: "Entrega obrigatória de parte da produção agropecuária obtida pelos servos em seus lotes individuais (Manso Servil)."
    },
    {
      obrigacao: "Banalidades",
      tipo: "Taxa de Uso Tecnológico",
      descricao: "Pagamento compulsório pelo uso das estruturas e tecnologias de processamento do feudo pertencentes ao senhor, especialmente o moinho hidráulico, o forno e o lagar."
    }
  ]
};

// ==========================================================================
// SÍNTESE DE VOZ CALIBRADA (SpeechSynthesisUtterance: rate 0.9, pitch 1.0)
// ==========================================================================
let sintetizador = window.speechSynthesis;
let locucao = null;

function alternarLeituraTexto() {
  if (!sintetizador) return;

  if (estado.lendoAudio) {
    sintetizador.cancel();
    estado.lendoAudio = false;
    document.getElementById('btnOuvirAula').textContent = 'Ouvir Aula';
    return;
  }

  const containerLicao = document.getElementById('areaRenderizacaoLicao');
  if (!containerLicao) return;

  const textoParaLer = containerLicao.innerText;

  sintetizador.cancel();
  locucao = new SpeechSynthesisUtterance(textoParaLer);
  locucao.lang = 'pt-BR';
  locucao.rate = 0.9;   // Ritmo pausado e relaxante
  locucao.pitch = 1.0;  // Tom fixo e estável

  locucao.onend = () => {
    estado.lendoAudio = false;
    document.getElementById('btnOuvirAula').textContent = 'Ouvir Aula';
  };

  locucao.onerror = () => {
    estado.lendoAudio = false;
    document.getElementById('btnOuvirAula').textContent = 'Ouvir Aula';
  };

  sintetizador.speak(locucao);
  estado.lendoAudio = true;
  document.getElementById('btnOuvirAula').textContent = 'Parar Áudio';
}

// ==========================================================================
// PROCESSAMENTO LÉXICO (PLN) E ONBOARDING ESTRUTURADO
// ==========================================================================
function salvarPerfil(event) {
  if (event && event.preventDefault) event.preventDefault();

  const campoDificuldade = document.getElementById('campoDificuldade').value;
  const campoEstilo = document.getElementById('campoEstilo').value;
  const campoTutor = document.getElementById('campoTutor').value;
  const inputHiperfoco = document.getElementById('textoHiperfoco');
  const textoHiperfoco = inputHiperfoco ? inputHiperfoco.value.trim() : '';

  estado.dificuldade = campoDificuldade;
  estado.estilo = campoEstilo;
  estado.tutorAtivo = campoTutor;
  estado.termoHiperfoco = textoHiperfoco;

  // Análise Léxica de Hiperfoco (PLN)
  const termoLower = textoHiperfoco.toLowerCase();
  const termosChaveMecanica = [
    'mecanica', 'mecânica', 'engrenag', 'engrenagem', 'engrenagens',
    'robot', 'robótica', 'robotica', 'robô', 'robo',
    'motor', 'motores', 'maquina', 'máquina', 'maquinas', 'máquinas',
    'tecnologia', 'mecanismo', 'mecanismos'
  ];

  estado.hiperfocoDetectado = termosChaveMecanica.some(chave => termoLower.includes(chave));

  // Atualização das Tags no Profile Summary
  document.getElementById('tagDificuldade').textContent = `Dificuldade: ${estado.dificuldade}`;
  document.getElementById('tagEstilo').textContent = `Estilo: ${obterNomeEstilo(estado.estilo)}`;
  document.getElementById('tagTutor').textContent = `Tutor: ${estado.tutorAtivo === 'Sim' ? 'Ativado' : 'Autônomo'}`;

  const tagHiperfocoEl = document.getElementById('tagHiperfoco');
  const textoHiperfocoTag = document.getElementById('textoHiperfocoTag');

  if (estado.hiperfocoDetectado) {
    tagHiperfocoEl.style.display = 'inline-block';
    textoHiperfocoTag.textContent = textoHiperfoco.toUpperCase();
  } else if (textoHiperfoco.length > 0) {
    tagHiperfocoEl.style.display = 'inline-block';
    textoHiperfocoTag.textContent = `"${textoHiperfoco}"`;
  } else {
    tagHiperfocoEl.style.display = 'none';
  }

  // Controle de Visibilidade do Painel do Tutor
  const secaoTutor = document.getElementById('secaoPainelTutor');
  if (secaoTutor) {
    secaoTutor.style.display = (estado.tutorAtivo === 'Sim') ? 'block' : 'none';
  }

  // Transição de Telas
  document.getElementById('telaOnboarding').style.display = 'none';
  document.getElementById('barraProfile').style.display = 'flex';
  document.getElementById('telaAula').style.display = 'flex';

  atualizarBotoesModo();
  renderizarLicao();
}

function entrarDiretoNaAula() {
  const inputHiperfoco = document.getElementById('textoHiperfoco');
  if (inputHiperfoco) inputHiperfoco.value = 'mecânica e engrenagens';
  salvarPerfil({ preventDefault: () => {} });
}

function redefinirPerfil() {
  if (sintetizador) sintetizador.cancel();
  estado.lendoAudio = false;
  document.getElementById('btnOuvirAula').textContent = 'Ouvir Aula';

  // Reseta o formulário
  const form = document.getElementById('formOnboarding');
  if (form) form.reset();

  document.getElementById('telaAula').style.display = 'none';
  document.getElementById('barraProfile').style.display = 'none';
  document.getElementById('telaOnboarding').style.display = 'flex';
}

function obterNomeEstilo(estilo) {
  switch (estilo) {
    case 'quadrinhos': return 'Quadrinhos / Infográfico';
    case 'texto': return 'Texto Analítico';
    case 'mapa': return 'Mapa Mental';
    case 'audio': return 'Modo Áudio';
    default: return estilo;
  }
}

function trocarModo(novoModo) {
  estado.estilo = novoModo;
  document.getElementById('tagEstilo').textContent = `Estilo: ${obterNomeEstilo(novoModo)}`;
  atualizarBotoesModo();
  renderizarLicao();
}

function atualizarBotoesModo() {
  const modos = ['texto', 'quadrinhos', 'mapa', 'audio'];
  modos.forEach(m => {
    const btn = document.getElementById(`btnModo${m.charAt(0).toUpperCase() + m.slice(1)}`);
    if (btn) {
      if (estado.estilo === m) {
        btn.classList.add('ativo');
      } else {
        btn.classList.remove('ativo');
      }
    }
  });
}

// ==========================================================================
// RENDERIZAÇÃO DIDÁTICA EXPANDIDA E ADAPTATIVA (DUA)
// ==========================================================================
function renderizarLicao() {
  const container = document.getElementById('areaRenderizacaoLicao');
  let conteudoHTML = '';

  const tituloExibido = estado.hiperfocoDetectado 
    ? conteudoLicao.hiperfocoMecanico.titulo 
    : conteudoLicao.geral.titulo;

  const resumoExibido = estado.hiperfocoDetectado
    ? conteudoLicao.hiperfocoMecanico.resumo
    : conteudoLicao.geral.introducao;

  // 1. MÍDIA: QUADRINHOS / INFOGRÁFICO TÉCNICO (3 QUADROS MADUROS)
  if (estado.estilo === 'quadrinhos') {
    conteudoHTML = `
      <section class="secao-didatica">
        <h2>${tituloExibido}</h2>
        <p>${resumoExibido}</p>
      </section>

      <div class="grade-gibi-maduro">
        
        <!-- QUADRO 1: ESTRUTURA GEOGRÁFICA DOS MANSOS FEUDAIS -->
        <article class="quadro-gibi">
          <div class="caixa-narra-azul">Quadro 1: Estrutura Geográfica dos Mansos Feudais</div>
          <div class="esquema-bloco-diagrama">
            <div class="titulo-diagrama">TOPOGRAFIA E ORGANIZAÇÃO ESPACIAL DO FEUDO</div>
            <p><strong>[ Manso Senhorial (Reserva Senhorial) ]</strong> Terras exclusivas exploradas diretamente pelo senhor feudal, contendo o castelo fortificado, moinhos hidráulicos, fornos, celeiros e as melhores parcelas aráveis.</p>
            <p><strong>[ Manso Servil (Tenências Camponesas) ]</strong> Parcelas de terra divididas em faixas (lotes) concedidas aos servos para produção de sua subsistência familiar, sujeitas ao pagamento perpétuo de tributos.</p>
            <p><strong>[ Manso Comunal (Terras Coletivas) ]</strong> Bosques, florestas, pastagens e rios de utilização comum regulamentada pelo senhor, onde os camponeses realizavam coleta de lenha e pastoreio mediante tributação.</p>
          </div>
          <div class="balao-fala-maduro">
            <strong>Engenheiro Historiográfico:</strong> "A divisão topográfica do feudo operava com circuitos fechados de produção. A energia gerada pelo trabalho servil no Manso Senhorial alimentava a sustentabilidade material de toda a estrutura fortificada."
          </div>
        </article>

        <!-- QUADRO 2: TABELA TÉCNICA DE COMPONENTES, FUNÇÃO MECÂNICA E OBRIGAÇÕES SERVIS -->
        <article class="quadro-gibi">
          <div class="caixa-narra-azul">Quadro 2: Componentes Mecânicos, Função Operacional e Obrigações Servis</div>
          <p>Abaixo, a correlação técnica entre os aparatos materiais do feudo e o sistema compulsório de tributação senhorial:</p>
          <div class="tabela-texturizada-container">
            <table class="tabela-texturizada" aria-label="Tabela Técnica das Obrigações e Mecânica Feudal">
              <thead>
                <tr>
                  <th>Componente Estrutural / Técnico</th>
                  <th>Função Mecânica e Produtiva</th>
                  <th>Obrigação Servil Associada</th>
                  <th>Fundamento Jurídico e Tributário</th>
                </tr>
              </thead>
              <tbody>
                ${conteudoLicao.tabelaMecanicaObrigacoes.map(item => `
                  <tr>
                    <td><strong>${item.componente}</strong></td>
                    <td>${item.funcao}</td>
                    <td><span style="color: #38BDF8; font-weight: 700;">${item.obrigacao}</span></td>
                    <td>${item.explicacao}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="balao-fala-maduro">
            <strong>Observador Analítico:</strong> "O monopólio das forças mecânicas (moinho e forno) garantia que o senhor feudal controlasse tanto a transformação dos alimentos quanto a extração compulsória de excedentes dos servos."
          </div>
        </article>

        <!-- QUADRO 3: AS TRÊS ORDENS ESTAMENTAIS COMO ENGRENAGENS ACOPLADAS -->
        <article class="quadro-gibi">
          <div class="caixa-narra-azul">Quadro 3: As Três Ordens Estamentais como Engrenagens Acopladas</div>
          <div class="esquema-bloco-diagrama">
            <div class="titulo-diagrama">SISTEMA MECÂNICO SOCIAL (TEORIA TRIPARTITE MEDIEVAL)</div>
            <p>⚙️ <strong>Engrenagem Guia - Oratores (Clero):</strong> Engrenagem condutora que fornece a justificativa teológica, as leis divinas e a legitimação moral da ordem estamental.</p>
            <p>⚙️ <strong>Engrenagem de Força e Retenção - Bellatores (Nobreza):</strong> Engrenagem armada que impõe a coerção física militar, administra a justiça territorial e detém a posse das terras.</p>
            <p>⚙️ <strong>Engrenagem Motriz de Base - Laboratores (Servos):</strong> Grande engrenagem de tração contínua que fornece a energia cinética do trabalho agrícola e sustenta materialmente as engrenagens superiores.</p>
          </div>
          <div class="balao-fala-maduro">
            <strong>Analista Social:</strong> "Se qualquer um dos dentes dessa engrenagem social rompesse sua função determinada, a estabilidade de todo o maquinário feudal entraria em colapso."
          </div>
        </article>

      </div>
    `;
  } 
  
  // 2. MÍDIA: TEXTO CORRIDO ANALÍTICO
  else if (estado.estilo === 'texto') {
    conteudoHTML = `
      <section class="secao-didatica">
        <h2>${tituloExibido}</h2>
        <p>${resumoExibido}</p>
      </section>

      <section class="secao-didatica">
        <h3>1. A Fragmentação do Poder Central e o Pacto Feudo-Vassálico</h3>
        <p>${conteudoLicao.geral.politica}</p>
        <p>A concessão do benefício feudal não implicava em propriedade privada no sentido capitalista moderno, mas sim em um usufruto hereditário condicionado ao cumprimento estrito dos deveres de fidelidade e auxílio militar mútuo.</p>
      </section>

      <section class="secao-didatica">
        <h3>2. O Regime Senhorial e as Relações de Produção Servil</h3>
        <p>A terra constituía o eixo fundamental de riqueza e prestígio social. A estrutura fundiária encontrava-se dividida entre o Manso Senhorial, o Manso Servil e as Terras Comunais. A submissão jurídica dos camponeses vinculava-os à gleba e impunha pesadas obrigações tributárias:</p>
        
        <div class="tabela-texturizada-container">
          <table class="tabela-texturizada">
            <thead>
              <tr>
                <th>Obrigação</th>
                <th>Modalidade</th>
                <th>Definição Jurídica e Historiográfica</th>
              </tr>
            </thead>
            <tbody>
              ${conteudoLicao.tabelaObrigacoesGeral.map(item => `
                <tr>
                  <td><strong>${item.obrigacao}</strong></td>
                  <td>${item.tipo}</td>
                  <td>${item.descricao}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="secao-didatica">
        <h3>3. A Ideologia Tripartite e a Imobilidade Social</h3>
        <p>${conteudoLicao.geral.sociedade}</p>
        <p>A hierarquia era concebida como um reflexo terreno da ordem celestial, estabelecendo que a alteração de posição social contrariava a vontade divina, o que restringia drasticamente a mobilidade vertical ao longo de toda a Idade Média Central.</p>
      </section>
    `;
  }

  // 3. MÍDIA: MAPA MENTAL E RELAÇÕES ESTRUTURAIS
  else if (estado.estilo === 'mapa') {
    conteudoHTML = `
      <section class="secao-didatica">
        <h2>${tituloExibido}</h2>
        <p>${resumoExibido}</p>
      </section>

      <div class="mapa-container-blocos">
        <div class="card-bloco-mapa">
          <h4>POLÍTICA & INSTITUIÇÕES</h4>
          <ul>
            <li>Descentralização do poder régio</li>
            <li>Relações de Suserania e Vassalagem</li>
            <li>Cerimônia de Homenagem e Investidura</li>
            <li>Privatização do monopólio da justiça</li>
          </ul>
        </div>

        <div class="card-bloco-mapa">
          <h4>DIVISÃO DO ESPAÇO FEUDAL</h4>
          <ul>
            <li><strong>Manso Senhorial:</strong> Terras exclusivas do nobre</li>
            <li><strong>Manso Servil:</strong> Faixas de produção de subsistência</li>
            <li><strong>Manso Comunal:</strong> Florestas e pastos coletivos regulados</li>
          </ul>
        </div>

        <div class="card-bloco-mapa">
          <h4>TRIBUTAÇÃO E SERVIDÃO</h4>
          <ul>
            <li><strong>Corveia:</strong> Dias compulsórios de trabalho servil</li>
            <li><strong>Talha:</strong> Parcela da colheita do manso servil</li>
            <li><strong>Banalidades:</strong> Taxa de uso do moinho e forno</li>
          </ul>
        </div>

        <div class="card-bloco-mapa">
          <h4>ESTAMENTOS SOCIAIS</h4>
          <ul>
            <li><strong>Oratores (Clero):</strong> Função teológica e doutrinária</li>
            <li><strong>Bellatores (Nobreza):</strong> Defesa bélica e posse territorial</li>
            <li><strong>Laboratores (Servos):</strong> Sustentáculo produtivo material</li>
          </ul>
        </div>
      </div>
    `;
  }

  // 4. MÍDIA: ÁUDIO ORIENTADO
  else {
    conteudoHTML = `
      <section class="secao-didatica">
        <h2>${tituloExibido} (Modo Áudio Estruturado)</h2>
        <p>O módulo de áudio reproduz o texto analítico com taxa de fala pausada (0.9x) e frequência estável (1.0) para garantir máxima clareza auditiva.</p>
        
        <div class="bloco-destaque-hiperfoco">
          <h3>Síntese para Audição:</h3>
          <p>${resumoExibido}</p>
          <p>O feudalismo organizou-se em torno da posse da terra e da servidão. O senhor feudal exercia monopólio sobre os aparatos de transformação agrícola, como os moinhos hidráulicos, cobrando o tributo das Banalidades. A sociedade estamental era concebida em três ordens funcionais: clero, nobreza e servos.</p>
        </div>
      </section>
    `;
  }

  // Exercício de Fixação Interativo
  conteudoHTML += gerarQuizHTML();
  container.innerHTML = conteudoHTML;
}

// ==========================================================================
// EXERCÍCIO DE FIXAÇÃO INTERATIVO (QUESTÃO 1: MOINHO HIDRÁULICO E BANALIDADES)
// ==========================================================================
function gerarQuizHTML() {
  return `
    <section class="container-quiz" aria-labelledby="tituloQuiz">
      <div class="cabecalho-quiz">
        <h3 id="tituloQuiz">Exercício de Fixação e Avaliação Formativa</h3>
        <p class="enunciado-quiz">
          <strong>Questão 1:</strong> No sistema feudal da Europa Ocidental, a difusão dos <strong>moinhos hidráulicos</strong> representou um significativo avanço mecânico para o processamento de cereais. No entanto, essas instalações pertenciam com exclusividade ao senhor feudal. 
          Qual era o nome da obrigação servil compulsória cobrada aos camponeses pelo uso obrigatório do moinho, forno e lagar senhoriais?
        </p>
      </div>

      <div class="lista-alternativas" id="grupoAlternativas">
        <button class="btn-alternativa" onclick="verificarResposta('A', this)">
          A) <strong>Corveia</strong> — Trabalho manual não remunerado realizado nas terras diretas do castelo durante dias fixos da semana.
        </button>
        <button class="btn-alternativa" onclick="verificarResposta('B', this)">
          B) <strong>Banalidades</strong> — Taxa compulsória cobrada em produtos pelo uso exclusivo das ferramentas e estruturas tecnológicas do feudo.
        </button>
        <button class="btn-alternativa" onclick="verificarResposta('C', this)">
          C) <strong>Talha</strong> — Entrega percentual compulsória da produção obtida nos lotes servis individuais (tenências).
        </button>
        <button class="btn-alternativa" onclick="verificarResposta('D', this)">
          D) <strong>Mão-morta</strong> — Tributo pago pelos herdeiros camponeses para assegurar a continuidade da posse da terra após a morte do chefe da família.
        </button>
      </div>

      <div id="caixaFeedbackQuiz" class="caixa-feedback" style="display: none;" role="status"></div>
    </section>
  `;
}

function verificarResposta(opcaoEscolhida, botaoClicado) {
  const botoes = document.querySelectorAll('.btn-alternativa');
  const caixaFeedback = document.getElementById('caixaFeedbackQuiz');

  botoes.forEach(btn => btn.disabled = true);

  if (opcaoEscolhida === 'B') {
    botaoClicado.classList.add('correta');
    caixaFeedback.className = 'caixa-feedback sucesso';
    caixaFeedback.innerHTML = `
      <strong>Resposta Correta (Alternativa B: Banalidades)</strong><br>
      Precisão historiográfica confirmada! As <strong>Banalidades</strong> correspondiam às taxas de uso dos equipamentos que integravam o monopólio técnico senhorial (moinho hidráulico, forno e lagar). Os servos eram proibidos de erguer seus próprios mecanismos de moagem, sendo obrigados a destinar parcela de seus grãos moídos ao senhor feudal.
    `;
  } else {
    botaoClicado.classList.add('incorreta');
    
    // Destaca a alternativa B (índice 1)
    if (botoes[1]) botoes[1].classList.add('correta');

    caixaFeedback.className = 'caixa-feedback alerta';
    caixaFeedback.innerHTML = `
      <strong>Gabarito Comentado: A alternativa correta é a (B) — Banalidades.</strong><br>
      A taxa associada à utilização dos equipamentos mecânicos e benfeitorias senhoriais (como o moinho hidráulico e o forno coletivo) denominava-se <strong>Banalidade</strong>. A Corveia referia-se a dias de trabalho, a Talha à divisão da colheita servil, e a Mão-morta à sucessão familiar da posse da terra.
    `;
  }

  caixaFeedback.style.display = 'block';
}

// ==========================================================================
// MODO DE FOCO E AJUSTES DE ACESSIBILIDADE
// ==========================================================================
function alternarModoFoco() {
  estado.modoFoco = !estado.modoFoco;
  if (estado.modoFoco) {
    document.body.classList.add('modo-foco-ativo');
    document.getElementById('btnSairModoFoco').style.display = 'block';
  } else {
    document.body.classList.remove('modo-foco-ativo');
    document.getElementById('btnSairModoFoco').style.display = 'none';
  }
}

function alterarFonte(variacao) {
  if (variacao > 0 && estado.tamanhoFonte < 26) {
    estado.tamanhoFonte += variacao;
  } else if (variacao < 0 && estado.tamanhoFonte > 15) {
    estado.tamanhoFonte += variacao;
  }
  document.documentElement.style.setProperty('--tamanho-base', `${estado.tamanhoFonte}px`);
}
