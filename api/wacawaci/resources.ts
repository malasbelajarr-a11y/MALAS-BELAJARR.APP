import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { supabaseConfigured, supabaseRequest } from "../../server/api/_lib/supabase";
import { validMentorCode } from "../../server/api/_lib/mentorBank";

const SUBTESTS = new Set(["pu","ppu","pbm","pk","lit_indo","lit_inggris","pm"]);
const KINDS = new Set(["video","module","ringkasan","cheatsheet"]);

type Resource = {
  id: string;
  kind: string;
  title: string;
  description: string;
  url: string;
  is_public: boolean;
  created_by: string;
  level: string;
  subtest: string;
  created_at?: string;
};

function bodyOf(req: VercelRequest) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body as Record<string, unknown>;
}

function normalize(row: any): Resource | null {
  if (!row?.id || !row?.title || !row?.url) return null;

  let saved: any = null;
  if (typeof row.description === "string") {
    try { saved = JSON.parse(row.description); } catch {}
  }

  const subtest = String(row.subtest || saved?.subtest || "pu");
  const kind = String(row.kind || saved?.kind || "module");

  return {
    id: String(row.id),
    kind: KINDS.has(kind) ? kind : "module",
    title: String(row.title),
    description: String(saved?.description ?? row.description ?? ""),
    url: String(row.url),
    is_public: row.is_public !== false,
    created_by: String(row.created_by || saved?.created_by || ""),
    level: String(row.level || saved?.level || "nguli"),
    subtest: SUBTESTS.has(subtest) ? subtest : "pu",
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    if (!supabaseConfigured()) {
      return res.status(200).json([]);
    }

    try {
      const rows = await supabaseRequest<any[]>(
        "wacawaci_resources?is_public=eq.true&kind=not.in.(mentor_question,mentor_tryout,live_class)&select=id,kind,title,description,url,is_public,created_by,level,subtest,created_at&order=created_at.desc"
      );

      const resources = rows
        .map(normalize)
        .filter((x): x is Resource => Boolean(x));

      return res.status(200).json(resources);
    } catch (error) {
      console.error("WACAWACI_NEW_GET_ERROR", error);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    const body = bodyOf(req);
    const code = String(
      req.query.mentor_code || body.mentor_code || body.code || ""
    ).trim().toUpperCase();

    if (!validMentorCode(code)) {
      return res.status(401).json({ detail: "Kode mentor tidak cocok." });
    }

    const subtest = String(body.subtest || "pu");
    const kind = String(body.kind || "module");
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const url = String(body.url || body.file_url || body.video_url || "").trim();
    const level = String(body.level || "nguli");

    if (!SUBTESTS.has(subtest)) {
      return res.status(400).json({ detail: "Subtes Wacawaci tidak valid." });
    }
    if (!KINDS.has(kind)) {
      return res.status(400).json({ detail: "Jenis materi Wacawaci tidak valid." });
    }
    if (!title) return res.status(400).json({ detail: "Judul materi wajib diisi." });
    if (!url) return res.status(400).json({ detail: "Link materi wajib diisi." });

    const resource: Resource = {
      id: "waca-" + Date.now() + "-" + crypto.randomBytes(3).toString("hex"),
      kind,
      title,
      description,
      url,
      is_public: true,
      created_by: "Mentor Malas Belajar",
      level,
      subtest,
      created_at: new Date().toISOString(),
    };

    if (!supabaseConfigured()) {
      return res.status(503).json({ detail: "Database Wacawaci belum tersambung." });
    }

    try {
      await supabaseRequest("wacawaci_resources", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(resource),
      });
      return res.status(201).json(resource);
    } catch (error) {
      console.error("WACAWACI_NEW_POST_ERROR", error);
      return res.status(500).json({ detail: "Materi Wacawaci gagal disimpan." });
    }
  }

  if (req.method === "DELETE") {
    const body = bodyOf(req);
    const code = String(req.query.mentor_code || body.mentor_code || body.code || "").trim().toUpperCase();
    if (!validMentorCode(code)) {
      return res.status(401).json({ detail: "Kode mentor tidak cocok." });
    }

    const id = String(req.query.id || body.id || "").trim();
    if (!id) return res.status(400).json({ detail: "ID materi wajib diisi." });

    if (supabaseConfigured()) {
      try {
        await supabaseRequest(
          "wacawaci_resources?id=eq." + encodeURIComponent(id),
          { method: "DELETE" }
        );
      } catch (error) {
        console.error("WACAWACI_NEW_DELETE_ERROR", error);
        return res.status(500).json({ detail: "Materi gagal dihapus." });
      }
    }

    return res.status(200).json({ ok: true, id });
  }

  return res.status(405).json({ detail: "Method tidak didukung." });
}
