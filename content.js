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
  document.body.appendChild(tree);

  const updateConnectors = () => {
    const containerRect = tree.getBoundingClientRect();
    const rootRect = rootBox.getBoundingClientRect();
    const topChildRect = leftChild.getBoundingClientRect();
    const bottomChildRect = rightChild.getBoundingClientRect();

    // Starting point from right edge of root box
    const startX = rootRect.right - containerRect.left;
    const startY = rootRect.top + rootRect.height / 2 - containerRect.top;

    // Connection points for child boxes (left edge, center)
    const topChildX = topChildRect.left - containerRect.left;
    const topChildY = topChildRect.top + topChildRect.height / 2 - containerRect.top;
    
    const bottomChildX = bottomChildRect.left - containerRect.left;
    const bottomChildY = bottomChildRect.top + bottomChildRect.height / 2 - containerRect.top;

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
  updateConnectors();
})();