// ... existing graph.js code above ...

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

  // Refresh
  restartSimulation();
  window.closeSidebar();
};

// ... rest of graph.js ...