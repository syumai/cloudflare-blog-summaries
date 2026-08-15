---
theme: default
title: AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介
info: |
  Cloudflare Blog記事「AIエージェントに必要なのはコンテナではなくコンピューター」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/cloudflare-computer/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# AIエージェントに必要なのは
# コンテナではなくコンピューター

「@cloudflare/computer」のご紹介

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/cloudflare-computer/<br>
公開日: 2026-08-05
</div>

---

# アジェンダ

<v-clicks>

- 背景: AIエージェントに必要な「専用のコンピューター」
- 課題: 「頭脳」と「手」の分離、そしてCPU資源不足
- Cloudflareの答え: アイソレート技術
- `@cloudflare/computer` のアーキテクチャ
- コード例で見る: バグトリアージエージェント
- ユースケース
- 将来像と使い始め方

</v-clicks>

---

# 背景: 高性能なAIエージェントの共通点

最も高性能なAIエージェントに共通するのは、
**エージェント専用の「コンピューター環境」** を持っていること

<v-clicks>

- ファイルシステム
- シェル
- 各種ツール
- パッケージ
- コードを実行する権限

</v-clicks>

<br>

<v-click>

コーディングエージェントは、この環境を**調査・変更・テスト**しながら作業を進める

</v-click>

---

# エージェント構築の変化: 「頭脳」と「手」の分離

<div class="grid grid-cols-2 gap-4">
<div>

### 頭脳（Brain）
AIエージェントの処理ループ
判断・指示を担当

### 手（Hands）
コードを実行するサンドボックス環境
実際の作業を担当

</div>
<div>

![エージェントハーネス分離図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHGR1F725Y45HAYQ7EP4V.png)

</div>
</div>

近年のエージェント設計では、この2つを分離して構築できるようになった

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/
</footer>

---

# 課題: 数億エージェントとCPU資源不足

<v-click>

> 世界中のすべての企業が、自社ユーザーのAIエージェント1つひとつに
> 専用のコンテナ型コンピューティング環境を提供できるほどの
> **計算資源は存在しない**

</v-click>

<v-click>

- フルスペックのLinuxコンテナは起動が重く、常時起動にはコストがかかる
- 数億、さらには数十億ものAIエージェントを同時稼働させる規模には対応できない
- 「コンテナを増やす」だけの発想ではエージェント経済のスケールを支えきれない

</v-click>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHG8112R261JGEK5515Y7.png
---

# スケーリングの課題

コンテナ中心のアーキテクチャでは、
エージェント数の増加に計算資源が追いつかない

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/
</footer>

---

# Cloudflareの答え: アイソレート技術

Cloudflareは Workers（約10年前）、Durable Objects（約6年前）の頃から
**アイソレート技術**に投資を続けてきた

<v-clicks>

- ほぼ無限に近い**水平方向のスケール拡張**に対応
- 非常に**高速に起動・終了**できる
- アイドル時は**休止状態（ハイバネーション）**に入り、状態を保持したままリソース消費を抑える

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHGJWE4D64HEZPZ1PMCAN.png
---

# 垂直スケール vs 水平スケール

フルコンテナ（垂直・重量級）と
アイソレート（水平・軽量級）の対比

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/
</footer>

---
class: text-center
---

# `@cloudflare/computer` を発表

<div class="pt-8">

AIエージェント向けの実行環境（エージェントランタイム）

</div>

<v-clicks>

- 初期プレビュー版を公開
- GitHub上で **OSS** として公開
- リポジトリ: github.com/cloudflare/computer

</v-clicks>

---

# アーキテクチャ全体像: 仮想ファイルシステム

**Workspace** = `@cloudflare/computer` の中核

<v-clicks>

- **SQLite** をバックエンドに使用した仮想ファイルシステム
- クラウドストレージやソースコード管理システムなど、さまざまなソースから内容を取り込み可能

</v-clicks>

<div class="pt-4">

![ワークスペース構造](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHH01B75YXB0CMQ395YW3.png){style="max-height:280px"}

</div>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/
</footer>

---

# 2つの実行バックエンド

<div class="grid grid-cols-2 gap-4">

<div>

### 🚀 アイソレート型

- [just-bash](https://justbash.dev/) でシェルコードを JavaScript へ変換
- 動的な Worker 上で実行
- 軽量・高速・大量スケール

</div>

<div>

### 🐳 コンテナ型

- Cloudflare Containers を使用
- **完全な Linux 環境**を提供
- Workspace は Filesystem in Userspace（**FUSE**）としてマウント

</div>

</div>

<br>

<v-click>

タスクの性質に応じて、この2つを使い分ける

</v-click>

---

# ファイルシステム共有機構

アイソレートとコンテナは、それぞれ独立した実行環境でありながら
**同じファイルシステムを共有**して作業を行う

<div class="pt-4">

![ファイルシステム共有](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHGH4NAWXAMWKSJ5JDMQY.png){style="max-height:280px"}

</div>

<v-click>

各環境で変更された内容は、元となるファイルシステムと**常に同期**される

</v-click>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/
</footer>

---

# 標準ツール: read / write / edit / ls / exec

AI SDK と互換性のあるツールキットを提供

<div class="pt-4">

![ファイルシステムAPI](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4CFYR52H8M9DBZFH552T63.png){style="max-height:300px"}

</div>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/
</footer>

---

# モデルによるバックエンド自動選択

> 「必要なときだけコンテナを利用」

<v-clicks>

- 各ツールの説明文に、現在のタスクに適した実行ランタイムを
  エージェント自身が選択できるような情報を含める
- 最先端のAIモデルはこの判断を**非常に高い精度**で実行
- プロンプトエンジニアリングではなく、**ツール設計**でルーティングを制御する発想

</v-clicks>

---
class: text-center
---

# コード例で見る:
# バグトリアージエージェント

GitHub Issueのバグ報告を受け取り、調査・修正・検証まで行うエージェントを
4つのコードで段階的に構築する

---

# コード例① アイソレートのみの最小構成

```ts {1-2|4-8|10-13|15-21|all}
import { Think } from "@cloudflare/think";
import { Workspace, type DurableObjectStorageLike } from "@cloudflare/computer";
import { createWorkersAI } from "workers-ai-provider";

export class Agent extends Think {
  override workspaceBash = false;

  override workspace = new Workspace({
    storage: this.ctx.storage,
    useThink: true, // soon will not be needed
  });

  override getModel() {
    return createWorkersAI({ binding: this.env.AI })("@cf/zai-org/glm-5.2");
  }

  override getSystemPrompt() {
    return `
You are a bug triage agent.

Use the project in /workspace/repo to reproduce the bug, inspect the
code, make a focused fix when it is safe, and run verification.`;
  }
}
```

---

# コード例① 解説

<v-clicks>

- `Workspace` は Durable Object の `storage`（`this.ctx.storage`）をバックエンドに構築
- `workspaceBash = false` で、`@cloudflare/computer` 側のツールセットを使うよう切り替え
- `getSystemPrompt()` で「`/workspace/repo` のバグを再現・調査・修正・検証せよ」と明確に指示
- この段階ではコンテナバックエンドを持たず、**アイソレート（just-bash）のみ**で動作

</v-clicks>

---

# コード例② コンテナバックエンドの追加

```ts {1-7|9|11-22|all}
import { Think } from "@cloudflare/think";
import { Workspace, WorkspaceProxy } from "@cloudflare/computer";
import {
  CloudflareContainerBackend,
  withWorkspaceContainer,
} from "@cloudflare/computer/backends/container";

export { WorkspaceProxy };

export class Agent extends withWorkspaceContainer(Think) {
  override workspaceBash = false;

  override workspace = new Workspace({
    storage: this.ctx.storage,
    useThink: true, // soon will not be needed
    backends: [
      new CloudflareContainerBackend({
        container: () => this,
        workspace: {
          binding: "Agent",
          id: this.ctx.id.toString(),
        },
      }),
    ],
  });

  /* Example code truncated for readability... */
}
```

---

# コード例② 解説

<v-clicks>

- `withWorkspaceContainer(Think)` というミックスインでコンテナのライフサイクル管理機能を追加
- `backends` 配列に `CloudflareContainerBackend` を渡すと、Workspaceは
  アイソレート（デフォルト）に加えてコンテナも実行先として認識する
- `workspace.binding` / `workspace.id` は、どのDurable Object（＝どのエージェント）に
  紐づくコンテナかを一意に特定する情報
- ここまでで、1つのエージェントがアイソレートとコンテナの**両方**を使い分けられる

</v-clicks>

---

# コード例③ 標準ツール＋独自ツールの統合

```ts {1-3|9-25|all}
import { createAITools } from "@cloudflare/computer/tools";
import type { ToolSet } from "ai";
import { replyToIssue } from "./tools/github";

export class Agent extends withWorkspaceContainer(Think) {
  override workspaceBash = false;

  /* Example code truncated for readability... */

  override getTools(): ToolSet {
    return {
      ...createAITools({
        workspace: this.workspace,
        shell: {
          defaultBackend: "container",
          backends: {
            container: {
              description:
                "Cloudflare Container with a full Linux userland: " +
                "npm, node, package managers, test runners, and real " +
                "binaries on $PATH. Use it when a task needs more than " +
                "file manipulation.",
            },
          },
        },
      }),
      replyToIssue,
    };
  }
}
```

---

# コード例③ 解説

<v-clicks>

- `createAITools()` は AI SDK（`ToolSet`）互換のツール一式を生成するヘルパー
- 注目ポイント: `shell.backends.container.description` の自然文の説明
  - 「ファイル操作以上のことが必要なときに使え」という指示が**ツールの説明文自体**に埋め込まれている
  - これが「モデルによるバックエンド自動選択」の実体
- 独自ツール `replyToIssue`（GitHub Issue返信）を標準ツール群と並べて追加

</v-clicks>

---

# コード例④ Workspace APIの直接利用

```ts {1-4|6-11|13-15|17-30|all}
export class Agent extends withWorkspaceContainer(Think) {
  override workspaceBash = false;

  /* Example code truncated for readability... */

  async startTriage(report: { title: string; body: string; repoUrl: string }) {
    await this.workspace.fs.mkdir("/workspace", { recursive: true });
    await this.workspace.fs.writeFile(
      "/workspace/BUG_REPORT.md",
      `# ${report.title}\n\n${report.body}\n`,
    );

    await this.workspace.git.clone({
      url: report.repoUrl,
      dir: "/workspace/repo",
    });

    return this.submitMessages([
      {
        id: crypto.randomUUID(),
        role: "user",
        parts: [
          {
            type: "text",
            text: [
              `Triage this bug: ${report.title}`,
              "The bug report is in /workspace/BUG_REPORT.md.",
              "The repository is checked out at /workspace/repo.",
            ].join("\n"),
          },
        ],
      },
    ]);
  }
}
```

---

# コード例④ 解説

<v-clicks>

- エージェントの「頭脳」側から Workspace を**直接プログラム的に操作**する例
- `workspace.fs.mkdir` / `writeFile` でバグ報告をファイルとして書き出し
- `workspace.git.clone` でリポジトリをチェックアウト
- `submitMessages()` でエージェントの処理ループにユーザーメッセージとして指示を投入
- 外部トリガー（GitHub Issue の webhook など）を起点にホスト側コードが
  Workspace をセットアップしてからエージェントを起動する統合パターン

</v-clicks>

---
class: text-center
---

# ユースケース

---

# ユースケース①: バグトリアージ

<v-clicks>

- GitHub Issueのバグ報告をもとに、`/workspace/repo` のコードを調査
- バグを再現し、安全な範囲で修正、検証コマンドを実行して結果を報告
- 調査・小さな修正は**アイソレート**で完結することが多い
- テストスイートの実行など重い処理が必要な場面でのみ**コンテナ**に切り替わる

</v-clicks>

<br>

<v-click>

コード例①〜④で一貫して題材にされているシナリオ

</v-click>

---

# ユースケース②: JSアプリのビルド・テスト・デプロイ

<v-clicks>

- npm install、ビルドツール、テストランナーの実行
- 実バイナリと `$PATH` に依存する重量級の作業
- コード例③のツール説明文がまさにこの用途を想定

</v-clicks>

```ts
description:
  "Cloudflare Container with a full Linux userland: " +
  "npm, node, package managers, test runners, and real " +
  "binaries on $PATH. Use it when a task needs more than " +
  "file manipulation.",
```

<v-click>

こうした場面では、モデルが自律的に**コンテナ**バックエンドを選択する

</v-click>

---

# ユースケース③: ドキュメント生成

<v-clicks>

- 各顧客向けに最適化されたドキュメント作成
- ファイルの読み書きが中心となる作業
- 多くの場合**アイソレート**のみで完結
- コンテナ起動コストをかけずに高速に処理できる

</v-clicks>

<br>

<v-click>

（このほか、記事では「Webブラウザーを使った複雑な作業」も言及されている）

</v-click>

---

# 将来像: コンテナ利用を10%未満に

<v-click>

> `@cloudflare/computer` の目標は、
> AIエージェントの作業のうちコンテナが必要になる割合を
> **10%未満**に抑えること

</v-click>

<v-clicks>

- 音声・動画編集、ドキュメント作成などを含む多くのタスクをアイソレート上で実行
- コンテナは「本当に完全なLinux環境が必要な場合」のみに限定
- 数億〜数十億規模のエージェントを実用的なコストで運用するための設計思想

</v-clicks>

---

# 使い始める

```bash
npm install @cloudflare/computer
```

<v-clicks>

- リポジトリ: [github.com/cloudflare/computer](https://github.com/cloudflare/computer)（早期プレビュー・OSS公開）
- チュートリアル: [examples/tutorial](https://github.com/cloudflare/computer/tree/main/examples/tutorial) で手順を追って学べる

</v-clicks>

---

# まとめ

<v-clicks>

- AIエージェントの規模拡大には、コンテナだけでは計算資源が足りない
- Cloudflareの答えは「アイソレート＋コンテナ」の**ハイブリッド**運用
- `@cloudflare/computer` は SQLiteバックエンドの仮想FSを中核に、
  2つのバックエンドをモデル自身がツール説明文から判断して使い分ける
- 標準ツール（read/write/edit/ls/exec）とWorkspace APIの両方から利用可能
- 目標は「コンテナ利用10%未満」——軽量・大規模なエージェント実行基盤へ

</v-clicks>

---
class: text-center
---

# 参考リンク

- 原文: [AIエージェントに必要なのはコンテナではなくコンピューター](https://blog.cloudflare.com/ja-jp/cloudflare-computer/)
- 英語版: [The Computer, not the Container](https://blog.cloudflare.com/cloudflare-computer/)
- リポジトリ: [github.com/cloudflare/computer](https://github.com/cloudflare/computer)
- チュートリアル: [examples/tutorial](https://github.com/cloudflare/computer/tree/main/examples/tutorial)
- [just-bash](https://justbash.dev/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-05-cloudflare-computer.md
</div>
