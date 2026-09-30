---
routerMode: hash
theme: default
title: "あなたのドメインはポスト量子暗号を使っているか"
info: |
  あなたのドメインはポスト量子暗号を使っているか: 自分で確認できるようになりました の解説スライド。
  原文: https://blog.cloudflare.com/post-quantum-visibility/
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

# あなたのドメインはポスト量子暗号を使っているか

<div class="text-xl pt-2">自分で確認できるようになりました</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/post-quantum-visibility/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- ドメイン単位で<strong>ポスト量子（PQ）暗号の利用状況</strong>を確認できるようになった（HTTP Traffic Analytics / Logpush / Log Explorer）
- 従来は Radar の全体集計（ブラウザ通信の約 70%、オリジン接続の約 15%）のみ
- 訪問者側は <code>ClientTLSKeyExchangeGroup</code>、オリジン側は <code>OriginTLSKeyExchangeGroup</code> で確認
- TLS 1.3 を有効にすれば、対応する訪問者とは X25519MLKEM768 が<strong>自動で交渉</strong>される
- 古いオリジンは <strong>Cloudflare Tunnel</strong> の背後に置けば、改修なしで PQ 化できる

---

# アジェンダ

- 背景: PQ 移行と、見えなかったドメイン単位の状況
- TLS における PQ 暗号（X25519MLKEM768）
- 訪問者から Cloudflare への接続の可視化
- ログフィールドとコード例
- オリジンへの接続と Cloudflare Tunnel
- ユースケース・まとめ

---

# 背景: なぜ今 PQ 暗号化か

- NIST（2024 年）: RSA と ECC は <strong>2030 年までに非推奨</strong>にすべき。多くの政府・規制当局も支持
- <strong>harvest-now-decrypt-later</strong>: 今データを収集し、将来の量子コンピュータで解読する攻撃
- 3〜10 年後も価値があるデータ（公共・防衛・金融・通信・医療など）は早めの保護を検討
- Cloudflare の多くの製品は、すでにハイブリッド ML-KEM で PQ 暗号化されている

---

# 課題: ドメイン単位では見えなかった

- Radar: ブラウザ通信の<strong>約 70%</strong>（訪問者 → Cloudflare）が PQ 暗号化。オリジン接続は<strong>約 15%</strong>
- いずれも<strong>全体の集計値</strong>。TLS バージョンはドメイン単位で見えても、<strong>暗号アルゴリズム</strong>は見えなかった
- 答えられなかった問い: 「www.example.com への通信のうち PQ の割合は？」
- 規制への準拠、移行のトラブルシューティング、量子攻撃者にさらされる通信量の把握に必要

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVDEE1XHHY6P8G9B8TBEC.png" style="max-height: 150px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/（図は本文から推定した内容: 2 つの接続）</div>

---

# TLS 1.3 の PQ 暗号: X25519MLKEM768

- TLS 1.3 で PQ 暗号化に推奨される鍵交換グループは<strong>これだけ</strong>。主要ブラウザの多くが優先して使う
- クライアントとサーバーが X25519（ECDHE）と ML-KEM の<strong>両方</strong>を実行し、2 つの共有秘密を組み合わせる
- <strong>どちらか一方が安全なら全体も安全</strong>（ベルトとサスペンダー）
- TLS 1.2 以前では PQ 暗号化は使えない
- 他のグループ（X25519 / P-256 / P-384）は古典的な ECDHE。RSA 鍵共有は量子に脆弱

---

# Chrome で確認する

右クリックの「検証」から Security タブを開くと、使用中の鍵共有アルゴリズムが分かる。

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MRV83YB5G0D61BV95JEG31.png" style="max-height: 330px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/（TLS 1.3, X25519MLKEM768, AES_128_GCM の表示）</div>

---

# PQ 暗号化と PQ 認証は別の話

| | 内容 | 状況 |
|---|---|---|
| <strong>PQ 暗号化</strong>（鍵共有） | ハイブリッド ML-KEM（X25519MLKEM768） | 広く展開済み。今回の可視化の対象 |
| <strong>PQ 認証</strong>（証明書・署名） | RSA / ECC から ML-DSA などへ | オリジンが ML-DSA-44 証明書で接続可能。Merkle Tree Certificates 対応の認証局も発表 |

- PQ 認証の可視化は、展開が広がってから追加する予定

---

# ダッシュボード: TLS Key Exchange カード

Analytics の HTTP Traffic（下の方）に、訪問者から Cloudflare への接続の専用カードが加わった。

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVBESXRRZ46JM51ZP60AS.png" style="max-height: 290px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/（テストドメインの例）</div>

---

# カードの読み方

| 表示 | 意味 |
|---|---|
| <strong>X25519MLKEM768</strong> | PQ 暗号化（TLS 1.3） |
| X25519 / P-256 / P-384 | 古典的な ECDHE（TLS 1.3 以下） |
| <strong>None</strong> | RSA 鍵共有（TLS 1.2 以下）、または TLS なし |
| X25519Kyber768Draft00 | 標準化前の旧 PQ アルゴリズム |

- 旧アルゴリズムは、これだけが PQ 手段のクライアントを後退させないよう、観測が極小になるまで削除を待つ

---

# PQ 化のヒント

- X25519MLKEM768 がまったく見えない → <strong>TLS 1.3 が有効か</strong>を確認
- 場所: SSL/TLS > Edge Certificates の TLS 1.3 スイッチを On
- PQ 専用の設定はなく、TLS 1.3 有効かつ訪問者が対応なら<strong>自動で交渉</strong>
- 古典的な鍵共有や None が大半 → 訪問者が<strong>非ブラウザのクライアント</strong>（X25519MLKEM768 や TLS 1.3 非対応）の可能性

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3MRV94FNTJRTWC4MCDFN5RE.png
backgroundSize: contain
---

# フィルタで非 PQ 通信を抽出

- 鍵交換グループは HTTP Traffic の<strong>フィルタ条件</strong>としても使える
- 例: Client TLS key exchange group が X25519MLKEM768 と<strong>等しくない</strong>通信だけを表示
- リクエスト数の推移や国別の量を、非 PQ 通信に絞って調べられる

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/（フィルタ適用後の画面）</div>

---

# ログフィールド: ClientTLSKeyExchangeGroup

集計だけでなく、個別のログ行でも確認できる。

- HTTP Requests データセットの TLS カテゴリにある新フィールドを有効化
- Log Explorer と Logpush のログで、リクエスト単位の鍵交換を確認

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVAAP0736RGJ3D10D5SNT.png" style="max-height: 250px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/（フィールド選択画面）</div>

---
layout: two-cols
---

# コード例: Logpush のログ

```json
{
  "EdgeResponseStatus":200,
  "EdgeStartTimestamp":"2026-09-20T00:08:24Z",
  "RayID":"...",
  "ClientTLSKeyExchangeGroup":"X25519MLKEM768"
}
```

::right::

<div class="pt-16 text-left text-sm">

- 最後の行が新フィールド。ここでは PQ 暗号化の接続
- 他の値: <code>X25519</code>、<code>P-256</code> など
- <code>NONE</code> は TLS 未使用、<code>UNK</code> は判定不能
- オリジン側は <code>OriginTLSKeyExchangeGroup</code>

</div>

---

# オリジンへの接続とその先

- <code>OriginTLSKeyExchangeGroup</code> で Cloudflare からオリジンへの接続も Logpush に出力 → 訪問者からオリジンまで<strong>エンドツーエンド</strong>で確認
- 同じドメインでは全訪問者接続で同じ値になるため、HTTP Traffic Analytics には<strong>表示されない</strong>
- 鍵交換グループ統計は「暗号の可視化」構想の最初のマイルストーン。テレメトリは追加の暗号パラメータも取り込める設計
- 将来は PQ 認証（Merkle Tree Certificates を含む）も可視化予定

---

# 古いオリジンは Cloudflare Tunnel で

- PQ 暗号化に対応しにくい古いオリジンサーバーでも、<strong>アップグレードなし</strong>で対応できる
- オリジン側の <code>cloudflared</code> から Cloudflare まで、TLS 1.3 と X25519MLKEM768 でトンネル

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVEF8KS1WD417688VR9XM.png" style="max-height: 200px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/（Cloudflare Tunnel を使う構成。図の説明は筆者が補った）</div>

---

# ユースケース1: 規制への対応状況の確認

- PQ 暗号化を求める規制や社内基準に対し、ドメインごとの利用割合を数値で確認
- TLS Key Exchange カードで X25519MLKEM768 の割合を把握

---

# ユースケース2: PQ 移行のトラブルシューティング

- PQ を期待しているのに X25519 や None が多い → TLS 1.3 の設定と、クライアントが非ブラウザでないかを確認
- フィルタで非 PQ 通信だけを抜き出し、国・パスなどの切り口で調べる

---

# ユースケース3: 量子攻撃者にさらされる通信量の把握

- PQ でない通信の比率から、harvest-now-decrypt-later のリスクにさらされる割合を見積もる
- <code>ClientTLSKeyExchangeGroup</code> をログで集計し、時系列でも追跡

---

# ユースケース4: 古いオリジンの PQ 化

- <code>OriginTLSKeyExchangeGroup</code> で、Cloudflare とオリジンの間が古典暗号のままか確認
- 古いオリジンは Cloudflare Tunnel の背後に置いて改善

---

# まとめ・所感

- 「PQ を提供する」から「PQ の利用状況を見える化する」へ。有効化は TLS 1.3 を On にするだけで、まず現状を数字で知ることが出発点
- 見えるのは鍵交換（暗号化）のみ。PQ 認証は対象外
- None は「TLS なし」と「RSA 鍵共有」が混ざった区分。読むときに注意
- 関連: [IPsec に対する量子ダウングレード攻撃の防止](../ipsec-downgrade-protection/)（IPsec 側の PQ 対応）
- デプロイ可能なサンプルは対象外（中心がダッシュボードとログフィールドの追加のため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/post-quantum-visibility/
- Logpush: https://developers.cloudflare.com/logs/logpush/
- HTTP Requests データセット: https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/zone/http_requests/
- Radar（ポスト量子）: https://radar.cloudflare.com/post-quantum
- RFC 10024: https://www.rfc-editor.org/rfc/rfc10024.html
- オリジンへの PQ: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-to-origin/
- 関連スライド: [IPsec 量子ダウングレード攻撃の防止](../ipsec-downgrade-protection/)
- 関連スライド（PQ 認証・認証局）: [▶ 解説スライド](../pq-ca-with-mtcs/)、[CA 参入の発表](../cloudflare-certificate-authority/)
- 関連スライド（暗号利用の発見・PQ 移行計画）: [▶ 解説スライド](../ai-driven-cryptography-discovery/)
- Wiki: [docs/articles/2026-09-29-post-quantum-visibility.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-post-quantum-visibility.md)
