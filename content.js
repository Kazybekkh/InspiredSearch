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
  tree.style.width = '320px';
  tree.style.height = '220px';

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const connectors = document.createElementNS(svgNamespace, 'svg');
  connectors.classList.add('tree-connectors');
  connectors.setAttribute('viewBox', '0 0 320 220');
  connectors.setAttribute('width', '320');
  connectors.setAttribute('height', '220');
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

  const leftLine = document.createElementNS(svgNamespace, 'line');
  leftLine.setAttribute('stroke', '#007bff');
  leftLine.setAttribute('stroke-width', '2');
  leftLine.setAttribute('marker-end', 'url(#arxiv-tree-arrowhead)');

  const rightLine = document.createElementNS(svgNamespace, 'line');
  rightLine.setAttribute('stroke', '#007bff');
  rightLine.setAttribute('stroke-width', '2');
  rightLine.setAttribute('marker-end', 'url(#arxiv-tree-arrowhead)');

  connectors.append(leftLine, rightLine);

  const rootBox = document.createElement('div');
  rootBox.className = 'tree-box tree-root drag-handle';
  rootBox.textContent = 'Main Box';

  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'tree-children';

  const leftChild = document.createElement('div');
  leftChild.className = 'tree-box tree-child';
  leftChild.textContent = 'Child Box A';

  const rightChild = document.createElement('div');
  rightChild.className = 'tree-box tree-child';
  rightChild.textContent = 'Child Box B';

  childrenContainer.append(leftChild, rightChild);

  tree.append(connectors, rootBox, childrenContainer);
  document.body.appendChild(tree);

  const updateConnectors = () => {
    const containerRect = tree.getBoundingClientRect();
    const rootRect = rootBox.getBoundingClientRect();
    const leftRect = leftChild.getBoundingClientRect();
    const rightRect = rightChild.getBoundingClientRect();

    const rootCenterX = rootRect.left + rootRect.width / 2 - containerRect.left;
    const rootBottomY = rootRect.bottom - containerRect.top;

    leftLine.setAttribute('x1', String(rootCenterX));
    leftLine.setAttribute('y1', String(rootBottomY));
    leftLine.setAttribute('x2', String(leftRect.left + leftRect.width / 2 - containerRect.left));
    leftLine.setAttribute('y2', String(leftRect.top - containerRect.top));

    rightLine.setAttribute('x1', String(rootCenterX));
    rightLine.setAttribute('y1', String(rootBottomY));
    rightLine.setAttribute('x2', String(rightRect.left + rightRect.width / 2 - containerRect.left));
    rightLine.setAttribute('y2', String(rightRect.top - containerRect.top));
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