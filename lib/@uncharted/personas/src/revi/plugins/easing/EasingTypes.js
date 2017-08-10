/**
 * Copyright (c) 2017 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const PI_T_2 = 6.28318530717959; /* PI * 2 */

/** THIS METHODS ARE CRAFTED FOR PERFORMANCE, NOT TO BE PRETTY CODE :( **/
/* eslint-disable */

/**
 * Object containing the different easing types supported by revi's easing plugin.
 * NOTE: This functions don't really need a `start` and `change` parameters since the easing plugin always uses 0 and 1
 * respectively, but I left the arguments for reusability's sake. That being said a bit of performance can be squeezed
 * by removing the arguments from the implementation. Don't expecy huge gains though, unless easing is being heavily used
 * in the project.
 *
 * @type {Object}
 */
export const EasingTypes = {
    Linear: function LinearEasing(time, duration, start, change) {
        return change * time / duration + start;
    },

    Quadratic: {
        EaseIn: function QuadraticEaseIn(time, duration, start, change) {
            time /= duration;
            return change * time * time + start;
        },

        EaseOut: function QuadraticEaseOut(time, duration, start, change) {
            time /= duration;
            return -change * time * (time - 2) + start;
        },

        EaseInOut: function quadraticEaseInOut(time, duration, start, change) {
            if ((time /= duration * 0.5) < 1) return change * 0.5 * time * time + start;
            --time;
            return -change * 0.5 * (time * (time - 2) - 1) + start;
        },
    },

    Cubic: {
        EaseIn: function CubicEaseIn(time, duration, start, change) {
            time /= duration;
            return change * time * time * time + start;
        },

        EaseOut: function CubicEaseOut(time, duration, start, change) {
            time /= duration;
            --time;
            return change * (time * time * time + 1) + start;
        },

        EaseInOut: function CubicEaseInOut(time, duration, start, change) {
            time /= duration / 2;
            if (time < 1) return change / 2 * time * time * time + start;
            time -= 2;
            return change / 2 * (time * time * time + 2) + start;
        },
    },

    Quartic: {
        EaseIn: function QuarticEaseIn(time, duration, start, change) {
            time /= duration;
            return change * time * time * time * time + start;
        },

        EaseOut: function QuarticEaseOut(time, duration, start, change) {
            time /= duration;
            --time;
            return -change * (time * time * time * time - 1) + start;
        },

        EaseInOut: function QuarticEaseInOut(time, duration, start, change) {
            time /= duration / 2;
            if (time < 1) return change / 2 * time * time * time * time + start;
            time -= 2;
            return -change / 2 * (time * time * time * time - 2) + start;
        },
    },

    Quintic: {
        EaseIn: function QuinticEaseIn(time, duration, start, change) {
            time /= duration;
            return change * time * time * time * time * time + start;
        },

        EaseOut: function QuinticEaseOut(time, duration, start, change) {
            time /= duration;
            --time;
            return change * (time * time * time * time * time + 1) + start;
        },

        EaseInOut: function QuinticEaseInOut(time, duration, start, change) {
            time /= duration / 2;
            if (time < 1) return change / 2 * time * time * time * time * time + start;
            time -= 2;
            return change / 2 * (time * time * time * time * time + 2) + start;
        },
    },

    Sinusoidal: {
        EaseIn: function SinusoidalEaseIn(time, duration, start, change) {
            return -change * Math.cos(time / duration * (Math.PI / 2)) + change + start;
        },

        EaseOut: function SinusoidalEaseOut(time, duration, start, change) {
            return change * Math.sin(time / duration * (Math.PI / 2)) + start;
        },

        EaseInOut: function SinusoidalEaseInOut(time, duration, start, change) {
            return -change / 2 * (Math.cos(Math.PI * time / duration) - 1) + start;
        },
    },

    Exponential: {
        EaseIn: function ExponentialEaseIn(time, duration, start, change) {
            return change * Math.pow(2.0, 10.0 * (time / duration - 1)) + start;
        },

        EaseOut: function ExponentialEaseOut(time, duration, start, change) {
            return change * (-Math.pow(2.0, -10.0 * time / duration) + 1.0) + start;
        },

        EaseInOut: function ExponentialEaseInOut(time, duration, start, change) {
            time /= duration / 2;
            if (time < 1) return change / 2 * Math.pow(2.0, 10.0 * (time - 1.0)) + start;
            --time;
            return change / 2 * (-Math.pow(2.0, -10.0 * time) + 2.0) + start;
        },
    },

    Circular: {
        EaseIn: function CircularEaseIn(time, duration, start, change) {
            time /= duration;
            return -change * (Math.sqrt(1 - time * time) - 1) + start;
        },

        EaseOut: function CircularEaseOut(time, duration, start, change) {
            time /= duration;
            --time;
            return change * Math.sqrt(1 - time * time) + start;
        },

        EaseInOut: function CircularEaseInOut(time, duration, start, change) {
            time /= duration / 2;
            if (time < 1) return -change / 2 * (Math.sqrt(1 - time * time) - 1) + start;
            time -= 2;
            return change / 2 * (Math.sqrt(1 - time * time) + 1) + start;
        },
    },

    Elastic: {
        EaseIn: function ElasticEaseIn(time, duration, start, change, amplitude, period) {
            let s;
            if (time === 0) return start; if ((time /= duration) === 1) return start + change; if (!period) period = duration * 0.3;
            if (!amplitude || (change > 0 && amplitude < change) || (change < 0 && amplitude < -change)) { amplitude = change; s = period / 4; }
            else s = period / PI_T_2 * Math.asin(change / amplitude);
            time -= 1;
            return -(amplitude * Math.pow(2, 10 * time) * Math.sin((time * duration - s) * PI_T_2 / period)) + start;
        },

        EaseOut: function ElasticEaseOut(time, duration, start, change, amplitude, period) {
            let s;
            if (time === 0) return start; if ((time /= duration) === 1) return start + change; if (!period) period = duration * 0.3;
            if (!amplitude || (change > 0 && amplitude < change) || (change < 0 && amplitude < -change)) { amplitude = change; s = period / 4; }
            else s = period / PI_T_2 * Math.asin(change / amplitude);
            return (amplitude * Math.pow(2, -10 * time) * Math.sin((time * duration - s) * PI_T_2 / period) + change + start);
        },

        EaseInOut: function ElasticEaseInOut(time, duration, start, change, amplitude, period) {
            let s;
            if (time === 0) return start; if ((time /= duration * 0.5) === 2) return start + change; if (!period) period = duration * (0.3 * 1.5);
            if (!amplitude || (change > 0 && amplitude < change) || (change < 0 && amplitude < -change)) { amplitude = change; s = period / 4; }
            else s = period / PI_T_2 * Math.asin(change / amplitude);
            if (time < 1) {
                --time;
                return -0.5 * (amplitude * Math.pow(2, 10 * time) * Math.sin((time * duration - s) * PI_T_2 / period)) + start;
            }
            --time;
            return amplitude * Math.pow(2, -10 * time) * Math.sin((time * duration - s) * PI_T_2 / period) * 0.5 + change + start;
        },
    },

    Back: {
        EaseIn: function BackEaseIn(time, duration, start, change, overshoot) {
            time /= duration;
            return change * time * time * ((overshoot + 1) * time - overshoot) + start;
        },

        EaseOut: function BackEaseOut(time, durartion, start, change, overshoot) {
            time = time / durartion - 1;
            return change * (time * time * ((overshoot + 1) * time + overshoot) + 1) + start;
        },

        EaseInOut: function BackEaseInOut(time, duration, start, change, overshoot) {
            if ((time /= duration * 0.5) < 1) {
                overshoot *= (1.525);
                return change * 0.5 * (time * time * (((overshoot) + 1) * time - overshoot)) + start;
            }
            overshoot *= (1.525);
            time -= 2;
            return change / 2 * (time * time * (((overshoot) + 1) * time + overshoot) + 2) + start;
        },
    },

    Bounce: {
        EaseIn: function (time, duration, start, change) {
            return change - EasingTypes.Bounce.EaseOut(duration - time, 0, change, duration) + start;
        },

        EaseOut: function (time, duration, start, change) {
            if ((time /= duration) < (1 / 2.75)) {
                return change * (7.5625 * time * time) + start;
            } else if (time < (2 / 2.75)) {
                return change * (7.5625 * (time -= (1.5 / 2.75)) * time + 0.75) + start;
            } else if (time < (2.5 / 2.75)) {
                return change * (7.5625 * (time -= (2.25 / 2.75)) * time + 0.9375) + start;
            } else {
                return change * (7.5625 * (time -= (2.625 / 2.75)) * time + 0.984375) + start;
            }
        },

        EaseInOut: function (time, duration, start, change) {
            if (time < duration / 2) return EasingTypes.Bounce.EaseIn(time * 2, 0, change, duration) * 0.5 + start;
            return EasingTypes.Bounce.EaseOut(time * 2 - duration, 0, change, duration) * 0.5 + change * 0.5 + start;
        },
    },
};

/** THIS METHODS ARE CRAFTED FOR PERFORMANCE, NOT TO BE PRETTY CODE :( **/
/* eslint-enable */

export default EasingTypes;
