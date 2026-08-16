# AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介

- 原文: [https://blog.cloudflare.com/ja-jp/cloudflare-computer/](https://blog.cloudflare.com/ja-jp/cloudflare-computer/)（英語版: [https://blog.cloudflare.com/cloudflare-computer/](https://blog.cloudflare.com/cloudflare-computer/)）
- 公開日: 2026-08-03

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZB3S8MBM35D38QT8Q470C0V.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

## TL;DR

- 最も高性能なAIエージェントに共通するのは、エージェント専用の「コンピューター環境」——ファイルシステム、シェル、各種ツール、パッケージ、コード実行権限——を持っていることである。
- しかし、全世界のエージェントそれぞれに専用のコンテナ型コンピューティング環境を用意できるほどの計算資源は存在しない。
- Cloudflareはこの課題に対し、高速で効率的な**アイソレート**環境と、完全な**Linuxコンテナ**環境を状況に応じて動的に組み合わせて管理するアプローチを提案する。
- その実装として、AIエージェント向けの実行環境（エージェントランタイム）**`@cloudflare/computer`** の初期プレビュー版が公開された。SQLiteバックエンドの仮想ファイルシステムを中核に、アイソレート型・コンテナ型の2つの実行バックエンドをタスクに応じて自動的に使い分ける。
- 目標は、AIエージェントの作業のうちコンテナが必要になる割合を10%未満に抑えること。

## 背景・課題

### 「頭脳」と「手」の分離

記事はまず、AIエージェント設計の変化を指摘する。エージェント構築においては、判断や指示を行う「頭脳」（AIエージェントの処理ループ）と、実際の作業を行う「手」（コードを実行するサンドボックス環境）を分離できるようになってきている。コーディングを担当するエージェントは、ファイルシステム、シェル、各種ツール、パッケージ、そしてコードを実行する権限を持つ環境（ハーネス）を与えられ、その環境を調査・変更・テストすることで作業を進める。

### CPU資源不足というボトルネック

ここで生じるのがスケーリングの課題である。世界中のすべての企業が、自社ユーザーのAIエージェント1つひとつに専用のコンテナ型コンピューティング環境を提供できるほどの計算資源は存在しない。フルスペックのLinuxコンテナは起動が重く、常時起動しておくにはコストがかかりすぎるため、数億、さらには数十億ものAIエージェントを同時に稼働させる規模には対応できない。単純に「コンテナを増やす」発想では、この先のエージェント経済のスケールを支えきれないというのが記事の問題提起である。

## アーキテクチャ

### Cloudflareの答え: アイソレート技術

Cloudflareは、Workers発表（約10年前）およびDurable Objects発表（約6年前）の頃からアイソレート技術に投資を続けてきた。アイソレートは以下の特性を持つ。

- ほぼ無限に近い水平方向のスケール拡張に対応できる
- 非常に高速に起動・終了できる
- アイドル時には休止状態（ハイバネーション）に入り、状態を保持したままリソース消費を抑えられる

この特性により、フルコンテナよりもはるかに軽量かつ大量に、エージェントの実行環境を賄えるようになる。

### @cloudflare/computer とは

記事では、AIエージェント向けの実行環境（エージェントランタイム）である [`@cloudflare/computer`](https://github.com/cloudflare/computer) の初期プレビュー版が発表された。GitHub上でOSSとして公開されている。

### 仮想ファイルシステム（Workspace）

`@cloudflare/computer` の中核は **Workspace** と呼ばれる仮想ファイルシステムである。SQLiteをバックエンドに使用しており、クラウドストレージやソースコード管理システムなど、さまざまなソースから内容を取り込むことができる。

![ワークスペース構造](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHH01B75YXB0CMQ395YW3.png)
*図: ワークスペースのアーキテクチャ全体像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

![エージェントハーネス分離図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHGR1F725Y45HAYQ7EP4V.png)
*図: 「頭脳」（処理ループ）と「手」（実行サンドボックス）の分離（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

![スケーリング課題](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHG8112R261JGEK5515Y7.png)
*図: 数億〜数十億規模のエージェントを支えるスケーリングの課題（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

### 2つの実行バックエンド

Workspaceは、タスクの性質に応じて2種類の実行バックエンドを使い分ける。

1. **アイソレート型**: [just-bash](https://justbash.dev/) を使用してシェルコードをJavaScriptへ変換し、動的なWorker上で実行する。軽量なファイル操作や単純なコマンド実行に向いており、高速起動・大量スケール・ハイバネーションといったアイソレートの利点をそのまま享受できる。
2. **コンテナ型**: Cloudflare Containersを使用して、完全なLinux環境を提供する。npmやnodeなどのパッケージマネージャー、テストランナー、`$PATH` 上の実バイナリが必要な、より重量級のタスクに向いている。

![垂直/水平スケール](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHGJWE4D64HEZPZ1PMCAN.png)
*図: アイソレート型とコンテナ型、それぞれのスケール特性（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

### ファイルシステム共有の仕組み

アイソレートとコンテナは、それぞれ独立した環境でありながら**同じファイルシステムを共有**して作業を行う。コンテナ側ではWorkspaceがFilesystem in Userspace（**FUSE**）としてマウントされ、各環境で変更された内容は元となるファイルシステムと常に同期される。これにより、あるタスクの前半をアイソレートで、後半（本格的なビルドやテストが必要な部分）をコンテナで実行する、といった切り替えがファイルの一貫性を保ったままシームレスに行える。

![ファイルシステム共有](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0QHGH4NAWXAMWKSJ5JDMQY.png)
*図: アイソレートとコンテナで共有されるファイルシステムの仕組み（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

### 標準ツール

`@cloudflare/computer` は、AI SDKと互換性のあるツールキットを提供する。よく使用される基本的なツールとして `read`・`write`・`edit`・`ls`・`exec` が標準で含まれており、これらをエージェントに渡すだけでファイル操作とコマンド実行の両方をカバーできる。

![ファイルシステムAPI](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4CFYR52H8M9DBZFH552T63.png)
*図: ファイルシステムAPI／ツールキットの構成（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-computer/）*

### モデルによるバックエンド自動選択

各ツールの説明文には、現在のタスクに適した実行ランタイム（アイソレートかコンテナか）をAIエージェント自身が選択できるような情報が含まれている。記事では、最先端のAIモデルはこの判断を非常に高い精度で行い、本当に必要な場合にのみコンテナを利用することが確認されているとしている。つまり「まずは軽量なアイソレートで試し、npm installやテスト実行など本格的な処理が必要になった時だけコンテナに切り替える」という判断を、モデル自身がツールの説明文から読み取って行う設計になっている。

## コード例

記事では、GitHub Issueのバグ報告を受け取って調査・修正・検証まで行う「バグトリアージエージェント」を題材に、4本のTypeScriptコード例が段階的に示されている。2本目以降は1本目のクラス定義に追記していく形で構成されており、記事本文でも重複するボイラープレート部分は `/* Example code truncated for readability... */` として省略されている（本ページでも原文の記載どおりに引用する）。

### 例1: アイソレートのみで動くバグトリアージエージェント

`Think`（Cloudflareのエージェントフレームワーク）を継承し、`workspaceBash` を無効化した上で `Workspace` をアイソレート専用構成で持たせている、最小構成の例。

```typescript
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
code, make a focused fix when it is safe, and run verification. In your
final answer, include what you changed, which commands you ran, and
whether verification passed.`;
  }
}
```

**解説**: `Workspace` は Durable Object の `storage`（`this.ctx.storage`）をバックエンドに構築される。`workspaceBash = false` によって、フレームワーク標準のシェル実行機構ではなく `@cloudflare/computer` 側のツールセットを使うよう切り替えている。`getSystemPrompt()` では、エージェントに「`/workspace/repo` のプロジェクトを使ってバグを再現し、コードを調査し、安全な範囲で修正し、検証を実行せよ」という明確な作業指示を与えている。この段階ではコンテナバックエンドをまだ持たないため、アイソレート（just-bash）のみで動作する。

### 例2: コンテナバックエンドの追加

`withWorkspaceContainer` でクラスを拡張し、`CloudflareContainerBackend` を `Workspace` に登録することで、コンテナ実行環境を追加している。

```typescript
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

**解説**: `withWorkspaceContainer(Think)` というミックスイン形式のクラス拡張により、コンテナのライフサイクル管理機能が `Agent` に追加される。`backends` 配列に `CloudflareContainerBackend` を渡すことで、Workspaceはアイソレート（デフォルト）に加えてコンテナも実行先として認識するようになる。`workspace.binding` と `workspace.id` は、どのDurable Object（＝どのエージェントインスタンス）に紐づくコンテナかを一意に特定するための情報である。ここまでで、1つのエージェントがアイソレートとコンテナの両方を使い分けられる状態になる。

### 例3: 標準ツールキットと独自ツールの統合

`createAITools` を使い、`@cloudflare/computer` の標準ツールセットに、独自定義の `replyToIssue` ツールを組み合わせて `getTools()` を構成している。

```typescript
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

**解説**: `createAITools()` はAI SDK（`ToolSet`）互換のツール一式を生成するヘルパーで、`read`・`write`・`edit`・`ls`・`exec` などの標準ツールをまとめて渡せる。ここでの注目点は `shell.backends.container.description` に書かれた自然文の説明である。「ファイル操作以上のことが必要なときに使え」という指示がツールの説明文自体に埋め込まれており、これがまさに前述の「モデルによるバックエンド自動選択」の実体である。モデルはこの説明文を読んでバックエンドを選ぶため、プロンプトエンジニアリングというより「ツール設計」でルーティングを制御していることが分かる。最後に `replyToIssue` という独自ツール（GitHub Issueへの返信機能、実装は `./tools/github` に定義）を標準ツール群と並べて追加し、エージェント固有の振る舞いを組み込んでいる。

### 例4: Workspace APIの直接利用

エージェントのエントリーポイントとして、`workspace.fs`（ファイルシステムAPI）と `workspace.git`（Git操作API）を直接呼び出し、トリアージを開始する `startTriage()` メソッドの例。

```typescript
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

**解説**: この例は、エージェントの「頭脳」側（アプリケーションコード）からWorkspaceを直接プログラム的に操作する使い方を示している。`workspace.fs.mkdir` / `writeFile` でバグ報告をファイルとして書き出し、`workspace.git.clone` でリポジトリをチェックアウトしたうえで、`submitMessages()` によってエージェントの処理ループにユーザーメッセージとして「このバグをトリアージせよ」という指示を投入している。ツール呼び出しをAIモデル任せにするだけでなく、外部トリガー（例えばGitHub Issueのwebhook）を起点にホスト側のコードがWorkspaceをセットアップしてからエージェントを起動する、という統合パターンの典型例になっている。

## ユースケース

### バグトリアージ

上記コード例で一貫して題材にされているのがこのユースケースである。GitHub Issueとして届いたバグ報告をもとに、エージェントが `/workspace/repo` のコードを読み、バグを再現し、安全な範囲で修正し、検証コマンドを実行して結果を報告する。調査・小さな修正はアイソレートで完結することが多く、テストスイートの実行など重い処理が必要な場面でのみコンテナに切り替わることが想定される。

### JavaScriptアプリケーションの構築・テスト・デプロイ

npm installやビルドツール、テストランナーの実行など、実バイナリと `$PATH` に依存する重量級の作業が必要になるユースケース。コード例3のツール説明文（`"npm, node, package managers, test runners, and real binaries on $PATH"`）がまさにこの用途を想定したものであり、こうした場面ではモデルが自律的にコンテナバックエンドを選択する。

### ドキュメント生成

各顧客向けに最適化されたドキュメント作成が、記事内で挙げられているユースケースの1つである。ファイルの読み書きが中心となる作業のため、多くの場合アイソレートのみで完結し、コンテナを起動するコストをかけずに高速に処理できる。

（このほか、記事では「Webブラウザーを使った複雑な作業」も言及されている。）

## 将来像

`@cloudflare/computer` の目標は、AIエージェントの作業のうちコンテナが必要になる割合を**10%未満**に抑えることにあるとされている。音声・動画編集やドキュメント作成といった作業を含む多くのタスクをアイソレート上で実行できるようにすることで、コンテナは「本当に完全なLinux環境が必要な場合」のみに限定的に使う、という将来像が描かれている。これは、数億〜数十億規模のエージェントを実用的なコストで運用するための設計思想そのものである。

## 利用開始

```
npm install @cloudflare/computer
```

- リポジトリ: [github.com/cloudflare/computer](https://github.com/cloudflare/computer)（早期プレビュー・OSS公開）
- チュートリアル: [examples/tutorial](https://github.com/cloudflare/computer/tree/main/examples/tutorial) で手順を追って学べる

## 所感・ポイント

- 「コンテナ vs アイソレート」という二項対立ではなく、「まずアイソレート、必要な時だけコンテナ」という**ハイブリッド設計**が本記事の核心である。プロンプトではなくツールの説明文でバックエンド選択を制御している点は、エージェント設計のパターンとして応用が利きそうである。
- ファイルシステムをSQLiteで仮想化し、アイソレートとコンテナの双方から同じ実体に対してFUSE等でアクセスさせる構成は、「環境をまたいでも状態が破綻しない」ことを保証する仕組みとして興味深い。
- コード例が「バグトリアージエージェント」という一貫したシナリオで積み上げ式に示されているため、実際にプロダクトへ組み込む際の設計の流れ（最小構成→コンテナ追加→ツール統合→外部トリガーとの連携）がそのまま参考になる。

> **Workers サンプル**: [examples/cloudflare-computer/](../../examples/cloudflare-computer/) — Durable Object上でWorkspace（SQLiteバックエンドの仮想ファイルシステム）だけを使い、ノートの書き込み・一覧取得を体験できる最小サンプル（実行バックエンド・AIモデル呼び出しは含まず）。

## 関連リンク

- [@cloudflare/computer リポジトリ（GitHub）](https://github.com/cloudflare/computer)
- [チュートリアル（examples/tutorial）](https://github.com/cloudflare/computer/tree/main/examples/tutorial)
- [just-bash](https://justbash.dev/)
