import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../../server/api/wacawaci/resources";

export default function wacawaciResources(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
