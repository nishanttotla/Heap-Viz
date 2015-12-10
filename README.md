# Heap-Viz

These visualizations are part of the tool for oracle-guided heap invariant synthesis. We allow the user to create heap patterns that can be used as invariants in verification. All visualizations use `d3.js`. To try out the graph creator, follow these steps:

### Get the code
First clone the git repo

`$ git clone https://github.com/nishanttotla/Heap-Viz.git`

This will create a new folder called `heap-viz`. Navigate to this folder for the next step.

### Run a local HTTP server
`d3.js` needs a local server running. A simple server of your choice should work. For example, we'll set up a Python server, from within the `heap-viz` directory

`$ python -m SimpleHTTPServer 8000`

You can edit the port number if necessary.

### Start visualization
Open a web browser and go to `http://localhost:8000/creator.html`. If all went well, you should see something like this

[IMAGE]

Now you're ready to create graphs!

### Instructions for creating graphs
The interface allows you to create directed graphs, that represent heaps. Currently, we assume that each node is a location in memory, and has a single possible outgoing edge on the field `next`. The system also contains predefined predicates (`p1` and `p2` currently) and heap variables (`x` and `y` currently) whose values can be updated. Here's a list of possible interactions.
- Click anywhere on empty space to create a new node.
- Drag the mouse pointer from one node to another to create a directed edge between them.
- Click on an existing node to select it (it will appear brighter).
- Press `R` after selecting a node to add/remove a reflexive edge.
- Click on an edge to select it (appears dotted). A newly created edge is selected by default.
- Press delete or backspace to remove a selected node/edge.

The following interactions allow for setting of verification related properties of nodes and edges.
- In the form at the top, choose a predicate to display current assignments of the selected predicate for each node. This is displayed as the node color, and indicates `True` (green), `False` (red), or `Maybe`(pink) values.
  - These values can be updated using the same form, which works once a node has been selected.
  - Possible values are `t`, `f`, and `m`. Input is currently not validated, so entering anything else might crash the visualization.
- For a given heap variable and selected node, possible assignments can be `True`, `False`, or `Maybe`. These are indicated as labels on nodes, and are updated using the relevant form at the top.
  - Possible values are `t`, `f`, and `m`. Input is currently not validated, so entering anything else might crash the visualization.
  - A heap variable can be `True` for at most one node, and the system enforces this.
- Select an edge and press `M` to toggle between `Maybe` and `True` edges. Edges that don't exist are (implicitly) `False`.
  - Since we only have one outgoing field (`next`) right now, each node can have a single outgoing `True` edge. The system enforces this constraint.
  - `True` edges are green and `Maybe` edges pink.
- Select a node and press `S` to toggle between summary and non-summary nodes. Summary nodes appear larger and default nodes are non-summary.

### Yet to come
Missing features and bugs are tracked on the issues page: https://github.com/nishanttotla/Heap-Viz/issues. Please feel free to report problems. In particular, the following key features are still pending
- Add a default NULL node that users can't delete (Issue #13)
- Allow multiple fields for a single node (`next`, `prev` etc.)
- Export graphs using dotfiles, to interface with the Impact algorithm (Issue #9)
