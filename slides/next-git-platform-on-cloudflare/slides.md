---
routerMode: hash
theme: default
title: "次の Git プラットフォームを Cloudflare 上で作ってほしい: Artifacts のオープンベータと開発コンペ"
info: |
  We want you to build the next Git platform on Cloudflare の解説スライド。
  原文: https://blog.cloudflare.com/next-git-platform-on-cloudflare/
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

# 次の Git プラットフォームを<br>Cloudflare 上で作ってほしい

Artifacts のオープンベータと開発コンペ

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/next-git-platform-on-cloudflare/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- 数百〜数千のエージェントが同じコードベースで働く時代の Git 基盤を、開発者と一緒に作りたいという呼びかけ
- 土台は <strong>Artifacts</strong>（Git を話すバージョン管理付きファイルシステム）。今回<strong>オープンベータ</strong>に
- 新機能: Workers へのデプロイ・Workers バインディング・イベント購読・データジュリスディクション・メトリクス
- 課金は <strong>2026-10-15</strong> 開始。コンペの締め切りは <strong>2026-10-14</strong>
- 1 位は <strong>25,000 ドル分</strong>のクレジット。上位 3 チームは Cloudflare Connect へ招待

---

# アジェンダ

- 背景: 人間のための GitHub とエージェントの時代
- Artifacts という土台
- オープンベータの新機能 5 つ
- コード例・ユースケース
- コンペの概要
- まとめ

---

# 背景: 人間のために作られた Git ワークフロー

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>これまでの前提</strong>

- 人間がコードを書く
- リポジトリに整理する
- ブランチ・コミット・Issue・プルリクエストで協力する

</div>
<div class="p-4 border rounded">

<strong>エージェントの時代</strong>

- バグ修正・機能実装・テスト・レビュー・依存関係の更新までこなす
- 数百〜数千のエージェントが同じコードベースで同時に作業する

</div>
</div>

---

# 記事が挙げる問い

- エージェントは、他のエージェントが何をしているかをどう知るのか
- 変更が衝突したときはどうなるのか
- 大量の成果物をどうレビューするのか
- 「何が変わったか」だけでなく「なぜ変えたか」をどう追跡するのか

<div class="pt-6 text-sm">

「次の GitHub はどんな姿か」への答えを、Cloudflare 単独ではなく開発者と一緒に探したい、というのが記事の主旨。

</div>

---

# Artifacts という土台

- Git を話す、バージョン管理付きのファイルシステム。数百万のリポジトリまでスケール
- 開発者が自分のプロダクトやワークフローを作るための、プログラム可能なプリミティブとして設計

<div class="grid grid-cols-3 gap-4 pt-6 text-left text-sm">
<div class="p-4 border rounded">

プログラムから作成・フォークできる<strong>リポジトリ</strong>

</div>
<div class="p-4 border rounded">

コードとエージェントの文脈を保存する<strong>バージョン管理付きストレージ</strong>

</div>
<div class="p-4 border rounded">

エージェントがすでに知っている <strong>Git 操作</strong>

</div>
</div>

---

# 既存の使われ方

<div class="grid grid-cols-3 gap-4 pt-6 text-left text-sm">
<div class="p-4 border rounded">

<strong>vibe coding</strong>

プラットフォームが、ユーザーの作ったプロジェクトを保存する

</div>
<div class="p-4 border rounded">

<strong>セッションの永続化</strong>

エージェントセッションのコードと文脈を保存する

</div>
<div class="p-4 border rounded">

<strong>分離したリポジトリ</strong>

同じ出発点から複数のエージェントが作業し、後で比較・マージする

</div>
</div>

<div class="text-sm pt-6 text-left">

開発者に任せたいのは、その上の層。エージェントの協調、変更のレビューとマージ、数百〜数千のエージェントがいるときの開発者体験。

</div>

---

# 新機能 1: Artifacts リポジトリを Workers にデプロイ

<div class="grid grid-cols-2 gap-6 text-sm">
<div>

- Workers Builds 経由で、リポジトリを Worker に接続
- 本番ブランチへの push → ビルドして Worker を更新
- その他のブランチへの push → Workers Previews を作成・更新
- 既存の Worker の接続も、新規プロジェクトの Artifacts 保存も可能

</div>
<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3SQC8RKCYFADSHXNX2XR1XF.png" style="max-height: 300px; margin: 0 auto;" />
<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/next-git-platform-on-cloudflare/</div>
</div>
</div>

---

# 新機能 2: Worker から Artifacts を操作

- リポジトリの<strong>作成・フォーク</strong>
- ファイルやコミットの参照
- <strong>リポジトリ単位の Git トークン</strong>の発行

Artifacts バインディング（`env.ARTIFACTS`）から呼び出す。

<div class="pt-6 text-sm">

例: 新しいタスクが届く → Worker がプロジェクトをフォーク → 必要なファイルを読んで文脈を作る → エージェントに作業用リポジトリを渡す → push を検査してレビューを開始。この手順をコードで定義できる。

</div>

---

# コード例: フォークして指示を読む

```ts
using project = await env.ARTIFACTS.get("my-project");
const { defaultBranch } = await project.info();
const workspace = await project.fork(`task-${crypto.randomUUID()}`);

using repo = await env.ARTIFACTS.get(workspace.name);
const instructions = await repo.readFile({
  ref: defaultBranch,
  path: "AGENTS.md",
});

const agentTask = {
  remote: workspace.remote,
  token: workspace.token,
  instructions: instructions ? await instructions.text() : null,
};
```

<div class="text-sm">

- 1〜3 行目: プロジェクトを取得し、タスクごとのフォークを作成。5〜9 行目: フォークからデフォルトブランチの `AGENTS.md` を読む
- 11〜15 行目: リモート URL・トークン・指示をエージェントへ渡す。`using` 宣言でハンドルはスコープ終了時に解放

</div>

---

# 新機能 3: すべての変更にイベント購読で反応

- 発行されるイベント: 作成・インポート・フォーク・削除・push・clone・fetch
- 購読して、CI の実行・コードレビューエージェントの起動・デプロイなどを決める

```ts
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const event = message.body;
      if (event.type !== "cf.artifacts.repo.pushed") continue;
      await env.REVIEW_WORKFLOW.create({
        params: {
          namespace: event.source.namespace,
          repo: event.source.repoName,
          ref: event.payload.ref,
          commit: event.payload.after,
        },
      });
    }
  },
};
```

<div class="text-xs">push イベントだけを拾い、リポジトリ・ブランチ・新しいコミットをレビュー Workflow に渡す（記事の抜粋）。</div>

---

# 新機能 4・5: ジュリスディクションとメトリクス

<div class="grid grid-cols-2 gap-6 text-sm">
<div>

<strong>データジュリスディクション</strong>

- 名前空間の作成時に U.S. または EU を指定
- その名前空間の全リポジトリが同じ制限に従う

</div>
<div>

<strong>メトリクス</strong>

- ダッシュボードで、リポジトリごとの総操作数・pull・push・エラー・エラー率
- メトリクスを直接クエリして、独自の監視も構築可能

</div>
</div>

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/artifacts/namespaces" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --json '{"namespace":"my-eu-namespace","jurisdiction":"eu"}'
```

---

# メトリクス画面

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3SQC9MA49HNQD82GBG58EDM.png" style="max-height: 340px; margin: 0 auto;" />
</div>

<div class="text-sm pt-2">

「myproject」の Metrics タブ。Total operations 22、Pulls 20、Pushes 0、Errors 0、Error rate 0%。Pull と Read の操作数が時系列の棒グラフで表示される。

</div>

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/next-git-platform-on-cloudflare/</div>

---

# ユースケース

<div class="grid grid-cols-2 gap-4 text-sm text-left">
<div class="p-3 border rounded">

<strong>タスクごとの作業用リポジトリ</strong>

フォークとリポジトリ単位のトークンで、複数のエージェントが同じ出発点から並行作業し、結果を比較・マージ

</div>
<div class="p-3 border rounded">

<strong>push 起点のレビューと CI</strong>

イベント購読でレビューエージェントや CI を起動（<a href="../ci-workflows/">CI Workflows の解説</a>）

</div>
<div class="p-3 border rounded">

<strong>継続的デプロイとプレビュー</strong>

push だけで本番ブランチは Worker として公開、他のブランチは Workers Previews で確認

</div>
<div class="p-3 border rounded">

<strong>vibe coding プラットフォーム</strong>

ユーザーのプロジェクトを保存し、データ所在地は名前空間のジュリスディクションで制御

</div>
</div>

---

# コンペ: Build the next Git platform on Cloudflare

<div class="text-sm">

| 項目 | 内容 |
| --- | --- |
| テーマ | Workers と Artifacts でエージェント時代の Git プラットフォームを作る |
| 最低条件 | 複数のエージェントが変更を同時並行で進めている |
| 提出物 | 5〜10 分のデモ動画／ソースコード（MIT・Apache・BSD など）／実行手順 |
| 締め切り | 2026-10-14 |

</div>

<div class="text-sm pt-2">

「今日の GitHub にエージェントを足したもの」ではなく、リポジトリ・ブランチ・PR・ワークツリー・コードレビュー・マージコンフリクトの再考や、エージェントの文脈の保存、複数の変更の同時比較を求めている。

</div>

---

# 賞と参加方法

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>賞</strong>

- 上位 3 プロジェクトから最大 2 名ずつをサンフランシスコの Cloudflare Connect へ招待
- 1 位は 25,000 ドル分の Cloudflare クレジットと、月曜夜の VIP スピーカーディナーへの招待

</div>
<div class="p-4 border rounded">

<strong>始め方</strong>

- Artifacts は Workers Paid プランで利用できるオープンベータ
- ダッシュボードでリポジトリを作成・確認
- 課金は 2026-10-15 から（操作数と保存データ量）

</div>
</div>

---

# まとめ・所感

- 記事は新機能の紹介とコンペの告知が中心で、内部設計の詳細は別の発表記事を参照する
- フォーク＋リポジトリ単位のトークンは、エージェントに渡す権限を絞りやすい形
- イベント購読と Workflows で、Git 上の変更を起点に別のエージェントが動く連鎖が組める
- 日付に注意: 締め切り 2026-10-14、課金開始 2026-10-15
- サンプル対象外: 中心機能がオープンベータで、アカウント側の準備が必要なため

---

# 参考リンク

- 原文: [We want you to build the next Git platform on Cloudflare](https://blog.cloudflare.com/next-git-platform-on-cloudflare/)
- [Artifacts: Git for Agents（発表記事）](https://blog.cloudflare.com/artifacts-git-for-agents-beta/)
- [Artifacts ドキュメント](https://developers.cloudflare.com/artifacts/)
- [Workers バインディング](https://developers.cloudflare.com/artifacts/api/workers-binding/)
- [コンペの応募ページ](http://cloudflare.com/git-competition)
- ▶ 解説スライド: <a href="../ci-workflows/">CI Workflows</a> / <a href="../agent-development-lifecycle/">エージェント開発ライフサイクル</a>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-01-next-git-platform-on-cloudflare.md
</div>
