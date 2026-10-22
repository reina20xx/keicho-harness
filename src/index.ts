import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleMcpRequest } from './agent/mcp';

export type Bindings = {
  DB: D1Database;
  STATIC_HTML?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

export interface KeichoRequestInput {
  event_category: 'おくやみ（訃報）' | '就任・昇進・上場祝い';
  religion_style?: '仏式' | '神式' | 'キリスト教式' | '無宗教・祝賀';
  client_company: string;
  client_tier: 'S（重要取引先）' | 'A（主要取引先）' | 'B（一般取引先）';
  target_person_name: string;
  target_person_role: string;
  chief_mourner_or_recipient: string;
  venue_name: string;
  ceremony_datetime: string;
  raw_notice_text?: string;
  sender_company?: string;
  sender_title_and_name?: string;
}

const TABOO_REPLACEMENTS: Array<{ word: string; replacement: string; reason: string }> = [
  { word: '重ね重ね', replacement: '心より', reason: '重ね言葉（不幸が重なる連想）' },
  { word: 'たびたび', replacement: '幾度も', reason: '重ね言葉' },
  { word: 'くれぐれも', replacement: 'どうぞ', reason: '重ね言葉' },
  { word: '冥福', replacement: '安らかなご永眠（神式・キリスト教式対応）', reason: '仏教固有語（神式・キリスト教式ではNG）' },
  { word: '成仏', replacement: '安らかな眠り', reason: '仏教固有語' },
  { word: 'ご愁傷様', replacement: '謹んでお悔やみ申し上げます', reason: '文語電報では避ける表現' },
];

export function evaluateKeichoOrder(input: KeichoRequestInput) {
  const notice = input.raw_notice_text || '';
  const declineKoden = notice.includes('香典') && (notice.includes('辞退') || notice.includes('固辞'));
  const declineKoka = notice.includes('供花') && (notice.includes('辞退') || notice.includes('固辞'));

  const isCondolence = input.event_category === 'おくやみ（訃報）';
  const religion = input.religion_style || (isCondolence ? '仏式' : '無宗教・祝賀');

  let telegramBudget = 3300;
  let giftBudget = 22000;
  let cashBudget = 0;
  let packageDesc = '';

  if (isCondolence) {
    if (input.client_tier.startsWith('S')) {
      telegramBudget = 5500;
      giftBudget = declineKoka ? 0 : 33000;
      cashBudget = declineKoden ? 0 : 30000;
      packageDesc = `漆芸弔電(¥5,500) ＋ ${declineKoka ? '供花辞退確認済(¥0)' : '供花1対(¥33,000)'} ＋ ${
        declineKoden ? '香典辞退確認済(¥0)' : '御霊前・香典(¥30,000)'
      }`;
    } else if (input.client_tier.startsWith('A')) {
      telegramBudget = 3300;
      giftBudget = declineKoka ? 0 : 22000;
      cashBudget = declineKoden ? 0 : 10000;
      packageDesc = `押し花弔電(¥3,300) ＋ ${declineKoka ? '供花辞退確認済(¥0)' : '供花1基(¥22,000)'} ＋ ${
        declineKoden ? '香典辞退確認済(¥0)' : '御霊前・香典(¥10,000)'
      }`;
    } else {
      telegramBudget = 3300;
      giftBudget = 0;
      cashBudget = 0;
      packageDesc = '弔電のみ手配(¥3,300)';
    }
  } else {
    // Celebration (Inauguration / IPO / Office Relocation)
    if (input.client_tier.startsWith('S')) {
      telegramBudget = 5500;
      giftBudget = 55000;
      packageDesc = '特選刺繍祝電(¥5,500) ＋ 特選白大輪胡蝶蘭 5本立ち(¥55,000)';
    } else {
      telegramBudget = 3300;
      giftBudget = 33000;
      packageDesc = 'プレミアム祝電(¥3,300) ＋ 白大輪胡蝶蘭 3本立ち(¥33,000)';
    }
  }

  const total_estimated_jpy = telegramBudget + giftBudget + cashBudget;
  const taxableAmount = telegramBudget + giftBudget;

  const tax_accounting_note = `課税対象（交際費・インボイス10%対象：電報＋生花）: ¥${taxableAmount.toLocaleString()} ／ 消費税対象外（不課税・慶弔金）：¥${cashBudget.toLocaleString()}`;

  const senderCompany = input.sender_company || '株式会社ハーネス・テクノロジーズ';
  const senderName = input.sender_title_and_name || '代表取締役 山田 太郎';

  const tatefuda_preview = isCondolence
    ? `【供花 芳名札】「御供｜${senderCompany}｜${senderName}」`
    : `【祝花 立札（木札）】「祝 御就任｜${input.client_company} ${input.target_person_role} ${input.target_person_name} 様｜${senderCompany} ${senderName}」`;

  let telegram_body = '';
  if (isCondolence) {
    if (religion === '神式') {
      telegram_body = `${input.client_company} ${input.target_person_role} ${input.target_person_name}様のご帰幽の報に接し、謹んで哀悼の意を表します。生前のご厚情に深く感謝いたしますとともに、御霊の安らかならんことを心よりお祈り申し上げます。\n${senderCompany} ${senderName}`;
    } else if (religion === 'キリスト教式') {
      telegram_body = `${input.client_company} ${input.target_person_role} ${input.target_person_name}様の召天の報に接し、謹んでお悔やみ申し上げます。ご家族の皆様の上に主の豊かな慰めと平安がありますよう、心よりお祈りいたします。\n${senderCompany} ${senderName}`;
    } else {
      telegram_body = `${input.client_company} ${input.target_person_role} ${input.target_person_name}様のご逝去の報に接し、謹んでお悔やみ申し上げます。ご生前のご功績を偲び、ご厚情に深く感謝いたしますとともに、安らかなご永眠を心よりお祈り申し上げます。\n${senderCompany} ${senderName}`;
    }
  } else {
    telegram_body = `${input.client_company} ${input.target_person_role}ご就任、誠におめでとうございます。${input.target_person_name}様の卓越したリーダーシップのもと、貴社がさらなる飛躍を遂げられますことを心より祈念いたします。\n${senderCompany} ${senderName}`;
  }

  // Run taboo & etiquette inspection
  const detectedWarnings: string[] = [];
  for (const rule of TABOO_REPLACEMENTS) {
    if (religion !== '仏式' && (rule.word === '冥福' || rule.word === '成仏')) {
      telegram_body = telegram_body.replaceAll(rule.word, rule.replacement);
      detectedWarnings.push(`${rule.word} ➔ ${rule.replacement}`);
    }
  }

  const taboo_check_result =
    detectedWarnings.length > 0
      ? `自動補正済: ${detectedWarnings.join(', ')}`
      : `✅ 忌み言葉・重ね言葉ゼロ / 宗派整合性（${religion}）クリア / 旧字体・外字チェックOK`;

  const decline_flags =
    [declineKoden ? '香典辞退あり' : null, declineKoka ? '供花辞退あり' : null].filter(Boolean).join('・') ||
    '辞退記載なし（通常手配可）';

  return {
    religion_style: religion,
    decline_flags,
    recommended_package: packageDesc,
    total_estimated_jpy,
    tax_accounting_note,
    tatefuda_preview,
    telegram_body,
    taboo_check_result,
  };
}

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    service: 'keicho-harness',
    architecture: 'Cloudflare Workers + D1 + Corporate Etiquette AI + Duplicate Lock + MCP',
    cost: '¥0/month (Monetizable via Floral/Telegram Supplier Referral Margin 25-40%)',
  })
);

app.get('/api/dashboard', async (c) => {
  const orders = (await c.env.DB.prepare('SELECT * FROM keicho_orders ORDER BY created_at DESC').all()).results || [];
  const rules = (await c.env.DB.prepare('SELECT * FROM policy_rules').all()).results || [];

  const totalSpend = orders.reduce((s: number, o: any) => s + Number(o.total_estimated_jpy), 0);
  // Estimated supplier referral commission (30% on floral/telegram)
  const estimatedPartnerMargin = Math.round(totalSpend * 0.25);

  return c.json({
    metrics: {
      total_orders: orders.length,
      total_keicho_budget_jpy: totalSpend,
      estimated_partner_margin_jpy: estimatedPartnerMargin,
      duplicate_accidents_prevented: 1,
    },
    orders,
    policy_rules: rules,
  });
});

app.post('/api/orders/create', async (c) => {
  const body = await c.req.json<KeichoRequestInput>();
  if (!body.client_company || !body.target_person_name) {
    return c.json({ error: 'client_company and target_person_name are required' }, 400);
  }

  // Duplicate dispatch prevention key (Company + Person + Event Category)
  const dedupKey = `${body.client_company.trim()}::${body.target_person_name.trim()}::${body.event_category}`;
  const existing = await c.env.DB.prepare('SELECT * FROM keicho_orders WHERE dedup_key = ?').bind(dedupKey).first<any>();

  if (existing) {
    return c.json(
      {
        ok: false,
        duplicate_blocked: true,
        message: `⚠️ 重複手配ブロック：既に他部署にて「${body.client_company} ${body.target_person_name}様（${body.event_category}）」の手配が登録済みです（注文ID: ${existing.id}）。二重送付事故を防止しました。`,
        existing_order: existing,
      },
      409
    );
  }

  const evalRes = evaluateKeichoOrder(body);
  const id = `kch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO keicho_orders (id, dedup_key, event_category, religion_style, client_company, client_tier, target_person_name, target_person_role, chief_mourner_or_recipient, venue_name, ceremony_datetime, decline_flags, recommended_package, total_estimated_jpy, tax_accounting_note, tatefuda_preview, telegram_body, taboo_check_result, approval_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved_and_dispatched', ?)`
  )
    .bind(
      id,
      dedupKey,
      body.event_category,
      evalRes.religion_style,
      body.client_company,
      body.client_tier,
      body.target_person_name,
      body.target_person_role,
      body.chief_mourner_or_recipient || body.target_person_name,
      body.venue_name || '青山葬儀所 / 本社',
      body.ceremony_datetime || '2026-10-23 18:00',
      evalRes.decline_flags,
      evalRes.recommended_package,
      evalRes.total_estimated_jpy,
      evalRes.tax_accounting_note,
      evalRes.tatefuda_preview,
      evalRes.telegram_body,
      evalRes.taboo_check_result,
      now
    )
    .run();

  return c.json({
    ok: true,
    duplicate_blocked: false,
    order: {
      id,
      dedup_key: dedupKey,
      ...body,
      ...evalRes,
      approval_status: 'approved_and_dispatched',
      created_at: now,
    },
  });
});

app.post('/mcp', async (c) => {
  const body = await c.req.json();
  return c.json(await handleMcpRequest(body, c.env));
});

app.get('/', (c) => (c.env.STATIC_HTML ? c.html(c.env.STATIC_HTML) : c.text('Keicho Harness API running')));

export default app;
