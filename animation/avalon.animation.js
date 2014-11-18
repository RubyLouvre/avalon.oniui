/* 
 * @cnName 动画引擎
 * @mmAnimate
 * @introduce 
 * <p>基于web animation与原生Promise的超高效动画引擎</p>
 * <p>chrome 36开始支持web animation</p>
 */

//scope.js
var webAnimationsShared = {};
var webAnimationsMinifill = {};
var webAnimationsMaxifill = {};


(function(shared, testing) {

    var fills = 'backwards|forwards|both'.split('|');
    var directions = 'reverse|alternate|alternate-reverse'.split('|');

    function makeTiming(timingInput, forGroup) {
        var timing = {
            delay: 0,
            endDelay: 0,
            fill: forGroup ? 'both' : 'none',
            iterationStart: 0,
            iterations: 1,
            duration: forGroup ? 'auto' : 0,
            playbackRate: 1,
            direction: 'normal',
            easing: 'linear',
        };
        if (typeof timingInput == 'number') {
            timing.duration = timingInput;
        } else if (timingInput !== undefined) {
            Object.getOwnPropertyNames(timingInput).forEach(function(property) {
                if (timingInput[property] != 'auto') {
                    if (typeof timing[property] == 'number' && typeof timingInput[property] != 'number' && property != 'duration') {
                        return;
                    }
                    if ((property == 'fill') && (fills.indexOf(timingInput[property]) == -1)) {
                        return;
                    }
                    if ((property == 'direction') && (directions.indexOf(timingInput[property]) == -1)) {
                        return;
                    }
                    timing[property] = timingInput[property];
                }
            });
        }
        return timing;
    }

    function normalizeTimingInput(timingInput, forGroup) {
        var timing = makeTiming(timingInput, forGroup);
        timing.easing = toTimingFunction(timing.easing);
        return timing;
    }

    function cubic(a, b, c, d) {
        if (a < 0 || a > 1 || c < 0 || c > 1) {
            return linear;
        }
        return function(x) {
            var start = 0, end = 1;
            while (1) {
                var mid = (start + end) / 2;
                function f(a, b, m) {
                    return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m
                }
                ;
                var xEst = f(a, c, mid);
                if (Math.abs(x - xEst) < 0.001) {
                    return f(b, d, mid);
                }
                if (xEst < x) {
                    start = mid;
                } else {
                    end = mid;
                }
            }
        }
    }

    var Start = 1;
    var Middle = 0.5;
    var End = 0;

    function step(count, pos) {
        return function(x) {
            if (x >= 1) {
                return 1;
            }
            var stepSize = 1 / count;
            x += pos * stepSize;
            return x - x % stepSize;
        }
    }

    var presets = {
        'ease': cubic(0.25, 0.1, 0.25, 1),
        'ease-in': cubic(0.42, 0, 1, 1),
        'ease-out': cubic(0, 0, 0.58, 1),
        'ease-in-out': cubic(0.42, 0, 0.58, 1),
        'step-start': step(1, Start),
        'step-middle': step(1, Middle),
        'step-end': step(1, End)
    };

    var numberString = '\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*';
    var cubicBezierRe = new RegExp('cubic-bezier\\(' + numberString + ',' + numberString + ',' + numberString + ',' + numberString + '\\)');
    var stepRe = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/;
    var linear = function(x) {
        return x;
    };

    function toTimingFunction(easing) {
        var cubicData = cubicBezierRe.exec(easing);
        if (cubicData) {
            return cubic.apply(this, cubicData.slice(1).map(Number));
        }
        var stepData = stepRe.exec(easing);
        if (stepData) {
            return step(Number(stepData[1]), {'start': Start, 'middle': Middle, 'end': End}[stepData[2]]);
        }
        var preset = presets[easing];
        if (preset) {
            return preset;
        }
        return linear;
    }
    ;

    function calculateActiveDuration(timing) {
        return Math.abs(repeatedDuration(timing) / timing.playbackRate);
    }

    function repeatedDuration(timing) {
        return timing.duration * timing.iterations;
    }

    var PhaseNone = 0;
    var PhaseBefore = 1;
    var PhaseAfter = 2;
    var PhaseActive = 3;

    function calculatePhase(activeDuration, localTime, timing) {
        if (localTime == null) {
            return PhaseNone;
        }
        if (localTime < timing.delay) {
            return PhaseBefore;
        }
        if (localTime >= timing.delay + activeDuration) {
            return PhaseAfter;
        }
        return PhaseActive;
    }

    function calculateActiveTime(activeDuration, fillMode, localTime, phase, delay) {
        switch (phase) {
            case PhaseBefore:
                if (fillMode == 'backwards' || fillMode == 'both')
                    return 0;
                return null;
            case PhaseActive:
                return localTime - delay;
            case PhaseAfter:
                if (fillMode == 'forwards' || fillMode == 'both')
                    return activeDuration;
                return null;
            case PhaseNone:
                return null;
        }
    }

    function calculateScaledActiveTime(activeDuration, activeTime, startOffset, timing) {
        return (timing.playbackRate < 0 ? activeTime - activeDuration : activeTime) * timing.playbackRate + startOffset;
    }

    function calculateIterationTime(iterationDuration, repeatedDuration, scaledActiveTime, startOffset, timing) {
        if (scaledActiveTime === Infinity || scaledActiveTime === -Infinity || (scaledActiveTime - startOffset == repeatedDuration && timing.iterations && ((timing.iterations + timing.iterationStart) % 1 == 0))) {
            return iterationDuration;
        }

        return scaledActiveTime % iterationDuration;
    }

    function calculateCurrentIteration(iterationDuration, iterationTime, scaledActiveTime, timing) {
        if (scaledActiveTime === 0) {
            return 0;
        }
        if (iterationTime == iterationDuration) {
            return timing.iterationStart + timing.iterations - 1;
        }
        return Math.floor(scaledActiveTime / iterationDuration);
    }

    function calculateTransformedTime(currentIteration, iterationDuration, iterationTime, timing) {
        var currentIterationIsOdd = currentIteration % 2 >= 1;
        var currentDirectionIsForwards = timing.direction == 'normal' || timing.direction == (currentIterationIsOdd ? 'alternate-reverse' : 'alternate');
        var directedTime = currentDirectionIsForwards ? iterationTime : iterationDuration - iterationTime;
        var timeFraction = directedTime / iterationDuration;
        if (isNaN(timeFraction))
            return null;
        return iterationDuration * timing.easing(timeFraction);
    }

    function calculateTimeFraction(activeDuration, localTime, timing) {
        var phase = calculatePhase(activeDuration, localTime, timing);
        var activeTime = calculateActiveTime(activeDuration, timing.fill, localTime, phase, timing.delay);
        if (activeTime === null)
            return null;
        if (activeDuration === 0)
            return phase === PhaseBefore ? 0 : 1;
        var startOffset = timing.iterationStart * timing.duration;
        var scaledActiveTime = calculateScaledActiveTime(activeDuration, activeTime, startOffset, timing);
        var iterationTime = calculateIterationTime(timing.duration, repeatedDuration(timing), scaledActiveTime, startOffset, timing);
        var currentIteration = calculateCurrentIteration(timing.duration, iterationTime, scaledActiveTime, timing);
        return calculateTransformedTime(currentIteration, timing.duration, iterationTime, timing) / timing.duration;
    }

    shared.makeTiming = makeTiming;
    shared.normalizeTimingInput = normalizeTimingInput;
    shared.calculateActiveDuration = calculateActiveDuration;
    shared.calculateTimeFraction = calculateTimeFraction;
    shared.calculatePhase = calculatePhase;
    shared.toTimingFunction = toTimingFunction;


})(webAnimationsShared);


(function(shared, testing) {
    var shorthandToLonghand = {
        background: [
            'backgroundImage',
            'backgroundPosition',
            'backgroundSize',
            'backgroundRepeat',
            'backgroundAttachment',
            'backgroundOrigin',
            'backgroundClip',
            'backgroundColor'
        ],
        border: [
            'borderTopColor',
            'borderTopStyle',
            'borderTopWidth',
            'borderRightColor',
            'borderRightStyle',
            'borderRightWidth',
            'borderBottomColor',
            'borderBottomStyle',
            'borderBottomWidth',
            'borderLeftColor',
            'borderLeftStyle',
            'borderLeftWidth'
        ],
        borderBottom: [
            'borderBottomWidth',
            'borderBottomStyle',
            'borderBottomColor'
        ],
        borderColor: [
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor'
        ],
        borderLeft: [
            'borderLeftWidth',
            'borderLeftStyle',
            'borderLeftColor'
        ],
        borderRadius: [
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomRightRadius',
            'borderBottomLeftRadius'
        ],
        borderRight: [
            'borderRightWidth',
            'borderRightStyle',
            'borderRightColor'
        ],
        borderTop: [
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor'
        ],
        borderWidth: [
            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth'
        ],
        flex: [
            'flexGrow',
            'flexShrink',
            'flexBasis'
        ],
        font: [
            'fontFamily',
            'fontSize',
            'fontStyle',
            'fontVariant',
            'fontWeight',
            'lineHeight'
        ],
        margin: [
            'marginTop',
            'marginRight',
            'marginBottom',
            'marginLeft'
        ],
        outline: [
            'outlineColor',
            'outlineStyle',
            'outlineWidth'
        ],
        padding: [
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft'
        ]
    };

    var shorthandExpanderElem = document.createElement('div');

    var borderWidthAliases = {
        thin: '1px',
        medium: '3px',
        thick: '5px'
    };

    var aliases = {
        borderBottomWidth: borderWidthAliases,
        borderLeftWidth: borderWidthAliases,
        borderRightWidth: borderWidthAliases,
        borderTopWidth: borderWidthAliases,
        fontSize: {
            'xx-small': '60%',
            'x-small': '75%',
            'small': '89%',
            'medium': '100%',
            'large': '120%',
            'x-large': '150%',
            'xx-large': '200%'
        },
        fontWeight: {
            normal: '400',
            bold: '700'
        },
        outlineWidth: borderWidthAliases,
        textShadow: {
            none: '0px 0px 0px transparent'
        },
        boxShadow: {
            none: '0px 0px 0px 0px transparent'
        }
    };

    function antiAlias(property, value) {
        if (property in aliases) {
            return aliases[property][value] || value;
        }
        return value;
    }

    // This delegates parsing shorthand value syntax to the browser.
    function expandShorthandAndAntiAlias(property, value, result) {
        var longProperties = shorthandToLonghand[property];
        if (longProperties) {
            shorthandExpanderElem.style[property] = value;
            for (var i in longProperties) {//分解出每个子样式
                var longProperty = longProperties[i];
                var longhandValue = shorthandExpanderElem.style[longProperty];
                result[longProperty] = antiAlias(longProperty, longhandValue);//将得到的值转换为可计算的值
            }
        } else {
            result[property] = antiAlias(property, value);
        }
    }
    ;
//处理animate的第一个参数
    function normalizeKeyframes(effectInput) {
        if (!Array.isArray(effectInput) && effectInput !== null)
            throw new TypeError('Keyframe effect must be null or an array of keyframes');

        if (effectInput == null)
            return [];

        var keyframeEffect = effectInput.map(function(originalKeyframe) {
            var keyframe = {};
            for (var member in originalKeyframe) {
                var memberValue = originalKeyframe[member];
                if (member == 'offset') {
                    if (memberValue != null) {
                        memberValue = Number(memberValue);
                        if (!isFinite(memberValue))
                            throw new TypeError('keyframe offsets must be numbers.');
                    }
                } else if (member == 'composite') {
                    throw {
                        type: DOMException.NOT_SUPPORTED_ERR,
                        name: 'NotSupportedError',
                        message: 'add compositing is not supported'
                    };
                } else if (member == 'easing') {
                    memberValue = shared.toTimingFunction(memberValue);
                } else {
                    memberValue = '' + memberValue;
                }
                expandShorthandAndAntiAlias(member, memberValue, keyframe);
            }
            if (keyframe.offset == undefined)
                keyframe.offset = null;
            if (keyframe.easing == undefined)
                keyframe.easing = shared.toTimingFunction('linear');
            return keyframe;
        });
        /*
         elem.animate([
         {backgroundColor: 'blue',offset: 0 },
         {backgroundColor: 'green',offset: 1/3},
         {backgroundColor: 'red',offset: 2/3},
         {backgroundColor: 'yellow', 3/3}], 2000);
         相当于
         elem.animate([
         {backgroundColor: 'blue' },
         {backgroundColor: 'green'},
         {backgroundColor: 'red'},
         {backgroundColor: 'yellow'3}], 2000);
         */
        var everyFrameHasOffset = true;
        var looselySortedByOffset = true;
        var previousOffset = -Infinity;
        for (var i = 0; i < keyframeEffect.length; i++) {
            var offset = keyframeEffect[i].offset;
            if (offset != null) {
                if (offset < previousOffset) {
                    throw {
                        code: DOMException.INVALID_MODIFICATION_ERR,
                        name: 'InvalidModificationError',
                        message: 'Keyframes are not loosely sorted by offset. Sort or specify offsets.'
                    };
                }
                previousOffset = offset;
            } else {
                everyFrameHasOffset = false;
            }
        }

        keyframeEffect = keyframeEffect.filter(function(keyframe) {
            return keyframe.offset >= 0 && keyframe.offset <= 1;
        });
        //http://www.w3.org/TR/web-animations/#applying-spacing-to-keyframes
        function spaceKeyframes() {//为keyframe添加offset
            var length = keyframeEffect.length;
            if (keyframeEffect[length - 1].offset == null)
                keyframeEffect[length - 1].offset = 1;
            if (length > 1 && keyframeEffect[0].offset == null)
                keyframeEffect[0].offset = 0;

            var previousIndex = 0;
            var previousOffset = keyframeEffect[0].offset;
            for (var i = 1; i < length; i++) {
                var offset = keyframeEffect[i].offset;
                if (offset != null) {
                    for (var j = 1; j < i - previousIndex; j++)
                        keyframeEffect[previousIndex + j].offset = previousOffset + (offset - previousOffset) * j / (i - previousIndex);
                    previousIndex = i;
                    previousOffset = offset;
                }
            }
        }
        if (!everyFrameHasOffset)
            spaceKeyframes();

        return keyframeEffect;
    }

    shared.normalizeKeyframes = normalizeKeyframes;

})(webAnimationsShared, webAnimationsTesting);

(function(shared, scope) {

  scope.AnimationNode = function(timing) {
    var timeFraction = 0;
    var activeDuration = shared.calculateActiveDuration(timing);
    var animationNode = function(localTime) {
      return shared.calculateTimeFraction(activeDuration, localTime, timing);
    };
    animationNode._totalDuration = timing.delay + activeDuration + timing.endDelay;
    animationNode._isCurrent = function(localTime) {
      var phase = shared.calculatePhase(activeDuration, localTime, timing);
      return phase === PhaseActive || phase === PhaseBefore;
    };
    return animationNode;
  };

})(webAnimationsShared, webAnimationsMinifill);