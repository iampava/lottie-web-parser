export function get(path, object) {
    if (typeof path !== 'string') {
        throw new TypeError('Expecting a string value!');
    }

    let target = object;

    path.split('.').forEach(next => {
        try {
            target = target[next];
        } catch (err) {
            target = {};
        }
    });

    return target
}

/**
 * Convert a value from [0,255] ➡ [0,1] interval
 * @param {number} n
 */
export function toUnitVector(n) {
    if (typeof n !== 'number') {
        throw new TypeError('Expecting a number value!');
    }
    return Math.round((n / 255) * 1000) / 1000;
}

/**
 * Convert a value from [0,1] ➡ [0,255] interval
 * @param {number} n
 */
export function fromUnitVector(n) {
    if (typeof n !== 'number') {
        throw new TypeError('Expecting a number value!');
    }
    return Math.round(n * 255);
}


export function findEffectFromJSCode(jsCode, json) {
    const safeCode = `
        let thisComp = new Composition(json)
        let window = null;
        let document = null;
        ${jsCode}

        return $bm_rt;
    `;

    return Function('json', 'Composition', safeCode).bind(null)(json, Composition);
}

/**
 * 
 * @returns { name: string, path: string, type: string, color: Array }
 */
export function getNewColors(animationData, startingPath, existingColorPaths = []) {
    const result = [];
    const layersOrShapes = deepFind(animationData, startingPath);

    if (!Array.isArray(layersOrShapes)) {
        throw new TypeError('Expected an array of layers or shapes');
    }

    layersOrShapes.forEach((el, layerIndex) => {
        if (!Array.isArray(el.shapes)) {
            return;
        }

        const layerInfo = { name: el.nm, shapes: [] };

        el.shapes.forEach((outerShape, outerShapeIndex) => {
            const actualShapes = outerShape.it || [outerShape];

            actualShapes.forEach((shape, innerShapeIndex) => {
                if (shape.ty !== 'fl' && shape.ty !== 'st') {
                    return;
                }

                const meta = {
                    name: shape.nm,
                    type: shape.ty,
                    path: `${startingPath}.${layerIndex}.shapes.${outerShapeIndex}${outerShape.it ? `.it.${innerShapeIndex}` : ''}`
                };

                let color = shape.c.k;
                if (shape.c.x) {
                    // Color based on effect
                    const effect = findEffectFromJSCode(shape.c.x, {
                        layers: layersOrShapes
                    });

                    meta.name = effect.parentNm;
                    meta.path = effect.path;
                    color = effect.v.k;
                }

                let [r, g, b] = color.slice(0, 3);
                if (r <= 1 && g <= 1 && b <= 1) {
                    // Colors are in [0-1] interval
                    [r, g, b] = [r, g, b].map(c => fromUnitVector(c));
                }
                const a = color[3];

                meta.rgba = [r, g, b, a];

                if (existingColorPaths.includes(meta.path)) {
                    return;
                }

                layerInfo.shapes.push(meta);
                existingColorPaths.push(meta.path);
            });
        });

        result.push(layerInfo);
    });

    return result;
}

/**
 * Utility class for parsing the JS code in AE Effects. (eg: var $bm_rt;\n$bm_rt = thisComp.layer('color_settings').effect('Fill 3')('Color')')
 * In the example above, 'thisComp' is an instance of the Composition class
 */
class Composition {
    constructor(animationData) {
        try {
            if (typeof animationData === 'string') {
                this.animationData = JSON.parse(animationData);
            } else {
                this.animationData = JSON.parse(JSON.stringify(animationData));
            }
        } catch (err) {
            throw new TypeError('Expecting animationData to be a JSON object or a stringified JSON.');
        }
    }

    /**
     * Find an effect layer at a certain index or with a certain name.
     * If multiple layers have the same name, return the first one.
     * @param {number|string} indexOrName
     */
    layer(indexOrName) {
        if (!Array.isArray(this.animationData.layers)) {
            throw new TypeError('Expecting animationData to contain a "layers" property');
        }

        const effectLayers = this.animationData.layers.filter(l => l.hasOwnProperty('ef'));
        let layer = null;
        let layerIndex;

        switch (typeof indexOrName) {
            case 'number':
                layer = effectLayers[indexOrName] || null;
                layerIndex = indexOrName;
                break;
            case 'string':
                layerIndex = effectLayers.findIndex(l => l.nm === indexOrName);
                layer = effectLayers[layerIndex] || null;
                break;
            default:
                throw new TypeError('Expecting to get layer by <number>"index" or <string>"name". None of those supplied!');
        }

        return {
            /** Find the first outer-effect on this layer with the specified name
             *  @param {string} name
             */
            effect: name => {
                if (!Array.isArray(layer.ef)) {
                    throw new TypeError(`The ${layer.nm} layer doesn't have effects`);
                }

                const outerEffectIndex = layer.ef.findIndex(ef => ef.nm === name);
                const outerEffect = layer.ef[outerEffectIndex];

                return specificName => {
                    if (!outerEffect) {
                        return null;
                    }

                    if (!Array.isArray(outerEffect.ef)) {
                        throw new TypeError(`The ${outerEffect.name} effect doesn't have child-effects`);
                    }

                    const effectIndex = outerEffect.ef.findIndex(ef => ef.nm === specificName);

                    return {
                        ...outerEffect.ef[effectIndex],
                        parentNm: outerEffect.nm,
                        path: `layers.${layerIndex}.ef.${outerEffectIndex}.ef.${effectIndex}`
                    };
                };
            }
        };
    }
}

/**
 * Return a value deep inside an object or null if it doesn't exist
 * @param {Object} object
 * @param {string} path
 */
function deepFind(object, path) {
    if (typeof path !== 'string') {
        throw new TypeError('Expecting "path" to be a string!');
    }

    const pathParts = path.split('.');
    for (let next of pathParts) {
        try {
            object = object[next];
        } catch (err) {
            return null;
        }
    }

    return object;
}
