jQuery(function(){
  var graph = new Graph();
  var springy = jQuery('#repligraph').springy({
    graph: graph
  });
  
  var counter=0;
  function coin() { return Math.random()<.5  };
  
  var clearEdges = function(){
    graph.filterEdges(function(){return false;});
  };
  var adjustGraph = function(){
    clearEdges();
    counter=(counter+1)%10;
    howmany = Math.abs(counter-5)+1;
    //console.log('G(n,e):',graph.nodes.length,graph.edges.length,'->',howmany);
    while (graph.nodes.length<howmany){
      graph.newNode({label: 'rain-'+graph.nextNodeId});
    }
    while (graph.nodes.length>howmany){
      graph.removeNode(graph.nodes[0]);
    }
    var n = graph.nodes.slice();
    n.forEach(function(v,i,ary){
      if (coin()){
        graph.newEdge(v,ary[(i+1)%ary.length], {color: '#00A0B0',weight:1});
      } else {
        graph.newEdge(v,ary[(i+1)%ary.length], {color: '#CC333F',weight:2});
        //graph.newEdge(ary[(i+1)%ary.length],v, {color: '#CC333F'});
      }
    });
  };

  adjustGraph();
  setInterval(adjustGraph,3000);
});