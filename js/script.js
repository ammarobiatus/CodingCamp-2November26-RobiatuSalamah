/* ============================================================
   To-Do Life Dashboard — js/script.js
   Satu file JavaScript, tanpa framework, tanpa build tools.
   Semua modul menggunakan Module Pattern (object literal).
   ============================================================ */

// ============================================================
// MODULE: Storage
// Abstraksi localStorage dengan try/catch.
// ============================================================
const Storage = {
  KEYS: {
    tasks:         'tdl_tasks',
    links:         'tdl_links',
    theme:         'tdl_theme',
    timerDuration: 'tdl_timer_duration'
  },

  /**
   * Simpan nilai ke localStorage.
   * @param {string} key
   * @param {*} value
   */
  save: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch(e) {
      // Gagal diam-diam (misalnya: private mode, storage penuh)
    }
  },

  /**
   * Muat nilai dari localStorage.
   * @param {string} key
   * @returns {*} nilai yang di-parse, atau null jika tidak ada / error
   */
  load: function(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch(e) {
      return null;
    }
  },

  /**
   * Hapus kunci dari localStorage.
   * @param {string} key
   */
  remove: function(key) {
    try {
      localStorage.removeItem(key);
    } catch(e) {}
  }
};


// ============================================================
// MODULE: ThemeManager
// Kelola toggle dark/light mode dan persistensi preferensi.
// ============================================================
const ThemeManager = {
  DARK_CLASS: 'dark-mode',

  /**
   * Inisialisasi: muat preferensi dari Storage dan terapkan.
   */
  init: function() {
    var saved = Storage.load(Storage.KEYS.theme);
    var theme = (saved === 'dark') ? 'dark' : 'light';
    this.apply(theme);
    this._bindEvents();
  },

  /**
   * Toggle antara light dan dark.
   */
  toggle: function() {
    var current = this.getCurrent();
    var next = (current === 'dark') ? 'light' : 'dark';
    this.apply(next);
    this.save(next);
  },

  /**
   * Terapkan tema ke dokumen.
   * @param {'light'|'dark'} theme
   */
  apply: function(theme) {
    var html = document.documentElement;
    var btn  = document.getElementById('theme-toggle');
    if (theme === 'dark') {
      html.classList.add(this.DARK_CLASS);
      if (btn) btn.textContent = '☀️ Mode Terang';
    } else {
      html.classList.remove(this.DARK_CLASS);
      if (btn) btn.textContent = '🌙 Mode Gelap';
    }
  },

  /**
   * @returns {'light'|'dark'} tema aktif saat ini
   */
  getCurrent: function() {
    return document.documentElement.classList.contains(this.DARK_CLASS)
      ? 'dark' : 'light';
  },

  /**
   * Simpan preferensi tema ke Storage.
   * @param {'light'|'dark'} theme
   */
  save: function(theme) {
    Storage.save(Storage.KEYS.theme, theme);
  },

  _bindEvents: function() {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function() {
        ThemeManager.toggle();
      });
    }
  }
};


// ============================================================
// MODULE: Clock
// Jam digital real-time dan sapaan berbasis waktu.
// ============================================================
const Clock = {
  _intervalId: null,

  // Nama hari dalam Bahasa Indonesia
  _hari: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],

  // Nama bulan dalam Bahasa Indonesia
  _bulan: ['Januari','Februari','Maret','April','Mei','Juni',
           'Juli','Agustus','September','Oktober','November','Desember'],

  /**
   * Inisialisasi jam: tampilkan sekali lalu mulai interval.
   */
  init: function() {
    this.update();
    this._intervalId = setInterval(function() {
      Clock.update();
    }, 1000);
  },

  /**
   * Perbarui semua elemen Clock di DOM.
   */
  update: function() {
    var now  = new Date();
    var elTime = document.getElementById('clock-time');
    var elDate = document.getElementById('clock-date');
    var elGreet = document.getElementById('greeting-text');

    if (elTime)  elTime.textContent  = Clock.formatTime(now);
    if (elDate)  elDate.textContent  = Clock.formatDate(now);
    if (elGreet) elGreet.textContent = Clock.getGreeting(now.getHours());
  },

  /**
   * Format waktu sebagai HH:MM:SS.
   * @param {Date} date
   * @returns {string}
   */
  formatTime: function(date) {
    var h = String(date.getHours()).padStart(2, '0');
    var m = String(date.getMinutes()).padStart(2, '0');
    var s = String(date.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  },

  /**
   * Format tanggal dalam Bahasa Indonesia.
   * @param {Date} date
   * @returns {string} contoh: "Sabtu, 26 November 2026"
   */
  formatDate: function(date) {
    var hari   = this._hari[date.getDay()];
    var tgl    = date.getDate();
    var bulan  = this._bulan[date.getMonth()];
    var tahun  = date.getFullYear();
    return hari + ', ' + tgl + ' ' + bulan + ' ' + tahun;
  },

  /**
   * Sapaan berdasarkan jam (0–23).
   * @param {number} hour
   * @returns {string}
   */
  getGreeting: function(hour) {
    if (hour >= 5  && hour <= 11) return 'Selamat Pagi';
    if (hour >= 12 && hour <= 14) return 'Selamat Siang';
    if (hour >= 15 && hour <= 17) return 'Selamat Sore';
    return 'Selamat Malam';
  }
};


// ============================================================
// MODULE: Timer
// Focus Timer (Pomodoro) dengan kustomisasi durasi.
// ============================================================
const Timer = {
  state: {
    totalSeconds:     25 * 60,
    remainingSeconds: 25 * 60,
    isRunning:        false,
    intervalId:       null
  },

  /**
   * Inisialisasi: muat durasi tersimpan, render, bind events.
   */
  init: function() {
    var saved = Storage.load(Storage.KEYS.timerDuration);
    if (saved !== null && this.validateDuration(saved)) {
      this.state.totalSeconds     = saved * 60;
      this.state.remainingSeconds = saved * 60;
    }
    this.updateDisplay();
    this._bindEvents();
  },

  /**
   * Mulai hitung mundur. Guard terhadap double-start.
   */
  start: function() {
    if (this.state.isRunning) return;  // guard idempoten
    this.hideNotification();
    this._hideEl('timer-error');
    this.state.isRunning = true;
    this.state.intervalId = setInterval(function() {
      Timer.tick();
    }, 1000);
  },

  /**
   * Hentikan hitung mundur dan pertahankan sisa waktu.
   */
  stop: function() {
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
    this.state.isRunning  = false;
  },

  /**
   * Reset ke durasi aktif.
   */
  reset: function() {
    this.stop();
    this.state.remainingSeconds = this.state.totalSeconds;
    this.updateDisplay();
    this.hideNotification();
    this._hideEl('timer-error');
  },

  /**
   * Satu detik tick — dipanggil oleh interval.
   */
  tick: function() {
    if (this.state.remainingSeconds > 0) {
      this.state.remainingSeconds--;
      this.updateDisplay();
    }
    if (this.state.remainingSeconds <= 0) {
      this.stop();
      this.showNotification();
    }
  },

  /**
   * Tampilkan notifikasi sesi selesai.
   */
  showNotification: function() {
    var el = document.getElementById('timer-notification');
    if (el) {
      el.removeAttribute('hidden');
      // Sembunyikan otomatis setelah 8 detik
      setTimeout(function() { Timer.hideNotification(); }, 8000);
    }
  },

  /**
   * Sembunyikan notifikasi.
   */
  hideNotification: function() {
    var el = document.getElementById('timer-notification');
    if (el) el.setAttribute('hidden', '');
  },

  /**
   * Terapkan durasi baru dari input #timer-duration-input.
   */
  applyDuration: function() {
    var input = document.getElementById('timer-duration-input');
    var errorEl = document.getElementById('timer-error');
    if (!input) return;

    var val = parseInt(input.value, 10);

    if (!this.validateDuration(val)) {
      if (errorEl) {
        errorEl.textContent = 'Masukkan angka bulat antara 1 hingga 120.';
        errorEl.removeAttribute('hidden');
      }
      return;
    }

    // Input valid
    if (errorEl) errorEl.setAttribute('hidden', '');
    this.state.totalSeconds = val * 60;
    Storage.save(Storage.KEYS.timerDuration, val);

    // Jika tidak sedang berjalan, reset tampilan
    if (!this.state.isRunning) {
      this.state.remainingSeconds = this.state.totalSeconds;
      this.updateDisplay();
    }

    input.value = '';
  },

  /**
   * Validasi nilai durasi.
   * @param {*} value
   * @returns {boolean} true jika bilangan bulat dalam [1, 120]
   */
  validateDuration: function(value) {
    return Number.isInteger(value) && value >= 1 && value <= 120;
  },

  /**
   * Render sisa waktu ke #timer-display dalam format MM:SS.
   */
  updateDisplay: function() {
    var el = document.getElementById('timer-display');
    if (!el) return;
    var total = this.state.remainingSeconds;
    var m = String(Math.floor(total / 60)).padStart(2, '0');
    var s = String(total % 60).padStart(2, '0');
    el.textContent = m + ':' + s;
  },

  _bindEvents: function() {
    var self = this;

    var startBtn  = document.getElementById('timer-start');
    var stopBtn   = document.getElementById('timer-stop');
    var resetBtn  = document.getElementById('timer-reset');
    var applyBtn  = document.getElementById('timer-apply');
    var durationInput = document.getElementById('timer-duration-input');

    if (startBtn)  startBtn.addEventListener('click',  function() { self.start(); });
    if (stopBtn)   stopBtn.addEventListener('click',   function() { self.stop(); });
    if (resetBtn)  resetBtn.addEventListener('click',  function() { self.reset(); });
    if (applyBtn)  applyBtn.addEventListener('click',  function() { self.applyDuration(); });

    if (durationInput) {
      durationInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') self.applyDuration();
      });
    }
  },

  _hideEl: function(id) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('hidden', '');
  }
};


// ============================================================
// MODULE: TodoList
// Daftar tugas dengan CRUD, cek duplikasi pada ADD dan EDIT.
// ============================================================
const TodoList = {
  tasks: [],  // Array of Task objects

  /**
   * Inisialisasi: muat dari Storage, render, bind events.
   */
  init: function() {
    var saved = Storage.load(Storage.KEYS.tasks);
    if (Array.isArray(saved)) this.tasks = saved;
    this.render();
    this._bindEvents();
  },

  /**
   * Tambah tugas baru dengan validasi dan cek duplikasi.
   * @param {string} text
   */
  addTask: function(text) {
    var normalized = this.normalizeText(text);
    if (!normalized) return;  // kosong, diam-diam

    if (this.isDuplicate(normalized, null)) {
      this._showWarning('Tugas ini sudah ada dalam daftar!');
      return;
    }

    this._hideWarning();
    this.tasks.push({
      id:        this.generateId(),
      text:      text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    });
    this.save();
    this.render();

    // Kosongkan input
    var input = document.getElementById('todo-input');
    if (input) input.value = '';
  },

  /**
   * Toggle status selesai/belum selesai.
   * @param {string} id
   */
  toggleTask: function(id) {
    var task = this._findById(id);
    if (!task) return;
    task.completed = !task.completed;
    this.save();
    this.render();
  },

  /**
   * Hapus tugas dari daftar.
   * @param {string} id
   */
  deleteTask: function(id) {
    this.tasks = this.tasks.filter(function(t) { return t.id !== id; });
    this.save();
    this.render();
  },

  /**
   * Render ulang semua tugas.
   */
  render: function() {
    var list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.tasks.length === 0) {
      list.innerHTML = '<li class="todo-empty" style="text-align:center;color:var(--color-text-muted);padding:1rem 0;font-style:italic;">Belum ada tugas. Tambahkan tugas baru di atas!</li>';
      return;
    }

    var self = this;
    this.tasks.forEach(function(task) {
      var li = document.createElement('li');
      li.className = 'todo-item' + (task.completed ? ' completed' : '');
      li.setAttribute('data-id', task.id);
      li.innerHTML = self._renderItemHTML(task);
      list.appendChild(li);
    });
  },

  /**
   * Bangun HTML untuk satu item tugas.
   * @param {Task} task
   * @returns {string}
   */
  _renderItemHTML: function(task) {
    var doneLabel  = task.completed ? '↩ Batal' : '✓ Selesai';
    var doneClass  = task.completed ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary';
    var textEscape = this._escapeHtml(task.text);

    return '<span class="todo-text">' + textEscape + '</span>'
      + '<div class="todo-actions">'
      + '<button class="' + doneClass + '" data-action="toggle" data-id="' + task.id + '" aria-label="' + (task.completed ? 'Tandai belum selesai' : 'Tandai selesai') + '">' + doneLabel + '</button>'
      + '<button class="btn btn-sm btn-secondary" data-action="edit" data-id="' + task.id + '" aria-label="Edit tugas">✏️</button>'
      + '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + task.id + '" aria-label="Hapus tugas">🗑️</button>'
      + '</div>';
  },

  /**
   * Tampilkan mode edit inline pada item tugas.
   * @param {string} id
   */
  _startEdit: function(id) {
    var task = this._findById(id);
    if (!task) return;

    var li = document.querySelector('#todo-list [data-id="' + id + '"]');
    if (!li) return;

    li.innerHTML = '<input type="text" class="todo-edit-input" value="' + this._escapeHtml(task.text) + '" aria-label="Edit teks tugas" />'
      + '<div class="todo-actions">'
      + '<button class="btn btn-sm btn-primary" data-action="save-edit" data-id="' + id + '">💾 Simpan</button>'
      + '<button class="btn btn-sm btn-secondary" data-action="cancel-edit" data-id="' + id + '">✕ Batal</button>'
      + '</div>';

    var input = li.querySelector('.todo-edit-input');
    if (input) {
      input.focus();
      // Simpan saat tekan Enter
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') TodoList._saveEdit(id);
        if (e.key === 'Escape') TodoList.render();
      });
    }
  },

  /**
   * Simpan hasil edit dengan cek duplikasi (excludeId = id).
   * @param {string} id
   */
  _saveEdit: function(id) {
    var li = document.querySelector('#todo-list [data-id="' + id + '"]');
    if (!li) return;

    var input = li.querySelector('.todo-edit-input');
    if (!input) return;

    var newText    = input.value;
    var normalized = this.normalizeText(newText);

    if (!normalized) {
      this.render();  // batalkan jika kosong
      return;
    }

    // Cek duplikasi — kecualikan diri sendiri dengan excludeId = id
    if (this.isDuplicate(normalized, id)) {
      this._showWarning('Tugas "' + newText.trim() + '" sudah ada dalam daftar!');
      return;
    }

    this._hideWarning();
    var task = this._findById(id);
    if (task) task.text = newText.trim();
    this.save();
    this.render();
  },

  /**
   * Normalisasi teks: trim + collapse multiple whitespace → single space.
   * @param {string} text
   * @returns {string}
   */
  normalizeText: function(text) {
    if (typeof text !== 'string') return '';
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  },

  /**
   * Cek duplikasi secara case-insensitive.
   * @param {string} normalizedText  — teks yang sudah dinormalisasi
   * @param {string|null} excludeId  — abaikan task ini (untuk edit)
   * @returns {boolean}
   */
  isDuplicate: function(normalizedText, excludeId) {
    return this.tasks.some(function(t) {
      if (excludeId !== null && t.id === excludeId) return false;
      return TodoList.normalizeText(t.text) === normalizedText;
    });
  },

  /**
   * Simpan array tasks ke Storage.
   */
  save: function() {
    Storage.save(Storage.KEYS.tasks, this.tasks);
  },

  /**
   * Generate ID unik.
   * @returns {string}
   */
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  _findById: function(id) {
    return this.tasks.find(function(t) { return t.id === id; }) || null;
  },

  _escapeHtml: function(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _showWarning: function(msg) {
    var el = document.getElementById('todo-warning');
    if (el) { el.textContent = msg; el.removeAttribute('hidden'); }
  },

  _hideWarning: function() {
    var el = document.getElementById('todo-warning');
    if (el) { el.setAttribute('hidden', ''); el.textContent = ''; }
  },

  _bindEvents: function() {
    var input  = document.getElementById('todo-input');
    var addBtn = document.getElementById('todo-add');
    var list   = document.getElementById('todo-list');

    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var inp = document.getElementById('todo-input');
        if (inp) TodoList.addTask(inp.value);
      });
    }

    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') TodoList.addTask(input.value);
      });
      // Sembunyikan warning saat mulai mengetik
      input.addEventListener('input', function() {
        TodoList._hideWarning();
      });
    }

    // Event delegation: tangani semua klik tombol di dalam daftar
    if (list) {
      list.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;

        var action = btn.getAttribute('data-action');
        var id     = btn.getAttribute('data-id');

        if (action === 'toggle')      TodoList.toggleTask(id);
        else if (action === 'edit')   TodoList._startEdit(id);
        else if (action === 'delete') TodoList.deleteTask(id);
        else if (action === 'save-edit')   TodoList._saveEdit(id);
        else if (action === 'cancel-edit') { TodoList._hideWarning(); TodoList.render(); }
      });
    }
  }
};


// ============================================================
// MODULE: QuickLinks
// Manajemen tautan cepat dengan tautan default.
// ============================================================
const QuickLinks = {
  links:    [],
  MAX_LINKS: 20,
  DEFAULT_LINKS: [
    { id: 'default-1', name: 'Google',  url: 'https://www.google.com' },
    { id: 'default-2', name: 'YouTube', url: 'https://www.youtube.com' },
    { id: 'default-3', name: 'GitHub',  url: 'https://www.github.com' }
  ],

  /**
   * Inisialisasi: muat dari Storage atau gunakan default.
   */
  init: function() {
    var saved = Storage.load(Storage.KEYS.links);
    if (Array.isArray(saved) && saved.length > 0) {
      this.links = saved;
    } else {
      // Gunakan default (tidak disimpan ke Storage dulu)
      this.links = this.DEFAULT_LINKS.slice();
    }
    this.render();
    this._bindEvents();
  },

  /**
   * Tambah tautan baru.
   * @param {string} name
   * @param {string} url
   */
  addLink: function(name, url) {
    var trimName = (name || '').trim();
    var trimUrl  = (url  || '').trim();

    if (!trimName || !trimUrl) {
      this._showWarning('Nama dan URL tidak boleh kosong.');
      return;
    }

    if (!this.isValidUrl(trimUrl)) {
      this._showWarning('URL tidak valid. Gunakan format https://...');
      return;
    }

    if (this.links.length >= this.MAX_LINKS) {
      this._showWarning('Batas maksimum ' + this.MAX_LINKS + ' tautan telah tercapai.');
      return;
    }

    this._hideWarning();
    this.links.push({ id: this.generateId(), name: trimName, url: trimUrl });
    this.save();
    this.render();

    // Kosongkan input
    var nameInput = document.getElementById('link-name-input');
    var urlInput  = document.getElementById('link-url-input');
    if (nameInput) nameInput.value = '';
    if (urlInput)  urlInput.value  = '';
  },

  /**
   * Hapus tautan berdasarkan id.
   * @param {string} id
   */
  deleteLink: function(id) {
    this.links = this.links.filter(function(l) { return l.id !== id; });
    this.save();
    this.render();
  },

  /**
   * Validasi URL sederhana.
   * @param {string} url
   * @returns {boolean}
   */
  isValidUrl: function(url) {
    return typeof url === 'string'
      && (url.startsWith('http://') || url.startsWith('https://'));
  },

  /**
   * Render ulang daftar tautan.
   */
  render: function() {
    var list = document.getElementById('links-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.links.length === 0) {
      list.innerHTML = '<p style="color:var(--color-text-muted);font-style:italic;font-size:0.875rem;">Belum ada tautan. Tambahkan tautan di atas!</p>';
      return;
    }

    var self = this;
    this.links.forEach(function(link) {
      var item = document.createElement('div');
      item.className = 'link-item';
      item.setAttribute('role', 'listitem');
      item.innerHTML = '<a class="link-anchor" href="' + self._escapeHtml(link.url)
        + '" target="_blank" rel="noopener noreferrer">'
        + self._escapeHtml(link.name)
        + '</a>'
        + '<button class="btn btn-danger btn-sm" data-action="delete-link" data-id="'
        + link.id + '" aria-label="Hapus tautan ' + self._escapeHtml(link.name) + '">✕</button>';
      list.appendChild(item);
    });
  },

  /**
   * Simpan ke Storage.
   */
  save: function() {
    Storage.save(Storage.KEYS.links, this.links);
  },

  /**
   * Generate ID unik.
   * @returns {string}
   */
  generateId: function() {
    return 'link-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  _escapeHtml: function(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _showWarning: function(msg) {
    var el = document.getElementById('links-warning');
    if (el) { el.textContent = msg; el.removeAttribute('hidden'); }
  },

  _hideWarning: function() {
    var el = document.getElementById('links-warning');
    if (el) { el.setAttribute('hidden', ''); el.textContent = ''; }
  },

  _bindEvents: function() {
    var addBtn   = document.getElementById('link-add');
    var urlInput = document.getElementById('link-url-input');
    var list     = document.getElementById('links-list');

    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var n = document.getElementById('link-name-input');
        var u = document.getElementById('link-url-input');
        QuickLinks.addLink(n ? n.value : '', u ? u.value : '');
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var n = document.getElementById('link-name-input');
          QuickLinks.addLink(n ? n.value : '', urlInput.value);
        }
      });
    }

    // Event delegation untuk tombol hapus
    if (list) {
      list.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action="delete-link"]');
        if (btn) QuickLinks.deleteLink(btn.getAttribute('data-id'));
      });
    }
  }
};


// ============================================================
// MODULE: App
// Entry point — inisialisasi semua modul.
// ============================================================
const App = {
  init: function() {
    ThemeManager.init();
    Clock.init();
    Timer.init();
    TodoList.init();
    QuickLinks.init();
  }
};

// Bootstrap: jalankan App.init saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
