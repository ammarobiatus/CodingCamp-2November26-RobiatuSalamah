---
inclusion: always
---

# Project Guidelines: To-Do Life Dashboard

## Hard Constraints (jangan dilanggar)

1. **Satu file JavaScript**: `js/script.js` — tidak ada file JS tambahan, tidak ada ES6 import/export
2. **Satu file CSS**: `css/style.css` — tidak ada file CSS tambahan
3. **Tanpa build tools**: tidak ada package.json, npm, Vitest, Webpack, atau bundler apapun
4. **Tanpa framework**: hanya HTML, CSS, Vanilla JavaScript
5. **Zero instalasi**: buka `index.html` langsung di browser
6. **Relative paths**: semua path harus relatif untuk kompatibilitas GitHub Pages

## Struktur Folder

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── .kiro/
    ├── specs/todo-life-dashboard/
    └── steering/project-guidelines.md
```

## Pola Arsitektur

Module Pattern dengan JavaScript object literal. Setiap modul adalah `const ModuleName = { ... }` yang dipisahkan oleh comment header:

```
// ============================================================
// MODULE: NamaModul
// ============================================================
```

Urutan inisialisasi (di `App.init()`):
1. ThemeManager.init()
2. Clock.init()
3. Timer.init()
4. TodoList.init()
5. QuickLinks.init()

## LocalStorage Keys

| Kunci | Tipe | Konten |
|---|---|---|
| `tdl_tasks` | JSON array | Array of Task objects |
| `tdl_links` | JSON array | Array of Link objects |
| `tdl_theme` | string | `"light"` atau `"dark"` |
| `tdl_timer_duration` | number | Menit (1–120) |

## Struktur Data

```javascript
// Task
{ id: string, text: string, completed: boolean, createdAt: string }

// Link
{ id: string, name: string, url: string }
```

## Cek Duplikasi Tugas

- **Saat ADD**: `isDuplicate(normalizedText, null)`
- **Saat EDIT**: `isDuplicate(normalizedText, task.id)` — excludeId mencegah task dianggap duplikat dari dirinya sendiri

## Anti-FOCT (Flash of Wrong Theme)

Inline `<script>` di `<head>` SEBELUM `<link rel="stylesheet">`:
```html
<script>
  try {
    if (localStorage.getItem("tdl_theme") === "dark") {
      document.documentElement.classList.add("dark-mode");
    }
  } catch(e) {}
</script>
<link rel="stylesheet" href="css/style.css" />
```

## Deploy ke GitHub Pages

1. Push semua file ke repository GitHub
2. Aktifkan GitHub Pages dari branch `main`, folder `/` (root)
3. Tidak perlu konfigurasi server — semua file statis
