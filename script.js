
"use strict";

/* ==========================================
   EDUIA INCLUSIVA — JAVASCRIPT PRINCIPAL
========================================== */

const supabaseClient = window.eduiaSupabase || null;
let supabaseUser = null;
let creatorStudentsCache = [];

async function ensureSupabaseStudent() {
  if (!supabaseClient) return null;
  const { data: current, error: currentError } = await supabaseClient.auth.getSession();
  if (currentError) throw currentError;
  if (current.session?.user) { supabaseUser = current.session.user; return supabaseUser; }
  const { data, error } = await supabaseClient.auth.signInAnonymously();
  if (error) throw error;
  supabaseUser = data.user;
  return supabaseUser;
}

async function dbSaveStudent(profile) {
  if (!supabaseClient || !supabaseUser) return;
  const { error } = await supabaseClient.from("students").upsert({
    id: supabaseUser.id,
    grade: profile.grade || "1º ano do Ensino Médio"
  }, { onConflict: "id" });
  if (error) throw error;
  const { error: accessError } = await supabaseClient.from("access_events").insert({
    student_id: supabaseUser.id, event_type: "session_started"
  });
  if (accessError) throw accessError;
}

async function dbSavePreferences(value) {
  if (!supabaseClient || !supabaseUser) return;
  const { error } = await supabaseClient.from("learning_preferences").upsert({
    student_id: supabaseUser.id,
    learning_styles: value.learningStyle || [],
    text_level: value.textLevel || "medium",
    help_styles: value.helpStyle || [],
    study_mode: value.studyMode || "both"
  }, { onConflict: "student_id" });
  if (error) throw error;
}

async function dbSaveProgress(period, topic) {
  if (!supabaseClient || !supabaseUser || !period || !topic) return;
  const { error } = await supabaseClient.from("lesson_progress").insert({
    student_id: supabaseUser.id, historical_period: period, topic, completed: true
  });
  if (error) throw error;
}

async function dbSaveQuiz(period, correct, total, percentage) {
  if (!supabaseClient || !supabaseUser || !period || !total) return;
  const { error } = await supabaseClient.from("quiz_attempts").insert({
    student_id: supabaseUser.id, historical_period: period,
    correct_answers: correct, total_questions: total
  });
  if (error) throw error;
}

const STORAGE_KEYS = {
  students: "eduia_students",
  accesses: "eduia_accesses",
  session: "eduia_current_session",
  font: "eduia_font_scale"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Erro ao salvar:", error);
  }
}

let student = null;
let preferences = null;
let selectedPeriod = null;
let currentTopic = "introduction";
let currentQuestion = 0;
let score = 0;
let quizQuestions = [];
let answered = false;
let currentFontScale = Number(readStorage(STORAGE_KEYS.font, 1)) || 1;

/* ==========================================
   CONTEÚDOS HISTÓRICOS
========================================== */

const periodData = {
  antiguidade: {
    title: "Idade Antiga",
    symbol: "🏺",
    description: "Conheça as primeiras grandes civilizações e suas transformações.",
    introduction: "A Idade Antiga é um período histórico marcado pelo desenvolvimento de grandes civilizações, cidades, escritas, governos e conhecimentos. Entre seus exemplos estão o Egito, a Mesopotâmia, a Grécia e Roma.",
    highlights: [
      "🏛️ Desenvolvimento das cidades e dos Estados.",
      "✍️ Surgimento de diferentes sistemas de escrita.",
      "🌾 Agricultura e organização das sociedades."
    ],
    topics: {
      introduction: {
        title: "O que foi a Idade Antiga?",
        text: "A Idade Antiga começou tradicionalmente com o surgimento da escrita, por volta de 4000 a.C. Esse período reúne sociedades que desenvolveram conhecimentos, leis, religiões, cidades e formas de organização política."
      },
      context: {
        title: "Contexto histórico",
        text: "O crescimento da agricultura permitiu que grupos humanos se estabelecessem em determinadas regiões. Próximo a rios, como o Nilo e o Tigre e Eufrates, surgiram sociedades organizadas, com produção de alimentos, comércio e governos."
      },
      events: {
        title: "Principais acontecimentos",
        text: "Entre os acontecimentos importantes estão o desenvolvimento da escrita na Mesopotâmia, a construção das pirâmides no Egito, a formação das cidades-Estado gregas e a expansão de Roma."
      },
      characters: {
        title: "Personagens e grupos importantes",
        text: "Faraós governavam o Egito. Na Grécia, cidadãos participavam de algumas decisões políticas, embora grande parte da população fosse excluída. Em Roma, senadores, imperadores, soldados e trabalhadores participavam de uma sociedade hierarquizada."
      },
      consequences: {
        title: "Consequências e legado",
        text: "As sociedades antigas deixaram contribuições importantes, como conhecimentos matemáticos, arquitetônicos, filosóficos, jurídicos e políticos. Muitas dessas ideias influenciam o mundo atual."
      },
      curiosities: {
        title: "Curiosidades",
        text: "Os egípcios desenvolveram técnicas de mumificação. Na Grécia Antiga surgiram os Jogos Olímpicos. O direito romano influenciou sistemas jurídicos utilizados em diversos países."
      }
    },
    summary: [
      "A Idade Antiga começou tradicionalmente com o surgimento da escrita.",
      "Civilizações importantes foram Egito, Mesopotâmia, Grécia e Roma.",
      "A agricultura e os rios favoreceram o desenvolvimento das cidades.",
      "O período deixou contribuições para a ciência, política, arte e cultura."
    ],
    comics: [
      ["🌾", "A agricultura", "A produção de alimentos permitiu que grupos humanos se estabelecessem em determinadas regiões."],
      ["✍️", "O surgimento da escrita", "A escrita ajudou a registrar informações, leis e atividades comerciais."],
      ["🏛️", "As cidades antigas", "Cidades cresceram e desenvolveram governos, construções e comércio."],
      ["⚖️", "As leis", "Diferentes sociedades criaram regras para organizar a convivência."]
    ],
    gallery: [
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/The%20pyramids%20of%20Giza.jpg?width=900",
        "Pirâmides de Gizé",
        "As pirâmides foram construídas no Egito Antigo e estão relacionadas ao poder dos faraós e às crenças sobre a vida após a morte.",
        "https://commons.wikimedia.org/wiki/File:The_pyramids_of_Giza.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Parthenon%2C%20Athens%2C%20Greece.jpg?width=900",
        "Partenon de Atenas",
        "Templo da Grécia Antiga dedicado à deusa Atena. É um exemplo importante da arquitetura grega.",
        "https://commons.wikimedia.org/wiki/File:Parthenon,_Athens,_Greece.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Colosseum%20-%20Rome.jpg?width=900",
        "Coliseu de Roma",
        "Grande anfiteatro romano utilizado para espetáculos públicos e eventos da sociedade romana.",
        "https://commons.wikimedia.org/wiki/File:Colosseum_-_Rome.jpg"
      ]
    ],
    questions: [
      {
        question: "Qual acontecimento é tradicionalmente utilizado para marcar o início da Idade Antiga?",
        options: ["A invenção da imprensa", "O surgimento da escrita", "A Revolução Industrial", "A chegada à Lua"],
        answer: 1,
        explanation: "O surgimento da escrita é tradicionalmente utilizado como marco inicial da Idade Antiga."
      },
      {
        question: "Qual rio foi fundamental para o desenvolvimento do Egito Antigo?",
        options: ["Rio Nilo", "Rio Amazonas", "Rio Sena", "Rio Tâmisa"],
        answer: 0,
        explanation: "O rio Nilo favoreceu a agricultura, o transporte e a organização da sociedade egípcia."
      },
      {
        question: "Qual civilização é conhecida por suas contribuições à filosofia?",
        options: ["Asteca", "Inca", "Grega", "Viking"],
        answer: 2,
        explanation: "A Grécia Antiga é conhecida por suas contribuições à filosofia e à política."
      },
      {
        question: "Qual foi uma importante contribuição das sociedades antigas?",
        options: ["A internet", "A aviação comercial", "Os computadores", "A escrita e conhecimentos matemáticos"],
        answer: 3,
        explanation: "A escrita e os conhecimentos matemáticos foram contribuições fundamentais."
      }
    ]
  },

  "idade-media": {
    title: "Idade Média",
    symbol: "🏰",
    description: "Explore a sociedade medieval, o feudalismo e suas transformações.",
    introduction: "A Idade Média é tradicionalmente situada entre o século V e o século XV. Foi marcada por transformações políticas, econômicas, sociais e culturais na Europa, além de importantes sociedades em outras regiões do mundo.",
    highlights: [
      "🏰 Organização social e política do feudalismo.",
      "🌾 Agricultura como importante atividade econômica.",
      "📜 Transformações culturais e comerciais."
    ],
    topics: {
      introduction: {
        title: "O que foi a Idade Média?",
        text: "A Idade Média é um período da História que começou tradicionalmente em 476, com a queda do Império Romano do Ocidente, e terminou convencionalmente em 1453, com a conquista de Constantinopla pelos otomanos."
      },
      context: {
        title: "Contexto histórico",
        text: "Na Europa Ocidental, ocorreram mudanças na organização política após a fragmentação do Império Romano. A agricultura ganhou importância e diferentes relações de dependência e poder se desenvolveram no campo."
      },
      events: {
        title: "Principais acontecimentos",
        text: "Entre os acontecimentos estão a expansão do cristianismo na Europa, o desenvolvimento do feudalismo, o crescimento das cidades, as Cruzadas, a expansão comercial e a crise do século XIV."
      },
      characters: {
        title: "Personagens e grupos importantes",
        text: "A sociedade medieval europeia incluía nobres, membros do clero, camponeses, artesãos e comerciantes. Em outras regiões, diferentes povos desenvolveram grandes centros urbanos, conhecimentos científicos e redes comerciais."
      },
      consequences: {
        title: "Consequências e legado",
        text: "A Idade Média deixou marcas na arquitetura, na arte, na filosofia, nas instituições religiosas e na formação de diferentes reinos europeus."
      },
      curiosities: {
        title: "Curiosidades",
        text: "Castelos eram construídos para defesa e demonstração de poder. Manuscritos eram copiados à mão. As universidades medievais contribuíram para a organização do ensino."
      }
    },
    summary: [
      "A Idade Média é tradicionalmente situada entre os séculos V e XV.",
      "O feudalismo marcou parte da organização social e econômica europeia.",
      "A agricultura tinha grande importância.",
      "O comércio e as cidades cresceram ao longo do período."
    ],
    comics: [
      ["🏰", "O castelo", "Castelos eram construções ligadas à defesa e ao poder de determinados grupos."],
      ["🌾", "A vida no campo", "A agricultura era uma atividade central na economia medieval europeia."],
      ["📜", "Os manuscritos", "Livros eram copiados manualmente e preservados em diferentes instituições."],
      ["🏙️", "O crescimento das cidades", "O comércio contribuiu para a expansão de centros urbanos."]
    ],
    gallery: [
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Medieval%20Castle.jpg?width=900",
        "Castelo medieval",
        "Castelos eram construções ligadas à defesa, à autoridade e às relações de poder da sociedade medieval.",
        "https://commons.wikimedia.org/wiki/File:Medieval_Castle.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Medieval%20castle.jpg?width=900",
        "Arquitetura medieval",
        "Construções medievais permitem observar características da arquitetura defensiva e das relações de poder da época.",
        "https://commons.wikimedia.org/wiki/File:Medieval_castle.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Illuminated%20manuscript.jpg?width=900",
        "Manuscrito ilustrado",
        "Manuscritos eram produzidos e decorados manualmente, preservando conhecimentos e registros de diferentes épocas.",
        "https://commons.wikimedia.org/wiki/File:Illuminated_manuscript.jpg"
      ]
    ],
    questions: [
      {
        question: "Qual acontecimento é tradicionalmente utilizado como marco inicial da Idade Média?",
        options: ["Queda do Império Romano do Ocidente", "Revolução Francesa", "Primeira Guerra Mundial", "Independência do Brasil"],
        answer: 0,
        explanation: "A queda do Império Romano do Ocidente, em 476, é um marco tradicional do início da Idade Média."
      },
      {
        question: "Qual atividade tinha grande importância na economia medieval europeia?",
        options: ["Indústria automobilística", "Agricultura", "Produção de computadores", "Aviação"],
        answer: 1,
        explanation: "A agricultura era uma atividade fundamental na economia medieval europeia."
      },
      {
        question: "Qual grupo estava associado às atividades religiosas na Europa medieval?",
        options: ["Operários industriais", "Exploradores espaciais", "Clero", "Empresários digitais"],
        answer: 2,
        explanation: "O clero era o grupo ligado às instituições religiosas."
      },
      {
        question: "O que contribuiu para o crescimento de muitas cidades medievais?",
        options: ["A internet", "A televisão", "A indústria eletrônica", "A expansão do comércio"],
        answer: 3,
        explanation: "A expansão das atividades comerciais contribuiu para o crescimento de cidades."
      }
    ]
  },

  "idade-moderna": {
    title: "Idade Moderna",
    symbol: "⛵",
    description: "Descubra o Renascimento, as navegações e as transformações políticas.",
    introduction: "A Idade Moderna é tradicionalmente situada entre os séculos XV e XVIII. O período foi marcado por mudanças culturais, científicas, econômicas e políticas, incluindo o Renascimento, as navegações oceânicas e o fortalecimento das monarquias.",
    highlights: [
      "🎨 Renascimento cultural e científico.",
      "⛵ Expansão marítima europeia.",
      "👑 Fortalecimento de monarquias nacionais."
    ],
    topics: {
      introduction: {
        title: "O que foi a Idade Moderna?",
        text: "A Idade Moderna foi um período de grandes transformações. Novas ideias sobre ciência, arte e sociedade circularam, enquanto as relações comerciais e políticas se modificaram."
      },
      context: {
        title: "Contexto histórico",
        text: "O crescimento do comércio, a formação de monarquias centralizadas e o desenvolvimento de novas técnicas de navegação contribuíram para mudanças na Europa e em outras regiões do mundo."
      },
      events: {
        title: "Principais acontecimentos",
        text: "Entre os acontecimentos estão o Renascimento, a Reforma Protestante, a expansão marítima europeia, a colonização de territórios e o desenvolvimento do absolutismo em diferentes monarquias."
      },
      characters: {
        title: "Personagens e grupos importantes",
        text: "Artistas, cientistas, navegadores, comerciantes, monarcas e povos indígenas participaram de processos históricos importantes. As experiências e consequências desses processos foram diferentes para cada sociedade."
      },
      consequences: {
        title: "Consequências e legado",
        text: "O período ampliou conexões comerciais entre continentes, transformou conhecimentos científicos e fortaleceu disputas por territórios e riquezas. A colonização provocou violência, exploração e profundas mudanças para povos originários."
      },
      curiosities: {
        title: "Curiosidades",
        text: "A imprensa de tipos móveis facilitou a reprodução de livros. Artistas renascentistas estudaram perspectiva e anatomia. As viagens oceânicas conectaram regiões antes pouco relacionadas pelo comércio europeu."
      }
    },
    summary: [
      "A Idade Moderna é tradicionalmente situada entre os séculos XV e XVIII.",
      "O Renascimento valorizou as artes, os estudos e a investigação científica.",
      "As navegações ampliaram conexões entre continentes.",
      "A colonização provocou exploração e transformações profundas em diversos povos."
    ],
    comics: [
      ["🎨", "O Renascimento", "Artistas e estudiosos ampliaram pesquisas sobre arte, natureza e conhecimento."],
      ["⛵", "As navegações", "Embarcações cruzaram oceanos em busca de rotas comerciais e territórios."],
      ["📚", "A imprensa", "A reprodução de livros favoreceu a circulação de informações."],
      ["🌎", "A colonização", "A expansão colonial transformou sociedades e provocou exploração de povos."]
    ],
    gallery: [
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Mona%20Lisa.jpg?width=900",
        "Mona Lisa",
        "Obra de Leonardo da Vinci, um dos artistas mais conhecidos do Renascimento.",
        "https://commons.wikimedia.org/wiki/File:Mona_Lisa.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/The%20School%20of%20Athens%20by%20Raphael.jpg?width=900",
        "A Escola de Atenas",
        "Afresco de Rafael que representa filósofos e estudiosos da Antiguidade, valorizando o conhecimento e a perspectiva artística.",
        "https://commons.wikimedia.org/wiki/File:The_School_of_Athens_by_Raphael.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Portuguese%20Caravel.jpg?width=900",
        "Caravela portuguesa",
        "Modelo de embarcação associada às navegações oceânicas e à expansão marítima europeia.",
        "https://commons.wikimedia.org/wiki/File:Portuguese_Caravel.jpg"
      ]
    ],
    questions: [
      {
        question: "Qual movimento valorizou as artes e os estudos sobre o ser humano?",
        options: ["Feudalismo", "Renascimento", "Guerra Fria", "Revolução Industrial"],
        answer: 1,
        explanation: "O Renascimento valorizou as artes, o conhecimento e diferentes investigações científicas."
      },
      {
        question: "O que as navegações europeias ampliaram?",
        options: ["O isolamento dos continentes", "O fim do comércio", "As conexões marítimas entre regiões", "A comunicação pela internet"],
        answer: 2,
        explanation: "As navegações ampliaram conexões marítimas e comerciais entre diferentes regiões."
      },
      {
        question: "Qual invenção favoreceu a reprodução de livros na Europa?",
        options: ["Imprensa de tipos móveis", "Telefone celular", "Rádio digital", "Motor elétrico"],
        answer: 0,
        explanation: "A imprensa de tipos móveis facilitou a reprodução de livros."
      },
      {
        question: "Qual foi uma consequência da colonização europeia?",
        options: ["Fim de todas as disputas", "Ausência de mudanças sociais", "Desaparecimento do comércio", "Exploração e transformação de povos e territórios"],
        answer: 3,
        explanation: "A colonização provocou exploração e profundas transformações em diferentes sociedades."
      }
    ]
  },

  "idade-contemporanea": {
    title: "Idade Contemporânea",
    symbol: "🌎",
    description: "Compreenda as revoluções, a industrialização e o mundo atual.",
    introduction: "A Idade Contemporânea começou convencionalmente em 1789, com a Revolução Francesa. É um período marcado por revoluções políticas, industrialização, conflitos mundiais, mudanças sociais e avanços tecnológicos.",
    highlights: [
      "🇫🇷 Revolução Francesa e mudanças políticas.",
      "🏭 Industrialização e transformações no trabalho.",
      "🌐 Guerras, direitos sociais e tecnologia."
    ],
    topics: {
      introduction: {
        title: "O que foi a Idade Contemporânea?",
        text: "A Idade Contemporânea é o período histórico iniciado convencionalmente em 1789. Desde então, o mundo passou por profundas transformações políticas, econômicas, sociais e tecnológicas."
      },
      context: {
        title: "Contexto histórico",
        text: "No final do século XVIII, ideias iluministas questionavam privilégios e formas tradicionais de poder. Ao mesmo tempo, mudanças econômicas e sociais transformavam a Europa."
      },
      events: {
        title: "Principais acontecimentos",
        text: "Entre os acontecimentos estão a Revolução Francesa, a Revolução Industrial, as independências na América, as duas guerras mundiais, a Guerra Fria e a expansão da tecnologia digital."
      },
      characters: {
        title: "Personagens e grupos importantes",
        text: "Trabalhadores, movimentos sociais, lideranças políticas, mulheres, intelectuais e diferentes grupos da sociedade participaram das transformações contemporâneas."
      },
      consequences: {
        title: "Consequências e legado",
        text: "O período transformou as relações de trabalho, a organização dos Estados, os direitos políticos e sociais e as formas de comunicação. Também foi marcado por conflitos, desigualdades e disputas internacionais."
      },
      curiosities: {
        title: "Curiosidades",
        text: "A Revolução Industrial modificou a produção de mercadorias. A internet transformou a comunicação. Movimentos sociais tiveram papel importante na conquista de direitos."
      }
    },
    summary: [
      "A Idade Contemporânea começou convencionalmente em 1789.",
      "A Revolução Francesa transformou ideias políticas e sociais.",
      "A industrialização modificou a produção e o trabalho.",
      "Guerras, movimentos sociais e tecnologias marcaram o período."
    ],
    comics: [
      ["🇫🇷", "A Revolução Francesa", "A população questionou privilégios e estruturas políticas do Antigo Regime."],
      ["🏭", "A industrialização", "Máquinas e fábricas transformaram a produção de mercadorias."],
      ["🕊️", "Os conflitos mundiais", "Guerras transformaram fronteiras, sociedades e relações internacionais."],
      ["💻", "A tecnologia digital", "Novas tecnologias modificaram a comunicação e o cotidiano."]
    ],
    gallery: [
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Prise%20de%20la%20Bastille.jpg?width=900",
        "Queda da Bastilha",
        "Representação histórica de um dos acontecimentos mais conhecidos da Revolução Francesa, iniciada em 1789.",
        "https://commons.wikimedia.org/wiki/File:Prise_de_la_Bastille.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Industriutst%C3%A4llningen%201866%20Interior.jpg?width=900",
        "Exposição industrial de 1866",
        "Registro do interior de uma exposição industrial em Estocolmo, mostrando máquinas e transformações tecnológicas do século XIX.",
        "https://commons.wikimedia.org/wiki/File:Industriutst%C3%A4llningen_1866_Interior.jpg"
      ],
      [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Apollo%2011%20first%20photo%20on%20Moon%20after%20landing%20%2848334532882%29.jpg?width=900",
        "Missão Apollo 11",
        "Fotografia da missão de 1969, quando seres humanos chegaram à Lua pela primeira vez.",
        "https://commons.wikimedia.org/wiki/File:Apollo_11_first_photo_on_Moon_after_landing_(48334532882).jpg"
      ]
    ],
    questions: [
      {
        question: "Qual acontecimento é tradicionalmente utilizado como marco inicial da Idade Contemporânea?",
        options: ["Queda de Roma", "Revolução Francesa", "Invenção da escrita", "Guerra Fria"],
        answer: 1,
        explanation: "A Revolução Francesa, iniciada em 1789, é um marco convencional da Idade Contemporânea."
      },
      {
        question: "Qual transformação marcou a Revolução Industrial?",
        options: ["Fim da agricultura", "Invenção da escrita", "Uso crescente de máquinas e fábricas", "Criação da democracia ateniense"],
        answer: 2,
        explanation: "A industrialização ampliou o uso de máquinas e fábricas na produção."
      },
      {
        question: "O que os movimentos sociais buscaram em diferentes momentos da Idade Contemporânea?",
        options: ["Direitos e mudanças sociais", "Fim de toda participação política", "Retorno obrigatório ao feudalismo", "Proibição da educação"],
        answer: 0,
        explanation: "Diversos movimentos sociais lutaram por direitos e transformações na sociedade."
      },
      {
        question: "Qual tecnologia transformou profundamente a comunicação contemporânea?",
        options: ["Ábaco", "Papiro", "Máquina a vapor", "Internet"],
        answer: 3,
        explanation: "A internet transformou a comunicação e o acesso à informação."
      }
    ]
  }
};

/* ==========================================
   NAVEGAÇÃO ENTRE AS 12 INTERFACES
========================================== */

function goToScreen(number) {
  const target = $(`#screen-${number}`);
  if (!target) return;

  $$(".screen").forEach(screen => screen.classList.remove("active"));
  target.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const navigationButton = event.target.closest("[data-go]");
  if (!navigationButton) return;

  const number = Number(navigationButton.dataset.go);
  if (number === 7) renderLessonIntroduction();
  if (number === 8) renderTopic(currentTopic);
  if (number === 9) renderVisualLearning();
  if (number === 10) renderSummary("summary");
  if (number === 11) startQuiz();

  goToScreen(number);
});

/* ==========================================
   ACESSIBILIDADE: TAMANHO DO TEXTO
========================================== */

function applyFontScale() {
  document.documentElement.style.setProperty("--font-scale", currentFontScale);
  saveStorage(STORAGE_KEYS.font, currentFontScale);
}

$("#font-increase")?.addEventListener("click", () => {
  currentFontScale = Math.min(1.4, currentFontScale + 0.1);
  applyFontScale();
});

$("#font-decrease")?.addEventListener("click", () => {
  currentFontScale = Math.max(0.8, currentFontScale - 0.1);
  applyFontScale();
});

/* ==========================================
   CADASTRO DO ESTUDANTE
========================================== */

$("#student-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  student = {
    id: Date.now(),
    name: $("#student-name").value.trim(),
    age: $("#student-age").value,
    gender: $("#student-gender").value,
    grade: $("#student-grade").value,
    school: $("#student-school").value.trim(),
    schoolType: $("#student-school-type").value,
    createdAt: new Date().toISOString(),
    period: "",
    score: null,
    preferences: null
  };

  if (!student.name || !student.age || !student.gender ||
      !student.grade || !student.school || !student.schoolType) {
    alert("Preencha todos os campos para continuar.");
    return;
  }

  saveStorage(STORAGE_KEYS.session, student);

  try {
    const dbUser = await ensureSupabaseStudent();
    if (dbUser) {
      student.databaseId = dbUser.id;
      await dbSaveStudent(student);
      saveStorage(STORAGE_KEYS.session, student);
    }
  } catch (error) {
    console.error("Falha ao registrar sessão no banco:", error);
  }

  const accesses = readStorage(STORAGE_KEYS.accesses, 0);
  saveStorage(STORAGE_KEYS.accesses, accesses + 1);

  goToScreen(4);
});

/* ==========================================
   PREFERÊNCIAS DE APRENDIZAGEM
========================================== */

$("#preferences-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!student) {
    alert("Preencha primeiro seu cadastro.");
    goToScreen(3);
    return;
  }

  const learningStyle = $$('input[name="learningStyle"]:checked')
    .map(input => input.value);

  const helpStyle = $$('input[name="helpStyle"]:checked')
    .map(input => input.value);

  if (helpStyle.length > 2) {
    alert("Escolha no máximo duas opções na pergunta 3.");
    return;
  }

  preferences = {
    learningStyle,
    textLevel: $("#text-level").value,
    helpStyle,
    studyMode: $("#study-mode").value
  };

  student.preferences = preferences;
  saveStorage(STORAGE_KEYS.session, student);

  try { await dbSavePreferences(preferences); }
  catch (error) { console.error("Falha ao salvar preferências:", error); }

  goToScreen(5);
});

/* ==========================================
   ESCOLHA DO PERÍODO
========================================== */

$$(".period-card").forEach(card => {
  card.addEventListener("click", () => {
    const period = card.dataset.period;

    if (!periodData[period]) return;

    selectedPeriod = period;
    student.period = period;
    saveStorage(STORAGE_KEYS.session, student);

    renderPersonalization();
    goToScreen(6);
  });
});

/* ==========================================
   PERSONALIZAÇÃO
========================================== */

function renderPersonalization() {
  if (!student || !preferences || !selectedPeriod) return;

  const period = periodData[selectedPeriod];

  $("#personalization-title").textContent =
    `Sua aula: ${period.title}`;

  $("#personalization-summary").innerHTML = `
    <h3>Olá, ${escapeHTML(student.name)}!</h3>
    <p>Você escolheu estudar <strong>${escapeHTML(period.title)}</strong>.</p>
    <p>Vamos organizar o conteúdo de acordo com suas preferências.</p>
  `;

  const learningNames = {
    text: "Textos",
    images: "Imagens",
    comics: "Quadrinhos",
    audio: "Áudio",
    video: "Vídeos"
  };

  const helpNames = {
    simpler: "Linguagem simples",
    examples: "Exemplos",
    images: "Imagens",
    repeat: "Repetição das explicações"
  };

  const studyNames = {
    alone: "Estudar sozinho(a)",
    accompanied: "Estudar acompanhado(a)",
    both: "Estudar das duas maneiras"
  };

  const levelNames = {
    short: "Explicações curtas",
    medium: "Explicações intermediárias",
    detailed: "Explicações detalhadas"
  };

  $("#personalization-details").innerHTML = `
    <div class="personalization-details">
      <p><strong>📚 Recursos:</strong> ${
        preferences.learningStyle.length
          ? preferences.learningStyle.map(item => learningNames[item]).join(", ")
          : "Nenhum recurso específico selecionado"
      }</p>
      <p><strong>📝 Explicações:</strong> ${levelNames[preferences.textLevel]}</p>
      <p><strong>💡 Apoio:</strong> ${
        preferences.helpStyle.length
          ? preferences.helpStyle.map(item => helpNames[item]).join(", ")
          : "Sem preferência adicional"
      }</p>
      <p><strong>🤝 Forma de estudo:</strong> ${studyNames[preferences.studyMode]}</p>
    </div>
  `;
}

/* ==========================================
   INTRODUÇÃO DA AULA
========================================== */

function renderLessonIntroduction() {
  const period = periodData[selectedPeriod];
  if (!period) return;

  $("#lesson-symbol").textContent = period.symbol;
  $("#lesson-title").textContent = period.title;
  $("#lesson-description").textContent = period.description;
  $("#content-period-title").textContent = `Vamos conhecer ${period.title}?`;
  $("#lesson-intro-text").textContent = adaptText(period.introduction);

  $("#lesson-highlights").innerHTML = period.highlights
    .map(item => `<div>${escapeHTML(item)}</div>`)
    .join("");
}

/* ==========================================
   ADAPTAÇÃO DO TEXTO
========================================== */

function adaptText(text) {
  if (!preferences) return text;

  if (preferences.textLevel === "short") {
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences.slice(0, 2).join(" ");
  }

  if (preferences.textLevel === "medium") {
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences.slice(0, 3).join(" ");
  }

  return text;
}

/* ==========================================
   ABAS E CONTEÚDO DA AULA
========================================== */

function renderTopic(topic) {
  const period = periodData[selectedPeriod];
  if (!period || !period.topics[topic]) return;

  currentTopic = topic;

  $$(".lesson-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.topic === topic);
  });

  const content = period.topics[topic];
  if (student?.databaseId) dbSaveProgress(selectedPeriod, topic).catch(error => console.error("Falha ao salvar progresso:", error));

  $("#content-title").textContent = period.title;
  $("#lesson-content").innerHTML = `
    <h2>${escapeHTML(content.title)}</h2>
    <p>${escapeHTML(adaptText(content.text))}</p>
  `;
}

$$(".lesson-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    renderTopic(tab.dataset.topic);
  });
});

/* ==========================================
   LEITURA EM ÁUDIO
========================================== */

$("#speak-content")?.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    alert("Seu navegador não oferece leitura em áudio.");
    return;
  }

  const text = $("#lesson-content")?.innerText;
  if (!text) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
});

$("#stop-audio")?.addEventListener("click", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

/* ==========================================
   QUADRINHOS E GALERIA HISTÓRICA REAL
========================================== */

function renderVisualLearning() {
  const period = periodData[selectedPeriod];
  if (!period) return;

  /* QUADRINHOS */

  $("#comic-title").textContent =
    `Uma história em cenas: ${period.title}`;

  $("#comic-panels").innerHTML = period.comics.map((comic, index) => `
    <article class="comic-panel">
      <div class="comic-illustration">
        ${escapeHTML(comic[0])}
      </div>

      <div class="comic-panel-content">
        <h3>Cena ${index + 1}: ${escapeHTML(comic[1])}</h3>
        <p>${escapeHTML(comic[2])}</p>
      </div>
    </article>
  `).join("");

  /* GALERIA COM FOTOGRAFIAS E IMAGENS REAIS */

  $("#history-gallery").innerHTML = `
    <div class="gallery-heading">
      <h2>Galeria histórica</h2>
      <p>
        Conheça imagens reais relacionadas a
        ${escapeHTML(period.title)}.
      </p>
    </div>

    <div class="history-gallery-grid">

      ${period.gallery.map(item => `
        <article class="gallery-card">

          <img
            class="gallery-photo"
            src="${escapeHTML(item[0])}"
            alt="${escapeHTML(item[1])}"
            loading="lazy"
            style="width:100%;height:200px;object-fit:cover;display:block;"
            onerror="this.alt='Imagem indisponível';this.style.display='none';"
          >

          <div class="gallery-card-content">

            <h3>${escapeHTML(item[1])}</h3>

            <p>${escapeHTML(item[2])}</p>

            <a
              href="${escapeHTML(item[3])}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar origem da imagem ↗
            </a>

          </div>
        </article>
      `).join("")}

    </div>
  `;
}

/* ==========================================
   RESUMO E MAPA MENTAL
========================================== */

function renderSummary(model) {
  const period = periodData[selectedPeriod];
  if (!period) return;

  if (model === "summary") {
    $("#summary-title").textContent = `Resumo: ${period.title}`;

    $("#summary-content").innerHTML = period.summary.map((item, index) => `
      <div class="summary-section">
        <p><strong>${index + 1}.</strong> ${escapeHTML(item)}</p>
      </div>
    `).join("");

    $("#mind-map-title").innerHTML = "";
    $("#mind-map").innerHTML = "";
  } else {
    $("#summary-title").textContent = `Mapa mental: ${period.title}`;
    $("#summary-content").innerHTML = "";

    $("#mind-map-title").innerHTML = "<h3>Organização das ideias principais</h3>";

    $("#mind-map").innerHTML = `
      <div class="mind-map">
        <div class="radial-map">
          <div class="mind-node central">${escapeHTML(period.title)}</div>
          <div class="mind-branches">
            ${period.summary.map(item => `
              <div class="mind-node">${escapeHTML(item)}</div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }
}

$$("[data-summary-model]").forEach(button => {
  button.addEventListener("click", () => {
    renderSummary(button.dataset.summaryModel);
  });
});

/* ==========================================
   QUIZ
========================================== */

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function startQuiz() {
  const period = periodData[selectedPeriod];
  if (!period) return;

  quizQuestions = period.questions.map(question => {
    const options = question.options.map((text, index) => ({
      text,
      correct: index === question.answer
    }));

    return {
      question: question.question,
      options: shuffleArray(options),
      explanation: question.explanation
    };
  });

  currentQuestion = 0;
  score = 0;
  answered = false;

  renderQuestion();
}

function renderQuestion() {
  const question = quizQuestions[currentQuestion];
  if (!question) return;

  answered = false;

  $("#question-counter").textContent =
    `Questão ${currentQuestion + 1} de ${quizQuestions.length}`;

  const progress = (currentQuestion / quizQuestions.length) * 100;

  $("#quiz-progress-label").textContent = `${Math.round(progress)}%`;
  $("#quiz-progress-fill").style.width = `${progress}%`;

  $("#quiz-question").textContent = question.question;
  $("#quiz-feedback").textContent = "";
  $("#quiz-feedback").className = "quiz-feedback";

  $("#quiz-next").disabled = true;

  $("#quiz-next").textContent =
    currentQuestion === quizQuestions.length - 1
      ? "Ver resultado →"
      : "Próxima questão →";

  $("#quiz-options").innerHTML = question.options.map((option, index) => `
    <button
      type="button"
      class="quiz-option"
      data-option="${index}"
    >
      ${String.fromCharCode(65 + index)}. ${escapeHTML(option.text)}
    </button>
  `).join("");

  $$(".quiz-option").forEach(button => {
    button.addEventListener("click", () => {
      selectAnswer(Number(button.dataset.option));