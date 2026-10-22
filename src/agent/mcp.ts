import type { Bindings } from '../index';
import { evaluateKeichoOrder } from '../index';

export async function handleMcpRequest(req: any, env: Bindings) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'keicho-harness-mcp', version: '1.0.0' },
        capabilities: { tools: {} },
      },
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'list_keicho_orders',
            description: '社内の慶弔手配（祝電・弔電・供花・胡蝶蘭）の履歴と重複チェック台帳を取得します',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'draft_keicho_package',
            description: '訃報や就任案内の情報から、社内規程に基づく推奨パッケージ・立札・忌み言葉ゼロの電報文面・経理仕訳を生成します',
            inputSchema: {
              type: 'object',
              required: ['event_category', 'client_company', 'client_tier', 'target_person_name', 'target_person_role'],
              properties: {
                event_category: { type: 'string', description: 'おくやみ（訃報） または 就任・昇進・上場祝い' },
                religion_style: { type: 'string', description: '仏式 / 神式 / キリスト教式 / 無宗教・祝賀' },
                client_company: { type: 'string' },
                client_tier: { type: 'string', description: 'S（重要取引先） / A（主要取引先） / B（一般取引先）' },
                target_person_name: { type: 'string' },
                target_person_role: { type: 'string' },
                raw_notice_text: { type: 'string', description: '案内状テキスト（香典辞退等の自動検出用）' },
              },
            },
          },
        ],
      },
    };
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};

    if (toolName === 'list_keicho_orders') {
      const res = await env.DB.prepare('SELECT * FROM keicho_orders ORDER BY created_at DESC').all();
      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(res.results || [], null, 2) }] },
      };
    }

    if (toolName === 'draft_keicho_package') {
      const draft = evaluateKeichoOrder({
        event_category: args.event_category || 'おくやみ（訃報）',
        religion_style: args.religion_style,
        client_company: args.client_company,
        client_tier: args.client_tier || 'S（重要取引先）',
        target_person_name: args.target_person_name,
        target_person_role: args.target_person_role,
        chief_mourner_or_recipient: args.target_person_name,
        venue_name: '指定会場',
        ceremony_datetime: '指定日時',
        raw_notice_text: args.raw_notice_text || '',
      });
      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(draft, null, 2) }] },
      };
    }
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
}
