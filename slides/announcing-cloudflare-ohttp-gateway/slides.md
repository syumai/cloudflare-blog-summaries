---
routerMode: hash
theme: default
title: "Cloudflare OHTTP Gateway の発表: Cloudflare のプライバシー保護インフラを利用しやすく"
info: |
  Announcing Cloudflare OHTTP Gateway – expanding access to Cloudflare's privacy-preserving infrastructure の解説スライド。
  原文: https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/
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

# Cloudflare OHTTP Gateway

Cloudflare のプライバシー保護インフラを利用しやすく

Birthday Week 2026 / Privacy / Protocols / Standards

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- Oblivious HTTP（OHTTP、<strong>RFC 9458</strong>）は、アプリのバックエンドに<strong>ユーザーの IP を見せず</strong>に HTTP リクエストを届ける IETF 標準
- 構成は独立した2つのホップ: <strong>relay</strong>（識別子を隠して転送）と <strong>gateway</strong>（暗号処理）
- 2022年の relay 製品 Privacy Gateway を <strong>Cloudflare OHTTP Relay</strong> に改称し、自己サーブ型の <strong>Cloudflare OHTTP Gateway</strong> をクローズドベータで開始
- ゾーンの有料アドオンとして有効化し、<code>/.well-known/ohttp-gateway</code> で受け付ける。鍵管理は Cloudflare、relay の認証は Cloudflare Access
- 提供は「この秋」。現時点は waitlist 登録

---

# アジェンダ

- 背景: クライアント識別子の痕跡と OHTTP の役割
- OHTTP の基本: relay・gateway・HPKE・二重盲検
- 発表内容: Relay の改称と新しい Gateway
- Gateway を作った理由と設計上の配慮
- Relay と Gateway の選び方、はじめ方
- ユースケース、まとめ

---

# 背景: ユーザーに偏ったプライバシーの負担

<div class="text-left text-sm pt-2">

- ユーザーは VPN・Cookie 無効化・広告ブロッカーなどを求められる
- アプリ開発者も、必要以上にユーザーのことを知ってしまう
  - 典型的な通信は <strong>IP アドレス</strong>や <strong>TLS フィンガープリント</strong>の痕跡を残す
  - 可視性は開発者にとっても負担になりうる
- Cloudflare は、プライバシーをアプリに組み込めるインフラを提供してきた
- OHTTP はその1つ: バックエンドが IP を見ずに HTTP リクエストを受け取る標準

</div>

---

# OHTTP の基本: relay と gateway

<div class="text-left text-sm pt-2">

- <strong>relay</strong>: 暗号化されたリクエストを盲目的に転送し、クライアント識別子をアプリサーバーから隠す
- <strong>gateway</strong>: リクエストをデカプセル化し、レスポンスをカプセル化する。アプリサーバーは通常の HTTP だけを扱う
- relay と gateway は<strong>独立して運用</strong>される
- 暗号化は HPKE（Hybrid Public Key Encryption、RFC 9180）。relay には暗号文の塊しか見えない

<div class="mt-6 p-4 border rounded">

relay が見る: クライアント識別子<br>
gateway・アプリサーバーが見る: リクエスト内容<br>
<strong>どの主体も両方を同時には見ない</strong>（二重盲検）

</div>

</div>

---
layout: two-cols
---

# コード例: アプリサーバーに見える情報

<div class="text-sm pt-2">

上: <strong>通常の通信</strong>では、クライアントの IP・TLS 特性・位置が見える。

下: <strong>relay 経由</strong>では relay の情報だけが見える。

- 複数リクエストを同じユーザーに結び付けられない
- リクエスト内容を IP と紐付けられない

</div>

::right::

<div class="text-xs">

```txt {all}
# 通常（クライアントの情報）
ipAddress: 192.0.2.33   # client's IP
ASN: 7922
tlsCipher: AEAD-CHACHA20-POLY1305-SHA256
tlsVersion: TLSv1.3
Country: US
Region: California      # client's location
City: Campbell
```

```txt {all}
# relay 経由（relay の情報）
ipAddress: 128.62.37.13 # relay's IP
ASN: 18
tlsCipher: AEAD-AES-128-GCM-SHA256
tlsVersion: TLSv1.3
Country: US
Region: Texas           # relay's location
City: Austin
```

</div>

---

# 発表内容: 製品群の拡張

<div class="text-left text-sm pt-2">

- 2022年: relay 製品 <strong>Privacy Gateway</strong> を発表（例: Flo Health の Anonymous Mode、Apple の Private Cloud Compute）
- すでにサーバーを Cloudflare の背後に置く顧客は、Cloudflare の relay を使えない → gateway が必要だった
- 今回の発表
  - <strong>Cloudflare OHTTP Gateway</strong>: 自己サーブ、クローズドベータ
  - Privacy Gateway を <strong>Cloudflare OHTTP Relay</strong> に改称

</div>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WRXFEZBBFT4FFM6BR1MJ6J.png" style="max-height: 150px; margin: 12px auto 0;" />

<div class="text-xs opacity-70 mt-1">既存の Relay を使う場合、顧客が自前の Gateway を用意する。出典: Cloudflare Blog https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/</div>

---

# 2つの選択肢

<div class="text-left text-sm pt-2">

| 選択肢 | 向いているケース |
|---|---|
| Cloudflare <strong>OHTTP Relay</strong>（旧 Privacy Gateway）+ 自前の gateway | アプリサーバーが Cloudflare の外にあり、自分で gateway を運用できる |
| Cloudflare <strong>OHTTP Gateway</strong> + サードパーティの relay | アプリサーバーが Cloudflare の背後（CDN・Workers）にある / サードパーティ（Apple の LiveCallerID など）から OHTTP を受ける / マネージドで遅延と運用負荷を減らしたい |

</div>

---

# なぜ Gateway を作ったか

<div class="text-left text-sm pt-2">

1. <strong>需要</strong>: プライバシーをアプリに既定で組み込みたい開発者が増えているが、まだ難しい
2. <strong>性能</strong>: 経路の増加と復号・暗号化のコストで、自前構成の遅延は大きくなりうる
   - アニーキャストで、グローバルエッジの全サーバーで動作 → relay から gateway までの遅延を最小化
   - CDN 利用時は、復号と origin への解決を同じ拠点内で実施
3. <strong>信頼モデル</strong>: relay とアプリサーバーは、互いに共謀しない別の主体が運用する必要がある（RFC 9458 §6）
   - 以前は Cloudflare の背後のサーバーは Cloudflare の relay を使えなかった

</div>

---

# アーキテクチャ: リクエストの流れ

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WRXG4Z9RE4A337TVG6WY5T.png" style="max-height: 340px; margin: 8px auto 0;" />

<div class="text-sm mt-2">

ユーザー → サードパーティ relay → Cloudflare（Access → OHTTP Gateway）→ アプリサーバー。アプリサーバーが Cloudflare の背後かどうかは選べる。

</div>

<div class="text-xs opacity-70 mt-1">出典: Cloudflare Blog https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/</div>

---

# 設計1・2: エンドポイントと鍵管理

<div class="text-left text-sm pt-2">

- <strong>ゾーンの機能</strong>として、<code>https://your-zone.com/.well-known/ohttp-gateway</code> に OHTTP を送る
- 標準 OHTTP と<strong>チャンク化 OHTTP</strong>の両方に対応。増分処理できるチャンク化を推奨
- 流れ: 受信 → 復号 → アプリサーバーへサブリクエスト → 暗号化したレスポンスを返却
- OHTTP 以外のリクエストは Gateway を通らずサーバーへ（通常の HTTP と併用可能）
- ゾーンに結び付けるため、<code>example.com</code> 宛てのクライアントは <code>foo.example.com</code> には送れるが <code>wikipedia.com</code> には送れない
- <strong>鍵管理は全面的に Cloudflare</strong>。公開 HPKE 鍵は同じパスへの GET で配布し、クライアントは別の IP から取得も可能

</div>

---

# 設計3・4: relay の認証と誤設定の防止

<div class="text-left text-sm pt-2">

- Gateway はクライアントを意図的にほとんど知らない → <strong>relay を認証</strong>する必要がある
  - 復号の<strong>前に Cloudflare Access</strong> を実行
  - 標準の Access ポリシーが使える（mutual TLS、静的なサービス資格情報、外部の独自ロジックなど）
- relay と gateway の両方を Cloudflare 上に置いてしまう誤設定に備える
  - Cloudflare が<strong>クライアントの身元と復号後の内側リクエストの両方を見ない</strong>ようにする
  - <strong>Workers、または Cloudflare 上のプロキシされたホストからのリクエストは復号しない</strong>

</div>

---

# はじめ方

<div class="text-left text-sm pt-2">

1. <strong>waitlist</strong> に登録（機能リクエスト・提供開始の通知）
2. OHTTP クライアントを実装（ohttp.info、サンプルクライアントライブラリ）
   - OHTTP は<strong>ネットワークレベル</strong>のプライバシー。内側のボディに識別情報（メール・ユーザー名など）を入れない
3. relay を用意（任意のインフラ上で動かせる。サンプルコードあり）
   - 専用 relay 事業者の価値: クライアント識別子を含むログを調べないと検証可能に約束できること
4. 運用後のテスト・デバッグに <code>pvcli</code>

</div>

---

# ユースケース1: Cloudflare 背後のアプリ

<div class="text-left text-sm pt-2">

- すでに CDN や Workers でアプリを運用している
- 自前の gateway を運用せずに OHTTP を受けたい
- gateway での復号と origin への解決が同じ拠点内で完結し、遅延を抑えられる
- relay はサードパーティを選ぶ（同じ Cloudflare の relay は使えない）

</div>

---

# ユースケース2: サードパーティからの OHTTP

<div class="text-left text-sm pt-2">

- Apple の LiveCallerID SDK のように、サードパーティのクライアントと relay から OHTTP が届く
- Gateway がその受け口になり、Access で信頼する relay だけを許可する
- アプリ側は、復号済みの通常の HTTP だけを処理すればよい

</div>

---

# ユースケース3: 識別子を切り離したい機能

<div class="text-left text-sm pt-2">

- 記事が relay 側の例として挙げる Flo Health の Anonymous Mode、Apple の Private Cloud Compute と同じ発想
  - 健康情報のリクエストを識別子から切り離す
  - AI 推論リクエストをユーザー ID から切り離す
- 構成によって relay（Relay 製品）か gateway（Gateway 製品）のどちらを Cloudflare に任せるかを選ぶ

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- Relay と Gateway は、<strong>同じ主体が両方運用してはいけない</strong>という信頼モデルから別製品になっている
- OHTTP が隠すのは IP・TLS フィンガープリントなどのネットワーク識別子だけ。ボディの内容は守られない
- 提供状況はクローズドベータ・waitlist（GA ではない）。料金詳細は記事に記載なし
- HPKE は PQ 移行の文脈では「Classical encryption」に分類される ▶ <a href="../ai-driven-cryptography-discovery/">解説スライド</a>
- 画像は構成図2点とヘッダーの装飾イラスト。構成図のキャプションは本文の記述と原文に基づく
- 中心機能がクローズドベータで、Gateway は Workers からのリクエストを復号しないため、<code>examples/</code> のサンプルは未作成

</div>

---

# 参考リンク

<div class="text-left text-sm pt-2">

- 原文: https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/
- RFC 9458 Oblivious HTTP: https://www.rfc-editor.org/rfc/rfc9458.html
- RFC 9180 HPKE: https://datatracker.ietf.org/doc/html/rfc9180
- waitlist: https://www.cloudflare.com/lp/privacy-edge/
- Privacy Gateway の発表（2022年）: https://blog.cloudflare.com/building-privacy-into-internet-standards-and-how-to-make-your-app-more-private-today/
- pvcli: https://blog.cloudflare.com/open-sourcing-our-privacy-proxy-cli/
- 関連解説スライド: [AI 駆動の暗号資産の洗い出し](../ai-driven-cryptography-discovery/) / [ポスト量子の可視化](../post-quantum-visibility/) / [Protected Quick Tunnels](../protected-quick-tunnels/)

</div>
