# FiberNode Affiliate API

Backend API untuk sistem afiliasi FiberNode dibangun dengan Node.js, Express, dan Prisma.

## Prasyarat

- Node.js (v16 atau lebih baru)
- npm (v8 atau lebih baru)
- PM2 (untuk production)
- Git
- Database (sesuai konfigurasi Prisma)

## Instalasi

1. Clone repository:
   ```bash
   git clone https://github.com/fhabibiii/fiber-api.git
   cd fiber-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env` di root direktori dan isi dengan konfigurasi yang diperlukan:
   ```env
   # Port aplikasi
   PORT=3001
   
   # Database (sesuaikan dengan konfigurasi Anda)
   DATABASE_URL="postgresql://user:password@localhost:5432/fibernode_db?schema=public"
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Konfigurasi lainnya sesuai kebutuhan
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Jalankan migrasi database:
   ```bash
   npx prisma migrate deploy
   ```

## Pengembangan

Jalankan server pengembangan:
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3001` (atau port yang dikonfigurasi di `.env`).

## Produksi dengan PM2

1. Install PM2 secara global (jika belum terinstall):
   ```bash
   npm install -g pm2
   ```

2. Build aplikasi:
   ```bash
   npm run build
   ```

3. Buat file konfigurasi PM2 (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'fibernode-api',
       script: './dist/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       }
     }]
   };
   ```

4. Mulai aplikasi dengan PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

5. Simpan konfigurasi PM2 agar bisa dijalankan ulang saat restart:
   ```bash
   pm2 save
   pm2 startup
   ```

6. Aktifkan PM2 untuk berjalan saat startup:
   ```bash
   pm2 startup
   ```
   Ikuti perintah yang muncul untuk mengaktifkan startup script.

## Perintah PM2 yang Berguna

- Melihat daftar aplikasi: `pm2 list`
- Melihat log: `pm2 logs fibernode-api`
- Memantau resource: `pm2 monit`
- Restart aplikasi: `pm2 restart fibernode-api`
- Stop aplikasi: `pm2 stop fibernode-api`
- Hapus dari daftar PM2: `pm2 delete fibernode-api`

## Migrasi Database

Untuk menjalankan migrasi terbaru:
```bash
npx prisma migrate deploy
```

## Environment Variables

Pastikan untuk mengatur variabel lingkungan yang diperlukan di file `.env`:

- `PORT`: Port yang digunakan oleh aplikasi (default: 3001)
- `DATABASE_URL`: URL koneksi database
- `JWT_SECRET`: Secret key untuk JWT
- Variabel lain yang diperlukan oleh aplikasi

## Dukungan

Jika menemui masalah, silakan buat issue di repository ini.
