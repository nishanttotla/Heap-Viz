/*
Directed graph editor courtesy http://bl.ocks.org/rkirsling/5001347
*/

// verification data, must be retrieved from the verifier
var allPredicates = ['p1', 'p2'],
    allHeapvars = ['x', 'y'];

var selectedPredicate = null,
    selectedHeapvar = 'x';

// initial assignments. Other possible values are 't' and 'm'. These are functions because assignments aren't immutable
function initPredAssignments() {
  return ['f', 'f'];
}

function initHeapvarAssignments() {
  return ['f', 'f'];
}

/*
Functions to interact with HTML forms
TODO everything is static right now, need to make it dynamic dependent on the set of predicates
*/

// update selected predicate from the HTML form
function updateSelectedPredicate() {
  if(document.getElementById('p1').checked) {
    selectedPredicate = 'p1';
  } else if(document.getElementById('p2').checked) {
    selectedPredicate = 'p2';
  } else {
    selectedPredicate = null;
  }
  restart();
}

// update selected heapvar from the HTML form
function updateSelectedHeapvar() {
  if(document.getElementById('x').checked) {
    selectedHeapvar = 'x';
  } else if(document.getElementById('y').checked) {
    selectedHeapvar = 'y';
  }
  restart();
}

// update predicate value by taking it from the form
// TODO need input validation
function updatePredicateValueFromForm() {
  var valInForm = document.getElementById('predVal').value;
  if(document.getElementById('p1').checked) {
    setPredicate('p1',valInForm);
  } else if(document.getElementById('p2').checked) {
    setPredicate('p2',valInForm);
  }
  restart();
}

// update heapvar value by taking it from the form
// TODO need input validation
function updateHeapvarValueFromForm() {
  var valInForm = document.getElementById('heapvarVal').value;
  if(document.getElementById('x').checked) {
    setHeapvar('x',valInForm);
  } else if(document.getElementById('y').checked) {
    setHeapvar('y',valInForm);
  }
  restart();
}

/*
functions to set predicate/heap variables of selected node
*/
function setPredicate(pred, val) {
  if(selected_node) {
    selected_node.predicates[allPredicates.indexOf(pred)] = val;
  }
}

// additional constraint here - if a given heap variable is set to true, then it must be false for every other node
// if we're adding a maybe node, then all other 'true' values get converted to maybe
function setHeapvar(heapvar, val) {
  var index = allHeapvars.indexOf(heapvar);
  if(selected_node) {
    selected_node.heapvars[index] = val;

    if(val === 't') {
      d3.selectAll('.node').each(function(d) {
        if(selected_node.id !== d.id) {
          d.heapvars[index] = 'f';
        } });
    } else if(val === 'm') {
      d3.selectAll('.node').each(function(d) {
        if(d.heapvars[index] === 't') {
          d.heapvars[index] = 'm';
        } });
    }
  }
}

function printHeapvars() {
  d3.selectAll('.node').each(function(d) { console.log(d.heapvars); } )
}

// function to print node text
function displayHeapvarsForNode(heapvars) {
  nodeText = '';
  // map does not mutate, so this is safe
  heapvars.map(function(h, i) {
    if(h === 't') {
      nodeText += allHeapvars[i];
    } else if(h === 'm') {
      nodeText += (allHeapvars[i] + '?')
    }
  });
  if(nodeText === '') {
    nodeText = '-';
  }
  return nodeText;
}

// set up SVG for D3
var width  = 960,
    height = 500;

// maps the node id to its index in the list of nodes
// returns -1 if the id is not in the list
function idToIndex(id) {
  for (var idx = 0, len = nodes.length; idx < len; idx++) {
    if (nodes[idx].id === id) {
      return idx
    }
  }
  return -1
}

// return node colors based on chosen predicate
function colors(id) {
  if(selectedPredicate) {
    // nodes are referenced by id, so index needs to be found for a given id
    var predVal = nodes[idToIndex(id)].predicates[allPredicates.indexOf(selectedPredicate)];
    if(predVal === 't') {
      return '#5A5';
    } else if(predVal === 'f') {
      return '#D52020';
    } else {
      // maybe
      return '#FCC';
    }
  }
  return '#B59B9B';
}

// graph appearance parameters
var smallRadius = 15,
    largeRadius = 20;

var svg = d3.select('body')
  .append('svg')
  .attr('oncontextmenu', 'return false;')
  .attr('width', width)
  .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [
    {id: 0, reflexive: false, summary: false, predicates: initPredAssignments(), heapvars: initHeapvarAssignments()},
    {id: 1, reflexive: false, summary: false, predicates: initPredAssignments(), heapvars: initHeapvarAssignments()},
    {id: 2, reflexive: false, summary: false, predicates: initPredAssignments(), heapvars: initHeapvarAssignments()}
  ],
  lastNodeId = 2,
  links = [
    {source: nodes[0], target: nodes[1], left: false, right: true, maybe: true},
    {source: nodes[1], target: nodes[2], left: false, right: true, maybe: true},
    {source: nodes[2], target: nodes[2], left: false, right: true, maybe: true},
  ];

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

// check if the link is mutual, used to decide whether to draw curved or straight arrow
// we assume this function isn't called for reflexive edges, which get handled first
function isLinkMutual(l) {
  var source = l.target.id;
  var target = l.source.id; // interchanged
  if(links.filter(function(l) { return (l.source.id===source && l.target.id === target); }).length > 0) {
    return true;
  }
  return false;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    var sourcePadding = d.left ? (d.source.summary ? largeRadius+5 : largeRadius) : (d.source.summary ? smallRadius+5 : smallRadius),
        targetPadding = d.right ? (d.target.summary ? largeRadius+5 : largeRadius) : (d.target.summary ? smallRadius+5 : smallRadius);

    // handle reflexive edges first
    if(d.source.id === d.target.id) {
      var sourceX = d.source.x,
          sourceY = d.source.y - sourcePadding, // reflexive edges are always oriented up
          x1 = sourceX - 3*largeRadius;
          y1 = sourceY - 3*largeRadius;
          x2 = sourceX + 3*largeRadius;
          y2 = sourceY - 3*largeRadius;
      return 'M' + sourceX + ',' + sourceY + 'C' + x1 + ',' + y1 + ',' + x2 + ',' + y2 + ',' + sourceX + ',' + sourceY;
    }

    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);

    if(isLinkMutual(d)) {
      return 'M' + sourceX + ',' + sourceY + 'A' + dist/2 + ',' + dist/2 + ',0,0,0,' + targetX + ',' + targetY;
    } else {
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    }
  });

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', function(d) { return d === selected_link; })
    .classed('maybe', function(d) { return d.maybe; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('maybe', function(d) { return d.maybe; })
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      restart();
    });

  // remove old links
  path.exit().remove();


  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .attr('r', function(d) { return (d.summary) ? largeRadius : smallRadius })
    .classed('reflexive', function(d) { return d.reflexive; });

  // update text for existing nodes
  d3.selectAll('text')
    .text(function(d) { return displayHeapvarsForNode(d.heapvars); });

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', function(d) { return (d.summary) ? largeRadius : smallRadius })
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .classed('reflexive', function(d) { return d.reflexive; })
    .on('mouseover', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select node
      mousedown_node = d;
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;
      selected_link = null;

      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

      restart();
    })
    .on('mouseup', function(d) {
      if(!mousedown_node) return;

      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseup_node = d;
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly right only
      // mouseup is the target of the dragged path, mousedown the source
      var source = mousedown_node,
          target = mouseup_node,
          direction = 'right';
      var link;
      link = links.filter(function(l) {
        return (l.source === source && l.target === target);
      })[0];

      // if link doesn't exist, create it
      if(!link) {
        link = {source: source, target: target, left: false, right: false, maybe: true};
        link[direction] = true;
        links.push(link);
        // if there is a True link going out of source, convert it to Maybe
        convertAllOutgoingEdgesMaybe(source);
      }

      // select new link
      selected_link = link;
      selected_node = null;
      restart();
    });

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return displayHeapvarsForNode(d.heapvars); });

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
}

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();

  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

  // insert new node at point
  var point = d3.mouse(this),
      node = {id: ++lastNodeId, reflexive: false, summary: false, predicates: initPredAssignments(), heapvars: initHeapvarAssignments()};
  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  restart();
}

function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  restart();
}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

function spliceLinksForNodeOutgoingExceptTarget(node, target) {
  var toSplice = links.filter(function(l) {
    return (l.source === node && l.target !== target);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

// converts all outgoing edges to Maybe. This is required whenever a new link is added (Ref Issue #5)
function convertAllOutgoingEdgesMaybe(node) {
  var toConvert = links.filter(function(l) {
    return (l.source === node);
  }); // at most one node in toConvert actually needs to be converted
  toConvert.map(function(l) { l.maybe = true; }); // a mutating map, ugh!
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle.call(force.drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
      break;
    case 82: // R
      // create a reflexive edge on the selected node
      if(selected_node) {
        var source = selected_node,
            target = selected_node,
            direction = 'right';
        var refLink;
        refLink = links.filter(function(l) {
          return (l.source === source && l.target === target);
        })[0];

        // if link doesn't exist, create it
        if(!refLink) {
          refLink = {source: source, target: target, left: false, right: false, maybe: true};
          refLink[direction] = true;
          links.push(refLink);
          // if there is a True link going out of source, convert it to Maybe
          convertAllOutgoingEdgesMaybe(source);
        }

        // select new link
        selected_link = refLink;
        selected_node = null;
      }
      restart();
      break;
    case 83: // S
      if(selected_node) {
        // toggle whether node is a summary node
        selected_node.summary = !selected_node.summary;
      }
      restart();
      break;
    case 77: // M
      if(selected_link) {
        // delete all other links if setting selected_link to True
        if(selected_link.maybe) {
          spliceLinksForNodeOutgoingExceptTarget(selected_link.source, selected_link.target);
        }
        // toggle whether link has maybe value
        selected_link.maybe = !selected_link.maybe;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();