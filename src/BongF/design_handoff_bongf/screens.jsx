/* BongF screens — Home, Workouts (+detail), Recipes (+detail), Shop linktree */
const { useState: useS, useEffect: useE } = React;

/* ============ HOME ============ */
function Home({ go }) {
  const { WORKOUTS, RECIPES } = window.BONGF;
  const heroW = WORKOUTS[2];
  return (
    <div className="fade-in">
      <section className="hero">
        <Img src="https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1700&q=80" className="hero-img" alt="" label="ảnh bìa" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="eyebrow">BongF • Fitness with Bong</p>
          <h1>Move Slow,<br />Train Deep,<br /><em>Live Wild</em></h1>
          <p className="lead">Hướng dẫn tập luyện và nấu ăn lành mạnh lấy cảm hứng từ thiên nhiên — cùng những sản phẩm mình tin dùng và tuyển chọn cho hành trình của bạn.</p>
          <div className="cta-row">
            <span className="btn btn-primary" onClick={() => go({ name: 'workouts' })}><Ic name="dumbbell" /> Bắt đầu tập</span>
            <span className="btn btn-outline" onClick={() => go({ name: 'recipes' })}><Ic name="utensils" /> Xem công thức</span>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="n">{WORKOUTS.length}</div><div className="l">Bài tập</div></div>
            <div className="hero-stat"><div className="n">{RECIPES.length}</div><div className="l">Công thức</div></div>
            <div className="hero-stat"><div className="n">20+</div><div className="l">Sản phẩm</div></div>
          </div>
        </div>
      </section>

      {/* Featured workout */}
      <div className="section-head">
        <div><p className="eyebrow">Đề xuất hôm nay</p><h2>Bài tập nổi bật</h2></div>
        <span className="text-link" onClick={() => go({ name: 'workouts' })}>Tất cả bài tập <Ic name="arrowR" /></span>
      </div>
      <article className="card clickable" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) 1fr', alignItems: 'stretch' }} onClick={() => go({ name: 'workout', id: heroW.id })}>
        <div className="card-media" style={{ aspectRatio: 'auto' }}>
          <Img src={heroW.cover} alt={heroW.vi} />
          <span className="badge"><Ic name="dumbbell" style={{ width: 13, height: 13 }} /> {heroW.focus}</span>
        </div>
        <div className="card-body" style={{ justifyContent: 'center', padding: '28px 30px', gap: 14 }}>
          <p className="kicker">{heroW.title}</p>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 600, lineHeight: 1.05 }}>{heroW.vi}</h3>
          <p>{heroW.blurb}</p>
          <div className="meta-row">
            <span className="m"><Ic name="clock" /> {heroW.duration} phút</span>
            <span className="m"><Ic name="flame" /> {heroW.kcal} kcal</span>
            <span className="m"><Level value={heroW.level} /> {heroW.levelLabel}</span>
          </div>
          <span className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }}><Ic name="play" /> Tập ngay</span>
        </div>
      </article>

      {/* Featured recipes */}
      <div className="section-head">
        <div><p className="eyebrow">Ăn để khỏe</p><h2>Công thức được yêu thích</h2></div>
        <span className="text-link" onClick={() => go({ name: 'recipes' })}>Tất cả công thức <Ic name="arrowR" /></span>
      </div>
      <div className="grid grid-3">
        {RECIPES.slice(0, 3).map(r => <RecipeCard key={r.id} r={r} go={go} />)}
      </div>

      {/* Shop teaser */}
      <div className="section-head">
        <div><p className="eyebrow">Mình tin dùng</p><h2>Sản phẩm tuyển chọn</h2></div>
        <span className="text-link" onClick={() => go({ name: 'shop' })}>Mở trang Shop <Ic name="arrowR" /></span>
      </div>
      <div className="grid grid-3">
        {window.BONGF.CATEGORIES.slice(0, 3).map(c => {
          const n = window.BONGF.LINKS.filter(l => l.cat === c.id).length;
          return (
            <article key={c.id} className="card clickable" onClick={() => go({ name: 'shop', cat: c.id })}>
              <div className="card-body" style={{ gap: 12 }}>
                <span className="cat-head" style={{ margin: 0 }}>
                  <span className="ci"><Ic name={c.icon} /></span>
                  <span><h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600 }}>{c.label}</h3></span>
                </span>
                <p>{n} liên kết được tuyển chọn — bấm để xem & mua qua link affiliate.</p>
                <span className="text-link">Khám phá <Ic name="arrowR" /></span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ============ WORKOUTS ============ */
function WorkoutCard({ w, go }) {
  return (
    <article className="card clickable" onClick={() => go({ name: 'workout', id: w.id })}>
      <div className="card-media">
        <Img src={w.cover} alt={w.vi} label="ảnh bài tập" />
        <span className="badge"><Ic name="clock" style={{ width: 12, height: 12 }} /> {w.duration} phút</span>
        <span className="badge right">{w.levelLabel}</span>
      </div>
      <div className="card-body">
        <p className="kicker">{w.title}</p>
        <h3>{w.vi}</h3>
        <p>{w.blurb}</p>
        <div className="meta-row" style={{ marginTop: 'auto', paddingTop: 6 }}>
          <span className="m"><Ic name="flame" /> {w.kcal} kcal</span>
          <span className="m"><Ic name="dumbbell" /> {w.focus}</span>
          <span className="m"><Level value={w.level} /></span>
        </div>
      </div>
    </article>
  );
}

function Workouts({ go }) {
  const { WORKOUTS } = window.BONGF;
  const filters = ['Tất cả', 'Dễ', 'Trung bình', 'Khó'];
  const [f, setF] = useS('Tất cả');
  const list = f === 'Tất cả' ? WORKOUTS : WORKOUTS.filter(w => w.levelLabel === f);
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 22 }}>
        <p className="eyebrow">BongF Studio</p>
        <h1 className="display" style={{ fontSize: 'clamp(36px,6vw,64px)', margin: '8px 0' }}>Bài tập</h1>
        <p className="lead" style={{ maxWidth: 620 }}>Các buổi tập có hướng dẫn từng bước — chọn theo thời lượng và cường độ phù hợp với bạn.</p>
      </div>
      <div className="chip-row">
        {filters.map(x => <span key={x} className={'chip' + (f === x ? ' active' : '')} onClick={() => setF(x)}>{x}</span>)}
      </div>
      <div className="grid grid-3" style={{ marginTop: 22 }}>
        {list.map(w => <WorkoutCard key={w.id} w={w} go={go} />)}
      </div>
    </div>
  );
}

function WorkoutDetail({ id, go }) {
  const w = window.BONGF.WORKOUTS.find(x => x.id === id);
  const [done, setDone] = useS({});
  if (!w) return null;
  const toggle = (i) => setDone(d => ({ ...d, [i]: !d[i] }));
  const completed = Object.values(done).filter(Boolean).length;
  return (
    <div className="fade-in">
      <span className="back-link" onClick={() => go({ name: 'workouts' })}><Ic name="arrowL" /> Bài tập</span>
      <section className="detail-hero">
        <Img src={w.cover} className="dh-img" alt={w.vi} />
        <div className="hero-overlay"></div>
        <div className="dh-body">
          <p className="eyebrow">{w.title} · {w.focus}</p>
          <h1>{w.vi}</h1>
          <div className="meta-row">
            <span className="m"><Ic name="clock" /> {w.duration} phút</span>
            <span className="m"><Ic name="flame" /> {w.kcal} kcal</span>
            <span className="m"><Ic name="dumbbell" /> {w.steps.length} động tác</span>
            <span className="m"><Level value={w.level} /> {w.levelLabel}</span>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <div>
          <div className="panel">
            <h2>Các động tác</h2>
            <p className="sub">Hoàn thành {completed}/{w.steps.length} — bấm vào số thứ tự để đánh dấu.</p>
            <div className="steps">
              {w.steps.map((s, i) => (
                <div className="step" key={i}>
                  <span className="num" style={done[i] ? { background: 'var(--accent)', color: '#07120e' } : {}} onClick={() => toggle(i)}>
                    {done[i] ? <Ic name="check" style={{ width: 18, height: 18 }} /> : i + 1}
                  </span>
                  <div className="s-body"><h4>{s.name}</h4><p>{s.note}</p></div>
                  <div className="s-val">{s.val} <small>{s.unit}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="aside-sticky">
          <div className="panel">
            <h2 style={{ fontSize: 20 }}>Tổng quan</h2>
            <div className="stat-tiles" style={{ marginTop: 14 }}>
              <div className="stat-tile"><div className="n">{w.stats.kcal}</div><div className="l">Kcal</div></div>
              <div className="stat-tile"><div className="n">{w.duration}</div><div className="l">Phút</div></div>
              <div className="stat-tile"><div className="n">{w.steps.length}</div><div className="l">Động tác</div></div>
              <div className="stat-tile"><div className="n">{w.stats.level}</div><div className="l">Cấp độ</div></div>
            </div>
          </div>
          <div className="panel">
            <h2 style={{ fontSize: 20 }}>Dụng cụ</h2>
            <div className="chip-row" style={{ marginTop: 12 }}>
              {w.equipment.map(e => <span key={e} className="tag-pill">{e}</span>)}
            </div>
            <hr className="divider" />
            <p className="sub" style={{ margin: 0 }}>Mẹo</p>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>Khởi động 3 phút trước khi vào bài, giữ nhịp thở đều và uống đủ nước giữa các hiệp.</p>
            <span className="btn btn-primary btn-block" style={{ marginTop: 16 }}><Ic name="bookmark" /> Lưu buổi tập</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============ RECIPES ============ */
function RecipeCard({ r, go }) {
  return (
    <article className="card clickable" onClick={() => go({ name: 'recipe', id: r.id })}>
      <div className="card-media">
        <Img src={r.cover} alt={r.vi} label="ảnh món ăn" />
        <span className="badge"><Ic name="clock" style={{ width: 12, height: 12 }} /> {r.time} phút</span>
        <span className="badge right">{r.meal}</span>
      </div>
      <div className="card-body">
        <p className="kicker">{r.title}</p>
        <h3>{r.vi}</h3>
        <p>{r.blurb}</p>
        <div className="meta-row" style={{ marginTop: 'auto', paddingTop: 6 }}>
          <span className="m"><Ic name="flame" /> {r.kcal} kcal</span>
          <span className="m"><Ic name="users" /> {r.servings} phần</span>
        </div>
      </div>
    </article>
  );
}

function Recipes({ go }) {
  const { RECIPES } = window.BONGF;
  const meals = ['Tất cả', 'Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Đồ uống'];
  const [m, setM] = useS('Tất cả');
  const list = m === 'Tất cả' ? RECIPES : RECIPES.filter(r => r.meal === m);
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 22 }}>
        <p className="eyebrow">BongF Kitchen</p>
        <h1 className="display" style={{ fontSize: 'clamp(36px,6vw,64px)', margin: '8px 0' }}>Công thức</h1>
        <p className="lead" style={{ maxWidth: 620 }}>Những món ăn lành mạnh, dễ làm — hướng dẫn nguyên liệu và từng bước chế biến rõ ràng.</p>
      </div>
      <div className="chip-row">
        {meals.map(x => <span key={x} className={'chip' + (m === x ? ' active' : '')} onClick={() => setM(x)}>{x}</span>)}
      </div>
      <div className="grid grid-3" style={{ marginTop: 22 }}>
        {list.map(r => <RecipeCard key={r.id} r={r} go={go} />)}
      </div>
    </div>
  );
}

function RecipeDetail({ id, go }) {
  const r = window.BONGF.RECIPES.find(x => x.id === id);
  const [checked, setChecked] = useS({});
  if (!r) return null;
  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }));
  return (
    <div className="fade-in">
      <span className="back-link" onClick={() => go({ name: 'recipes' })}><Ic name="arrowL" /> Công thức</span>
      <section className="detail-hero">
        <Img src={r.cover} className="dh-img" alt={r.vi} />
        <div className="hero-overlay"></div>
        <div className="dh-body">
          <p className="eyebrow">{r.title} · {r.meal}</p>
          <h1>{r.vi}</h1>
          <div className="meta-row">
            <span className="m"><Ic name="clock" /> {r.time} phút</span>
            <span className="m"><Ic name="flame" /> {r.kcal} kcal</span>
            <span className="m"><Ic name="users" /> {r.servings} phần</span>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <div>
          <div className="panel">
            <h2>Cách làm</h2>
            <p className="sub">{r.blurb}</p>
            <div className="steps">
              {r.steps.map((s, i) => (
                <div className="step" key={i} style={{ gridTemplateColumns: '44px 1fr' }}>
                  <span className="num">{i + 1}</span>
                  <div className="s-body"><h4>{s.name}</h4><p>{s.note}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="aside-sticky">
          <div className="panel">
            <h2 style={{ fontSize: 20 }}>Nguyên liệu</h2>
            <p className="sub">Cho {r.servings} phần ăn — bấm để gạch món đã chuẩn bị.</p>
            <div className="ingredients">
              {r.ingredients.map((ing, i) => (
                <div className={'ingredient' + (checked[i] ? ' checked' : '')} key={i} onClick={() => toggle(i)}>
                  <span className="tick"><Ic name="check" /></span>
                  <span className="i-name">{ing.name}</span>
                  <span className="i-amt">{ing.amt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2 style={{ fontSize: 20 }}>Dinh dưỡng</h2>
            <div className="stat-tiles" style={{ marginTop: 14 }}>
              <div className="stat-tile"><div className="n">{r.stats.kcal}</div><div className="l">Kcal</div></div>
              <div className="stat-tile"><div className="n">{r.stats.protein}</div><div className="l">Đạm</div></div>
              <div className="stat-tile"><div className="n">{r.time}'</div><div className="l">Thời gian</div></div>
            </div>
            <span className="btn btn-primary btn-block" style={{ marginTop: 16 }}><Ic name="bookmark" /> Lưu công thức</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============ SHOP / LINKTREE ============ */
function Shop({ go, route }) {
  const { CATEGORIES, LINKS } = window.BONGF;
  const [active, setActive] = useS(route.cat || 'all');
  useE(() => { if (route.cat) setActive(route.cat); }, [route.cat]);
  const cats = active === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === active);
  return (
    <div className="fade-in">
      <div className="profile-head">
        <Img src="https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=300&q=80" className="avatar" alt="BongF" label="avatar" />
        <div>
          <h1>BongF</h1>
          <p className="handle">@fitnesswithbong</p>
        </div>
        <p className="bio">Tất cả sản phẩm mình thực sự dùng & yêu thích cho hành trình tập luyện và ăn uống lành mạnh. Mua qua link để ủng hộ mình nhé 🌿</p>
        <div className="social-row">
          <a href="#" onClick={e => e.preventDefault()} aria-label="Instagram"><Ic name="ig" /></a>
          <a href="#" onClick={e => e.preventDefault()} aria-label="TikTok"><Ic name="tiktok" /></a>
          <a href="#" onClick={e => e.preventDefault()} aria-label="YouTube"><Ic name="yt" /></a>
          <a href="#" onClick={e => e.preventDefault()} aria-label="Facebook"><Ic name="fb" /></a>
        </div>
      </div>

      <div className="chip-row" style={{ justifyContent: 'center', maxWidth: 660, margin: '20px auto 0' }}>
        <span className={'chip' + (active === 'all' ? ' active' : '')} onClick={() => setActive('all')}>Tất cả</span>
        {CATEGORIES.map(c => (
          <span key={c.id} className={'chip' + (active === c.id ? ' active' : '')} onClick={() => setActive(c.id)}>
            <span className="ico"><Ic name={c.icon} /></span>{c.label}
          </span>
        ))}
      </div>

      {cats.map(c => {
        const items = LINKS.filter(l => l.cat === c.id);
        return (
          <div key={c.id}>
            <div className="cat-head">
              <span className="ci"><Ic name={c.icon} /></span>
              <span><h3>{c.label}</h3><span className="count">{items.length} sản phẩm</span></span>
            </div>
            <div className="link-list">
              {items.map((l, i) => (
                <a className="link-row" key={i} href="#" onClick={e => e.preventDefault()}>
                  <Img src={l.thumb} className="link-thumb" alt={l.name} label="ảnh" />
                  <div className="link-main">
                    <h4>{l.name}</h4>
                    <p>{l.note}</p>
                    <div className="link-meta">
                      <span className={'shop-badge ' + l.shop}>{l.shop}</span>
                      <span className="link-price">{l.price}</span>
                    </div>
                  </div>
                  <span className="link-go"><Ic name="arrowUpR" /></span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Home, Workouts, WorkoutDetail, Recipes, RecipeDetail, Shop, WorkoutCard, RecipeCard });
