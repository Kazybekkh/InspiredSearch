(function() {
  const existingTree = document.getElementById('arxiv-box-tree');

  if (existingTree) {
    // Tree already exists, exit early
    return;
  }

  const tree = document.createElement('div');
  tree.id = 'arxiv-box-tree';
  tree.style.top = '20px';
  tree.style.left = '20px';
  tree.style.position = 'fixed';
  tree.style.width = '600px';
  tree.style.height = '300px';

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const connectors = document.createElementNS(svgNamespace, 'svg');
  connectors.classList.add('tree-connectors');
  connectors.setAttribute('viewBox', '0 0 600 300');
  connectors.setAttribute('width', '600');
  connectors.setAttribute('height', '300');
  connectors.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(svgNamespace, 'defs');
  const marker = document.createElementNS(svgNamespace, 'marker');
  marker.setAttribute('id', 'arxiv-tree-arrowhead');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '4');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('markerUnits', 'strokeWidth');

  const markerPath = document.createElementNS(svgNamespace, 'path');
  markerPath.setAttribute('d', 'M0,0 L8,4 L0,8 z');
  markerPath.setAttribute('fill', '#007bff');

  marker.appendChild(markerPath);
  defs.appendChild(marker);
  connectors.appendChild(defs);

  // Create paths for right-angled connections
  const topPath = document.createElementNS(svgNamespace, 'path');
  topPath.setAttribute('stroke', 'white');
  topPath.setAttribute('stroke-width', '2');
  topPath.setAttribute('fill', 'none');

  const bottomPath = document.createElementNS(svgNamespace, 'path');
  bottomPath.setAttribute('stroke', 'white');
  bottomPath.setAttribute('stroke-width', '2');
  bottomPath.setAttribute('fill', 'none');

  connectors.append(topPath, bottomPath);

  const rootBox = document.createElement('div');
  rootBox.className = 'tree-box tree-root drag-handle';
  rootBox.innerHTML = `
    <div class="box-title">SAGE: A Realistic Benchmark</div>
    <ul class="limitation-list">
      <li>Limitation 1</li>
      <li>Limitation 2</li>
      <li>Limitation 3</li>
    </ul>
  `;

  // Create expand button
  const expandButton = document.createElement('div');
  expandButton.className = 'expand-button';
  expandButton.innerHTML = 'Generate Limitations';
  expandButton.title = 'Generate Limitations';
  rootBox.appendChild(expandButton);

  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'tree-children';

  const leftChild = document.createElement('div');
  leftChild.className = 'tree-box tree-child';
  leftChild.innerHTML = `
    <div class="box-title">Paper 2</div>
    <ul class="limitation-list">
      <li>Limitation 1</li>
      <li>Limitation 2</li>
      <li>Limitation 3</li>
    </ul>
  `;

  const rightChild = document.createElement('div');
  rightChild.className = 'tree-box tree-child';
  rightChild.innerHTML = `
    <div class="box-title">Paper 3</div>
    <ul class="limitation-list">
      <li>Limitation 1</li>
      <li>Limitation 2</li>
      <li>Limitation 3</li>
    </ul>
  `;

  childrenContainer.append(leftChild, rightChild);

  tree.append(connectors, rootBox, childrenContainer);
  
  // Create toggle button
  const toggleButton = document.createElement('div');
  toggleButton.id = 'arxiv-flowchart-toggle';
  toggleButton.innerHTML = '☰';
  toggleButton.title = 'Toggle Flowchart';
  
  // Initially hide the tree and show the button
  tree.style.display = 'flex';
  
  document.body.appendChild(tree);
  document.body.appendChild(toggleButton);

  const updateConnectors = () => {
    // Only update if the tree is visible and expanded
    if (!tree.classList.contains('visible') || !tree.classList.contains('expanded')) {
      return;
    }

    // Use relative positioning within the tree container
    const rootRect = rootBox.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();
    const topChildRect = leftChild.getBoundingClientRect();
    const bottomChildRect = rightChild.getBoundingClientRect();

    // Starting point from right edge of root box (relative to tree container)
    const startX = rootRect.right - treeRect.left;
    const startY = rootRect.top + rootRect.height / 2 - treeRect.top;

    // Connection points for child boxes (left edge, center, relative to tree container)
    const topChildX = topChildRect.left - treeRect.left;
    const topChildY = topChildRect.top + topChildRect.height / 2 - treeRect.top;
    
    const bottomChildX = bottomChildRect.left - treeRect.left;
    const bottomChildY = bottomChildRect.top + bottomChildRect.height / 2 - treeRect.top;

    // Midpoint for the vertical line
    const midX = startX + 30;

    // Create right-angled paths
    // Path to top child: right -> down/up -> right
    const topPathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${topChildY} L ${topChildX} ${topChildY}`;
    topPath.setAttribute('d', topPathData);

    // Path to bottom child: right -> down/up -> right  
    const bottomPathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${bottomChildY} L ${bottomChildX} ${bottomChildY}`;
    bottomPath.setAttribute('d', bottomPathData);
  };

  requestAnimationFrame(updateConnectors);
  window.addEventListener('resize', updateConnectors);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseMove = (event) => {
    if (!isDragging) {
      return;
    }

    const nextLeft = event.clientX - offsetX;
    const nextTop = event.clientY - offsetY;

    tree.style.left = `${nextLeft}px`;
    tree.style.top = `${nextTop}px`;
  };

  const onMouseUp = () => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // Update connectors only after dragging is complete
    updateConnectors();
  };

  const onMouseDown = (event) => {
    if (!event.target.closest('.drag-handle')) {
      return;
    }

    event.preventDefault();

    const rect = tree.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    isDragging = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  tree.addEventListener('mousedown', onMouseDown);
  
  // Expand/collapse functionality
  let isExpanded = false;
  let hasGeneratedOnce = false;
  
  const toggleExpand = (event) => {
    event.stopPropagation(); // Prevent dragging when clicking expand button
    
    if (!isExpanded) {
      // Expanding
      if (!hasGeneratedOnce) {
        // First time - show "Generating..." and add 2 second delay
        expandButton.innerHTML = 'Generating...';
        expandButton.style.pointerEvents = 'none'; // Disable button during generation
        
        setTimeout(() => {
          isExpanded = true;
          hasGeneratedOnce = true;
          tree.classList.add('expanded');
          expandButton.innerHTML = 'Collapse';
          expandButton.title = 'Collapse';
          expandButton.style.pointerEvents = 'auto';
          
          // Update connectors after expansion animation
          setTimeout(() => {
            updateConnectors();
          }, 300);
        }, 2000);
      } else {
        // Subsequent times - immediate expand
        isExpanded = true;
        tree.classList.add('expanded');
        expandButton.innerHTML = 'Collapse';
        expandButton.title = 'Collapse';
        
        // Update connectors after expansion animation
        setTimeout(() => {
          updateConnectors();
        }, 300);
      }
    } else {
      // Collapsing - always instant
      isExpanded = false;
      tree.classList.add('collapsing');
      tree.classList.remove('expanded');
      expandButton.innerHTML = 'Expand';
      expandButton.title = 'Expand';
      
      // Remove collapsing class after instant collapse
      setTimeout(() => {
        tree.classList.remove('collapsing');
      }, 10);
    }
  };
  
  expandButton.addEventListener('click', toggleExpand);
  
  // Toggle functionality
  let isFlowchartVisible = false;
  
  const toggleFlowchart = () => {
    isFlowchartVisible = !isFlowchartVisible;
    
    if (isFlowchartVisible) {
      tree.classList.add('visible');
      toggleButton.innerHTML = '✕';
      toggleButton.title = 'Close Flowchart';
      // Update connectors after animation completes
      setTimeout(() => {
        updateConnectors();
      }, 400);
    } else {
      tree.classList.remove('visible');
      toggleButton.innerHTML = '☰';
      toggleButton.title = 'Show Flowchart';
    }
  };
  
  toggleButton.addEventListener('click', toggleFlowchart);
  
  updateConnectors();
})();