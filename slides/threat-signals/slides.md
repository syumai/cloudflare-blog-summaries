---
routerMode: hash
theme: default
title: "Threat Signals のご紹介"
info: |
  Threat Signals のご紹介: オープンソース脅威インテリジェンスのためのエージェント型スキルの解説スライド。
  原文: https://blog.cloudflare.com/threat-signals/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# Threat Signals のご紹介

<div class="text-xl pt-2">オープンソース脅威インテリジェンスのためのエージェント型スキル</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/threat-signals/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- <strong>Threat Signals</strong>: 選んだ RSS の脅威レポートを、エージェント型スキルで要約・タグ付けし、IOC を抽出・正規化
- 結果はアカウント専用の非公開データセットに <strong>Threat Event</strong> として保存され、そのまま WAF で使える
- Threat Events Platform が<strong>全アカウントで無料</strong>に（RSS 1 本、最長 30 日保存、API とダッシュボード）
- Enterprise はフィード数の拡張、独自データセット、カスタムスキル、カスタム WAF ルールを追加可能
- 使い始めは Application Security → Threat Intelligence → Threat Signals

---

# アジェンダ

- 背景: 非構造化レポートを使える指標にする難しさ
- スキルと提供内容
- 仕組み（RSS → Workflow → スキル → Threat Event → WAF）
- 画面の例
- 設計上の学び
- コード例の有無・ユースケース・まとめ

---

# 背景: レポートを指標に変える作業

1 本のレポートごとに、人手で次を行ってきた。

- 読んで要約 → 指標を特定 → 形式を統一
- 社内分類でタグ付け → TIP に登録 → 元ソースへのリンクを保持 → チームに共有

- ほとんどの工程が<strong>人の判断</strong>に依存し、多数のソースで繰り返すと時間がかかる
- 結果として<strong>文脈が失われる</strong>: 数週間後、ブロックリストのドメインの理由を誰も分からない

---

# 課題: 既存基盤のスケール限界

- 構造化フィードの自動取り込みは既に一般的。難しいのは<strong>非構造化レポート</strong>
- 顧客からは、既存プラットフォームは RSS 約 100 本のポーリングが上限、という声
- そこで「無限にスケールする」基盤を目指して構築
- 最初の版は、アナリストが 1 週間で作った社内プロトタイプ

---

# スキルとは

- 経験豊富なアナリストが、ある作業をどう進めるかを記した<strong>詳細な指示のまとまり</strong>
- どのレポートでも<strong>同じ手順</strong>で実行される
- Threat Signals はこの手順を大規模に実行する仕組み
- 処理内容: 要約、重要な文脈の抽出、IOC の抽出・正規化、タグ付け（すべてアカウント専用の非公開データセット内）

---

# 全アカウントに含まれるもの

| 区分 | 内容 |
|---|---|
| <strong>全アカウント（無料）</strong> | Threat Signals の API・ダッシュボード、RSS 1 本、最長 30 日保存の非公開データセット、Threat Events Platform へのアクセス |
| <strong>Enterprise</strong>（Essentials / Advantage / Elite） | RSS の拡張、独自の脅威インテリジェンスデータセット、カスタムスキル、保存容量の拡大、カスタム WAF ルール |

---

# 仕組み（1）: 取り込み

- RSS 2.0 / Atom / RSS 1.0（RDF）に対応。フィードに名前・カテゴリ・確認頻度を設定
- 各フィードは <strong>Workflow</strong> が定期的にポーリング
- <strong>Browser Run</strong> の Markdown クイックアクションで記事本文を取得・整形し、<strong>R2</strong> に保存

---

# 仕組み（2）: スキルと Threat Event

- 本文を IOC 抽出器と、Cloudforce One 定義の既定スキルへ
- 出力: 簡潔な要約とキーポイント（何が起きたか、誰が影響を受けたか、なぜ重要か）。すべて検索・タグ付け可能
- 抽出した各指標は、非公開データセット内の<strong>脅威イベント</strong>に裏付けられる
- イベント・指標・タグ・元レポートがつながったまま → 出どころをたどれる
- 指標から <strong>WAF ルール</strong>を作成して保護できる

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3MS5RVRQZQJ39ZA0TQNAJKX.01M3MS5TFC9QGR4PM3QNQM2VRJ.png
backgroundSize: contain
---

# 画面: フィードと記事

- Feeds & Articles タブ
- 左: フィード一覧とタグ
- 右: 記事、AI SUMMARY、自動付与タグ
- Unread / Read の状態を管理

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/threat-signals/（画面内の説明は画像から筆者が書き起こした）</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3MS5RVCKAZSECM8B8ZNZPTW.01M3MS5SPC5G9T6W74C1SSVNM3.png
backgroundSize: contain
---

# 画面: 文脈付き指標

- タグ（VPN GATEWAY、CVE 番号など）
- AI Summary と Key Points
- IOC context: 指標ごとの役割（例: Command and control）、信頼度（High）、根拠

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/threat-signals/（画面内の説明は画像から筆者が書き起こした）</div>

---

# 設計上の学び（1）: 語彙の一貫性

- AI に自由にタグを作らせると、既存の語彙と新しい語彙の<strong>突き合わせ</strong>が必要になる
- 顧客チームからも、見慣れない語彙は使いにくいという指摘
- → AI のタグ付けを、各アカウントの<strong>既存タグカタログに限定</strong>

---

# 設計上の学び（2）: 透明性とリンク

- <strong>付与元の記録</strong>: タグが自動か手動かを記録。どれが自動か見えると、自動タグ付けへの信頼が高まった
- <strong>イベントと元レポートのリンク</strong>: 要約は目立つが、アナリストが繰り返し戻ったのはこちら
- 「簡単なスクリプト」と「信頼して使える出力」の差は、こうした設計にあった

---

# コード例の有無

- 記事本文にコードブロック・スキル定義の引用は<strong>含まれていない</strong>
- 代わりに処理の流れを示す:

```text {all}
RSS フィード
  → Workflow（定期ポーリング）
  → Browser Run（Markdown 取得）→ R2 に保存
  → IOC 抽出器 + Cloudforce One 定義のスキル（要約・タグ・文脈）
  → Threat Event（アカウント専用データセット）
  → WAF ルール
```

---

# ユースケース1: レポートの自動トリアージ

- 研究者のブログやニュースの RSS を登録
- 要約・タグ・IOC を自動で得て、読むべき記事を絞る

---

# ユースケース2: 指標を WAF に適用

- 抽出した IOC（例: コマンド＆コントロールの IP）を脅威イベントから WAF ルール化
- 文脈付きなので、ルールの根拠が残る

---

# ユースケース3: 出どころの追跡

- イベント・指標から元レポートへたどる
- ブロックリストのエントリが「なぜそこにあるか」を後から確認

---

# ユースケース4: Enterprise でのカスタム化

- 複数フィード、独自データセット、カスタムスキル
- 保存容量を増やし、カスタム WAF ルールを作成

---

# まとめ・所感

- スキルを<strong>再現可能な手順書</strong>として、Workflows・Browser Run・R2 の上で回すエージェント型スキルの実運用例
- 成否を分けたのは AI の精度より、語彙の制限・付与元の記録・元レポートとのリンクという<strong>信頼の設計</strong>
- 無料枠は RSS 1 本・30 日保存。複数フィードやカスタムスキルは Enterprise
- 今後は RSS 以外のデータ取り込みパイプラインも追加予定
- デプロイ可能なサンプルは対象外（中心が Cloudflare 提供のマネージド機能のため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/threat-signals/
- Agent Skills: https://developers.cloudflare.com/docs-for-agents/#agent-skills
- Threat Events Platform: https://blog.cloudflare.com/cloudflare-threat-intelligence-platform/
- Browser Run: https://developers.cloudflare.com/browser-run/
- Threat Signals API: https://developers.cloudflare.com/api/resources/cloudforce_one/subresources/threat_signals/
- 関連スライド: [Application Profiles](../application-profiles/)
- Wiki: [docs/articles/2026-09-29-threat-signals.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-threat-signals.md)
