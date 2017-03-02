registerKeyboardHandler = function(callback) {
    var callback = callback;
    //d3.select(window).on("keydown", callback);
};

SimpleGraph = function(elemid, options) {
    var self = this;
    this.chart = document.getElementById(elemid);
    this.cx = this.chart.clientWidth;
    this.cy = this.chart.clientHeight;
    this.options = options || {};
    this.options.xmax = options.xmax || 30;
    this.options.xmin = options.xmin || 0;
    this.options.ymax = options.ymax || 10;
    this.options.ymin = options.ymin || 0;

    //default values
    var data = [
        {"hour": 7, "max_weight": 2000, "min_weight": 200},
        {"hour": 8, "max_weight": 2000, "min_weight": 200},
        {"hour": 9, "max_weight": 2000, "min_weight": 100},
        {"hour": 10, "max_weight": 2000, "min_weight": 200},
        {"hour": 11, "max_weight": 2000, "min_weight": 300},
        {"hour": 12, "max_weight": 2000, "min_weight": 200},
        {"hour": 13, "max_weight": 2000, "min_weight": 200},
        {"hour": 14, "max_weight": 2000, "min_weight": 200},
        {"hour": 15, "max_weight": 2000, "min_weight": 200},
        {"hour": 16, "max_weight": 2000, "min_weight": 200},
        {"hour": 17, "max_weight": 2000, "min_weight": 200},
        {"hour": 18, "max_weight": 2000, "min_weight": 200},
        {"hour": 19, "max_weight": 2000, "min_weight": 200}
    ];

    this.padding = {
        "top":    this.options.title  ? 40 : 20,
        "right":                 30,
        "bottom": this.options.xlabel ? 60 : 50,
        "left":   this.options.ylabel ? 70 : 45
    };

    this.size = {
        "width":  this.cx - this.padding.left - this.padding.right,
        "height": this.cy - this.padding.top  - this.padding.bottom
    };

    // x-scale
    this.x = d3.scale.linear()
        .domain([7, 19])
        .range([0, this.size.width]);

    // drag x-axis logic
    this.downx = Math.NaN;

    // y-scale (inverted domain)
    this.y = d3.scale.linear()
        .domain([3000, 0])
        .range([0, this.size.height])
        //.clamp(true)
        .nice();

    this.y2 = d3.scale.linear()
        .domain([3000, 0])
        .range([0, this.size.height])
        //.clamp(true)
        .nice();

    // drag y-axis logic
    this.downy = Math.NaN;

    this.dragged = this.selected = null;

    /*
        Create the max weight line
     */
    this.line_max_weight = d3.svg.line()
        .interpolate('step')
        .x(function(d, i) {
            return this.x(this.points_max_weight[i].hour);
        })
        .y(function(d, i) {
            return this.y(this.points_max_weight[i].max_weight);
        });

    /*
        Create the min weight line
     */
    this.line_min_weight = d3.svg.line()
        .interpolate('step')
        .x(function(d, i) {
            return this.x(this.points_min_weight[i].hour);
        })
        .y(function(d, i) {
            return this.y2(this.points_min_weight[i].min_weight);
        });

    /*
        Max Weight values
     */
    this.points_max_weight = data.map(function (value) {
        return {hour: value.hour, max_weight: value.max_weight}
    });

    /*
        Min Weight values
     */
    this.points_min_weight = data.map(function(value) {
        return {hour: value.hour, min_weight: value.min_weight}
    });

    this.svg = d3.select(this.chart).append("svg")
        .attr("width",  this.cx)
        .attr("height", this.cy)
        .append("g")
        .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

    this.plot = this.svg.append("rect")
        .attr("width", this.size.width)
        .attr("height", this.size.height)
        .style("fill", "#FAFAFA")
        .attr("pointer-events", "all");

    //TODO: corrigir função do zoom no eixo y, para a linha de min weight
    //this.plot.call(d3.behavior.zoom().y(this.y).on("zoom", this.redraw()));

    this.svg.append("svg")
        .attr("top", 0)
        .attr("left", 0)
        .attr("width", this.size.width)
        .attr("height", this.size.height)
        .attr("viewBox", "0 0 "+this.size.width+" "+this.size.height);

    this.svg.select('svg')
        .attr("class", "line")
        .append("path")
        .attr("class", "line")
        .style('stroke', 'blue')
        .style('stroke-dasharray', '12,5')
        .attr("d", this.line_max_weight(this.points_max_weight));

    this.svg.select('svg')
        .append('path')
        .attr("class", "line")
        .style('stroke', 'green')
        .style('stroke-dasharray', '12,5')
        .attr("d", this.line_min_weight(this.points_min_weight));


    // Define 'div' for tooltips
    this.tooltip = d3.select("#chart-wrapper").append("div") // declare the properties for the div used for the tooltips
        .attr("class", "tooltip") // apply the 'tooltip' class
        .style("opacity", 0); // set the opacity to nil

    // Add the x-axis label
    if (this.options.xlabel) {
        this.svg.append("text")
            .attr("class", "axis")
            .text(this.options.xlabel)
            .attr("x", this.size.width/2)
            .attr("y", this.size.height)
            .attr("dy","2.4em")
            .style("text-anchor","middle");
    }

    // add y-axis label
    if (this.options.ylabel) {
        this.svg.append("g").append("text")
            .attr("class", "axis")
            .text(this.options.ylabel)
            .style("text-anchor","middle")
            .attr("transform","translate(" + -50 + " " + this.size.height/2+") rotate(-90)");
    }

    d3.select(this.chart)
        .on("mousemove.drag", self.mousemove())
        .on("touchmove.drag", self.mousemove())
        .on("mouseup.drag",   self.mouseup())
        .on("touchend.drag",  self.mouseup());

    this.redraw()();
};

//
// SimpleGraph methods
//
SimpleGraph.prototype.update = function() {
    var self = this;

    var lines = this.svg.selectAll('path');
    d3.select(lines[0][0])
        .attr('d', this.line_max_weight(this.points_max_weight));
    d3.select(lines[0][1])
        .attr('d', this.line_min_weight(this.points_min_weight));

    self.allPoints = self.points_max_weight.concat(self.points_min_weight);
    var circle = this.svg.select("svg").selectAll("circle")
        .data(self.allPoints, function(d) {
            return d;
        });

    circle.enter().append("circle")
        .attr("class", function(d) {
            return d === self.selected ? "selected" : null;
        })
        .attr("cx",    function(d) {
            return self.x(d.hour);
        })
        .attr("cy",    function(d) {
            return  d.max_weight ? self.y(d.max_weight) : self.y(d.min_weight);
        })
        .attr("r", 3.5)
        .style("cursor", "ns-resize")
        .on('mouseover', function(d) {
            d3.select(d3.event.target).classed("highlight", true);

            self.tooltip.transition() // declare the transition properties to bring fade-in div
                .duration(600) // it shall take 200ms
                .style("opacity", 0.9); // and go all the way to an opacity of .9

            var weight =  d.max_weight ? Math.round(parseInt(d.max_weight)) :  Math.round(parseInt(d.min_weight));
            self.tooltip.html("Hora: " + d.hour + "h" + "<br/>" +
                "Peso: " + weight + 'g' )// add the text of the tooltip as html
                .style("left", (d3.event.pageX) + "px") // move it in the x direction
                .style("top", (d3.event.pageY + 10) + "px"); // move it in the y direction

        })
        .on('mouseout', function(d) {

            d3.select(d3.event.target).classed("highlight", false);
            self.tooltip.transition() // declare the transition properties to fade-out the div
                .duration(600) // it shall take 500ms
                .style("opacity", 0); // and go all the way to an opacity of nil

        })
        .on("mousedown.drag",  self.datapoint_drag())
        .on("touchstart.drag", self.datapoint_drag());

    circle
        .attr("class", function(d) {
            return d === self.selected ? "selected" : null;
        })
        .attr("cx",    function(d) {
            return self.x(d.hour); })
        .attr("cy",    function(d) {
            return d.max_weight ? self.y(d.max_weight) : self.y(d.min_weight)
        });

    circle.exit().remove();

    if (d3.event && d3.event.keyCode) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }
}

SimpleGraph.prototype.datapoint_drag = function() {
    var self = this;
    return function(d) {
        registerKeyboardHandler(self.keydown());
        document.onselectstart = function() { return false; };

        self.selected = self.dragged = d;
        self.update();
    }
};

//TODO: novo método mousemove
SimpleGraph.prototype.mousemove = function() {
    var self = this;
    return function() {
        var p = d3.svg.mouse(self.svg[0][0]),
            t = d3.event.changedTouches;

        if (self.dragged) {
            if (self.dragged.min_weight) {
                self.dragged.min_weight = self.y2.invert(Math.max(0, Math.min(self.size.height, p[1])));
            } else {
                self.dragged.max_weight = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
            }

            self.update();
        }

        if (!isNaN(self.downy)) {
            d3.select('body').style("cursor", "ns-resize");
            var rupy = self.y.invert(p[1]),
                yaxis1 = self.y.domain()[1],
                yaxis2 = self.y.domain()[0],
                yextent = yaxis2 - yaxis1;
            if (rupy != 0) {
                var changey, new_domain;
                changey = self.downy / rupy;
                new_domain = [Math.round(parseInt(yaxis1 + (yextent * changey))), yaxis1];
                self.y.domain(new_domain);
                self.y2.domain(new_domain);
                self.redraw()();
            }
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
    }
};

SimpleGraph.prototype.mouseup = function() {
    var self = this;
    return function() {
        document.onselectstart = function() { return true; };
        d3.select('body').style("cursor", "auto");
        if (!isNaN(self.downx)) {
            self.redraw()();
            self.downx = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
        if (!isNaN(self.downy)) {
            self.redraw()();
            self.downy = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
        if (self.dragged) {
            self.dragged = null
        }
    }
};


SimpleGraph.prototype.keydown = function() {
    var self = this;
    return function() {
        if (!self.selected) return;
        switch (d3.event.keyCode) {
            case 8: // backspace
            case 46: { // delete
                var i = self.points_max_weight.indexOf(self.selected);
                self.points_max_weight.splice(i, 1);

                var t = self.points_min_weight.indexOf(self.selected);
                self.points_min_weight.splice(t, i);


                self.selected = self.points_max_weight.length ? self.points_max_weight[i > 0 ? i - 1 : 0] :
                    self.points_min_weight ? self.points_min_weight[t > 0 ? t - 1 : 0] : null;

                self.update();
                break;
            }
        }
    }
};

SimpleGraph.prototype.redraw = function() {
    var self = this;
    return function() {
        var tx = function(d) {
                return "translate(" + self.x(d) + ",0)";
            },
            ty = function(d) {
                return "translate(0," + self.y(d) + ")";
            },
            stroke = function(d) {
                return d ? "#ccc" : "#666";
            },
            fx = self.x.tickFormat(10),
            fy = self.y.tickFormat(5);

        // Regenerate x-ticks…
        var gx = self.svg.selectAll("g.x")
            .data(self.x.ticks(5), String)
            .attr("transform", tx);


        gx.select("text")
            .text(fx);

        var gxe = gx.enter().insert("g", "a")
            .attr("class", "x")
            .attr("transform", tx);

        gxe.append("line")
            .attr("stroke", stroke)
            .attr("y1", 0)
            .attr("y2", self.size.height);

        gxe.append("text")
            .attr("class", "axis")
            .attr("y", self.size.height)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .text(fx)
            .style("cursor", "ew-resize")
            .on("mouseover", function(d) {
                d3.select(this).style("font-weight", "bold");
            })
            .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
            .on("mousedown.drag",  self.xaxis_drag())
            .on("touchstart.drag", self.xaxis_drag());

        gx.exit().remove();

        // Regenerate y-ticks…
        var gy = self.svg.selectAll("g.y")
            .data(self.y.ticks(5), String)
            .attr("transform", ty);

        gy.select("text")
            .text(fy);

        var gye = gy.enter().insert("g", "a")
            .attr("class", "y")
            .attr("transform", ty)
            .attr("background-fill", "#FFEEB6");

        gye.append("line")
            .attr("stroke", stroke)
            .attr("x1", 0)
            .attr("x2", self.size.width);

        gye.append("text")
            .attr("class", "axis")
            .attr("x", -3)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(fy)
            .style("cursor", "ns-resize")
            .on("mouseover", function(d) {
                d3.select(this).style("font-weight", "bold");
            })
            .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
            .on("mousedown.drag",  self.yaxis_drag())
            .on("touchstart.drag", self.yaxis_drag());

        gy.exit().remove();
        //TODO: corrigir função do zoom no eixo y, para a linha de min weight
        //self.plot.call(d3.behavior.zoom().y(self.y).on("zoom", self.redraw()));
        self.update();
    }
};

SimpleGraph.prototype.xaxis_drag = function() {
    var self = this;
    return function(d) {
        document.onselectstart = function() { return false; };
        var p = d3.svg.mouse(self.svg[0][0]);
        self.downx = self.x.invert(p[0]);
    }
};

SimpleGraph.prototype.yaxis_drag = function(d) {
    var self = this;
    return function(d) {
        document.onselectstart = function() { return false; };
        var p = d3.svg.mouse(self.svg[0][0]);
        self.downy = self.y.invert(p[1]);
    }
};

SimpleGraph.prototype.getPoints = function () {
    //self.points_max_weight
    return this.points_max_weight;
};