/* Account access and per-user cloud history for the static BioTutor app. */
(() => {
  const initialStats = () => ({ quizzes: 0, correct: 0, attempted: 0, topics: [], topicAttempts: {}, history: [] });
  let client = null;
  let currentUser = null;
  let syncTimer = null;
  let savedStatusTimer = null;

  const loginMarkup = `
    <main class="auth-shell">
      <section class="auth-card">
        <div class="auth-brand"><span>✳</span><b>BioTutor</b></div>
        <div class="eyebrow">YOUR PERSONAL STUDY SPACE</div>
        <h1>Welcome back.</h1>
        <p class="auth-intro">Sign in to keep your lessons, quiz check-ins, and study history together.</p>
        <div id="authSetup" class="auth-setup hidden"></div>
        <div id="authApp">
          <div class="auth-tabs"><button type="button" class="active" data-auth-mode="login">Sign in</button><button type="button" data-auth-mode="signup">Create account</button></div>
          <form id="authForm" class="auth-form">
            <label id="nameWrap" class="hidden">Your name<input id="authName" autocomplete="name" maxlength="60" class="field" placeholder="How should we greet you?"></label>
            <label>Email address<input id="authEmail" type="email" autocomplete="email" required class="field" placeholder="you@example.com"></label>
            <label>Password<input id="authPassword" type="password" autocomplete="current-password" minlength="8" required class="field" placeholder="At least 8 characters"></label>
            <button id="authSubmit" class="btn" type="submit">Sign in</button>
            <p id="authMessage" role="status" class="auth-message"></p>
          </form>
          <p class="auth-privacy">Your account can only access its own saved study history.</p>
        </div>
      </section>
    </main>`;

  const style = document.createElement('style');
  style.textContent = `.app{display:none}.auth-shell{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 20% 20%,#eaf2e4 0,transparent 42%),#f7f8f4}.auth-card{width:min(100%,440px);background:white;border:1px solid #e8ece5;border-radius:20px;padding:34px;box-shadow:0 20px 65px #243a2b12}.auth-brand{display:flex;align-items:center;gap:10px;margin-bottom:35px;font-size:20px}.auth-brand span{display:grid;place-items:center;width:35px;height:35px;border-radius:11px;background:#28644c;color:#fff}.auth-card h1{font-size:29px;margin:9px 0}.auth-intro,.auth-privacy{color:#77857c;line-height:1.6}.auth-tabs{display:flex;border-bottom:1px solid #e8ece5;margin:22px 0 17px}.auth-tabs button{flex:1;padding:11px;border:0;background:none;color:#77857c;cursor:pointer;font-weight:700;border-bottom:2px solid transparent}.auth-tabs button.active{color:#28644c;border-color:#28644c}.auth-form{display:grid;gap:13px}.auth-form label{display:grid;gap:7px;color:#53645a;font-weight:600;font-size:12px}.auth-form .btn{margin-top:4px}.auth-message{min-height:18px;margin:0;color:#28644c;line-height:1.5}.auth-message.error{color:#a04b34}.auth-privacy{font-size:11px;border-top:1px solid #eff1ed;padding-top:14px;margin-bottom:0}.auth-setup{padding:14px;border-radius:10px;background:#fbf2e9;color:#705a45;line-height:1.55;font-size:13px;margin:18px 0}.auth-account{display:flex;align-items:center;gap:9px}.auth-signout{margin-left:8px;border:1px solid #e1e8df;background:white;border-radius:7px;padding:6px 9px;color:#28644c;cursor:pointer;font-size:11px}.history-item{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #eff1ed}.history-item:last-child{border-bottom:0}.history-item small{color:#77857c}.hidden{display:none!important}@media(max-width:570px){.auth-card{padding:25px 20px}.auth-brand{margin-bottom:25px}}`;
  document.head.appendChild(style);
  const shell = document.createElement('div');
  shell.id = 'authShell';
  shell.innerHTML = loginMarkup;
  document.body.prepend(shell);

  let mode = 'login';
  document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.authMode;
    document.querySelectorAll('[data-auth-mode]').forEach(b => b.classList.toggle('active', b === button));
    document.getElementById('nameWrap').classList.toggle('hidden', mode !== 'signup');
    document.getElementById('authPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    document.getElementById('authSubmit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    setMessage('');
  }));

  function setMessage(message, error = false) {
    const el = document.getElementById('authMessage');
    el.textContent = message;
    el.classList.toggle('error', error);
  }
  function showSetup() {
    document.getElementById('authApp').classList.add('hidden');
    const setup = document.getElementById('authSetup');
    setup.classList.remove('hidden');
    setup.innerHTML = `Accounts need a Supabase project. Add its project URL and <b>publishable</b> key to <code>supabase-config.js</code>, then run <code>supabase-schema.sql</code> in the project's SQL Editor. See the README for steps. This app will not save passwords in the browser.`;
  }
  function setSignedIn(user) {
    currentUser = user;
    document.getElementById('authShell').classList.add('hidden');
    document.querySelector('.app').style.display = '';
    addAccountControls(user);
  }
  function addAccountControls(user) {
    const userBox = document.querySelector('.user');
    if (userBox) {
      userBox.innerHTML = `<div class="auth-account"><span class="avatar">${escapeHtml((user.user_metadata?.display_name || user.email || 'S').slice(0,1).toUpperCase())}</span><div><strong>${escapeHtml(user.user_metadata?.display_name || user.email)}</strong><small>${escapeHtml(user.email || '')}</small></div><button class="auth-signout" id="signOut">Sign out</button></div>`;
      document.getElementById('signOut').addEventListener('click', async () => {
        await flushSave();
        const { error } = await client.auth.signOut();
        if (error) alert(error.message);
      });
    }
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  async function loadUserData(user) {
    const { data, error } = await client.from('biotutor_user_data').select('display_name,study_data').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    const perUserCacheKey = `biotutor.user.${user.id}.stats`;
    let study = data?.study_data;
    if (!study) {
      try { study = JSON.parse(localStorage.getItem(perUserCacheKey) || 'null'); } catch {}
      study ||= initialStats();
      const { error: insertError } = await client.from('biotutor_user_data').upsert({ user_id: user.id, display_name: user.user_metadata?.display_name || '', study_data: study }, { onConflict: 'user_id' });
      if (insertError) throw insertError;
    }
    Object.assign(stats, initialStats(), study);
    localStorage.setItem(perUserCacheKey, JSON.stringify(stats));
    save();
    if (typeof renderProgress === 'function') renderProgress();
    if (typeof renderSubjects === 'function') renderSubjects();
    renderHistory();
  }
  function scheduleSave() {
    if (!currentUser) return;
    localStorage.setItem(`biotutor.user.${currentUser.id}.stats`, JSON.stringify(stats));
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flushSave, 700);
    const el = document.getElementById('saveIndicator');
    if (el) el.textContent = 'Saving…';
  }
  async function flushSave() {
    if (!currentUser || !client) return;
    clearTimeout(syncTimer);
    const payload = { user_id: currentUser.id, display_name: currentUser.user_metadata?.display_name || '', study_data: stats, updated_at: new Date().toISOString() };
    const { error } = await client.from('biotutor_user_data').upsert(payload, { onConflict: 'user_id' });
    const indicator = document.getElementById('saveIndicator');
    if (indicator) indicator.textContent = error ? 'Cloud save failed · retry by changing progress' : 'Saved to your account';
  }
  function renderHistory() {
    const host = document.getElementById('studyHistory');
    if (!host) return;
    const items = (stats.history || []).slice(0, 12);
    host.innerHTML = items.length ? items.map(item => `<div class="history-item"><b>${escapeHtml(item.title)}</b><small>${new Date(item.at).toLocaleString()}</small></div>`).join('') : '<p class="tiny">Your lesson visits will appear here as you study.</p>';
    const indicator = document.getElementById('saveIndicator');
    if (indicator) indicator.textContent = 'History is private to your account';
  }
  function addHistory(title) {
    if (!currentUser) return;
    stats.history ||= [];
    const last = stats.history[0];
    if (!last || last.title !== title || Date.now() - new Date(last.at).getTime() > 60000) {
      stats.history.unshift({ title, at: new Date().toISOString() });
      stats.history = stats.history.slice(0, 100);
      save(); renderHistory();
    }
  }

  // Replace local-only progress writes with namespaced cache + per-user cloud sync.
  window.save = scheduleSave;
  const previousShowLesson = window.showLesson;
  window.showLesson = function(title) { previousShowLesson(title); addHistory(title); };
  const previousNextQ = window.nextQ;
  window.nextQ = function() {
    if (currentUser && quizIndex + 1 >= quizQuestions.length) {
      stats.history ||= [];
      stats.history.unshift({ title: `${quizTopicActive} quiz · ${quizScore}/${quizQuestions.length}`, at: new Date().toISOString() });
      stats.history = stats.history.slice(0, 100);
      save();
    }
    previousNextQ();
    renderHistory();
  };
  const oldRenderProgress = window.renderProgress;
  window.renderProgress = function() {
    oldRenderProgress();
    const host = document.getElementById('progressList');
    if (host && !document.getElementById('studyHistory')) {
      host.insertAdjacentHTML('beforeend', `<section style="margin-top:24px"><h3>Recent study history</h3><div id="studyHistory"></div><p id="saveIndicator" class="tiny">Sign in to sync history across devices.</p></section>`);
    }
    renderHistory();
  };
  // update the profile card even when a user signs in from an existing session
  const oldRenderSubjects = window.renderSubjects;
  window.renderSubjects = function() { oldRenderSubjects(); };

  document.getElementById('authForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return showSetup();
    const button = document.getElementById('authSubmit');
    button.disabled = true; setMessage(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    try {
      if (mode === 'signup') {
        const display_name = document.getElementById('authName').value.trim();
        const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name } } });
        if (error) throw error;
        if (data.session) setMessage('Account created. Opening your study space…');
        else setMessage('Check your email to confirm your account, then sign in here.');
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) { setMessage(error.message || 'Could not complete sign in. Please try again.', true); }
    finally { button.disabled = false; }
  });

  async function init() {
    if (!window.BIOTUTOR_SUPABASE_URL || !window.BIOTUTOR_SUPABASE_PUBLISHABLE_KEY || !window.supabase?.createClient) return showSetup();
    client = window.supabase.createClient(window.BIOTUTOR_SUPABASE_URL, window.BIOTUTOR_SUPABASE_PUBLISHABLE_KEY);
    const { data: { session }, error } = await client.auth.getSession();
    if (error) return setMessage(error.message, true);
    if (session?.user) {
      setSignedIn(session.user);
      try { await loadUserData(session.user); }
      catch (err) { document.getElementById('authShell').classList.remove('hidden'); document.querySelector('.app').style.display = 'none'; setMessage(`Could not load your account data: ${err.message}`, true); }
    } else showSetupWhenConfigured();
    client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        setSignedIn(nextSession.user);
        try { await loadUserData(nextSession.user); } catch (err) { alert(`Could not load study history: ${err.message}`); }
      } else {
        currentUser = null;
        document.querySelector('.app').style.display = 'none';
        document.getElementById('authShell').classList.remove('hidden');
      }
    });
  }
  function showSetupWhenConfigured() {
    document.getElementById('authApp').classList.remove('hidden');
    document.getElementById('authSetup').classList.add('hidden');
  }
  init();
})();
