import { get, toUnitVector, fromUnitVector, getNewColors, findEffectFromJSCode, } from './utils.js';

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
    const [r, g, b, a] = rgba;
    const target = get(path, animationData);

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

function replaceKeyframeColor(rgba, path, animationData) {
    if (typeof animationData !== 'object') {
        throw new Error('Expecting a JSON-based format animation data');
    }
    const [r, g, b, a] = rgba;
    const target = get(path, animationData);

    if (target && target.s) {
        if (target.s.every(value => value <= 1)) {
            target.s = [toUnitVector(r), toUnitVector(g), toUnitVector(b), a];
        } else {
            target.s = [r, g, b, a];
        }

    }
}

function getKeyframeColors(path, animationData) {
    const target = get(path, animationData);

    if (target && target.c.k && target.c.k.every(value => typeof value !== 'number')) {
        const keyframeValues = target.c.k.map(value => value.s)
        return keyframeValues.map(value => {
            const isUnitFormat = value.every(v => v <= 1);

            return isUnitFormat ? value.map(fromUnitVector) : value
        })
    }
}

function parseTexts(json) {
    let fontList = json.fonts.list;

    return json.layers
        .filter(l => l.ty === 5)
        .map(l => {
            let fontName = l.t.d.k[0].s.f;
            let matchedFont = fontList.find(f => f.fName === l.t.d.k[0].s.f);

            return {
                name: l.nm,
                text: l.t.d.k[0].s.t,
                fontName,
                fontFamily: matchedFont ? matchedFont.fFamily : undefined,
                path: `layers.${l.ind - 1}.t.d.k.0.s.t`
            }
        });
}

export default {
    hasTextLayers,
    findEffectFromJSCode,
    parseColors,
    parseTexts,
    replaceColor,
    replaceKeyframeColor,
    getKeyframeColors
};
