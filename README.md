# Keicho Harness 🕊️🌺
**Zero-Cost B2B Condolence, Telegram, Corporate Orchid Gift & Policy Automation Engine on Cloudflare Workers + D1 + MCP**

![Keicho Harness Banner](./banner.jpg)

取引先の訃報（弔電・供花・香典）や社長就任・上場・移転祝い（祝電・胡蝶蘭）が発生した際の**「社内規程の確認・宗派マナーと忌み言葉チェック・立札作成・他部署との二重手配防止・経理の課税/不課税仕訳」**を、**Cloudflare Workers + D1 の完全無料枠（月額0円）**で一気通貫させるオープンソースの法人慶弔手配エンジンです。

## ✨ 主な特徴
1. **取引先ランク×役職からの「社内慶弔規程AI自動判定」**: S/A/Bランクと対象者役職から、手配すべき電報グレード・供花・胡蝶蘭・香典の金額パッケージを0秒で自動算出（案内文内の「香典辞退・供花辞退」も自動検知して0円調整）。
2. **宗派完全対応（仏式・神式・キリスト教式）＆忌み言葉チェッカー**: 神式やキリスト教式でNGとなる「冥福」「成仏」や重ね言葉を自動排除し、格式高い文面と立札（芳名札）表記を生成。
3. **D1ユニークロックによる「他部署との重複手配ブロック」**: 営業部と秘書室が同じ式場に2つ電報や供花を出してしまう事故をシステムレベルで完全防止（HTTP 409 重複検知）。
4. **インボイス対応・経理仕訳データの自動算出**: 課税対象の交際費（電報・生花）と消費税対象外（不課税：香典・慶弔金）を自動分離して出力。
5. **AIエージェント（MCP）完全対応**: Claude Code や Cursor から自然言語で慶弔パッケージの起案・台帳照会が可能。

## 🚀 クイックスタート
```bash
git clone https://github.com/reina20xx/keicho-harness.git
cd keicho-harness
npm install
npm run dev
node test-e2e.js
```
## 📄 ライセンス
MIT License
