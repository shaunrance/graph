// ... existing sidebar.js code above ...

const deleteNodeButton = document.getElementById("delete-node-button");

// Save description (delegated to graph.js)
saveDescriptionButton.addEventListener("click", function() {
  if (window.saveDescription) {
    window.saveDescription();
  }
});

// Delete node (delegated to graph.js)
deleteNodeButton.addEventListener("click", function() {
  if (window.deleteSelectedNode) {
    window.deleteSelectedNode();
  }
});

// ... rest of sidebar.js ...