'use strict';

/* jshint quotmark:false */
var width = 960,
    height = 500;

var color = d3.scale.category10();

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width, height]);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//Set up tooltip
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
      return  d.name + "</span>";
    });
svg.call(tip);


setTimeout(function() {
  // this is the global data defined below
  var graph = data;
  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  var link = svg.selectAll(".link")
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("marker-end",  "url(#suit)") // Modified line
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

// Add a T is for tooltip
  var node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 30)
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag)
      .on('mouseover', tip.show) //Added
      .on('mouseout', tip.hide); //Added

  setInterval(restart,2000)
  function restart() {
    node = svg.selectAll(".node")
      .data(graph.nodes)
      .enter().append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .style("fill", function(d) { return color(d.group); })
        .call(force.drag)
        .on('mouseover', tip.show) //Added
        .on('mouseout', tip.hide); //Added

    force.start();
    console.log('restarted');
  }

  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
},0); // setTimeout(.,0) => nextTick

var data = {
  "nodes":[
    {"name":"dirac","group":1},
    {"name":"dirac-0","group":1},
    {"name":"dirac-1","group":1},
    {"name":"goedel","group":2},
    {"name":"goedel-0","group":2},
    {"name":"goedel-1","group":2},
    {"name":"cantor","group":3},
    {"name":"cantor-0","group":3},
    {"name":"cantor-1","group":3},
    {"name":"digital-ocean","group":4},
    {"name":"digital-ocean-0","group":4},
    {"name":"iris","group":5},
  ],
  "links":[
    {"source":0,"target":3,"value":10},
    {"source":0,"target":1,"value":3},
    {"source":0,"target":2,"value":3},
    {"source":1,"target":2,"value":5},
    {"source":3,"target":4,"value":3},
    {"source":3,"target":5,"value":3},
    {"source":4,"target":5,"value":5},
    {"source":6,"target":7,"value":3},
    {"source":6,"target":8,"value":3},
    {"source":7,"target":8,"value":5},
    {"source":9,"target":10,"value":5},
    {"source":9,"target":10,"value":5},
    {"source":0,"target":11,"value":10},
    {"source":3,"target":11,"value":10},
    {"source":8,"target":11,"value":10},
    {"source":10,"target":11,"value":10}
]};
