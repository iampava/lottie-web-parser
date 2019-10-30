import { toUnitVector, getNewColors } from './utils.js';

function hasTextLayers(animationData) {
    if (animationData.chars || animationData.fonts) {
        return true;
    }

    return false;
}

function parseColors(json) {
    const colorInfo = [];
    const existingColorPaths = [];

    if (Array.isArray(json.layers)) {
        colorInfo.push(...getNewColors(json, 'layers', existingColorPaths));
    }

    if (Array.isArray(json.assets)) {
        for (let i = 0; i < json.assets.length; i++) {
            colorInfo.push(...getNewColors(json, `assets.${i}.layers`, existingColorPaths));
        }
    }

    return colorInfo;
}

function replaceColor(rgba, path, animationData) {
    if (typeof animationData !== 'object') {
        throw new Error('Expecting a JSON-based format animation data');
    }
    const [r, g, b, a] = [...rgba];
    let target = animationData;

    path.split('.').forEach(next => {
        try {
            target = target[next];
        } catch (err) {
            target = {};
        }
    });

    if (target.v && target.v.k) {
        // Effect
        if (target.v.k.every(value => value <= 1)) {
            target.v.k = [toUnitVector(r), toUnitVector(g), toUnitVector(b), a];
        } else {
            target.v.k = [r, g, b, a];
        }
    } else if (target.c && target.c.k) {
        // Shape
        if (target.c.k.every(value => value <= 1)) {
            target.c.k = [toUnitVector(r), toUnitVector(g), toUnitVector(b), a];
        } else {
            target.c.k = [r, g, b, a];
        }
    }

    return animationData;
}

function parseTexts(json) {
    return json.layers
        .filter(l => l.ty === 5)
        .map(l => ({
            name: l.nm,
            text: l.t.d.k[0].s.t,
            path: `layers.${l.ind - 1}.t.d.k.0.s.t`
        }));
}

export default {
    hasTextLayers,
    parseColors,
    parseTexts,
    replaceColor
};
