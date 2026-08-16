// 全デッキ共通: スライド内の画像をクリックで拡大表示するライトボックス実装。
// 外部 CDN・npm パッケージ非依存の vanilla 実装。
// 各デッキの `setup/main.ts`（Slidev の `setup/main.ts` 自動読込フック）から呼び出す。
//
// - 対象: `.slidev-layout` 内の <img>（本文画像）
// - 追加対応: `layout: image-right` / `image-left` / `image` などが描画する
//   背景画像 div（.slidev-layout とは兄弟要素だが、同じスライド
//   （[data-slidev-no] 配下）にあるものはあわせて拡大対象にする）
// - 開閉: クリックで開く → 再クリック / オーバーレイクリック / Esc で閉じる
// - キーボードでの矢印キー送りは妨げない（Esc 以外は素通し）
export function setupImageZoom(): void {
  if (typeof window === 'undefined') return
  // build 時の複数回実行や複数デッキ間での多重登録を避ける
  if ((window as any).__slidevImageZoomInstalled) return
  ;(window as any).__slidevImageZoomInstalled = true

  let overlay: HTMLDivElement | undefined
  let overlayImg: HTMLImageElement | undefined

  function ensureOverlay(): HTMLDivElement {
    if (overlay) return overlay
    overlay = document.createElement('div')
    overlay.className = 'slidev-image-zoom-overlay'
    overlayImg = document.createElement('img')
    overlay.appendChild(overlayImg)
    // オーバーレイ内クリック（画像自体・余白どちらでも）で閉じる
    overlay.addEventListener('click', close)
    document.body.appendChild(overlay)
    return overlay
  }

  function open(src: string): void {
    const el = ensureOverlay()
    overlayImg!.src = src
    el.classList.add('slidev-image-zoom-overlay--active')
    document.addEventListener('keydown', onKeydown, true)
  }

  function close(): void {
    if (!overlay?.classList.contains('slidev-image-zoom-overlay--active')) return
    overlay.classList.remove('slidev-image-zoom-overlay--active')
    document.removeEventListener('keydown', onKeydown, true)
  }

  function onKeydown(e: KeyboardEvent): void {
    // Esc のみ処理し、矢印キー等のスライド送りはそのまま Slidev 側に伝播させる
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    }
  }

  function backgroundImageUrl(el: Element): string | null {
    const bg = getComputedStyle(el).backgroundImage
    const match = /url\((['"]?)(.*?)\1\)/.exec(bg)
    return match ? match[2] : null
  }

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // オーバーレイ表示中のクリックはオーバーレイ側のリスナーに任せる
      if (overlay?.classList.contains('slidev-image-zoom-overlay--active')) return

      // 現在のスライド DOM 内（[data-slidev-no] 配下）に限定する
      const slideRoot = target.closest('[data-slidev-no]')
      if (!slideRoot) return

      // 本文画像: .slidev-layout 内の <img>
      const img = target.closest('.slidev-layout img') as HTMLImageElement | null
      if (img) {
        e.preventDefault()
        e.stopPropagation()
        open(img.currentSrc || img.src)
        return
      }

      // 背景画像: image-right / image-left / image レイアウト等が描く背景 div
      let node: Element | null = target.closest('[style*="background-image"]')
      while (node && slideRoot.contains(node)) {
        const url = backgroundImageUrl(node)
        if (url) {
          e.preventDefault()
          e.stopPropagation()
          open(url)
          return
        }
        node = node.parentElement?.closest('[style*="background-image"]') ?? null
      }
    },
  )
}
