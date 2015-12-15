iD.ui.intro = function(context) {

    var step;

    function intro(selection) {

        context.enter(iD.modes.Browse(context));

        // Save current map state
        var history = context.history().toJSON(),
            hash = window.location.hash,
            center = context.map().center(),
            zoom = context.map().zoom(),
            background = context.background().baseLayerSource(),
            opacity = d3.select('.background-layer').style('opacity'),
            loadedTiles = context.connection().loadedTiles(),
            baseEntities = context.history().graph().base().entities,
            introGraph;

        // Block saving
        context.inIntro(true);

        // Load semi-real data used in intro
        context.connection().toggle(false).flush();
        context.history().reset();

        introGraph = JSON.parse(iD.introGraph);
        for (var key in introGraph) {
            introGraph[key] = iD.Entity(introGraph[key]);
        }
        context.history().merge(d3.values(iD.Graph().load(introGraph).entities));
        context.background().bing();

        d3.select('.background-layer').style('opacity', 1);

        var curtain = d3.curtain();
        selection.call(curtain);

        function reveal(box, text, options) {
            options = options || {};
            if (text) curtain.reveal(box, text, options.tooltipClass, options.duration);
            else curtain.reveal(box, '', '', options.duration);
        }

        var steps = ['navigation', 'point', 'area', 'line', 'startEditing'].map(function(step, i) {
            var s = iD.ui.intro[step](context, reveal)
                .on('done', function() {
                    entered.filter(function(d) {
                        return d.title === s.title;
                    }).classed('finished', true);
                    enter(steps[i + 1]);
                });
            return s;
        });

        steps[steps.length - 1].on('startEditing', function() {
            curtain.remove();
            navwrap.remove();
            d3.select('.background-layer').style('opacity', opacity);
            context.connection().toggle(true).flush().loadedTiles(loadedTiles);
            context.history().reset().merge(d3.values(baseEntities));
            context.background().baseLayerSource(background);
            if (history) context.history().fromJSON(history, false);
            context.map().centerZoom(center, zoom);
            window.location.replace(hash);
            context.inIntro(false);
        });

        var navwrap = selection.append('div').attr('class', 'intro-nav-wrap fillD');

        var buttonwrap = navwrap.append('div')
            .attr('class', 'joined')
            .selectAll('button.step');

        var entered = buttonwrap
            .data(steps)
            .enter()
            .append('button')
            .attr('class', 'step')
            .on('click', enter);

        entered
            .call(iD.svg.Icon('#icon-apply', 'pre-text'));

        entered
            .append('label')
            .text(function(d) { return t(d.title); });

        enter(steps[0]);

        function enter (newStep) {
            if (step) { step.exit(); }

            context.enter(iD.modes.Browse(context));

            step = newStep;
            step.enter();

            entered.classed('active', function(d) {
                return d.title === step.title;
            });
        }

    }
    return intro;
};

iD.ui.intro.pointBox = function(point, context) {
    var rect = context.surfaceRect();
    point = context.projection(point);
    return {
        left: point[0] + rect.left - 30,
        top: point[1] + rect.top - 50,
        width: 60,
        height: 70
    };
};

iD.ui.intro.pad = function(box, padding, context) {
    if (box instanceof Array) {
        var rect = context.surfaceRect();
        box = context.projection(box);
        box = {
            left: box[0] + rect.left,
            top: box[1] + rect.top
        };
    }
    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
};
