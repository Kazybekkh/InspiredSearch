const existingBox = document.getElementById('arxiv-draggable-box');

if (!existingBox) {
  const box = document.createElement('div');
  box.id = 'arxiv-draggable-box';
  box.textContent = 'Drag me';
  document.body.appendChild(box);

  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  const onMouseDown = (event) => {
    isDragging = true;
    offsetX = event.clientX - box.offsetLeft;
    offsetY = event.clientY - box.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (event) => {
    if (!isDragging) return;

    box.style.left = `${event.clientX - offsetX}px`;
    box.style.top = `${event.clientY - offsetY}px`;
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  box.addEventListener('mousedown', onMouseDown);
}

