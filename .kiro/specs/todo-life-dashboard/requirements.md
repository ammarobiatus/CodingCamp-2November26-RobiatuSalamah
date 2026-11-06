# Requirements Document

## Introduction

To-Do Life Dashboard adalah aplikasi web produktivitas personal berbasis browser yang membantu pengguna mengorganisir aktivitas harian. Aplikasi ini dibangun dengan HTML, CSS, dan Vanilla JavaScript murni (tanpa framework), menggunakan LocalStorage untuk persistensi data, dan dapat di-deploy melalui GitHub Pages. Seluruh teks antarmuka pengguna menggunakan Bahasa Indonesia.

Fitur utama mencakup: jam digital dengan sapaan berdasarkan waktu, Focus Timer (Pomodoro), daftar tugas (To-Do List), dan tautan cepat (Quick Links). Fitur tambahan mencakup: mode gelap/terang, kustomisasi durasi Pomodoro, dan pencegahan duplikasi tugas.

## Glossary

- **Dashboard**: Halaman utama aplikasi yang menampilkan semua widget/fitur sekaligus dalam satu tampilan.
- **Clock**: Komponen jam digital yang menampilkan waktu dan tanggal saat ini secara real-time.
- **Timer**: Komponen Focus Timer (Pomodoro) yang menghitung mundur dari durasi yang ditentukan.
- **TodoList**: Komponen daftar tugas yang memungkinkan pengguna menambah, mengedit, menyelesaikan, dan menghapus tugas.
- **QuickLinks**: Komponen tautan cepat yang menyimpan dan menampilkan shortcut ke situs web favorit.
- **ThemeManager**: Komponen yang mengelola preferensi tema terang/gelap.
- **Storage**: Mekanisme penyimpanan data menggunakan browser LocalStorage.
- **Task**: Satu entri tugas dalam TodoList, memiliki teks dan status (selesai/belum selesai).
- **Link**: Satu entri tautan dalam QuickLinks, memiliki nama dan URL.
- **Pomodoro**: Teknik manajemen waktu dengan sesi kerja terfokus (default 25 menit).
- **DuplicateChecker**: Komponen yang memvalidasi keunikan tugas baru sebelum ditambahkan ke TodoList.

## Requirements

### Requirement 1: Jam Digital dan Sapaan Waktu

**User Story:** Sebagai pengguna, saya ingin melihat waktu dan tanggal saat ini beserta sapaan yang sesuai, agar saya selalu tahu waktu dan merasa disambut saat membuka dashboard.

#### Acceptance Criteria

1. THE Clock SHALL menampilkan waktu saat ini dalam format HH:MM:SS.
2. THE Clock SHALL menampilkan tanggal saat ini dalam format hari, tanggal bulan tahun menggunakan Bahasa Indonesia (contoh: "Sabtu, 26 November 2026").
3. WHEN halaman pertama kali dimuat, THE Clock SHALL memulai pembaruan otomatis setiap satu detik.
4. WHILE aplikasi berjalan di browser, THE Clock SHALL memperbarui tampilan waktu setiap satu detik tanpa memerlukan tindakan dari pengguna.
5. WHEN waktu saat ini berada antara 05:00 dan 11:59, THE Dashboard SHALL menampilkan sapaan "Selamat Pagi".
6. WHEN waktu saat ini berada antara 12:00 dan 14:59, THE Dashboard SHALL menampilkan sapaan "Selamat Siang".
7. WHEN waktu saat ini berada antara 15:00 dan 17:59, THE Dashboard SHALL menampilkan sapaan "Selamat Sore".
8. WHEN waktu saat ini berada antara 18:00 dan 04:59 (hari berikutnya), THE Dashboard SHALL menampilkan sapaan "Selamat Malam".

---

### Requirement 2: Focus Timer (Pomodoro)

**User Story:** Sebagai pengguna, saya ingin menggunakan timer hitung mundur untuk sesi kerja terfokus, agar saya dapat mengelola waktu belajar atau bekerja secara efektif.

#### Acceptance Criteria

1. WHEN halaman pertama kali dimuat, THE Timer SHALL menampilkan durasi default 25:00 dalam format MM:SS.
2. WHEN pengguna menekan tombol "Mulai", THE Timer SHALL memulai hitung mundur dari durasi yang ditampilkan.
3. WHILE Timer sedang berjalan, THE Timer SHALL mengurangi waktu yang tersisa sebesar satu detik setiap satu detik.
4. WHEN pengguna menekan tombol "Stop" saat Timer sedang berjalan, THE Timer SHALL menghentikan hitung mundur dan mempertahankan waktu yang tersisa.
5. WHEN pengguna menekan tombol "Reset", THE Timer SHALL menghentikan hitung mundur dan mengembalikan tampilan ke durasi yang sedang aktif.
6. WHEN hitung mundur mencapai 00:00, THE Timer SHALL menampilkan notifikasi kepada pengguna bahwa sesi telah selesai.
7. WHEN hitung mundur mencapai 00:00, THE Timer SHALL menghentikan interval secara otomatis.
8. IF pengguna menekan tombol "Mulai" saat Timer sudah berjalan, THEN THE Timer SHALL mengabaikan aksi tersebut untuk mencegah interval berjalan ganda.

---

### Requirement 3: Kustomisasi Durasi Pomodoro

**User Story:** Sebagai pengguna, saya ingin mengatur durasi sesi Pomodoro sesuai kebutuhan saya, agar saya dapat menyesuaikan panjang sesi kerja terfokus.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan kolom input dan tombol "Terapkan" untuk mengatur durasi Timer dalam satuan menit.
2. WHEN pengguna memasukkan nilai menit yang valid (bilangan bulat positif antara 1 hingga 120) dan menekan tombol "Terapkan", THE Timer SHALL memperbarui durasi aktif dan menampilkan nilai baru dalam format MM:SS.
3. IF pengguna memasukkan nilai yang bukan bilangan bulat positif atau di luar rentang 1–120 saat menekan tombol "Terapkan", THEN THE Dashboard SHALL menampilkan pesan peringatan dalam Bahasa Indonesia dan tidak mengubah durasi aktif.
4. WHILE Timer sedang berjalan, THE Dashboard SHALL tidak menginterupsi hitung mundur yang sedang berjalan ketika pengguna menerapkan durasi baru.
5. WHEN pengguna berhasil menerapkan durasi baru dan Timer tidak sedang berjalan, THE Timer SHALL mereset tampilan ke durasi baru tersebut.
6. WHEN halaman dimuat, THE Storage SHALL memulihkan nilai durasi kustom terakhir yang disimpan; IF tidak ada nilai tersimpan, THEN THE Timer SHALL menggunakan durasi default 25 menit.
7. WHEN pengguna berhasil menerapkan durasi baru, THE Storage SHALL menyimpan nilai durasi tersebut ke LocalStorage.

---

### Requirement 4: Daftar Tugas (To-Do List)

**User Story:** Sebagai pengguna, saya ingin mengelola daftar tugas harian saya, agar saya dapat melacak apa yang perlu dan sudah saya kerjakan.

#### Acceptance Criteria

1. WHEN pengguna memasukkan teks tugas yang tidak kosong dan menekan tombol tambah atau tombol Enter, THE TodoList SHALL menambahkan tugas baru dengan status belum selesai.
2. IF pengguna mencoba menambahkan tugas dengan kolom input kosong atau hanya berisi spasi, THEN THE TodoList SHALL tidak menambahkan tugas dan tidak menampilkan pesan error.
3. WHEN pengguna menekan tombol selesai pada sebuah tugas, THE TodoList SHALL mengubah status tugas tersebut menjadi selesai dan memberikan tampilan visual yang berbeda (contoh: teks dicoret).
4. WHEN pengguna menekan tombol selesai pada tugas yang sudah selesai, THE TodoList SHALL mengubah status tugas tersebut kembali menjadi belum selesai.
5. WHEN pengguna menekan tombol edit pada sebuah tugas, THE TodoList SHALL memungkinkan pengguna mengubah teks tugas tersebut.
6. WHEN pengguna menekan tombol hapus pada sebuah tugas, THE TodoList SHALL menghapus tugas tersebut dari daftar secara permanen.
7. WHEN pengguna menambah, mengedit, menandai selesai, atau menghapus tugas, THE Storage SHALL menyimpan seluruh daftar tugas terbaru ke LocalStorage.
8. WHEN halaman dimuat, THE Storage SHALL memulihkan seluruh tugas beserta statusnya dari LocalStorage dan menampilkannya kembali di TodoList.
9. THE TodoList SHALL menampilkan tugas yang belum selesai dengan tampilan visual yang berbeda dari tugas yang sudah selesai.

---

### Requirement 5: Pencegahan Duplikasi Tugas

**User Story:** Sebagai pengguna, saya ingin dicegah dari menambahkan tugas yang sama dua kali, agar daftar tugas saya tetap rapi dan tidak mengulang entri yang sama.

#### Acceptance Criteria

1. WHEN pengguna mencoba menambahkan tugas baru, THE DuplicateChecker SHALL membandingkan teks tugas baru dengan seluruh tugas yang sudah ada menggunakan perbandingan case-insensitive setelah normalisasi spasi.
2. THE DuplicateChecker SHALL menormalkan teks tugas dengan cara: memotong spasi di awal dan akhir (trim) serta mengubah beberapa spasi berurutan di dalam teks menjadi satu spasi tunggal.
3. IF teks tugas baru yang sudah dinormalisasi cocok dengan teks tugas yang sudah ada yang sudah dinormalisasi secara case-insensitive, THEN THE DuplicateChecker SHALL menampilkan pesan peringatan dalam Bahasa Indonesia (contoh: "Tugas ini sudah ada dalam daftar!") dan tidak menambahkan tugas duplikat.
4. WHEN teks tugas baru yang sudah dinormalisasi tidak cocok dengan tugas manapun yang ada, THE TodoList SHALL melanjutkan proses penambahan tugas secara normal.

---

### Requirement 6: Tautan Cepat (Quick Links)

**User Story:** Sebagai pengguna, saya ingin menyimpan dan mengakses tautan situs web favorit saya dengan cepat, agar saya tidak perlu mengetik URL setiap kali ingin mengunjungi situs tersebut.

#### Acceptance Criteria

1. WHEN halaman pertama kali dimuat tanpa data tersimpan, THE QuickLinks SHALL menampilkan tiga tautan default: Google (https://www.google.com), YouTube (https://www.youtube.com), dan GitHub (https://www.github.com).
2. WHEN pengguna memasukkan nama tautan dan URL yang valid lalu menekan tombol tambah, THE QuickLinks SHALL menambahkan tautan baru ke daftar.
3. IF pengguna mencoba menambahkan tautan dengan nama atau URL yang kosong, THEN THE QuickLinks SHALL tidak menambahkan tautan tersebut.
4. WHEN pengguna menekan tombol sebuah tautan, THE QuickLinks SHALL membuka URL tautan tersebut di tab browser baru.
5. WHEN pengguna menekan tombol hapus pada sebuah tautan, THE QuickLinks SHALL menghapus tautan tersebut dari daftar secara permanen.
6. WHEN pengguna menambah atau menghapus tautan, THE Storage SHALL menyimpan seluruh daftar tautan terbaru ke LocalStorage.
7. WHEN halaman dimuat dan terdapat data tautan tersimpan di LocalStorage, THE Storage SHALL memulihkan dan menampilkan daftar tautan tersimpan (bukan tautan default).

---

### Requirement 7: Mode Gelap dan Terang (Dark/Light Mode)

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, agar saya dapat menggunakan dashboard dengan nyaman di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan tombol toggle untuk beralih antara mode terang dan mode gelap.
2. WHEN pengguna menekan tombol toggle tema, THE ThemeManager SHALL mengubah tema tampilan seluruh aplikasi antara mode terang dan mode gelap.
3. WHEN tema berubah, THE ThemeManager SHALL memastikan seluruh komponen (Timer, TodoList, QuickLinks, Clock) tampil dengan baik di tema yang aktif.
4. WHEN pengguna mengganti tema, THE Storage SHALL menyimpan preferensi tema tersebut ke LocalStorage.
5. WHEN halaman dimuat, THE Storage SHALL memulihkan preferensi tema terakhir dari LocalStorage dan menerapkannya sebelum konten ditampilkan untuk mencegah kilatan tampilan yang salah (flash of wrong theme).
6. IF tidak ada preferensi tema tersimpan di LocalStorage, THEN THE ThemeManager SHALL menerapkan mode terang sebagai tema default.

---

### Requirement 8: Persistensi Data dan Performa

**User Story:** Sebagai pengguna, saya ingin data saya tetap tersimpan saat saya menutup dan membuka kembali browser, agar saya tidak kehilangan tugas, tautan, dan pengaturan yang sudah saya buat.

#### Acceptance Criteria

1. THE Storage SHALL menggunakan kunci LocalStorage yang berbeda untuk setiap jenis data: tugas (TodoList), tautan (QuickLinks), tema (ThemeManager), dan durasi Pomodoro (Timer).
2. WHEN halaman dimuat, THE Dashboard SHALL menyelesaikan seluruh proses pemulihan data dari LocalStorage dan merender antarmuka awal dalam waktu kurang dari 3 detik pada koneksi normal.
3. THE Dashboard SHALL berfungsi sepenuhnya di browser modern (Chrome, Firefox, Edge, Safari versi terbaru) tanpa error di konsol browser.
4. THE Dashboard SHALL menampilkan antarmuka yang responsif dan dapat digunakan dengan baik pada lebar layar desktop (≥1024px), tablet (768px–1023px), dan mobile (320px–767px).

---

### Requirement 9: Kualitas Kode dan Struktur Proyek

**User Story:** Sebagai pengembang, saya ingin kode proyek terorganisir dengan baik dan mudah dipahami, agar proyek mudah di-maintain dan di-deploy.

#### Acceptance Criteria

1. THE Dashboard SHALL menggunakan struktur folder: `index.html` di root, satu file CSS di `css/style.css`, dan satu file JavaScript di `js/script.js`.
2. THE Dashboard SHALL menggunakan elemen HTML semantik yang sesuai (contoh: `<header>`, `<main>`, `<section>`, `<button>`).
3. THE Dashboard SHALL tidak menggunakan library atau framework JavaScript eksternal.
4. THE Dashboard SHALL dapat di-deploy dan berfungsi sepenuhnya melalui GitHub Pages tanpa konfigurasi server tambahan.
5. THE Dashboard SHALL tidak menghasilkan error atau warning di konsol browser saat berjalan normal.
