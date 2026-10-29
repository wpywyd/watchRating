import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, validateAssessment } from '../server.js';
import { rubric } from '../rubric.js';
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const assessment = { detectedStage: 'sketch', stageReason: 'Visible drawn outlines on paper.', assessable: true, reason: '', summary: 'A playful dial.', strengths: ['Strong contrast'], nextSteps: ['Clarify the markers'], limitations: 'Comfort cannot be judged from a photograph.', ratings: Object.fromEntries(['creativity','appearance','practicality','craftsmanship'].map((k,i) => [k, { points: Object.fromEntries(Object.keys(rubric[k]).map((indicator, j) => [indicator, j === 0 ? 2 + i : 3])), feedback: 'Visible contrast and detail.' }])) };
async function serve(t, options) { const server = createApp(options); await new Promise(r => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise(r => server.close(r))); const origin = `http://127.0.0.1:${server.address().port}`; return { get: path => fetch(origin + path), post: (body, headers = {}) => fetch(origin+'/api/rate', { method:'POST',headers:{'Content-Type':'application/json', ...headers},body:JSON.stringify(body) }) }; }
test('unconfigured site serves independently and never invents a score', async t => { const app=await serve(t,{key:''}); assert.equal((await app.get('/')).status,200); assert.deepEqual(await (await app.get('/api/status')).json(),{configured:false}); assert.equal((await app.post({image})).status,503); assert.equal((await app.get('/../server.js')).status,404); });
test('valid photo reaches provider; score is computed with equal weights', async t => { let sent; const app=await serve(t,{key:'test-key',fetchImpl:async(url,options)=>{sent=JSON.parse(options.body); return Response.json({choices:[{message:{content:JSON.stringify(assessment)}}]});}}); const res=await app.post({image,notes:'A playful design'}); assert.equal(res.status,200); const data=await res.json(); assert.equal(data.score,63); assert.equal(data.detectedStage,'sketch'); assert.equal(JSON.parse(sent.messages[1].content[0].text).medium,undefined); assert.ok(sent.response_format.json_schema.schema.required.includes('detectedStage')); assert.equal(sent.messages[1].content[1].image_url.url,image); assert.equal(sent.response_format.type,'json_schema'); });
test('invalid images, cross-origin calls, and malformed AI scores are rejected', async t => { const app=await serve(t,{key:'test',fetchImpl:async()=>Response.json({choices:[{message:{content:'{}'}}]})}); assert.equal((await app.post({image:'data:image/png;base64,AAAA',notes:''})).status,400); assert.equal((await app.post({image,notes:''},{Origin:'https://another-site.test'})).status,403); assert.equal((await app.post({image,notes:''})).status,502); assert.throws(()=>validateAssessment({...assessment,ratings:{...assessment.ratings,creativity:{...assessment.ratings.creativity,points:{...assessment.ratings.creativity.points,originalForm:6}}}})); });
test('non-watch image receives no score and provider errors do not leak details', async t => { const rejected={...assessment,assessable:false,ratings:null,reason:'Please include a watch design.'}; const app=await serve(t,{key:'test',fetchImpl:async()=>Response.json({choices:[{message:{content:JSON.stringify(rejected)}}]})}); const data=await(await app.post({image,notes:''})).json(); assert.deepEqual(data,{assessable:false,reason:'Please include a watch design.'}); const broken=await serve(t,{key:'secret',fetchImpl:async()=>new Response('private provider detail',{status:401})}); const res=await broken.post({image,notes:''}); assert.equal(res.status,502); assert.doesNotMatch(await res.text(),/private provider detail|secret/); });
test('provider failures distinguish quota, credentials, model access and rate limits safely', async t => {
  for (const [status, code, expected] of [
    [429, 'insufficient_quota', /no available API credit/],
    [401, 'invalid_api_key', /rejected the API key/],
    [404, 'model_not_found', /model or endpoint is unavailable/],
    [403, null, /Access to the AI service was denied/],
    [429, 'rate_limit_exceeded', /Wait a minute/],
    [400, null, /rejected the review format/],
    [503, null, /temporarily unable/]
  ]) {
    const app = await serve(t, { key: 'private-key-value', fetchImpl: async () => Response.json({ error: { code, message: 'private provider detail' } }, { status }) });
    const response = await app.post({ image, notes: '' });
    assert.equal(response.status, 502);
    const data = await response.json();
    assert.equal(data.providerStatus, status);
    assert.match(data.error, expected);
    assert.doesNotMatch(JSON.stringify(data), /private provider detail|private-key-value/);
  }
});
test('AI determines the stage, ignoring caller-supplied stage choices', async t => {
  for (const detectedStage of ['sketch', 'model', 'finished', 'unclear']) {
    let submitted;
    const app = await serve(t, { key: 'test', fetchImpl: async (url, options) => {
      submitted = JSON.parse(options.body);
      return Response.json({ choices: [{ message: { content: JSON.stringify({ ...assessment, detectedStage }) } }] });
    } });
    const response = await app.post({ image, notes: '', medium: 'untrusted-stage' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).detectedStage, detectedStage);
    assert.deepEqual(JSON.parse(submitted.messages[1].content[0].text), { studentNotes: '' });
  }
  assert.throws(() => validateAssessment({ ...assessment, detectedStage: 'invented-stage' }));
  assert.throws(() => validateAssessment({ ...assessment, detectedStage: undefined }));
  assert.throws(() => validateAssessment({ ...assessment, stageReason: '' }));
});
test('indicator marks use the full scale without a 70-point floor or fixed penalty', () => {
  for (const [mark, expected] of [[0, 1], [1, 20], [2, 40], [3, 60], [4, 80], [5, 100]]) {
    const ratings = Object.fromEntries(Object.entries(rubric).map(([criterion, indicators]) => [criterion, {
      points: Object.fromEntries(Object.keys(indicators).map(name => [name, mark])),
      score: 99, // Provider-supplied totals cannot override the rubric calculation.
      feedback: 'Specific evidence for this indicator.'
    }]));
    const result = validateAssessment({ ...assessment, score: 99, ratings });
    assert.equal(result.score, expected);
    for (const criterion of Object.keys(rubric)) assert.equal(result.ratings[criterion].score, expected);
  }
});
test('criteria are scored independently and incomplete indicator marks are rejected', () => {
  const creativity = { ...assessment.ratings.creativity, points: Object.fromEntries(Object.keys(rubric.creativity).map(name => [name, 1])) };
  const result = validateAssessment({ ...assessment, ratings: { ...assessment.ratings, creativity } });
  assert.equal(result.ratings.creativity.score, 20);
  assert.equal(result.ratings.appearance.score, 60);
  for (const invalid of [undefined, -1, 6, 2.5, '3']) {
    assert.throws(() => validateAssessment({ ...assessment, ratings: { ...assessment.ratings, creativity: {
      ...creativity, points: { ...creativity.points, originalForm: invalid }
    } } }));
  }
});
