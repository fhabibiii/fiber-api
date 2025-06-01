import fs from 'fs';
import path from 'path';

// Buat direktori log jika belum ada
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Format waktu HH:MM:SS
const getTimeString = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
};

// Padding level untuk memastikan berada di tengah kurung siku
const padLevel = (level: string) => {
  const maxLength = 7; // Panjang maksimum "WARNING"
  const totalSpaces = maxLength - level.length;
  const leftPad = Math.floor(totalSpaces / 2);
  const rightPad = totalSpaces - leftPad;
  return ' '.repeat(leftPad) + level + ' '.repeat(rightPad);
};

// Mendapatkan tanggal untuk nama file log
const getDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
};

// Tulis ke file log
const writeToLogFile = (message: string): void => {
  const logFile = path.join(logDir, `${getDateString()}.log`);
  fs.appendFileSync(logFile, `${message}\n`);
};

export const logger = {
  info: (message: string): void => {
    const level = padLevel('INFO');
    const logMessage = `[${getTimeString()}] : [${level}] : ${message}`;
    console.log(`[${getTimeString()}] : [\x1b[34m${level}\x1b[0m] : ${message}`); // Blue color for level only
    writeToLogFile(logMessage);
  },
  
  error: (message: string, error?: any): void => {
    const level = padLevel('ERROR');
    const errorDetails = error ? ` - ${error}` : '';
    const logMessage = `[${getTimeString()}] : [${level}] : ${message}${errorDetails}`;
    console.error(`[${getTimeString()}] : [\x1b[31m${level}\x1b[0m] : ${message}${errorDetails}`); // Red color for level only
    writeToLogFile(logMessage);
  },
  
  warn: (message: string): void => {
    const level = padLevel('WARN');
    const logMessage = `[${getTimeString()}] : [${level}] : ${message}`;
    console.warn(`[${getTimeString()}] : [\x1b[33m${level}\x1b[0m] : ${message}`); // Yellow color for level only
    writeToLogFile(logMessage);
  },
  
  // Fungsi request dihapus, gunakan info saja
  // debug juga dihapus
  
  logRequest: (method: string, path: string, ip: string): void => {
    const level = padLevel('INFO');
    const message = `${method} ${path} from ${ip}`;
    const logMessage = `[${getTimeString()}] : [${level}] : ${message}`;
    console.log(`[${getTimeString()}] : [\x1b[34m${level}\x1b[0m] : ${message}`);
    writeToLogFile(logMessage);
  }
};

export default logger;
