// sidebar.js: Handles sidebar UI and interactions

// Sidebar element selectors
const sidebar = document.getElementById("sidebar");
const sidebarTitle = document.getElementById("sidebar-title");
const nameInput = document.getElementById("name-input");
const categorySelect = document.getElementById("category-select");
const newCategoryInput = document.getElementById("new-category-input");
const addCategoryButton = document.getElementById("add-category-button");
const urlInput = document.getElementById("url-input");
const designerInput = document.getElementById("designer-input");
const pmInput = document.getElementById("pm-input");
const engInput = document.getElementById("eng-input");
const descriptionInput = document.getElementById("description-input");
const lastUpdatedText = document.getElementById("last-updated-text");
const connectToSelect = document.getElementById("connect-to-select");
const saveDescriptionButton = document.getElementById("save-description-button");

let selectedElement = null;

function populateCategorySelect(categories) {
  categorySelect.innerHTML = "";
  Object.keys(categories).forEach(function(cat) {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function openSidebar(title, element, nodes, links, categories) {
  sidebarTitle.textContent = title;
  nameInput.value = element.label || element.id || "";
  categorySelect.value = element.category || "";
  urlInput.value = element.url || "";
  designerInput.value = element.designer || "";
  pmInput.value = element.pm || "";
  engInput.value = element.eng || "";
  descriptionInput.value = element.description || "";
  lastUpdatedText.textContent = element.updated ? "Last updated: " + element.updated : "";

  // Populate connectToSelect
  connectToSelect.innerHTML = "";
  nodes.forEach(function(n) {
    if (n.id !== element.id) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = n.id;
      checkbox.checked = links.some(l => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        return src === element.id && tgt === n.id;
      });
      checkbox.style.marginRight = "4px";
      checkbox.style.width = "auto";
      checkbox.style.verticalAlign = "middle";

      const labelEl = document.createElement("label");
      labelEl.style.display = "block";
      labelEl.style.textAlign = "left";
      labelEl.appendChild(checkbox);
      labelEl.appendChild(document.createTextNode(n.label || n.id));

      connectToSelect.appendChild(labelEl);
    }
  });

  sidebar.style.display = "block";
  setTimeout(() => sidebar.classList.add("open"), 10);
  selectedElement = element;
}

function closeSidebar() {
  sidebar.classList.remove("open");
  setTimeout(() => {
    sidebar.style.display = "none";
  }, 300);
}

// Add new category
addCategoryButton.addEventListener("click", function() {
  const newCat = newCategoryInput.value.trim();
  if (newCat && !window.categories[newCat]) {
    window.categories[newCat] = "#" + Math.floor(Math.random() * 16777215).toString(16);
    populateCategorySelect(window.categories);
    categorySelect.value = newCat;
    newCategoryInput.value = "";
  }
});

// Save description (delegated to graph.js)
saveDescriptionButton.addEventListener("click", function() {
  if (window.saveDescription) {
    window.saveDescription();
  }
});

// Close sidebar when clicking outside
document.addEventListener("click", function(event) {
  const isClickInsideSidebar = sidebar.contains(event.target);
  const isGraphElement = event.target.closest(".node") || event.target.closest(".link");
  const isAddNodeButton = event.target.closest("#add-node-button");
  if (!isClickInsideSidebar && !isGraphElement && !isAddNodeButton) {
    closeSidebar();
  }
});

// Export functions for graph.js
window.populateCategorySelect = populateCategorySelect;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;