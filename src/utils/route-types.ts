import { Router } from 'express';
import { AuthRequestHandler } from '../types/express';

/**
 * Fungsi untuk menyederhanakan penggunaan tipe pada route handlers
 * Menggunakan @ts-ignore untuk mengatasi masalah tipe Express + TypeScript
 */
export function wrapExpressHandler(handler: any): any {
  // Fungsi ini hanya untuk membantu TypeScript mengenali handler
  // Di dalam implementasi, kita hanya mengembalikan handler asli
  return handler;
}

/**
 * Fungsi ini untuk membungkus middleware agar compatible dengan tipe
 */
export function wrapMiddleware(middleware: any): any {
  return middleware;
}
