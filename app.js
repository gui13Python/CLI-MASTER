// ============================================================
//  Command Manager · app.js
// ============================================================

// ── Initial data ─────────────────────────────────────────────
const DEFAULT_DATA = {
  "Linux - Sistema": [
    ["uname -a", "Informações do sistema"],
    ["uptime", "Tempo ligado"],
    ["df -h", "Espaço em disco"],
  ],
  "Linux - Rede": [
    ["ip a", "Mostrar interfaces de rede"],
    ["ip addr", "Mostrar endereços IP"],
    ["ip link", "Mostrar interfaces"],
    ["ip route", "Tabela de rotas"],
    ["ping google.com", "Testar conexão"],
    ["traceroute google.com", "Rota até destino"],
    ["netstat -tulnp", "Portas abertas"],
    ["ss -tuln", "Sockets abertas"],
    ["arp -a", "Tabela ARP"],
    ["nslookup google.com", "Consulta DNS"],
    ["dig google.com", "DNS avançado"],
    ["tcpdump -i any", "Capturar pacotes"],
    ["nmap localhost", "Escanear portas"],
    ["curl ifconfig.me", "IP público"],
    ["wget google.com", "Baixar página"],
    ["lsof -i", "Processos usando rede"],
  ],
  "Windows - Rede": [
    ["ipconfig", "Configuração IP"],
    ["ipconfig /all", "Detalhes completos"],
    ["ipconfig /flushdns", "Limpar DNS"],
    ["ping google.com", "Testar conexão"],
    ["tracert google.com", "Rota até destino"],
    ["pathping google.com", "Diagnóstico"],
    ["netstat -ano", "Conexões abertas"],
    ["arp -a", "Tabela ARP"],
    ["route print", "Tabela rotas"],
    ["nslookup google.com", "Consulta DNS"],
    ["netsh wlan show networks", "Redes WiFi"],
  ],
};

const STORAGE_KEY = "cmd_manager_data";

// ── State ─────────────────────────────────────────────────────
let commands = loadData();

// ── Persistence ───────────────────────────────────────────────
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : deepClone(DEFAULT_DATA);
  } catch {
    return deepClone(DEFAULT_DATA);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ── Category slug ─────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getCatClass(name) {
  const n = name.toLowerCase();
  if (n.includes("linux") && n.includes("sistema")) return "cat-linux-sistema";
  if (n.includes("linux")) return "cat-linux-rede";
  if (n.includes("windows")) return "cat-windows-rede";
  return "cat-custom";
}

// ── Render ────────────────────────────────────────────────────
const main = document.getElementById("main");

function render(filter = "") {
  main.innerHTML = "";

  const query = filter.trim().toLowerCase();
  let totalVisible = 0;

  Object.entries(commands).forEach(([category, items], idx) => {
    const filtered = query
      ? items.filter(
          ([cmd, desc]) =>
            cmd.toLowerCase().includes(query) ||
            desc.toLowerCase().includes(query) ||
            category.toLowerCase().includes(query)
        )
      : items;

    if (filtered.length === 0) return;
    totalVisible += filtered.length;

    const catClass = getCatClass(category);
    const section = document.createElement("div");
    section.className = `section ${catClass}`;
    section.style.animationDelay = `${idx * 0.06}s`;

    section.innerHTML = `
      <div class="section-header">
        <span class="section-dot"></span>
        <span class="section-title">${escHtml(category)}</span>
        <span class="section-count">${filtered.length} comandos</span>
      </div>
      <div class="cmd-grid" id="grid-${slugify(category)}"></div>
    `;

    main.appendChild(section);
    const grid = section.querySelector(".cmd-grid");

    filtered.forEach(([cmd, desc]) => {
      grid.appendChild(makeCard(cmd, desc, category));
    });
  });

  if (totalVisible === 0) {
    main.innerHTML = `
      <div class="no-results">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 12px;opacity:.3">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Nenhum comando encontrado para "<strong>${escHtml(filter)}</strong>"
      </div>`;
  }
}

function makeCard(cmd, desc, category) {
  const card = document.createElement("div");
  card.className = "cmd-card";

  const info = document.createElement("div");
  info.className = "cmd-info";
  info.innerHTML = `
    <span class="cmd-name" title="${escHtml(cmd)}">${escHtml(cmd)}</span>
    <span class="cmd-desc" title="${escHtml(desc)}">${escHtml(desc)}</span>
  `;

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.title = "Copiar comando";
  copyBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
    <span>Copiar</span>
  `;

  copyBtn.addEventListener("click", () => {
    copyToClipboard(cmd, copyBtn);
  });

  card.appendChild(info);
  card.appendChild(copyBtn);
  return card;
}

// ── Clipboard ─────────────────────────────────────────────────
async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    btn.classList.add("copied");
    btn.querySelector("span").textContent = "Copiado!";
    btn.querySelector("svg").innerHTML = `<polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2.5"/>`;
    showToast("Copiado: " + text, "success");
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.querySelector("span").textContent = "Copiar";
      btn.querySelector("svg").innerHTML = `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>`;
    }, 2000);
  } catch {
    showToast("Erro ao copiar", "error");
  }
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
const toast = document.getElementById("toast");

function showToast(msg, type = "") {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

// ── Search ────────────────────────────────────────────────────
const searchInput = document.getElementById("searchInput");
let searchDebounce;

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => render(searchInput.value), 200);
});

// ── Modal ─────────────────────────────────────────────────────
const overlay = document.getElementById("modalOverlay");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const modalCategory = document.getElementById("modalCategory");
const newCategory = document.getElementById("newCategory");
const modalCommand = document.getElementById("modalCommand");
const modalDesc = document.getElementById("modalDesc");
const formError = document.getElementById("formError");

function openModal() {
  // Populate select
  modalCategory.innerHTML = '<option value="">— Selecionar existente —</option>';
  Object.keys(commands).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    modalCategory.appendChild(opt);
  });
  newCategory.value = "";
  modalCommand.value = "";
  modalDesc.value = "";
  formError.textContent = "";
  overlay.classList.add("open");
  setTimeout(() => modalCommand.focus(), 250);
}

function closeModal() {
  overlay.classList.remove("open");
}

openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
  if (e.key === "Enter" && overlay.classList.contains("open")) {
    e.preventDefault();
    trySave();
  }
});

saveBtn.addEventListener("click", trySave);

function trySave() {
  formError.textContent = "";

  const existingCat = modalCategory.value.trim();
  const customCat = newCategory.value.trim();
  const cmd = modalCommand.value.trim();
  const desc = modalDesc.value.trim();

  // Validation
  if (!existingCat && !customCat) {
    formError.textContent = "Selecione uma categoria existente ou crie uma nova.";
    return;
  }
  if (!cmd) {
    formError.textContent = "O campo Comando é obrigatório.";
    modalCommand.focus();
    return;
  }
  if (!desc) {
    formError.textContent = "O campo Descrição é obrigatório.";
    modalDesc.focus();
    return;
  }

  const targetCat = customCat || existingCat;

  if (!commands[targetCat]) {
    commands[targetCat] = [];
  }

  // Check for duplicates
  const exists = commands[targetCat].some(([c]) => c === cmd);
  if (exists) {
    formError.textContent = `O comando "${cmd}" já existe nesta categoria.`;
    return;
  }

  commands[targetCat].push([cmd, desc]);
  saveData();
  closeModal();
  render(searchInput.value);
  showToast("Comando adicionado!", "success");
}

// ── Helpers ───────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Init ──────────────────────────────────────────────────────
render();

// ============================================================
//  PWA · Service Worker + Install Prompt
// ============================================================

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(err => {
      console.warn("SW registration failed:", err);
    });
  });
}

// Install prompt
let deferredPrompt = null;
const installBanner   = document.getElementById("installBanner");
const installBtn      = document.getElementById("installBtn");
const installBtnHdr   = document.getElementById("installBtnHeader");
const dismissBanner   = document.getElementById("dismissBanner");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show banner (only if not dismissed before)
  if (!sessionStorage.getItem("installDismissed")) {
    installBanner.classList.add("visible");
  }
  // Always show header button
  installBtnHdr.style.display = "flex";
});

async function triggerInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBanner.classList.remove("visible");
  installBtnHdr.style.display = "none";
  if (outcome === "accepted") {
    showToast("App instalado com sucesso!", "success");
  }
}

installBtn.addEventListener("click", triggerInstall);
installBtnHdr.addEventListener("click", triggerInstall);

dismissBanner.addEventListener("click", () => {
  installBanner.classList.remove("visible");
  sessionStorage.setItem("installDismissed", "1");
});

// Hide everything once installed
window.addEventListener("appinstalled", () => {
  installBanner.classList.remove("visible");
  installBtnHdr.style.display = "none";
  showToast("App instalado!", "success");
});
