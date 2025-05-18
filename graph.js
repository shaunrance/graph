// graph.js: Handles D3 graph visualization, node/link data, and graph events

let categories = {};
let nodes = [];
let links = [];
let graphData = {};
let simulation, link, node, label;

const svg = d3.select("#network-svg");

// Utility function to get the current SVG size (responsive)
function getSvgSize() {
  const el = svg.node();
  return {
    width: el.clientWidth || +svg.attr("width"),
    height: el.clientHeight || +svg.attr("height")
  };
}

let zoomContainer = svg.append("g").attr("class", "zoom-container");
const addNodeButton = document.getElementById("add-node-button");

// --- ARROW MARKER DEFINITION ---
svg.append("defs").append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "-0 -5 10 10")
  .attr("refX", 28)
  .attr("refY", 0)
  .attr("orient", "auto")
  .attr("markerWidth", 8)
  .attr("markerHeight", 8)
  .attr("xoverflow", "visible")
  .append("svg:path")
  .attr("d", "M 0,-5 L 10,0 L 0,5")
  .attr("fill", "#999")
  .style("stroke", "none");

// Zoom behavior
const zoom = d3.zoom()
  .scaleExtent([0.1, 5])
  .on("zoom", function(event) {
    svg.select("g.zoom-container").attr("transform", event.transform);
  });
svg.call(zoom);

/**
 * Hand tuning tip:
 * - To make the graph denser, decrease link distance and reduce (make less negative) charge strength.
 * - Add or adjust collide/radial forces for fine control of node clustering.
 * - You may want to expose these values via UI sliders for real-time experimentation.
 */
function restartSimulation() {
  // Remove old elements before re-rendering
  zoomContainer.selectAll(".link").remove();
  zoomContainer.selectAll(".node").remove();
  zoomContainer.selectAll(".label").remove();

  // Get current SVG width and height for simulation
  const { width, height } = getSvgSize();

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(80) // Hand tuning: decrease for higher density (default was 150)
    )
    .force("charge", d3.forceManyBody()
      .strength(-100) // Hand tuning: less negative for more density (default was -300)
    )
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(22)) // Hand tuning: adjust radius to let nodes get closer or avoid overlap
    .force("radial", d3.forceRadial(
      Math.min(width, height) / 2.5, width / 2, height / 2
    ).strength(0.03)); // Hand tuning: add radial force for more "pull" towards center

  link = zoomContainer.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("marker-end", "url(#arrowhead)")
    .on("click", function(event, d) {
      // Find source/target node objects for sidebar display
      const src = nodes.find(n => n.id === (typeof d.source === "object" ? d.source.id : d.source)) || d.source;
      const tgt = nodes.find(n => n.id === (typeof d.target === "object" ? d.target.id : d.target)) || d.target;
      window.openSidebar("Link: " + (src.label || src.id) + " → " + (tgt.label || tgt.id), d, nodes, links, categories);
    });

  node = zoomContainer.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 20)
    .attr("class", "node")
    .attr("fill", function(d) { return categories[d.category] || "#ccc"; })
    .on("click", function(event, d) { 
      window.openSidebar("Node: " + (d.label || d.id), d, nodes, links, categories); 
      event.stopPropagation();
    })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  label = zoomContainer.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("class", "label")
    .text(function(d) { return d.label || d.id; });

  simulation.on("tick", function() {
    link.attr("x1", function(d) {
          return (typeof d.source === 'object' ? d.source.x : nodes.find(n=>n.id===d.source).x);
        })
        .attr("y1", function(d) {
          return (typeof d.source === 'object' ? d.source.y : nodes.find(n=>n.id===d.source).y);
        })
        .attr("x2", function(d) {
          return (typeof d.target === 'object' ? d.target.x : nodes.find(n=>n.id===d.target).x);
        })
        .attr("y2", function(d) {
          return (typeof d.target === 'object' ? d.target.y : nodes.find(n=>n.id===d.target).y);
        });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    label.attr("x", function(d) { return d.x; })
         .attr("y", function(d) { return d.y + 30; });
  });
}

function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Save Description function (used by sidebar.js)
window.saveDescription = function saveDescription() {
  if (!window.selectedElement) return;

  // Update properties from sidebar
  window.selectedElement.label = nameInput.value;
  window.selectedElement.category = categorySelect.value;
  window.selectedElement.url = urlInput.value;
  window.selectedElement.designer = designerInput.value;
  window.selectedElement.pm = pmInput.value;
  window.selectedElement.eng = engInput.value;
  window.selectedElement.description = descriptionInput.value;
  window.selectedElement.updated = new Date().toLocaleString();
  lastUpdatedText.textContent = "Last updated: " + window.selectedElement.updated;

  // If it's a new node, add it to nodes (preserve x/y if present)
  let nodeIdx = nodes.findIndex(n => n.id === window.selectedElement.id);
  if (nodeIdx === -1) {
    // Place new node near center with slight random offset
    const { width, height } = getSvgSize();
    window.selectedElement.x = width / 2 + Math.random() * 100 - 50;
    window.selectedElement.y = height / 2 + Math.random() * 100 - 50;
    nodes.push(window.selectedElement);
  } else {
    // Merge updates into the existing node object (to preserve simulation state)
    Object.assign(nodes[nodeIdx], window.selectedElement);
  }

  // Handle links: get current connections from UI
  const selectedConnections = Array.from(connectToSelect.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);

  // Remove all links from this node (as source)
  links = window.links = links.filter(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    return src !== window.selectedElement.id;
  });

  // Add new links for checked boxes
  selectedConnections.forEach(targetId => {
    // Prevent duplicate links
    if (!links.some(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      return src === window.selectedElement.id && tgt === targetId;
    })) {
      links.push({ source: window.selectedElement.id, target: targetId, description: "" });
    }
  });

  // Rebuild graphData
  graphData.categories = { ...categories };
  graphData.nodes = nodes.map(n => ({
    id: n.id,
    label: n.label,
    category: n.category,
    url: n.url,
    designer: n.designer,
    pm: n.pm,
    eng: n.eng,
    description: n.description,
    updated: n.updated
  }));
  graphData.links = links.map(l => ({
    source: typeof l.source === 'object' ? l.source.id : l.source,
    target: typeof l.target === 'object' ? l.target.id : l.target,
    description: l.description || ""
  }));

  // Save to server using API
  saveGraphData(graphData)
    .then(resp => {
      if (resp.status === 'success') {
        alert("Graph saved successfully!");
      } else {
        alert("Save failed: " + (resp.error || "Unknown error"));
      }
    })
    .catch(err => {
      alert("Save failed: " + err);
    });

  restartSimulation();
};

// Delete node function (used by sidebar.js)
window.deleteSelectedNode = function deleteSelectedNode() {
  if (!window.selectedElement) return;
  const nodeId = window.selectedElement.id;
  if (!nodeId) return;

  if (!confirm(`Are you sure you want to delete node "${window.selectedElement.label || nodeId}"? This cannot be undone.`)) {
    return;
  }

  // Remove node from nodes array
  nodes = window.nodes = nodes.filter(n => n.id !== nodeId);

  // Remove all links where this node is source or target
  links = window.links = links.filter(l => {
    const src = typeof l.source === "object" ? l.source.id : l.source;
    const tgt = typeof l.target === "object" ? l.target.id : l.target;
    return src !== nodeId && tgt !== nodeId;
  });

  // Update and save graphData
  graphData.categories = { ...categories };
  graphData.nodes = nodes.map(n => ({
    id: n.id,
    label: n.label,
    category: n.category,
    url: n.url,
    designer: n.designer,
    pm: n.pm,
    eng: n.eng,
    description: n.description,
    updated: n.updated
  }));
  graphData.links = links.map(l => ({
    source: typeof l.source === 'object' ? l.source.id : l.source,
    target: typeof l.target === 'object' ? l.target.id : l.target,
    description: l.description || ""
  }));

  // Save to server using API
  saveGraphData(graphData)
    .then(resp => {
      if (resp.status === 'success') {
        alert("Node deleted successfully!");
      } else {
        alert("Delete failed: " + (resp.error || "Unknown error"));
      }
    })
    .catch(err => {
      alert("Delete failed: " + err);
    });

  restartSimulation();
  window.closeSidebar();
};

window.categories = categories; // For sidebar.js to access
window.nodes = nodes;
window.links = links;

document.addEventListener("DOMContentLoaded", function() {
  loadGraphData().then(function(data) {
    graphData = data;
    categories = window.categories = data.categories || {};
    nodes = window.nodes = (data.nodes || []).map(n => Object.assign({}, n));
    links = window.links = (data.links || []).map(l => Object.assign({}, l));
    window.populateCategorySelect(categories);
    restartSimulation();
  }).catch(function(e) {
    categories = window.categories = {};
    nodes = window.nodes = [];
    links = window.links = [];
    graphData = { categories: {}, nodes: [], links: [] };
    window.populateCategorySelect(categories);
    restartSimulation();
    alert("Could not load graph data: " + e);
  });

  addNodeButton.addEventListener("click", function(event) {
    event.stopPropagation();
    const { width, height } = getSvgSize();
    const newNode = {
      id: "Node " + (nodes.length + 1),
      label: "Node " + (nodes.length + 1),
      category: Object.keys(categories)[0] || "",
      url: "",
      designer: "",
      pm: "",
      eng: "",
      description: "",
      updated: "",
      x: width / 2 + Math.random() * 100 - 50,
      y: height / 2 + Math.random() * 100 - 50
    };
    window.openSidebar("New Node", newNode, nodes, links, categories);
  });
});

// On window resize, update simulation center and radial forces
window.addEventListener('resize', () => {
  const { width, height } = getSvgSize();
  if (simulation) {
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.force("radial", d3.forceRadial(
      Math.min(width, height) / 2.5, width / 2, height / 2
    ).strength(0.03));
    simulation.alpha(0.4).restart();
  }
});

// Prevent sidebar from closing when clicking inside the sidebar
sidebar.addEventListener("mousedown", function(event) {
  event.stopPropagation();
});