// In production (Vercel): defaults to '' so requests use relative URLs proxied by vercel.json → Railway
// In local dev: set VITE_API_URL=http://localhost:5000 in .env
export const API_URL = import.meta.env.VITE_API_URL ?? '';
