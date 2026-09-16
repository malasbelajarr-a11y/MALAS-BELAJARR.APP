import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../../server';

const handlers: Record<string, () => Promise<any>> = {
  'auth/register': () => import('./auth/register'),
  'auth/login': () => import('./auth/login'),
  'auth/demo': () => import('./auth/demo'),
  'auth/me': () => import('./auth/me'),
  'auth/logout': () => import('./auth/logout'),
  'auth/level': () => import('./auth/level'),
  'admin/access-codes': () => import('./admin/access-codes'),
  'admin/students': () => import('./admin/students'),
  'admin/mentor-bank': () => import('./admin/mentor-bank'),
  'admin/mentor-bank/questions': () => import('./admin/mentor-bank/questions'),
  'admin/mentor-bank/tryouts': () => import('./admin/mentor-bank/tryouts'),
  'live-classes': () => import('./live-classes'),
  'wacawaci/resources': () => import('./wacawaci/resources'),
  'utbaby/sessions': () => import('./utbaby/sessions'),
  'rodi/module': () => import('./rodi/module'),
  'mentor/verify': () => import('./mentor/verify'),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = String(req.url || '').split('?')[0].replace(/^\/api\/?/, '').replace(/\/+$/, '');
  try {
    // The legacy Express routes still back features such as feedback, motivation,
    // notifications, leaderboard and tryout submission. Keep them reachable while
    // Vercel exposes only this single catch-all Serverless Function.
    if (path.startsWith('utbaby/sessions/') && path.endsWith('/submit')) {
      return app(req as any, res as any);
    }
    if (path.startsWith('utbaby/sessions/')) {
      const mod: any = await import('./utbaby/sessions/[id]');
      const fn = mod.default || mod.handler;
      return fn(req, res);
    }
    const load = handlers[path];
    if (load) {
      const mod: any = await load();
      const fn = mod.default || mod.handler;
      if (typeof fn !== 'function') return res.status(500).json({ error: 'Route handler missing' });
      return fn(req, res);
    }
    // Fall back to the existing Express route table for endpoints that have not
    // yet needed a dedicated Vercel handler. This prevents old working UI features
    // from becoming 404s after API consolidation.
    return app(req as any, res as any);
  } catch (e) {
    console.error('API_ROUTE_ERROR', e);
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
