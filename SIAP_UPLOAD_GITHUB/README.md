# Dashboard Sistem Pendukung Keputusan (SPK) Pemilihan Mobil Menggunakan Metode Analytical Hierarchy Process (AHP)

Aplikasi web Sistem Informasi Pendukung Keputusan pemilihan mobil berbasis algoritma **Analytical Hierarchy Process (AHP)** yang dibangun menggunakan teknologi **HTML5, CSS3 murni, JavaScript murni, dan Python Flask**, dengan sumber data langsung dari file spreadsheet Excel `AHP_Studi_Kasus_Mobil.xlsx`.

> 🚀 **LIVE DEMO DASHBOARD (Dapat Diakses Langsung di Browser):**  
> Setelah repositori ini diunggah ke GitHub dan GitHub Pages diaktifkan, dashboard dapat langsung dibuka secara online melalui link:  
> **`https://<username-github-anda>.github.io/<nama-repo>/`**  
> *(Dosen tidak perlu menginstal Python, cukup mengklik link di atas untuk mencoba seluruh dashboard interaktif)*

---

## 1. Analisis Struktur File Excel (`AHP_Studi_Kasus_Mobil.xlsx`)

Berdasarkan analisis file data `data/AHP_Studi_Kasus_Mobil.xlsx` pada sheet `AHP_Mobil`:

### A. Kriteria Penilaian (3 Kriteria)
1. **Style (S)** &mdash; Gaya dan estetika desain mobil.
2. **Keandalan (K)** &mdash; Durabilitas, mesin, dan keandalan operasional.
3. **Konsumsi Bahan Bakar (B)** &mdash; Efisiensi pemakaian BBM.

**Matriks Perbandingan Kriteria (Baris 18–20):**
- $S$ vs $K = 0.5$ (atau $1/2$) $\rightarrow$ Keandalan lebih penting daripada Style ($K$ vs $S = 2$).
- $S$ vs $B = 3.0$ $\rightarrow$ Style sedikit lebih penting daripada Konsumsi BBM ($B$ vs $S = 1/3$).
- $K$ vs $B = 4.0$ $\rightarrow$ Keandalan lebih penting daripada Konsumsi BBM ($B$ vs $K = 1/4$).
- **Hasil Bobot Prioritas Kriteria:**
  - Keandalan ($K$): **0.557143 (55.71%)** &mdash; Kriteria paling dominan.
  - Style ($S$): **0.320238 (32.02%)**.
  - Konsumsi BBM ($B$): **0.122619 (12.26%)**.
  - Nilai $\lambda_{\max} = 3.023413$, $CI = 0.011706$, $RI = 0.58$, **$CR = 0.020183 \le 0.10$ (Konsisten)**.

### B. Alternatif Mobil (4 Mobil)
1. **Toyota Avanza**
2. **Daihatsu Xenia**
3. **Suzuki Ertiga**
4. **Nissan Grand Livina**

### C. Matriks Perbandingan Alternatif per Kriteria
1. **Kriteria Style (Baris 33–36):**
   - Bobot lokal: Ertiga (**0.4365**), Grand Livina (**0.3543**), Avanza (**0.1292**), Xenia (**0.0800**).
   - $\lambda_{\max} = 4.190160$, $CI = 0.063387$, $RI = 0.90$, **$CR = 0.070430 \le 0.10$ (Konsisten)**.
2. **Kriteria Keandalan (Baris 50–53):**
   - Bobot lokal: Ertiga (**0.5256**), Grand Livina (**0.2728**), Avanza (**0.1243**), Xenia (**0.0772**).
   - $\lambda_{\max} = 4.171082$, $CI = 0.057027$, $RI = 0.90$, **$CR = 0.063364 \le 0.10$ (Konsisten)**.
3. **Kriteria Konsumsi BBM (Baris 67–70):**
   - Bobot lokal: Ertiga (**0.3977**), Avanza (**0.3052**), Xenia (**0.2165**), Grand Livina (**0.0806**).
   - $\lambda_{\max} = 4.119277$, $CI = 0.039759$, $RI = 0.90$, **$CR = 0.044177 \le 0.10$ (Konsisten)**.

### D. Hasil Akhir & Peringkat Rekomendasi (Baris 90–102)
$$\text{Skor Akhir} = (w_S \times \text{Skor } S) + (w_K \times \text{Skor } K) + (w_B \times \text{Skor } B)$$

| Peringkat | Alternatif Mobil | Kontribusi Style | Kontribusi Keandalan | Kontribusi BBM | Skor Akhir AHP | Persentase | Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **1** | **Suzuki Ertiga** | 0.139783 | 0.292855 | 0.048766 | **0.481403** | **48.14%** | **Rekomendasi Utama (Terpilih)** |
| 2 | Nissan Grand Livina | 0.113453 | 0.152013 | 0.009884 | **0.275349** | 27.53% | Pilihan Kedua |
| 3 | Toyota Avanza | 0.041373 | 0.069257 | 0.037420 | **0.148050** | 14.81% | Pilihan Ketiga |
| 4 | Daihatsu Xenia | 0.025629 | 0.043019 | 0.026550 | **0.095198** | 9.52% | Pilihan Keempat |

---

## 2. Struktur Proyek

```text
d:/Tugas AHP/
├── app.py                      # Server Flask & Controller REST API
├── ahp.py                      # Modul algoritma matematis AHP & uji konsistensi
├── data_loader.py              # Parser Excel openpyxl/pandas & ekspor CSV/XLSX
├── requirements.txt            # Daftar dependensi Python
├── README.md                   # Dokumentasi lengkap & tutorial
├── data/
│   └── AHP_Studi_Kasus_Mobil.xlsx  # File dataset Excel sumber utama
├── templates/
│   ├── base.html               # Master layout dengan sidebar & header
│   ├── index.html              # Halaman Dashboard Utama
│   ├── alternatif.html         # Halaman Data Alternatif Mobil
│   ├── kriteria.html           # Halaman Data Kriteria & Bobot
│   ├── perhitungan.html        # Halaman Tahapan Perhitungan Matematis AHP
│   └── hasil.html              # Halaman Hasil, Peringkat & Rekomendasi
└── static/
    ├── css/
    │   └── style.css           # Desain modern Sistem Informasi (Biru Tua, Putih, Abu-abu)
    └── js/
        └── script.js           # Logika interaktif, Fetch API, Chart.js, filter, sort
```

---

## 3. Persiapan Lingkungan dan Instalasi

### Langkah 1: Buka Terminal di VS Code
Buka folder `d:\Tugas AHP` di VS Code, lalu buka terminal (tekan `Ctrl + \``).

### Langkah 2: Buat Virtual Environment Python
```bash
python -m venv venv
```

### Langkah 3: Aktifkan Virtual Environment
- **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt / CMD):**
  ```cmd
  venv\Scripts\activate.bat
  ```

### Langkah 4: Instalasi Seluruh Pustaka Dependensi
```bash
pip install -r requirements.txt
```
Pustaka yang diinstal:
- `Flask`: Framework web server Python untuk menyediakan rute dan REST API.
- `pandas` & `openpyxl`: Membaca struktur sel, tabel, dan formula Excel.
- `numpy`: Perhitungan aljabar matriks, vektor eigen, dan normalisasi.

---

## 4. Cara Menjalankan Aplikasi

Jalankan perintah berikut di terminal:
```bash
python app.py
```

Output pada terminal akan menampilkan:
```text
================================================================
  DASHBOARD SPK PEMILIHAN MOBIL - METODE AHP
  Server berjalan di: http://127.0.0.1:5000
  Tekan Ctrl+C untuk menghentikan server
================================================================
 * Running on http://127.0.0.1:5000
```

Buka peramban (Google Chrome, Edge, atau Firefox) dan akses:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 5. Fitur-Fitur Utama Dashboard

1. **Dashboard Utama (`/`)**:
   - Kartu statistik: Total Alternatif, Total Kriteria, Mobil Terpilih, Status Konsistensi.
   - Grafik batang interaktif peringkat skor mobil.
   - Grafik donat interaktif bobot prioritas kriteria.
   - Radar chart multi-kriteria untuk analisis komparatif profil mobil.
   - Kartu spotlight rekomendasi eksekutif.

2. **Data Alternatif Mobil (`/alternatif`)**:
   - Tabel responsif mobil alternatif dengan skor detail per kriteria.
   - Pencarian real-time berdasarkan nama mobil.
   - Filter peringkat (Rank 1, Top 2, dll).
   - Pengurutan tabel interaktif (klik header kolom).
   - Kartu profil komparasi dengan progress bar kontribusi.

3. **Data Kriteria (`/kriteria`)**:
   - Matriks perbandingan berpasangan 3x3 dengan visualisasi warna sel (diagonal, input preferensi, resiprokal).
   - Tabel normalisasi dan perhitungan vektor baris.
   - Parameter konsistensi ($\lambda_{\max}$, $CI$, $RI$, $CR$) dengan indikator visual hijau.
   - Skala penilaian Saaty 1–9 sebagai bahan edukasi.

4. **Proses Perhitungan AHP (`/perhitungan`)**:
   - Tab navigasi interaktif untuk 5 langkah perhitungan transparan.
   - Penjelasan rumus matematis formula LaTeX/HTML.
   - Menampilkan angka persis sesuai studi kasus Excel.

5. **Hasil & Rekomendasi (`/hasil`)**:
   - Kartu pengumuman pemenang (Suzuki Ertiga) dengan alasan objektif.
   - Grafik batang perbandingan skor akhir.
   - Grafik stacked bar komposisi kontribusi kriteria.
   - Tabel peringkat lengkap.
   - Tabel uji konsistensi seluruh 4 matriks ($CR \le 0.10$).

6. **Impor & Ekspor Data**:
   - Upload file Excel baru dengan drag-and-drop dan validasi bujur sangkar otomatis.
   - Tombol reset data untuk kembali ke file asli `AHP_Studi_Kasus_Mobil.xlsx`.
   - Ekspor laporan ke **Excel (`.xlsx`)** dan **CSV (`.csv`)**.

---

## 6. Penyelesaian Masalah (Troubleshooting)

1. **Error: `ExecutionPolicy` saat mengaktifkan venv di PowerShell**:
   Jalankan perintah ini di PowerShell sebagai Administrator:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Port 5000 Sedang Digunakan (Address already in use)**:
   Ubah port pada baris terakhir `app.py`:
   ```python
   app.run(debug=True, host="127.0.0.1", port=5001)
   ```
   Lalu akses `http://127.0.0.1:5001`.

3. **File Excel Tidak Ditemukan**:
   Pastikan file berada di `d:/Tugas AHP/data/AHP_Studi_Kasus_Mobil.xlsx`. Sistem memiliki fallback otomatis sehingga aplikasi tetap dapat berjalan secara presisi meskipun file dipindahkan.

---

## 7. Panduan Mengunggah ke GitHub & Mengaktifkan Live Demo untuk Dosen

Agar dosen Anda bisa **langsung membuka dan mencoba dashboard di browser tanpa perlu menginstal Python**, ikuti langkah mudah berikut:

### Langkah 1: Buat Repositori Baru di GitHub
1. Buka [github.com](https://github.com/) dan login ke akun Anda.
2. Klik tombol **`New`** (atau icon `+` di kanan atas &rarr; *New repository*).
3. Beri nama repositori, misalnya: `spk-ahp-pemilihan-mobil`.
4. Pilih **Public**.
5. Jangan centang "Add a README file" (karena kita sudah punya README lengkap).
6. Klik **`Create repository`**.

### Langkah 2: Unggah File ke GitHub
Anda bisa mengunggahnya menggunakan salah satu cara termudah berikut:

#### Opsi A: Menggunakan VS Code (Paling Mudah)
1. Di VS Code, buka tab **Source Control** di sidebar sebelah kiri (ikon percabangan cabang/ranting atau tekan `Ctrl + Shift + G`).
2. Klik tombol biru **"Publish to GitHub"**.
3. Pilih opsi **"Publish to GitHub public repository"**.
4. VS Code akan otomatis mengunggah seluruh file proyek (kecuali folder `venv/` yang sudah diabaikan di `.gitignore`).

#### Opsi B: Menggunakan Web Browser (Tanpa Install Git)
1. Pada halaman repositori kosong di GitHub Anda, klik link **"uploading an existing file"**.
2. Drag and drop file dan folder dari `d:\Tugas AHP` (jangan sertakan folder `venv`).
3. Klik tombol hijau **"Commit changes"**.

### Langkah 3: Aktifkan GitHub Pages (Hanya 3 Klik!)
1. Di halaman repositori GitHub Anda, klik tab **`Settings`** (ikon roda gigi di bagian atas).
2. Di menu sebelah kiri, klik **`Pages`**.
3. Pada bagian **"Build and deployment"** &rarr; **"Branch"**:
   - Pilih branch: **`main`** (atau `master`).
   - Pilih folder: ganti `/ (root)` menjadi **`/docs`**.
4. Klik tombol **`Save`**.
5. Tunggu sekitar 1–2 menit, refresh halaman Settings &rarr; Pages.
6. Anda akan melihat kotak hijau bertuliskan:  
   **"Your site is live at `https://<username-anda>.github.io/spk-ahp-pemilihan-mobil/`"**

### Langkah 4: Format Teks Pengumpulan Tugas ke Dosen
Anda dapat mengumpulkan link tugas dengan format profesional berikut:

```text
Yth. Bapak/Ibu Dosen Pengampu,

Berikut adalah pengumpulan tugas Sistem Pendukung Keputusan (SPK) Pemilihan Mobil menggunakan metode Analytical Hierarchy Process (AHP):

1. Link Live Demo Dashboard (Bisa langsung dibuka di browser):
   https://<username-anda>.github.io/spk-ahp-pemilihan-mobil/

2. Link Repositori Kode Program (Source Code GitHub):
   https://github.com/<username-anda>/spk-ahp-pemilihan-mobil

Keterangan:
- Bahasa & Framework: Python Flask, HTML5, Vanilla CSS3, Vanilla JavaScript, Chart.js.
- Sumber Data: AHP_Studi_Kasus_Mobil.xlsx (Perhitungan matematis 100% presisi dan konsisten dengan CR <= 0.10).
- Rekomendasi Utama: Suzuki Ertiga (Skor Akhir 0.4814 / 48.14%).

Terima kasih.
```

