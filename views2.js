/* صفحات الأدمن المعاد تصميمها: الكورس، المحاضرة، الأكواد، السناتر، الطالب، التصحيح */
Object.assign(PG,{
top(h,lb,t,sub,acts){return `<a class="pg-back" href="javascript:void 0" onclick="GO='${h}'">${icon('arrowRight','icon-sm')} ${lb}</a>`+PG.hd(t,sub,acts)},
av(n,c){return `<span class="pg-av ${c||''}">${esc(String(n||'?').trim().charAt(0))}</span>`},
tIc:{videos:['play','ic-v'],pdfs:['filePdf','ic-p'],exams:['listCheck','ic-e']},
});

Object.assign(PG,{
cls:p=>p>=75?'g':p>=40?'o':'r',
dt:t=>t?new Date(t).toLocaleString('ar-EG'):'-',
bar:(p,c)=>`<div class="pg-b"><i class="${c||PG.cls(p)}" style="width:${Math.max(0,Math.min(100,p))}%"></i></div>`,
vstat(v){v=v||{};return{p:Math.min(100,Math.round(+v.maxWatchedPercent||0)),opened:!!v.watched,secs:+v.totalWatchSeconds||0,views:+v.viewsUsed||0}},
exScore(r){let a,b;if(r.maxPoints!=null){const d=r.essayStatus==='graded';a=(r.earnedPoints||0)+(d?(r.essayScore||0):0);b=(r.maxPoints||0)+(d?(r.essayMax||0):0)}else{a=r.score||0;b=r.totalQuestions||0}return{got:a,max:b,p:b?Math.round(a/b*100):null}},
cstat(c,p){p=p||{};let vt=0,vw=0,pc=0,et=0,ed=0,es=0,em=0;
 Object.entries((c&&c.lessons)||{}).forEach(([l,x])=>{const lp=p[l]||{};
  Object.keys(x.videos||{}).forEach(v=>{vt++;const t=PG.vstat((lp.videos||{})[v]).p;pc+=t;if(t>=80)vw++});
  Object.keys(x.exams||{}).forEach(e=>{et++;const r=(lp.exams||{})[e];if(r&&r.completed){ed++;const a=PG.exScore(r);if(a.max){es+=a.got;em+=a.max}}})});
 return{vt,vw,pc,vp:vt?Math.round(pc/vt):0,et,ed,es,em,ep:em?Math.round(es/em*100):null}},
newQ(t){return t==='essay'?{text:'',type:'essay',points:2}:{text:'',options:['','','',''],correct:0,points:1}},
qsum(){const m=Q.filter(q=>q.type!=='essay'&&q.text.trim()).length,e=Q.filter(q=>q.type==='essay'&&q.text.trim()).length,pt=Q.filter(q=>q.text.trim()).reduce((a,q)=>a+(+q.points>0?+q.points:(q.type==='essay'?2:1)),0);
 const el=$('#qsum');if(el)el.innerHTML=`<div class="pg-sm"><span>أسئلة اختيار</span><b>${m}</b></div><div class="pg-sm"><span>أسئلة مقالية</span><b>${e}</b></div><div class="pg-sm"><span>مجموع الدرجات</span><b>${pt}</b></div>`}
});

PG.views={
async cform(id){const C=id?await g('competitions/'+id):{},Z0=await g('centers')||{},Z=Object.entries(Z0).filter(([k])=>k.length===4),sel=Object.values(C.centers||{});
 M(PG.top(id?'course/'+id:'courses','رجوع',id?'تعديل الكورس':'كورس جديد','بيانات الكورس والسناتر اللي هيظهر فيها')+`<div class="pg-fm"><section class="pg-pn box"><label>اسم الكورس</label><input type="text" id="t" value="${esc(C.title)}" placeholder="مثال: الفيزياء — الصف الثالث">
 <label>نبذة</label><textarea id="d" rows="3" placeholder="وصف مختصر (اختياري)">${esc(C.description)}</textarea><div class="grid"><div><label>رابط صورة الغلاف</label><input type="text" id="i" value="${esc(C.image)}" placeholder="https://..."></div><div><label>اسم المعلم</label><input type="text" id="n" value="${esc(C.instructorName||'علاء صبح')}"></div></div></section>
 <section class="pg-pn box"><h4>السناتر</h4><p class="muted">بدون اختيار = الكورس يظهر لكل السناتر</p><div class="pg-chk">${Z.map(([p,n])=>`<label class="pg-ck"><input type="checkbox" class="cc" value="${p}" ${sel.includes(p)?'checked':''}> ${esc(n)} <small>${p}</small></label>`).join('')||'<span class="muted">لا توجد سناتر</span>'}</div>
 <button class="btn btn-primary" style="margin-top:14px;width:100%" onclick="saveCourse('${id||''}')">${id?'حفظ التعديلات':'إنشاء الكورس'}</button></section></div>`)},
async course(id){
 const [C,E,Z]=await Promise.all([g('competitions/'+id),g('userEnrollments'),g('centers')]);
 if(!C)return GO='courses';
 const L=ord(C.lessons);let v=0,p=0,x=0;
 L.forEach(([k,l])=>{v+=Object.keys(l.videos||{}).length;p+=Object.keys(l.pdfs||{}).length;x+=Object.keys(l.exams||{}).length});
 const stuN=Object.values(E||{}).filter(e=>e&&e[id]!==undefined).length,
  cn=(C.centers?Object.values(C.centers):[]).map(c=>((Z||{})[c]||c));
 const items=l=>{const so=Object.entries(l.sections||{}).sort((a,b)=>(a[1].order||0)-(b[1].order||0)).map(z=>z[0]),it=[];
  ['videos','pdfs','exams'].forEach(t=>Object.entries(l[t]||{}).forEach(([k,o])=>it.push({t,o})));
  const si=o=>o.sectionId&&so.includes(o.sectionId)?so.indexOf(o.sectionId):-1;
  return it.sort((a,b)=>(si(a.o)-si(b.o))||((a.o.order||0)-(b.o.order||0)))};
 const card=([l,y],i)=>{const it=items(y),nv=Object.keys(y.videos||{}).length,np=Object.keys(y.pdfs||{}).length,ne=Object.keys(y.exams||{}).length;
  return `<div class="pg-ls" draggable="true" data-id="${l}">
  <div class="pg-lh"><span class="drag" title="اسحب للترتيب">⠿</span><span class="pg-n">${i+1}</span>
   <div class="pg-nm"><b>${esc(y.title)}</b><small><span class="chip">${nv} فيديو</span> <span class="chip">${np} ملف</span> <span class="chip ${ne?'ok':''}">${ne} اختبار</span></small></div>
   <div class="acts"><button class="btn btn-primary btn-sm" onclick="GO='lec/${id}/${l}'">فتح</button><button class="btn btn-outline btn-sm" onclick="GO='exam/${id}/${l}'">${icon('plus','icon-sm')} اختبار</button><button class="btn btn-outline btn-sm" onclick="GO='lform/${id}/${l}'">تعديل</button><button class="btn btn-outline btn-sm dang" onclick="del('competitions/${id}/lessons/${l}')">${icon('trash','icon-sm')}</button></div></div>
  ${it.length?`<details class="pg-dt"><summary>محتوى المحاضرة (${it.length})</summary>${it.map(o=>{const ic=PG.tIc[o.t];return `<div class="pg-it"><span class="pg-ico s ${ic[1]}">${icon(ic[0],'icon-sm')}</span><span>${esc(o.o.title)}</span>${o.t==='exams'?`<span class="chip ${o.o.mustPass?'warn':''}">${o.o.mustPass?'إجباري':'اختياري'}</span><small class="muted">${o.o.questionCount||Object.keys(o.o.questions||{}).length} سؤال · ${o.o.duration||10} د</small>`:''}</div>`}).join('')}</details>`:'<div class="pg-it muted">المحاضرة فاضية — افتحها وضيف فيديوهات أو اختبار</div>'}</div>`};
 M(PG.top('courses','كل الكورسات',esc(C.title),esc(C.description||'بدون نبذة'),`<button class="btn btn-outline btn-sm" onclick="GO='cform/${id}'">تعديل</button><button class="btn btn-outline btn-sm dang" onclick="delCourse('${id}')">حذف</button><button class="btn btn-primary btn-sm" onclick="GO='lform/${id}'">${icon('plus','icon-sm')} محاضرة</button>`)
 +`<div class="pg-ks">${PG.kpi('listCheck',L.length,'محاضرة')+PG.kpi('play',v,'فيديو')+PG.kpi('filePdf',p,'ملف PDF')+PG.kpi('pen',x,'اختبار')+PG.kpi('users',stuN,'طالب مسجل','ok')}</div>
 <section class="pg-pn" style="margin-bottom:14px"><div class="pg-meta"><span>${icon('graduationCap','icon-sm')} المعلم: <b>${esc(C.instructorName||'علاء صبح')}</b></span><span>${icon('mosque','icon-sm')} السناتر: ${cn.length?cn.map(n=>`<span class="chip">${esc(n)}</span>`).join(' '):'<span class="chip ok">كل السناتر</span>'}</span></div></section>
 <section class="pg-pn"><div class="pg-tb"><h4>المحاضرات <small class="muted">— اسحب ⠿ لإعادة الترتيب</small></h4><button class="btn btn-primary btn-sm" onclick="GO='lform/${id}'">${icon('plus','icon-sm')} محاضرة جديدة</button></div><div id="ls">${L.map(card).join('')||`<div class="pg-empty"><p>لا توجد محاضرات، ابدأ بإضافة أول محاضرة</p></div>`}</div></section>`);
 dragSort('#ls',ids=>{const u={};ids.forEach((l,i)=>u[`competitions/${id}/lessons/${l}/order`]=i+1);db.ref().update(u)})},

async lform(c,l){const [C,x0]=await Promise.all([g('competitions/'+c),l?g(`competitions/${c}/lessons/${l}`):null]),x=x0||{};
 M(PG.top('course/'+c,'رجوع للكورس',l?'تعديل المحاضرة':'محاضرة جديدة','الكورس: '+esc((C||{}).title||''))
 +`<div class="pg-fm"><section class="pg-pn box"><label>اسم المحاضرة</label><input type="text" id="t" value="${esc(x.title)}" placeholder="مثال: الكهربية الساكنة" onkeydown="if(event.key==='Enter')saveLesson('${c}','${l||''}',1)">
 <div class="acts" style="margin-top:6px">${l?`<button class="btn btn-primary" onclick="saveLesson('${c}','${l}')">حفظ التعديلات</button>`:`<button class="btn btn-primary" onclick="saveLesson('${c}','',1)">إضافة وفتح المحاضرة</button><button class="btn btn-outline" onclick="saveLesson('${c}','',0)">إضافة والرجوع للكورس</button>`}${back('course/'+c,'إلغاء')}</div></section>
 <section class="pg-pn"><h4>إيه اللي بعد كده؟</h4><ol class="pg-steps"><li>اكتب اسم المحاضرة واضغط «إضافة وفتح المحاضرة».</li><li>ضيف <b>أقسام</b> (شرح / حل / واجب) لو محتاج تقسّم المحتوى.</li><li>ضيف <b>فيديوهات</b> وملفات <b>PDF</b>.</li><li>ضيف <b>اختبار</b> (إجباري أو اختياري).</li></ol></section></div>`);
 setTimeout(()=>{const i=$('#t');if(i)i.focus()},50)},

async lec(c,l){const x=await g(`competitions/${c}/lessons/${l}`)||{},S=x.sections||{},base=`competitions/${c}/lessons/${l}`,SO=Object.entries(S).sort((a,b)=>(a[1].order||0)-(b[1].order||0)),so=SO.map(([k,s])=>`<option value="${k}">${esc(s.title)}</option>`).join('');
 const own=v=>v.sectionId&&S[v.sectionId]?v.sectionId:'';
 const grp=(sid,name,del)=>{const it=[];['videos','pdfs','exams'].forEach(t=>Object.entries(x[t]||{}).forEach(([k,v])=>{if(own(v)===sid)it.push({t,k,v})}));it.sort((a,b)=>(a.v.order||0)-(b.v.order||0));
  if(!it.length&&!sid&&SO.length)return '';
  return `<section class="pg-pn"><div class="pg-tb"><h4>${esc(name)} <span class="chip">${it.length}</span></h4>${del?`<button class="btn btn-outline btn-sm dang" onclick="del('${base}/sections/${sid}')">حذف القسم</button>`:''}</div>`+(it.map((o,i)=>{const P=it[i-1],N=it[i+1],ic=PG.tIc[o.t],qn=o.v.questionCount||Object.keys(o.v.questions||{}).length;
   return `<div class="pg-li stk"><span class="pg-ico ${ic[1]}">${icon(ic[0],'icon-sm')}</span><div class="pg-nm"><b>${esc(o.v.title)}</b>${o.t==='exams'?`<small><span class="chip ${o.v.mustPass?'warn':''}">${o.v.mustPass?'إجباري':'اختياري'}</span> ${qn} سؤال · ${o.v.duration||10} دقيقة</small>`:o.t==='videos'?`<small>${esc(String(o.v.url||'').slice(0,60))}</small>`:`<small>${esc(String(o.v.url||'').slice(0,60))}</small>`}</div><div class="acts"><button class="btn btn-outline btn-sm" ${P?`onclick="swp('${base}','${P.t}','${P.k}','${o.t}','${o.k}')"`:'disabled'}>▲</button><button class="btn btn-outline btn-sm" ${N?`onclick="swp('${base}','${o.t}','${o.k}','${N.t}','${N.k}')"`:'disabled'}>▼</button>${o.t==='exams'?`<button class="btn btn-outline btn-sm" onclick="GO='exam/${c}/${l}/${o.k}'">تعديل</button>`:''}<button class="btn btn-outline btn-sm dang" onclick="del('${base}/${o.t}/${o.k}')">${icon('trash','icon-sm')}</button></div></div>`}).join('')||'<p class="muted">لا يوجد محتوى</p>')+'</section>'};
 const n=t=>Object.keys(x[t]||{}).length;
 window.PGtab=t=>{document.querySelectorAll('.pg-tabbtn').forEach(b=>{const on=b.dataset.t===t;b.classList.toggle('btn-primary',on);b.classList.toggle('btn-outline',!on)});document.querySelectorAll('.pg-tabpane').forEach(p=>p.hidden=p.dataset.t!==t)};
 M(PG.top('course/'+c,'رجوع للكورس',esc(x.title),'الترتيب هنا هو نفس ترتيب ظهور المحتوى للطالب، والاختبار الإجباري بيقفل اللي بعده',`<button class="btn btn-primary btn-sm" onclick="GO='exam/${c}/${l}'">${icon('plus','icon-sm')} اختبار</button>`)
 +`<div class="pg-ks">${PG.kpi('play',n('videos'),'فيديو')+PG.kpi('filePdf',n('pdfs'),'ملف PDF')+PG.kpi('pen',n('exams'),'اختبار')+PG.kpi('listCheck',SO.length,'قسم')}</div>
 <div class="pg-two"><div>${grp('','بدون قسم')}${SO.map(([k,s])=>grp(k,s.title,1)).join('')}${!n('videos')&&!n('pdfs')&&!n('exams')?'<div class="pg-pn pg-empty"><p>المحاضرة فاضية — استخدم «إضافة محتوى» على الجنب</p></div>':''}</div>
 <aside><section class="pg-pn box"><h4>إضافة محتوى</h4>
  <div class="pg-tabs"><button class="btn btn-primary btn-sm pg-tabbtn" data-t="v" onclick="PGtab('v')">فيديو</button><button class="btn btn-outline btn-sm pg-tabbtn" data-t="p" onclick="PGtab('p')">PDF</button><button class="btn btn-outline btn-sm pg-tabbtn" data-t="e" onclick="PGtab('e')">اختبار</button><button class="btn btn-outline btn-sm pg-tabbtn" data-t="s" onclick="PGtab('s')">قسم</button></div>
  <div class="pg-tabpane" data-t="v"><label class="muted">القسم</label><select id="vs"><option value="">بدون قسم</option>${so}</select><div id="vr"></div><div class="acts"><button class="btn btn-outline btn-sm" onclick="vrow()">+ فيديو آخر</button><button class="btn btn-primary btn-sm" onclick="saveVideos('${base}')">حفظ الفيديوهات</button></div></div>
  <div class="pg-tabpane" data-t="p" hidden><label class="muted">القسم</label><select id="ps"><option value="">بدون قسم</option>${so}</select><input type="text" id="pt" placeholder="اسم الملف"><input type="text" id="pu" placeholder="الرابط"><button class="btn btn-primary btn-sm" onclick="addPdf('${base}')">إضافة الملف</button></div>
  <div class="pg-tabpane" data-t="e" hidden><p class="muted">اختبار اختيار من متعدد و/أو مقالي، تحدد مدته وهل هو إجباري.</p><button class="btn btn-primary btn-sm" onclick="GO='exam/${c}/${l}'">${icon('plus','icon-sm')} إنشاء اختبار</button></div>
  <div class="pg-tabpane" data-t="s" hidden><p class="muted">الأقسام بتقسّم المحاضرة (شرح / حل / واجب...).</p><input type="text" id="sn" placeholder="اسم القسم"><button class="btn btn-primary btn-sm" onclick="addSection('${base}')">+ إضافة قسم</button></div>
 </section></aside></div>`);vrow()},

async exam(c,l,e){const base=`competitions/${c}/lessons/${l}`,[S0,LT,x0]=await Promise.all([g(base+'/sections'),g(base+'/title'),e?g(`${base}/exams/${e}`):null]),S=S0||{},x=x0||{};
 window.Q=Object.entries(x.questions||{}).map(([id,q])=>({...q,_id:id,options:q.type==='essay'?undefined:(q.options||['','','','']).slice()})).sort((a,b)=>(a.order==null?1e9:a.order)-(b.order==null?1e9:b.order));
 if(!Q.length)Q.push(PG.newQ('mcq'));
 window.EX={c,l,e,order:x.order};
 M(PG.top('lec/'+c+'/'+l,'رجوع للمحاضرة',e?'تعديل اختبار':'اختبار جديد',esc(LT||''))
 +`<div class="pg-fm"><div><section class="pg-pn box"><h4>بيانات الاختبار</h4><label>عنوان الاختبار</label><input type="text" id="et" placeholder="مثال: اختبار على الدرس" value="${esc(x.title)}">
  <div class="grid"><div><label>المدة بالدقائق</label><input type="number" id="ed" min="1" value="${x.duration||10}"></div><div><label>القسم</label><select id="es"><option value="">بدون قسم</option>${Object.entries(S).map(([k,s])=>`<option value="${k}" ${x.sectionId===k?'selected':''}>${esc(s.title)}</option>`).join('')}</select></div></div>
  <label class="pg-ck" style="margin-top:6px"><input type="checkbox" id="em" ${x.mustPass?'checked':''}> اختبار إجباري <small>يقفل المحتوى اللي بعده لحد ما الطالب يحله</small></label></section>
  <div id="qs"></div>
  <div class="acts" style="margin-bottom:14px"><button class="btn btn-outline" onclick="addQ('mcq')">${icon('plus','icon-sm')} سؤال اختيار من متعدد</button><button class="btn btn-outline" onclick="addQ('essay')">${icon('plus','icon-sm')} سؤال مقالي</button></div><button class="btn btn-primary pg-savebot" onclick="saveExam()">${icon('floppyDisk','icon-sm')} حفظ الاختبار</button></div>
  <aside class="pg-sticky"><section class="pg-pn"><h4>ملخص الاختبار</h4><div id="qsum"></div><button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="saveExam()">${icon('floppyDisk','icon-sm')} حفظ الاختبار</button><div style="margin-top:8px">${back('lec/'+c+'/'+l,'إلغاء')}</div></section></aside></div>`);drawQ()},

async codes(a,b){
 const [K,U,Z]=await Promise.all([g('codes'),g('users'),g('centers')]),Zc=Z||{},Uu=U||{},all=Object.keys(K||{}).sort(),isU=k=>!!(Uu[k]&&Uu[k].name),used=all.filter(isU),un=all.filter(k=>!isU(k)),cn=p=>Zc[p]||'سنتر غير معروف',
  cs=[...new Set([...Object.keys(Zc).filter(p=>p.length===4),...all.map(k=>k.slice(0,4))])].sort(),S={t:a==='used'?'used':'unused',c:cs.includes(b)?b:'',q:''};
 M(PG.hd('الأكواد',all.length+' كود في المنصة')+`<div class="pg-ks">${PG.kpi('key',all.length,'إجمالي الأكواد')+PG.kpi('users',used.length,'مستخدمة','ok')+PG.kpi('circleInfo',un.length,'متاحة')}</div><section class="pg-pn"><div id="cbar"></div><div id="csum" class="muted" style="margin:6px 0 10px"></div><div id="cl"></div></section>`);
 const inT=(arr,p)=>arr.filter(k=>!p||k.startsWith(p)),
 bar=()=>{const base=S.t==='used'?used:un;
  $('#cbar').innerHTML=`<div class="pg-tb"><div class="tabs" style="margin:0"><button class="btn ${S.t=='used'?'btn-primary':'btn-outline'} btn-sm" onclick="PGc.t('used')">مستخدمة (${inT(used,S.c).length})</button><button class="btn ${S.t=='unused'?'btn-primary':'btn-outline'} btn-sm" onclick="PGc.t('unused')">غير مستخدمة (${inT(un,S.c).length})</button></div>
  <select id="cfs" class="pg-in" onchange="PGc.c(this.value)"><option value="">كل السناتر (${base.length})</option>${cs.map(p=>`<option value="${p}" ${p===S.c?'selected':''}>${esc(cn(p))} — ${p} (${inT(base,p).length})</option>`).join('')}</select>
  ${S.t==='used'?`<input type="search" id="cq" class="pg-in" placeholder="ابحث بالاسم أو الكود أو الهاتف..." value="${esc(S.q)}" oninput="PGc.q(this.value)">`:(inT(un,S.c).length?`<button class="btn btn-primary btn-sm" onclick="printUnused()">${icon('fileLines','icon-sm')} طباعة (${inT(un,S.c).length})</button><button class="btn btn-outline btn-sm dang" onclick="delUnused()">${icon('trash','icon-sm')} مسح (${inT(un,S.c).length})</button>`:'')}</div>`},
 list=()=>{const base=S.t==='used'?used:un;let L=inT(base,S.c);
  if(S.t==='used'&&S.q){const q=S.q.toLowerCase();L=L.filter(k=>k.includes(q)||String((Uu[k]||{}).name||'').toLowerCase().includes(q)||String((Uu[k]||{}).phone||'').includes(q))}
  window.UNUSED={list:S.t==='unused'?L:[],Z:Zc,cf:S.c};
  const cu=inT(used,S.c).length,cf=inT(un,S.c).length;
  $('#csum').innerHTML=S.c?`${icon('mosque','icon-sm')} ${esc(cn(S.c))} (${S.c}): <b>${cu}</b> مستخدم · <b>${cf}</b> متاح · إجمالي <b>${cu+cf}</b>`:`كل السناتر: <b>${used.length}</b> مستخدم · <b>${un.length}</b> متاح`;
  $('#cl').innerHTML=L.map(k=>{const u=Uu[k]||{};return `<div class="pg-li">${S.t=='used'?PG.av(u.name):`<span class="pg-ico ic-e">${icon('key','icon-sm')}</span>`}<div class="pg-nm"><b class="pg-mono">${k}</b><small>${S.t=='used'?esc(u.name)+' · '+esc(u.centerName||cn(k.slice(0,4)))+(u.phone?' · '+esc(u.phone):''):esc(cn(k.slice(0,4)))}</small></div>${u.blocked?'<span class="chip bad">محظور</span>':''}<div class="acts">${S.t=='used'?`<button class="btn btn-outline btn-sm" onclick="GO='stu/${k}'">التفاصيل</button>`:`<button class="btn btn-outline btn-sm dang" onclick="delCode('${k}')">${icon('trash','icon-sm')}</button>`}</div></div>`}).join('')||'<div class="pg-empty"><p>لا يوجد</p></div>'};
 window.PGc={t:t=>{S.t=t;S.q='';bar();list()},c:v=>{S.c=v;bar();list()},q:v=>{S.q=v.trim();list()}};
 bar();list()},

async stu(k){let [u,P,C]=await Promise.all([g('users/'+k),g('userProgress/'+k),g('competitions')]);u=u||{};P=P||{};C=C||{};const ids=Object.keys(P).filter(i=>C[i]),T={vt:0,vw:0,pc:0,et:0,ed:0,es:0,em:0};
 const rows=ids.map(i=>{const s=PG.cstat(C[i],P[i]);T.vt+=s.vt;T.vw+=s.vw;T.pc+=s.pc;T.et+=s.et;T.ed+=s.ed;T.es+=s.es;T.em+=s.em;return{i,s}});
 const vAvg=T.vt?Math.round(T.pc/T.vt):0,eAvg=T.em?Math.round(T.es/T.em*100):null;
 M(PG.top('codes/used','كل الطلاب',esc(u.name),'الكود: '+k+(u.blocked?' · محظور':''),`<button class="btn ${u.blocked?'btn-primary':'btn-outline'} btn-sm" onclick="block('${k}',${!u.blocked})">${u.blocked?'فك الحظر':'حظر من المنصة'}</button><button class="btn btn-outline btn-sm dang" onclick="delCode('${k}',1)">مسح الكود</button>`)
 +`<div class="pg-ks">${[['السنتر',u.centerName],['الهاتف',u.phone],['ولي الأمر',u.parentPhone]].map(a=>`<div class="pg-k"><div><b style="font-size:17px">${esc(a[1]||'—')}</b><small>${a[0]}</small></div></div>`).join('')}</div>
 <div class="pg-ks">${PG.kpi('play',vAvg+'%','متوسط مشاهدة الفيديوهات')+PG.kpi('circleCheck',T.vw+' / '+T.vt,'فيديو مكتمل (80%+)','ok')+PG.kpi('listCheck',T.ed+' / '+T.et,'اختبار محلول')+PG.kpi('award',eAvg==null?'—':eAvg+'%','متوسط الاختبارات',eAvg!=null&&eAvg<50?'bad':'ok')}</div>
 <section class="pg-pn"><h4>الكورسات</h4>${rows.map(({i,s})=>`<div class="pg-li"><span class="pg-ico ic-v">${icon('bookOpen','icon-sm')}</span><div class="pg-nm"><b>${esc(C[i].title)}</b><small>فيديو ${s.vp}% (${s.vw}/${s.vt}) · اختبارات ${s.ed}/${s.et}${s.ep==null?'':' · متوسط '+s.ep+'%'}</small></div><div style="width:120px">${PG.bar(s.vp)}</div><button class="btn btn-outline btn-sm" onclick="GO='stc/${k}/${i}'">تفاصيل التقدم</button></div>`).join('')||'<p class="muted">لم يدخل كورسات</p>'}</section>`)},

async stc(k,c){let [C,P,u]=await Promise.all([g('competitions/'+c),g(`userProgress/${k}/${c}`),g('users/'+k)]);if(!C)return GO='stu/'+k;P=P||{};u=u||{};const s=PG.cstat(C,P);
 M(PG.top('stu/'+k,'رجوع للطالب',esc(C.title),'تقدم '+esc(u.name||k)+' في كل محاضرة')
 +`<div class="pg-ks">${PG.kpi('play',s.vp+'%','متوسط مشاهدة الفيديوهات')+PG.kpi('circleCheck',s.vw+' / '+s.vt,'فيديو مكتمل (80%+)','ok')+PG.kpi('listCheck',s.ed+' / '+s.et,'اختبار محلول')+PG.kpi('award',s.ep==null?'—':s.ep+'%','متوسط الاختبارات',s.ep!=null&&s.ep<50?'bad':'ok')}</div>`
 +ord(C.lessons).map(([l,x])=>{const p=P[l]||{},vs=ord(x.videos),es=ord(x.exams),lv=vs.length?Math.round(vs.reduce((a,[v])=>a+PG.vstat((p.videos||{})[v]).p,0)/vs.length):0;
  const vrows=vs.map(([v,y])=>{const t=PG.vstat((p.videos||{})[v]);return `<div class="pg-vr"><span class="pg-ico s ic-v">${icon('play','icon-sm')}</span><div class="pg-nm"><b>${esc(y.title)}</b><small>${t.opened?'فتح الفيديو':'لم يفتحه'} · مدة المشاهدة الفعلية ${t.secs?dur(t.secs):'—'} · عدد المشاهدات ${t.views}</small></div><div class="pg-vp">${PG.bar(t.p)}<b>${t.p}%</b></div></div>`}).join('');
  const erows=es.map(([e,q])=>{const r=(p.exams||{})[e];if(!(r&&r.completed))return `<div class="pg-ex"><span class="pg-ico s ic-e">${icon('pen','icon-sm')}</span><b>${esc(q.title)}</b><span class="chip">لم يُحل</span></div>`;
   const sc=PG.exScore(r),wr=(r.totalQuestions||0)-(r.score||0);
   return `<div class="pg-ex"><span class="pg-ico s ic-e">${icon('pen','icon-sm')}</span><b>${esc(q.title)}</b><span class="chip ok">صح ${r.score}/${r.totalQuestions}</span><span class="chip bad">غلط ${wr}</span>${sc.p==null?'':`<span class="chip ${sc.p>=75?'ok':sc.p>=50?'':'bad'}">${sc.p}%</span>`}${r.essayMax?`<span class="chip ${r.essayStatus=='graded'?'ok':'warn'}">المقالي: ${r.essayStatus=='graded'?(r.essayScore||0)+'/'+r.essayMax:'جاري التصحيح'}</span>`:''}<small class="muted">${dur(r.timeSpentSec)} · ${PG.dt(r.answeredAt)}</small><button class="btn btn-primary btn-sm" style="margin-inline-start:auto" onclick="GO='stx/${k}/${c}/${l}/${e}'">مراجعة الأسئلة</button></div>`}).join('');
  return `<section class="pg-pn" style="margin-bottom:12px"><div class="pg-tb"><h4>${esc(x.title)}</h4><small class="muted">متوسط مشاهدة المحاضرة ${lv}%</small></div>${vrows||'<p class="muted">لا توجد فيديوهات</p>'}${erows?`<div class="pg-sub">الاختبارات</div>${erows}`:''}</section>`}).join(''))},

async stx(k,c,l,e){const [u,r,ex,es]=await Promise.all([g('users/'+k),g(`userProgress/${k}/${c}/${l}/exams/${e}`),g(`competitions/${c}/lessons/${l}/exams/${e}`),g(`essaySubmissions/${c}/${l}/${e}/${k}`)]);
 const back_='stc/'+k+'/'+c;if(!ex)return M(PG.top(back_,'رجوع',  'الاختبار غير موجود','الاختبار اتحذف')),0;
 const hd=PG.top(back_,'رجوع لتقدم الطالب',esc(ex.title),esc((u||{}).name||k)+' · الكود '+k);
 if(!(r&&r.completed))return M(hd+'<section class="pg-pn pg-empty"><p>الطالب لم يحل هذا الاختبار بعد</p></section>'),0;
 const ans=r.answers||{},Qs=ord(ex.questions).sort((a,b)=>(a[1].order==null?1e9:a[1].order)-(b[1].order==null?1e9:b[1].order)),att=Qs.filter(([id])=>ans[id]!==undefined),gone=Object.keys(ans).filter(id=>!(ex.questions||{})[id]).length;
 let ok=0,bad=0,none=0,ess=0;const LT=['أ','ب','ج','د','هـ','و','ز','ح'];
 const cards=att.map(([id,q],i)=>{const sel=ans[id];
  if(q.type==='essay'){ess++;const gr=r.essayStatus==='graded';return `<article class="pg-qr" data-st="essay"><div class="pg-qrh"><span class="pg-n">${i+1}</span><p>${esc(q.text)}</p><span class="chip ${gr?'ok':'warn'}">${gr?'اتصحح':'جاري التصحيح'}</span></div><div class="pg-ans">${typeof sel==='string'&&sel.trim()?esc(sel):'— لا توجد إجابة —'}</div>${gr?'':`<button class="btn btn-outline btn-sm" onclick="GO='grade/${k}/${c}/${l}/${e}'">تصحيح المقال</button>`}</article>`}
  const has=typeof sel==='number'&&sel>=0,good=has&&sel===q.correct,st=!has?'none':good?'ok':'bad';if(st==='ok')ok++;else if(st==='bad')bad++;else none++;
  const opts=(q.options||[]).map((o,j)=>{const isC=j===q.correct,isS=has&&j===sel;return `<div class="pg-ro ${isC?'ok':isS?'bad':''}"><span class="pg-let">${LT[j]||j+1}</span><span class="pg-rt">${esc(o)}</span>${isC&&isS?'<em class="ok">إجابة الطالب ✓ (صحيحة)</em>':isC?'<em class="ok">الإجابة الصحيحة</em>':isS?'<em class="bad">إجابة الطالب</em>':''}</div>`}).join('');
  return `<article class="pg-qr" data-st="${st}"><div class="pg-qrh"><span class="pg-n">${i+1}</span><p>${esc(q.text)}</p><span class="chip ${st==='ok'?'ok':st==='bad'?'bad':'warn'}">${st==='ok'?'صح':st==='bad'?'غلط':'بدون إجابة'}</span></div>${opts}${st==='bad'?`<p class="pg-diff">الطالب اختار: <b>${esc((q.options||[])[sel]||'')}</b> — الصح: <b>${esc((q.options||[])[q.correct]||'')}</b></p>`:st==='none'?'<p class="pg-diff">الطالب لم يجب عن هذا السؤال</p>':''}</article>`}).join('');
 const sc=PG.exScore(r);
 window.PGq=f=>{document.querySelectorAll('.pg-qf').forEach(b=>{const on=b.dataset.f===f;b.classList.toggle('btn-primary',on);b.classList.toggle('btn-outline',!on)});document.querySelectorAll('.pg-qr').forEach(a=>a.hidden=f!=='all'&&a.dataset.st!==f)};
 M(hd+`<div class="pg-ks">${PG.kpi('award',sc.got+' / '+sc.max,'الدرجة'+(r.essayMax&&r.essayStatus!=='graded'?' (بدون المقالي)':''),sc.p!=null&&sc.p<50?'bad':'ok')+PG.kpi('chartSimple',sc.p==null?'—':sc.p+'%','النسبة')+PG.kpi('circleCheck',ok,'إجابات صح','ok')+PG.kpi('circleXmark',bad,'إجابات غلط',bad?'bad':'')+PG.kpi('hourglass',none,'بدون إجابة')+PG.kpi('clock',dur(r.timeSpentSec),'مدة الحل')}</div>
 <div class="pg-meta"><span>${icon('calendar','icon-sm')} ${PG.dt(r.answeredAt)}</span>${ess?`<span>${icon('pen','icon-sm')} مقالي: ${r.essayStatus=='graded'?(es&&es.score!=null?es.score:r.essayScore||0)+' / '+(r.essayMax||0):'جاري التصحيح'}</span>`:''}</div>
 ${(ok+bad+none>0&&ok!==(r.score||0))?'<div class="pg-warn">تنبيه: الاختبار اتعدّل بعد ما الطالب حله، فالإجابات الصحيحة المعروضة ممكن تختلف عن وقت الحل (الدرجة الأساسية محفوظة زي ما هي).</div>':''}
 ${gone?`<div class="pg-warn">${gone} سؤال اتحذف أو اتعدّل من الاختبار بعد الحل، فتفاصيله مش متاحة.</div>`:''}
 ${!att.length?'<section class="pg-pn pg-empty"><p>الاختبار ده محلول قبل تسجيل الإجابات التفصيلية</p></section>':`<div class="pg-tabs" style="margin:14px 0">${[['all','الكل ('+att.length+')'],['bad','الغلط ('+bad+')'],['ok','الصح ('+ok+')'],['none','بدون إجابة ('+none+')'],['essay','مقالي ('+ess+')']].map(a=>`<button class="btn ${a[0]=='all'?'btn-primary':'btn-outline'} btn-sm pg-qf" data-f="${a[0]}" onclick="PGq('${a[0]}')">${a[1]}</button>`).join('')}</div><div class="pg-qlist">${cards}</div>`}`)},
async gen(){const Z=await g('centers')||{},ks=Object.entries(Z).filter(([p])=>p.length===4);
 M(PG.hd('توليد أكواد','السناتر وأكواد الطلاب (كود السنتر 4 أرقام والكود الكامل 12 رقم)',`<button class="btn btn-primary btn-sm" onclick="genModal()">${icon('key','icon-sm')} توليد أكواد</button>`)
 +`<div class="pg-cg">${ks.map(([p,n])=>`<article class="pg-c"><div class="pg-cb"><span class="pg-code">${p}</span><h3>${esc(n)}</h3><div class="pg-ft"><small class="muted">كود السنتر</small><button class="btn btn-outline btn-sm dang" onclick="delCenter('${p}')">${icon('trash','icon-sm')} حذف</button></div></div></article>`).join('')||'<div class="pg-empty"><p>أضف سنتر أولاً</p></div>'}</div>
 <section class="pg-pn" style="margin-top:16px;max-width:520px"><h4>سنتر جديد</h4><div class="acts"><input type="text" id="cn" class="pg-in" style="flex:1" placeholder="اسم السنتر"><button class="btn btn-primary btn-sm" onclick="addCenter()">إضافة</button></div></section>`)},
async grade(k,c,l,e){if(k)return gradeOne(k,c,l,e);const S=await g('essaySubmissions')||{},L=[];
 Object.entries(S).forEach(([c,a])=>Object.entries(a).forEach(([l,b])=>Object.entries(b).forEach(([e,d])=>Object.entries(d).forEach(([k,s])=>{if(s.status==='pending')L.push({k,c,l,e,t:s.submittedAt||0,n:s.name||k})}))));L.sort((a,b)=>a.t-b.t);
 M(PG.hd('تصحيح المقال',L.length?L.length+' إجابة بانتظار التصحيح':'لا توجد إجابات بانتظار التصحيح')+`<section class="pg-pn">${L.map(x=>`<div class="pg-li">${PG.av(x.n)}<div class="pg-nm"><b>${esc(x.n)}</b><small>${new Date(x.t).toLocaleString('ar-EG')}</small></div><button class="btn btn-primary btn-sm" onclick="GO='grade/${x.k}/${x.c}/${x.l}/${x.e}'">مراجعة</button></div>`).join('')||'<div class="pg-empty">'+icon('circleCheck','icon-lg')+'<p>كل الإجابات اتصححت، شغل ممتاز</p></div>'}</section>`)}
};
