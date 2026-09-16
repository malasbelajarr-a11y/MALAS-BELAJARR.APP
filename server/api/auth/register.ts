import type {VercelRequest,VercelResponse} from '@vercel/node';
import {findStudent,listStudents,markAccessCodeUsed as markStudentCodeUsed,publicStudent,saveStudent} from '../_lib/studentStore';
import {codeLevel,getAccessCode,markAccessCodeUsed} from '../_lib/accessCodes';
const order=['nguli','mandor','supervisor'] as const;
function body(req:any){return typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{}}
function cookie(res:any,s:any){res.setHeader('Set-Cookie',`mls_session=${encodeURIComponent(JSON.stringify(publicStudent(s)))}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure`)}
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='POST')return res.status(405).json({detail:'Method tidak didukung.'});let b:any;try{b=body(req)}catch{return res.status(400).json({detail:'Format data tidak valid.'})}
 const session=(String(req.headers.cookie||'').match(/(?:^|;\s*)mls_session=([^;]+)/)||[])[1];let current:any=null;try{if(session)current=(await listStudents()).find(s=>s.id===JSON.parse(decodeURIComponent(session)).id)}catch{}
 const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),name=String(b.name||'').trim(),level=String(b.level||'').trim().toLowerCase(),code=String(b.access_code||b.code||'').trim().toUpperCase();
 if(!email||!password||!code||(!current&&!name))return res.status(400).json({detail:'Nama, email, password, dan kode akses wajib diisi.'});
 if(password.length<6)return res.status(400).json({detail:'Password minimal 6 karakter.'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({detail:'Format email tidak valid.'});
 const target=await getAccessCode(code);if(!target)return res.status(400).json({detail:'Kode akses tidak ditemukan.'});if(target.used)return res.status(409).json({detail:'Kode akses ini sudah pernah dipakai.'});
 if(current&&order.includes(level as any)&&order.indexOf(level as any)>order.indexOf(current.level)){if(target.level!==level)return res.status(400).json({detail:'Kode akses tidak sesuai dengan level tujuan.'});const updated=await markStudentCodeUsed(current,code,level as any);await markAccessCodeUsed(code,updated.id);cookie(res,updated);return res.status(200).json(publicStudent(updated))}
 if(await findStudent(email))return res.status(409).json({detail:'Email sudah terdaftar. Silakan login dengan password yang dibuat sebelumnya.'});if(target.level!==level)return res.status(400).json({detail:'Level pada kode akses tidak sesuai.'});
 const student=await saveStudent({name,email,level:target.level,password,accessCode:code});await markAccessCodeUsed(code,student.id);cookie(res,student);return res.status(201).json(publicStudent(student));
}
