---
routerMode: hash
theme: default
title: AstroのGitHub Issue数をゼロへ導くソフトウェアファクトリーを構築した方法
info: |
  Cloudflare Blog記事「How we built a software factory to drive Astro's GitHub issue count to zero」の解説スライド。
  原文: https://blog.cloudflare.com/astro-issue-triage/
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

# AstroのGitHub Issue数を
# ゼロへ導くソフトウェアファクトリー

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/astro-issue-triage/<br>
公開日: 2026-08-04
</div>

---

# TL;DR

- Cloudflareは、Astroリポジトリで数か月間、バグ報告の再現・診断・プレビュー配布を自動化するトリアージパイプラインを運用
- 中核エンジンは、この種のエージェント自動化を構築するオープンなフレームワーク**Flue**へ発展
- オープンIssue数を200件超から約30件まで削減。数か月以内にゼロ達成の見込み（Astro史上初）
- issue bankruptcyや強制クローズは使わず、GitHub Actions上の隔離されたAIサブエージェントのチームで実現

---

# アジェンダ


- 背景: ソフトウェアファクトリー論争とメンテナーの燃え尽き
- エージェントスキルから始める
- スキルを自動化パイプラインへ
- トリアージからフレームワーク（Flue）へ
- エージェント自動化がもたらした効果
- コード例: GitHub Actionとしての利用
- ユースケース


---

# 背景: 2つの静かな議論

<div class="grid grid-cols-2 gap-4">
<div>

### ソフトウェアファクトリー論争
- AIエージェントを組み合わせて自律的にソフトウェアを作る発想
- 実現可能性・自動化の限界を巡る終わりない議論
- すでに失敗と結論づける声も

</div>
<div>

### OSSメンテナーの燃え尽き
- AIによりIssue/PR生成はほぼ無料に
- メンテナーが読む側のコストは膨大
- 従来のやり方が量の前で崩れる

</div>
</div>

---

# Cloudflareが示すのは「実際の成果」


- Astroリポジトリで自動トリアージパイプラインを数か月運用
- バグ報告を読み取り → サンドボックスで再現 → 根本原因を診断 → プレビューリリースを配布
- エンジンは **Flue**（オープンなエージェント自動化フレームワーク）へ発展


<br>


**オープンIssue数: 200件超 → 約30件**、数か月以内にゼロを見込む
（5年以上の歴史で初めての快挙）


---

# どうやって達成したか


- ❌ 「issue bankruptcy」宣言
- ❌ 反応の止まったチケットの自動クローズ
- ❌ 報告の無視


<br>


✅ GitHub Actions上で動く**隔離されたAIサブエージェントのチーム**による自動トリアージ


---

# ① エージェントスキルから始める


- 手作業のIssueトリアージは時間がかかり、報われにくい作業（1件の再現に数時間かかることも）
- **エージェントスキル**をローカルで開発・テスト
- 同じスキルをそのままGitHub Action上でも再利用


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4HM3V36EC0NEZAT3Y9Q3DK.png
backgroundSize: contain
---

# トリアージスキルの4フェーズ

Reproduce → Diagnose →
Verify → Fix

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/astro-issue-triage/
</footer>

---

# トリアージスキルの4フェーズ


1. **Reproduce**: 再現用リポジトリをクローンして検証
2. **Diagnose**: コードベースを計装しログで根本原因を特定
3. **Verify**: テストスイート・コメント・ドキュメントで真のバグか判定
4. **Fix**: 再現を失敗する単体テストに変換し、修正をデプロイ


<br>


各フェーズは**隔離されたサブエージェント**が担当し、`report.md` で情報を引き継ぐ
→ 「バグが無くても解決策を捻り出すバイアス」を防ぐ


---

# ② スキルを自動化パイプラインへ


- ロジックをGitHubワークフローに直接組み込み、推論過程を監査可能に
- パイプライン自体は状態を持たない、**ラベル駆動のステートマシン**
- Issueの**既存コメントを読み返す**ことで現在地と次のアクションを判断


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4HM3RKB6EVF79SRVAVYXZD.png
backgroundSize: contain
---

# ラベル遷移で駆動する
# ステートマシン

`triage needed` →
（修正確認後）→ `fix verified`

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/astro-issue-triage/
</footer>

---

# 修正から検証までの流れ


1. エージェントが修正にたどり着く
2. `pkg.pr.new` でプレビューリリースを作成
3. 要約・ログ・インストール手順をIssueに投稿
4. 報告者が自分のプロジェクトでパッチを検証
5. 確認できれば自動でプルリクエストを作成


---

# ③ トリアージからフレームワークへ


- イベントに反応し、隔離されたサブエージェント列を実行し、推論とアクションを分離
- これは**GitHubに固有の仕組みではなく、単なるワークフロー**
- Slackメッセージ・cronジョブ・Webhookからでも同様に動作しうる


<br>


この気づきを一般化したのが **Flue**
——プラットフォームに依存しない、耐久性のあるエージェント/ワークフローフレームワーク


---

# ④ エージェント自動化がもたらした効果

<div class="grid grid-cols-2 gap-4">
<div>

### 懸念
- ボット応答が事務的に見える
- メンテナーとユーザーの断絶が広がる

</div>
<div>

### 実際
- Discordでの直接エンゲージメント
- RFC議論への積極参加
- コントリビューターとの協働

</div>
</div>

<br>


**むしろ以前より多く、より有意義な場でユーザーと対話している**


---

# エージェントが失敗したときの解釈


基本方針: AIエージェントは着信Issueの**大多数を解決できるべき**



- **不透明な抽象化**: 人間もコード構造に苦労している兆候
- **ドキュメント不足**: 重要コードに意図を説明するコメントが無い
- **テスト不足**: 包括的なテストカバレッジ、特に単体テストの欠如


---

# 事例: HMRバグの連鎖


- トリアージボットが特定の `if` 条件を繰り返し修正しようとする
- バグは直るが、テスト不足で別の回帰を引き起こす
- 該当ロジックを説明するコメントを追加
- ボットが適応し、誤った修正を試みなくなる


<br>


失敗を追跡して直すたびに、**ボットも次の人間の開発者も**コードベースへの理解が深まる


---

# ワークフローをGitHub Actionへ


- 当初はAstroモノレポに直結 → 反復開発が「安全網なしの手術」状態に
- 独立したテスト可能なリポジトリ **triagebot-action** へ分離
- 現在はAstroのIssue管理を支え、他チームへも波及


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4HM4DJZ2JB0XA5V90MRCP5.png
backgroundSize: contain
---

# triagebot-actionの
# アーキテクチャ

Astroモノレポから
独立リポジトリへ

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/astro-issue-triage/
</footer>

---

# コード例: GitHub Actionとしての利用

```yaml {1|2-5|6-7|8|all}
- uses: withastro/triagebot-action@v1
  with:
    read-token: ${{ secrets.GITHUB_TOKEN }}
    write-token: ${{ secrets.BOT_GITHUB_TOKEN }}
    cloudflare-api-key: ${{ secrets.CLOUDFLARE_API_KEY }}
    cloudflare-account-id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    triage-model: cloudflare-workers-ai/@cf/moonshotai/kimi-k2.7-code
    verification-model: cloudflare-workers-ai/@cf/moonshotai/kimi-k2.6
    triage-skill: .agents/skills/triage
```


`read-token`/`write-token` でトークンを分離、`triage-model`/`verification-model` でフェーズごとにモデルを使い分け、`triage-skill` はローカル/CI共通のスキル定義へのパス


---
class: text-center
---

# ユースケース

---

# ユースケース①②: バグトリアージと品質改善


- **OSSのバグ報告トリアージ**: 隔離サブエージェントが再現・診断・検証・修正を処理し、確認が取れればPRを自動作成
- **コードベースの品質改善サイクル**: エージェントの失敗を「抽象化・ドキュメント・テスト」の不足に帰着させ、コメントやテストを追加


---

# ユースケース③: 他プロジェクトへの横展開


- triagebot-actionを直接利用するチーム
- フォークして独自の「ファクトリー」を構築するチーム
- 完成品ではなく「動くリファレンス」として共有


---

# まとめ


- Astroは自動トリアージでオープンIssueを200件超→約30件に削減
- ローカルとCIで**同じエージェントスキル**を完全再利用する設計
- パイプラインの本質は**Issueラベル駆動のステートマシン**
- 一般化した結果が、プラットフォームに依存しないフレームワーク **Flue**
- エージェントの失敗を**コードベース改善の駆動力**として扱う設計思想


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [How we built a software factory to drive Astro's GitHub issue count to zero](https://blog.cloudflare.com/astro-issue-triage/)
- [triagebot-action リポジトリ（GitHub）](https://github.com/withastro/triagebot-action)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-astro-issue-triage.md
</div>
