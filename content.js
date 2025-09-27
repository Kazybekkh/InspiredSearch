(function() {
  console.log('ArXiv Extension: Script loaded on', window.location.href);
  console.log('ArXiv Extension: Document ready state:', document.readyState);
  
  // Wait for DOM to be fully loaded
  function initExtension() {
    const existingTree = document.getElementById('arxiv-box-tree');

    if (existingTree) {
      console.log('ArXiv Extension: Tree already exists, exiting');
      return;
    }
    
    console.log('ArXiv Extension: Creating tree');
    
    // Check if body exists
    if (!document.body) {
      console.error('ArXiv Extension: document.body is null, retrying in 100ms');
      setTimeout(initExtension, 100);
      return;
    }

  const tree = document.createElement('div');
  tree.id = 'arxiv-box-tree';
  tree.style.top = '20px';
  tree.style.left = '20px';
  tree.style.position = 'fixed';
  tree.style.width = '1800px';
  tree.style.height = '600px'; /* Increased from 400px to accommodate larger spacing */

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const connectors = document.createElementNS(svgNamespace, 'svg');
  connectors.classList.add('tree-connectors');
  connectors.setAttribute('viewBox', '0 0 1800 600');
  connectors.setAttribute('width', '1800');
  connectors.setAttribute('height', '600');
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
  
  // Create expand button
  const expandButton = document.createElement('div');
  expandButton.className = 'expand-button';
  expandButton.innerHTML = 'Find New Papers';
  expandButton.title = 'Find New Papers';
  
  // Create back button (initially hidden)
  const backButton = document.createElement('div');
  backButton.className = 'back-button';
  backButton.innerHTML = '← Go Back';
  backButton.title = 'Go Back to Previous Paper';
  backButton.style.display = 'none';

  rootBox.appendChild(expandButton);
  rootBox.appendChild(backButton);

  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'tree-children';

  // Function to render current paper content
  const renderCurrentPaper = () => {
    const existingContent = rootBox.querySelector('.paper-content');
    if (existingContent) {
      existingContent.remove();
    }
    
    const paperContent = document.createElement('div');
    paperContent.className = 'paper-content';
    paperContent.innerHTML = `
      <div class="box-title clickable-title" data-paper-url="${getPaperUrl(currentPaper.title)}">${currentPaper.title}</div>
      <ul class="limitation-list">
        ${currentPaper.limitations.map(limitation => `<li>${limitation}</li>`).join('')}
      </ul>
    `;
    
    // Add click handler for the title
    const titleElement = paperContent.querySelector('.clickable-title');
    titleElement.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = titleElement.getAttribute('data-paper-url');
      if (url) {
        window.open(url, '_blank');
      }
    });
    
    rootBox.insertBefore(paperContent, rootBox.firstChild);
    
    // Update back button visibility
    backButton.style.display = paperStack.length > 0 ? 'block' : 'none';
    
    // Update expand button text
    expandButton.innerHTML = isExpanded ? 'Collapse' : 'Find New Papers';
  };

  // Function to generate child papers
  const generateChildPapers = () => {
    if (!currentPaper.children || currentPaper.children.length === 0) {
      // Generate level 1 papers based on the current paper
      if (currentPaper.title.includes("Attention Is All You Need")) {
        currentPaper.children = [
          {
            title: "BERT: Pre-training of Deep Bidirectional Transformers",
            limitations: ["Requires massive computational resources for pre-training", "Limited real-time inference capabilities", "Struggles with very long sequences"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/1810.04805"
          },
          {
            title: "Vision Transformer: An Image is Worth 16x16 Words",
            limitations: ["Requires large datasets for effective training", "Limited performance on small images", "High computational cost during training"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/2010.11929"
          }
        ];
      } else if (currentPaper.title.includes("BERT")) {
        currentPaper.children = [
          {
            title: "RoBERTa: A Robustly Optimized BERT Pretraining Approach",
            limitations: ["Even more computationally expensive than BERT", "Limited improvements on some downstream tasks", "Requires careful hyperparameter tuning"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/1907.11692"
          },
          {
            title: "ALBERT: A Lite BERT for Self-supervised Learning",
            limitations: ["Parameter sharing reduces model expressiveness", "Still requires large training datasets", "Performance varies significantly across tasks"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/1909.11942"
          }
        ];
      } else if (currentPaper.title.includes("Vision Transformer")) {
        currentPaper.children = [
          {
            title: "DeiT: Training data-efficient image transformers",
            limitations: ["Still requires more data than CNNs for small datasets", "Distillation process adds training complexity", "Limited robustness to domain shift"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/2012.12877"
          },
          {
            title: "Swin Transformer: Hierarchical Vision Transformer using Shifted Windows",
            limitations: ["Complex architecture with many hyperparameters", "Memory requirements scale poorly with image resolution", "Limited interpretability of hierarchical features"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/2103.14030"
          }
        ];
      } else if (currentPaper.title.includes("GPT")) {
        currentPaper.children = [
          {
            title: "GPT-2: Language Models are Unsupervised Multitask Learners",
            limitations: ["Generates biased and potentially harmful content", "Limited factual accuracy and reasoning", "High computational cost for inference"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf"
          },
          {
            title: "Switch Transformer: Scaling to Trillion Parameter Models",
            limitations: ["Extreme computational requirements", "Load balancing issues in mixture of experts", "Limited accessibility due to scale"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/2101.03961"
          }
        ];
      } else {
        // Default fallback papers
        currentPaper.children = [
          {
            title: "GPT: Improving Language Understanding by Generative Pre-Training",
            limitations: ["Limited to unidirectional context", "Requires task-specific fine-tuning", "Struggles with factual consistency"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf"
          },
          {
            title: "Switch Transformer: Scaling to Trillion Parameter Models",
            limitations: ["Extreme computational requirements", "Load balancing issues in mixture of experts", "Limited accessibility due to scale"],
            children: [],
            level: currentPaper.level + 1,
            url: "https://arxiv.org/abs/2101.03961"
          }
        ];
      }
    }
    
    // Clear existing children
    childrenContainer.innerHTML = '';
    
    currentPaper.children.forEach((paper, index) => {
      const childBox = document.createElement('div');
      childBox.className = 'tree-box tree-child selectable-paper draggable-child';
      childBox.innerHTML = `
        <div class="box-title clickable-title" data-paper-url="${getPaperUrl(paper.title)}">${paper.title}</div>
        <ul class="limitation-list">
          ${paper.limitations.map(limitation => `<li>${limitation}</li>`).join('')}
        </ul>
      `;
      
      // Add click handler for the title
      const titleElement = childBox.querySelector('.clickable-title');
      titleElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = titleElement.getAttribute('data-paper-url');
        if (url) {
          window.open(url, '_blank');
        }
      });
      
      // Add drag handle for child boxes
      const dragHandle = document.createElement('div');
      dragHandle.className = 'child-drag-handle';
      dragHandle.innerHTML = '⋮⋮';
      dragHandle.title = 'Drag horizontally';
      childBox.appendChild(dragHandle);
      
      // Add expand button if this paper can have children (level < 2)
      if (paper.level < 2) {
        const childExpandButton = document.createElement('div');
        childExpandButton.className = 'child-expand-button';
        childExpandButton.innerHTML = 'Find More';
        childExpandButton.title = 'Find More Papers';
        
        childExpandButton.addEventListener('click', (e) => {
          e.stopPropagation();
          generateGrandchildren(paper, childBox);
        });
        
        childBox.appendChild(childExpandButton);
      }
      
      // Add click handler for paper selection (collapses everything)
      childBox.addEventListener('click', (e) => {
        if (!e.target.closest('.child-expand-button') && !e.target.closest('.child-drag-handle') && !e.target.closest('.clickable-title')) {
          selectPaper(paper);
        }
      });
      
      // Add horizontal drag functionality
      addHorizontalDrag(childBox, dragHandle);
      
      childrenContainer.appendChild(childBox);
    });
  };

  // Function to generate grandchildren (level 2 papers)
  const generateGrandchildren = (parentPaper, parentElement) => {
    if (!parentPaper.children || parentPaper.children.length === 0) {
      // Generate level 2 papers based on parent paper
      if (parentPaper.title.includes("BERT")) {
        parentPaper.children = [
          {
            title: "RoBERTa: A Robustly Optimized BERT Pretraining Approach",
            limitations: ["Even more computationally expensive than BERT", "Limited improvements on some downstream tasks", "Requires careful hyperparameter tuning"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/1907.11692"
          },
          {
            title: "ALBERT: A Lite BERT for Self-supervised Learning",
            limitations: ["Parameter sharing reduces model expressiveness", "Still requires large training datasets", "Performance varies significantly across tasks"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/1909.11942"
          }
        ];
      } else if (parentPaper.title.includes("Vision Transformer")) {
        parentPaper.children = [
          {
            title: "DeiT: Training data-efficient image transformers",
            limitations: ["Still requires more data than CNNs for small datasets", "Distillation process adds training complexity", "Limited robustness to domain shift"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2012.12877"
          },
          {
            title: "Swin Transformer: Hierarchical Vision Transformer using Shifted Windows",
            limitations: ["Complex architecture with many hyperparameters", "Memory requirements scale poorly with image resolution", "Limited interpretability of hierarchical features"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2103.14030"
          }
        ];
      } else if (parentPaper.title.includes("RoBERTa")) {
        parentPaper.children = [
          {
            title: "GPT-3: Language Models are Few-Shot Learners",
            limitations: ["Extremely large model size limits accessibility", "Inconsistent performance across different prompts", "Potential for generating harmful or biased content"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2005.14165"
          },
          {
            title: "PaLM: Scaling Language Modeling with Pathways",
            limitations: ["Massive computational requirements", "Limited availability for research", "Environmental concerns due to training costs"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2204.02311"
          }
        ];
      } else if (parentPaper.title.includes("DeiT")) {
        parentPaper.children = [
          {
            title: "GLaM: Efficient Scaling of Language Models with Mixture-of-Experts",
            limitations: ["Complex routing mechanisms", "Load balancing challenges", "Limited interpretability of expert specialization"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2112.06905"
          },
          {
            title: "GPT-3: Language Models are Few-Shot Learners",
            limitations: ["Extremely large model size limits accessibility", "Inconsistent performance across different prompts", "Potential for generating harmful or biased content"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2005.14165"
          }
        ];
      } else {
        // Default fallback
        parentPaper.children = [
          {
            title: "GPT-3: Language Models are Few-Shot Learners",
            limitations: ["Extremely large model size limits accessibility", "Inconsistent performance across different prompts", "Potential for generating harmful or biased content"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2005.14165"
          },
          {
            title: "PaLM: Scaling Language Modeling with Pathways",
            limitations: ["Massive computational requirements", "Limited availability for research", "Environmental concerns due to training costs"],
            children: [],
            level: parentPaper.level + 1,
            url: "https://arxiv.org/abs/2204.02311"
          }
        ];
      }
    }
    
    // Check if grandchildren already exist
    let grandchildrenContainer = parentElement.querySelector('.grandchildren-container');
    if (!grandchildrenContainer) {
      grandchildrenContainer = document.createElement('div');
      grandchildrenContainer.className = 'grandchildren-container';
      parentElement.appendChild(grandchildrenContainer);
    }
    
    // Toggle grandchildren visibility
    const isVisible = grandchildrenContainer.classList.contains('visible');
    if (isVisible) {
      grandchildrenContainer.classList.remove('visible');
      parentElement.querySelector('.child-expand-button').innerHTML = 'Find More';
      return;
    }
    
    // Clear and regenerate grandchildren
    grandchildrenContainer.innerHTML = '';
    
    parentPaper.children.forEach((grandchild) => {
      const grandchildBox = document.createElement('div');
      grandchildBox.className = 'tree-box grandchild-box selectable-paper draggable-grandchild';
      grandchildBox.innerHTML = `
        <div class="box-title clickable-title" data-paper-url="${getPaperUrl(grandchild.title)}">${grandchild.title}</div>
        <ul class="limitation-list">
          ${grandchild.limitations.map(limitation => `<li>${limitation}</li>`).join('')}
        </ul>
      `;
      
      // Add click handler for the title
      const titleElement = grandchildBox.querySelector('.clickable-title');
      titleElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = titleElement.getAttribute('data-paper-url');
        if (url) {
          window.open(url, '_blank');
        }
      });
      
      // Add drag handle for grandchild boxes
      const dragHandle = document.createElement('div');
      dragHandle.className = 'grandchild-drag-handle';
      dragHandle.innerHTML = '⋮⋮';
      dragHandle.title = 'Drag horizontally';
      grandchildBox.appendChild(dragHandle);
      
      // Add click handler for grandchild selection (collapses everything)
      grandchildBox.addEventListener('click', (e) => {
        if (!e.target.closest('.grandchild-drag-handle') && !e.target.closest('.clickable-title')) {
          selectPaper(grandchild);
        }
      });
      
      // Add horizontal drag functionality
      addHorizontalDrag(grandchildBox, dragHandle);
      
      grandchildrenContainer.appendChild(grandchildBox);
    });
    
    // Show grandchildren with animation
    grandchildrenContainer.classList.add('visible');
    parentElement.querySelector('.child-expand-button').innerHTML = 'Collapse';
    
    // Update connectors after adding grandchildren
    setTimeout(() => {
      updateConnectors();
    }, 300);
  };

  // Function to select a paper and navigate to it (collapses everything)
  const selectPaper = (paper) => {
    console.log('ArXiv Extension: Selecting paper:', paper.title, 'Level:', paper.level);
    
    // Add current paper to stack
    paperStack.push(currentPaper);
    
    // Set new current paper and reset its level to 0 (becomes new root)
    currentPaper = {
      ...paper,
      level: 0,
      children: [] // Reset children so they can be regenerated from this new context
    };
    
    // Collapse everything with animation
    tree.classList.add('transitioning');
    tree.classList.remove('expanded');
    isExpanded = false;
    
    // Collapse all expanded grandchildren
    const allGrandchildren = childrenContainer.querySelectorAll('.grandchildren-container');
    allGrandchildren.forEach(gc => gc.classList.remove('visible'));
    
    setTimeout(() => {
      renderCurrentPaper();
      tree.classList.remove('transitioning');
      
      // Reset generation state for new paper
      hasGeneratedOnce = false;
      
      // Clear the children container
      childrenContainer.innerHTML = '';
    }, 300);
  };

  // Function to go back to previous paper
  const goBackToPreviousPaper = () => {
    if (paperStack.length === 0) return;
    
    console.log('ArXiv Extension: Going back to previous paper');
    
    // Get previous paper from stack
    currentPaper = paperStack.pop();
    
    // Collapse current view with animation
    tree.classList.add('transitioning');
    tree.classList.remove('expanded');
    isExpanded = false;
    
    setTimeout(() => {
      renderCurrentPaper();
      tree.classList.remove('transitioning');
      
      // If this paper was previously expanded, restore that state
      if (currentPaper.children && currentPaper.children.length > 0) {
        hasGeneratedOnce = true;
      }
    }, 300);
  };

  tree.append(connectors, rootBox, childrenContainer);
  
  // Create toggle button
  const toggleButton = document.createElement('div');
  toggleButton.id = 'arxiv-flowchart-toggle';
  toggleButton.innerHTML = '☰';
  toggleButton.title = 'Toggle Flowchart';
  
  // Initially hide the tree and show the button
  tree.style.display = 'flex';
  
  console.log('ArXiv Extension: Adding tree and toggle button to page');
  document.body.appendChild(tree);
  document.body.appendChild(toggleButton);
  
  console.log('ArXiv Extension: Setup complete');

  const updateConnectors = () => {
    // Only update if the tree is visible and expanded
    if (!tree.classList.contains('visible') || !tree.classList.contains('expanded')) {
      return;
    }

    const children = childrenContainer.querySelectorAll('.tree-child');
    if (children.length === 0) return;

    // Use relative positioning within the tree container
    const rootRect = rootBox.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();

    // Starting point from right edge of root box (relative to tree container)
    const startX = rootRect.right - treeRect.left;
    const startY = rootRect.top + rootRect.height / 2 - treeRect.top;

    // Midpoint for the vertical line - shifted more to the right
    const midX = startX + 50;

    // Clear existing paths - we'll need more paths for grandchildren
    topPath.setAttribute('d', '');
    bottomPath.setAttribute('d', '');
    
    // Create additional paths if they don't exist for grandchildren connections
    let grandchildPaths = connectors.querySelectorAll('.grandchild-path');
    if (grandchildPaths.length < 4) {
      // Remove existing grandchild paths
      grandchildPaths.forEach(path => path.remove());
      
      // Create 4 new paths for potential grandchildren connections
      for (let i = 0; i < 4; i++) {
        const path = document.createElementNS(svgNamespace, 'path');
        path.setAttribute('class', 'grandchild-path');
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        connectors.appendChild(path);
      }
      grandchildPaths = connectors.querySelectorAll('.grandchild-path');
    }

    let pathIndex = 0;

    // Create paths for each child and their grandchildren
    children.forEach((child, childIndex) => {
      const childRect = child.getBoundingClientRect();
      const childX = childRect.left - treeRect.left;
      const childY = childRect.top + childRect.height / 2 - treeRect.top;

      // Create path to child
      const childPathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${childY} L ${childX} ${childY}`;
      
      if (childIndex === 0) {
        topPath.setAttribute('d', childPathData);
      } else if (childIndex === 1) {
        bottomPath.setAttribute('d', childPathData);
      }

      // Handle grandchildren connections
      const grandchildrenContainer = child.querySelector('.grandchildren-container');
      if (grandchildrenContainer && grandchildrenContainer.classList.contains('visible')) {
        const grandchildren = grandchildrenContainer.querySelectorAll('.grandchild-box');
        
        // Starting point for grandchildren is the right edge of the child box
        const childStartX = childRect.right - treeRect.left;
        const childStartY = childRect.top + childRect.height / 2 - treeRect.top;
        const childMidX = childStartX + 40; // Reduced connection distance
        
        grandchildren.forEach((grandchild) => {
          if (pathIndex < grandchildPaths.length) {
            const grandchildRect = grandchild.getBoundingClientRect();
            const grandchildX = grandchildRect.left - treeRect.left;
            const grandchildY = grandchildRect.top + grandchildRect.height / 2 - treeRect.top;
            
            const grandchildPathData = `M ${childStartX} ${childStartY} L ${childMidX} ${childStartY} L ${childMidX} ${grandchildY} L ${grandchildX} ${grandchildY}`;
            
            grandchildPaths[pathIndex].setAttribute('d', grandchildPathData);
            pathIndex++;
          }
        });
      }
    });

    // Clear unused grandchild paths
    for (let i = pathIndex; i < grandchildPaths.length; i++) {
      grandchildPaths[i].setAttribute('d', '');
    }
  };

  requestAnimationFrame(updateConnectors);
  window.addEventListener('resize', updateConnectors);

  // Horizontal drag functionality for sub-boxes
  const addHorizontalDrag = (element, dragHandle) => {
    let isDraggingChild = false;
    let startX = 0;
    let initialTransform = 0;

    const onChildMouseMove = (event) => {
      if (!isDraggingChild) return;
      
      const deltaX = event.clientX - startX;
      const newTransform = initialTransform + deltaX;
      
      // Limit horizontal movement (optional)
      const maxMove = 300; // Increased from 100px to 300px for larger container
      const clampedTransform = Math.max(-maxMove, Math.min(maxMove, newTransform));
      
      element.style.transform = `translateX(${clampedTransform}px)`;
      
      // Update connectors during drag
      updateConnectors();
    };

    const onChildMouseUp = () => {
      if (!isDraggingChild) return;
      
      isDraggingChild = false;
      document.removeEventListener('mousemove', onChildMouseMove);
      document.removeEventListener('mouseup', onChildMouseUp);
      dragHandle.style.cursor = 'grab';
      
      // Final connector update
      updateConnectors();
    };

    const onChildMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      isDraggingChild = true;
      startX = event.clientX;
      
      // Get current transform value
      const computedStyle = window.getComputedStyle(element);
      const transform = computedStyle.transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        initialTransform = matrix.m41; // translateX value
      } else {
        initialTransform = 0;
      }
      
      dragHandle.style.cursor = 'grabbing';
      document.addEventListener('mousemove', onChildMouseMove);
      document.addEventListener('mouseup', onChildMouseUp);
    };

    dragHandle.addEventListener('mousedown', onChildMouseDown);
    dragHandle.style.cursor = 'grab';
  };

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
  
  // Paper navigation system
  let paperStack = [];
  let currentPaper = {
    title: "Attention Is All You Need",
    limitations: ["Limited to sequence-to-sequence tasks", "Requires large amounts of training data", "Computational complexity grows quadratically with sequence length"],
    children: [],
    level: 0,
    url: "https://arxiv.org/abs/1706.03762"
  };
  
  const MAX_LEVELS = 3; // Root (0) -> Level 1 -> Level 2 -> Level 3 (max)

  // Function to get paper URL based on title
  const getPaperUrl = (paperTitle) => {
    const paperUrls = {
      // Root paper
      "Attention Is All You Need": "https://arxiv.org/abs/1706.03762",
      
      // Level 1 papers
      "BERT: Pre-training of Deep Bidirectional Transformers": "https://arxiv.org/abs/1810.04805",
      "GPT: Improving Language Understanding by Generative Pre-Training": "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
      "Vision Transformer: An Image is Worth 16x16 Words": "https://arxiv.org/abs/2010.11929",
      "Switch Transformer: Scaling to Trillion Parameter Models": "https://arxiv.org/abs/2101.03961",
      
      // Level 2 papers
      "RoBERTa: A Robustly Optimized BERT Pretraining Approach": "https://arxiv.org/abs/1907.11692",
      "ALBERT: A Lite BERT for Self-supervised Learning": "https://arxiv.org/abs/1909.11942",
      "GPT-2: Language Models are Unsupervised Multitask Learners": "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
      "GPT-3: Language Models are Few-Shot Learners": "https://arxiv.org/abs/2005.14165",
      "DeiT: Training data-efficient image transformers": "https://arxiv.org/abs/2012.12877",
      "Swin Transformer: Hierarchical Vision Transformer using Shifted Windows": "https://arxiv.org/abs/2103.14030",
      "GLaM: Efficient Scaling of Language Models with Mixture-of-Experts": "https://arxiv.org/abs/2112.06905",
      "PaLM: Scaling Language Modeling with Pathways": "https://arxiv.org/abs/2204.02311"
    };
    
    return paperUrls[paperTitle] || `https://arxiv.org/search/?query=${encodeURIComponent(paperTitle)}&searchtype=all`;
  };
  
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
          generateChildPapers();
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
        // Subsequent times - immediate expand with existing papers
        generateChildPapers();
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
      expandButton.innerHTML = 'Find New Papers';
      expandButton.title = 'Find New Papers';
      
      // Remove collapsing class after instant collapse
      setTimeout(() => {
        tree.classList.remove('collapsing');
      }, 10);
    }
  };
  
  expandButton.addEventListener('click', toggleExpand);
  backButton.addEventListener('click', goBackToPreviousPaper);
  
  // Initialize the current paper display
  renderCurrentPaper();
  
  // Toggle functionality
  let isFlowchartVisible = true; // Start visible for debugging
  
  const toggleFlowchart = () => {
    isFlowchartVisible = !isFlowchartVisible;
    console.log('ArXiv Extension: Toggling flowchart, now visible:', isFlowchartVisible);
    
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
  
  // Make initially visible for debugging
  setTimeout(() => {
    tree.classList.add('visible');
    toggleButton.innerHTML = '✕';
    toggleButton.title = 'Close Flowchart';
  }, 100);
  
  updateConnectors();
  } // End of initExtension function
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
  } else {
    initExtension();
  }
})();