/* ============================================================
   كتاب الحضور والغياب — لوحة المسئول
   قاعدة البيانات:
   attSessions/{sid}        {center,title,ts,date,time,month,day,closed}
   attRecords/{sid}/{code}  {s:'p|l|e|a', at}     p حاضر / l متأخر / e بعذر / a غائب
   attPayments/{code}/{YYYY-MM} {status:'paid|free', amount, at}
   attSettings              {absLimit,graceDays,fee,lateMin}
   attLog/{id}              {code,name,type:'block|unblock',reason,by,at}
   users/{code}             blocked, blockReason, blockedAt, attFrom, attOverride{at,month}
   ============================================================ */
(function () {
  const ATT = window.ATT = {};
  const AR_D = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const ST = { p: { t: 'حاضر' }, l: { t: 'متأخر' }, e: { t: 'بعذر' }, a: { t: 'غائب' } };
  const RS = { absence: 'غياب متواصل', payment: 'عدم دفع الاشتراك', 'absence+payment': 'غياب وعدم دفع', manual: 'حظر يدوي' };
  const DEF = { absLimit: 2, graceDays: 0, fee: 0, lateMin: 15 };
  const pad = n => String(n).padStart(2, '0');
  const mk = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  const dk = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const tk = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const fT = ts => new Date(ts).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  const fD = ts => new Date(ts).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const fDay = ts => AR_D[new Date(ts).getDay()];
  const fM = k => { const [y, m] = k.split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }); };
  const nxt = (k, d) => { let [y, m] = k.split('-').map(Number); m += d; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + '-' + pad(m); };
  let D = null, S = { tab: 'sheet', center: null, sid: null, f: '', q: '', month: mk(Date.now()), pf: '', pq: '' };

  /* ---------- بيانات ---------- */
  async function load() {
    const [A, R, P, T, U, Z] = await Promise.all([g('attSessions'), g('attRecords'), g('attPayments'), g('attSettings'), g('users'), g('centers')]);
    D = { sess: A || {}, rec: R || {}, pay: P || {}, set: Object.assign({}, DEF, T || {}), users: U || {}, centers: Object.fromEntries(Object.entries(Z || {}).filter(([k]) => k.length === 4)) };
    Object.entries(D.sess).forEach(([id, s]) => s.id = id);
    if (!S.center || !D.centers[S.center]) S.center = (localStorage.att_center && D.centers[localStorage.att_center]) ? localStorage.att_center : Object.keys(D.centers)[0] || null;
  }
  const sessOf = c => Object.values(D.sess).filter(s => s.center === c).sort((a, b) => a.ts - b.ts);
  const roster = (c, s) => Object.entries(D.users).filter(([k, u]) => k.length === 12 && k.slice(0, 4) === c && u && u.name && (!s || !u.createdAt || u.createdAt <= s.ts + 864e5 || (D.rec[s.id] || {})[k])).sort((a, b) => a[1].name.localeCompare(b[1].name, 'ar'));
  const payOf = (k, m) => (D.pay[k] || {})[m];
  const paidOk = (k, m) => { const p = payOf(k, m); return !!(p && (p.status === 'paid' || p.status === 'free')); };
  const recOf = (sid, k) => (D.rec[sid] || {})[k];

  /* ---------- محرك الحظر / الفك التلقائي ---------- */
  function overdue(u, pay, set, now) {
    if (!u.attFrom) return [];
    const out = [], grace = (set.graceDays || 0) * 864e5;
    let [y, m] = u.attFrom.split('-').map(Number);
    for (let i = 0; i < 120; i++) {
      if (now < new Date(y, m, 1).getTime() + grace) break;
      const k = y + '-' + pad(m), p = pay && pay[k];
      if (!(p && (p.status === 'paid' || p.status === 'free'))) out.push(k);
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }
  function ev(code) {
    const u = D.users[code] || {}, ov = u.attOverride, now = Date.now(), st = [];
    sessOf(code.slice(0, 4)).forEach(s => { const r = recOf(s.id, code); if (r && (!ov || s.ts > ov.at)) st.push(r.s); });
    let streak = 0;
    for (let i = st.length - 1; i >= 0; i--) { if (st[i] === 'e') continue; if (st[i] === 'a') streak++; else break; }
    const od = overdue(u, D.pay[code], D.set, now), payBlock = od.length > 0 && !(ov && ov.month === mk(now)), absBlock = streak >= D.set.absLimit;
    return { streak, od, absBlock, payBlock, reasons: [absBlock && 'absence', payBlock && 'payment'].filter(Boolean) };
  }
  function plan(code, up, logs) {
    const u = D.users[code]; if (!u || !u.name) return;
    const e = ev(code), auto = /^(absence|payment)/.test(u.blockReason || ''), now = Date.now();
    if (e.reasons.length) {
      const r = e.reasons.join('+');
      if (!u.blocked) {
        up[`users/${code}/blocked`] = true; up[`users/${code}/blockReason`] = r; up[`users/${code}/blockedAt`] = now;
        u.blocked = true; u.blockReason = r; u.blockedAt = now; logs.push({ code, name: u.name, type: 'block', reason: r, by: 'auto' });
      } else if (auto && u.blockReason !== r) { up[`users/${code}/blockReason`] = r; u.blockReason = r; }
    } else if (u.blocked && auto) {
      logs.push({ code, name: u.name, type: 'unblock', reason: u.blockReason, by: 'auto' });
      up[`users/${code}/blocked`] = false; up[`users/${code}/blockReason`] = null; up[`users/${code}/blockedAt`] = null;
      u.blocked = false; delete u.blockReason; delete u.blockedAt;
    }
  }
  async function flush(up, logs) {
    logs.forEach(l => { up['attLog/' + rid()] = Object.assign({ at: Date.now() }, l); });
    if (Object.keys(up).length) await db.ref().update(up);
    const b = logs.filter(l => l.type === 'block'), u = logs.filter(l => l.type === 'unblock');
    if (b.length) flash('تم حظر ' + b.map(l => l.name).join('، ') + ' تلقائيًا — ' + (RS[b[0].reason] || ''), 'bad');
    if (u.length) flash('تم فك الحظر تلقائيًا عن ' + u.map(l => l.name).join('، '), 'ok');
    return logs.length;
  }
  async function autoSync() { const up = {}, logs = []; Object.keys(D.users).forEach(k => { if (k.length === 12) plan(k, up, logs); }); return flush(up, logs); }
  async function setMany(sid, pairs, noToggle) {
    const s0 = D.sess[sid], up = {}, logs = [], now = Date.now(); D.rec[sid] = D.rec[sid] || {};
    pairs.forEach(([code, s]) => {
      const u = D.users[code]; if (!u) return; const cur = D.rec[sid][code];
      if (!noToggle && cur && cur.s === s) s = null;
      if (s) { const r = { s, at: now }; D.rec[sid][code] = r; up[`attRecords/${sid}/${code}`] = r; if (!u.attFrom) { u.attFrom = s0.month; up[`users/${code}/attFrom`] = s0.month; } }
      else { delete D.rec[sid][code]; up[`attRecords/${sid}/${code}`] = null; }
      plan(code, up, logs);
    });
    await flush(up, logs);
  }

  /* ---------- أدوات واجهة ---------- */
  function flash(msg, t) {
    let el = document.getElementById('atToast'); if (!el) { document.body.insertAdjacentHTML('beforeend', '<div id="atToast"></div>'); el = document.getElementById('atToast'); }
    const d = document.createElement('div'); d.className = 'at-t ' + (t || ''); d.textContent = msg; el.appendChild(d); setTimeout(() => d.remove(), 5200);
  }
  function modal(h) { ATT.close(); document.body.insertAdjacentHTML('beforeend', `<div class="amodal" id="atM" onclick="if(event.target===this)ATT.close()"><div class="box at-md">${h}</div></div>`); }
  ATT.close = () => { const m = document.getElementById('atM'); if (m) m.remove(); };
  const cnt = s => { const n = { p: 0, l: 0, e: 0, a: 0, n: 0 }; roster(s.center, s).forEach(([k]) => { const r = recOf(s.id, k); n[r ? r.s : 'n']++; }); return n; };
  const blkChip = u => u.blocked ? `<span class="chip bad">محظور — ${RS[u.blockReason] || 'حظر يدوي'}</span>` : '';
  const dots = (k, c, upto) => sessOf(c).filter(s => s.ts <= upto).slice(-6).map(s => { const r = (recOf(s.id, k) || {}).s; return `<i class="d ${r || 'n'}" title="${fDay(s.ts)} ${fD(s.ts)} — ${r ? ST[r].t : 'لم يُسجَّل'}"></i>`; }).join('');
  const csvDl = (name, rows) => { const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' })); a.download = name; a.click(); };

  /* ---------- الصفحة ---------- */
  async function render() {
    M('<div id="attRoot"><p class="muted" style="text-align:center;padding:40px">جاري التحميل...</p></div>');
    await load(); paint(); if (await autoSync()) paint();
  }
  function paint() {
    const R = $('#attRoot'); if (!R) return; const c = S.center;
    const head = PG.hd('كتاب الحضور والغياب', 'سجّل الحصة والدفع — والحظر وفك الحظر بيحصلوا تلقائيًا',
      `<select id="atC" class="pg-in" onchange="ATT.center(this.value)">${Object.entries(D.centers).map(([k, n]) => `<option value="${k}" ${k === c ? 'selected' : ''}>${esc(n)} — ${k}</option>`).join('')}</select><button class="btn btn-primary btn-sm" onclick="ATT.newS()">${icon('plus', 'icon-sm')} حصة جديدة</button>`);
    if (!c) { R.innerHTML = head + `<div class="pg-pn pg-empty">${icon('users', 'icon-lg')}<p>أضف سنتر الأول من صفحة «توليد أكواد»</p></div>`; return; }
    const T = [['sheet', 'الحضور'], ['pay', 'المدفوعات'], ['watch', 'المتابعة'], ['log', 'السجل'], ['set', 'الإعدادات']];
    R.innerHTML = head + '<div class="pg-ks" id="atK"></div><div class="tabs">' + T.map(t => `<button class="btn btn-sm ${S.tab === t[0] ? 'btn-primary' : 'btn-outline'}" onclick="ATT.tab('${t[0]}')">${t[1]}</button>`).join('') + '</div><div id="atB"></div>';
    kpi(); body();
  }
  function kpi() {
    const c = S.center, cm = mk(Date.now()), L = roster(c), ss = sessOf(c), last = ss[ss.length - 1]; let blk = 0, unp = 0, risk = 0;
    L.forEach(([k, u]) => { if (u.blocked) blk++; if (!paidOk(k, cm)) unp++; const e = ev(k); if (!u.blocked && e.streak > 0 && e.streak === D.set.absLimit - 1) risk++; });
    let rate = '—'; if (last) { const n = cnt(last), t = n.p + n.l + n.a; if (t) rate = Math.round((n.p + n.l) / t * 100) + '%'; }
    $('#atK').innerHTML = PG.kpi('users', L.length, 'طالب في السنتر') + PG.kpi('calendar', ss.filter(s => s.month === cm).length, 'حصة هذا الشهر') + PG.kpi('circleCheck', rate, 'حضور آخر حصة', 'ok') + PG.kpi('shield', blk, 'محظور الآن', blk ? 'bad' : '') + PG.kpi('clock', risk, 'في خطر الحظر', risk ? 'bad' : '') + PG.kpi('bell', unp, 'لم يدفعوا الشهر', unp ? 'bad' : '');
  }
  function body() { const b = $('#atB'); if (!b) return; ({ sheet, pay: payTab, watch, log, set: setTab })[S.tab](b); }
  ATT.tab = t => { S.tab = t; paint(); };
  ATT.center = c => { S.center = c; S.sid = null; localStorage.att_center = c; paint(); };

  /* ---------- تبويب الحضور ---------- */
  function sheet(b) {
    const c = S.center, ss = sessOf(c).slice().reverse();
    if (!ss.length) { b.innerHTML = `<div class="pg-pn pg-empty">${icon('calendar', 'icon-lg')}<p>لا توجد حصص لهذا السنتر بعد</p><button class="btn btn-primary btn-sm" onclick="ATT.newS()">+ إنشاء أول حصة</button></div>`; return; }
    if (!D.sess[S.sid] || D.sess[S.sid].center !== c) S.sid = ss[0].id;
    const strip = ss.slice(0, 40).map(s => { const n = cnt(s); return `<button class="at-s ${s.id === S.sid ? 'on' : ''}" onclick="ATT.pick('${s.id}')"><b>${fDay(s.ts)}</b><span>${fD(s.ts)}</span><small>${fT(s.ts)} · ${n.p + n.l} حاضر / ${n.a} غائب</small></button>`; }).join('');
    const s = D.sess[S.sid];
    b.innerHTML = `<div class="at-strip">${strip}</div><section class="pg-pn at-panel"><div class="at-ph"><div><h3>${esc(s.title || 'حصة')} ${s.closed ? '<span class="chip">مغلقة</span>' : ''}</h3><p class="muted" style="margin:0">${fDay(s.ts)} ${fD(s.ts)} — الساعة ${fT(s.ts)}</p></div><div id="atSum" class="at-sum"></div></div>
      <div class="at-tools"><input id="atScan" class="pg-in" inputmode="numeric" autocomplete="off" placeholder="اكتب أو امسح كود الطالب ثم Enter" onkeydown="if(event.key==='Enter')ATT.scan()"><input id="atQ" class="pg-in" type="search" placeholder="بحث بالاسم أو الكود" value="${esc(S.q)}" oninput="ATT.q(this.value)"><select class="pg-in" onchange="ATT.f(this.value)">${[['', 'الكل'], ['n', 'لم يُسجَّل'], ['p', 'حاضر'], ['l', 'متأخر'], ['a', 'غائب'], ['e', 'بعذر'], ['blk', 'المحظورون']].map(o => `<option value="${o[0]}" ${S.f === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
      <div class="acts at-acts"><button class="btn btn-outline btn-sm" onclick="ATT.all()">${icon('check', 'icon-sm')} تحضير غير المسجلين</button><button class="btn btn-outline btn-sm" onclick="ATT.end()">إنهاء الحصة وتسجيل الغياب</button><button class="btn btn-outline btn-sm" onclick="ATT.print()">طباعة</button><button class="btn btn-outline btn-sm" onclick="ATT.csv()">تصدير CSV</button><button class="btn btn-outline btn-sm dang" onclick="ATT.delS()">${icon('trash', 'icon-sm')} حذف الحصة</button></div>
      <div id="atL"></div></section>`;
    drawSum(); drawList(); if (matchMedia('(pointer:fine)').matches) { const e = $('#atScan'); if (e) e.focus(); }
  }
  function drawSum() {
    const s = D.sess[S.sid], el = $('#atSum'); if (!s || !el) return; const n = cnt(s);
    el.innerHTML = `<div class="at-bar">${['p', 'l', 'e', 'a'].map(k => n[k] ? `<i class="${k}" style="flex:${n[k]}"></i>` : '').join('') + (n.n ? `<i class="n" style="flex:${n.n}"></i>` : '')}</div><div class="at-lg"><span><i class="p"></i>حاضر ${n.p}</span><span><i class="l"></i>متأخر ${n.l}</span><span><i class="e"></i>بعذر ${n.e}</span><span><i class="a"></i>غائب ${n.a}</span><span><i class="n"></i>لم يُسجَّل ${n.n}</span></div>`;
  }
  function drawList() {
    const s = D.sess[S.sid], el = $('#atL'); if (!s || !el) return; const cm = s.month;
    const L = roster(s.center, s).filter(([k, u]) => { const r = recOf(s.id, k), st = r ? r.s : 'n'; return (!S.f || (S.f === 'blk' ? u.blocked : S.f === st)) && (!S.q || (u.name + k).includes(S.q)); });
    el.innerHTML = L.map(([k, u]) => {
      const r = recOf(s.id, k) || {}, e = ev(k), pd = paidOk(k, cm), pr = payOf(k, cm);
      const warn = !u.blocked && e.streak > 0 && e.streak === D.set.absLimit - 1 ? `<span class="chip warn">إنذار: غاب ${e.streak} متواصل</span>` : '';
      return `<div class="at-r ${u.blocked ? 'blk' : ''}"><span class="pg-av s" onclick="ATT.stu('${k}')">${esc(u.name.charAt(0))}</span>
        <div class="at-nm" onclick="ATT.stu('${k}')"><b>${esc(u.name)}</b><small>${k} ${blkChip(u)} ${warn}</small></div>
        <div class="at-dots" title="آخر 6 حصص">${dots(k, s.center, s.ts)}</div>
        <div class="at-bs">${['p', 'l', 'e', 'a'].map(x => `<button class="at-b ${x} ${r.s === x ? 'on' : ''}" onclick="ATT.mark('${k}','${x}')">${ST[x].t}</button>`).join('')}</div>
        <small class="at-tm">${r.at ? 'سُجّل ' + fT(r.at) : ''}</small>
        <button class="at-pay ${pd ? 'ok' : 'no'}" onclick="ATT.payDlg('${k}','${cm}')">${pd ? (pr.status === 'free' ? 'معفى' : 'مدفوع') : 'غير مدفوع'}</button></div>`;
    }).join('') || '<div class="pg-empty"><p>لا توجد نتائج</p></div>';
  }
  const refresh = () => { drawSum(); drawList(); kpi(); const st = document.querySelectorAll('.at-s'); sessOf(S.center).slice().reverse().slice(0, 40).forEach((s, i) => { const n = cnt(s), sm = st[i] && st[i].querySelector('small'); if (sm) sm.textContent = fT(s.ts) + ' · ' + (n.p + n.l) + ' حاضر / ' + n.a + ' غائب'; }); };
  ATT.pick = id => { S.sid = id; paint(); };
  ATT.q = v => { S.q = v.trim(); drawList(); };
  ATT.f = v => { S.f = v; drawList(); };
  ATT.mark = async (k, st) => { await setMany(S.sid, [[k, st]]); refresh(); };
  ATT.scan = async () => {
    const el = $('#atScan'), v = el.value.trim(); el.value = ''; const s = D.sess[S.sid]; if (!v || !s) return;
    const L = roster(s.center, s).map(x => x[0]); let hit = L.filter(k => k === v); if (!hit.length && /^\d{4,11}$/.test(v)) hit = L.filter(k => k.endsWith(v));
    if (hit.length !== 1) return flash(hit.length ? 'أكتر من طالب بنفس الأرقام — اكتب الكود كامل' : 'الكود ده مش موجود في السنتر ده', 'bad');
    const k = hit[0], u = D.users[k], late = D.set.lateMin > 0 && Date.now() > s.ts + D.set.lateMin * 6e4, st = late ? 'l' : 'p';
    await setMany(s.id, [[k, st]], true); flash(u.name + ' — ' + ST[st].t + ' ' + fT(Date.now()) + (u.blocked ? ' (الحساب محظور: ' + (RS[u.blockReason] || 'حظر يدوي') + ')' : ''), u.blocked ? 'warn' : 'ok'); refresh(); el.focus();
  };
  ATT.all = async () => { const s = D.sess[S.sid], P = roster(s.center, s).filter(([k]) => !recOf(s.id, k)).map(([k]) => [k, 'p']); if (!P.length) return flash('كل الطلاب متسجلين', 'warn'); await setMany(s.id, P, true); refresh(); };
  ATT.end = async () => {
    const s = D.sess[S.sid], P = roster(s.center, s).filter(([k]) => !recOf(s.id, k)).map(([k]) => [k, 'a']);
    if (!confirm(P.length ? 'هيتسجل ' + P.length + ' طالب غياب (اللي ما اتسجلوش). اللي يوصل للحد المسموح هيتعمل له بلوك تلقائيًا. تأكيد؟' : 'إنهاء الحصة؟')) return;
    if (P.length) await setMany(s.id, P, true); s.closed = true; await db.ref('attSessions/' + s.id + '/closed').set(true); paint();
  };
  ATT.delS = async () => {
    const s = D.sess[S.sid]; if (!confirm('حذف حصة ' + fDay(s.ts) + ' ' + fD(s.ts) + ' وكل تسجيلاتها؟ (الحظر هيتحسب من جديد)')) return;
    delete D.sess[s.id]; delete D.rec[s.id]; S.sid = null; await db.ref().update({ ['attSessions/' + s.id]: null, ['attRecords/' + s.id]: null }); await autoSync(); paint();
  };
  ATT.newS = () => {
    const now = Date.now();
    modal(`<h3>حصة جديدة</h3><div class="at-f"><label class="muted">السنتر</label><select id="nsC">${Object.entries(D.centers).map(([k, n]) => `<option value="${k}" ${k === S.center ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <label class="muted">اسم الحصة</label><input type="text" id="nsT" value="حصة" placeholder="مثال: الحصة 5 — الباب الثالث">
      <div class="grid" style="gap:8px"><div><label class="muted">التاريخ</label><input type="date" id="nsD" value="${dk(now)}" onchange="ATT.nsDay()"></div><div><label class="muted">الساعة</label><input type="time" id="nsH" value="${tk(now)}"></div></div>
      <p class="muted" id="nsDay" style="margin:0 0 10px">اليوم: ${fDay(now)}</p></div>
      <div class="acts"><button class="btn btn-primary btn-sm" onclick="ATT.saveS()">إنشاء الحصة</button><button class="btn btn-outline btn-sm" onclick="ATT.close()">إلغاء</button></div>`);
  };
  ATT.nsDay = () => { const v = $('#nsD').value; if (v) $('#nsDay').textContent = 'اليوم: ' + fDay(new Date(v + 'T12:00').getTime()); };
  ATT.saveS = async () => {
    const c = $('#nsC').value, d = $('#nsD').value, h = $('#nsH').value; if (!c || !d || !h) return alert('اكمل التاريخ والساعة');
    const ts = new Date(d + 'T' + h).getTime(), id = rid(), o = { center: c, title: $('#nsT').value.trim() || 'حصة', ts, date: d, time: h, month: mk(ts), day: fDay(ts), createdAt: Date.now() };
    await db.ref('attSessions/' + id).set(o); D.sess[id] = Object.assign({ id }, o); S.center = c; S.sid = id; S.tab = 'sheet'; ATT.close(); paint();
  };
  ATT.print = () => {
    const s = D.sess[S.sid], L = roster(s.center, s);
    $('#pr').innerHTML = `<div class="at-pt"><h2>منصة د. علاء صبح — كتاب الحضور</h2><p>${esc(D.centers[s.center] || '')} · ${esc(s.title)} · ${fDay(s.ts)} ${fD(s.ts)} — ${fT(s.ts)}</p><table><tr><th>#</th><th>الطالب</th><th>الكود</th><th>الحالة</th><th>وقت التسجيل</th><th>الاشتراك</th></tr>${L.map(([k, u], i) => { const r = recOf(s.id, k) || {}; return `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${k}</td><td>${r.s ? ST[r.s].t : '—'}</td><td>${r.at ? fT(r.at) : ''}</td><td>${paidOk(k, s.month) ? 'مدفوع' : 'غير مدفوع'}</td></tr>`; }).join('')}</table></div>`;
    window.print(); setTimeout(() => $('#pr').innerHTML = '', 500);
  };
  ATT.csv = () => { const s = D.sess[S.sid]; csvDl('attendance-' + s.date + '.csv', [['الطالب', 'الكود', 'اليوم', 'التاريخ', 'ساعة الحصة', 'الحالة', 'وقت التسجيل', 'اشتراك الشهر']].concat(roster(s.center, s).map(([k, u]) => { const r = recOf(s.id, k) || {}; return [u.name, k, fDay(s.ts), s.date, s.time, r.s ? ST[r.s].t : 'لم يُسجَّل', r.at ? tk(r.at) : '', paidOk(k, s.month) ? 'مدفوع' : 'غير مدفوع']; }))); };

  /* ---------- المدفوعات ---------- */
  function monthDue(m) { const [y, mo] = m.split('-').map(Number); return Date.now() >= new Date(y, mo, 1).getTime() + D.set.graceDays * 864e5; }
  function payTab(b) {
    const c = S.center, m = S.month, L = roster(c); let paid = 0, free = 0, tot = 0;
    L.forEach(([k]) => { const p = payOf(k, m); if (p && p.status === 'paid') { paid++; tot += +p.amount || 0; } else if (p && p.status === 'free') free++; });
    b.innerHTML = `<section class="pg-pn"><div class="at-mn"><button class="btn btn-outline btn-sm" onclick="ATT.mon(-1)">→</button><h3>${fM(m)}</h3><button class="btn btn-outline btn-sm" onclick="ATT.mon(1)">←</button>
      <span class="chip">مدفوع ${paid}</span><span class="chip">معفى ${free}</span><span class="chip bad">غير مدفوع ${L.length - paid - free}</span><span class="chip">المحصّل ${tot} ج</span>
      <div class="acts" style="margin-inline-start:auto"><input type="search" class="pg-in" placeholder="بحث..." value="${esc(S.pq)}" oninput="ATT.pq(this.value)"><select class="pg-in" onchange="ATT.pf(this.value)">${[['', 'الكل'], ['paid', 'مدفوع'], ['free', 'معفى'], ['n', 'غير مدفوع']].map(o => `<option value="${o[0]}" ${S.pf === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select><button class="btn btn-outline btn-sm" onclick="ATT.monthCsv()">تقرير الشهر CSV</button></div></div><div id="atP"></div></section>`; drawPay();
  }
  function drawPay() {
    const c = S.center, m = S.month, el = $('#atP'); if (!el) return;
    el.innerHTML = roster(c).filter(([k, u]) => { const p = payOf(k, m), st = p ? p.status : 'n'; return (!S.pf || S.pf === st) && (!S.pq || (u.name + k).includes(S.pq)); }).map(([k, u]) => {
      const p = payOf(k, m), late = !p && u.attFrom && u.attFrom <= m && monthDue(m);
      const chip = p ? `<span class="chip ok">${p.status === 'free' ? 'معفى' : 'مدفوع · ' + (+p.amount || 0) + ' ج'}</span> <small class="muted">${fD(p.at)}</small>` : late ? '<span class="chip bad">متأخر</span>' : '<span class="chip warn">غير مدفوع</span>';
      return `<div class="at-r"><span class="pg-av s">${esc(u.name.charAt(0))}</span><div class="at-nm" onclick="ATT.stu('${k}')"><b>${esc(u.name)}</b><small>${k} ${blkChip(u)}</small></div><div>${chip}</div><button class="btn ${p ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="ATT.payDlg('${k}','${m}')">${p ? 'تعديل' : 'تسجيل دفع'}</button></div>`;
    }).join('') || '<div class="pg-empty"><p>لا توجد نتائج</p></div>';
  }
  ATT.mon = d => { S.month = nxt(S.month, d); body(); };
  ATT.pq = v => { S.pq = v.trim(); drawPay(); };
  ATT.pf = v => { S.pf = v; drawPay(); };
  ATT.payDlg = (k, m) => {
    const u = D.users[k], p = payOf(k, m) || {};
    modal(`<h3>اشتراك ${fM(m)}</h3><p class="muted">${esc(u.name)} — ${k}</p><div class="at-f"><label class="muted">الحالة</label><select id="pdS"><option value="paid" ${p.status !== 'free' ? 'selected' : ''}>مدفوع</option><option value="free" ${p.status === 'free' ? 'selected' : ''}>معفى (بدون دفع)</option></select><label class="muted">المبلغ (جنيه)</label><input type="number" id="pdA" min="0" value="${p.amount ?? D.set.fee ?? 0}"></div>
      <p class="muted">بمجرد الحفظ، لو الحساب كان محظور بسبب الدفع بيتفتح تلقائيًا.</p><div class="acts"><button class="btn btn-primary btn-sm" onclick="ATT.savePay('${k}','${m}')">حفظ</button>${p.status ? `<button class="btn btn-outline btn-sm dang" onclick="ATT.savePay('${k}','${m}',1)">إلغاء الدفع</button>` : ''}<button class="btn btn-outline btn-sm" onclick="ATT.close()">إغلاق</button></div>`);
  };
  ATT.savePay = async (k, m, cancel) => {
    const up = {}, logs = [], v = cancel ? null : { status: $('#pdS').value, amount: Math.max(0, +$('#pdA').value || 0), at: Date.now() };
    D.pay[k] = D.pay[k] || {}; if (v) D.pay[k][m] = v; else delete D.pay[k][m]; up[`attPayments/${k}/${m}`] = v;
    plan(k, up, logs); await flush(up, logs); ATT.close(); paint();
  };
  ATT.monthCsv = () => {
    const c = S.center, m = S.month, ss = sessOf(c).filter(s => s.month === m);
    csvDl('report-' + m + '.csv', [['الطالب', 'الكود'].concat(ss.map(s => fDay(s.ts) + ' ' + s.date + ' ' + s.time), ['حضور', 'غياب', 'نسبة الحضور %', 'الاشتراك', 'المبلغ', 'حالة الحساب'])].concat(roster(c).map(([k, u]) => {
      let p = 0, a = 0; const cells = ss.map(s => { const r = (recOf(s.id, k) || {}).s; if (r === 'p' || r === 'l') p++; if (r === 'a') a++; return r ? ST[r].t : '—'; }), py = payOf(k, m);
      return [u.name, k].concat(cells, [p, a, p + a ? Math.round(p / (p + a) * 100) : '', py ? (py.status === 'free' ? 'معفى' : 'مدفوع') : 'غير مدفوع', py ? py.amount || 0 : '', u.blocked ? 'محظور — ' + (RS[u.blockReason] || 'حظر يدوي') : 'نشط']);
    })));
  };

  /* ---------- المتابعة ---------- */
  function watch(b) {
    const c = S.center, L = roster(c), blk = [], risk = [], od = [];
    L.forEach(([k, u]) => { const e = ev(k); if (u.blocked) blk.push([k, u, e]); else if (e.streak > 0 && e.streak === D.set.absLimit - 1) risk.push([k, u, e]); if (e.od.length) od.push([k, u, e]); });
    const row = (k, u, x, act) => `<div class="at-r"><span class="pg-av s">${esc(u.name.charAt(0))}</span><div class="at-nm" onclick="ATT.stu('${k}')"><b>${esc(u.name)}</b><small>${k} · ${x}</small></div>${act}</div>`;
    b.innerHTML = `<div class="ad-two"><section class="pg-pn"><h4>محظورون الآن (${blk.length})</h4>${blk.map(([k, u, e]) => row(k, u, (RS[u.blockReason] || 'حظر يدوي') + (u.blockedAt ? ' · منذ ' + fD(u.blockedAt) : ''), `<button class="btn btn-primary btn-sm" onclick="ATT.unblock('${k}')">فتح يدوي</button>`)).join('') || '<p class="muted">لا يوجد محظورون</p>'}</section>
      <section class="pg-pn"><h4>في خطر الحظر (${risk.length})</h4><p class="muted">غاب ${D.set.absLimit - 1} متواصل — الغياب الجاي هيعمل بلوك</p>${risk.map(([k, u, e]) => row(k, u, 'غياب متواصل: ' + e.streak, `<button class="btn btn-outline btn-sm" onclick="ATT.stu('${k}')">السجل</button>`)).join('') || '<p class="muted">لا يوجد</p>'}
      <h4 style="margin-top:18px">متأخرون في الاشتراك (${od.length})</h4>${od.map(([k, u, e]) => row(k, u, 'شهور غير مدفوعة: ' + e.od.map(fM).join('، '), `<button class="btn btn-primary btn-sm" onclick="ATT.payDlg('${k}','${e.od[0]}')">تسجيل دفع</button>`)).join('') || '<p class="muted">لا يوجد</p>'}</section></div>`;
  }
  ATT.unblock = async k => {
    const u = D.users[k]; if (!confirm('فتح حساب ' + u.name + ' يدويًا؟\nهيفضل مفتوح، والغياب المتواصل بيتحسب من جديد من دلوقتي، وحظر الدفع بيتأجل لحد الشهر الجاي.')) return;
    const now = Date.now(), ov = { at: now, month: mk(now) };
    Object.assign(u, { blocked: false, attOverride: ov }); delete u.blockReason; delete u.blockedAt;
    await flush({ [`users/${k}/blocked`]: false, [`users/${k}/blockReason`]: null, [`users/${k}/blockedAt`]: null, [`users/${k}/attOverride`]: ov }, [{ code: k, name: u.name, type: 'unblock', reason: 'manual-open', by: 'admin' }]); ATT.close(); paint();
  };
  ATT.block = async k => {
    const u = D.users[k]; if (!confirm('حظر ' + u.name + ' من المنصة يدويًا؟ (مش هيتفتح تلقائيًا، لازم تفتحه إنت)')) return;
    Object.assign(u, { blocked: true, blockReason: 'manual', blockedAt: Date.now() });
    await flush({ [`users/${k}/blocked`]: true, [`users/${k}/blockReason`]: 'manual', [`users/${k}/blockedAt`]: u.blockedAt }, [{ code: k, name: u.name, type: 'block', reason: 'manual', by: 'admin' }]); ATT.close(); paint();
  };

  /* ---------- ملف الطالب ---------- */
  ATT.stu = k => {
    const u = D.users[k], c = k.slice(0, 4), e = ev(k), cm = mk(Date.now()), from = u.attFrom ? new Date(+u.attFrom.slice(0, 4), +u.attFrom.slice(5) - 1, 1).getTime() : 0;
    const H = sessOf(c).filter(s => recOf(s.id, k) || s.ts >= from).reverse().slice(0, 40); let p = 0, a = 0; sessOf(c).forEach(s => { const r = (recOf(s.id, k) || {}).s; if (r === 'p' || r === 'l') p++; if (r === 'a') a++; });
    const ms = []; if (u.attFrom) { for (let m = u.attFrom; m <= cm; m = nxt(m, 1)) ms.push(m); } else ms.push(cm);
    modal(`<div class="row" style="border:0"><h3 style="margin:0">${esc(u.name)}</h3>${u.blocked ? blkChip(u) : '<span class="chip ok">الحساب نشط</span>'}</div><p class="muted">الكود ${k} · هاتف ${esc(u.phone || '—')} · ولي الأمر ${esc(u.parentPhone || '—')}</p>
      <div class="pg-ks" style="margin-bottom:10px">${PG.kpi('circleCheck', p, 'حضور', 'ok') + PG.kpi('circleXmark', a, 'غياب', a ? 'bad' : '') + PG.kpi('clock', e.streak, 'غياب متواصل', e.streak ? 'bad' : '')}</div>
      <h4>الاشتراكات</h4><div class="at-ms">${ms.map(m => { const ok = paidOk(k, m); return `<button class="at-pay ${ok ? 'ok' : (monthDue(m) ? 'no' : 'mid')}" onclick="ATT.payDlg('${k}','${m}')">${fM(m)}<small>${ok ? (payOf(k, m).status === 'free' ? 'معفى' : 'مدفوع') : 'غير مدفوع'}</small></button>`; }).join('')}</div>
      <h4 style="margin-top:14px">سجل الحضور</h4><div class="at-hs">${H.map(s => { const r = recOf(s.id, k); return `<div class="at-hr"><span>${fDay(s.ts)} ${fD(s.ts)}</span><span class="muted">${fT(s.ts)} · ${esc(s.title)}</span><span class="at-b ${r ? r.s : ''} on" style="${r ? '' : 'background:var(--cream);color:var(--text-muted);border-color:var(--border)'}">${r ? ST[r.s].t : 'لم يُسجَّل'}</span><small class="muted">${r ? fT(r.at) : ''}</small></div>`; }).join('') || '<p class="muted">لا يوجد سجل بعد</p>'}</div>
      <div class="acts" style="margin-top:14px">${u.blocked ? `<button class="btn btn-primary btn-sm" onclick="ATT.unblock('${k}')">فتح الحساب يدويًا</button>` : `<button class="btn btn-outline btn-sm dang" onclick="ATT.block('${k}')">حظر يدوي</button>`}<button class="btn btn-outline btn-sm" onclick="ATT.close()">إغلاق</button></div>`);
  };

  /* ---------- السجل والإعدادات ---------- */
  async function log(b) {
    b.innerHTML = '<section class="pg-pn"><h4>سجل الحظر والفك (آخر 150 حدث)</h4><div id="atLg"><p class="muted">جاري التحميل...</p></div></section>';
    const s = await db.ref('attLog').orderByChild('at').limitToLast(150).once('value'), L = []; s.forEach(x => { L.unshift(x.val()); });
    const T = l => l.type === 'block' ? (l.by === 'auto' ? 'حظر تلقائي — ' + (RS[l.reason] || '') : 'حظر يدوي من المسئول') : (l.by === 'auto' ? 'فك تلقائي بعد ' + (l.reason === 'payment' ? 'الدفع' : l.reason === 'absence' ? 'الحضور' : 'الحضور/الدفع') : 'فتح يدوي من المسئول');
    const el = $('#atLg'); if (el) el.innerHTML = L.filter(l => l && String(l.code).slice(0, 4) === S.center).map(l => `<div class="at-r"><span class="pg-av s" style="${l.type === 'block' ? 'background:#fdecec;color:var(--danger)' : 'background:var(--teal-pale);color:var(--teal)'}">${l.type === 'block' ? '⛔' : '✔'}</span><div class="at-nm"><b>${esc(l.name || l.code)}</b><small>${T(l)}</small></div><small class="muted">${fDay(l.at)} ${fD(l.at)} · ${fT(l.at)}</small></div>`).join('') || '<p class="muted">لا توجد أحداث بعد</p>';
  }
  function setTab(b) {
    const s = D.set;
    b.innerHTML = `<section class="pg-pn at-f"><h4>قواعد الحظر التلقائي</h4><div class="grid"><div><label class="muted">الحظر بعد غياب متواصل (حصص)</label><input type="number" id="stA" min="1" max="10" value="${s.absLimit}"></div><div><label class="muted">مهلة الدفع بعد نهاية الشهر (أيام)</label><input type="number" id="stG" min="0" max="30" value="${s.graceDays}"></div><div><label class="muted">قيمة الاشتراك الافتراضية (ج)</label><input type="number" id="stF" min="0" value="${s.fee}"></div><div><label class="muted">اعتبار المتأخر بعد (دقيقة) من بداية الحصة — للمسح بالكود (0 = إيقاف)</label><input type="number" id="stL" min="0" max="120" value="${s.lateMin}"></div></div>
      <ul class="muted" style="line-height:2"><li>الغياب المتواصل: لو آخر ${s.absLimit} حصص اتسجل فيهم غياب ورا بعض → بلوك. حضور (أو تأخير) أي حصة بعدها → بيتفتح لوحده. «بعذر» مش بيتحسب ولا بيقطع التسلسل.</li><li>الاشتراك: الشهر اللي يعدي من غير دفع (بعد المهلة) → بلوك. أول ما يتسجل الدفع → بيتفتح لوحده. بيتحسب من أول شهر ظهر فيه الطالب في الكتاب.</li><li>الفتح اليدوي من المسئول بيفضل شغال، والغياب بيتحسب من جديد بعده.</li></ul>
      <div class="acts"><button class="btn btn-primary btn-sm" onclick="ATT.saveSet()">حفظ الإعدادات</button><button class="btn btn-outline btn-sm" onclick="ATT.sync()">مزامنة الحظر الآن</button></div></section>`;
  }
  ATT.saveSet = async () => {
    const v = { absLimit: Math.max(1, Math.min(10, parseInt($('#stA').value) || 2)), graceDays: Math.max(0, Math.min(30, parseInt($('#stG').value) || 0)), fee: Math.max(0, +$('#stF').value || 0), lateMin: Math.max(0, Math.min(120, parseInt($('#stL').value) || 0)) };
    await db.ref('attSettings').set(v); D.set = Object.assign({}, DEF, v); await autoSync(); flash('تم حفظ الإعدادات', 'ok'); paint();
  };
  ATT.sync = async () => { const n = await autoSync(); if (!n) flash('كل الحسابات مطابقة للقواعد — مفيش تغيير', 'ok'); paint(); };

  ATT._ = { ev, plan, overdue, setD: x => D = x, getD: () => D };
  PG.views = Object.assign(PG.views || {}, { att: render });
})();
