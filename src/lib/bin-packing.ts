// Client-side 3D bin packing — ported from backend BinPackingService
// Multi-strategy Layer-based First Fit Decreasing (FFD)
// Accuracy: ~85-90% vs optimal packing. Good enough for shipping estimates.

export interface PackingItem {
  length: number // cm
  width: number  // cm
  height: number // cm
  weight: number // kg
  quantity: number
}

export interface PackingResult {
  length: number   // cm - box length
  width: number    // cm - box width
  height: number   // cm - box height
  totalWeight: number // kg
  totalVolume: number // cm³
  boxVolume: number   // cm³
  efficiency: number  // % of box used (0-100)
}

interface FlatItem {
  l: number
  w: number
  h: number
}

interface PlacedItem {
  l: number
  w: number
  h: number
  x: number
  y: number
}

interface Layer {
  items: PlacedItem[]
  height: number
  usedWidth: number
  usedLength: number
}

const MIN_DIMENSION = 5 // cm — smallest practical courier box dimension

function expandItems(items: PackingItem[]): FlatItem[] {
  const result: FlatItem[] = []
  for (const item of items) {
    const dims = [item.length, item.width, item.height].sort((a, b) => b - a)
    const flat: FlatItem = { l: dims[0], w: dims[1], h: dims[2] }
    for (let q = 0; q < item.quantity; q++) {
      result.push({ ...flat })
    }
  }
  return result
}

function placeInLayer(layer: Layer, item: FlatItem): void {
  layer.items.push({ l: item.l, w: item.w, h: item.h, x: 0, y: 0 })
  layer.height = Math.max(layer.height, item.h)
  layer.usedLength = item.l
  layer.usedWidth = item.w
}

function tryPlaceInLayer(layer: Layer, item: FlatItem, maxLength: number, maxWidth: number): boolean {
  if (layer.usedLength + item.l <= maxLength && item.w <= maxWidth) {
    layer.items.push({ l: item.l, w: item.w, h: item.h, x: layer.usedLength, y: 0 })
    layer.usedLength += item.l
    layer.height = Math.max(layer.height, item.h)
    return true
  }
  if (item.l <= maxLength && layer.usedWidth + item.w <= maxWidth) {
    layer.items.push({ l: item.l, w: item.w, h: item.h, x: 0, y: layer.usedWidth })
    layer.usedWidth += item.w
    layer.usedLength = Math.max(layer.usedLength, item.l)
    layer.height = Math.max(layer.height, item.h)
    return true
  }
  if (item.w + layer.usedLength <= maxLength && item.l <= maxWidth) {
    layer.items.push({ l: item.w, w: item.l, h: item.h, x: layer.usedLength, y: 0 })
    layer.usedLength += item.w
    layer.height = Math.max(layer.height, item.h)
    return true
  }
  if (item.w <= maxLength && layer.usedWidth + item.l <= maxWidth) {
    layer.items.push({ l: item.w, w: item.l, h: item.h, x: 0, y: layer.usedWidth })
    layer.usedWidth += item.l
    layer.usedLength = Math.max(layer.usedLength, item.w)
    layer.height = Math.max(layer.height, item.h)
    return true
  }
  return false
}

function packLayers(items: FlatItem[], maxLength: number, maxWidth: number): Layer[] {
  const layers: Layer[] = []
  const placed = new Set<number>()

  for (let i = 0; i < items.length; i++) {
    if (placed.has(i)) continue
    const layer: Layer = { items: [], height: 0, usedWidth: 0, usedLength: 0 }
    placeInLayer(layer, items[i])
    placed.add(i)
    for (let j = i + 1; j < items.length; j++) {
      if (placed.has(j)) continue
      if (tryPlaceInLayer(layer, items[j], maxLength, maxWidth)) {
        placed.add(j)
      }
    }
    layers.push(layer)
  }
  return layers
}

function getActualLength(layers: Layer[]): number {
  let max = 0
  for (const layer of layers) {
    for (const item of layer.items) max = Math.max(max, item.x + item.l)
  }
  return max
}

function getActualWidth(layers: Layer[]): number {
  let max = 0
  for (const layer of layers) {
    for (const item of layer.items) max = Math.max(max, item.y + item.w)
  }
  return max
}

function findBestPacking(flatItems: FlatItem[]): { length: number; width: number; height: number } {
  const maxL = Math.max(...flatItems.map(i => i.l))
  const maxW = Math.max(...flatItems.map(i => i.w))
  const sumL = flatItems.reduce((s, i) => s + i.l, 0)
  const sumW = flatItems.reduce((s, i) => s + i.w, 0)

  const strategies: [number, number][] = [
    [maxL, maxW],
    [sumL, maxW],
    [maxL, sumW],
    [maxL * 2, maxW * 2],
    [sumL, sumW],
  ]

  let bestVolume = Infinity
  let bestResult = { length: maxL, width: maxW, height: 0 }

  for (const [baseL, baseW] of strategies) {
    const sorted = [...flatItems].sort((a, b) => b.l * b.w - a.l * a.w)
    const layers = packLayers(sorted, baseL, baseW)

    const actualLength = getActualLength(layers)
    const actualWidth = getActualWidth(layers)
    const actualHeight = layers.reduce((s, layer) => s + layer.height, 0)

    const finalL = Math.max(Math.ceil(actualLength), MIN_DIMENSION)
    const finalW = Math.max(Math.ceil(actualWidth), MIN_DIMENSION)
    const finalH = Math.max(Math.ceil(actualHeight), MIN_DIMENSION)
    const vol = finalL * finalW * finalH

    if (vol > 0 && (vol < bestVolume || (vol === bestVolume && finalH < bestResult.height))) {
      bestVolume = vol
      bestResult = { length: finalL, width: finalW, height: finalH }
    }
  }

  return bestResult
}

export function estimateBox(items: PackingItem[]): PackingResult {
  const totalWeight = items.reduce((s, i) => s + i.weight * i.quantity, 0)
  const totalVolume = items.reduce((s, i) => s + i.length * i.width * i.height * i.quantity, 0)
  const flatItems = expandItems(items)

  if (flatItems.length === 0) {
    return { length: 0, width: 0, height: 0, totalWeight: 0, totalVolume: 0, boxVolume: 0, efficiency: 0 }
  }

  if (flatItems.length === 1) {
    const item = flatItems[0]
    const l = Math.max(item.l, MIN_DIMENSION)
    const w = Math.max(item.w, MIN_DIMENSION)
    const h = Math.max(item.h, MIN_DIMENSION)
    const boxVolume = l * w * h
    return {
      length: l, width: w, height: h,
      totalWeight, totalVolume, boxVolume,
      efficiency: boxVolume > 0 ? Math.round((totalVolume / boxVolume) * 100) : 100,
    }
  }

  const best = findBestPacking(flatItems)
  const boxVolume = best.length * best.width * best.height

  return {
    length: best.length,
    width: best.width,
    height: best.height,
    totalWeight, totalVolume, boxVolume,
    efficiency: boxVolume > 0 ? Math.round((totalVolume / boxVolume) * 100) : 0,
  }
}