/* BongF Admin — login gate + CRUD dashboard for Workouts / Recipes / Links.
   Prototype state lives in React (seeded from window.BONGF). */
const { useState: useAS } = React;

/* ---- Login ---- */
function AdminLogin({ onAuth, go }) {
  const [email, setEmail] = useAS('admin@bongf.com');
  const [pw, setPw] = useAS('12345678');
  const [err, setErr] = useAS('');
  const submit = (e) => {
    e.preventDefault();
    if (email.trim() && pw.length >= 6) { setErr(''); onAuth(); }
    else setErr('Email hoặc mật khẩu chưa hợp lệ.');
  };
  return (
    <div className="admin-login fade-in">
      <div className="box">
        <div className="mark"><Ic name="lock" /></div>
        <h1>Admin</h1>
        <p className="lead">BongF Dashboard · Khu vực quản trị</p>
        <form onSubmit={submit}>
          <label className="field"><span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="field"><span>Mật khẩu</span>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} required />
          </label>
          {err && <p className="error-text">{err}</p>}
          <button className="btn btn-primary btn-block" type="submit"><Ic name="lock" /> Đăng nhập</button>
        </form>
        <p className="hint">Demo: bất kỳ email + mật khẩu ≥ 6 ký tự. <span className="text-link" onClick={() => go({ name: 'home' })}>← Về trang chủ</span></p>
      </div>
    </div>
  );
}

/* ---- Dashboard ---- */
const EMPTY = {
  workout: { vi: '', title: '', cover: '', levelLabel: 'Dễ', level: 1, duration: 10, kcal: 100, focus: 'Toàn thân', blurb: '' },
  recipe: { vi: '', title: '', cover: '', meal: 'Bữa sáng', time: 10, servings: 1, kcal: 300, blurb: '' },
  link: { name: '', cat: 'apparel', shop: 'shopee', price: '', note: '', thumb: '' },
};

function AdminDashboard({ data, setData, onLogout, go }) {
  const [tab, setTab] = useAS('workout');
  const [form, setForm] = useAS(EMPTY.workout);
  const [editId, setEditId] = useAS(null);
  const { CATEGORIES } = window.BONGF;

  const switchTab = (t) => { setTab(t); setForm(EMPTY[t]); setEditId(null); };
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const list = tab === 'workout' ? data.WORKOUTS : tab === 'recipe' ? data.RECIPES : data.LINKS;
  const key = tab === 'workout' ? 'WORKOUTS' : tab === 'recipe' ? 'RECIPES' : 'LINKS';

  const startEdit = (item, idx) => { setEditId(idx); setForm({ ...EMPTY[tab], ...item }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancel = () => { setForm(EMPTY[tab]); setEditId(null); };
  const remove = (idx) => setData(d => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));

  const save = (e) => {
    e.preventDefault();
    const item = { ...form };
    if (tab !== 'link' && !item.id) item.id = (item.vi || item.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Math.random().toString(36).slice(2, 5);
    if (tab === 'workout') { item.steps = item.steps || []; item.tags = item.tags || []; item.equipment = item.equipment || ['Thảm tập']; item.stats = { kcal: item.kcal, time: item.duration + ' phút', moves: (item.steps || []).length, level: item.levelLabel }; }
    if (tab === 'recipe') { item.steps = item.steps || []; item.ingredients = item.ingredients || []; item.tags = item.tags || []; item.level = 'Dễ'; item.stats = { kcal: item.kcal, time: item.time + ' phút', servings: item.servings, protein: item.protein || '—' }; }
    setData(d => {
      const arr = [...d[key]];
      if (editId !== null) arr[editId] = item; else arr.unshift(item);
      return { ...d, [key]: arr };
    });
    cancel();
  };

  const catLabel = (id) => (CATEGORIES.find(c => c.id === id) || {}).label || id;

  return (
    <div className="fade-in">
      <div className="admin-bar">
        <div className="a-title"><span className="leaf"><Ic name="leaf" /></span><h1>Admin Dashboard</h1></div>
        <div className="admin-actions">
          <span className="btn btn-outline btn-sm" onClick={() => go({ name: 'home' })}><Ic name="external" /> Xem website</span>
          <span className="btn btn-ghost btn-sm" onClick={onLogout}><Ic name="logout" /> Đăng xuất</span>
        </div>
      </div>

      <div className="admin-tabs">
        <span className={'admin-tab' + (tab === 'workout' ? ' active' : '')} onClick={() => switchTab('workout')}><Ic name="dumbbell" /> Bài tập <span style={{ opacity: .6 }}>({data.WORKOUTS.length})</span></span>
        <span className={'admin-tab' + (tab === 'recipe' ? ' active' : '')} onClick={() => switchTab('recipe')}><Ic name="utensils" /> Công thức <span style={{ opacity: .6 }}>({data.RECIPES.length})</span></span>
        <span className={'admin-tab' + (tab === 'link' ? ' active' : '')} onClick={() => switchTab('link')}><Ic name="bolt" /> Link affiliate <span style={{ opacity: .6 }}>({data.LINKS.length})</span></span>
      </div>

      <div className="admin-grid">
        {/* form */}
        <div className="panel admin-form-panel">
          <h2 style={{ fontSize: 21 }}>{editId !== null ? 'Sửa' : 'Thêm mới'} {tab === 'workout' ? 'bài tập' : tab === 'recipe' ? 'công thức' : 'link'}</h2>
          <form onSubmit={save}>
            {tab === 'workout' && <>
              <label className="field"><span>Tên (Tiếng Việt)</span><input value={form.vi} onChange={e => upd('vi', e.target.value)} placeholder="Khởi động buổi sáng" required /></label>
              <label className="field"><span>Tên hiển thị (kicker)</span><input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="Morning Flow" /></label>
              <label className="field"><span>Ảnh bìa (URL)</span><input type="url" value={form.cover} onChange={e => upd('cover', e.target.value)} placeholder="https://..." /></label>
              <div className="seg">
                {['Dễ', 'Trung bình', 'Khó'].map((lv, i) => <button type="button" key={lv} className={form.levelLabel === lv ? 'on' : ''} onClick={() => { upd('levelLabel', lv); upd('level', i + 1); }}>{lv}</button>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <label className="field"><span>Thời lượng (phút)</span><input type="number" value={form.duration} onChange={e => upd('duration', +e.target.value)} /></label>
                <label className="field"><span>Kcal</span><input type="number" value={form.kcal} onChange={e => upd('kcal', +e.target.value)} /></label>
              </div>
              <label className="field"><span>Nhóm cơ / focus</span><input value={form.focus} onChange={e => upd('focus', e.target.value)} /></label>
              <label className="field"><span>Mô tả</span><textarea value={form.blurb} onChange={e => upd('blurb', e.target.value)} /></label>
            </>}

            {tab === 'recipe' && <>
              <label className="field"><span>Tên món (Tiếng Việt)</span><input value={form.vi} onChange={e => upd('vi', e.target.value)} placeholder="Salad ức gà nướng" required /></label>
              <label className="field"><span>Tên hiển thị (kicker)</span><input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="Garden Chicken" /></label>
              <label className="field"><span>Ảnh bìa (URL)</span><input type="url" value={form.cover} onChange={e => upd('cover', e.target.value)} placeholder="https://..." /></label>
              <label className="field"><span>Bữa ăn</span>
                <select value={form.meal} onChange={e => upd('meal', e.target.value)}>
                  {['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Đồ uống'].map(m => <option key={m}>{m}</option>)}
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 11 }}>
                <label className="field"><span>Phút</span><input type="number" value={form.time} onChange={e => upd('time', +e.target.value)} /></label>
                <label className="field"><span>Phần</span><input type="number" value={form.servings} onChange={e => upd('servings', +e.target.value)} /></label>
                <label className="field"><span>Kcal</span><input type="number" value={form.kcal} onChange={e => upd('kcal', +e.target.value)} /></label>
              </div>
              <label className="field"><span>Mô tả</span><textarea value={form.blurb} onChange={e => upd('blurb', e.target.value)} /></label>
            </>}

            {tab === 'link' && <>
              <label className="field"><span>Tên sản phẩm</span><input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Legging tập nâng mông" required /></label>
              <label className="field"><span>Danh mục</span>
                <select value={form.cat} onChange={e => upd('cat', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <label className="field"><span>Sàn</span>
                <select value={form.shop} onChange={e => upd('shop', e.target.value)}>
                  {['shopee', 'amazon', 'lazada', 'tiktok'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <label className="field"><span>Giá</span><input value={form.price} onChange={e => upd('price', e.target.value)} placeholder="₫389k" /></label>
                <label className="field"><span>Ảnh (URL)</span><input type="url" value={form.thumb} onChange={e => upd('thumb', e.target.value)} placeholder="https://..." /></label>
              </div>
              <label className="field"><span>Ghi chú ngắn</span><input value={form.note} onChange={e => upd('note', e.target.value)} /></label>
            </>}

            <div style={{ display: 'flex', gap: 9, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" style={{ flex: 1 }}><Ic name={editId !== null ? 'pencil' : 'plus'} /> {editId !== null ? 'Cập nhật' : 'Thêm'}</button>
              {editId !== null && <button className="btn btn-outline" type="button" onClick={cancel}>Huỷ</button>}
            </div>
          </form>
        </div>

        {/* list */}
        <div className="panel">
          <h2 style={{ fontSize: 21 }}>Danh sách</h2>
          <p className="sub">Bấm sửa để chỉnh, hoặc xoá khỏi danh sách.</p>
          <div className="admin-list">
            {list.length === 0 && <div className="empty-box">Chưa có mục nào. Thêm từ form bên trái.</div>}
            {list.map((item, idx) => (
              <div className="admin-row" key={idx}>
                <Img src={tab === 'link' ? item.thumb : item.cover} className="thumb" label="ảnh" />
                <div className="r-body">
                  <h4>{tab === 'link' ? item.name : item.vi}</h4>
                  <p>{tab === 'workout' ? `${item.levelLabel} · ${item.duration} phút · ${item.kcal} kcal`
                    : tab === 'recipe' ? `${item.meal} · ${item.time} phút · ${item.kcal} kcal`
                    : `${catLabel(item.cat)} · ${item.shop} · ${item.price}`}</p>
                </div>
                <div className="r-actions">
                  <button className="icon-btn" title="Sửa" onClick={() => startEdit(item, idx)}><Ic name="pencil" /></button>
                  <button className="icon-btn danger" title="Xoá" onClick={() => remove(idx)}><Ic name="trash" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminLogin, AdminDashboard });
