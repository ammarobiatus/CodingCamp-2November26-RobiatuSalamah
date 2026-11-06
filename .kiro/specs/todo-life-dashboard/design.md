# Design Document

## Overview

**To-Do Life Dashboard** adalah aplikasi web produktivitas personal berbasis browser yang dibangun sepenuhnya dengan HTML, CSS, dan Vanilla JavaScript murni — tanpa framework, tanpa build tools, dan tanpa dependensi eksternal. Pengguna cukup membuka `index.html` di browser untuk langsung menggunakannya.

**Constraint Summary:**
- Satu file JS: `js/script.js` (tidak ada ES6 import/export, tidak ada modul terpisah)
- Satu file CSS: `css/style.css`
- Nol build tools (tidak ada npm, tidak ada package.json, tidak ada bundler)
- Nol file pengujian otomatis
- Kompatibel dengan GitHub Pages menggunakan relative path
- Sapaan berdasarkan waktu saja (tidak ada input nama kustom)
- Cek duplikasi berjalan pada ADD dan EDIT (menggunakan parameter `excludeId` untuk edit)

**Tujuan Utama:**
Menyediakan satu halaman dashboard yang menampilkan jam digital dengan sapaan, Focus Timer (Pomodoro) dengan durasi kustom, daftar tugas dengan pencegahan duplikasi, dan tautan cepat — semuanya tersimpan otomatis di LocalStorage browser.

---

## Architecture

### Module Overview

Seluruh logika aplikasi berada dalam satu file `js/script.js`, terorganisir dengan Module Pattern menggunakan object literal JavaScript biasa. Setiap modul dipisahkan oleh comment header:

```
// ============================================================
// MODULE: StorageName
// ============================================================
const ModuleName = { ... };
```

| Modul | Tanggung Jawab |
|---|---|
| `Storage` | Abstraksi baca/tulis/hapus LocalStorage dengan try/catch |
| `ThemeManager` | Kelola toggle dark/light mode; simpan/pulihkan preferensi dari Storage |
| `Clock` | Jam digital HH:MM:SS, tanggal Indonesia, sapaan berbasis waktu |
| `Timer` | Hitung mundur Pomodoro; validasi & persistensi durasi kustom |
| `TodoList` | CRUD tugas; normalisasi teks; cek duplikasi; persistensi |
| `QuickLinks` | CRUD tautan cepat; validasi URL; tautan default; persistensi |
| `App` | Entry point; inisialisasi semua modul dalam urutan yang benar |

### Anti-FOCT (Flash of Correct Theme) Strategy

Untuk mencegah kilatan tampilan yang salah saat halaman dimuat, sebuah `<script>` inline kecil ditempatkan di `<head>` **sebelum** `<link rel="stylesheet">`. Script ini langsung membaca `tdl_theme` dari localStorage dan menambahkan class `dark-mode` ke elemen `<html>` sebelum CSS di-render:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>To-Do Life Dashboard</title>

  <!-- Anti-FOCT: must appear BEFORE stylesheet -->
  <script>
    try {
      if (localStorage.getItem('tdl_theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
      }
    } catch(e) {}
  </script>

  <link rel="stylesheet" href="css/style.css" />
</head>
```

### Initialization Order

Semua inisialisasi modul dipanggil di dalam `DOMContentLoaded` oleh `App.init()`:

```
DOMContentLoaded
  └── App.init()
        ├── ThemeManager.init()   (tema diterapkan sebelum elemen lain)
        ├── Clock.init()          (mulai interval jam)
        ├── Timer.init()          (pulihkan durasi, pasang event listener)
        ├── TodoList.init()       (pulihkan tugas, render)
        └── QuickLinks.init()     (pulihkan tautan / gunakan default, render)
```

---

## Components and Interfaces

### 1. Storage

Abstraksi tipis di atas `window.localStorage`. Semua operasi dibungkus `try/catch` — jika localStorage tidak tersedia (mode private di beberapa browser), operasi gagal secara diam-diam dan aplikasi tetap berfungsi di memori.

**Storage Keys:**

```javascript
const KEYS = {
  tasks:         'tdl_tasks',
  links:         'tdl_links',
  theme:         'tdl_theme',
  timerDuration: 'tdl_timer_duration'
};
```

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `Storage.save(key, value)` | Serialisasi `value` ke JSON dan simpan ke localStorage dengan `key` |
| `Storage.load(key)` | Baca dari localStorage, parse JSON; kembalikan `null` jika tidak ada atau error |
| `Storage.remove(key)` | Hapus entri dari localStorage; diam-diam jika tidak ada |

---

### 2. Clock

Menampilkan waktu real-time, tanggal dalam Bahasa Indonesia, dan sapaan berdasarkan jam.

**State Variables:**
- `_intervalId` — ID interval dari `setInterval`, disimpan untuk referensi internal

**DOM Element IDs:**

| ID | Fungsi |
|---|---|
| `#clock-time` | Menampilkan string waktu HH:MM:SS |
| `#clock-date` | Menampilkan string tanggal (contoh: "Sabtu, 26 November 2026") |
| `#greeting-text` | Menampilkan sapaan waktu (contoh: "Selamat Pagi") |

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `Clock.init()` | Panggil `update()` sekali lalu mulai `setInterval` setiap 1000ms |
| `Clock.update()` | Ambil waktu sekarang, perbarui semua elemen DOM |
| `Clock.getGreeting(hour)` | Kembalikan string sapaan berdasarkan `hour` (0–23) |
| `Clock.formatTime(date)` | Kembalikan string "HH:MM:SS" dari objek Date |
| `Clock.formatDate(date)` | Kembalikan string tanggal format Indonesia dari objek Date |

**Tabel Logika Sapaan:**

| Rentang Jam | Sapaan |
|---|---|
| 5 – 11 | Selamat Pagi |
| 12 – 14 | Selamat Siang |
| 15 – 17 | Selamat Sore |
| 18 – 23, 0 – 4 | Selamat Malam |

---

### 3. Timer

Mengelola hitung mundur Pomodoro dengan start/stop/reset, validasi durasi kustom, dan notifikasi saat selesai.

**State Variables:**

```javascript
const state = {
  totalSeconds:     25 * 60,  // durasi aktif dalam detik
  remainingSeconds: 25 * 60,  // sisa waktu saat ini
  isRunning:        false,
  intervalId:       null
};
```

**DOM Element IDs:**

| ID | Fungsi |
|---|---|
| `#timer-display` | Menampilkan waktu dalam format MM:SS |
| `#timer-start` | Tombol Mulai |
| `#timer-stop` | Tombol Stop |
| `#timer-reset` | Tombol Reset |
| `#timer-notification` | Area pesan notifikasi "Sesi selesai!" |
| `#timer-duration-input` | Input angka untuk durasi kustom (menit) |
| `#timer-apply` | Tombol Terapkan durasi kustom |
| `#timer-error` | Pesan error validasi durasi (tersembunyi secara default) |

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `Timer.init()` | Pulihkan durasi dari Storage, pasang event listener semua tombol |
| `Timer.start()` | Guard `if (isRunning) return`; mulai `setInterval`, set `isRunning = true` |
| `Timer.stop()` | Clear interval, set `isRunning = false` |
| `Timer.reset()` | Stop, set `remainingSeconds = totalSeconds`, perbarui display |
| `Timer.tick()` | Kurangi `remainingSeconds` satu detik; jika 0, stop + `showNotification()` |
| `Timer.applyDuration(minutes)` | Validasi, set `totalSeconds`; jika tidak berjalan, reset display; simpan ke Storage |
| `Timer.validateDuration(value)` | Kembalikan `true` jika `value` adalah bilangan bulat dalam rentang [1, 120] |
| `Timer.updateDisplay()` | Render `remainingSeconds` ke `#timer-display` sebagai MM:SS |
| `Timer.showNotification()` | Tampilkan `#timer-notification`, sembunyikan setelah 5 detik |
| `Timer.hideNotification()` | Sembunyikan `#timer-notification` |

---

### 4. TodoList

Mengelola CRUD tugas, normalisasi teks, cek duplikasi (pada ADD dan EDIT), dan persistensi.

**State Variables:**
- `tasks` — array objek `Task` (lihat Data Models)

**DOM Element IDs:**

| ID | Fungsi |
|---|---|
| `#todo-input` | Input teks untuk tugas baru |
| `#todo-add` | Tombol tambah tugas |
| `#todo-list` | Container `<ul>` atau `<div>` untuk daftar tugas yang di-render |
| `#todo-warning` | Pesan warning duplikasi/error (tersembunyi secara default) |

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `TodoList.init()` | Muat tugas dari Storage, render, pasang event listener |
| `TodoList.addTask(text)` | Normalisasi, cek kosong, cek duplikasi, tambah task ke array, render, save |
| `TodoList.toggleTask(id)` | Balik status `completed` task dengan `id`, render, save |
| `TodoList.startEdit(id)` | Ubah item list menjadi mode edit (inline input) |
| `TodoList.saveEdit(id, newText)` | Normalisasi, cek duplikasi dengan `excludeId=id`, simpan teks baru, render, save |
| `TodoList.cancelEdit(id)` | Kembalikan item ke tampilan normal tanpa perubahan |
| `TodoList.deleteTask(id)` | Hapus task dari array, render, save |
| `TodoList.normalizeText(text)` | Trim + collapse multiple whitespace → single space |
| `TodoList.isDuplicate(text, excludeId)` | Case-insensitive check; abaikan task dengan `excludeId` (untuk edit) |
| `TodoList.render()` | Re-render seluruh `#todo-list` dari state array |
| `TodoList.save()` | Simpan `tasks` ke Storage |
| `TodoList.generateId()` | Kembalikan ID unik (contoh: `Date.now().toString()`) |

---

### 5. QuickLinks

Mengelola CRUD tautan cepat dengan tautan default dan validasi URL dasar.

**State Variables:**
- `links` — array objek `Link` (lihat Data Models)
- `MAX_LINKS` — konstanta: `20`
- `DEFAULT_LINKS` — array literal:

```javascript
const DEFAULT_LINKS = [
  { id: 'default-1', name: 'Google', url: 'https://www.google.com' },
  { id: 'default-2', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'default-3', name: 'GitHub', url: 'https://www.github.com' }
];
```

**DOM Element IDs:**

| ID | Fungsi |
|---|---|
| `#link-name-input` | Input teks untuk nama tautan baru |
| `#link-url-input` | Input teks untuk URL tautan baru |
| `#link-add` | Tombol tambah tautan |
| `#links-list` | Container untuk daftar tautan yang di-render |
| `#links-warning` | Pesan warning error (tersembunyi secara default) |

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `QuickLinks.init()` | Muat tautan dari Storage (atau gunakan default), render, pasang event listener |
| `QuickLinks.addLink(name, url)` | Validasi input, tambah ke array, render, save |
| `QuickLinks.deleteLink(id)` | Hapus tautan dari array, render, save |
| `QuickLinks.isValidUrl(url)` | Kembalikan `true` jika `url` dimulai dengan `http://` atau `https://` |
| `QuickLinks.render()` | Re-render seluruh `#links-list` dari state array |
| `QuickLinks.save()` | Simpan `links` ke Storage |
| `QuickLinks.generateId()` | Kembalikan ID unik |

---

### 6. ThemeManager

Mengelola toggle tema gelap/terang dan sinkronisasi dengan Storage.

**Constants:**
- `DARK_CLASS` — `'dark-mode'`

**DOM Element IDs:**

| ID | Fungsi |
|---|---|
| `#theme-toggle` | Tombol toggle tema; label/ikon diperbarui sesuai tema aktif |

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `ThemeManager.init()` | Muat preferensi dari Storage, terapkan tema, perbarui label tombol |
| `ThemeManager.toggle()` | Balik tema, simpan ke Storage, perbarui class dan label |
| `ThemeManager.apply(theme)` | Tambah/hapus `dark-mode` class dari `<html>` sesuai nilai `theme` |
| `ThemeManager.getCurrent()` | Kembalikan `'dark'` atau `'light'` berdasarkan class aktif |
| `ThemeManager.save(theme)` | Simpan `theme` ke Storage |

---

### 7. App

Entry point aplikasi.

**Method Signatures:**

| Method | Deskripsi |
|---|---|
| `App.init()` | Inisialisasi semua modul dalam urutan yang benar (lihat bagian Architecture) |

**Bootstrapping:**

```javascript
document.addEventListener('DOMContentLoaded', App.init.bind(App));
```

---

## Data Models

### Task

```javascript
// Satu entri tugas dalam TodoList
{
  id:        string,   // unik, contoh: "1732612800000"
  text:      string,   // teks tugas yang sudah dinormalisasi
  completed: boolean,  // false = belum selesai, true = selesai
  createdAt: string    // ISO 8601 timestamp, contoh: "2026-11-26T08:00:00.000Z"
}
```

Disimpan di LocalStorage dengan key `tdl_tasks` sebagai array JSON.

### Link

```javascript
// Satu entri tautan dalam QuickLinks
{
  id:   string,  // unik
  name: string,  // nama tampilan tautan
  url:  string   // URL lengkap, harus dimulai dengan http:// atau https://
}
```

Disimpan di LocalStorage dengan key `tdl_links` sebagai array JSON.

### Theme

```
'light' | 'dark'
```

Disimpan di LocalStorage dengan key `tdl_theme` sebagai string.

### TimerDuration

```
number  // bilangan bulat dalam rentang 1–120 (satuan menit)
```

Disimpan di LocalStorage dengan key `tdl_timer_duration` sebagai number JSON.

---

## HTML Skeleton

Struktur HTML lengkap dengan semua ID elemen. Script Anti-FOCT muncul **sebelum** stylesheet.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>To-Do Life Dashboard</title>

  <!-- Anti-FOCT: baca tema SEBELUM CSS di-load -->
  <script>
    try {
      if (localStorage.getItem('tdl_theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
      }
    } catch(e) {}
  </script>

  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <!-- ===== HEADER ===== -->
  <header>
    <div id="greeting-text">Selamat Pagi</div>
    <button id="theme-toggle" aria-label="Ganti tema">🌙 Mode Gelap</button>
  </header>

  <main>

    <!-- ===== CLOCK ===== -->
    <section aria-label="Jam Digital">
      <div id="clock-time">00:00:00</div>
      <div id="clock-date">Senin, 1 Januari 2024</div>
    </section>

    <!-- ===== TIMER ===== -->
    <section aria-label="Focus Timer">
      <div id="timer-display">25:00</div>
      <div id="timer-notification" hidden>🎉 Sesi selesai! Waktunya istirahat.</div>

      <div>
        <button id="timer-start">Mulai</button>
        <button id="timer-stop">Stop</button>
        <button id="timer-reset">Reset</button>
      </div>

      <div>
        <input id="timer-duration-input" type="number" min="1" max="120"
               placeholder="Menit (1–120)" aria-label="Durasi timer dalam menit" />
        <button id="timer-apply">Terapkan</button>
      </div>
      <p id="timer-error" hidden aria-live="polite"></p>
    </section>

    <!-- ===== TODO LIST ===== -->
    <section aria-label="Daftar Tugas">
      <div>
        <input id="todo-input" type="text"
               placeholder="Tambah tugas baru..." aria-label="Teks tugas baru" />
        <button id="todo-add" aria-label="Tambah tugas">Tambah</button>
      </div>
      <p id="todo-warning" hidden aria-live="polite"></p>
      <ul id="todo-list" aria-label="Daftar tugas"></ul>
    </section>

    <!-- ===== QUICK LINKS ===== -->
    <section aria-label="Tautan Cepat">
      <div>
        <input id="link-name-input" type="text"
               placeholder="Nama tautan" aria-label="Nama tautan" />
        <input id="link-url-input" type="url"
               placeholder="https://..." aria-label="URL tautan" />
        <button id="link-add" aria-label="Tambah tautan">Tambah</button>
      </div>
      <p id="links-warning" hidden aria-live="polite"></p>
      <div id="links-list" role="list" aria-label="Daftar tautan cepat"></div>
    </section>

  </main>

  <script src="js/script.js"></script>
</body>
</html>
```

---

## CSS Architecture

### Custom Properties

Semua warna dan nilai desain dideklarasikan sebagai CSS Custom Properties. Override untuk dark mode dilakukan pada selector `html.dark-mode`.

```css
/* ===== LIGHT MODE (default) ===== */
:root {
  /* Background */
  --color-bg:           #f0f4f8;
  --color-surface:      #ffffff;
  --color-surface-alt:  #f8fafc;

  /* Text */
  --color-text-primary:   #1a202c;
  --color-text-secondary: #4a5568;
  --color-text-muted:     #718096;
  --color-text-completed: #a0aec0;

  /* Accent */
  --color-accent:         #4a7c59;
  --color-accent-hover:   #3a6347;
  --color-danger:         #e53e3e;
  --color-danger-hover:   #c53030;
  --color-warning-bg:     #fffbeb;
  --color-warning-text:   #92400e;
  --color-warning-border: #f6ad55;

  /* UI */
  --color-border:       #e2e8f0;
  --color-shadow:       rgba(0, 0, 0, 0.08);
  --color-input-bg:     #ffffff;
  --color-input-border: #cbd5e0;

  /* Spacing & Shape */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --shadow-card: 0 2px 8px var(--color-shadow);
  --gap-section: 1.5rem;
}

/* ===== DARK MODE OVERRIDE ===== */
html.dark-mode {
  --color-bg:           #1a202c;
  --color-surface:      #2d3748;
  --color-surface-alt:  #374151;

  --color-text-primary:   #f7fafc;
  --color-text-secondary: #e2e8f0;
  --color-text-muted:     #a0aec0;
  --color-text-completed: #4a5568;

  --color-accent:         #68d391;
  --color-accent-hover:   #48bb78;
  --color-danger:         #fc8181;
  --color-danger-hover:   #f56565;
  --color-warning-bg:     #2d2a1e;
  --color-warning-text:   #f6ad55;
  --color-warning-border: #744210;

  --color-border:       #4a5568;
  --color-shadow:       rgba(0, 0, 0, 0.3);
  --color-input-bg:     #2d3748;
  --color-input-border: #4a5568;
}
```

### Responsive Grid

```css
/* Desktop ≥ 1024px: two-column grid */
@media (min-width: 1024px) {
  main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-section);
  }
}

/* Tablet 768–1023px: single column */
@media (min-width: 768px) and (max-width: 1023px) {
  main {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-section);
  }
}

/* Mobile ≤ 767px: single column, compact spacing */
@media (max-width: 767px) {
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem;
  }
}
```

### Component Notes

| Komponen | Style Key |
|---|---|
| **Cards (section)** | `background: var(--color-surface)`, `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-card)`, `padding: 1.25rem` |
| **`.todo-item.completed`** | `text-decoration: line-through`, `opacity: 0.55`, `color: var(--color-text-completed)` |
| **`#timer-display`** | `font-family: 'Courier New', monospace`, `font-size: clamp(2.5rem, 5vw, 4rem)`, `font-weight: 700`, `letter-spacing: 0.05em` |
| **Error/warning messages** | `display: none` by default (set `hidden` attribute in HTML + CSS `[hidden] { display: none }`); tampilkan dengan `.removeAttribute('hidden')` |
| **Tombol aksi** | `background: var(--color-accent)`, hover: `var(--color-accent-hover)`, `border-radius: var(--radius-sm)`, transition 0.2s |
| **Tombol hapus** | `background: var(--color-danger)`, hover: `var(--color-danger-hover)` |
| **Input fields** | `background: var(--color-input-bg)`, `border: 1px solid var(--color-input-border)`, `border-radius: var(--radius-sm)` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Fitur ini tidak menggunakan framework testing otomatis (sesuai constraint). Properties berikut adalah invariant logis yang dapat diverifikasi secara manual di browser console.

### Property 1: getGreeting memetakan setiap jam ke sapaan yang benar

*For any* hour integer in [0, 23], `Clock.getGreeting(hour)` SHALL return:
- `"Selamat Pagi"` jika `hour` dalam rentang [5, 11]
- `"Selamat Siang"` jika `hour` dalam rentang [12, 14]
- `"Selamat Sore"` jika `hour` dalam rentang [15, 17]
- `"Selamat Malam"` jika `hour` dalam rentang [18, 23] atau [0, 4]

**Validates: Requirements 1.5, 1.6, 1.7, 1.8**

---

### Property 2: isDuplicate mencegah penambahan tugas duplikat

*For any* existing task list and any new text that matches an existing task's normalized text (case-insensitive), calling `TodoList.addTask(text)` SHALL leave `tasks.length` unchanged.

**Validates: Requirements 5.1, 5.3**

---

### Property 3: isDuplicate dengan excludeId memperbolehkan edit tanpa konflik palsu

*For any* task with id `X` in the list, calling `TodoList.isDuplicate(task[X].text, X)` SHALL return `false` — sebuah task tidak dianggap duplikat dari dirinya sendiri saat di-edit.

**Validates: Requirements 5.1**

---

### Property 4: normalizeText idempoten

*For any* string `x`, `TodoList.normalizeText(TodoList.normalizeText(x))` SHALL equal `TodoList.normalizeText(x)` — menerapkan normalisasi dua kali menghasilkan hasil yang sama dengan menerapkannya sekali.

**Validates: Requirements 5.2**

---

### Property 5: validateDuration valid jika dan hanya jika bilangan bulat dalam [1, 120]

*For any* value `v`:
- `Timer.validateDuration(v)` SHALL return `true` jika `v` adalah bilangan bulat dan `1 ≤ v ≤ 120`
- `Timer.validateDuration(v)` SHALL return `false` untuk semua value lainnya (string, float, 0, 121, null, undefined, NaN)

**Validates: Requirements 3.2, 3.3**

---

### Property 6: ThemeManager.toggle() dua kali mengembalikan tema asal

*For any* initial theme state, calling `ThemeManager.toggle()` twice SHALL result in `ThemeManager.getCurrent()` returning the same theme as before both calls — toggle adalah operasi yang reversibel.

**Validates: Requirements 7.2**

---

## Error Handling

| Kondisi Error | Penanganan |
|---|---|
| **localStorage tidak tersedia** | `Storage.save/load/remove` dibungkus `try/catch`; operasi gagal diam-diam; aplikasi tetap berfungsi di memori (data tidak persisten) |
| **Timer double-start** | `Timer.start()` memiliki guard: `if (state.isRunning) return;` — mencegah pembuatan interval ganda |
| **Input tugas kosong / hanya spasi** | Setelah normalisasi, cek `if (!normalized) return;` — diam-diam diabaikan tanpa pesan error |
| **Durasi timer tidak valid** | `Timer.validateDuration()` gagal → tampilkan pesan Indonesia di `#timer-error` menggunakan `.removeAttribute('hidden')` dan isi `.textContent` |
| **Tugas duplikat** | `isDuplicate()` return `true` → tampilkan pesan Indonesia di `#todo-warning` (contoh: "Tugas ini sudah ada dalam daftar!") |
| **URL tautan tidak valid** | `isValidUrl()` gagal → tampilkan pesan Indonesia di `#links-warning` (contoh: "URL tidak valid. Gunakan format https://...") |
| **Input nama/URL tautan kosong** | Cek sebelum `addLink()` → tampilkan pesan di `#links-warning` |
| **JSON parse error di Storage.load()** | `try/catch` menangkap `SyntaxError`; kembalikan `null`; modul menggunakan nilai default |

**Pola Umum Tampilkan/Sembunyikan Pesan:**

```javascript
// Tampilkan error
function showWarning(el, message) {
  el.textContent = message;
  el.removeAttribute('hidden');
}

// Sembunyikan error
function hideWarning(el) {
  el.setAttribute('hidden', '');
  el.textContent = '';
}
```

---

## Testing Strategy

Karena constraint "nol file pengujian otomatis", seluruh verifikasi dilakukan secara manual menggunakan browser console. Snippet berikut dapat langsung dijalankan di console setelah `index.html` dibuka.

### Manual Console Verification

**Property 1 — getGreeting untuk semua jam:**
```javascript
// Verifikasi semua 24 jam
const expected = {
  0:'Selamat Malam', 1:'Selamat Malam', 2:'Selamat Malam', 3:'Selamat Malam',
  4:'Selamat Malam', 5:'Selamat Pagi', 6:'Selamat Pagi', 7:'Selamat Pagi',
  8:'Selamat Pagi', 9:'Selamat Pagi', 10:'Selamat Pagi', 11:'Selamat Pagi',
  12:'Selamat Siang', 13:'Selamat Siang', 14:'Selamat Siang',
  15:'Selamat Sore', 16:'Selamat Sore', 17:'Selamat Sore',
  18:'Selamat Malam', 19:'Selamat Malam', 20:'Selamat Malam',
  21:'Selamat Malam', 22:'Selamat Malam', 23:'Selamat Malam'
};
let allPass = true;
for (let h = 0; h <= 23; h++) {
  const result = Clock.getGreeting(h);
  if (result !== expected[h]) {
    console.error(`FAIL hour ${h}: expected "${expected[h]}", got "${result}"`);
    allPass = false;
  }
}
if (allPass) console.log('✅ Property 1 PASS: semua 24 jam menghasilkan sapaan yang benar');
```

**Property 2 — isDuplicate mencegah penambahan duplikat:**
```javascript
// Asumsi TodoList memiliki tugas "Beli susu"
const beforeLen = TodoList.tasks.length;
TodoList.addTask('BELI SUSU'); // duplikat case-insensitive
const afterLen = TodoList.tasks.length;
console.assert(beforeLen === afterLen, '❌ Property 2 FAIL: tugas duplikat berhasil ditambahkan');
if (beforeLen === afterLen) console.log('✅ Property 2 PASS: tugas duplikat ditolak');
```

**Property 3 — isDuplicate dengan excludeId untuk edit:**
```javascript
// Ambil ID tugas pertama
const id = TodoList.tasks[0].id;
const text = TodoList.tasks[0].text;
const isDup = TodoList.isDuplicate(text, id);
console.assert(isDup === false, '❌ Property 3 FAIL: task dianggap duplikat dari dirinya sendiri');
if (!isDup) console.log('✅ Property 3 PASS: excludeId berfungsi dengan benar');
```

**Property 4 — normalizeText idempoten:**
```javascript
const inputs = ['  hello   world  ', 'TUGAS', '  a  b  c  ', '', '   '];
let allPass = true;
inputs.forEach(x => {
  const once = TodoList.normalizeText(x);
  const twice = TodoList.normalizeText(once);
  if (once !== twice) {
    console.error(`FAIL: normalizeText("${x}") → once="${once}", twice="${twice}"`);
    allPass = false;
  }
});
if (allPass) console.log('✅ Property 4 PASS: normalizeText idempoten untuk semua input');
```

**Property 5 — validateDuration valid iff integer dalam [1, 120]:**
```javascript
const validCases = [1, 25, 60, 120];
const invalidCases = [0, 121, -1, 1.5, '25', null, undefined, NaN, '', 'abc'];
let allPass = true;
validCases.forEach(v => {
  if (!Timer.validateDuration(v)) {
    console.error(`FAIL: validateDuration(${v}) seharusnya true`);
    allPass = false;
  }
});
invalidCases.forEach(v => {
  if (Timer.validateDuration(v)) {
    console.error(`FAIL: validateDuration(${JSON.stringify(v)}) seharusnya false`);
    allPass = false;
  }
});
if (allPass) console.log('✅ Property 5 PASS: validateDuration berperilaku benar untuk semua kasus');
```

**Property 6 — ThemeManager.toggle() dua kali kembali ke tema asal:**
```javascript
const original = ThemeManager.getCurrent();
ThemeManager.toggle();
ThemeManager.toggle();
const restored = ThemeManager.getCurrent();
console.assert(original === restored,
  `❌ Property 6 FAIL: original="${original}", restored="${restored}"`);
if (original === restored) console.log('✅ Property 6 PASS: double-toggle mengembalikan tema asal');
```

### Unit Test Manual (Example-Based)

Selain properties di atas, kasus-kasus berikut juga perlu diverifikasi manual:

- **Timer default**: Setelah `Timer.init()`, display menampilkan `"25:00"`
- **Timer double-start guard**: Panggil `Timer.start()` dua kali berturut-turut → `state.intervalId` tidak berubah
- **Timer reset**: `Timer.reset()` mengembalikan `remainingSeconds === totalSeconds`
- **QuickLinks default**: Tanpa data di localStorage, `QuickLinks.init()` memuat 3 tautan default
- **Storage round-trip**: `Storage.save('tdl_test', {a:1}); Storage.load('tdl_test')` → `{a:1}`
- **Tema default**: Hapus `tdl_theme` dari localStorage, reload → tema adalah `light`
