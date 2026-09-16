import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../server/api/router';
export default function api(req: VercelRequest, res: VercelResponse) { return handler(req, res); }
