// ==================== SUPABASE ====================
const SUPABASE_URL = "https://qwhjvbbwpenhlfwewuup.supabase.co";
const SUPABASE_KEY = "sb_publishable_cj5g0QQ8d7pgDMNWC87IDQ_Uy0Up1PT";

let supabaseClient = null;

try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase conectado com sucesso");
} catch (err) {
  console.error("Erro ao conectar Supabase:", err);
}

// ==================== USUÁRIOS DO SISTEMA ====================
const USUARIOS = {
  cida: "123571",
  theus: "theus2605"
};

let usuarioLogado = localStorage.getItem("usuarioLogado") || null;
let tarifaAtual = 1.18002201;

// ==================== TEMA ====================
function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("tema", isDark ? "dark" : "light");

  document.getElementById("themeIcon").textContent = isDark ? "☀️" : "🌙";
  document.getElementById("themeText").textContent = isDark ? "Modo Claro" : "Modo Escuro";
}

if (localStorage.getItem("tema") === "dark") {
  document.documentElement.classList.add("dark");
}

// ==================== LOGIN ====================
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const user = document.getElementById("loginUser").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value;

  console.log("Tentando login:", user);

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

  carregarDados();
}

// ==================== FUNÇÕES COM SUPABASE ====================

async function carregarTarifa() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("config")
    .select("tarifa")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erro ao carregar tarifa:", error);
    return;
  }

  tarifaAtual = parseFloat(data.tarifa) || 1.18002201;
  document.getElementById("tarifa").value = tarifaAtual;
}

async function salvarTarifa() {
  if (!supabaseClient) return alert("Supabase não conectado");

  const novaTarifa = parseFloat(document.getElementById("tarifa").value) || 1.18002201;
  tarifaAtual = novaTarifa;

  const { error } = await supabaseClient
    .from("config")
    .update({ tarifa: novaTarifa, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    alert("Erro ao salvar tarifa: " + error.message);
    return;
  }

  carregarDados();
}

async function adicionarPessoa() {
  if (!supabaseClient) return alert("Supabase não conectado");

  const nome = document.getElementById("novaPessoa").value.trim().toUpperCase();
  if (!nome) return alert("Digite o nome da pessoa");

  const { error } = await supabaseClient
    .from("pessoas")
    .insert([{ nome }]);

  if (error) {
    if (error.code === "23505") {
      alert("Essa pessoa já está cadastrada");
    } else {
      alert("Erro ao cadastrar: " + error.message);
    }
    return;
  }

  document.getElementById("novaPessoa").value = "";
  carregarDados();
}

async function adicionarLeitura(pessoaId, nome) {
  if (!supabaseClient) return alert("Supabase não conectado");

  const mes = prompt("Qual o mês? (exemplo: 7 ou 8)");
  if (!mes) return;

  const valor = prompt(`Leitura do Mês ${mes} (em kWh):`);
  if (!valor || isNaN(valor)) return alert("Valor inválido");

  const { error } = await supabaseClient
    .from("leituras")
    .upsert([{
      pessoa_id: pessoaId,
      mes: parseInt(mes),
      valor: parseFloat(valor)
    }], { onConflict: "pessoa_id,mes" });

  if (error) {
    alert("Erro ao lançar leitura: " + error.message);
    return;
  }

  carregarDados();
}

async function editarLeitura(pessoaId, nome, leituras) {
  if (!supabaseClient) return alert("Supabase não conectado");

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

  const { error } = await supabaseClient
    .from("leituras")
    .update({ valor: parseFloat(novoValor) })
    .eq("pessoa_id", pessoaId)
    .eq("mes", parseInt(mes));

  if (error) {
    alert("Erro ao editar leitura: " + error.message);
    return;
  }

  alert(`Leitura do Mês ${mes} atualizada com sucesso!`);
  carregarDados();
}

function calcularConsumo(leituras) {
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
  const valor = consumo * tarifaAtual;

  return {
    consumo,
    valor,
    texto: `Mês ${mesAnterior}: ${anterior} kWh  →  Mês ${mesAtual}: ${atual} kWh`
  };
}

async function carregarDados() {
  await carregarTarifa();

  if (!supabaseClient) {
    document.getElementById("listaPessoas").innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center text-red-500">
        Erro: Supabase não conectado. Verifique a chave.
      </div>`;
    return;
  }

  const { data: pessoas, error: errorPessoas } = await supabaseClient
    .from("pessoas")
    .select("*")
    .order("nome");

  if (errorPessoas) {
    console.error("Erro ao carregar pessoas:", errorPessoas);
    alert("Erro ao carregar dados: " + errorPessoas.message);
    return;
  }

  const { data: todasLeituras, error: errorLeituras } = await supabaseClient
    .from("leituras")
    .select("*");

  if (errorLeituras) {
    console.error("Erro ao carregar leituras:", errorLeituras);
    return;
  }

  const leiturasPorPessoa = {};
  (todasLeituras || []).forEach((l) => {
    if (!leiturasPorPessoa[l.pessoa_id]) {
      leiturasPorPessoa[l.pessoa_id] = {};
    }
    leiturasPorPessoa[l.pessoa_id][l.mes] = parseFloat(l.valor);
  });

  const container = document.getElementById("listaPessoas");
  container.innerHTML = "";

  let totalValor = 0;
  let totalKwh = 0;

  if (!pessoas || pessoas.length === 0) {
    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center text-gray-400">
        Nenhuma pessoa cadastrada ainda
      </div>`;
    document.getElementById("totalGeral").textContent = "R$ 0,00";
    document.getElementById("totalKwh").textContent = "0 kWh";
    return;
  }

  pessoas.forEach((pessoa) => {
    const leituras = leiturasPorPessoa[pessoa.id] || {};
    const calc = calcularConsumo(leituras);

    totalValor += calc.valor;
    totalKwh += calc.consumo;

    const card = document.createElement("div");
    card.className = "bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 fade-in";

    card.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-xl font-bold">${pessoa.nome}</h3>
        <div class="flex gap-2">
          <button onclick="adicionarLeitura('${pessoa.id}', '${pessoa.nome}')"
                  class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition">
            + Lançar
          </button>
          <button onclick='editarLeitura("${pessoa.id}", "${pessoa.nome}", ${JSON.stringify(leituras)})'
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
          Object.entries(leituras)
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