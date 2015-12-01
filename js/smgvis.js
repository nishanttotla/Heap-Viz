// variables
var height = 400;
var width = 600;
var padding = 75;
var svg;
var fileMap = [];

/* Gets called when the page is loaded. */
function init() {
	svg = d3.select("#vis").append("svg")
		.attr("width", width).attr("height", height);
	var groupVar = svg.append("g");
}

/* Reads the file selected from the drop down menu and calls the fn to display it accordingly. */
function readFile() {
	var reader = new FileReader();

	reader.onload = function(e) {
		var text = reader.result;
		console.log("Onload file contents: \n" + text);
		var converted = convertDotFile(text);
		displayGraph(converted[0], converted[1]);
	}

	if (getSelectedOption() != null) {
		console.log("Reading file " + getSelectedOption());
		reader.readAsText(fileMap[getSelectedOption()]);
	} else {
		alert("No file selected.");
	}
}

/* Creates a display based on the given nodes and links. */
function displayGraph(nodes, links) {
	var radius = 15;
	// determine the maximum length of a label
	var maxLabelLength = 0;
	for (var i = 0; i < nodes.length; i++) {
		if (nodes[i].name.length > maxLabelLength) {
			maxLabelLength = nodes[i].name.length;
		}
	}

	// remove stale svg elements
	svg.selectAll("line.link").remove();
	svg.selectAll("g.node").remove();
	svg.selectAll(".linkText").remove();

	// initialize force directed graph
	var force = d3.layout.force().size([width, height])
		.nodes(nodes).links(links).gravity(1)
		.linkDistance(100)
		.charge(-3000);
	force.start();

	svg.append("defs").selectAll("marker")
		.data(["suit", "licensing", "resolved"]).enter()
		.append("marker")
		.attr("id", function(d) { return d; })
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 22)
		.attr("refY", 0)
		.attr("markerWidth", 4)
		.attr("markerHeight", 4)
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
		.style("stroke", "#CCC");

	var link = svg.selectAll("line.link").data(links).enter()
		.append("svg:line")
		.attr("class", "link")
		.style("stroke", "#CCC")
		.style("stroke-width", 4)
		.style("marker-end", "url(#suit)");

	var linkText = svg.selectAll(".linkText")
	  .data(force.links())
	  .enter().append("svg:text")
	  .attr("class","linkText")
	  .attr("dx",20)
	  .attr("dy",0)
    .style("fill","red")
	  .text(function(d,i) { return d.label; });

	var node = svg.selectAll("g.node").data(force.nodes()).enter()
		.append("svg:g")
		.attr("class", "node");

	node.append("svg:circle").attr("r", radius)
		.style("fill", function(d) { return getNodeColor(d); })
		.style("stroke", "#FFF").style("stroke-width", 3);

	node.append("svg:text").text(function(d) { return d.name; })
		.style("fill", "#000").style("font-family", "Arial")
		.style("font-size", 7*radius/maxLabelLength)
		.style("text-anchor", "middle").style("alignment-baseline", "middle");

	node.call(force.drag);

	function getNodeColor(d) {
		if (d.name == "NULL") {
			return "#999";
		} else if (d.pred == "T") {
			return "#0F0";
		} else if (d.pred == "F") {
			return "#F00";
		} else if (d.pred == "U") {
			return "#FCC";
		}
	}

	var updateLink = function() {
		this.attr("x1", function(d) {
			return d.source.x;
		}).attr("y1", function(d) {
			return d.source.y;
		}).attr("x2", function(d) {
			return d.target.x;
		}).attr("y2", function(d) {
			return d.target.y;
		});
	}

	var updateLinkText = function() {
		this.attr("dx", function(d) {
			return (d.source.x + d.target.x)/2;
		}).attr("dy", function(d) {
			return (d.source.y + d.target.y)/2;
		})
	}

	var updateNode = function() {
		this.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
	}

	force.on("tick", function() {
		node.call(updateNode);
		link.call(updateLink);
		linkText.call(updateLinkText);
	});
}

/* Convert the dot file to an array of nodes and links. */
function convertDotFile(original) {
	var nodeKeys = [];
	var nodeLabels = [];
	var nodePreds = [];
	var linkSrcs = [];
	var linkTars = [];
	var edgeLabels = [];

	var lines = original.split("\n");
	for (var i = 0; i < lines.length; i++) {
		var splitLines = lines[i].split(";");

		for (var j = 0; j < splitLines.length; j++) {
			var l = splitLines[j];

			if (l.indexOf("->") != -1) {
				var srcAndTar = l.split("->");
				var srcKey = srcAndTar[0].trim();
				var tarKey = srcAndTar[1].trim();
				var edgeLabel = "";

				if (srcKey.indexOf("label") != -1) {
					edgeLabel = srcKey.substring(srcKey.indexOf("label") + 7, srcKey.indexOf("\"", srcKey.indexOf("label") + 7));
					srcKey = srcKey.substring(0, srcKey.indexOf("[")).trim();
				} else {
					if (srcKey.indexOf(";") != -1) {
						srcKey = srcKey.substring(0, srcKey.indexOf(";")).trim();
					}
				}

				if (tarKey.indexOf("label") != -1) {
                                        edgeLabel = tarKey.substring(tarKey.indexOf("label") + 7, tarKey.indexOf("\"", tarKey.indexOf("label") + 7));
					tarKey = tarKey.substring(0, tarKey.indexOf("[")).trim();
                                } else {
                                        if (tarKey.indexOf(";") != -1) {
                                                tarKey = tarKey.substring(0, tarKey.indexOf(";")).trim();
                                        }
                                }

				if (nodeKeys.indexOf(srcKey) == -1) {
					nodeKeys.push(srcKey);
					nodeLabels.push("Node " + nodeKeys.length);
					nodePreds.push("U");
				}
				if (nodeKeys.indexOf(tarKey) == -1) {
					nodeKeys.push(tarKey);
					nodeLabels.push("Node " + nodeKeys.length);
					nodePreds.push("U");
				}

				linkSrcs.push(srcKey);
				linkTars.push(tarKey);
				edgeLabels.push(edgeLabel);
			} else if (l.indexOf("label") != -1) {
				var nodeLabel = l.substring(l.indexOf("label") + 7, l.indexOf("\"", l.indexOf("label") + 7));
				var nodeKey = l.substring(0, l.indexOf("[")).trim();
				if (nodeKeys.indexOf(nodeKey) == -1) {
					nodeKeys.push(nodeKey);
					nodeLabels.push(nodeLabel);
				} else {
					var pos = nodeKeys.indexOf(nodeKey);
					nodeLabels[pos] = nodeLabel;
				}
			} else if (l.indexOf("pred") != -1) {
				// value of predicate for the node can be true or false. This is experimental for now
				// TODO : It would make sense to create a node object instead of multiple arrays
				var nodePred = l.substring(l.indexOf("pred") + 6, l.indexOf("\"", l.indexOf("pred") + 6));
				var nodeKey = l.substring(0, l.indexOf("[")).trim();
				if (nodeKeys.indexOf(nodeKey) == -1) {
					nodeKeys.push(nodeKey);
					nodePreds.push(nodePred);
				} else {
					var pos = nodeKeys.indexOf(nodeKey);
					nodePreds[pos] = nodePred;
				}
			}
		}
	}

	// create node and link arrays

	var nodeArray = [];
	var linkArray = [];

	for (var i = 0; i < nodeKeys.length; i++) {
		var node = {
			id : nodeKeys[i],
			name : nodeLabels[i],
			pred : nodePreds[i]
		};
		nodeArray.push(node);
	}

	for (var i = 0; i < linkSrcs.length; i++) {
		var link = {
			source : findNode(nodeArray, linkSrcs[i]),
			target : findNode(nodeArray, linkTars[i]),
			label : edgeLabels[i]
		};
		linkArray.push(link);
	}

	return [nodeArray, linkArray];
}


/* Determine which of the selected files are of the proper format.
 * Populate the drop down menu accordingly.
 */
function handleFileSelect(files) {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		var targetFiles = [];
		var notDot = [];
		for (var i = 0, f; f = files[i]; i++) {
			if (isDotFile(f.name)) {
				targetFiles.push(f);
			} else {
				notDot.push(f);
			}
		}
		if (notDot.length > 0) {
			var notDotFiles = "";
			for (var i = 0; i < notDot.length; i++) {
				notDotFiles = notDotFiles + "-  " + String(notDot[i].name) + "\n";
			}
			alert("The following are not .dot files:\n" + notDotFiles);
		}

		// remove all old select options
		while (document.getElementById("dropdown").childNodes.length > 0) {
			document.getElementById("dropdown").removeChild(document.getElementById("dropdown").firstChild);
		}

		// add new select options
		for (var i = 0; i < targetFiles.length; i++) {
			// populate the file map
			fileMap[targetFiles[i].name] = targetFiles[i];
			var newFileOption = document.createElement("option");
			newFileOption.value = targetFiles[i].name;
			newFileOption.text = targetFiles[i].name;
			document.getElementById("dropdown").appendChild(newFileOption);
		}
	} else {
		alert('The File APIs are not fully supported by your browser.');
	}
}

/* Determine if the given file name is representative of a .dot file. */
function isDotFile(fileName) {
        var parts = fileName.split(".");
        if (parts.length < 1) {
                return false;
        }

        if (parts[parts.length - 1] === "dot") {
                return true;
        }

        return false;
}

/* Remove the left whitespace from the string. */
String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}

/* Locate the node with the given id. */
function findNode(nodes, id) {
	for (var i in nodes) {
		if (nodes[i]["id"] == id) {
			return nodes[i];
		}
	}

	return null;
}

/* Get the selected file from the drop down menu. */
function getSelectedOption() {
	var node = d3.select("#dropdown").node();
	var i = node.selectedIndex;
	if (node[i] != null) {
		return node[i].value;
	}

	return node[i];
}