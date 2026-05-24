const STORAGE_KEY = "todo-tasks-v1";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const dueInput = document.getElementById("due-input");
const prioritySelect = document.getElementById("priority-select");
const list = document.getElementById("task-list");
const count = document.getElementById("task-count");
const filters = document.querySelectorAll(".filters button");
const clearBtn = document.getElementById("clear-completed");

let tasks = [];
let filter = "all";
let editingTaskId = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    tasks = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addTask(title, due, priority = "medium") {
  tasks.push({
    id: uid(),
    title,
    done: false,
    due: due || null,
    priority: priority || "medium",
    created: Date.now(),
  });
  save();
  render();
}

function toggleDone(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  save();
  render();
}

function removeTask(id) {
  tasks = tasks.filter((x) => x.id !== id);
  save();
  render();
}

function editTask(id) {
  editingTaskId = id;
  render();
}

function cancelEdit() {
  editingTaskId = null;
  render();
}

function saveEdit(id, titleValue, dueValue, priorityValue) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.title = titleValue.trim() || t.title;
  const dueTrim = dueValue.trim();
  t.due = dueTrim === "" ? null : dueTrim;
  t.priority = priorityValue || "medium";
  editingTaskId = null;
  save();
  render();
}

function clearCompleted() {
  tasks = tasks.filter((x) => !x.done);
  save();
  render();
}

function setFilter(f) {
  filter = f;
  filters.forEach((b) => b.classList.toggle("active", b.dataset.filter === f));
  render();
}

function render() {
  list.innerHTML = "";
  const visible = tasks
    .filter((t) => {
      if (filter === "active") return !t.done;
      if (filter === "completed") return t.done;
      return true;
    })
    .sort((a, b) => {
      // sort by done, then priority (high, medium, low), then created
      if (a.done !== b.done) return a.done - b.done;
      const weight = (p) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
      const wa = weight(a.priority || "medium");
      const wb = weight(b.priority || "medium");
      if (wa !== wb) return wa - wb;
      return a.created - b.created;
    });

  visible.forEach((t) => {
    const li = document.createElement("li");
    li.className =
      "task-item" +
      (t.done ? " completed" : "") +
      (t.priority ? ` priority-${t.priority}` : "");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = t.done;
    chk.addEventListener("change", () => toggleDone(t.id));
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = t.title;
    const pri = document.createElement("div");
    pri.className = "priority";
    pri.textContent = t.priority ? t.priority.toUpperCase() : "MEDIUM";
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = t.due ? `Due: ${t.due}` : "";
    if (editingTaskId === t.id) {
      li.className += " editing";
      const editTitle = document.createElement("input");
      editTitle.type = "text";
      editTitle.value = t.title;
      editTitle.className = "edit-input";
      const editDue = document.createElement("input");
      editDue.type = "date";
      editDue.value = t.due || "";
      editDue.className = "edit-input";
      const editPriority = document.createElement("select");
      editPriority.className = "edit-input";
      [
        ["high", "High"],
        ["medium", "Medium"],
        ["low", "Low"],
      ].forEach(([value, label]) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        opt.selected = value === (t.priority || "medium");
        editPriority.appendChild(opt);
      });
      const saveBtn = document.createElement("button");
      saveBtn.className = "btn save-btn";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => saveEdit(t.id, editTitle.value, editDue.value, editPriority.value));
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn cancel-btn";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", cancelEdit);
      editTitle.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveEdit(t.id, editTitle.value, editDue.value, editPriority.value);
        }
        if (e.key === "Escape") {
          cancelEdit();
        }
      });
      editDue.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveEdit(t.id, editTitle.value, editDue.value, editPriority.value);
        }
        if (e.key === "Escape") {
          cancelEdit();
        }
      });

      const fieldGroup = document.createElement("div");
      fieldGroup.className = "edit-fields";
      fieldGroup.appendChild(editTitle);
      fieldGroup.appendChild(editDue);
      fieldGroup.appendChild(editPriority);
      li.appendChild(chk);
      li.appendChild(fieldGroup);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);
      setTimeout(() => editTitle.focus(), 0);
    } else {
      const editBtn = document.createElement("button");
      editBtn.className = "btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => editTask(t.id));
      const delBtn = document.createElement("button");
      delBtn.className = "btn";
      delBtn.textContent = "Hapus";
      delBtn.addEventListener("click", () => {
        if (confirm("Hapus tugas?")) removeTask(t.id);
      });

      li.appendChild(chk);
      li.appendChild(pri);
      li.appendChild(title);
      li.appendChild(meta);
      li.appendChild(editBtn);
      li.appendChild(delBtn);
    }
    list.appendChild(li);
  });

  const remaining = tasks.filter((t) => !t.done).length;
  count.textContent =
    remaining + (remaining === 1 ? " tugas tersisa" : " tugas");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = input.value.trim();
  if (!txt) return;
  addTask(
    txt,
    dueInput.value || null,
    (prioritySelect && prioritySelect.value) || "medium",
  );
  input.value = "";
  dueInput.value = "";
});

filters.forEach((b) =>
  b.addEventListener("click", () => setFilter(b.dataset.filter)),
);
clearBtn.addEventListener("click", () => {
  if (confirm("Hapus semua tugas yang selesai?")) clearCompleted();
});

// init
load();
render();
