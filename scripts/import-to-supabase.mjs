/**
 * Airtable CSV → Supabase importer
 *
 * Usage:
 *   1. Put all 9 Airtable CSV exports in ./airtable-csvs/
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   3. node scripts/import-to-supabase.mjs
 *
 * Linked-record resolution:
 *   Airtable CSV exports store links as the LINKED record's primary field value.
 *   So articles.קטגוריה holds a category's מזהה-קטגוריה, not its name.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.join(__dirname, '..', 'airtable-csvs');

const FILES = {
  categories: 'קטגוריות.csv',
  users:      'משתמשים.csv',
  articles:   'מאמרים.csv',
  events:     'אירועים.csv',
  gallery:    'גלריה.csv',
  shiurim:    'שיעורים.csv',
  videos:     'שיעורי וידאו.csv',
  questions:  'שאלות.csv',
  answers:    'תשובות.csv',
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── CSV parser ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let field = ''; let row = []; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const filtered = rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
  const [headers, ...dataRows] = filtered;
  return dataRows.map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (r[i] ?? '').trim(); });
    return obj;
  });
}

function readCSV(filename) {
  const filepath = path.join(CSV_DIR, filename);
  if (!fs.existsSync(filepath)) { console.warn(`⚠️  Missing: ${filename}`); return []; }
  const text = fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
  return parseCSV(text);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseList = (v) => (v ? v.split(/,\s*/).map((s) => s.trim()).filter(Boolean) : []);
const toBool  = (v) => v === 'checked' || v === 'true' || v === 'TRUE' || v === '1';
const toInt   = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };
const toISOOrNull = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };
const firstToken = (v) => (v ?? '').split(',')[0]?.trim();

async function insertBatch(table, rows) {
  if (!rows.length) return [];
  const { data, error } = await sb.from(table).insert(rows).select('id');
  if (error) { console.error(`❌ Insert into ${table} failed:`, error.message); throw error; }
  return data ?? [];
}

function dedupeField(rows, field) {
  const seen = new Set();
  return rows.map((r) => {
    const val = r[field];
    if (!val) return r;
    if (seen.has(val)) return { ...r, [field]: null };
    seen.add(val);
    return r;
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting Airtable → Supabase import\n');

  // ─── CATEGORIES ────────────────────────────────────────────────────────────
  console.log('📁 Importing categories...');
  const categoriesCSV = readCSV(FILES.categories);
  const categoriesInput = categoriesCSV.map((r) => ({
    _airtableKey: r['מזהה קטגוריה'], // primary field — referenced by linked tables
    name:   r['שם'] || '',
    status: r['סטטוס'] || 'פעיל',
    tables: parseList(r['טבלה']),
  })).filter((r) => r.name);
  const toInsertCats = categoriesInput.map(({ _airtableKey, ...rest }) => rest);
  const categoriesInserted = await insertBatch('categories', toInsertCats);
  const catById = new Map(); // airtable primary field value → supabase id
  categoriesInserted.forEach((r, i) => { catById.set(categoriesInput[i]._airtableKey, r.id); });
  console.log(`   ✓ ${categoriesInserted.length} categories\n`);

  // ─── USERS ─────────────────────────────────────────────────────────────────
  console.log('👥 Importing users...');
  const usersCSV = readCSV(FILES.users);
  const usersInput = usersCSV.map((r) => ({
    _airtableKey: r['מזהה משתמש'], // primary field
    name:     r['שם'] || '',
    email:    r['אימייל'] || `${Math.random().toString(36).slice(2)}@placeholder.local`,
    role:     r['תפקיד'] || 'צוות',
    status:   r['סטטוס'] || 'פעיל',
    clerk_id: r['clerk_id'] || null,
  })).filter((r) => r.name);
  const toInsertUsers = usersInput.map(({ _airtableKey, ...rest }) => rest);
  const usersInserted = await insertBatch('users', toInsertUsers);
  const userById = new Map();
  usersInserted.forEach((r, i) => { userById.set(usersInput[i]._airtableKey, r.id); });
  console.log(`   ✓ ${usersInserted.length} users\n`);

  const lookupCat  = (val) => catById.get(firstToken(val)) ?? null;
  const lookupUser = (val) => userById.get(firstToken(val)) ?? null;

  // ─── ARTICLES ──────────────────────────────────────────────────────────────
  console.log('📄 Importing articles...');
  const articlesCSV = readCSV(FILES.articles);
  const articlesInput = articlesCSV.map((r) => ({
    link_id:      r['מזהה קישור'] || null,
    title:        r['כותרת'] || '(ללא כותרת)',
    abstract:     r['תקציר'] || null,
    full_content: r['תוכן מלא'] || null,
    pdf_url:      r['קישור PDF'] || null,
    key_points:   r['נקודות מפתח'] || null,
    sources:      r['מקורות'] || null,
    read_time:    r['זמן קריאה'] || null,
    year_hebrew:  r['שנה עברית'] || null,
    year_num:     toInt(r['שנה לועזית']),
    journal:      r['כתב עת'] || null,
    yeshiva:      r['מוסד'] || null,
    status:       r['סטטוס'] || 'פעיל',
    category_id:  lookupCat(r['קטגוריה']),
    tags:         parseList(r['תגיות']),
    created_by:   lookupUser(r['נוצר על ידי']),
    updated_by:   lookupUser(r['עודכן על ידי']),
  }));
  const articlesInserted = await insertBatch('articles', dedupeField(articlesInput, 'link_id'));
  const linkedCatCount = articlesInput.filter((a) => a.category_id).length;
  console.log(`   ✓ ${articlesInserted.length} articles (${linkedCatCount} linked to categories)\n`);

  // ─── EVENTS ────────────────────────────────────────────────────────────────
  console.log('🎉 Importing events...');
  const eventsCSV = readCSV(FILES.events);
  const eventsInput = eventsCSV.map((r) => ({
    _titleKey:        r['כותרת'], // events' primary field is title — used by gallery
    link_id:          r['מזהה קישור'] || null,
    url_id:           r['מזהה URL'] || null,
    title:            r['כותרת'] || '(ללא כותרת)',
    event_type:       r['סוג אירוע'] || null,
    date_hebrew:      r['תאריך עברי'] || null,
    date_locale:      r['תאריך לועזי'] || null,
    location:         r['מיקום'] || null,
    excerpt:          r['תקציר קצר'] || null,
    description:      r['תיאור'] || null,
    full_description: r['תיאור מלא'] || null,
    participants:     r['משתתפים'] || null,
    duration:         r['משך'] || null,
    quotes:           r['ציטוטים'] || null,
    schedule:         r['לוח זמנים'] || null,
    created_by:       lookupUser(r['נוצר על ידי']),
    updated_by:       lookupUser(r['עודכן על ידי']),
  }));
  const toInsertEvents = dedupeField(eventsInput.map(({ _titleKey, ...rest }) => rest), 'link_id');
  const eventsInserted = await insertBatch('events', toInsertEvents);
  const eventByTitle = new Map();
  eventsInserted.forEach((r, i) => { eventByTitle.set(eventsInput[i]._titleKey, r.id); });
  console.log(`   ✓ ${eventsInserted.length} events\n`);

  // ─── GALLERY ───────────────────────────────────────────────────────────────
  console.log('🖼️  Importing gallery...');
  const galleryCSV = readCSV(FILES.gallery);
  const galleryInput = [];
  for (const gr of galleryCSV) {
    const url = gr['URL תמונה'];
    if (!url) continue;
    const eventTitle = firstToken(gr['קישור לאירוע']);
    const eventId = eventByTitle.get(eventTitle);
    if (!eventId) { console.warn(`   ⚠️  Gallery item has no matching event: ${url}`); continue; }
    galleryInput.push({
      event_id:   eventId,
      image_url:  url,
      caption:    gr['כיתוב'] || null,
      sort_order: toInt(gr['סדר']) ?? 99,
    });
  }
  const galleryInserted = await insertBatch('gallery', galleryInput);
  console.log(`   ✓ ${galleryInserted.length} gallery items\n`);

  // ─── SHIURIM ───────────────────────────────────────────────────────────────
  console.log('📚 Importing shiurim...');
  const shiurimCSV = readCSV(FILES.shiurim);
  const shiurimInput = shiurimCSV.map((r) => ({
    link_id:     r['מזהה קישור'] || null,
    title:       r['כותרת'] || r['שם'] || '(ללא כותרת)',
    date:        toISOOrNull(r['תאריך']),
    time:        r['שעה'] || r['זמן'] || null,
    location:    r['מיקום'] || null,
    description: r['תיאור'] || null,
    category_id: lookupCat(r['קטגוריה']),
    created_by:  lookupUser(r['נוצר על ידי']),
    updated_by:  lookupUser(r['עודכן על ידי']),
  }));
  const shiurimInserted = await insertBatch('shiurim', dedupeField(shiurimInput, 'link_id'));
  console.log(`   ✓ ${shiurimInserted.length} shiurim\n`);

  // ─── VIDEOS ────────────────────────────────────────────────────────────────
  console.log('🎥 Importing videos...');
  const videosCSV = readCSV(FILES.videos);
  const videosInput = videosCSV.map((r) => ({
    link_id:     r['מזהה קישור'] || null,
    title:       r['כותרת'] || '(ללא כותרת)',
    date:        toISOOrNull(r['תאריך']),
    duration:    r['משך'] || null,
    description: r['תיאור'] || null,
    video_type:  r['סוג סרטון'] || 'youtube',
    youtube_id:  r['מזהה יוטיוב'] || null,
    video_url:   r['קישור סרטון'] || null,
    thumbnail:   r['תמונה ממוזערת'] || null,
    views:       toInt(r['צפיות']) ?? 0,
    is_new:      toBool(r['חדש']),
    status:      r['סטטוס'] || 'פעיל',
    category_id: lookupCat(r['קטגוריה']),
    created_by:  lookupUser(r['נוצר על ידי']),
    updated_by:  lookupUser(r['עודכן על ידי']),
  }));
  const videosInserted = await insertBatch('videos', dedupeField(videosInput, 'link_id'));
  console.log(`   ✓ ${videosInserted.length} videos\n`);

  // ─── QUESTIONS ─────────────────────────────────────────────────────────────
  console.log('❓ Importing questions...');
  const questionsCSV = readCSV(FILES.questions);
  const questionsInput = questionsCSV.map((r) => ({
    _airtableKey:         r['מזהה שאלה'], // primary field — referenced by answers.שאלה
    question_content:     r['תוכן השאלה'] || '',
    asker_name:           r['שם השואל'] || null,
    asker_email:          r['אימייל השואל'] || null,
    status:               r['סטטוס'] || 'ממתין',
    consent_to_publish:   toBool(r['הסכמה לפרסום']),
    approved_to_publish:  toBool(r['מאושר לפרסום']),
    reference_id:         r['מזהה שאלה'] || null,
    category_id:          lookupCat(r['קטגוריה']),
    created_at:           toISOOrNull(r['תאריך']) ?? new Date().toISOString(),
  })).filter((r) => r.question_content);
  const toInsertQuestions = questionsInput.map(({ _airtableKey, ...rest }) => rest);
  const questionsInserted = await insertBatch('questions', toInsertQuestions);
  const questionById = new Map();
  questionsInserted.forEach((r, i) => { questionById.set(questionsInput[i]._airtableKey, r.id); });
  console.log(`   ✓ ${questionsInserted.length} questions\n`);

  // ─── ANSWERS ───────────────────────────────────────────────────────────────
  console.log('💬 Importing answers...');
  const answersCSV = readCSV(FILES.answers);
  const answersInput = answersCSV.map((r) => ({
    answer_content: r['תוכן התשובה'] || '',
    writer_type:    r['סוג כותב'] || 'רב',
    question_id:    questionById.get(firstToken(r['שאלה'])) ?? null,
    created_at:     toISOOrNull(r['תאריך']) ?? new Date().toISOString(),
  })).filter((r) => r.answer_content && r.question_id);
  const answersInserted = await insertBatch('answers', answersInput);
  console.log(`   ✓ ${answersInserted.length} answers\n`);

  console.log('✅ Import complete!');
}

main().catch((err) => { console.error('\n❌ Import failed:', err); process.exit(1); });
