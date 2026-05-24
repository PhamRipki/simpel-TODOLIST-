const STORAGE_KEY = "todo-tasks-v1";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const dueInput = document.getElementById("due-input");
const prioritySelect = document.getElementById("priority-select");
const list = document.getElementById("task-list");
const count = document.getElementById("task-count");
const filters = document.querySelectorAll(".filters button");
const clearBtn = document.getElementById("clear-completed");

let reminderDays = 2;

let tasks = [];
let filter = "all";
let editingTaskId = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
    tasks.forEach((t, index) => {
      if (typeof t.order !== "number") t.order = index;
    });
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
    order: tasks.length,
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
  const task = tasks.find((x) => x.id === id);
  if (!task || isOverdue(task)) return;
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

function getDueClass(task) {
  if (!task.due || task.done) return "";
  const dueDate = new Date(`${task.due}T23:59:59`);
  if (Number.isNaN(dueDate.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate - today) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "due-today";
  if (diffDays <= reminderDays) return "due-soon";
  return "due-far";
}

function reorderTask(sourceId, targetId) {
  if (sourceId === targetId) return;
  const fromIndex = tasks.findIndex((x) => x.id === sourceId);
  const toIndex = tasks.findIndex((x) => x.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, moved);
  tasks.forEach((task, index) => {
    task.order = index;
  });
  save();
  render();
}

function addDragHandlers(li, taskId) {
  li.draggable = true;
  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    li.classList.add("dragging");
  });
  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
  });
  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    li.classList.add("drag-over");
  });
  li.addEventListener("dragleave", () => {
    li.classList.remove("drag-over");
  });
  li.addEventListener("drop", (e) => {
    e.preventDefault();
    li.classList.remove("drag-over");
    const sourceId = e.dataTransfer.getData("text/plain");
    reorderTask(sourceId, taskId);
  });
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

function isOverdue(task) {
  const dueClass = getDueClass(task);
  return dueClass === "overdue";
}

function render() {
  list.innerHTML = "";
  const visible = tasks
    .filter((t) => {
      if (filter === "active") return !t.done;
      if (filter === "completed") return t.done;
      if (filter === "overdue") return isOverdue(t);
      return true;
    })
    .sort((a, b) => a.order - b.order);

  visible.forEach((t) => {
    const dueClass = getDueClass(t);
    const li = document.createElement("li");
    li.className =
      "task-item" +
      (t.done ? " completed" : "") +
      (t.priority ? ` priority-${t.priority}` : "") +
      (dueClass ? ` ${dueClass}` : "");
    addDragHandlers(li, t.id);
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = t.done;
    chk.disabled = dueClass === "overdue";
    chk.title =
      dueClass === "overdue"
        ? "Sudah lewat batas, tidak bisa dicentang"
        : "Tandai selesai";
    chk.addEventListener("change", () => toggleDone(t.id));
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = t.title;
    const pri = document.createElement("div");
    pri.className = "priority";
    pri.textContent = t.priority ? t.priority.toUpperCase() : "MEDIUM";
    const meta = document.createElement("div");
    meta.className = "task-meta";
    if (t.due) {
      meta.textContent = `Due: ${t.due}`;
      if (dueClass === "overdue") {
        meta.textContent += " • Sudah lewat batas";
      }
    } else {
      meta.textContent = "";
    }
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
      saveBtn.addEventListener("click", () =>
        saveEdit(t.id, editTitle.value, editDue.value, editPriority.value),
      );
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
      editBtn.disabled = dueClass === "overdue";
      editBtn.title =
        dueClass === "overdue"
          ? "Tidak bisa diedit karena sudah lewat batas"
          : "Edit tugas";
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
