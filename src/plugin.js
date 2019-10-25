import { toUnitVector, getNewColors } from './utils.js'

function hasTextLayers(animationData) {
  if (animationData.chars || animationData.fonts) {
    return true
  }

  return false
}

function parseColors(json) {
  const colorInfo = []
  const existingColorPaths = []

  if (Array.isArray(json.layers)) {
    colorInfo.push(...getNewColors(json, 'layers', existingColorPaths))
  }

  if (Array.isArray(json.assets)) {
    for (let i = 0; i < json.assets.length; i++) {
      colorInfo.push(...getNewColors(json, `assets.${i}.layers`, existingColorPaths))
    }
  }

  return colorInfo
};

function replaceColor(rgba, path, animationData) {
  const newAnimationData = typeof animationData === 'string' ? JSON.parse(animationData) : JSON.parse(JSON.stringify(animationData))
  const [r, g, b, a] = [...rgba]
  let target = newAnimationData

  path.split('.').forEach((next) => {
    try {
      target = target[next]
    } catch (err) {
      target = {}
    }
  })

  if (target.v && target.v.k) {
    // Effect
    target.v.k = [toUnitVector(r), toUnitVector(g), toUnitVector(b), a]
  } else if (target.c && target.c.k) {
    // Shape
    target.c.k = [toUnitVector(r), toUnitVector(g), toUnitVector(b), a]
  }

  return newAnimationData
}

export default {
  hasTextLayers,
  parseColors,
  replaceColor
}