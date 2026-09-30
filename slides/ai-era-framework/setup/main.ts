// 画像クリック拡大表示（ライトボックス）を有効化する共通セットアップ。
// 実装本体は slides/theme/image-zoom.ts（全デッキ共通）。
import { defineAppSetup } from '@slidev/types'
import { setupImageZoom } from '../../theme/image-zoom'

export default defineAppSetup(() => {
  setupImageZoom()
})
