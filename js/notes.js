const STORE_KEY = 'nota_notes_v1';
let notes = [];
let activeId = null;
let saveTimer = null;
let currentMode = 'edit';

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch(e) { notes = []; }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}

function getNoteById(id) {
  return notes.find(n => n.id === id);
}

function newNote() {
  const note = {
    id: Date.now().toString(),
    title: '',
    body: '',
    updated: Date.now()
  };
  notes.unshift(note);
  save();
  renderList();
  openNote(note.id);
  setTimeout(() => document.getElementById('note-title').focus(), 50);
}

function openNote(id) {
  activeId = id;
  const note = getNoteById(id);
  if (!note) return;

  document.getElementById('no-note').style.display = 'none';
  const ea = document.getElementById('editor-area');
  ea.style.display = 'flex';

  document.getElementById('note-title').value = note.title;
  document.getElementById('editor').value = note.body;
  updatePreview(note.body);
  updateStats(note.body);
  setSaveIndicator('saved');
  renderList();
}

function onTitleChange() {
  const note = getNoteById(activeId);
  if (!note) return;
  note.title = document.getElementById('note-title').value;
  note.updated = Date.now();
  scheduleSave();
  renderList();
}

function onEditorChange() {
  const note = getNoteById(activeId);
  if (!note) return;
  const val = document.getElementById('editor').value;
  note.body = val;
  note.updated = Date.now();
  updatePreview(val);
  updateStats(val);
  scheduleSave();
  renderList();
}

function scheduleSave() {
  setSaveIndicator('saving…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    save();
    setSaveIndicator('saved');
  }, 600);
}

function setSaveIndicator(text) {
  const el = document.getElementById('save-indicator');
  el.textContent = text;
  el.className = 'save-indicator' + (text === 'saved' ? ' saved' : '');
}

function deleteNote() {
  if (!activeId) return;
  if (!confirm('Delete this note?')) return;
  notes = notes.filter(n => n.id !== activeId);
  save();
  activeId = null;
  document.getElementById('no-note').style.display = 'flex';
  document.getElementById('editor-area').style.display = 'none';
  renderList();
}

function updatePreview(md) {
  const html = typeof marked !== 'undefined' ? marked.parse(md || '') : md;
  document.getElementById('preview').innerHTML = html;
}

function updateStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  document.getElementById('stat-words').textContent = words + ' word' + (words !== 1 ? 's' : '');
  document.getElementById('stat-chars').textContent = chars + ' char' + (chars !== 1 ? 's' : '');
  document.getElementById('stat-lines').textContent = lines + ' line' + (lines !== 1 ? 's' : '');
}

function setMode(mode) {
  currentMode = mode;
  ['edit','split','preview'].forEach(m => {
    document.getElementById('btn-' + m).classList.toggle('active', m === mode);
  });
  const ep = document.getElementById('edit-pane');
  const pp = document.getElementById('preview-pane');
  const div = document.getElementById('pane-divider');
  if (mode === 'edit') {
    ep.style.display = 'flex'; pp.style.display = 'none'; div.style.display = 'none';
  } else if (mode === 'preview') {
    ep.style.display = 'none'; pp.style.display = 'flex'; div.style.display = 'none';
  } else {
    ep.style.display = 'flex'; pp.style.display = 'flex'; div.style.display = 'block';
  }
}

function toggleCheatsheet() {
  const cs = document.getElementById('cheatsheet');
  const btn = document.getElementById('help-btn');
  const open = cs.classList.toggle('open');
  btn.classList.toggle('active', open);
}

function renderList() {
  const q = document.getElementById('search').value.toLowerCase();
  const list = document.getElementById('notes-list');
  const filtered = notes.filter(n =>
    !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">no notes yet<br>press + to create one</div>';
    return;
  }

  list.innerHTML = filtered.map(n => {
    const preview = n.body.replace(/[#*`_>]/g, '').trim().slice(0, 60) || 'empty note';
    const date = new Date(n.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const title = n.title || 'untitled';
    return `<div class="note-item ${n.id === activeId ? 'active' : ''}" onclick="openNote('${n.id}')">
      <div class="note-item-title">${esc(title)}</div>
      <div class="note-item-preview">${esc(preview)}</div>
      <div class="note-item-date">${date}</div>
    </div>`;
  }).join('');
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

load();
renderList();
setMode('edit');