-- Keicho Harness D1 Schema: B2B Condolence, Celebration Telegram, Floral Gift & Policy Engine

CREATE TABLE IF NOT EXISTS policy_rules (
  id TEXT PRIMARY KEY,
  event_category TEXT NOT NULL,
  client_tier TEXT NOT NULL,
  target_role TEXT NOT NULL,
  telegram_grade TEXT NOT NULL,
  telegram_budget_jpy INTEGER NOT NULL,
  gift_item TEXT NOT NULL,
  gift_budget_jpy INTEGER NOT NULL,
  condolence_cash_jpy INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS keicho_orders (
  id TEXT PRIMARY KEY,
  dedup_key TEXT NOT NULL UNIQUE,
  event_category TEXT NOT NULL,
  religion_style TEXT NOT NULL,
  client_company TEXT NOT NULL,
  client_tier TEXT NOT NULL,
  target_person_name TEXT NOT NULL,
  target_person_role TEXT NOT NULL,
  chief_mourner_or_recipient TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  ceremony_datetime TEXT NOT NULL,
  decline_flags TEXT NOT NULL,
  recommended_package TEXT NOT NULL,
  total_estimated_jpy INTEGER NOT NULL,
  tax_accounting_note TEXT NOT NULL,
  tatefuda_preview TEXT NOT NULL,
  telegram_body TEXT NOT NULL,
  taboo_check_result TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending_approval',
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO policy_rules (id, event_category, client_tier, target_role, telegram_grade, telegram_budget_jpy, gift_item, gift_budget_jpy, condolence_cash_jpy) VALUES
  ('pol_cond_s_exec', 'おくやみ（訃報）', 'S（重要取引先）', '代表取締役・会長', '漆芸電報（高級台紙）', 5500, '供花（生花スタンド 1対/2基）', 33000, 30000),
  ('pol_cond_a_exec', 'おくやみ（訃報）', 'A（主要取引先）', '代表取締役・役員', '布張り・押し花電報', 3300, '供花（アレンジメント 1基）', 22000, 10000),
  ('pol_celeb_s_exec', '就任・昇進・上場祝い', 'S（重要取引先）', '代表取締役・会長', '刺繍・漆芸祝電', 5500, '特選胡蝶蘭（白大輪 5本立ち）', 55000, 0),
  ('pol_celeb_a_exec', '就任・昇進・上場祝い', 'A（主要取引先）', '代表取締役・役員', 'プレミアム祝電', 3300, '胡蝶蘭（白大輪 3本立ち）', 33000, 0);
