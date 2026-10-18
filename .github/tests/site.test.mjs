import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes]) => !/\bsrc\s*=/.test(attributes))
  .map(([, , source]) => source);

function application() {
  // 初期描画を待機させ、実際の判例データと検索関数をブラウザなしで検証する。
  const context = vm.createContext({
    document: { readyState: 'loading', addEventListener() {} },
  });
  for (const source of scripts) new vm.Script(source).runInContext(context);
  return expression => vm.runInContext(expression, context);
}

test('inline JavaScript and Firebase configuration parse successfully', () => {
  assert.ok(scripts.length > 0, 'inline application script is required');
  for (const source of scripts) new vm.Script(source);
  for (const file of ['firebase.json', '.firebaserc']) {
    JSON.parse(readFileSync(new URL(file, root), 'utf8'));
  }
});

test('all cases contain the fields used by list and detail views', () => {
  const run = application();
  const cases = JSON.parse(run('JSON.stringify(C)'));
  assert.ok(cases.length > 0);
  const categories = JSON.parse(run('JSON.stringify(Object.keys(TC))'));
  const urls = new Set();
  for (const [index, entry] of cases.entries()) {
    for (const field of ['original_title', 'fun_headline', 'topic', 'court', 'date', 'year',
      'hook', 'summary', 'what_happened', 'issue', 'ruling', 'takeaway', 'one_liner', 'url']) {
      assert.equal(typeof entry[field], 'string', `case ${index}: ${field}`);
      assert.ok(entry[field].trim(), `case ${index}: ${field} is empty`);
    }
    assert.equal(new URL(entry.url).protocol, 'https:');
    assert.ok(!urls.has(entry.url), `duplicate source: ${entry.url}`);
    urls.add(entry.url);
    assert.ok(Array.isArray(entry.categories) && entry.categories.length > 0);
    assert.ok(entry.categories.every(category => categories.includes(category)));
  }
});

test('category, year, lesson and text filters select cases and can be reset', () => {
  const run = application();
  assert.equal(run('getF().length'), run('C.length'));
  run("aCat = 'PM・開発管理'");
  assert.ok(run('getF().length') > 0);
  assert.ok(run("getF().every(c => c.categories.includes('PM・開発管理'))"));
  run('aYr = getF()[0].year');
  assert.ok(run('getF().length') > 0);
  assert.ok(run('getF().every(c => c.year === aYr)'));
  run("aCat = 'all'; aYr = 'all'; aLesson = C.find(c => c.lessons?.length).lessons[0]");
  assert.ok(run('getF().length') > 0);
  assert.ok(run('getF().every(c => c.lessons.includes(aLesson))'));
  run("aLesson = 'all'; sQ = C[0].original_title.toLowerCase()");
  assert.ok(run('getF().includes(C[0])'));
  run("sQ = '__no_matching_case_for_ci__'");
  assert.equal(run('getF().length'), 0);
  run("sQ = ''");
  assert.equal(run('getF().length'), run('C.length'));
});
