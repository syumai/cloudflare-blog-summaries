---
theme: default
title: "WriteGuard: MCPサーバーのためのきめ細かな制御機能"
info: |
  Cloudflare Blog記事「WriteGuard: Fine-grained controls for MCP Servers」の解説スライド。
  原文: https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/
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

# WriteGuard
MCPサーバーのための
きめ細かな制御機能

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/（英語版のみ）<br>
著者: Scott Roe-Meschke, Kenny Johnson<br>
公開日: 2026-08-05
</div>

---

# アジェンダ

<v-clicks>

- 背景: 「無限に閉じられるチケット」問題
- CloudflareにおけるMCPの現状
- WriteGuardとは
- リスク層によるツール統治
- コード例: ツールポリシーの定義
- 人間とエージェントのアイデンティティ
- 実例: GitLabで見るWriteGuard
- プライベートベータとまとめ

</v-clicks>

---

# 背景: Endlessly Closing Tickets

<v-click>

> エンジニアのJoeが数千件のチケットを自動的に閉じてしまった

</v-click>

<v-clicks>

- 実際には複数の自動エージェントが3つの同時セッションで実行中
- 原因は「少し広すぎる」クリーンアップタスクのプロンプト
- 契約ソフトウェアなら契約を書き換え、サポートキューなら
  数百件の誤送信、DBアクセス権があればテーブル全体を削除も

</v-clicks>

---

# 前提: クライアント側の制御には頼れない

<v-clicks>

- 「全従業員がすべてのエージェントを完璧に設定し、
  すべてのツール呼び出しを監視する」ことには依存できない
- スキルやプロンプトエンジニアリングはハーネスによって挙動が異なる
- ユーザー側で無効化することもできてしまう
- → プラットフォーム側で一元的に制御する仕組みが必要

</v-clicks>

---

# MCPの基礎

<v-clicks>

- Model Context Protocol: AIアプリを外部ツール・データソースに
  接続するための標準
- MCPサーバーはクライアントが使えるツールを提供
- 各ツールは「名前・説明・入力スキーマ・ハンドラー」を持つ
- エージェントがツールを選ぶ → クライアントが呼び出しを送信
  → サーバーがダウンストリームと連携

</v-clicks>

---

# CloudflareにおけるMCP

<v-clicks>

- OpenCodeやCloudflare OSなどのローカルクライアント、
  長時間実行されるエージェントサービスから利用
- サーバーはCloudflare Accessの背後、単一の内部ポータル経由
- 4月時点で13サーバー → 現在**27サーバー**に増加
- 当初はすべて読み取り専用（Jira・GitLab・ウィキ・運用系を検索）

</v-clicks>

<v-click>

<div class="pt-4 text-center">

モデル改善とともに、各部門から「アクションを実行できるツール」への
要望が増加

</div>

</v-click>

---

# 必要だった3つの仕組み

<v-clicks>

- エージェントが実行できる**書き込みアクション**の一元的な制御
- ダウンストリームアプリケーションに表示される**エージェントラベル**
- エージェント活動の調査を容易にする**監査証跡**

</v-clicks>

---
class: text-center
---

# WriteGuard

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9329Z2GK7CVX8PNC84Z1RA.png
backgroundSize: contain
---

# WriteGuardとは

<v-clicks>

- 「共有ポリシー、帰属、監査層」
- ツールの構成とリクエストコンテキストから何が起こるかを判断

</v-clicks>

<v-clicks>

- 呼び出しをそのまま通す
- 帰属情報を付与し、スクラブ済み監査イベントを生成する
- ハンドラー実行前にアクションをブロックする

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/
</footer>

---

# 呼び出し可能なツールから統治可能なアクションへ

<v-clicks>

- MCPサーバー本体を変更せずにツールごとポリシーを定義
- 全ツールに「リスク層」「有効／無効」「ラベリング構成」を付与
- リスク層により、ログ対象か・呼び出し許可かが決まる
- ラベリングでエージェント帰属を挿入
  （サーバー側のコード変更なしに、最適な形式で）

</v-clicks>

---

# 4つのリスク層

| リスク層 | 例 |
|---|---|
| Read Only | 問題を検索、MRを読む、`get_merge_request` |
| Minimal Impact | リアクション追加、通知既読、問題を購読 |
| Contained Write | コメント追加、MR作成、`create_mr_note` |
| Critical | MRをマージ、本番デプロイ、`merge_mr` |

<v-click>

<div class="pt-4 text-center text-sm opacity-70">

リスク層ごとに、記録・許可の挙動と監査ログのクエリ性が変わる

</div>

</v-click>

---
class: text-center
---

# コード例で見る:
# WriteGuardのツールポリシー

---

# コード例: sendEmailToolへのポリシー付与

```ts {1-2|4-13|all}
const sendEmailTool = {
  tool: EmailMCP.sendEmailTool,
  writeGuard: {
    riskLevel: RiskLevel.CONTAINED_WRITE,
    enabled: true,
    labeling: {
      field: "body",
      supportedFormats: [
        LabelFormat.PLAIN_TEXT,
        LabelFormat.HTML,
      ],
    },
  },
};
```

---

# コード例 解説

<v-clicks>

- `EmailMCP.sendEmailTool`という既存のMCPツールに
  `writeGuard`設定オブジェクトを**外付け**
- `riskLevel: CONTAINED_WRITE`で「限定的な書き込み」に分類
- `enabled: true`で呼び出し自体は許可
- `labeling.field: "body"`でメール本文に帰属ラベルを挿入
  - プレーンテキスト／HTMLどちらの形式にも対応
- **ポイント**: `EmailMCP`本体のコードは一切変更していない

</v-clicks>

---

# 現状と今後

<v-clicks>

- 現在は内部MCPモノレポでTypeScriptとして構成
- プライベートベータの展開に伴い、サーバー所有者は
  Cloudflare MCPサーバーポータルから同じポリシーを設定可能に
- すべてのMCPサーバーに、ベースラインアクセスポリシーと
  ツールごとのWriteGuard制御が含まれる

</v-clicks>

---
class: text-center
---

# 人間を維持し、エージェントを追加する

---

# アイデンティティの原則

<v-clicks>

- Cloudflareの内部MCPサーバーはAccessとOAuthでユーザーを識別
- エージェントは**その従業員の権限**で動作
  - Joeが閉じられないチケットは、Joeのエージェントも閉じられない
- 独立した「エージェントアカウント」は新設しない
  - 権限の2番目のセットを生み、責任の所在を曖昧にするため

</v-clicks>

---

# トレードオフとWriteGuardの解決策

<v-clicks>

- ダウンストリームにはJoeの資格情報しか見えず、
  背後のエージェントを識別する手段がない
- WriteGuardがMCPクライアント・セッションコンテキストを
  人間のアイデンティティに追加
- 各書き込みを「特定の人物に代わって動くエージェントセッション」
  として識別
- 何も問題が起きていない場合でも、変更の解釈・対応判断に有用

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0NRRE7DXB99C8W5YZ1N.jpg
backgroundSize: contain
---

# 機械速度のアクティビティを
クエリ可能にする

<v-clicks>

- 各呼び出しを成功／失敗／ブロックに分類
- 非同期でスクラブ済みイベントを内部監査ワーカーへ送信
- サーバー・ツール・リスク層・結果・ユーザー・クライアント・
  処理時間を記録（秘密情報は省略）
- 非同期化によりエージェントの応答遅延には影響しない

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/
</footer>

---
class: text-center
---

# 実例で見るWriteGuard
GitLab MCPサーバー

---

# ① マージリクエストの読み取り

<v-clicks>

- エンジニアがコード変更の要約を依頼
- `get_merge_request`を呼び出し
- リスク層: **Read Only**
- WriteGuardは呼び出しをそのまま通す

</v-clicks>

---
layout: two-cols
---

# ② MRへのメモ追加

<v-clicks>

- `create_mr_note`を呼び出し
- リスク層: **Contained Write**
- ノートフィールドにGitLab対応形式で
  帰属情報を追加してハンドラー呼び出し
- 非同期でスクラブ済み監査イベントを記録

</v-clicks>

::right::

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0Z8WCP1DWTHRKC9QHYJ.png" class="rounded" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0VPZ860CSARB07DCVP2.png
backgroundSize: contain
---

# ②の監査ログ例

<v-clicks>

- ユーザー・ツール・結果
- エージェント識別コンテキストを含む
- スクラブ済み（秘密情報は省略）

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ17VV6MV8G86SYGD0S1D.jpg
backgroundSize: contain
---

# ③ コードのマージ

<v-clicks>

- エージェントが「役に立とうとして」
  指示範囲を超え`merge_mr`を呼び出し
- マージは通常デプロイパイプラインを
  トリガーするため人間の判断が必須
- リスク層: **Critical** → **無効（disabled）として構成**
- WriteGuardがハンドラー実行前にブロックし、試行を記録

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/
</footer>

---

# 単一サーバー例を超えて

<v-clicks>

- 同じサーバー・アイデンティティフロー・APIでも、
  WriteGuardはツールごとに異なる方法で処理
- GitLabだけならサーバーに直接組み込むこともできたはず
- しかしJira・社内ウィキ・Google Workspace…と
  同じ機能が必要なサーバーは増え続ける
- 各サーバーで再実装すると、作業量増・挙動の不整合が発生

</v-clicks>

<v-click>

<div class="pt-4 text-center">

→ WriteGuardを**共有レイヤー**として構築し、ツールごとの構成だけで
接続された全MCPサーバーに機能させる

</div>

</v-click>

---

# 内部展開からプライベートベータへ

<v-clicks>

- 自社のMCPサーバー向けに構築（読み取り専用の先へ進む必要から）
- プライベートベータでは同じアーキテクチャをMCPサーバーポータルへ
- 小さく始めて時間をかけて拡大、一般提供へつなげる計画
- 検証したい点:
  - リスクモデルの顧客ツールへのマッピング
  - ダウンストリームが必要とする帰属形式
  - 監査配信の保証水準

</v-clicks>

---

# まとめ

<v-clicks>

- WriteGuardは、MCPサーバー本体を変更せず
  ツールごとの構成だけでガバナンスを適用できる共有レイヤー
- リスク層（Read Only〜Critical）でアクションを段階的に統治
- エージェントは人間の権限で動作しつつ、WriteGuardが帰属を付与
- 27のMCPサーバーを横断した一元的な監査が可能に
- プライベートベータとして展開中、段階的に拡大予定

</v-clicks>

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [WriteGuard: Fine-grained controls for MCP Servers](https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/)
- 関連解説スライド: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](../cloudflare-os/)
- [Model Context Protocol公式サイト](https://modelcontextprotocol.io/)
- [MCP Server Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)
- [WriteGuardプライベートベータへの申し込み](https://www.cloudflare.com/resource/writeguard-beta-landing-page/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-05-mcp-portal-writeguard-private-beta.md
</div>
