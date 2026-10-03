const $=s=>document.querySelector(s),g=p=>db.ref(p).once('value').then(s=>s.val()),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),rid=()=>'x'+Math.random().toString(36).slice(2,9),M=h=>$('#m').innerHTML=h,V=id=>$('#'+id).value.trim();
const back=(h,t='رجوع')=>`<button class="btn btn-outline btn-sm" onclick="GO='${h}'">← ${t}</button>`;
const dur=x=>x==null?'-':Math.floor(x/60)+' د '+(x%60)+' ث';
const ord=o=>Object.entries(o||{}).sort((a,b)=>(a[1].order||0)-(b[1].order||0));
const FILE={home:'home',courses:'courses',cform:'course-form',course:'course',lform:'lesson-form',lec:'lecture',exam:'exam',gen:'generate',codes:'codes',att:'attendance',stu:'student',stc:'student-course',stx:'student-exam',perf:'performance',grade:'grading'};
function go(r){const p=String(r).split('/'),v=p.shift();location.href=FILE[v]+'.html'+(p.length?'?p='+p.map(encodeURIComponent).join(','):'')}
Object.defineProperty(window,'GO',{set:go});
const NAV=[['home','الرئيسية','mosque',['home']],['courses','الكورسات','bookOpen',['courses','cform','course','lform','lec','exam']],['gen','توليد أكواد','key',['gen']],['codes','الأكواد','users',['codes','stu','stc','stx']],['att','الحضور والغياب','calendar',['att']],['perf','الأداء','chartSimple',['perf']],['grade','التصحيح','pen',['grade']]];
function header(v){const dark=document.documentElement.getAttribute('data-theme')==='dark';
 $('#appHeader').innerHTML='<a class="sb-brand" href="home.html"><span class="sb-mark">'+(window.brandLogo?brandLogo(42):'')+'</span><div><b>د.علاء صبح</b><small>لوحة تحكم المسئول</small></div></a><nav class="sb-nav">'+NAV.map(n=>`<a href="${FILE[n[0]]}.html" class="${n[3].includes(v)?'active':''}">${icon(n[2],'icon-sm')}<span>${n[1]}</span></a>`).join('')+'</nav><div class="sb-foot"><button class="sb-btn" id="themeBtn" title="الوضع">'+icon(dark?'sun':'moon','icon-md')+'</button><button class="sb-btn" id="outBtn" title="خروج">'+icon('logout','icon-md')+'</button></div>';
 {const a=document.querySelector('.sb-nav a.active');if(a)setTimeout(()=>a.scrollIntoView({inline:'center',block:'nearest'}),50)}
 $('#themeBtn').onclick=()=>{const n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';localStorage.setItem('asb_theme',n);document.documentElement.setAttribute('data-theme',n);header(v)};
 $('#outBtn').onclick=()=>{sessionStorage.removeItem('adm');localStorage.removeItem('adm_ok');location.href='index.html'}}
async function route(){
 if(!sessionStorage.adm&&localStorage.adm_ok==='1')sessionStorage.adm='1';if(!sessionStorage.adm)return location.replace('index.html');
 const v=PAGE,[a,b,c,d]=(new URLSearchParams(location.search).get('p')||'').split(',').map(decodeURIComponent);header(v);
 M('<p class="muted" style="text-align:center;padding:40px">جاري التحميل...</p>');
 try{await Promise.race([V_[v](a,b,c,d),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),15000))])}catch(e){showErr(e)}
}
function errText(e){const m=String((e&&(e.code||e.message))||e);
 if(/permission/i.test(m))return 'قواعد Firebase بترفض القراءة والكتابة. افتح Firebase Console ← Realtime Database ← Rules، والصق محتوى ملف student/firebase-rules.json واضغط Publish، وبعدها حدّث الصفحة.';
 if(/firebase is not defined|db is not defined/i.test(m))return 'ملفات Firebase مش بتتحمل. تأكد إن الإنترنت شغال وإن المتصفح مش حاجب gstatic.com.';
 return 'تعذر الاتصال بقاعدة البيانات، تأكد من الإنترنت وحاول تاني. ('+m+')'}
function showErr(e){console.error(e);M('<div class="box"><h3>تعذر تحميل البيانات</h3><p>'+esc(errText(e))+'</p><button class="btn btn-primary btn-sm" onclick="location.reload()">إعادة المحاولة</button></div>')}
window.addEventListener('unhandledrejection',e=>{if(/permission/i.test(String(e.reason&&(e.reason.code||e.reason.message))))alert(errText(e.reason))});
const V_={
async home(){return PG.home()},
async courses(){return PG.courses()},
async cform(id){const C=id?await g('competitions/'+id):{},Z0=await g('centers')||{},Z=Object.fromEntries(Object.entries(Z0).filter(([k])=>k.length===4)),sel=Object.values(C.centers||{});
 M(`<div class="box"><h3>${id?'تعديل الكورس':'كورس جديد'}</h3><input type="text" id="t" placeholder="اسم الكورس" value="${esc(C.title)}"><textarea id="d" rows="3" placeholder="نبذة (اختياري)">${esc(C.description)}</textarea><input type="text" id="i" placeholder="رابط صورة (اختياري)" value="${esc(C.image)}"><input type="text" id="n" placeholder="اسم المعلم" value="${esc(C.instructorName||'علاء صبح')}">
 <p class="muted">السناتر التي يظهر فيها الكورس (بدون اختيار = كل السناتر):</p>${Object.entries(Z).map(([p,n])=>`<label style="display:block"><input type="checkbox" class="cc" value="${p}" ${sel.includes(p)?'checked':''}> ${esc(n)}</label>`).join('')}
 <button class="btn btn-primary btn-sm" onclick="saveCourse('${id||''}')">${id?'حفظ':'إنشاء'}</button> ${back(id?'course/'+id:'courses','إلغاء')}</div>`)},
async course(id){const C=await g('competitions/'+id);if(!C)return GO='courses';
 M(`<div class="box"><div class="row"><h3>${esc(C.title)}</h3><div class="acts"><button class="btn btn-outline btn-sm" onclick="GO='cform/${id}'">تعديل الكورس</button><button class="btn btn-outline btn-sm" onclick="delCourse('${id}')">حذف الكورس</button><button class="btn btn-primary btn-sm" onclick="GO='lform/${id}'">+ إضافة محاضرة</button></div></div>${back('courses')}
 <p class="muted">اسحب ⠿ لترتيب المحاضرات</p><div id="ls">${ord(C.lessons).map(([l,x])=>`<div class="row" draggable="true" data-id="${l}"><span><span class="drag">⠿</span> ${esc(x.title)}</span><div class="acts"><button class="btn btn-outline btn-sm" onclick="GO='lec/${id}/${l}'">فتح</button><button class="btn btn-outline btn-sm" onclick="GO='lform/${id}/${l}'">تعديل</button><button class="btn btn-outline btn-sm" onclick="del('competitions/${id}/lessons/${l}')">حذف</button></div></div>`).join('')}</div></div>`);
 dragSort('#ls',ids=>{const u={};ids.forEach((l,i)=>u[`competitions/${id}/lessons/${l}/order`]=i+1);db.ref().update(u)})},
async lform(c,l){const x=l?await g(`competitions/${c}/lessons/${l}`):{};M(`<div class="box"><h3>${l?'تعديل المحاضرة':'محاضرة جديدة'}</h3><input type="text" id="t" placeholder="اسم المحاضرة" value="${esc(x.title)}"><button class="btn btn-primary btn-sm" onclick="saveLesson('${c}','${l||''}')">${l?'حفظ':'إضافة'}</button> ${back('course/'+c,'إلغاء')}</div>`)},
async lec(c,l){const x=await g(`competitions/${c}/lessons/${l}`)||{},S=x.sections||{},base=`competitions/${c}/lessons/${l}`;
 const SO=Object.entries(S).sort((a,b)=>(a[1].order||0)-(b[1].order||0));
 const so=SO.map(([k,s])=>`<option value="${k}">${esc(s.title)}</option>`).join('');
 const grp=(sid,name)=>{const it=[];[['videos','▶️'],['pdfs','📄'],['exams','📝']].forEach(([t,ic])=>Object.entries(x[t]||{}).forEach(([k,v])=>{if((v.sectionId||'')===sid)it.push({t,k,v,ic})}));it.sort((a,b)=>(a.v.order||0)-(b.v.order||0));
  return `<div class="box"><h3>${esc(name)}</h3>`+it.map((o,i)=>{const P=it[i-1],N=it[i+1];return `<div class="row"><span>${o.ic} ${esc(o.v.title)}${o.t==='exams'?` <span class="chip">${o.v.mustPass?'إجباري':'اختياري'}</span>`:''}</span><div class="acts"><button class="btn btn-outline btn-sm" ${P?`onclick="swp('${base}','${P.t}','${P.k}','${o.t}','${o.k}')"`:'disabled'}>▲</button><button class="btn btn-outline btn-sm" ${N?`onclick="swp('${base}','${o.t}','${o.k}','${N.t}','${N.k}')"`:'disabled'}>▼</button>${o.t==='exams'?`<button class="btn btn-outline btn-sm" onclick="GO='exam/${c}/${l}/${o.k}'">تعديل</button>`:''}<button class="btn btn-outline btn-sm" onclick="del('${base}/${o.t}/${o.k}')">حذف</button></div></div>`}).join('')+`</div>`};
 M(`${back('course/'+c)}<h2>${esc(x.title)}</h2>
 <div class="box"><h3>الأقسام</h3>${SO.map(([k,s])=>`<div class="row"><span>${esc(s.title)}</span><button class="btn btn-outline btn-sm" onclick="del('${base}/sections/${k}')">حذف</button></div>`).join('')}<input type="text" id="sn" placeholder="اسم قسم (شرح / حل / واجب...)"><button class="btn btn-primary btn-sm" onclick="addSection('${base}')">+ قسم</button></div>
 <p class="muted">الترتيب هنا هو نفس ترتيب ظهور المحتوى للطالب، والاختبار الإجباري بيقفل كل اللي بعده. استخدم ▲ ▼ للترتيب.</p>
 ${grp('','بدون قسم')}${SO.map(([k,s])=>grp(k,s.title)).join('')}
 <div class="box"><h3>إضافة فيديوهات</h3><label class="muted">القسم</label><select id="vs"><option value="">بدون قسم</option>${so}</select><div id="vr"></div><button class="btn btn-outline btn-sm" onclick="vrow()">+ فيديو آخر</button> <button class="btn btn-primary btn-sm" onclick="saveVideos('${base}')">حفظ الفيديوهات</button></div>
 <div class="box"><h3>ملف PDF (رابط)</h3><select id="ps"><option value="">بدون قسم</option>${so}</select><input type="text" id="pt" placeholder="اسم الملف"><input type="text" id="pu" placeholder="الرابط"><button class="btn btn-primary btn-sm" onclick="addPdf('${base}')">إضافة</button></div>
 <div class="box"><h3>اختبار جديد</h3><button class="btn btn-primary btn-sm" onclick="GO='exam/${c}/${l}'">+ إضافة اختبار</button></div>`);vrow()},
async exam(c,l,e){const base=`competitions/${c}/lessons/${l}`,S=await g(base+'/sections')||{},x=e?await g(`${base}/exams/${e}`):{};window.Q=Object.values(x.questions||{});if(!Q.length)Q.push({text:'',options:['','','',''],correct:0,points:1});
 window.EX={c,l,e,S,order:x.order};M(`<div class="box"><h3>${e?'تعديل اختبار':'اختبار جديد'}</h3><input type="text" id="et" placeholder="عنوان الاختبار" value="${esc(x.title)}"><div class="grid"><input type="number" id="ed" placeholder="المدة بالدقائق" value="${x.duration||10}"><select id="es"><option value="">بدون قسم</option>${Object.entries(S).map(([k,s])=>`<option value="${k}" ${x.sectionId===k?'selected':''}>${esc(s.title)}</option>`).join('')}</select></div>
 <label><input type="checkbox" id="em" ${x.mustPass?'checked':''}> إجباري (يقفل كل المحتوى بعده حتى يُحل)</label><div id="qs"></div><button class="btn btn-outline btn-sm" onclick="addQ('mcq')">+ سؤال اختيار</button> <button class="btn btn-outline btn-sm" onclick="addQ('essay')">+ سؤال مقالي</button> <button class="btn btn-primary btn-sm" onclick="saveExam()">حفظ الاختبار</button> ${back('lec/'+c+'/'+l,'إلغاء')}</div>`);drawQ()}
,async gen(){const Z=await g('centers')||{};M(`<div class="box"><div class="row"><h3>توليد أكواد</h3><button class="btn btn-primary btn-sm" onclick="genModal()">توليد</button></div>${back('home')}<p class="muted">السناتر (كل سنتر له كود ثابت من 4 أرقام، والكود الكامل 12 رقم)</p>${Object.entries(Z).filter(([p])=>p.length===4).map(([p,n])=>`<div class="row"><span><b>${p}</b> — ${esc(n)}</span><button class="btn btn-outline btn-sm" onclick="delCenter('${p}')">حذف</button></div>`).join('')||'<p class="muted">أضف سنتر أولاً</p>'}<input type="text" id="cn" placeholder="اسم سنتر جديد"><button class="btn btn-outline btn-sm" onclick="addCenter()">+ إضافة سنتر</button></div>`)},
async codes(a,b){const t=a||'unused',[K,U,Z]=await Promise.all([g('codes'),g('users'),g('centers')]);const used=Object.keys(K||{}).filter(k=>U&&U[k]&&U[k].name),un=Object.keys(K||{}).filter(k=>!used.includes(k)).sort(),cf=b||'',cn=p=>(Z||{})[p]||'سنتر غير معروف';
 const list=(t=='used'?used:un.filter(k=>!cf||k.slice(0,4)===cf)),cs=[...new Set(un.map(k=>k.slice(0,4)))];
 M(`<div class="box"><h3>الأكواد</h3>${back('home')}<div class="tabs" style="margin-top:10px"><button class="btn ${t=='used'?'btn-primary':'btn-outline'}" onclick="GO='codes/used'">مستخدمة (${used.length})</button><button class="btn ${t=='unused'?'btn-primary':'btn-outline'}" onclick="GO='codes/unused'">غير مستخدمة (${un.length})</button></div>
 ${t=='unused'&&un.length?`<div class="row" style="gap:8px;flex-wrap:wrap"><select id="cfs" onchange="GO='codes/unused/'+this.value" style="max-width:240px"><option value="">كل السناتر</option>${cs.map(p=>`<option value="${p}" ${p===cf?'selected':''}>${esc(cn(p))} — ${p}</option>`).join('')}</select><div class="acts"><button class="btn btn-primary btn-sm" onclick="printUnused()">🖨 طباعة (${list.length})</button><button class="btn btn-outline btn-sm dang" onclick="delUnused()">🗑 مسح الكل (${list.length})</button></div></div>`:''}
 ${list.map(k=>{const u=(U||{})[k]||{};return `<div class="row"><span><b>${k}</b> ${t=='used'?'— '+esc(u.name)+(u.blocked?' <span class="chip bad">محظور'+({absence:' — غياب متواصل',payment:' — عدم دفع','absence+payment':' — غياب ودفع'}[u.blockReason]||'')+'</span>':''):'<span class="muted">— '+esc(cn(k.slice(0,4)))+'</span>'}</span><div class="acts">${t=='used'?`<button class="btn btn-outline btn-sm" onclick="GO='stu/${k}'">التفاصيل</button>`:`<button class="btn btn-outline btn-sm" onclick="delCode('${k}')">حذف</button>`}</div></div>`}).join('')||'<p class="muted">لا يوجد</p>'}</div>`);
 window.UNUSED={list,Z:Z||{},cf}},
async stu(k){let [u,P,C]=await Promise.all([g('users/'+k),g('userProgress/'+k),g('competitions')]);u=u||{};const ids=Object.keys(P||{});
 M(`<div class="box"><h3>${esc(u.name)}</h3>${back('codes/used')}<p>الكود: <b>${k}</b> | السنتر: ${esc(u.centerName)}<br>الهاتف: ${esc(u.phone)} | ولي الأمر: ${esc(u.parentPhone)}</p>
 <div class="acts"><button class="btn ${u.blocked?'btn-primary':'btn-outline'} btn-sm" onclick="block('${k}',${!u.blocked})">${u.blocked?'فك الحظر':'حظر من المنصة'}</button><button class="btn btn-outline btn-sm" onclick="delCode('${k}',1)">مسح الكود</button></div></div>
 <div class="box"><h3>الكورسات</h3>${ids.map(i=>`<div class="row"><span>${esc(C&&C[i]?C[i].title:i)}</span><button class="btn btn-outline btn-sm" onclick="GO='stc/${k}/${i}'">دخول</button></div>`).join('')||'<p class="muted">لم يدخل كورسات</p>'}</div>`)},
async stc(k,c){let [C,P]=await Promise.all([g('competitions/'+c),g(`userProgress/${k}/${c}`)]);P=P||{};
 M(`${back('stu/'+k)}<div class="box"><h3>${esc(C.title)}</h3>${ord(C.lessons).map(([l,x])=>{const p=P[l]||{},vs=Object.keys(x.videos||{}),w=vs.filter(v=>p.videos&&p.videos[v]&&p.videos[v].watched).length;
 const ex=Object.entries(x.exams||{}).map(([e,q])=>{const r=(p.exams||{})[e];return r&&r.completed?`<div class="muted">📝 ${esc(q.title)}: صح ${r.score}/${r.totalQuestions} — غلط ${r.totalQuestions-r.score}${r.essayMax?' — المقالي: '+(r.essayStatus=='graded'?(r.essayScore||0)+'/'+r.essayMax:'جاري التصحيح'):''} — مدة الحل: ${dur(r.timeSpentSec)} — تاريخ الحل: ${r.answeredAt?new Date(r.answeredAt).toLocaleString('ar-EG'):'-'}</div>`:`<div class="muted">📝 ${esc(q.title)}: لم يُحل</div>`}).join('');
 return `<details class="row" style="display:block"><summary><b>${esc(x.title)}</b></summary><div class="muted">▶️ شاهد ${w} من ${vs.length} فيديو</div>${ex}</details>`}).join('')}</div>`)},
async perf(){return PG.perf()},
async grade(k,c,l,e){if(k)return gradeOne(k,c,l,e);const S=await g('essaySubmissions')||{},L=[];
 Object.entries(S).forEach(([c,a])=>Object.entries(a).forEach(([l,b])=>Object.entries(b).forEach(([e,d])=>Object.entries(d).forEach(([k,s])=>{if(s.status==='pending')L.push({k,c,l,e,t:s.submittedAt||0,n:s.name||k})}))));L.sort((a,b)=>a.t-b.t);
 M(`<div class="box"><h3>تصحيح المقال</h3>${back('home')}${L.map(x=>`<div class="row"><span>${esc(x.n)} <span class="muted">${new Date(x.t).toLocaleString('ar-EG')}</span></span><button class="btn btn-primary btn-sm" onclick="GO='grade/${x.k}/${x.c}/${x.l}/${x.e}'">مراجعة</button></div>`).join('')||'<p class="muted">لا توجد إجابات بانتظار التصحيح</p>'}</div>`)}
};
Object.assign(V_,PG.views);
async function gradeOne(k,c,l,e){const [s,ex]=await Promise.all([g(`essaySubmissions/${c}/${l}/${e}/${k}`),g(`competitions/${c}/lessons/${l}/exams/${e}`)]);window.G={k,c,l,e,qs:[]};
 const qs=Object.entries(ex.questions||{}).filter(([id,q])=>q.type==='essay');G.qs=qs;
 M(`<div class="box"><h3>${esc(s.name||k)} — ${esc(ex.title)}</h3>${back('grade')}${qs.map(([id,q],i)=>{const mx=q.points||2,st=[];for(let v=0;v<=mx;v+=.5)st.push(v);return `<div class="box"><b>${esc(q.text)}</b><p style="white-space:pre-wrap">${esc((s.answers||{})[id]||'— لا توجد إجابة —')}</p><select id="g${i}">${st.map(v=>`<option>${v}</option>`).join('')}</select> <span class="muted">من ${mx}</span></div>`}).join('')}<button class="btn btn-primary btn-sm" onclick="sendGrade()">إرسال التصحيح</button></div>`)}
async function sendGrade(){let tot=0;G.qs.forEach((q,i)=>tot+=+$('#g'+i).value);const {k,c,l,e}=G;await db.ref().update({[`essaySubmissions/${c}/${l}/${e}/${k}/status`]:'graded',[`essaySubmissions/${c}/${l}/${e}/${k}/score`]:tot,[`userProgress/${k}/${c}/${l}/exams/${e}/essayScore`]:tot,[`userProgress/${k}/${c}/${l}/exams/${e}/essayStatus`]:'graded'});GO='grade'}
function dragSort(sel,cb){const box=$(sel);let d;box.querySelectorAll('[draggable]').forEach(r=>{r.ondragstart=()=>d=r;r.ondragover=e=>{e.preventDefault();r.classList.add('over')};r.ondragleave=()=>r.classList.remove('over');r.ondrop=e=>{e.preventDefault();r.classList.remove('over');if(d&&d!==r){box.insertBefore(d,r);cb([...box.children].map(x=>x.dataset.id))}}})}
async function del(p){if(confirm('تأكيد الحذف؟')){await db.ref(p).remove();route()}}
async function saveCourse(id){const t=V('t');if(!t)return alert('اكتب اسم الكورس');const o={type:'course',title:t,description:V('d'),image:V('i'),coverUrl:V('i'),instructorName:V('n')||'علاء صبح',centers:[...document.querySelectorAll('.cc:checked')].map(x=>x.value)};if(id){await db.ref('competitions/'+id).update(o);GO='course/'+id}else{id=rid();o.createdAt=Date.now();await db.ref('competitions/'+id).set(o);GO='course/'+id}}
async function saveLesson(c,l,open){const t=V('t');if(!t)return alert('اكتب اسم المحاضرة');
 if(l){await db.ref(`competitions/${c}/lessons/${l}/title`).set(t);GO='course/'+c;return}
 const L=await g(`competitions/${c}/lessons`)||{},k=rid(),mx=Math.max(0,...Object.values(L).map(z=>z.order||0));
 await db.ref(`competitions/${c}/lessons/${k}`).set({title:t,order:mx+1});GO=open?`lec/${c}/${k}`:'course/'+c}
function addSection(b){const t=V('sn');if(t)db.ref(b+'/sections/'+rid()).set({title:t,order:Date.now()}).then(route)}
function vrow(){$('#vr').insertAdjacentHTML('beforeend','<div class="grid vrw"><input type="text" placeholder="عنوان الفيديو"><input type="text" placeholder="رابط الفيديو"></div>')}
async function saveVideos(b){const u={},s=V('vs');let n=Date.now();document.querySelectorAll('.vrw').forEach(r=>{const [t,l]=r.querySelectorAll('input');if(t.value.trim()&&l.value.trim())u[`${b}/videos/${rid()}`]={title:t.value.trim(),url:l.value.trim(),sectionId:s,order:n++}});if(!Object.keys(u).length)return alert('اكتب عنوان ورابط');await db.ref().update(u);route()}
function addPdf(b){if(!V('pt')||!V('pu'))return;db.ref(b+'/pdfs/'+rid()).set({title:V('pt'),url:V('pu'),sectionId:V('ps'),order:Date.now()}).then(route)}
function drawQ(){const LT=['أ','ب','ج','د','هـ','و','ز','ح'];
 $('#qs').innerHTML=Q.map((q,i)=>{const es=q.type==='essay';
  return `<div class="box pg-q"><div class="pg-qh"><span class="pg-n">${i+1}</span><span class="chip ${es?'warn':''}">${es?'مقالي — يُصحح يدويًا':'اختيار من متعدد'}</span><div class="acts" style="margin-inline-start:auto"><button class="btn btn-outline btn-sm" title="لأعلى" ${i?'':'disabled'} onclick="mvQ(${i},-1)">▲</button><button class="btn btn-outline btn-sm" title="لأسفل" ${i<Q.length-1?'':'disabled'} onclick="mvQ(${i},1)">▼</button><button class="btn btn-outline btn-sm" onclick="dupQ(${i})">نسخ</button><button class="btn btn-outline btn-sm dang" onclick="delQ(${i})">${icon('trash','icon-sm')}</button></div></div>
  <textarea rows="2" placeholder="نص السؤال" oninput="Q[${i}].text=this.value;PG.qsum()">${esc(q.text)}</textarea>
  ${es?'':`<p class="muted" style="margin:2px 0 6px">اختار الدائرة جنب الإجابة الصحيحة</p>`+q.options.map((o,j)=>`<div class="pg-opt ${q.correct===j?'on':''}"><input type="radio" name="r${i}" ${q.correct===j?'checked':''} onchange="Q[${i}].correct=${j};drawQ()"><span class="pg-let">${LT[j]||j+1}</span><input type="text" value="${esc(o)}" placeholder="إجابة ${j+1}" oninput="Q[${i}].options[${j}]=this.value"><button class="btn btn-outline btn-sm dang" title="حذف الإجابة" ${q.options.length>2?'':'disabled'} onclick="rmOpt(${i},${j})">✕</button></div>`).join('')+(q.options.length<8?`<button class="btn btn-outline btn-sm" onclick="Q[${i}].options.push('');drawQ()">+ إجابة</button>`:'')}
  <div class="pg-qf2"><label class="muted">الدرجة</label><input type="number" step="0.5" min="0" value="${q.points}" oninput="Q[${i}].points=+this.value;PG.qsum()"></div></div>`}).join('');PG.qsum()}
function addQ(t){Q.push(PG.newQ(t));drawQ();const b=document.querySelectorAll('#qs .pg-q');if(b.length)b[b.length-1].scrollIntoView({behavior:'smooth',block:'center'})}
function delQ(i){if(Q.length>1&&!confirm('حذف السؤال '+(i+1)+'؟'))return;Q.splice(i,1);if(!Q.length)Q.push(PG.newQ('mcq'));drawQ()}
function dupQ(i){const q=JSON.parse(JSON.stringify(Q[i]));delete q._id;Q.splice(i+1,0,q);drawQ()}
function mvQ(i,d){const j=i+d;if(j<0||j>=Q.length)return;[Q[i],Q[j]]=[Q[j],Q[i]];drawQ()}
function rmOpt(i,j){const q=Q[i];if(q.options.length<=2)return;q.options.splice(j,1);if(q.correct===j)q.correct=0;else if(q.correct>j)q.correct--;drawQ()}
async function saveExam(){const {c,l,e}=EX,t=V('et');if(!t)return alert('اكتب عنوان الاختبار');
 const qs={};let n=0,err='';
 Q.forEach((q,i)=>{if(err||!q.text.trim())return;
  const o={text:q.text.trim(),points:+q.points>0?+q.points:(q.type==='essay'?2:1),order:++n};
  if(q.type==='essay')o.type='essay';
  else{const map={},opts=[];q.options.forEach((x,j)=>{if(x.trim()){map[j]=opts.length;opts.push(x.trim())}});
   if(opts.length<2){err='سؤال '+(i+1)+': لازم إجابتين على الأقل';return}
   if(map[q.correct]==null){err='سؤال '+(i+1)+': اختار الإجابة الصحيحة وتأكد إنها مش فاضية';return}
   o.options=opts;o.correct=map[q.correct]}
  qs[q._id||rid()]=o});
 if(err)return alert(err);if(!n)return alert('أضف سؤالًا واحدًا على الأقل');
 await db.ref(`competitions/${c}/lessons/${l}/exams/${e||rid()}`).update({title:t,duration:+V('ed')||10,mustPass:$('#em').checked,sectionId:V('es'),order:EX.order||Date.now(),questionCount:n,questions:qs});GO=`lec/${c}/${l}`}
async function addCenter(){const n=V('cn');if(!n)return;const Z=await g('centers')||{};let p;do{p=String(Math.floor(1000+Math.random()*9000))}while(Z[p]);await db.ref('centers/'+p).set(n);route()}
async function genModal(){const Z=await g('centers')||{},ks=Object.keys(Z).filter(k=>k.length===4);if(!ks.length)return alert('أضف سنتر أولاً');document.body.insertAdjacentHTML('beforeend',`<div class="amodal" id="md"><div class="box"><h3>توليد أكواد</h3><label class="muted">السنتر</label><select id="cs" onchange="$('#cc').textContent=this.value">${ks.map(k=>`<option value="${k}">${esc(Z[k])}</option>`).join('')}</select><p>كود السنتر الثابت (4 أرقام): <b id="cc" style="font-size:22px">${ks[0]}</b></p><label class="muted">عدد الأكواد</label><input type="number" id="cnt" value="10" min="1" max="500"><div id="gr"></div><div class="acts"><button class="btn btn-primary btn-sm" onclick="doGen()">توليد</button><button class="btn btn-outline btn-sm" onclick="window.print()">طباعة</button><button class="btn btn-outline btn-sm" onclick="$('#md').remove()">إغلاق</button></div></div></div>`)}
async function doGen(){const p=V('cs'),K=await g('codes')||{},n=Math.min(500,Math.max(1,+V('cnt')||1)),u={},out=[];while(out.length<n){const c=p+String(Math.floor(Math.random()*1e8)).padStart(8,'0');if(!K[c]&&!u['codes/'+c]){u['codes/'+c]=true;out.push(c)}}await db.ref().update(u);$('#gr').innerHTML=out.map(c=>`<div><b>${c}</b></div>`).join('');const Zc={};Zc[p]=$('#cs').selectedOptions[0].textContent;$('#pr').innerHTML=tickets(out,Zc)}
async function delCenter(p){if(confirm('حذف السنتر؟ (الأكواد المولدة تبقى كما هي)')){await db.ref('centers/'+p).remove();route()}}
/* مسح الكود نهائيًا: الاسم + رقم الهاتف (وفهرسه) + كل بيانات الطالب في كل المسارات، في عملية واحدة (يا كلها يا ولا حاجة) */
async function delCode(k,s){
 k=String(k);if(!/^\d{12}$/.test(k))return;
 if(!confirm('مسح الكود '+k+' نهائيًا؟\n\nهيتمسح معاه: الاسم ورقم الهاتف ورقم ولي الأمر، والتقدم والاشتراك في الكورسات، ونتائج الاختبارات والمقالات، والحضور والغياب والدفع، والملاحظات والإشعارات، وتعليقاته وأسئلته في المنتدى.\n\nلا يمكن التراجع.'))return;
 try{
  const [prog,comps,enr,sess,pix,forum,log]=await Promise.all([g('userProgress/'+k),g('competitions'),g('enrollments'),g('attSessions'),g('phoneIndex'),g('forumQuestions'),g('attLog')]);
  const up={},put=p=>{up[p]=null};
  /* مسارات مفتاحها كود الطالب مباشرة */
  ['codes','users','userProgress','userEnrollments','notifications','notifiedLessons','notes','favorites','violations','sessions','attPayments'].forEach(n=>put(n+'/'+k));
  /* فهرس رقم الهاتف (أي رقم بيشاور على الكود ده، بأي صيغة) */
  Object.entries(pix||{}).forEach(([ph,c])=>{if(c===k)put('phoneIndex/'+ph)});
  /* الاشتراك في الكورسات */
  new Set([...Object.keys(comps||{}),...Object.keys(enr||{}),...Object.keys(prog||{})]).forEach(c=>put('enrollments/'+c+'/'+k));
  /* الحضور: تسجيل كل حصة + سجل الحضور */
  Object.keys(sess||{}).forEach(sid=>put('attRecords/'+sid+'/'+k));
  Object.entries(log||{}).forEach(([id,l])=>{if(l&&l.code===k)put('attLog/'+id)});
  /* أسئلة المنتدى اللي كتبها الطالب */
  Object.entries(forum||{}).forEach(([c,Q])=>Object.entries(Q||{}).forEach(([id,q])=>{if(q&&q.uid===k)put('forumQuestions/'+c+'/'+id)}));
  /* محاولات الاختبارات + تسليمات المقال + تعليقاته على الفيديوهات */
  const T=new Set(),addT=(c,l,e)=>T.add(c+'/'+l+'/'+e);
  Object.entries(comps||{}).forEach(([c,C])=>Object.entries((C&&C.lessons)||{}).forEach(([l,L])=>{
   Object.keys((L&&L.exams)||{}).forEach(e=>addT(c,l,e));
   Object.entries((L&&L.videos)||{}).forEach(([v,V])=>Object.entries((V&&V.comments)||{}).forEach(([id,cm])=>{if(cm&&cm.uid===k)put('competitions/'+c+'/lessons/'+l+'/videos/'+v+'/comments/'+id)}));
  }));
  Object.entries(prog||{}).forEach(([c,P])=>Object.entries(P||{}).forEach(([l,Q])=>Object.keys((Q&&Q.exams)||{}).forEach(e=>addT(c,l,e))));
  /* محاولات على اختبارات اتحذفت: نكتشفها بقراءة مفاتيح فقط (shallow) من غير تحميل الإجابات. لو فشلت بنكمل بالباقي */
  try{
   const sh=async q=>{const r=await fetch(cfg.databaseURL+'/'+q+'.json?shallow=true');const j=await r.json();return j&&typeof j==='object'?Object.keys(j):[]};
   for(const c of await sh('examAttempts'))await Promise.all((await sh('examAttempts/'+c)).map(async l=>{(await sh('examAttempts/'+c+'/'+l)).forEach(e=>addT(c,l,e))}));
  }catch(e){}
  T.forEach(t=>{put('examAttempts/'+t+'/'+k);put('essaySubmissions/'+t+'/'+k)});
  await db.ref().update(up);
  GO='codes';
 }catch(e){
  alert('تعذر مسح الكود، ومفيش حاجة اتمسحت. تأكد من الإنترنت وإن قواعد Firebase منشورة، وجرّب تاني.');
  console.error(e);
 }
}
async function block(k,v){const u=await g('users/'+k)||{},now=Date.now(),d=new Date(now),up={[`users/${k}/blocked`]:v};
 if(v){up[`users/${k}/blockReason`]='manual';up[`users/${k}/blockedAt`]=now}
 else{up[`users/${k}/blockReason`]=null;up[`users/${k}/blockedAt`]=null;if(/^(absence|payment)/.test(u.blockReason||''))up[`users/${k}/attOverride`]={at:now,month:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}}
 up['attLog/'+rid()]={code:k,name:u.name||k,type:v?'block':'unblock',reason:v?'manual':'manual-open',by:'admin',at:now};
 await db.ref().update(up);route()}
async function delCourse(id){const C=await g('competitions/'+id);if(!confirm('حذف كورس «'+((C&&C.title)||'')+'» نهائيًا بكل محاضراته واختباراته وتقدم الطلاب فيه؟ لا يمكن التراجع.'))return;
 const [E,P]=await Promise.all([g('userEnrollments'),g('userProgress')]),u={['competitions/'+id]:null,['examAttempts/'+id]:null,['essaySubmissions/'+id]:null};
 Object.keys(E||{}).forEach(k=>{if(E[k]&&E[k][id]!==undefined)u[`userEnrollments/${k}/${id}`]=null});Object.keys(P||{}).forEach(k=>{if(P[k]&&P[k][id]!==undefined)u[`userProgress/${k}/${id}`]=null});
 await db.ref().update(u);GO='courses'}
function tickets(list,Z){return list.map(c=>`<div class="tk"><div class="tk-h">منصة د. علاء صبح</div><div class="tk-r"><span>السنتر</span><b>${esc((Z||{})[c.slice(0,4)]||'—')}</b></div><div class="tk-r"><span>كود السنتر</span><b>${c.slice(0,4)}</b></div><div class="tk-r"><span>كود الطالب</span><b class="tk-c">${c}</b></div><div class="tk-cut">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div></div>`).join('')}
function printUnused(){const d=window.UNUSED;if(!d||!d.list.length)return alert('لا توجد أكواد للطباعة');$('#pr').innerHTML=tickets(d.list,d.Z);window.print()}
async function delUnused(){const d=window.UNUSED;if(!d||!d.list.length)return;if(!confirm('مسح '+d.list.length+' كود غير مستخدم'+(d.cf?' (للسنتر المحدد)':'')+' نهائيًا؟ لا يمكن التراجع.'))return;const u={};d.list.forEach(k=>u['codes/'+k]=null);await db.ref().update(u);route()}
async function swp(b,t1,k1,t2,k2){const [a,c]=await Promise.all([g(`${b}/${t1}/${k1}/order`),g(`${b}/${t2}/${k2}/order`)]);let A=a||0,B=c||0;if(B<=A)B=A+1;await db.ref().update({[`${b}/${t1}/${k1}/order`]:B,[`${b}/${t2}/${k2}/order`]:A});route()}
route();
