// ── 상수 및 설정 ──────────────────────────────────────────────────────

const STORAGE_KEY = 'todos';
const SORT_KEY    = 'todoSort';

const CAT_LABEL    = { '업무': '💼 업무', '개인': '🏠 개인', '공부': '📚 공부' };
const FILTER_LABEL = {
  all: '전체', todo: '미완료', done: '완료',
  '업무': '💼 업무', '개인': '🏠 개인', '공부': '📚 공부',
};

const PRIORITY_LABEL = { '높음': '🔴 높음', '중간': '🟡 중간', '낮음': '🔵 낮음' };
const PRIORITY_ORDER = { '높음': 0, '중간': 1, '낮음': 2 };

const CAT_KEYWORDS = {
  '업무': ['회의','보고','기획','업무','출장','미팅','발표','계획','프로젝트','마감','메일','계약','제안','보고서'],
  '공부': ['공부','학습','강의','읽기','책','복습','과제','시험','연구','정리','노트','강좌','수업'],
  '개인': ['운동','청소','장보기','병원','약속','여행','휴식','취미','가족','친구','요리','쇼핑'],
};

// ── 데이터 처리 ──────────────────────────────────────────────────────

function loadTodos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveTodos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate() {
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일 (${DAYS[d.getDay()]})`;
}

function formatDateTime(ts) {
  const d  = new Date(ts);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${mo}/${da} ${hh}:${mm}`;
}

function escapeHtml(str) {
  const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, c => MAP[c]);
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due  = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((due - today) / 86400000);
  const mo   = String(due.getMonth() + 1).padStart(2, '0');
  const da   = String(due.getDate()).padStart(2, '0');
  let label = `${mo}/${da}`;
  let cls   = 'todo-due';
  if (diff < 0)        { cls += ' overdue'; label += ' 지남'; }
  else if (diff === 0) { cls += ' today';   label += ' 오늘'; }
  else if (diff === 1) { cls += ' soon';    label += ' 내일'; }
  return { label, cls };
}

function guessCategory(text) {
  const t = text.toLowerCase();
  for (const [cat, words] of Object.entries(CAT_KEYWORDS)) {
    if (words.some(w => t.includes(w))) return cat;
  }
  return null;
}

function getMatchedKeyword(text) {
  const t = text.toLowerCase();
  for (const words of Object.values(CAT_KEYWORDS)) {
    for (const w of words) {
      if (t.includes(w)) return w;
    }
  }
  return null;
}

function getSearchedTodos(list, query) {
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(t => t.text.toLowerCase().includes(q));
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const lower = text.toLowerCase();
  const q     = query.toLowerCase();
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) { parts.push(escapeHtml(text.slice(i))); break; }
    parts.push(escapeHtml(text.slice(i, idx)));
    parts.push('<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>');
    i = idx + q.length;
  }
  return parts.join('');
}

// ── 상태 ─────────────────────────────────────────────────────────────

let todos         = loadTodos();
let currentFilter = 'all';
let currentSort   = localStorage.getItem(SORT_KEY) || 'date';
let searchQuery   = '';
let dragSrcId     = null;

function setTodos(newList) {
  todos = newList;
  saveTodos(todos);
}

// ── 렌더링 ───────────────────────────────────────────────────────────

function getFilteredTodos(list, filter) {
  switch (filter) {
    case 'todo': return list.filter(t => !t.done);
    case 'done': return list.filter(t => t.done);
    case '업무': case '개인': case '공부':
      return list.filter(t => t.category === filter);
    default: return [...list];
  }
}

function getSortedTodos(list) {
  const arr = [...list];
  switch (currentSort) {
    case 'category': return arr.sort((a, b) => a.category.localeCompare(b.category));
    case 'status':   return arr.sort((a, b) => Number(a.done) - Number(b.done));
    case 'dueDate':  return arr.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    case 'priority': return arr.sort((a, b) =>
      PRIORITY_ORDER[a.priority ?? '중간'] - PRIORITY_ORDER[b.priority ?? '중간']
    );
    case 'manual':   return arr;
    default:         return arr.sort((a, b) => b.createdAt - a.createdAt);
  }
}

function updateFilterCounts(list) {
  const counts = {
    all:  list.length,
    todo: list.filter(t => !t.done).length,
    done: list.filter(t => t.done).length,
    '업무': list.filter(t => t.category === '업무').length,
    '개인': list.filter(t => t.category === '개인').length,
    '공부': list.filter(t => t.category === '공부').length,
  };
  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`fc-${k}`);
    if (el) el.textContent = counts[k];
  });
}

function updateStats(list) {
  const total     = list.length;
  const doneCount = list.filter(t => t.done).length;
  const rate      = total ? Math.round(doneCount / total * 100) : 0;

  document.getElementById('stat-total').textContent     = total;
  document.getElementById('stat-done').textContent      = doneCount;
  document.getElementById('stat-remaining').textContent = total - doneCount;
  document.getElementById('stat-rate').textContent      = rate + '%';
  document.getElementById('progress-fill').style.width  = rate + '%';

  updateFilterCounts(list);

  const clearBtn = document.getElementById('clear-done');
  clearBtn.hidden = doneCount === 0;
  if (doneCount > 0) clearBtn.textContent = `완료 항목 삭제 (${doneCount}개)`;
}

function renderTodos(list) {
  updateStats(list);

  const listEl   = document.getElementById('todo-list');
  const filtered = getSortedTodos(getSearchedTodos(getFilteredTodos(list, currentFilter), searchQuery));
  const isManual = currentSort === 'manual';

  if (filtered.length === 0) {
    const label = searchQuery
      ? `'${escapeHtml(searchQuery)}' 검색`
      : FILTER_LABEL[currentFilter] || currentFilter;
    listEl.innerHTML = `<p class="empty-state">'${label}'에 해당하는 할 일이 없어요</p>`;
    return;
  }

  listEl.innerHTML = filtered.map(t => {
    const kw  = getMatchedKeyword(t.text);
    const due = formatDueDate(t.dueDate);
    return `
    <div class="todo-item${t.done ? ' done' : ''}" data-id="${t.id}"${isManual ? ' draggable="true"' : ''}>
      ${isManual ? '<span class="drag-handle" aria-hidden="true">⠿</span>' : ''}
      <button class="check-btn${t.done ? ' checked' : ''}"
        data-action="toggle" data-id="${t.id}"
        aria-label="${t.done ? '미완료로 표시' : '완료로 표시'}">${t.done ? '✓' : ''}</button>
      <span class="todo-text">${highlightText(t.text, searchQuery)}</span>
      ${kw ? '<span class="keyword-tag">' + escapeHtml(kw) + '</span>' : ''}
      ${due ? '<span class="' + due.cls + '">📅 ' + due.label + '</span>' : ''}
      <span class="todo-time">${formatDateTime(t.createdAt)}</span>
      <span class="priority-badge pri-${t.priority ?? '중간'}">${PRIORITY_LABEL[t.priority ?? '중간']}</span>
      <span class="todo-category cat-${t.category}">${CAT_LABEL[t.category]}</span>
      <div class="item-actions">
        <button class="edit-btn"   data-action="edit"   data-id="${t.id}" aria-label="수정">✏</button>
        <button class="delete-btn" data-action="delete" data-id="${t.id}" aria-label="삭제">✕</button>
      </div>
    </div>
  `;
  }).join('');
}

// ── CRUD ─────────────────────────────────────────────────────────────

function addTodo() {
  const input = document.getElementById('new-task');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }

  const dueInput = document.getElementById('new-due');
  setTodos([...todos, {
    id: generateId(),
    text,
    category: document.getElementById('new-cat').value,
    priority: document.getElementById('new-priority').value,
    done: false,
    createdAt: Date.now(),
    dueDate: dueInput.value || null,
  }]);
  renderTodos(todos);

  input.value    = '';
  dueInput.value = '';
  input.classList.remove('at-limit');
  document.getElementById('char-count').textContent = '0';
  document.querySelector('.char-hint').classList.remove('at-limit');
  input.focus();
}

function startEdit(id, spanEl) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const originalText = todo.text;
  let committed = false;

  spanEl.contentEditable = 'true';
  spanEl.textContent     = originalText;
  spanEl.focus();

  const range = document.createRange();
  range.selectNodeContents(spanEl);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  function commit() {
    if (committed) return;
    committed = true;
    spanEl.contentEditable = 'false';
    const newText = spanEl.textContent.trim();
    if (newText && newText !== originalText) {
      setTodos(todos.map(t => t.id === id ? { ...t, text: newText } : t));
    }
    renderTodos(todos);
  }

  spanEl.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      spanEl.removeEventListener('keydown', onKey);
      commit();
    } else if (e.key === 'Escape') {
      committed = true;
      spanEl.contentEditable = 'false';
      spanEl.removeEventListener('keydown', onKey);
      renderTodos(todos);
    }
  });

  spanEl.addEventListener('blur', commit, { once: true });
}

function toggleTodo(id) {
  setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  renderTodos(todos);
}

function deleteTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  if (!confirm(`"${todo.text}" 을(를) 삭제할까요?`)) return;
  setTodos(todos.filter(t => t.id !== id));
  renderTodos(todos);
}

function clearDone() {
  const count = todos.filter(t => t.done).length;
  if (!confirm(`완료된 할 일 ${count}개를 모두 삭제할까요?`)) return;
  setTodos(todos.filter(t => !t.done));
  renderTodos(todos);
}

// ── 내보내기 / 가져오기 ───────────────────────────────────────────────

function exportTodos() {
  const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `todos-${new Date().toISOString().slice(0, 10)}.json`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importTodos(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const raw = JSON.parse(e.target.result);
      if (!Array.isArray(raw)) throw new Error('배열 형식이 아닙니다.');

      if (!confirm(
        `현재 데이터 ${todos.length}개를 가져올 데이터 ${raw.length}개로 교체할까요?\n` +
        `현재 데이터는 'todos-backup' 키에 백업됩니다.`
      )) return;

      localStorage.setItem('todos-backup', JSON.stringify(todos));

      setTodos(raw.map(t => ({
        id:        t.id        || generateId(),
        text:      String(t.text || '').slice(0, 80),
        category:  ['업무', '개인', '공부'].includes(t.category) ? t.category : '개인',
        priority:  ['높음', '중간', '낮음'].includes(t.priority) ? t.priority : '중간',
        done:      Boolean(t.done),
        createdAt: Number(t.createdAt) || Date.now(),
        dueDate:   t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : null,
      })));
      renderTodos(todos);
    } catch (err) {
      alert(`가져오기 실패: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

// ── 이벤트 핸들러 ────────────────────────────────────────────────────

// 할 일 추가
document.getElementById('add-btn').addEventListener('click', addTodo);
document.getElementById('new-task').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

document.getElementById('due-clear').addEventListener('click', () => {
  document.getElementById('new-due').value = '';
});

// 글자 수 + 유효성 표시 + 자동 카테고리 추론
document.getElementById('new-task').addEventListener('input', e => {
  const len = e.target.value.length;
  document.getElementById('char-count').textContent = len;
  e.target.classList.toggle('at-limit', len === 80);
  document.querySelector('.char-hint').classList.toggle('at-limit', len >= 70);

  const guessed = guessCategory(e.target.value);
  if (guessed) document.getElementById('new-cat').value = guessed;
});

// 검색
document.getElementById('search-input').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  renderTodos(todos);
});

// 필터
document.getElementById('filter-area').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderTodos(todos);
});

// 완료 항목 일괄 삭제
document.getElementById('clear-done').addEventListener('click', clearDone);

// 정렬
document.getElementById('sort-select').addEventListener('change', e => {
  currentSort = e.target.value;
  localStorage.setItem(SORT_KEY, currentSort);
  renderTodos(todos);
});

// 내보내기
document.getElementById('export-btn').addEventListener('click', exportTodos);

// 가져오기
document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-input').click();
});
document.getElementById('import-input').addEventListener('change', e => {
  importTodos(e.target.files[0]);
  e.target.value = '';
});

// 할 일 목록 — 위임: toggle / edit / delete + 드래그 앤 드롭
const listEl = document.getElementById('todo-list');

listEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (!id) return;
  if (action === 'toggle')      toggleTodo(id);
  else if (action === 'edit')   startEdit(id, btn.closest('.todo-item').querySelector('.todo-text'));
  else if (action === 'delete') deleteTodo(id);
});

listEl.addEventListener('dragstart', e => {
  const item = e.target.closest('.todo-item[draggable]');
  if (!item) return;
  dragSrcId = item.dataset.id;
  setTimeout(() => item.classList.add('dragging'), 0);
});

listEl.addEventListener('dragover', e => {
  e.preventDefault();
  const item = e.target.closest('.todo-item');
  if (!item || item.dataset.id === dragSrcId) return;
  listEl.querySelectorAll('.todo-item').forEach(el => el.classList.remove('drag-over'));
  item.classList.add('drag-over');
});

listEl.addEventListener('dragleave', e => {
  const item = e.target.closest('.todo-item');
  if (item && !item.contains(e.relatedTarget)) item.classList.remove('drag-over');
});

listEl.addEventListener('drop', e => {
  e.preventDefault();
  const target = e.target.closest('.todo-item');
  if (!target || !dragSrcId || target.dataset.id === dragSrcId) return;
  target.classList.remove('drag-over');

  const srcIdx = todos.findIndex(t => t.id === dragSrcId);
  const tgtIdx = todos.findIndex(t => t.id === target.dataset.id);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const arr = [...todos];
  const [moved] = arr.splice(srcIdx, 1);
  arr.splice(tgtIdx, 0, moved);
  setTodos(arr);
  renderTodos(todos);
  dragSrcId = null;
});

listEl.addEventListener('dragend', () => {
  listEl.querySelectorAll('.todo-item').forEach(el => el.classList.remove('dragging', 'drag-over'));
  dragSrcId = null;
});

// ── 초기화 ───────────────────────────────────────────────────────────

document.getElementById('today-date').textContent  = formatDate();
document.getElementById('sort-select').value       = currentSort;
renderTodos(todos);
