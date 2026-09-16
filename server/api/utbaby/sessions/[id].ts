import {mentorTryouts,mentorQuestions,loadMentorTryouts,loadMentorQuestions} from '../../_lib/mentorBank';
import {supabaseConfigured,supabaseRequest} from '../../_lib/supabase';
import app from '../../../../server';

function getId(req:any){return String(req.query?.id||'').split('/')[0];}

export default async function handler(req:any,res:any){
 await loadMentorQuestions();await loadMentorTryouts();
 if(req.method==='POST') return app(req,res);
 if(req.method!=='GET')return res.status(405).json({detail:'Method tidak didukung.'});
 const id=getId(req);let item=mentorTryouts.find(x=>x.id===id)||mentorTryouts[0];
 if(!item)return res.status(404).json({detail:'Belum ada Tryout mentor. Mentor harus membuat Tryout setelah bank 160 soal lengkap.'});
 if(!item.questions.length&&supabaseConfigured()){try{const rows=await supabaseRequest<any[]>(`mentor_tryouts?id=eq.${encodeURIComponent(item.id)}&select=question_ids`);const ids=Array.isArray(rows[0]?.question_ids)?rows[0].question_ids:[];item.questions=ids.map((qid:string)=>mentorQuestions.find(q=>q.id===qid)).filter(Boolean) as any;}catch(e){console.error('TRYOUT_DETAIL_LOAD_ERROR',e)}}
 return res.status(200).json(item);
}
