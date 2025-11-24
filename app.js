// ==== CONSTANTES STORAGE ====
const USERS_KEY = "crud_usuarios_username";
const CURRENT_USER_KEY = "crud_usuario_actual";
const TASK_PREFIX = "crud_tareas_";
const GROUP_TASK_PREFIX = "crud_group_tareas_";

// ==== ESTADO EN MEMORIA ====
let users = [];
let currentUser = null;
let tasks = [];
let groupTasks = [];

// ==== DOM AUTH ====
const authSection = document.getElementById("auth-section");
const registerForm = document.getElementById("register-form");
const regUsername = document.getElementById("reg-username");
const regPassword = document.getElementById("reg-password");
const regPassword2 = document.getElementById("reg-password2");

const loginForm = document.getElementById("login-form");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");

// ==== DOM APP ====
const appSection = document.getElementById("app-section");
const userNameSpan = document.getElementById("user-name");
const logoutButton = document.getElementById("logout-button");

// Grupo
const groupForm = document.getElementById("group-form");
const groupNameInput = document.getElementById("group-name");
const currentGroupSpan = document.getElementById("current-group");
const groupTasksSection = document.getElementById("group-tasks-section");

// Tareas personales
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskStatus = document.getElementById("task-status");
const editingIndex = document.getElementById("editing-index");
const saveButton = document.getElementById("save-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const taskList = document.getElementById("task-list");

// Tareas grupales
const groupTaskForm = document.getElementById("group-task-form");
const groupTaskInput = document.getElementById("group-task-input");
const groupTaskStatus = document.getElementById("group-task-status");
const groupTaskAssignee = document.getElementById("group-task-assignee");
const groupEditingIndex = document.getElementById("group-editing-index");
const groupSaveButton = document.getElementById("group-save-button");
const groupCancelEditButton = document.getElementById("group-cancel-edit-button");
const groupTaskList = document.getElementById("group-task-list");

const statusText = {
  pendiente: "Pendiente",
  "en-progreso": "En progreso",
  completado: "Completado",
};

// ==== INICIALIZACIÓN ====
loadUsers();
autoLogin();

// =========================
// ==== REGISTRO ===========
// =========================
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = regUsername.value.trim();
  const pass1 = regPassword.value;
  const pass2 = regPassword2.value;

  if (!username) return alert("Ingresa un nombre de usuario.");
  if (pass1 !== pass2) return alert("Las contraseñas no coinciden.");
  if (users.some((u) => u.username === username))
    return alert("Ese nombre de usuario ya existe.");

  users.push({ username, password: pass1 });
  saveUsers();
  alert("Usuario registrado. Ahora puedes iniciar sesión.");
  registerForm.reset();
});

// =========================
// ==== LOGIN ==============
// =========================
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = loginUsername.value.trim();
  const pass = loginPassword.value;

  const user = users.find((u) => u.username === username && u.password === pass);

  if (!user) return alert("Usuario o contraseña incorrectos.");

  currentUser = user.username;
  localStorage.setItem(CURRENT_USER_KEY, currentUser);

  enterApp();
  loginForm.reset();
});

// =========================
// ==== LOGOUT =============
// =========================
logoutButton.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem(CURRENT_USER_KEY);
  showAuth();
});

// =========================
// ==== GRUPO: CREAR/UNIRSE
// =========================
groupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return alert("Primero inicia sesión.");

  const groupName = groupNameInput.value.trim();
  if (!groupName) return;

  const user = users.find((u) => u.username === currentUser);
  user.group = groupName;

  saveUsers();
  updateGroupUI();
  loadGroupTasks();
  renderGroupTasks();
  refreshAssigneeOptions();
  groupForm.reset();
});

// =========================
// ==== TAREAS PERSONALES ==
// =========================
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return alert("Debes iniciar sesión.");

  const text = taskInput.value.trim();
  const status = taskStatus.value;
  if (!text) return;

  if (editingIndex.value === "") {
    tasks.push({ text, status });
  } else {
    tasks[Number(editingIndex.value)] = { text, status };
  }

  saveTasks();
  renderTasks();
  resetTaskForm();
});

taskList.addEventListener("click", (e) => {
  if (!e.target.matches("button")) return;

  const index = Number(e.target.dataset.index);
  const action = e.target.dataset.action;

  if (action === "edit") {
    const t = tasks[index];
    taskInput.value = t.text;
    taskStatus.value = t.status;
    editingIndex.value = index;
    saveButton.textContent = "Actualizar";
    cancelEditButton.style.display = "inline-block";
    taskInput.focus();
  }

  if (action === "delete") {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    resetTaskForm();
  }
});

cancelEditButton.addEventListener("click", resetTaskForm);

// =========================
// ==== TAREAS GRUPALES ====
// =========================
groupTaskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = users.find((u) => u.username === currentUser);
  if (!user || !user.group) return alert("Debes crear o unirte a un grupo primero.");

  const text = groupTaskInput.value.trim();
  const status = groupTaskStatus.value;
  let assignee = groupTaskAssignee.value;

  if (!text) return;
  if (!assignee) assignee = currentUser;

  if (groupEditingIndex.value === "") {
    groupTasks.push({ text, status, assignee });
  } else {
    groupTasks[Number(groupEditingIndex.value)] = { text, status, assignee };
  }

  saveGroupTasks();
  renderGroupTasks();
  resetGroupTaskForm();
});

groupTaskList.addEventListener("click", (e) => {
  if (!e.target.matches("button")) return;

  const index = Number(e.target.dataset.index);
  const action = e.target.dataset.action;

  if (action === "edit") {
    const t = groupTasks[index];
    groupTaskInput.value = t.text;
    groupTaskStatus.value = t.status;
    groupTaskAssignee.value = t.assignee;
    groupEditingIndex.value = index;
    groupSaveButton.textContent = "Actualizar";
    groupCancelEditButton.style.display = "inline-block";
    groupTaskInput.focus();
  }

  if (action === "delete") {
    groupTasks.splice(index, 1);
    saveGroupTasks();
    renderGroupTasks();
    resetGroupTaskForm();
  }
});

groupCancelEditButton.addEventListener("click", resetGroupTaskForm);

// =========================
// ==== VISTAS =============
// =========================
function enterApp() {
  authSection.style.display = "none";
  appSection.style.display = "block";
  userNameSpan.textContent = currentUser;

  loadTasks();
  renderTasks();

  updateGroupUI();
  loadGroupTasks();
  renderGroupTasks();
  refreshAssigneeOptions();
}

function showAuth() {
  authSection.style.display = "block";
  appSection.style.display = "none";
  userNameSpan.textContent = "";

  currentGroupSpan.textContent = "Ninguno";
  tasks = [];
  groupTasks = [];

  taskList.innerHTML = "";
  groupTaskList.innerHTML = "";

  groupTasksSection.style.display = "none";

  resetTaskForm();
  resetGroupTaskForm();
}

function autoLogin() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    currentUser = saved;
    enterApp();
  } else {
    showAuth();
  }
}

function updateGroupUI() {
  const user = users.find((u) => u.username === currentUser);

  if (user && user.group) {
    currentGroupSpan.textContent = user.group;
    groupTasksSection.style.display = "block";
  } else {
    currentGroupSpan.textContent = "Ninguno";
    groupTasksSection.style.display = "none";
    groupTasks = [];
    groupTaskList.innerHTML = "";
  }
}

// =========================
// ==== RENDER TAREAS ======
// =========================
function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((t, i) => {
    taskList.innerHTML += `
        <li>
          <span>${t.text}</span>
          <span class="estado estado-${t.status}">${statusText[t.status]}</span>
          <div class="acciones">
            <button data-index="${i}" data-action="edit">Editar</button>
            <button data-index="${i}" data-action="delete">Eliminar</button>
          </div>
        </li>
      `;
  });
}

function renderGroupTasks() {
  groupTaskList.innerHTML = "";

  groupTasks.forEach((t, i) => {
    const estadoClase = "estado-" + (t.status || "pendiente");
    const estadoTexto = statusText[t.status || "pendiente"];
    const asignado = t.assignee || "(sin asignar)";

    groupTaskList.innerHTML += `
        <li>
          <div class="bloque-izq">
            <span>${t.text}</span>
            <span class="asignado-a">Asignado a: <strong>${asignado}</strong></span>
          </div>
          <span class="estado ${estadoClase}">${estadoTexto}</span>
          <div class="acciones">
            <button data-index="${i}" data-action="edit">Editar</button>
            <button data-index="${i}" data-action="delete">Eliminar</button>
          </div>
        </li>
      `;
  });
}

// =========================
// ==== RESET FORMS ========
// =========================
function resetTaskForm() {
  taskForm.reset();
  taskStatus.value = "pendiente";
  editingIndex.value = "";
  saveButton.textContent = "Guardar";
  cancelEditButton.style.display = "none";
}

function resetGroupTaskForm() {
  groupTaskForm.reset();
  groupTaskStatus.value = "pendiente";
  groupEditingIndex.value = "";
  groupSaveButton.textContent = "Guardar";
  groupCancelEditButton.style.display = "none";

  if (groupTaskAssignee.options.length > 0) {
    const idx = [...groupTaskAssignee.options].findIndex(
      (opt) => opt.value === currentUser
    );
    groupTaskAssignee.selectedIndex = idx >= 0 ? idx : 0;
  }
}

// =========================
// ==== ASIGNADOS =========
// =========================
function refreshAssigneeOptions() {
  groupTaskAssignee.innerHTML = "";

  const user = users.find((u) => u.username === currentUser);
  if (!user || !user.group) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Sin grupo";
    groupTaskAssignee.appendChild(opt);
    groupTaskAssignee.disabled = true;
    return;
  }

  const members = users.filter((u) => u.group === user.group);

  groupTaskAssignee.disabled = false;

  members.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.username;
    opt.textContent = m.username;
    groupTaskAssignee.appendChild(opt);
  });

  const idx = members.findIndex((m) => m.username === currentUser);
  groupTaskAssignee.selectedIndex = idx >= 0 ? idx : 0;
}

// =========================
// ==== STORAGE ============
// =========================
function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadUsers() {
  try {
    users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    users = [];
  }
}

function saveTasks() {
  localStorage.setItem(TASK_PREFIX + currentUser, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(TASK_PREFIX + currentUser) || "[]");
  } catch {
    tasks = [];
  }
}

function saveGroupTasks() {
  const user = users.find((u) => u.username === currentUser);
  if (!user || !user.group) return;

  localStorage.setItem(GROUP_TASK_PREFIX + user.group, JSON.stringify(groupTasks));
}

function loadGroupTasks() {
  const user = users.find((u) => u.username === currentUser);
  if (!user || !user.group) {
    groupTasks = [];
    return;
  }

  try {
    groupTasks = JSON.parse(
      localStorage.getItem(GROUP_TASK_PREFIX + user.group) || "[]"
    );
  } catch {
    groupTasks = [];
  }
}
