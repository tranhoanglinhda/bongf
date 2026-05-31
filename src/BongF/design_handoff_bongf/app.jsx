/* BongF app — routing state, tweaks, mount */
const { useState: useState_, useEffect: useEffect_ } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#33ffcc",
  "displayFont": "Cinzel",
  "radius": 14,
  "dark": false
}/*EDITMODE-END*/;

const ACCENT_DEEP = {
  "#33ffcc": "#0d7d63",
  "#7BD389": "#2f7d3f",
  "#E8A33D": "#a3690f",
  "#E0795A": "#b1432a",
  "#9A8CF0": "#4a3bb0"
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState_({ name: 'home' });
  const [data, setDataState] = useState_(window.BONGF);
  const [authed, setAuthed] = useState_(false);

  const setData = (updater) => setDataState(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    window.BONGF = next;
    return next;
  });

  const go = (r) => { setRoute(r); window.scrollTo({ top: 0, behavior: 'instant' in window ? 'auto' : 'auto' }); };

  // apply tweaks to :root
  useEffect_(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-deep', ACCENT_DEEP[t.accent] || '#0d7d63');
    const rgb = hexToRgb(t.accent);
    if (rgb) {
      root.style.setProperty('--accent-soft', `rgba(${rgb},0.24)`);
      root.style.setProperty('--accent-soft-2', `rgba(${rgb},0.15)`);
    }
    root.style.setProperty('--radius', t.radius + 'px');
    root.style.setProperty('--radius-lg', (t.radius + 8) + 'px');
    root.style.setProperty('--display', `'${t.displayFont}', serif`);
    root.style.setProperty('--serif', `'${t.displayFont}', serif`);
    document.body.classList.toggle('dark', !!t.dark);
  }, [t]);

  let screen;
  switch (route.name) {
    case 'workouts': screen = <Workouts go={go} />; break;
    case 'workout': screen = <WorkoutDetail id={route.id} go={go} />; break;
    case 'recipes': screen = <Recipes go={go} />; break;
    case 'recipe': screen = <RecipeDetail id={route.id} go={go} />; break;
    case 'shop': screen = <Shop go={go} route={route} />; break;
    case 'admin': screen = authed
      ? <AdminDashboard data={data} setData={setData} onLogout={() => { setAuthed(false); go({ name: 'home' }); }} go={go} />
      : <AdminLogin onAuth={() => setAuthed(true)} go={go} />; break;
    default: screen = <Home go={go} />;
  }

  const isAdmin = route.name === 'admin';

  return (
    <div className="shell">
      <Header route={route} go={go} />
      <main className="page-wrap">{screen}</main>
      <Footer go={go} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Màu nhấn" />
        <TweakColor label="Accent" value={t.accent}
          options={["#33ffcc", "#7BD389", "#E8A33D", "#E0795A", "#9A8CF0"]}
          onChange={v => setTweak('accent', v)} />
        <TweakSection label="Kiểu chữ tiêu đề" />
        <TweakRadio label="Display font" value={t.displayFont}
          options={["Cinzel", "Fraunces"]}
          onChange={v => setTweak('displayFont', v)} />
        <TweakSection label="Bo góc & nền" />
        <TweakSlider label="Bo góc" value={t.radius} min={4} max={26} step={1} unit="px"
          onChange={v => setTweak('radius', v)} />
        <TweakToggle label="Chế độ tối" value={t.dark} onChange={v => setTweak('dark', v)} />
      </TweaksPanel>
    </div>
  );
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
