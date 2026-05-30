/* ═══════════════════════════════════════════════════
   VoxNote — script.js
   ═══════════════════════════════════════════════════ */

// ── Elementos DOM ────────────────────────────────────
const screenList      = document.getElementById('screenList');
const screenRecord    = document.getElementById('screenRecord');
const notesGrid       = document.getElementById('notesGrid');
const emptyState      = document.getElementById('emptyState');
const noteCountEl     = document.getElementById('noteCount');
const fabBtn          = document.getElementById('fabBtn');
const backBtn         = document.getElementById('backBtn');
const deleteNoteBtn   = document.getElementById('deleteNoteBtn');
const recordBtn       = document.getElementById('recordBtn');
const recordBtnIcon   = document.getElementById('recordBtnIcon');
const saveBtn         = document.getElementById('saveBtn');
const newRecordBtn    = document.getElementById('newRecordBtn');
const waveCanvas      = document.getElementById('waveCanvas');
const recordingBadge  = document.getElementById('recordingBadge');
const recTimeEl       = document.getElementById('recTime');
const interimTextEl   = document.getElementById('interimText');
const polishedTextEl  = document.getElementById('polishedText');
const rawTextEl       = document.getElementById('rawText');
const noteMetaEl      = document.getElementById('noteMeta');
const toast           = document.getElementById('toast');

// States
const stateIdle       = document.getElementById('stateIdle');
const stateRecording  = document.getElementById('stateRecording');
const stateProcessing = document.getElementById('stateProcessing');
const stateDone       = document.getElementById('stateDone');

// Tabs
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab' + capitalize(btn.dataset.tab)).classList.remove('hidden');
  });
});

// ── Estado Global ────────────────────────────────────
let notes = loadNotes();
let currentNoteId  = null;
let isRecording    = false;
let recognition    = null;
let finalTranscript = '';
let rawTranscript   = '';
let recTimerInterval = null;
let recSeconds = 0;

// Audio viz
let audioCtx = null, analyser = null, micSource = null, animFrame = null;

// ── Chave da API Google Gemini ────────────────────────
// Gere em: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = 'AQ.Ab8RN6IQxygrSq_jFGwtKsNZY6WiNz8JnqrRlOldp7M_KS2r_A';

// ── Utils ────────────────────────────────────────────
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function showToast(msg, duration = 2200) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── Persistência ─────────────────────────────────────
function loadNotes() {
  try { return JSON.parse(localStorage.getItem('voxnote_notes') || '[]'); } catch { return []; }
}

function saveNotes() {
  localStorage.setItem('voxnote_notes', JSON.stringify(notes));
}

// ── Navegação ────────────────────────────────────────
function goToList() {
  resetRecordState();
  screenRecord.classList.add('hidden');
  screenList.classList.remove('hidden');
  renderNotes();
}

function goToRecord(noteId = null) {
  screenList.classList.add('hidden');
  screenRecord.classList.remove('hidden');

  if (noteId) {
    currentNoteId = noteId;
    const note = notes.find(n => n.id === noteId);
    if (note) displayNote(note);
    deleteNoteBtn.style.display = 'block';
  } else {
    currentNoteId = null;
    deleteNoteBtn.style.display = 'none';
    showState('idle');
    saveBtn.style.display = 'none';
    newRecordBtn.style.display = 'none';
  }
}

fabBtn.addEventListener('click', () => goToRecord());
backBtn.addEventListener('click', () => {
  if (isRecording) stopRecording(false);
  goToList();
});

deleteNoteBtn.addEventListener('click', () => {
  if (!currentNoteId) return;
  notes = notes.filter(n => n.id !== currentNoteId);
  saveNotes();
  showToast('Nota excluída.');
  goToList();
});

// ── Render Notes ─────────────────────────────────────
function renderNotes() {
  const existingCards = notesGrid.querySelectorAll('.note-card');
  existingCards.forEach(c => c.remove());

  noteCountEl.textContent = notes.length === 1 ? '1 nota' : `${notes.length} notas`;
  emptyState.style.display = notes.length === 0 ? 'flex' : 'none';

  // Mais recentes primeiro
  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);
  sorted.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-card-title">${escapeHtml(note.polished || note.raw || 'Nota vazia')}</div>
      <div class="note-card-meta">
        <span>${formatDate(note.createdAt)}</span>
        <span class="duration">${formatDuration(note.duration || 0)}</span>
      </div>`;
    card.addEventListener('click', () => goToRecord(note.id));
    notesGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Exibir nota salva ────────────────────────────────
function displayNote(note) {
  polishedTextEl.textContent = note.polished || '';
  rawTextEl.textContent      = note.raw || '';
  noteMetaEl.textContent     = `${formatDate(note.createdAt)}  ·  ${formatDuration(note.duration || 0)}`;
  showState('done');
  saveBtn.style.display       = 'none';
  newRecordBtn.style.display  = 'inline-flex';
  finalTranscript = note.raw || '';
  rawTranscript   = note.raw || '';
}

// ── Estado da UI ─────────────────────────────────────
function showState(name) {
  stateIdle.classList.toggle('hidden', name !== 'idle');
  stateRecording.classList.toggle('hidden', name !== 'recording');
  stateProcessing.classList.toggle('hidden', name !== 'processing');
  stateDone.classList.toggle('hidden', name !== 'done');
}

// ── Timer ────────────────────────────────────────────
function startTimer() {
  recSeconds = 0;
  recTimeEl.textContent = '0:00';
  recTimerInterval = setInterval(() => {
    recSeconds++;
    recTimeEl.textContent = formatDuration(recSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(recTimerInterval);
  recTimerInterval = null;
}

// ── Visualizador de ondas (Canvas) ───────────────────
function initAudioViz(stream) {
  audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  analyser  = audioCtx.createAnalyser();
  analyser.fftSize = 128;
  micSource = audioCtx.createMediaStreamSource(stream);
  micSource.connect(analyser);
  drawWave();
}

function drawWave() {
  const ctx  = waveCanvas.getContext('2d');
  const W    = waveCanvas.offsetWidth;
  const H    = waveCanvas.offsetHeight;
  waveCanvas.width  = W * devicePixelRatio;
  waveCanvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const bufLen = analyser.frequencyBinCount;
  const buf    = new Uint8Array(bufLen);

  function render() {
    animFrame = requestAnimationFrame(render);
    analyser.getByteTimeDomainData(buf);

    ctx.clearRect(0, 0, W, H);

    // Linha base sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Onda principal
    ctx.strokeStyle = isRecording ? 'rgba(255,63,63,0.8)' : 'rgba(232,255,60,0.3)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    ctx.beginPath();

    const sliceW = W / bufLen;
    let x = 0;
    for (let i = 0; i < bufLen; i++) {
      const v = buf[i] / 128.0;
      const y = (v * H) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.lineTo(W, H / 2);
    ctx.stroke();
  }
  render();
}

function drawIdleWave() {
  if (audioCtx) return; // visualizador real ativo
  const ctx = waveCanvas.getContext('2d');
  const W   = waveCanvas.offsetWidth || 320;
  const H   = waveCanvas.offsetHeight || 110;
  waveCanvas.width  = W * devicePixelRatio;
  waveCanvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  let t = 0;
  function render() {
    if (isRecording) return;
    animFrame = requestAnimationFrame(render);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(232,255,60,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const y = H / 2 + Math.sin((x / W) * Math.PI * 4 + t) * 6;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    t += 0.02;
  }
  render();
}

function stopAudioViz() {
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = null;
  if (micSource) micSource.disconnect();
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  analyser = null;
  micSource = null;

  // Limpa canvas
  const ctx = waveCanvas.getContext('2d');
  ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
}

// ── Speech Recognition ────────────────────────────────
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  showState('idle');
  stateIdle.querySelector('.idle-msg').innerHTML =
    '⚠ Seu navegador não suporta reconhecimento de voz.<br><small>Use o Chrome ou Edge.</small>';
  recordBtn.disabled = true;
}

recordBtn.addEventListener('click', () => {
  if (isRecording) stopRecording(true);
  else startRecording();
});

newRecordBtn.addEventListener('click', () => {
  showState('idle');
  saveBtn.style.display = 'none';
  newRecordBtn.style.display = 'none';
  finalTranscript = '';
  rawTranscript = '';
  startRecording();
});

saveBtn.addEventListener('click', saveCurrentNote);

// ── Iniciar gravação ─────────────────────────────────
async function startRecording() {
  // Pedir microfone
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    showToast('⚠ Permissão de microfone negada.');
    return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  isRecording = true;
  finalTranscript = '';
  rawTranscript   = '';
  interimTextEl.textContent = '';

  recordBtn.classList.add('recording');
  recordBtnIcon.textContent = '■';
  recordingBadge.classList.add('visible');
  showState('recording');
  saveBtn.style.display = 'none';
  newRecordBtn.style.display = 'none';

  startTimer();
  initAudioViz(stream);

  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalTranscript += text + ' ';
      } else {
        interim = text;
      }
    }
    // Mostra final + interim
    interimTextEl.textContent = (finalTranscript + interim).trim();
  };

  recognition.onerror = (e) => {
    if (e.error === 'no-speech') return; // ignora silêncio
    console.warn('SR error:', e.error);
    if (e.error !== 'aborted') showToast('Erro no microfone: ' + e.error);
  };

  recognition.onend = () => {
    // Reiniciar se ainda gravando (API para em silêncio)
    if (isRecording) {
      try { recognition.start(); } catch (_) {}
    }
  };

  recognition.start();
}

// ── Parar gravação ────────────────────────────────────
function stopRecording(processWithAI = true) {
  if (!isRecording) return;
  isRecording = false;

  recordBtn.classList.remove('recording');
  recordBtnIcon.textContent = '●';
  recordingBadge.classList.remove('visible');
  stopTimer();

  if (recognition) {
    recognition.onend = null; // não reiniciar
    recognition.stop();
    recognition = null;
  }

  stopAudioViz();
  drawIdleWave();

  const raw = finalTranscript.trim();
  rawTranscript = raw;

  if (!raw) {
    showToast('Nenhuma fala detectada.');
    showState('idle');
    return;
  }

  if (processWithAI) {
    refineWithAI(raw);
  } else {
    showState('idle');
  }
}

// ── Refinar com IA (Google Gemini) ───────────────────
async function refineWithAI(rawText) {
  showState('processing');

  const prompt = `Você é um assistente especializado em transcrições de voz em português brasileiro.

Recebi o texto bruto abaixo, gerado por reconhecimento de voz. Sua tarefa é refinar esse texto:

1. Corrija erros de reconhecimento de voz e palavras que não fazem sentido no contexto
2. Adicione pontuação adequada (vírgulas, pontos, ponto e vírgula, reticências em pausas longas)
3. Divida em parágrafos onde o assunto mudar ou houver pausa temática
4. Corrija ortografia e concordância
5. Mantenha o tom e a voz original do falante — NÃO resuma nem altere o conteúdo
6. Preserve perguntas com ponto de interrogação
7. Capitalize corretamente nomes próprios, siglas e início de frases

Responda APENAS com o texto refinado, sem explicações, sem cabeçalho, sem aspas.

TEXTO BRUTO:
${rawText}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const polished = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || rawText;

    polishedTextEl.textContent = polished;
    rawTextEl.textContent      = rawText;
    noteMetaEl.textContent     = `Agora · ${formatDuration(recSeconds)}`;
    showState('done');
    saveBtn.style.display      = 'inline-flex';
    newRecordBtn.style.display = 'inline-flex';

  } catch (err) {
    console.error('Erro na IA:', err);
    // Fallback: limpeza básica local
    const cleaned = basicClean(rawText);
    polishedTextEl.textContent = cleaned;
    rawTextEl.textContent      = rawText;
    noteMetaEl.textContent     = `Agora · ${formatDuration(recSeconds)} · (IA indisponível)`;
    showState('done');
    saveBtn.style.display      = 'inline-flex';
    newRecordBtn.style.display = 'inline-flex';
    showToast('IA indisponível — texto básico exibido.');
  }
}

// Limpeza mínima sem IA
function basicClean(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/(^|\. )([a-z])/g, (m, p, c) => p + c.toUpperCase())
    .trim() + '.';
}

// ── Salvar nota ───────────────────────────────────────
function saveCurrentNote() {
  const polished = polishedTextEl.textContent.trim();
  const raw      = rawTextEl.textContent.trim() || rawTranscript;

  if (!polished && !raw) { showToast('Nada para salvar.'); return; }

  if (currentNoteId) {
    // Atualizar existente
    const idx = notes.findIndex(n => n.id === currentNoteId);
    if (idx !== -1) {
      notes[idx].polished  = polished;
      notes[idx].raw       = raw || notes[idx].raw;
      notes[idx].updatedAt = Date.now();
    }
  } else {
    // Nova nota
    const note = {
      id:        uid(),
      polished,
      raw,
      duration:  recSeconds,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    notes.push(note);
    currentNoteId = note.id;
    deleteNoteBtn.style.display = 'block';
  }

  saveNotes();
  saveBtn.style.display = 'none';
  showToast('✓ Nota salva!');
}

// ── Reset ─────────────────────────────────────────────
function resetRecordState() {
  if (isRecording) {
    isRecording = false;
    if (recognition) { recognition.onend = null; recognition.stop(); recognition = null; }
    recordBtn.classList.remove('recording', 'processing');
    recordBtnIcon.textContent = '●';
    recordingBadge.classList.remove('visible');
    stopTimer();
    stopAudioViz();
  }
  finalTranscript = '';
  rawTranscript   = '';
  currentNoteId   = null;
  showState('idle');
  saveBtn.style.display      = 'none';
  newRecordBtn.style.display = 'none';
  deleteNoteBtn.style.display = 'none';
}

// ── Init ──────────────────────────────────────────────
renderNotes();
drawIdleWave();
