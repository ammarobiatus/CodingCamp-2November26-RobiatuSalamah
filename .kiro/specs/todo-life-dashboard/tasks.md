# Implementation Plan: To-Do Life Dashboard

## Overview

Implementasi aplikasi web produktivitas satu halaman menggunakan HTML, CSS, dan Vanilla JavaScript murni. Tidak ada build tools, tidak ada framework, tidak ada dependensi eksternal — cukup buka `index.html` di browser. Seluruh logika terorganisir dalam satu file `js/script.js` menggunakan Module Pattern dengan object literal JavaScript.

## Tasks

- [ ] 1. Buat struktur folder proyek
  - Buat direktori `css/` dan `js/` di root proyek
  - Buat file kosong `index.html` di root, `css/style.css`, dan `js/script.js`
  - Pastikan semua path menggunakan relative path agar kompatibel dengan GitHub Pages
  - _Requirements: 9.1, 9.4_

- [ ] 2. Buat `index.html` — HTML semantik lengkap dengan anti-FOCT script
  - Tulis deklarasi `<!DOCTYPE html>` dengan `lang="id"`
  - Tambahkan inline `<script>` anti-FOCT di `<head>` **sebelum** `<link rel="stylesheet">` yang membaca `tdl_theme` dari localStorage dan menambahkan class `dark-mode` ke `<html>` jika nilainya `'dark'`
  - Tambahkan `<link rel="stylesheet" href="css/style.css" />` dan `<script src="js/script.js"></script>` (di akhir `<body>`)
  - Buat `<header>` berisi `<div id="greeting-text">` dan `<button id="theme-toggle">`
  - Buat `<main>` berisi empat `<section>`:
    - Section jam: `#clock-time`, `#clock-date`
    - Section timer: `#timer-display`, `#timer-notification`, tombol `#timer-start` / `#timer-stop` / `#timer-reset`, input `#timer-duration-input`, tombol `#timer-apply`, `<p id="timer-error" hidden>`
    - Section todo: input `#todo-input`, tombol `#todo-add`, `<p id="todo-warning" hidden>`, `<ul id="todo-list">`
    - Section quick links: input `#link-name-input`, input `#link-url-input`, tombol `#link-add`, `<p id="links-warning" hidden>`, `<div id="links-list" role="list">`
  - Gunakan elemen HTML semantik (`<header>`, `<main>`, `<section>`, `<button>`) dan atribut `aria-label` untuk aksesibilitas
  - _Requirements: 7.5, 9.1, 9.2, 9.4_

- [ ] 3. Tulis `css/style.css` — variabel CSS, reset, grid layout, dan semua style komponen
  - [ ] 3.1 Deklarasikan CSS Custom Properties untuk light mode di `:root` (warna background, surface, text, accent, danger, warning, border, shadow, input, spacing, radius)
    - Gunakan nilai: `--color-bg: #f0f4f8`, `--color-surface: #ffffff`, `--color-accent: #4a7c59`, `--color-danger: #e53e3e`, dll. sesuai design
    - _Requirements: 7.1, 7.3_

  - [ ] 3.2 Tambahkan CSS Custom Properties override untuk dark mode di selector `html.dark-mode`
    - Ganti nilai warna untuk background (`#1a202c`), surface (`#2d3748`), text, accent (`#68d391`), danger (`#fc8181`), border, shadow, input
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 3.3 Tulis CSS reset dasar, style `body`, dan responsive grid untuk `<main>`
    - Reset `box-sizing: border-box`, margin, padding
    - Desktop (≥1024px): `grid-template-columns: 1fr 1fr`
    - Tablet (768–1023px): `grid-template-columns: 1fr`
    - Mobile (≤767px): `flex-direction: column`, compact spacing
    - _Requirements: 8.4_

  - [ ] 3.4 Tulis style untuk komponen Clock, header, greeting, dan theme toggle button
    - Style `#clock-time` dengan font monospace, ukuran besar
    - Style `#greeting-text` sebagai heading
    - Style `#theme-toggle` dengan transisi 0.2s
    - _Requirements: 1.1, 1.2, 7.1_

  - [ ] 3.5 Tulis style untuk komponen Timer
    - `#timer-display`: `font-family: 'Courier New', monospace`, `font-size: clamp(2.5rem, 5vw, 4rem)`, `font-weight: 700`, `letter-spacing: 0.05em`
    - Style tombol start/stop/reset menggunakan `--color-accent` dan `--color-danger`
    - Style input durasi dan tombol terapkan
    - Style `#timer-notification` dan `#timer-error` (hidden by default via `[hidden] { display: none }`)
    - _Requirements: 2.1, 3.1_

  - [ ] 3.6 Tulis style untuk komponen TodoList
    - Style `.todo-item` sebagai flex row berisi teks dan tombol aksi
    - Style `.todo-item.completed`: `text-decoration: line-through`, `opacity: 0.55`, `color: var(--color-text-completed)`
    - Style tombol selesai, edit, dan hapus
    - Style `#todo-warning` (hidden by default)
    - _Requirements: 4.3, 4.9_

  - [ ] 3.7 Tulis style untuk komponen QuickLinks
    - Style `#links-list` sebagai grid atau flex wrap untuk item tautan
    - Style setiap item tautan sebagai card/button dengan hover effect
    - Style tombol hapus tautan menggunakan `--color-danger`
    - Style `#links-warning` (hidden by default)
    - _Requirements: 6.1, 6.4_

  - [ ] 3.8 Tulis style card untuk semua `<section>` di `<main>`
    - `background: var(--color-surface)`, `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-card)`, `padding: 1.25rem`
    - Pastikan semua komponen tampil dengan baik di dark mode menggunakan CSS variables
    - _Requirements: 7.3, 8.4_

- [ ] 4. Tulis `js/script.js` — modul Storage
  - Deklarasikan konstanta `KEYS` dengan empat key: `tasks: 'tdl_tasks'`, `links: 'tdl_links'`, `theme: 'tdl_theme'`, `timerDuration: 'tdl_timer_duration'`
  - Implementasikan `Storage.save(key, value)`: serialisasi value ke JSON, simpan ke localStorage, bungkus dengan `try/catch`
  - Implementasikan `Storage.load(key)`: baca dari localStorage, parse JSON, kembalikan `null` jika tidak ada atau error (tangkap `SyntaxError`)
  - Implementasikan `Storage.remove(key)`: hapus entri dari localStorage, diam-diam jika tidak ada
  - _Requirements: 8.1, 3.6, 3.7, 4.7, 4.8, 6.6, 6.7, 7.4, 7.5_

- [ ] 5. Tulis `js/script.js` — modul ThemeManager
  - Deklarasikan konstanta `DARK_CLASS = 'dark-mode'`
  - Implementasikan `ThemeManager.init()`: muat preferensi dari `Storage.load(KEYS.theme)`, terapkan tema, perbarui label tombol `#theme-toggle`; jika tidak ada preferensi tersimpan, gunakan `'light'` sebagai default
  - Implementasikan `ThemeManager.toggle()`: balik tema saat ini, simpan ke Storage, perbarui class `<html>` dan label tombol
  - Implementasikan `ThemeManager.apply(theme)`: tambah class `dark-mode` ke `document.documentElement` jika `theme === 'dark'`, hapus jika sebaliknya
  - Implementasikan `ThemeManager.getCurrent()`: kembalikan `'dark'` jika `document.documentElement.classList.contains('dark-mode')`, selain itu `'light'`
  - Implementasikan `ThemeManager.save(theme)`: simpan nilai theme ke `Storage.save(KEYS.theme, theme)`
  - Pasang event listener `click` pada `#theme-toggle` yang memanggil `ThemeManager.toggle()`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 6. Tulis `js/script.js` — modul Clock
  - Deklarasikan variabel `_intervalId` untuk menyimpan referensi setInterval
  - Implementasikan `Clock.getGreeting(hour)`: kembalikan `"Selamat Pagi"` untuk jam 5–11, `"Selamat Siang"` untuk 12–14, `"Selamat Sore"` untuk 15–17, `"Selamat Malam"` untuk 18–23 dan 0–4
  - Implementasikan `Clock.formatTime(date)`: kembalikan string `"HH:MM:SS"` dengan padding nol
  - Implementasikan `Clock.formatDate(date)`: kembalikan string tanggal Bahasa Indonesia (contoh: "Sabtu, 26 November 2026") menggunakan nama hari dan bulan dalam Bahasa Indonesia
  - Implementasikan `Clock.update()`: buat objek `new Date()`, perbarui `#clock-time`, `#clock-date`, dan `#greeting-text`
  - Implementasikan `Clock.init()`: panggil `Clock.update()` sekali, lalu mulai `setInterval(Clock.update.bind(Clock), 1000)` dan simpan ke `_intervalId`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 7. CHECKPOINT — Verifikasi jam dan tema di browser
  - Buka `index.html` langsung di browser (tanpa server)
  - Pastikan jam berjalan dan memperbarui setiap detik
  - Pastikan tanggal tampil dalam Bahasa Indonesia
  - Pastikan sapaan sesuai waktu saat ini
  - Pastikan toggle tema mengubah tampilan antara light dan dark mode
  - Pastikan tidak ada error di console browser

- [ ] 8. Tulis `js/script.js` — modul Timer
  - Deklarasikan objek `state` dengan `totalSeconds: 25 * 60`, `remainingSeconds: 25 * 60`, `isRunning: false`, `intervalId: null`
  - Implementasikan `Timer.validateDuration(value)`: kembalikan `true` hanya jika `value` adalah bilangan bulat (`Number.isInteger`) dan `1 ≤ value ≤ 120`; kembalikan `false` untuk string, float, 0, 121, null, undefined, NaN
  - Implementasikan `Timer.updateDisplay()`: hitung menit dan detik dari `state.remainingSeconds`, render ke `#timer-display` sebagai `"MM:SS"` dengan padding nol
  - Implementasikan `Timer.showNotification()`: tampilkan `#timer-notification` dengan `.removeAttribute('hidden')`, sembunyikan otomatis setelah 5 detik dengan `setTimeout`
  - Implementasikan `Timer.hideNotification()`: sembunyikan `#timer-notification` dengan `.setAttribute('hidden', '')`
  - Implementasikan `Timer.tick()`: kurangi `state.remainingSeconds` satu detik, panggil `updateDisplay()`; jika `remainingSeconds` mencapai 0, panggil `Timer.stop()` lalu `showNotification()`
  - Implementasikan `Timer.stop()`: clear interval dengan `clearInterval(state.intervalId)`, set `state.isRunning = false`, `state.intervalId = null`
  - Implementasikan `Timer.start()`: guard `if (state.isRunning) return;`; set `state.isRunning = true`; mulai `setInterval(Timer.tick.bind(Timer), 1000)` dan simpan ke `state.intervalId`
  - Implementasikan `Timer.reset()`: panggil `Timer.stop()`, set `state.remainingSeconds = state.totalSeconds`, panggil `updateDisplay()`
  - Implementasikan `Timer.applyDuration(minutes)`: validasi dengan `validateDuration(minutes)`; jika tidak valid, tampilkan pesan error di `#timer-error` dan return; jika valid, sembunyikan error, set `state.totalSeconds = minutes * 60`, simpan ke `Storage.save(KEYS.timerDuration, minutes)`; jika timer tidak sedang berjalan, panggil `Timer.reset()`
  - Implementasikan `Timer.init()`: muat durasi dari `Storage.load(KEYS.timerDuration)`; jika ada nilai tersimpan yang valid, terapkan sebagai `totalSeconds`; panggil `updateDisplay()`; pasang event listener untuk `#timer-start`, `#timer-stop`, `#timer-reset`, dan `#timer-apply`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 9. Tulis `js/script.js` — modul TodoList (termasuk isDuplicate untuk ADD dan EDIT)
  - Deklarasikan variabel `tasks = []` sebagai state internal
  - Implementasikan `TodoList.generateId()`: kembalikan `Date.now().toString()`
  - Implementasikan `TodoList.normalizeText(text)`: trim spasi awal/akhir, ganti semua spasi berurutan di dalam teks menjadi satu spasi tunggal menggunakan `.replace(/\s+/g, ' ')`
  - Implementasikan `TodoList.isDuplicate(text, excludeId)`: bandingkan `text.toLowerCase()` dengan `task.text.toLowerCase()` untuk setiap task; abaikan task yang `task.id === excludeId` (untuk edit); kembalikan `true` jika ada kecocokan
  - Implementasikan `TodoList.save()`: simpan array `tasks` ke `Storage.save(KEYS.tasks, tasks)`
  - Implementasikan `TodoList.render()`: re-render seluruh `#todo-list`; setiap item menampilkan teks tugas, tombol selesai (✓), tombol edit (✏️), dan tombol hapus (🗑️); tambahkan class `completed` pada item yang selesai untuk styling line-through
  - Implementasikan `TodoList.addTask(text)`: normalisasi teks; jika kosong, return diam-diam; cek duplikasi dengan `isDuplicate(normalized, null)`; jika duplikat, tampilkan pesan di `#todo-warning` dan return; buat objek Task baru dengan `id`, `text`, `completed: false`, `createdAt`; push ke array; render; save; sembunyikan warning
  - Implementasikan `TodoList.toggleTask(id)`: temukan task dengan id, balik nilai `completed`, render, save
  - Implementasikan `TodoList.startEdit(id)`: ubah elemen item menjadi mode edit inline dengan input pre-filled teks task saat ini dan tombol simpan/batal
  - Implementasikan `TodoList.saveEdit(id, newText)`: normalisasi teks baru; jika kosong, return; cek duplikasi dengan `isDuplicate(normalized, id)` — `excludeId = id` agar task tidak dianggap duplikat dari dirinya sendiri; jika duplikat, tampilkan warning; jika valid, update `task.text`, render, save
  - Implementasikan `TodoList.cancelEdit(id)`: kembalikan item ke tampilan normal tanpa perubahan dengan memanggil `render()`
  - Implementasikan `TodoList.deleteTask(id)`: filter array dengan `tasks.filter(t => t.id !== id)`, render, save
  - Implementasikan `TodoList.init()`: muat tugas dari `Storage.load(KEYS.tasks)`; jika ada, set ke `tasks`; render; pasang event listener `click` pada `#todo-add` dan event `keydown` Enter pada `#todo-input`; gunakan event delegation pada `#todo-list` untuk menangani klik tombol selesai, edit, simpan edit, batal edit, dan hapus
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Tulis `js/script.js` — modul QuickLinks
  - Deklarasikan konstanta `MAX_LINKS = 20` dan `DEFAULT_LINKS` sebagai array tiga tautan: Google (`https://www.google.com`), YouTube (`https://www.youtube.com`), GitHub (`https://www.github.com`) dengan id `'default-1'`, `'default-2'`, `'default-3'`
  - Deklarasikan variabel `links = []` sebagai state internal
  - Implementasikan `QuickLinks.generateId()`: kembalikan `'link-' + Date.now().toString()`
  - Implementasikan `QuickLinks.isValidUrl(url)`: kembalikan `true` jika `url` dimulai dengan `'http://'` atau `'https://'` menggunakan `.startsWith()`
  - Implementasikan `QuickLinks.save()`: simpan array `links` ke `Storage.save(KEYS.links, links)`
  - Implementasikan `QuickLinks.render()`: re-render seluruh `#links-list`; setiap item menampilkan nama tautan sebagai tombol yang membuka URL di tab baru (`window.open(url, '_blank')`) dan tombol hapus (🗑️)
  - Implementasikan `QuickLinks.addLink(name, url)`: validasi nama dan url tidak kosong setelah trim; validasi URL dengan `isValidUrl(url)`; jika tidak valid, tampilkan pesan di `#links-warning`; jika valid, buat objek Link baru, push ke array, render, save, sembunyikan warning, kosongkan input
  - Implementasikan `QuickLinks.deleteLink(id)`: filter array dengan `links.filter(l => l.id !== id)`, render, save
  - Implementasikan `QuickLinks.init()`: muat tautan dari `Storage.load(KEYS.links)`; jika ada data tersimpan, gunakan data tersebut; jika tidak ada, gunakan `DEFAULT_LINKS` (tanpa menyimpan ke Storage); render; pasang event listener `click` pada `#link-add`; gunakan event delegation pada `#links-list` untuk menangani klik tombol hapus
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 11. Tulis `js/script.js` — modul App dan bootstrap DOMContentLoaded
  - Implementasikan `App.init()`: panggil semua modul dalam urutan yang benar — `ThemeManager.init()`, `Clock.init()`, `Timer.init()`, `TodoList.init()`, `QuickLinks.init()`
  - Tambahkan baris bootstrap di akhir file: `document.addEventListener('DOMContentLoaded', App.init.bind(App));`
  - Pastikan tidak ada kode yang berjalan di luar fungsi init (tidak ada side effect saat file di-load)
  - _Requirements: 9.3, 9.5_

- [ ] 12. CHECKPOINT — Verifikasi integrasi penuh di browser
  - Buka `index.html` langsung di browser tanpa server lokal
  - Verifikasi semua fitur berjalan: jam real-time, toggle tema (tersimpan di localStorage), timer start/stop/reset/kustom durasi, add/edit/delete/toggle todo dengan cek duplikasi, add/delete quick links dengan tautan default
  - Tutup dan buka ulang tab browser — pastikan semua data (tugas, tautan, tema, durasi timer) dipulihkan dari localStorage
  - Verifikasi tampilan responsif di lebar desktop, tablet, dan mobile menggunakan DevTools
  - Pastikan tidak ada error atau warning di console browser
  - _Requirements: 8.2, 8.3, 8.4, 9.5_

- [ ]* 13. Buat `.kiro/steering/project-guidelines.md` — panduan proyek
  - Dokumentasikan constraint teknis: satu JS, satu CSS, nol build tools, nol framework
  - Dokumentasikan Local Storage key names dan struktur data Task dan Link
  - Dokumentasikan Module Pattern yang digunakan dan urutan inisialisasi
  - Dokumentasikan strategi anti-FOCT dan cara deploy ke GitHub Pages
  - _Requirements: 9.1, 9.4_

## Notes

- Task bertanda `*` adalah opsional dan dapat dilewati untuk MVP
- Setiap task merujuk ke requirement ID spesifik untuk keterlacakan
- CHECKPOINT (task 7 dan 12) adalah verifikasi manual di browser — tidak memerlukan test file atau framework
- Cek duplikasi pada `isDuplicate` menggunakan `excludeId = null` saat ADD dan `excludeId = task.id` saat EDIT
- Semua path file menggunakan relative path untuk kompatibilitas GitHub Pages
- Modul ditambahkan ke `js/script.js` secara berurutan — setiap section dipisahkan komentar `// ============================================================`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "4"] },
    { "id": 4, "tasks": ["3.4", "3.5", "3.6", "3.7", "5"] },
    { "id": 5, "tasks": ["3.8", "6"] },
    { "id": 6, "tasks": ["8"] },
    { "id": 7, "tasks": ["9"] },
    { "id": 8, "tasks": ["10"] },
    { "id": 9, "tasks": ["11"] },
    { "id": 10, "tasks": ["13"] }
  ]
}
```
