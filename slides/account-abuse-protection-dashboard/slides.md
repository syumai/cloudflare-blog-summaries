---
routerMode: hash
theme: default
title: "糸をたどる: アカウント不正を調査するための新しいダッシュボード"
info: |
  Follow the thread: a new dashboard to investigate account abuse の解説スライド。
  原文: https://blog.cloudflare.com/account-abuse-protection-dashboard/
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

# Account Abuse Protection

糸をたどる: アカウント不正を調査するための新しいダッシュボード

Birthday Week 2026 / Application Security / Bot Management

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/account-abuse-protection-dashboard/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- AI で「それらしい本人」を偽装しやすくなり、<strong>一時点の本人確認</strong>だけでは足りない。アカウントの履歴と照らす<strong>ステートフルな信頼モデル</strong>が必要
- Account Abuse Protection（AAP）は、識別子をハッシュ化した<strong>Hashed User ID</strong>にエッジで観測したシグナルを蓄積する
- 新しい<strong>不正ダッシュボード</strong>で、母集団の概観から個別アカウントまで「調査の漏斗」として辿れる
- 調査は 異常の発見 → 絞り込み → アカウント調査 → 対応（WAF ルール）の4段階
- PII 保護のため専用ロールを追加。Early Access 顧客に先行提供

---

# アジェンダ

- 背景: 一時点の本人確認の限界とステートフルな信頼モデル
- AAP の仕組み（Hashed User ID と履歴の蓄積）
- ダッシュボード: 母集団の概観
- 調査の4ステップ（クレデンシャルスタッフィングの例）
- 個別アカウントの詳細ビュー
- データ露出を抑える設計、提供状況、ユースケース

---

# 背景: 一時点の本人確認の限界

<div class="text-left text-sm pt-2">

- 従来: 正しいパスワード、生体認証、liveness チェックなど「その場で通過できるか」
- 破るには実在ユーザーから認証情報を盗む必要があり、実行も拡大も難しかった
- 現在: AI により、漏えい済み認証情報と合成メディアを組み合わせた ID の偽造・模倣が容易に
- 1回の確認を通過しても、アカウント自体が信頼できるとは限らない

<div class="mt-6 p-4 border rounded">

1回のやり取りは偽造できても、<strong>正当な振る舞いが一貫して続くパターン</strong>は作りにくい。

</div>

</div>

---

# ステートフルな信頼モデル

<div class="grid grid-cols-2 gap-4 pt-4 text-left text-sm">
<div class="p-4 border rounded">

<strong>ステートレス（従来）</strong>

「この人は今、チェックを通過できるか」

- 一時点の判断
- 通過した瞬間だけを見る

</div>
<div class="p-4 border rounded">

<strong>ステートフル（本記事）</strong>

加えて「このアカウントについて知っていること・確立された振る舞いと合っているか」

- やり取りごとに履歴（振る舞い・ネットワーク・デバイス）と照らして信頼を再評価

</div>
</div>

---

# AAP の仕組み

<div class="text-left text-sm pt-2">

1. 顧客が既存のログイン/サインアップのフローから識別子（メール・ユーザー名・電話番号）を設定
2. Cloudflare がその値を暗号学的にハッシュ化し、プライバシーを保つ<strong>ドメインごとの Hashed User ID</strong> を作る
3. ログイン/サインアップのたびに、イベントとエッジで観測したネットワーク・デバイスのシグナルを追加
4. 履歴が「普段の振る舞い」の文脈となり、逸脱を見つけやすくなる

<div class="mt-4 text-xs opacity-70">対象は不正対策チーム（セキュリティインテリジェンス、調査、Trust & Safety、リスク/コンプライアンス）</div>

</div>

---

# ダッシュボード: 調査の漏斗

<div class="text-left text-sm pt-2">

- 総ログイン/サインアップ量、生成したアカウント数、ユニーク IP とデバイス数
- 国別・ASN 別の内訳で活動の発生場所を把握
- 概観が答える問い
  - ログイン/サインアップの量が想定外に変化したか
  - 失敗ログインや漏えい認証情報の一致が増えているか
  - 失敗率が最も高いアカウントはどれか
  - 国・ASN・時間帯に集中していないか
  - 攻撃の影響を受けた可能性のあるアカウントはどれか

</div>

---

# 図: アカウント母集団の概観

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK39S63QAFS763E1VMJST.png" style="max-height: 320px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 3.2K イベント / 824 アカウント / 939 IP / 758 デバイス。午後に Login が急増
- 下部は国別（US 1.5K など）と ASN 別の内訳

</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# 調査 1: 異常の発見

<div class="text-left text-sm pt-2">

- 失敗ログインの増加を受け、ログインイベントの Leaked credential check の結果を確認
- 例: 約 2.4K イベントが漏えいしたユーザー名/パスワードの結果、11.7K が clean
- <strong>調査の手がかりであり、全アカウントの侵害の確認ではない</strong>
- 複数アカウントが同じ IP・ASN に結び付いていないか、1アカウントが多数の IP から現れていないかで範囲を推定

</div>

<div class="text-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK1EHNXCC357WF8PAB5V6.png" style="max-height: 130px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# 調査 2: 範囲の絞り込み

<div class="text-left text-sm pt-2">

- フィルタで、懸念される信号の組み合わせを持つアカウントに絞る
- 例: 失敗ログイン 3 回以上、漏えい認証情報イベント 3 件以上、ユニーク IP 5 件以上
- 絞り込んだ集団から、直近の活動が最も緊急な Hashed User ID を選ぶ

</div>

<div class="text-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK5FS707J1AZ32WDR9RPP.png" style="max-height: 230px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# 絞り込み後のアカウント一覧

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNJXRX8MVSPKDVSA27HF99.png" style="max-height: 250px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-4">

- User ID（Hashed User ID）ごとに Events・Failed logins・Leaked credential events・Unique IPs・Top country・Top IP
- 該当したアカウントから、レビュー対象を選ぶ

</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# 調査 3: アカウントの調査

<div class="text-left text-sm pt-2">

- ログイン試行、新しいデバイス・場所を確認し、活動の展開を再構成する
- 以前の clear なイベントと後の不審な活動を比べ、始まった時点と単発か反復かを判断
- 各イベントの <strong>Ray ID</strong> から Security Events で関連情報を参照できる

</div>

<div class="text-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNJSEMWP2MDJSTG4YTJVM5.png" style="max-height: 270px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# 調査 4: 対応を決める（WAF ルール）

<div class="text-left text-sm pt-2">

- 侵害が確認されたら、確立された復旧プロセスを開始
- <strong>Hashed User ID を WAF ルールで使い</strong>、以後のリクエストを Challenge / Block

```txt
upper(cf.fraud.user_profile.id) in {"9F1A2B7C…60711" "9F3A2B7C…50718" …}
→ アクション: Managed Challenge
```

- 画面のスクリーンショットから読み取った式（ID は一部省略。記事本文にコードブロックはない）
- ルール名は「Mitigate by UserIDs」

</div>

---

# 図: WAF ルール作成画面

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK783VJGV0A4RT6B4XWEG.png" style="max-height: 340px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 式 213 / 4000 文字。アクションは Managed Challenge

</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# 個別アカウントの詳細ビュー

<div class="text-left text-sm pt-2">

- ログイン成功率、漏えい認証情報の一致、よく関連するネットワーク・場所・デバイス
- 下に個々のイベント（タイムスタンプ、Ray ID、適用された緩和策）
- 答える問い
  - 単発か、反復した試行の一部か
  - 新しい国・ネットワーク・IP・デバイスが現れたか
  - サインアップ直後にログインが集中したか
  - サインアップ時とログイン時でデバイスやネットワークが違うか

</div>

---

# 図: 個別アカウントのビュー

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WNJZJ0KP9AQPATSVJAFWQ4.png" style="max-height: 330px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- Account details（イベント数、ログイン成功率 95%、Unique IPs など）と活動テーブル。右上に「Mitigate account」

</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/</div>

---

# データ露出を抑える設計

<div class="text-left text-sm pt-2">

| ロール | 制御する対象 |
|---|---|
| Account Abuse Protection | ダッシュボードへのアクセス |
| Account Abuse Protection PII | 追加のアカウントレベルの PII（例: メール）へのアクセス |

- 管理者は、必要な範囲に応じて need-to-know でロールを割り当てる
- PII を含む Logpush ジョブの作成・更新にも PII ロールが必要
- ダッシュボードとデータエクスポートの両方で最小権限を適用できる

</div>

---

# 提供状況

<div class="text-left text-sm pt-2">

- まず Account Abuse Protection の <strong>Early Access 顧客</strong>に提供
- Bot Management Enterprise の顧客は Early Access にサインアップ可能
- ボット検知は「自動化された活動か」を、AAP は「ログイン/サインアップが正当で一貫した利用に見えるか」を調べる
- 両者で、アカウント作成とログインにまたがる自動化・人手による不正に対処

</div>

---

# ユースケース 1: クレデンシャルスタッフィング対応

<div class="text-left text-sm pt-2">

- 失敗ログインの増加 → 漏えい認証情報の一致 → フィルタで高リスクのアカウントに絞る
- 同じ IP・ASN への集中から攻撃範囲を推定し、レビューの優先順位を付ける
- 復旧プロセス、または Hashed User ID を使った WAF ルールで対応

</div>

---

# ユースケース 2: アカウント乗っ取り・サインアップ不正の調査

<div class="text-left text-sm pt-2">

- <strong>乗っ取りの調査</strong>: 過去の clear なイベントと後の不審なログイン（新しい国・IP・デバイス）を時系列で比較
- <strong>サインアップ不正</strong>: サインアップ急増に共通する国・ASN・デバイスを確認し、その後のログイン活動と突き合わせる
- <strong>権限分離</strong>: ダッシュボードの閲覧者と PII の閲覧者を分ける

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 「一時点のチェック」から「アカウント履歴との照合」へ。Hashed User ID が調査の軸
- 調査の漏斗（概観 → 絞り込み → 個別 → 対応）を、1つのダッシュボード上で辿れる
- 画面例の数値は説明用の例。Early Access 向けで、Workers 上の再現サンプルは対象外
- 関連: ▶ <a href="../ai-era-framework/">AI 時代の適応型アプリケーションセキュリティ</a> / <a href="../application-profiles/">Application Profiles</a> / <a href="../threat-signals/">Threat Signals</a> / <a href="../adaptive-ai-waf-testing/">適応型 AI WAF テスト</a>

</div>

---

# 参考リンク

<div class="text-left text-sm pt-2">

- 原文: https://blog.cloudflare.com/account-abuse-protection-dashboard/
- Account Abuse Protection ドキュメント: https://developers.cloudflare.com/bots/account-abuse-protection/
- Early Access の申し込み: https://www.cloudflare.com/lp/account-abuse-protection/
- 関連解説スライド: [AI 時代の適応型アプリケーションセキュリティ](../ai-era-framework/) / [Application Profiles](../application-profiles/) / [Threat Signals](../threat-signals/) / [適応型 AI WAF テスト](../adaptive-ai-waf-testing/)

</div>
