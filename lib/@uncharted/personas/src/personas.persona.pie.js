var Snap = require('snapsvg');
var PersonasPie = function($paper, $wrapper, baseColor, pieColor, isFirstLayer) {
    var t = this;
    t.$paper = $paper;
    t.$wrapper = $wrapper;
    t.baseColor = baseColor;
    t.pieColor = pieColor;
    t.radius = t.$wrapper.getBBox().width / 4; // source circle should be half the the size of the canvas since strokes are double.
    t.circumference = 2 * Math.PI * t.radius;
    t.init(isFirstLayer);
};
PersonasPie.prototype.init = function(isFirstLayer) {
    var t = this;
    if (isFirstLayer) {
        t.base = t.$paper.circle(t.$wrapper.getBBox().cx, t.$wrapper.getBBox().cy, t.radius)
            .attr({
                'pointer-events': 'none',
                'stroke': t.baseColor,
                'stroke-width': t.radius * 2,
                'stroke-dasharray': t.circumference + ' ' + t.circumference,
                'stroke-dashoffset': 0,
            });
    }
    t.slice = t.$paper.circle(t.$wrapper.getBBox().cx, t.$wrapper.getBBox().cy, t.radius)
        .attr({
            'pointer-events': 'none',
            'stroke': t.pieColor,
            'stroke-width': t.radius * 2,
            'stroke-dasharray': '0 ' + t.circumference,
        });
};
PersonasPie.prototype.setDegrees = function(degrees) {
    var t = this;
    t.degrees = degrees;
    Snap.animate(0, degrees / 360 * t.circumference,
        function(value) {
            t.slice.attr({'stroke-dasharray': value + ' ' + t.circumference});
        },
        500);
    t.slice.transform('r-90');
};
PersonasPie.prototype.replay = function() {
    this.reset();
    this.setDegrees(this.degrees);
};

module.exports = PersonasPie;
