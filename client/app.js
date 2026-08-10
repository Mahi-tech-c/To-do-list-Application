const API_BASE = 'http://localhost:5000/api';

const state = {
  token: localStorage.getItem('todoJwt') || '',
  user: null,
  tasks: [],
  pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
  filters: {
    status: 'all',
    sortBy: 'createdAt',
    order: 'desc'
  },
  calendarCursor: new Date()
};

const el = {
  authSection: document.getElementById('authSection'),
  tasksSection: document.getElementById('tasksSection'),
  calendarSection: document.getElementById('calendarSection'),
  reportsSection: document.getElementById('reportsSection'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  logoutBtn: document.getElementById('logoutBtn'),
  taskList: document.getElementById('taskList'),
  taskCount: document.getElementById('taskCount'),
  completedCount: document.getElementById('completedCount'),
  openTaskModal: document.getElementById('openTaskModal'),
  taskModal: document.getElementById('taskModal'),
  closeTaskModal: document.getElementById('closeTaskModal'),
  cancelTask: document.getElementById('cancelTask'),
  modalTitle: document.getElementById('modalTitle'),
  taskForm: document.getElementById('taskForm'),
  taskId: document.getElementById('taskId'),
  taskTitle: document.getElementById('taskTitle'),
  taskDescription: document.getElementById('taskDescription'),
  taskStatus: document.getElementById('taskStatus'),
  taskError: document.getElementById('taskError'),
  totalSummary: document.getElementById('totalSummary'),
  progressSummary: document.getElementById('progressSummary'),
  completedSummary: document.getElementById('completedSummary'),
  statusFilter: document.getElementById('statusFilter'),
  sortBy: document.getElementById('sortBy'),
  sortOrder: document.getElementById('sortOrder'),
  nextPage: document.getElementById('nextPage'),
  prevPage: document.getElementById('prevPage'),
  pageLabel: document.getElementById('pageLabel'),
  navLinks: Array.from(document.querySelectorAll('.nav-link')),
  calendarGrid: document.getElementById('calendarGrid'),
  monthTitle: document.getElementById('monthTitle'),
  monthPrev: document.getElementById('monthPrev'),
  monthNext: document.getElementById('monthNext'),
  createFromCalendar: document.getElementById('createFromCalendar'),
  reportList: document.getElementById('reportList'),
  completionRate: document.getElementById('completionRate')
};

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

function showTasksView() {
  el.authSection.style.display = 'none';
  el.tasksSection.style.display = 'block';
  el.calendarSection.style.display = 'none';
  el.reportsSection.style.display = 'none';
}

function showAuthView() {
  el.authSection.style.display = 'block';
  el.tasksSection.style.display = 'none';
  el.calendarSection.style.display = 'none';
  el.reportsSection.style.display = 'none';
}

function showView(viewName) {
  const views = {
    tasks: () => {
      el.tasksSection.style.display = 'block';
      el.calendarSection.style.display = 'none';
      el.reportsSection.style.display = 'none';
    },
    calendar: () => {
      el.tasksSection.style.display = 'none';
      el.calendarSection.style.display = 'block';
      el.reportsSection.style.display = 'none';
      renderCalendar();
    },
    reports: () => {
      el.tasksSection.style.display = 'none';
      el.calendarSection.style.display = 'none';
      el.reportsSection.style.display = 'block';
      renderReports();
    }
  };

  if (views[viewName]) {
    views[viewName]();
  }
}

function renderTasks() {
  if (!state.tasks.length) {
    el.taskList.innerHTML = '<div class="empty-state">No tasks found.</div>';
  } else {
    el.taskList.innerHTML = state.tasks.map(task => `
      <article class="task-row">
        <div class="task-title-group">
          <span class="status-dot"></span>
          <div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-description">${escapeHtml(task.description || 'No description')}</div>
          </div>
        </div>
        <div>
          <span class="status-badge ${task.status}">${displayStatus(task.status)}</span>
        </div>
        <div class="task-actions">
          <button class="row-action edit" data-action="edit" data-id="${task.id || task._id}">Edit</button>
          <button class="row-action delete" data-action="delete" data-id="${task.id || task._id}">Delete</button>
        </div>
      </article>
    `).join('');
  }
}

function renderSummary() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  const progress = state.tasks.filter(t => t.status === 'in-progress').length;

  el.totalSummary.textContent = state.pagination.totalItems || total;
  el.completedSummary.textContent = completed;
  el.progressSummary.textContent = progress;

  el.taskCount.textContent = state.pagination.totalItems || total;
  el.completedCount.textContent = completed;
}

function renderCalendar() {
  const month = state.calendarCursor.getMonth();
  const year = state.calendarCursor.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const monthDays = new Date(year, month + 1, 0).getDate();

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const grid = [];

  days.forEach((day) => {
    grid.push(`<div class="calendar-cell header">${day}</div>`);
  });

  for (let i = 0; i < firstDay; i += 1) {
    grid.push(`<div class="calendar-cell"></div>`);
  }

  for (let day = 1; day <= monthDays; day += 1) {
    const dayTasks = state.tasks.filter((task) => {
      if (!task.createdAt) return false;
      const created = new Date(task.createdAt);
      return created.getMonth() === month && created.getFullYear() === year && created.getDate() === day;
    });

    const today = new Date();
    const dayClass = day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? 'calendar-cell today' : 'calendar-cell';
    grid.push(`<div class="${dayClass}"><span class="day-number">${day}</span><span class="day-count">${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}</span></div>`);
  }

  el.calendarGrid.innerHTML = grid.join('');
  el.monthTitle.textContent = new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function renderReports() {
  const total = state.tasks.length || 0;
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  const pending = state.tasks.filter(t => t.status === 'pending').length;
  const progress = state.tasks.filter(t => t.status === 'in-progress').length;

  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  el.completionRate.textContent = `${completionRate}%`;

  const rows = [
    ['Pending', pending],
    ['In-Progress', progress],
    ['Completed', completed]
  ];

  el.reportList.innerHTML = rows.map(([name, count]) => `<li>${name}: ${count}</li>`).join('');
}

function displayStatus(status) {
  return {
    'pending': 'Pending',
    'in-progress': 'In-Progress',
    'completed': 'Completed'
  }[status] || status;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadTasks() {
  try {
    const query = new URLSearchParams({
      page: String(state.pagination.page),
      limit: String(state.pagination.limit),
      status: state.filters.status,
      sortBy: state.filters.sortBy,
      order: state.filters.order
    });

    const response = await apiFetch(`/tasks?${query.toString()}`);

    state.tasks = response.data || [];
    state.pagination = response.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 };

    renderTasks();
    renderSummary();
    updatePaginationUI();
  } catch (error) {
    showError(error.message);
  }
}

async function registerUser(event) {
  event.preventDefault();

  const formData = new FormData(el.registerForm);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password')
  };

  try {
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('todoJwt', result.token);

    showTasksView();
    loadTasks();
    el.registerForm.reset();
  } catch (error) {
    showError(error.message);
  }
}

async function loginUser(event) {
  event.preventDefault();

  const formData = new FormData(el.loginForm);

  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });

    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('todoJwt', result.token);

    showTasksView();
    loadTasks();
    el.loginForm.reset();
  } catch (error) {
    showError(error.message);
  }
}

function logout() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('todoJwt');
  showAuthView();
}

function openTaskModal(task = null) {
  el.taskForm.reset();
  if (task) {
    el.modalTitle.textContent = 'Edit Task';
    el.taskId.value = task.id || task._id;
    el.taskTitle.value = task.title;
    el.taskDescription.value = task.description || '';
    el.taskStatus.value = task.status;
  } else {
    el.modalTitle.textContent = 'Create Task';
    el.taskId.value = '';
    el.taskTitle.value = '';
    el.taskDescription.value = '';
    el.taskStatus.value = 'pending';
  }

  el.taskError.textContent = '';
  el.taskModal.classList.add('open');
}

function closeTaskModal() {
  el.taskModal.classList.remove('open');
}

async function saveTask(event) {
  event.preventDefault();

  const payload = {
    title: el.taskTitle.value.trim(),
    description: el.taskDescription.value.trim(),
    status: el.taskStatus.value
  };

  if (!payload.title || payload.title.length < 2) {
    el.taskError.textContent = 'Title must be at least 2 characters.';
    return;
  }

  try {
    const isUpdate = Boolean(el.taskId.value);

    const result = await apiFetch(`/tasks${isUpdate ? `/${el.taskId.value}` : ''}`, {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });

    closeTaskModal();
    await loadTasks();
  } catch (error) {
    el.taskError.textContent = error.message;
  }
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) {
    return;
  }

  try {
    await apiFetch(`/tasks/${taskId}`, {
      method: 'DELETE'
    });

    await loadTasks();
  } catch (error) {
    showError(error.message);
  }
}

function updatePaginationUI() {
  const totalPages = Math.max(1, state.pagination.totalPages || 1);
  const current = state.pagination.page || 1;
  el.pageLabel.textContent = `Page ${current} / ${totalPages}`;

  el.prevPage.disabled = current <= 1;
  el.nextPage.disabled = current >= totalPages;
}

function showError(message) {
  console.error(message);
  alert(message);
}

el.registerForm.addEventListener('submit', registerUser);
el.loginForm.addEventListener('submit', loginUser);
el.logoutBtn.addEventListener('click', logout);
el.openTaskModal.addEventListener('click', () => openTaskModal());
el.createFromCalendar.addEventListener('click', () => openTaskModal());
el.closeTaskModal.addEventListener('click', closeTaskModal);
el.cancelTask.addEventListener('click', closeTaskModal);
el.taskModal.addEventListener('click', (event) => {
  if (event.target === el.taskModal) {
    closeTaskModal();
  }
});
el.taskForm.addEventListener('submit', saveTask);

el.navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();

    const name = link.getAttribute('data-view');

    el.navLinks.forEach((item) => item.classList.toggle('active', item === link));

    if (name === 'calendar') {
      showView('calendar');
    } else if (name === 'reports') {
      showView('reports');
    } else {
      showView('tasks');
    }
  });
});

el.monthPrev.addEventListener('click', () => {
  const currentMonth = state.calendarCursor.getMonth();
  const currentYear = state.calendarCursor.getFullYear();
  state.calendarCursor = new Date(currentYear, currentMonth - 1, 1);
  renderCalendar();
});

el.monthNext.addEventListener('click', () => {
  const currentMonth = state.calendarCursor.getMonth();
  const currentYear = state.calendarCursor.getFullYear();
  state.calendarCursor = new Date(currentYear, currentMonth + 1, 1);
  renderCalendar();
});

el.taskList.addEventListener('click', async (event) => {
  const actionEl = event.target.closest('[data-action]');

  if (!actionEl) {
    return;
  }

  const taskId = actionEl.dataset.id;

  if (actionEl.dataset.action === 'delete') {
    await deleteTask(taskId);
  }

  if (actionEl.dataset.action === 'edit') {
    const task = state.tasks.find(t => String(t.id || t._id) === String(taskId));
    if (task) {
      openTaskModal(task);
    }
  }
});

function updateFilterState() {
  state.filters.status = el.statusFilter.value;
  state.filters.sortBy = el.sortBy.value;
  state.filters.order = el.sortOrder.value;
  state.pagination.page = 1;

  loadTasks();
}

el.statusFilter.addEventListener('change', updateFilterState);
el.sortBy.addEventListener('change', updateFilterState);
el.sortOrder.addEventListener('change', updateFilterState);

el.prevPage.addEventListener('click', () => {
  if (state.pagination.page > 1) {
    state.pagination.page -= 1;
    loadTasks();
  }
});

el.nextPage.addEventListener('click', () => {
  if (state.pagination.page < (state.pagination.totalPages || 1)) {
    state.pagination.page += 1;
    loadTasks();
  }
});

if (state.token) {
  showTasksView();
  loadTasks();
}
