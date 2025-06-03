# Fiber API

API untuk sistem Fibernode Affiliate yang dibangun dengan Node.js, Express, dan TypeScript.

## Prasyarat

- Node.js (versi 18 atau lebih baru)
- npm (biasanya sudah termasuk dengan Node.js)
- Git
- PM2 (akan diinstal nanti)

## Instalasi

### 1. Clone Repository

Buka Command Prompt atau PowerShell, lalu jalankan perintah berikut:

```bash
git clone https://github.com/fhabibiii/fiber-api.git
cd fiber-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

1. Buat file baru bernama `.env` di direktori root proyek
2. Salin isi dari file `.env.example` (jika ada) ke dalam file `.env`
3. Sesuaikan konfigurasi sesuai kebutuhan, contoh:

```env
# Port yang akan digunakan (default: 3001)
PORT=3001

# Konfigurasi Database
DATABASE_URL="mysql://user:password@localhost:3306/db_name"

# JWT Secret Key
JWT_SECRET=your_jwt_secret_key_here

# Konfigurasi lainnya (sesuaikan dengan kebutuhan)
```

### 4. Build Project

```bash
# Build project TypeScript ke JavaScript
npm run build
```

## Menjalankan Aplikasi

### Mode Development

```bash
# Jalankan dalam mode development dengan hot-reload
npm run dev
```

### Mode Produksi

1. Pastikan sudah melakukan build terlebih dahulu
2. Jalankan aplikasi:

```bash
# Jalankan aplikasi yang sudah di-build
npm start
```

## Menggunakan PM2

### 1. Install PM2 Secara Global

```bash
npm install -g pm2
```

### 2. Menjalankan Aplikasi dengan PM2

```bash
# Jalankan aplikasi
pm2 start dist/index.js --name "fiber-api"

# Atau gunakan konfigurasi dari ecosystem.config.js
pm2 start ecosystem.config.js
```

### 3. Perintah Dasar PM2

```bash
# Melihat daftar aplikasi yang berjalan
pm2 list

# Menghentikan aplikasi
pm2 stop fiber-api

# Me-restart aplikasi
pm2 restart fiber-api

# Menghapus aplikasi dari daftar PM2
pm2 delete fiber-api

# Melihat log aplikasi
pm2 logs fiber-api

# Memantau resource yang digunakan
pm2 monit
```

### 4. Menyimpan Konfigurasi PM2

Setelah mengatur aplikasi dengan PM2, simpan konfigurasi saat ini:

```bash
pm2 save
```

## Auto Start saat Windows Boot

### 1. Install PM2 Windows Startup

```bash
npm install -g pm2-windows-startup
pm2-startup install
```

### 2. Simpan Konfigurasi Saat Ini

Pastikan aplikasi sudah berjalan dengan PM2, lalu simpan konfigurasi:

```bash
pm2 save
```

### 3. Verifikasi Startup

Restart komputer Anda, lalu periksa apakah aplikasi berjalan otomatis:

```bash
pm2 list
```

## Troubleshooting

### Jika Aplikasi Tidak Berjalan Otomatis

1. Pastikan PM2 sudah diinstal sebagai layanan Windows:
   ```
   npm install -g pm2-windows-service
   ```

2. Instal PM2 sebagai layanan:
   ```
   pm2-service-install -n PM2
   ```

3. Setel PM2 untuk autostart:
   ```
   pm2 save
   pm2-startup install
   ```

### Jika Port Sudah Digunakan

Jika mendapatkan error port sudah digunakan:

1. Cari proses yang menggunakan port tersebut:
   ```
   netstat -ano | findstr :3001
   ```

2. Hentikan proses tersebut (ganti <PID> dengan nomor proses):
   ```
   taskkill /PID <PID> /F
   ```

## Dukungan

Jika menemui masalah atau memiliki pertanyaan, silakan buat issue baru di [GitHub Repository](https://github.com/fhabibiii/fiber-api/issues).
