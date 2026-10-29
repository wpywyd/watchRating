const $ = (id) => document.getElementById(id);
let photo = null, stream = null, configured = false, busy = false, selection = 0, latest = null;
const names = { creativity: 'Creativity', appearance: 'Appearance', practicality: 'Practicality', craftsmanship: 'Craftsmanship' };
function error(message) { $('form-error').textContent = message; $('form-error').hidden = !message; }
function updateButton() { $('rate').disabled = !photo || !configured || busy; }
function clearResult() { latest = null; $('result-empty').hidden = false; $('result-content').hidden = true; $('result-content').replaceChildren(); }
function stopCamera() { stream?.getTracks().forEach(track => track.stop()); stream = null; $('camera-video').srcObject = null; $('camera-panel').hidden = true; }
async function selectPhoto(file) {
  if (!file || busy) return;
  const token = ++selection;
  error(''); stopCamera();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return error('Choose a JPG, PNG, or WebP photo. If your camera uses HEIC, export it as JPG first.');
  if (file.size > 10 * 1024 * 1024) return error('Choose a photo smaller than 10 MB.');
  let objectUrl;
  try {
    objectUrl = URL.createObjectURL(file);
    const img = new Image(); img.src = objectUrl; await img.decode();
    if (token !== selection) return;
    const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(img, 0, 0, canvas.width, canvas.height);
    photo = canvas.toDataURL('image/jpeg', .9); $('preview').src = photo; $('file-name').textContent = file.name;
    $('empty-upload').hidden = true; $('photo-preview').hidden = false; clearResult(); updateButton();
  } catch { error('That image could not be opened. Try another photo.'); }
  finally { if (objectUrl) URL.revokeObjectURL(objectUrl); }
}
$('choose-photo').addEventListener('click', () => $('photo').click());
for (const id of ['photo', 'camera-file']) $(id).addEventListener('change', (e) => { selectPhoto(e.target.files[0]); e.target.value = ''; });
$('remove-photo').addEventListener('click', () => { if (busy) return; selection++; photo = null; $('preview').removeAttribute('src'); $('photo-preview').hidden = true; $('empty-upload').hidden = false; error(''); clearResult(); updateButton(); });
for (const event of ['dragover', 'dragenter']) $('drop-zone').addEventListener(event, (e) => { e.preventDefault(); $('drop-zone').classList.add('dragging'); });
for (const event of ['dragleave', 'drop']) $('drop-zone').addEventListener(event, (e) => { e.preventDefault(); $('drop-zone').classList.remove('dragging'); if (event === 'drop') selectPhoto(e.dataTransfer.files[0]); });
$('take-photo').addEventListener('click', async () => {
  error(''); if (busy) return;
  if (!navigator.mediaDevices?.getUserMedia) { $('camera-file').click(); return; }
  stopCamera();
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 } }, audio: false }); $('camera-video').srcObject = stream; $('camera-panel').hidden = false; $('capture').focus(); }
  catch { error('Camera access is unavailable. Allow camera permission, or choose a photo instead. Camera capture needs HTTPS or localhost.'); }
});
$('cancel-camera').addEventListener('click', stopCamera);
$('capture').addEventListener('click', () => {
  const video = $('camera-video'); if (!video.videoWidth) return error('The camera is still starting. Try again in a moment.');
  const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob(blob => { if (blob) selectPhoto(new File([blob], 'My watch photo.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', .9); stopCamera();
});
window.addEventListener('pagehide', stopCamera);
function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function render(result) {
  const root = $('result-content'); root.replaceChildren(); $('result-empty').hidden = true; root.hidden = false;
  if (!result.assessable) { root.append(element('h3', 'Let’s try another photo.'), element('p', result.reason, 'result-summary')); return; }
  root.append(element('p', 'YOUR DESIGN, SEEN WITH FRESH EYES', 'result-overline'));
  const score = element('div', undefined, 'score-line'); score.append(element('strong', result.score), element('span', '/ 100')); root.append(score, element('p', 'AI FEEDBACK · FOUR EQUALLY WEIGHTED CRITERIA', 'result-label'), element('p', result.summary, 'result-summary'));
  for (const [key, name] of Object.entries(names)) { const rating = result.ratings[key]; const row = element('div', undefined, 'rating-row'); const title = element('div', undefined, 'rating-title'); title.append(element('span', name), element('b', rating.score + ' / 100')); const meter = element('div', undefined, 'meter'); const progress = element('progress'); progress.max = 100; progress.value = rating.score; progress.setAttribute('aria-label', name); meter.append(progress); row.append(title, meter, element('p', rating.feedback)); root.append(row); }
  for (const [key, title] of [['strengths', '✳ What’s working'], ['nextSteps', '↗ Ideas for your next version']]) { const block = element('div', undefined, 'feedback-block'); block.append(element('h4', title)); const list = element('ul'); for (const item of result[key]) list.append(element('li', item)); block.append(list); root.append(block); }
  root.append(element('p', result.limitations + ' AI feedback is a starting point, not a formal grade. Discuss it with your teacher.', 'limits'));
  const actions = element('div', undefined, 'result-actions'); const save = element('button', 'Save feedback ↓', 'dark-button'); save.type = 'button'; save.addEventListener('click', download); const print = element('button', 'Print review ↗', 'text-button'); print.type = 'button'; print.addEventListener('click', () => window.print()); actions.append(save, print); root.append(actions);
}
function download() { if (!latest?.assessable) return; const lines = ['WATCH STUDIO — AI design feedback', `Score: ${latest.score}/100`, latest.summary, ...Object.entries(names).map(([k, n]) => `${n}: ${latest.ratings[k].score}/100\n${latest.ratings[k].feedback}`), 'WHAT’S WORKING', ...latest.strengths, 'NEXT STEPS', ...latest.nextSteps, latest.limitations, 'AI feedback is not a formal grade.']; const url = URL.createObjectURL(new Blob([lines.join('\n\n')], { type: 'text/plain' })); const link = element('a'); link.href = url; link.download = 'my-watch-feedback.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
$('design-form').addEventListener('submit', async (e) => {
  e.preventDefault(); if (!photo || busy || !configured) return; busy = true; stopCamera(); error(''); updateButton();
  $('result-empty').hidden = true; $('result-content').hidden = true; $('result-loading').hidden = false;
  const controls = [...$('design-form').querySelectorAll('button,input,textarea')]; controls.forEach(c => c.disabled = true);
  if (window.innerWidth < 641) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try { const response = await fetch('/api/rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: photo, notes: $('notes').value, medium: document.querySelector('[name=medium]:checked').value }), signal: AbortSignal.timeout(70000) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'The assessment could not be completed.'); latest = data; render(data); }
  catch (e) { clearResult(); error(e.name === 'TimeoutError' ? 'This is taking too long. Please try again.' : e.message || 'Please check your connection and try again.'); }
  finally { busy = false; $('result-loading').hidden = true; controls.forEach(c => c.disabled = false); updateButton(); }
});
async function checkConnection() { try { const r = await fetch('/api/status'); if (!r.ok) throw new Error(); const data = await r.json(); configured = data.configured === true; $('connection').textContent = configured ? '● API key configured · Access is checked when you submit your photo.' : 'AI scoring isn’t connected yet. You can try photo upload and camera capture; the site owner must connect an AI service to enable ratings.'; } catch { $('connection').textContent = 'Unable to connect to the server. Refresh the page to try again.'; } $('connection').classList.toggle('offline', !configured); updateButton(); }
checkConnection();
