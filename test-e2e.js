const BASE = process.env.BASE_URL || 'http://localhost:8799';

async function runTests() {
  console.log('=== Keicho Harness E2E Test Suite ===');

  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  if (health.status !== 'ok') throw new Error('Health failed');
  console.log('✅ 1. Health check passed:', health.service);

  // 2. Create Condolence Order with Koden Decline flag & Shinto style
  const payload = {
    event_category: 'おくやみ（訃報）',
    religion_style: '神式',
    client_company: '株式会社東都ホールディングス',
    client_tier: 'S（重要取引先）',
    target_person_name: '齋藤 宗一郎',
    target_person_role: '名誉会長',
    chief_mourner_or_recipient: '齋藤 健一',
    venue_name: '青山葬儀所 第一斎場',
    ceremony_datetime: '2026-10-23 18:00',
    raw_notice_text: '故人の遺志により御香典は固くご辞退申し上げます。',
  };

  const ordRes = await fetch(`${BASE}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

  if (!ordRes.ok || ordRes.order.total_estimated_jpy !== 38500 || !ordRes.order.telegram_body.includes('ご帰幽')) {
    throw new Error('Condolence policy & Shinto etiquette check failed: ' + JSON.stringify(ordRes));
  }
  console.log('✅ 2. Condolence Order created (Koden declined -> ¥38,500, Shinto wording verified)');

  // 3. Verify Duplicate Dispatch Block (another department tries to order for same person)
  const dupRes = await fetch(`${BASE}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const dupJson = await dupRes.json();
  if (dupRes.status !== 409 || !dupJson.duplicate_blocked) {
    throw new Error('Duplicate block failed');
  }
  console.log('✅ 3. Duplicate dispatch guard verified (HTTP 409 blocked duplicate order)');

  // 4. Test MCP tool
  const mcpRes = await fetch(`${BASE}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'draft_keicho_package',
        arguments: {
          event_category: '就任・昇進・上場祝い',
          client_company: '株式会社ネクストAI',
          client_tier: 'S（重要取引先）',
          target_person_name: '佐藤 翔太',
          target_person_role: '代表取締役社長',
        },
      },
    }),
  }).then((r) => r.json());

  const draft = JSON.parse(mcpRes.result.content[0].text);
  if (!draft.recommended_package.includes('胡蝶蘭')) {
    throw new Error('MCP celebration package failed');
  }
  console.log('✅ 4. MCP tool draft_keicho_package verified:', draft.recommended_package);

  console.log('🎉 ALL KEICHO HARNESS E2E TESTS PASSED!');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
