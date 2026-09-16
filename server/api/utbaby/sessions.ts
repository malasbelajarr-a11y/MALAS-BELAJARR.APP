import {mentorTryouts,validMentorCode,createTryout,loadMentorTryouts,loadMentorQuestions} from '../_lib/mentorBank';
export default async function handler(req:any,res:any){
 await loadMentorQuestions();await loadMentorTryouts();
 if(req.method==='GET')return res.status(200).json(mentorTryouts.map(({questions,...summary})=>summary));
 if(req.method==='POST'){
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{};
  if(!validMentorCode(body.mentor_code))return res.status(403).json({detail:'Kode mentor tidak valid.'});
  try{const t=createTryout(body);mentorTryouts.unshift(t);return res.status(201).json(t)}catch(e:any){return res.status(400).json({detail:e.message})}
 }
 return res.status(405).json({detail:'Method tidak didukung.'});
}
