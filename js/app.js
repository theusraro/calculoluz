// ==================== USUÁRIOS DO SISTEMA ====================
const USUARIOS = {
  cida: "123571",
  theus: "theus2605"
};

// ==================== DADOS ====================
let dados = JSON.parse(localStorage.getItem("energiaJF")) || {
  tarifa: 1.18002201,
  pessoas: {}
};

let usuarioLogado = localStorage.getItem("usuarioLogado") || null;

// ==================== TEMA ====================
function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("tema", isDark ? "dark" : "light");

  document.getElementById("themeIcon").textContent = isDark ? "☀️" : "🌙";
  document.getElementById("themeText").textContent = isDark ? "Modo Claro" : "Modo Escuro";
}

// Carrega tema salvo
if (localStorage.getItem("tema") === "dark") {
  document.documentElement.classList.add("dark");
}

// ==================== LOGIN ====================
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const user = document.getElementById("loginUser").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value;

  if (USUARIOS[user] && USUARIOS[user] === pass) {
    usuarioLogado = user;
    localStorage.setItem("usuarioLogado", user);
    mostrarApp();
  } else {
    const error = document.getElementById("loginError");
    error.textContent = "Usuário ou senha incorretos";
    error.classList.remove("hidden");
  }
});

function logout() {
  localStorage.removeItem("usuarioLogado");
  usuarioLogado = null;
  document.getElementById("appScreen").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginError").classList.add("hidden");
}

function mostrarApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  document.getElementById("userLogged").textContent = usuarioLogado.toUpperCase();

  const isDark = document.documentElement.classList.contains("dark");
  document.getElementById("themeIcon").textContent = isDark ? "☀️" : "🌙";
  document.getElementById("themeText").textContent = isDark ? "Modo Claro" : "Modo Escuro";

  renderizar();
}

// ==================== FUNÇÕES PRINCIPAIS ====================
function salvar() {
  localStorage.setItem("energiaJF", JSON.stringify(dados));
  renderizar();
}

function salvarTarifa() {
  dados.tarifa = parseFloat(document.getElementById("tarifa").value) || 1.18002201;
  salvar();
}

function adicionarPessoa() {
  const nome = document.getElementById("novaPessoa").value.trim().toUpperCase();
  if (!nome) return alert("Digite o nome da pessoa");
  if (dados.pessoas[nome]) return alert("Essa pessoa já está cadastrada");

  dados.pessoas[nome] = { leituras: {} };
  document.getElementById("novaPessoa").value = "";
  salvar();
}

function adicionarLeitura(nome) {
  const mes = prompt("Qual o mês? (exemplo: 7 ou 8)");
  if (!mes) return;

  const valor = prompt(`Leitura do Mês ${mes} (em kWh):`);
  if (!valor || isNaN(valor)) return alert("Valor inválido");

  dados.pessoas[nome].leituras[mes] = parseFloat(valor);
  salvar();
}

// ========== NOVA FUNÇÃO: EDITAR LEITURA ==========
function editarLeitura(nome) {
  const leituras = dados.pessoas[nome].leituras;
  const meses = Object.keys(leituras);

  if (meses.length === 0) {
    return alert("Essa pessoa ainda não tem nenhuma leitura cadastrada.");
  }

  const mes = prompt(`Qual mês deseja editar?\nMeses disponíveis: ${meses.join(", ")}`);
  if (!mes) return;

  if (!leituras[mes]) {
    return alert(`O mês ${mes} não existe para ${nome}.`);
  }

  const valorAtual = leituras[mes];
  const novoValor = prompt(`Leitura atual do Mês ${mes}: ${valorAtual} kWh\n\nDigite o novo valor:`);
  
  if (!novoValor || isNaN(novoValor)) return alert("Valor inválido");

  dados.pessoas[nome].leituras[mes] = parseFloat(novoValor);
  salvar();
  alert(`Leitura do Mês ${mes} atualizada com sucesso!`);
}

function calcularConsumo(nome) {
  const leituras = dados.pessoas[nome].leituras;
  const meses = Object.keys(leituras).map(Number).sort((a, b) => a - b);

  if (meses.length < 2) {
    return {
      consumo: 0,
      valor: 0,
      texto: "Precisa de pelo menos 2 meses de leitura"
    };
  }

  const mesAnterior = meses[meses.length - 2];
  const mesAtual = meses[meses.length - 1];

  const anterior = leituras[mesAnterior];
  const atual = leituras[mesAtual];
  const consumo = atual - anterior;
  const valor = consumo * dados.tarifa;

  return {
    consumo,
    valor,
    texto: `Mês ${mesAnterior}: ${anterior} kWh  →  Mês ${mesAtual}: ${atual} kWh`
  };
}

function renderizar() {
  document.getElementById("tarifa").value = dados.tarifa;

  const container = document.getElementById("listaPessoas");
  container.innerHTML = "";

  let totalValor = 0;
  let totalKwh = 0;

  const nomes = Object.keys(dados.pessoas).sort();

  if (nomes.length === 0) {
    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center text-gray-400">
        Nenhuma pessoa cadastrada ainda
      </div>`;
    document.getElementById("totalGeral").textContent = "R$ 0,00";
    document.getElementById("totalKwh").textContent = "0 kWh";
    return;
  }

  nomes.forEach((nome) => {
    const calc = calcularConsumo(nome);
    totalValor += calc.valor;
    totalKwh += calc.consumo;

    const card = document.createElement("div");
    card.className = "bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 fade-in";

    card.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-xl font-bold">${nome}</h3>
        <div class="flex gap-2">
          <button onclick="adicionarLeitura('${nome}')"
                  class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition">
            + Lançar
          </button>
          <button onclick="editarLeitura('${nome}')"
                  class="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-sm px-3 py-1.5 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition">
            ✏ Editar
          </button>
        </div>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${calc.texto}</p>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
          <p class="text-sm text-blue-600 dark:text-blue-400">Consumo</p>
          <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">${calc.consumo.toFixed(0)} kWh</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 text-center">
          <p class="text-sm text-green-600 dark:text-green-400">Valor a Cobrar</p>
          <p class="text-2xl font-bold text-green-700 dark:text-green-300">R$ ${calc.valor.toFixed(2)}</p>
        </div>
      </div>

      <div class="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Histórico: ${
          Object.entries(dados.pessoas[nome].leituras)
            .map(([m, v]) => `Mês ${m}: ${v} kWh`)
            .join("  •  ") || "Nenhuma leitura"
        }
      </div>
    `;

    container.appendChild(card);
  });

  document.getElementById("totalGeral").textContent = `R$ ${totalValor.toFixed(2)}`;
  document.getElementById("totalKwh").textContent = `${totalKwh.toFixed(0)} kWh`;
}

// ==================== INICIALIZAÇÃO ====================
if (usuarioLogado && USUARIOS[usuarioLogado]) {
  mostrarApp();
} else {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}