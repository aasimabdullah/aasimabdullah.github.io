/* Host-ready usability layer: works entirely in the browser; no API key or server required. */
const topicGroups = {
  Microbiology: ['Bacterial growth', 'Microbiology'],
  'Molecular biology': ['Lac operon', 'DNA replication'],
  Biochemistry: ['Enzyme kinetics', 'Biochemistry'],
  Genetics: ['Mendelian genetics', 'Genetics'],
  Immunology: ['Immunology'],
};
const questionBank = {
  Microbiology: [
    { q: 'Which growth phase has rapid, regular cell division?', o: ['Lag', 'Log', 'Stationary', 'Death'], a: 1, e: 'In log phase, cells divide rapidly at a fairly constant rate.', topic: 'Microbiology' },
    { q: 'What best describes the lag phase?', o: ['Cells adapt to the environment', 'Cells divide at maximum rate', 'All cells have died', 'Cell numbers stay fixed forever'], a: 0, e: 'In lag phase, cells adjust to their environment before rapid division.', topic: 'Microbiology' },
    { q: 'What often causes a culture to enter stationary phase?', o: ['Nutrient limits and waste buildup', 'DNA unwinding', 'More oxygen in every case', 'A sudden increase in cell size'], a: 0, e: 'Limited nutrients and accumulating waste can balance cell formation and death.', topic: 'Microbiology' },
  ],
  'Molecular biology': [
    { q: 'What does helicase do during DNA replication?', o: ['Joins fragments', 'Unwinds the helix', 'Builds primers', 'Proofreads proteins'], a: 1, e: 'Helicase separates DNA strands so each can serve as a template.', topic: 'Molecular biology' },
    { q: 'DNA polymerase extends a new DNA strand in which direction?', o: ['3′ to 5′', '5′ to 3′', 'Both directions equally', 'It has no direction'], a: 1, e: 'DNA polymerases add nucleotides to the 3′ end, synthesizing 5′ to 3′.', topic: 'Molecular biology' },
    { q: 'When allolactose binds the lac repressor, what happens?', o: ['It binds RNA polymerase', 'The repressor releases the operator', 'Replication stops', 'Lactose is produced'], a: 1, e: 'Allolactose changes the repressor shape, reducing its binding to the operator.', topic: 'Molecular biology' },
  ],
  Biochemistry: [
    { q: 'In Michaelis–Menten kinetics, what is Vmax?', o: ['Rate at zero substrate', 'Maximum rate at enzyme saturation', 'Substrate concentration at half rate', 'Inhibitor concentration'], a: 1, e: 'Vmax is the maximum rate predicted when enzyme active sites are saturated.', topic: 'Biochemistry' },
    { q: 'A competitive inhibitor competes with substrate for what?', o: ['Active site', 'Promoter', 'Ribosome', 'Membrane'], a: 0, e: 'A competitive inhibitor competes for binding at the enzyme active site.', topic: 'Biochemistry' },
    { q: 'At what substrate concentration is the rate Km in the basic model?', o: ['At Vmax', 'At half Vmax', 'At zero rate', 'At double Vmax'], a: 1, e: 'Km is the substrate concentration at which the rate is half Vmax in the basic model.', topic: 'Biochemistry' },
  ],
  Genetics: [
    { q: 'What genotype ratio is expected from Aa × Aa under simple Mendelian assumptions?', o: ['3:1', '1:2:1', '1:1', 'All Aa'], a: 1, e: 'The expected genotype ratio is 1 AA : 2 Aa : 1 aa.', topic: 'Genetics' },
    { q: 'What happens to allele pairs during meiosis?', o: ['They separate into gametes', 'They always mutate', 'They become proteins', 'They are copied into every gamete'], a: 0, e: 'Alleles separate so each gamete receives one allele from the pair.', topic: 'Genetics' },
    { q: 'Why can a small family differ from an expected inheritance ratio?', o: ['Ratios are probabilities across many events', 'Alleles stop segregating', 'Genes disappear', 'Dominance changes the genotype'], a: 0, e: 'Expected ratios describe probabilities; small samples can vary by chance.', topic: 'Genetics' },
  ],
  Immunology: [
    { q: 'Which cells can differentiate into antibody-secreting plasma cells?', o: ['B lymphocytes', 'Red blood cells', 'Platelets', 'Neurons'], a: 0, e: 'Activated B lymphocytes can differentiate into antibody-secreting plasma cells.', topic: 'Immunology' },
    { q: 'What is a central role of antibodies?', o: ['Bind specific antigens', 'Copy DNA', 'Digest all bacteria directly', 'Carry oxygen'], a: 0, e: 'Antibodies bind particular antigen structures and can help coordinate immune responses.', topic: 'Immunology' },
    { q: 'Which branch is associated with antigen-specific memory?', o: ['Adaptive immunity', 'Only physical barriers', 'Clotting', 'Gas exchange'], a: 0, e: 'Adaptive immune responses can generate memory cells after antigen exposure.', topic: 'Immunology' },
  ],
};
let quizQuestions = [], quizIndex = 0, quizScore = 0, quizTopicActive = 'Microbiology';
function updateToday() {
  const now = new Date();
  const label = document.getElementById('todayLabel');
  if (label) label.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  const date = document.querySelector('.top > span:last-child');
  if (date) date.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase();
}
function recordAnswer(topic, correct) {
  stats.topicAttempts ||= {};
  stats.topicAttempts[topic] ||= { correct: 0, total: 0 };
  stats.topicAttempts[topic].total++;
  if (correct) stats.topicAttempts[topic].correct++;
  save();
}
function startQuiz() {
  quizTopicActive = document.getElementById('quizTopic').value;
  quizQuestions = questionBank[quizTopicActive] || questionBank.Microbiology;
  quizIndex = 0; quizScore = 0;
  stats.quizzes++; save(); drawQ();
}
function drawQ() {
  const q = quizQuestions[quizIndex];
  document.getElementById('quizBox').innerHTML = `<div class="eyebrow">${quizTopicActive.toUpperCase()} · QUESTION ${quizIndex + 1} OF ${quizQuestions.length}</div><h3>${q.q}</h3>${q.o.map((x, i) => `<button class="option" onclick="answerQ(${i})">${String.fromCharCode(65 + i)}. &nbsp; ${x}</button>`).join('')}<div id="qFeedback"></div>`;
}
function answerQ(i) {
  const q = quizQuestions[quizIndex];
  document.querySelectorAll('.option').forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add('correct'); if (j === i && i !== q.a) b.classList.add('wrong'); });
  const correct = i === q.a;
  if (correct) { quizScore++; stats.correct++; }
  stats.attempted++;
  recordAnswer(quizTopicActive, correct);
  document.getElementById('qFeedback').innerHTML = `<div class="answer"><b>${correct ? 'That’s right!' : 'Good try — here’s the idea.'}</b><br>${q.e}</div><button class="btn" style="margin-top:12px" onclick="nextQ()">${quizIndex + 1 < quizQuestions.length ? 'Next question →' : 'See my check-in →'}</button>`;
}
function nextQ() {
  quizIndex++;
  if (quizIndex < quizQuestions.length) return drawQ();
  document.getElementById('quizBox').innerHTML = `<div class="eyebrow">${quizTopicActive.toUpperCase()} · CHECK-IN COMPLETE</div><h3>${quizScore} of ${quizQuestions.length} correct</h3><p>Quiz results are saved in this browser. Revisit anything that still feels fuzzy.</p><button class="btn" onclick="startQuiz()">Try this topic again</button>`;
}
function renderProgress() {
  document.getElementById('statQuizzes').textContent = stats.quizzes;
  document.getElementById('statCorrect').textContent = stats.attempted ? `${Math.round(stats.correct / stats.attempted * 100)}%` : '—';
  document.getElementById('statTopics').textContent = stats.topics.length;
  document.getElementById('progressList').innerHTML = subjects.map(s => {
    const attempts = stats.topicAttempts?.[s[0]];
    const pct = attempts?.total ? Math.round(attempts.correct / attempts.total * 100) : null;
    return `<div style="margin:14px 0"><div class="barrow" style="font-size:12px;margin-bottom:6px"><span>${s[1]} &nbsp;${s[0]}</span><span>${pct === null ? 'No check-ins yet' : `${pct}% · ${attempts.total} questions`}</span></div><div class="bar"><i style="width:${pct ?? 0}%"></i></div></div>`;
  }).join('') + `<p class="tiny">Scores show quiz answers saved in this browser. They are practice signals, not grades.</p><div class="row"><button class="btn" onclick="exportProgress()">Download my backup</button> <label class="btn light" for="backupInput" style="display:inline-block;cursor:pointer">Restore backup</label><input id="backupInput" class="hidden" type="file" accept="application/json" onchange="importProgress(this)"></div>`;
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), stats }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'biotutor-progress.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importProgress(input) {
  const file = input.files[0]; if (!file) return;
  file.text().then(raw => {
    const data = JSON.parse(raw);
    if (!data.stats || !Array.isArray(data.stats.topics)) throw new Error('This file does not look like a BioTutor backup.');
    stats = { quizzes: 0, correct: 0, attempted: 0, topics: [], ...data.stats }; save(); renderProgress(); toast('Progress restored on this device.');
  }).catch(() => toast('Could not restore that file. Choose a BioTutor progress backup.'));
}
function readFile(input) {
  const file = input.files[0]; if (!file) return;
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    file.text().then(text => { document.getElementById('paperText').value = text; toast('Text loaded. Make a reading guide when you’re ready.'); });
  } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const old = document.getElementById('pdfPreview'); if (old) old.remove();
    const preview = document.createElement('iframe'); preview.id = 'pdfPreview'; preview.title = 'Selected PDF preview'; preview.src = URL.createObjectURL(file); preview.style.cssText = 'width:100%;height:420px;border:1px solid #e1e8df;border-radius:9px;margin-top:12px';
    document.querySelector('#papers .panel').appendChild(preview);
    toast('PDF opened below. Copy its abstract or a passage into the box to make a reading guide.');
  } else toast('Choose a PDF or plain text file.');
}
// Keep the landing view's subject progress honest: show quiz-derived topic check-ins only.
function renderSubjects() {
  document.getElementById('subjects').innerHTML = subjects.map(s => {
    const attempts = stats.topicAttempts?.[s[0]];
    const pct = attempts?.total ? Math.round(attempts.correct / attempts.total * 100) : null;
    return `<div class="card subject" onclick="go('study')"><div style="font-size:20px">${s[1]}</div><h4>${s[0]}</h4><p>${s[3]}</p><div class="bar"><i style="width:${pct ?? 0}%"></i></div><div class="barrow"><span>${attempts?.total ? `${attempts.total} practice questions` : 'No practice yet'}</span><span>${pct === null ? '—' : `${pct}%`}</span></div></div>`;
  }).join('');
}
const originalGo = go;
go = function(page) { originalGo(page); if (page === 'home') renderSubjects(); };
updateToday(); renderSubjects();
