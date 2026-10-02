/* تصميم جديد لصفحتي الكورسات والأداء */
const PG={
hd(t,sub,act){return `<div class="pg-head"><div><h2>${t}</h2><p>${sub}</p></div><div class="pg-acts">${act||''}</div></div>`},
kpi(ic,n,l,c){return `<div class="pg-k ${c||''}"><span class="pg-ki">${icon(ic,'icon-md')}</span><div><b>${n}</b><small>${l}</small></div></div>`},
async home(){
 const d=new Date().toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'});
 M('<section class="ad-hero"><div><small>'+d+'</small><h2>أهلًا د. علاء 👋</h2><p>ملخص سريع لحالة المنصة</p></div><div class="pg-acts"><button class="btn btn-gold" onclick="GO=\'cform\'">+ كورس جديد</button><button class="btn btn-light" onclick="GO=\'gen\'">توليد أكواد</button></div></section><div class="pg-ks" id="st"></div><div class="ad-two"><section class="pg-pn"><h4>إجراءات سريعة</h4><div class="ad-qa" id="qa"></div></section><section class="pg-pn"><h4>يحتاج انتباهك</h4><div id="att"></div></section></div>');
 const [C,U,K,E]=await Promise.all([g('competitions'),g('users'),g('codes'),g('essaySubmissions')]);
 let lec=0,pend=0;Object.values(C||{}).forEach(c=>lec+=Object.keys(c.lessons||{}).length);Object.values(E||{}).forEach(a=>Object.values(a).forEach(b=>Object.values(b).forEach(c=>Object.values(c).forEach(x=>{if(x.status==='pending')pend++}))));
 const ks=Object.keys(K||{}),st=Object.values(U||{}).filter(u=>u.name),used=ks.filter(k=>(U||{})[k]&&U[k].name).length,free=ks.length-used,cc=Object.keys(C||{}).length,bl=st.filter(u=>u.blocked).length;
 $('#st').innerHTML=PG.kpi('bookOpen',cc,'كورس')+PG.kpi('listCheck',lec,'محاضرة')+PG.kpi('users',st.length,'طالب مسجل','ok')+PG.kpi('key',free,'كود غير مستخدم')+PG.kpi('pen',pend,'مقال ينتظر التصحيح',pend?'bad':'');
 const sub={courses:cc+' كورس',gen:'إنشاء وطباعة',codes:used+' مستخدم / '+free+' متاح',perf:'مستوى الطلاب',grade:pend?pend+' بانتظار التصحيح':'لا يوجد انتظار'};
 $('#qa').innerHTML=NAV.slice(1).map(n=>`<button class="ad-q" onclick="GO='${n[0]}'"><span class="pg-ki">${icon(n[2],'icon-md')}</span><span>${n[1]==='الأداء'?'الأداء العام':n[1]==='التصحيح'?'تصحيح المقال':n[1]}<small>${sub[n[0]]||''}</small></span></button>`).join('');
 const at=[];if(pend)at.push(['pen',pend+' مقال ينتظر التصحيح','grade']);if(free<10)at.push(['key','الأكواد المتاحة قليلة ('+free+')','gen']);if(bl)at.push(['shield',bl+' طالب محظور','codes/used']);
 $('#att').innerHTML=at.map(a=>`<div class="ad-at w"><span>${icon(a[0],'icon-sm')}</span><span>${a[1]}</span><button class="btn btn-outline btn-sm" onclick="GO='${a[2]}'">فتح</button></div>`).join('')||'<div class="ad-at"><span>'+icon('circleCheck','icon-sm')+'</span><span>كل شيء تمام، مفيش حاجة معلّقة</span></div>'},
async courses(){
 const [P0,E0]=await Promise.all([g('competitions'),g('userEnrollments')]),P=P0||{},E=E0||{},cnt={};
 Object.values(E).forEach(e=>Object.keys(e||{}).forEach(c=>cnt[c]=(cnt[c]||0)+1));
 const A=Object.entries(P).map(([id,c])=>{let v=0,x=0;const L=Object.values(c.lessons||{});L.forEach(l=>{v+=Object.keys(l.videos||{}).length;x+=Object.keys(l.exams||{}).length});
  return{id,c,l:L.length,v,x,s:cnt[id]||0,n:c.centers?Object.keys(c.centers).length:0,t:c.createdAt||0}});
 const T=k=>A.reduce((a,b)=>a+b[k],0),S={q:'',o:'new'};
 M(PG.hd('الكورسات',A.length+' كورس على المنصة',`<input type="search" id="q" class="pg-in" placeholder="ابحث باسم الكورس..."><select id="o" class="pg-in"><option value="new">الأحدث</option><option value="name">الاسم</option><option value="stu">الأكثر طلابًا</option></select><button class="btn btn-primary btn-sm" onclick="GO='cform'">${icon('plus','icon-sm')} كورس جديد</button>`)
 +`<div class="pg-ks">${PG.kpi('bookOpen',A.length,'كورس')+PG.kpi('listCheck',T('l'),'محاضرة')+PG.kpi('play',T('v'),'فيديو')+PG.kpi('pen',T('x'),'اختبار')}</div><div class="pg-cg" id="cg"></div>`);
 const draw=()=>{let L=A.filter(a=>(a.c.title||'').includes(S.q));
  L.sort(S.o==='name'?(a,b)=>(a.c.title||'').localeCompare(b.c.title||'','ar'):S.o==='stu'?(a,b)=>b.s-a.s:(a,b)=>b.t-a.t);
  $('#cg').innerHTML=L.map(a=>{const c=a.c;return `<article class="pg-c"><div class="pg-cv" ${c.image?`style="background-image:url('${esc(c.image)}')"`:''}>${c.image?'':icon('bookOpen','icon-xl')}<span class="pg-tag">${a.n?a.n+' سنتر':'كل السناتر'}</span></div>
  <div class="pg-cb"><h3>${esc(c.title)}</h3><p>${esc((c.description||'بدون نبذة').slice(0,80))}</p>
  <div class="pg-ms"><span><b>${a.l}</b> محاضرة</span><span><b>${a.v}</b> فيديو</span><span><b>${a.x}</b> اختبار</span></div>
  <div class="pg-ft"><span class="pg-st">${icon('users','icon-sm')} ${a.s} طالب</span><div class="pg-acts"><button class="btn btn-primary btn-sm" onclick="GO='course/${a.id}'">فتح</button><button class="btn btn-outline btn-sm" onclick="GO='cform/${a.id}'">تعديل</button><button class="btn btn-outline btn-sm dang" title="حذف" onclick="delCourse('${a.id}')">${icon('trash','icon-sm')}</button></div></div></div></article>`}).join('')
  ||`<div class="pg-empty">${icon('bookOpen','icon-lg')}<p>${A.length?'لا توجد نتائج مطابقة':'لا توجد كورسات بعد'}</p></div>`};
 $('#q').oninput=e=>{S.q=e.target.value.trim();draw()};$('#o').onchange=e=>{S.o=e.target.value;draw()};draw()},
async perf(){
 const [U,P,C]=await Promise.all([g('users'),g('userProgress'),g('competitions')]),cs={};
 const R=Object.entries(U||{}).filter(([k,u])=>u.name).map(([k,u])=>{let s=0,t=0,n=0;
  Object.entries((P||{})[k]||{}).forEach(([cid,cp])=>{let a1=0,b1=0;Object.values(cp||{}).forEach(lp=>Object.values((lp&&lp.exams)||{}).forEach(r=>{if(!r||!r.completed)return;let a,b;
   if(r.maxPoints!=null){const d=r.essayStatus==='graded';a=(r.earnedPoints||0)+(d?(r.essayScore||0):0);b=(r.maxPoints||0)+(d?(r.essayMax||0):0)}else if(r.totalQuestions){a=r.score;b=r.totalQuestions}else return;
   s+=a;t+=b;n++;a1+=a;b1+=b}));if(b1){const z=cs[cid]=cs[cid]||[0,0];z[0]+=a1;z[1]+=b1}});
  return{k,name:u.name,ct:u.centerName||'—',n,p:t?Math.round(s/t*100):null,bl:!!u.blocked}});
 R.sort((a,b)=>(b.p??-1)-(a.p??-1));
 const lv=p=>p==null?'n':p>=75?'g':p>=50?'o':'r',LN={g:'متفوق',o:'متوسط',r:'يحتاج متابعة',n:'لم يبدأ'},F={g:0,o:0,r:0,n:0};R.forEach(r=>F[lv(r.p)]++);
 const sc=R.filter(r=>r.p!=null),avg=sc.length?Math.round(sc.reduce((a,b)=>a+b.p,0)/sc.length):0,ex=R.reduce((a,b)=>a+b.n,0),S={q:'',c:'',f:''};
 const cens=[...new Set(R.map(r=>r.ct))].sort(),top=sc.slice(0,3),pod=[top[1],top[0],top[2]].map((r,i)=>r&&[2,1,3][i]?{r,rk:[2,1,3][i]}:null).filter(Boolean);
 const CR=Object.entries(cs).map(([id,v])=>({t:(C&&C[id]&&C[id].title)||id,p:Math.round(v[0]/v[1]*100)})).sort((a,b)=>b.p-a.p);
 M(PG.hd('الأداء العام','تحليل مستوى الطلاب من نتائج الاختبارات',`<button class="btn btn-outline btn-sm" id="csv">${icon('fileLines','icon-sm')} تصدير CSV</button>`)
 +`<div class="pg-ks">${PG.kpi('users',R.length,'طالب مسجل')+PG.kpi('chartSimple',avg+'%','متوسط المنصة')+PG.kpi('listCheck',ex,'اختبار محلول')+PG.kpi('award',F.g,'طالب متفوق','ok')+PG.kpi('bell',F.r,'يحتاجون متابعة',F.r?'bad':'')}</div>
 <div class="pg-top"><section class="pg-pn"><h4>توزيع المستويات</h4><div class="pg-dist">${['g','o','r','n'].map(k=>F[k]?`<i class="${k}" style="flex:${F[k]}" title="${LN[k]}"></i>`:'').join('')||'<i class="n" style="flex:1"></i>'}</div>
  <div class="pg-lg">${['g','o','r','n'].map(k=>`<button data-f="${k}" class="pg-lgi"><i class="${k}"></i>${LN[k]} <b>${F[k]}</b></button>`).join('')}</div></section>
  <section class="pg-pn"><h4>المتصدرون</h4>${pod.length?`<div class="pg-pod">${pod.map(o=>`<div class="pg-p r${o.rk}"><span class="pg-av">${esc(o.r.name.charAt(0))}</span><b>${esc(o.r.name.split(' ').slice(0,2).join(' '))}</b><small>${o.r.p}%</small><div class="pg-bk">${o.rk}</div></div>`).join('')}</div>`:'<p class="muted">لا توجد نتائج بعد</p>'}</section></div>
 <div class="pg-two"><section class="pg-pn"><div class="pg-tb"><h4>الطلاب</h4><input type="search" id="q" class="pg-in" placeholder="ابحث باسم الطالب..."><select id="cs" class="pg-in"><option value="">كل السناتر</option>${cens.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div><div id="ls"></div></section>
 <section class="pg-pn"><h4>متوسط كل كورس</h4>${CR.map(c=>`<div class="pg-cr"><div><span>${esc(c.t)}</span><b>${c.p}%</b></div><div class="pg-b"><i class="${lv(c.p)}" style="width:${c.p}%"></i></div></div>`).join('')||'<p class="muted">لا توجد اختبارات محلولة</p>'}</section></div>`);
 const draw=()=>{const L=R.filter(r=>r.name.includes(S.q)&&(!S.c||r.ct===S.c)&&(!S.f||lv(r.p)===S.f));
  $('#ls').innerHTML=(S.f?`<button class="pg-clr" onclick="PGf('')">إلغاء فلتر «${LN[S.f]}» ✕</button>`:'')+(L.map(r=>{const i=R.indexOf(r)+1,l=lv(r.p);return `<div class="pg-r" onclick="GO='stu/${r.k}'"><span class="pg-rk ${i<=3&&r.p!=null?'t':''}">${i}</span><span class="pg-av s">${esc(r.name.charAt(0))}</span><div class="pg-nm"><b>${esc(r.name)}${r.bl?' <em>محظور</em>':''}</b><small>${esc(r.ct)} · ${r.n} اختبار</small></div><div class="pg-sc">${r.p==null?'<small>—</small>':`<div class="pg-b"><i class="${l}" style="width:${r.p}%"></i></div><b>${r.p}%</b>`}</div><span class="pg-bd ${l}">${LN[l]}</span></div>`}).join('')||'<div class="pg-empty"><p>لا توجد نتائج مطابقة</p></div>')};
 window.PGf=f=>{S.f=f;document.querySelectorAll('.pg-lgi').forEach(b=>b.classList.toggle('on',b.dataset.f===f));draw()};
 document.querySelectorAll('.pg-lgi').forEach(b=>b.onclick=()=>PGf(S.f===b.dataset.f?'':b.dataset.f));
 $('#q').oninput=e=>{S.q=e.target.value.trim();draw()};$('#cs').onchange=e=>{S.c=e.target.value;draw()};
 $('#csv').onclick=()=>{const q=v=>'"'+String(v).replace(/"/g,'""')+'"',t='\uFEFF'+['الترتيب,الطالب,السنتر,عدد الاختبارات,المتوسط %,المستوى'].concat(R.map((r,i)=>[i+1,q(r.name),q(r.ct),r.n,r.p??'',LN[lv(r.p)]].join(','))).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download='student-performance.csv';a.click()};
 draw()}
};
