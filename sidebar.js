// sidebar.js: Handles sidebar UI logic, including open/close and click-outside-to-close

const sidebar = document.getElementById("sidebar");
// Use window.addNodeButton as set in graph.js

const nameInput = document.getElementById("name-input");
const categorySelect = document.getElementById("category-select");
const newCategoryInput = document.getElementById("new-category-input");
const addCategoryButton = document.getElementById("add-category-button");
const descriptionInput = document.getElementById("description-input");
const urlInput = document.getElementById("url-input");
const designerInput = document.getElementById("designer-input");
const pmInput = document.getElementById("pm-input");
const engInput = document.getElementById("eng-input");
const connectToSelect = document.getElementById("connect-to-select");
const lastUpdatedText = document.getElementById("last-updated-text");
const saveDescriptionButton = document.getElementById("save-description-button");
const deleteNodeButton = document.getElementById("delete-node-button");

// Helper: Open the sidebar with relevant data
function openSidebar(title, element, nodes, links, categories) {
  document.getElementById("sidebar-title").textContent = title;
  sidebar.style.display = "block";
  setTimeout(() => sidebar.classList.add("open"), 10);

  // Fill inputs if editing a node
  window.selectedElement = element;
  nameInput.value = element.label || "";
  categorySelect.value = element.category || "";
  descriptionInput.value = element.description || "";
  urlInput.value = element.url || "";
  designerInput.value = element.designer || "";
  pmInput.value = element.pm || "";
  engInput.value = element.eng || "";
  lastUpdatedText.textContent = element.updated ? `Last updated: ${element.updated}` : "";

  // Populate categories select
  populateCategorySelect(categories);

  // Connect To: Show all other nodes as checkboxes
  connectToSelect.innerHTML = "";
  if (nodes && element && element.id) {
    nodes.filter(n => n.id !== element.id).forEach(n => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = n.id;
      // Check if there's a link from this node to n
      const hasLink = links && links.some(l => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        return src === element.id && tgt === n.id;
      });
      checkbox.checked = hasLink;
      const label = document.createElement("label");
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" " + (n.label || n.id)));
      connectToSelect.appendChild(label);
      connectToSelect.appendChild(document.createElement("br"));
    });
  }

  // Attach the click-outside-to-close logic
  document.addEventListener("mousedown", handleClickOutsideSidebar);
}

function closeSidebar() {
  sidebar.classList.remove("open");
  setTimeout(() => {
    sidebar.style.display = "none";
    window.selectedElement = null;
    document.removeEventListener("mousedown", handleClickOutsideSidebar);
  }, 300);
}

// The actual click-outside handler
function handleClickOutsideSidebar(event) {
  // Use window.addNodeButton to avoid redeclaration
  if (!sidebar.classList.contains("open")) return;
  if (!sidebar.contains(event.target) && !(window.addNodeButton && window.addNodeButton.contains(event.target))) {
    closeSidebar();
  }
}

// Populate category dropdown
function populateCategorySelect(categories) {
  categorySelect.innerHTML = "";
  Object.entries(categories || {}).forEach(([k, v]) => {
    const option = document.createElement("option");
    option.value = k;
    option.textContent = k;
    categorySelect.appendChild(option);
  });
}
window.populateCategorySelect = populateCategorySelect;

// Add new category
addCategoryButton.addEventListener("click", function() {
  const newCat = newCategoryInput.value.trim();
  if (newCat && !(newCat in window.categories)) {
    window.categories[newCat] = "#ccc";
    populateCategorySelect(window.categories);
    categorySelect.value = newCat;
    newCategoryInput.value = "";
  }
});

// Save
saveDescriptionButton.addEventListener("click", function() {
  window.saveDescription();
  closeSidebar();
});

// Delete
deleteNodeButton.addEventListener("click", function() {
  window.deleteSelectedNode();
});

// Expose sidebar functions for use elsewhere
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;