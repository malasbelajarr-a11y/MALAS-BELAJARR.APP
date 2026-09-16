import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findStudent, publicStudent } from '../_lib/studentStore';

type Level = 'nguli' | 'mandor' | 'supervisor';

const DEMOS: Record<Level, { email: string; name: string }> = {
  nguli: { email: 'siswa@malasbelajar.id', name: 'Pejuang SNBT 2026' },
  mandor: { email: 'siti@malasbelajar.id', name: 'Siti Rahma' },
  supervisor: { email: 'budi@malasbelajar.id', name: 'Budi Santoso' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method tidak didukung.' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const level = String(body.level || '').trim().toLowerCase() as Level;
  const demo = DEMOS[level];
  if (!demo) return res.status(400).json({ detail: 'Level demo tidak valid.' });
  const student = await findStudent(demo.email);
  if (!student) return res.status(404).json({ detail: 'Akun demo belum tersedia.' });
  if (!student.active) return res.status(403).json({ detail: 'Akun demo sedang dinonaktifkan.' });
  res.setHeader('Set-Cookie', `mls_session=${encodeURIComponent(JSON.stringify(publicStudent(student)))}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure`);
  return res.status(200).json(publicStudent(student));
}
