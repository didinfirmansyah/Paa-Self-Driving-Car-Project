var WALL = 0,
    performance = window.performance;

$(function() {

    var $grid = $("#search_grid"),
        $selectGridSize = $("#selectGridSize");

    var opts = {
        gridSize: $selectGridSize.val()
    };

    var grid = new GraphSearch($grid, opts, astar.search);

    $("#btnGenerate").click(function() {
        grid.initialize();
    });

    $selectGridSize.change(function() {
        grid.setOption({gridSize: $(this).val()});
        grid.initialize();
    });


});

var css = { start: "start", finish: "finish", wall: "wall", active: "active" };

function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    this.opts = $.extend({wallFrequency:0.1, gridSize:20}, options);
    this.initialize();
}
GraphSearch.prototype.setOption = function(opt) {
    this.opts = $.extend(this.opts, opt);
    this.drawDebugInfo();
};
GraphSearch.prototype.initialize = function() {
    this.grid = [];
    var self = this,
        nodes = [],
        $graph = this.$graph;

    $graph.empty();

    var cellWidth = ($graph.width()/this.opts.gridSize)-2,  // -2 for border
        cellHeight = ($graph.height()/this.opts.gridSize)-2,
        $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight),
        startSet = false;

    for(var x = 0; x < this.opts.gridSize; x++) {
        var $row = $("<div class='clear' />"),
            nodeRow = [],
            gridRow = [];

        for(var y = 0; y < this.opts.gridSize; y++) {
            var id = "cell_"+x+"_"+y,
                $cell = $cellTemplate.clone();
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);

            var isWall = Math.floor(Math.random()*(1/self.opts.wallFrequency));
            if(isWall === 0) {
                nodeRow.push(WALL);
                $cell.addClass(css.wall);
            }
            else  {
                var cell_weight = ($("#generateWeights").prop("checked") ? (Math.floor(Math.random() * 3)) * 2 + 1 : 1);
                nodeRow.push(cell_weight);
                $cell.addClass('weight' + cell_weight);
                if ($("#displayWeights").prop("checked")) {
                    $cell.html(cell_weight);
                }
                if (!startSet) {
                    $cell.addClass(css.start);
                    startSet = true;
                }
            }
        }
        $graph.append($row);

        this.grid.push(gridRow);
        nodes.push(nodeRow);
    }

    this.graph = new Graph(nodes);

    // Mengatur tujuan
    this.$cells = $graph.find(".grid_item");
    this.$cells.click(function() {
        self.cellClicked($(this));
    });
};
GraphSearch.prototype.cellClicked = function($end) {

    var end = this.nodeFromElement($end);

    if($end.hasClass(css.wall) || $end.hasClass(css.start)) {
        return;
    }

    this.$cells.removeClass(css.finish);
    $end.addClass("finish");
    var $start = this.$cells.filter("." + css.start),
        start = this.nodeFromElement($start);

    var sTime = performance ? performance.now() : new Date().getTime();

    var path = this.search(this.graph, start, end, {
        closest: this.opts.closest
    });
    var fTime = performance ? performance.now() : new Date().getTime(),
        duration = (fTime-sTime).toFixed(2);

    if(path.length === 0) {
        $("#message").text("tidak dapat menemukan jalan");
        this.animateNoPath();
    }
    else {
        this.drawDebugInfo();
        this.animatePath(path);
    }
};
GraphSearch.prototype.drawDebugInfo = function() {
    this.$cells.html(" ");
    var that = this;
};
GraphSearch.prototype.nodeFromElement = function($cell) {
    return this.graph.grid[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animatePath = function(path) {
    var grid = this.grid,
        timeout = 2000 / grid.length,
        elementFromNode = function(node) {
        return grid[node.x][node.y];
    };

    var self = this;
    // will add start class if final
    var removeClass = function(path, i) {
        if(i >= path.length) { // finished removing path, set start positions
            return setStartClass(path, i);
        }
        elementFromNode(path[i]).removeClass(css.active);
        setTimeout(function() {
            removeClass(path, i+1);
        }, timeout*path[i].getCost());
    };
    var addClass = function(path, i) {
        if(i >= path.length) { // Finished showing path, now remove
            return removeClass(path, 0);
        }
        elementFromNode(path[i]).addClass(css.active);
        setTimeout(function() {
            addClass(path, i+1);
        }, timeout*path[i].getCost());
    };

    addClass(path, 0);
    this.$graph.find("." + css.start).removeClass(css.start);
    this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
};
