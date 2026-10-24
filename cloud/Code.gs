// タイ語マイフレーズ：Googleスプレッドシートへのバックアップ用スクリプト
// 使い方は README.md の「クラウドにバックアップする」を見てください。
//
// 1つのスプレッドシートに、複数の人（アプリの設定で入れる「名前」ごと）の記録を入れられる。
// 作られるシート（_名前 の部分は、人ごとに別のシートになる）
//   backup_名前      … アプリの学習記録（JSON）。復元に使う。消さないこと
//   backup_prev_名前 … 前の日までのバックアップ（1世代だけ）。うっかり上書きしたときの保険
//   進捗_名前        … フレーズごとの覚えた・見た回数など。見るだけ（ここを直してもアプリには反映されない）
//   サマリ           … 人ごとの、登録数・覚えた数・最終更新

// ★ ここを、自分だけの合言葉に書き換える（アプリの設定画面にも同じものを入れる）
const SECRET = 'ここを自分だけの合言葉に変える';

const CHUNK = 40000; // 1つのセルに入れられる文字数（5万）の手前で区切る
const SHEET_SUMMARY = 'サマリ';

function doGet() {
  return out_({ ok: true, message: 'thai-phrases cloud' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (SECRET === 'ここを自分だけの合言葉に変える') return out_({ ok: false, error: 'スクリプトの SECRET（合言葉）を書き換えてください' });
    if (!req || req.key !== SECRET) return out_({ ok: false, error: '合言葉が違います' });
    const user = userOf_(req);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (req.action === 'ping') return out_(ping_(user));
      if (req.action === 'save') return out_(save_(req, user));
      if (req.action === 'load') return out_(load_(user));
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: false, error: '不明な操作です' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// 名前はシート名に使うので、20文字以内、シート名に使えない文字（[ ] * ? : / \）は不可
function userOf_(req) {
  const u = String(req.user || '').trim();
  if (!u || u.length > 20 || /[\[\]*?:\/\\]/.test(u)) throw new Error('名前は20文字以内で、[ ] * ? : / \\ は使えません');
  return u;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// 先頭行：['updatedAt', 保存日時, フレーズ数]、2行目以降：JSONを区切ったもの（先頭に 'j' を付ける。数式や数値と誤解されないため）
function readMeta_(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('backup_' + user);
  if (!sh || sh.getLastRow() < 2) return null;
  const head = sh.getRange(1, 1, 1, 3).getValues()[0];
  return { updatedAt: String(head[1] || ''), count: Number(head[2]) || 0 };
}

function ping_(user) {
  const meta = readMeta_(user);
  return { ok: true, updatedAt: meta ? meta.updatedAt : '', count: meta ? meta.count : 0 };
}

function save_(req, user) {
  const data = req.data;
  if (!data || !Array.isArray(data.phrases) || !data.phrases.length) {
    return { ok: false, error: 'フレーズが空のデータは保存しません' };
  }
  const json = JSON.stringify(data);
  const savedAt = String(req.savedAt || new Date().toISOString());
  const main = sheet_('backup_' + user);

  // 日付が変わって最初の保存のときだけ、いまのバックアップを1世代前に退避する
  const before = readMeta_(user);
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const day = (iso) => (iso ? Utilities.formatDate(new Date(iso), tz, 'yyyy-MM-dd') : '');
  if (before && day(before.updatedAt) && day(before.updatedAt) !== day(savedAt)) {
    const values = main.getDataRange().getValues();
    const prev = sheet_('backup_prev_' + user);
    prev.clear();
    prev.getRange(1, 1, values.length, 3).setValues(values.map((r) => [r[0], r[1], r[2]]));
  }

  const rows = [['updatedAt', savedAt, data.phrases.length]];
  for (let i = 0; i < json.length; i += CHUNK) rows.push(['j' + json.slice(i, i + CHUNK), '', '']);
  main.clear();
  main.getRange(1, 1, rows.length, 3).setValues(rows);

  writeProgress_(data, savedAt, user);
  return { ok: true, updatedAt: savedAt, count: data.phrases.length };
}

function load_(user) {
  const meta = readMeta_(user);
  if (!meta) return { ok: true, empty: true };
  const sh = sheet_('backup_' + user);
  const cells = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const json = cells.map((r) => String(r[0]).slice(1)).join('');
  return { ok: true, updatedAt: meta.updatedAt, count: meta.count, data: JSON.parse(json) };
}

function writeProgress_(data, savedAt, user) {
  const sh = sheet_('進捗_' + user);
  const ps = data.phrases;
  const learned = ps.filter((p) => p.learned).length;
  sh.clear();
  sh.getRange(1, 1, 1, 6).setValues([['更新', savedAt, '登録', ps.length, '覚えた', learned]]);
  const head = ['日本語', 'タイ語', 'カテゴリー', '覚えた', '見た回数', '正解', 'まだ', '最終日', '覚えた日'];
  const rows = ps.map((p) => [
    p.ja, p.th, p.cat, p.learned ? '○' : '', Number(p.seen) || 0, Number(p.hit) || 0, Number(p.miss) || 0, p.last || '', p.learnedAt || '',
  ]);
  sh.getRange(3, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  if (rows.length) sh.getRange(4, 1, rows.length, head.length).setValues(rows);
  sh.setFrozenRows(3);
  updateSummary_(user, savedAt, ps.length, learned);
}

// 人ごとに1行：名前、登録数、覚えた数、最終更新
function updateSummary_(user, savedAt, count, learned) {
  const sh = sheet_(SHEET_SUMMARY);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, 4).setValues([['名前', '登録', '覚えた', '最終更新']]).setFontWeight('bold');
  const last = sh.getLastRow();
  const names = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map((r) => String(r[0])) : [];
  const idx = names.indexOf(user);
  sh.getRange(idx >= 0 ? idx + 2 : last + 1, 1, 1, 4).setValues([[user, count, learned, savedAt]]);
}
