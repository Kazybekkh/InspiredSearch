# ArXiv Recursive Extension Debugging Guide

## New Features Added:

### 1. **Recursive Paper Navigation**

- **Feature**: Papers maintain a navigation stack for back/forward movement
- **Implementation**: `paperStack` array tracks navigation history

### 2. **Paper Selection System**

- **Feature**: Click any generated paper to make it the main focus
- **Visual**: Hover effects show clickable papers with green highlights

### 3. **Dynamic Paper Generation**

- **Feature**: Each paper generates its own related papers
- **Smart**: Papers remember their generated children for performance

### 4. **Back Navigation**

- **Feature**: "← Go Back" button appears when you've navigated into papers
- **Smooth**: Animated transitions when navigating between papers

### 5. **Enhanced Animations**

- **Feature**: Smooth scaling and fading during paper transitions
- **Visual**: Green hover effects and selection feedback

## How the Recursive System Works:

### Navigation Flow:

1. **Start**: Main paper (SAGE) with "Find New Papers" button
2. **Generate**: Click "Find New Papers" → generates 2 related papers
3. **Select**: Click any related paper → it becomes the main paper
4. **Navigate**: Use "← Go Back" to return to previous paper
5. **Repeat**: Each paper can generate its own related papers

### Paper Stack System:

```
Current Paper: "Paper C"
Stack: ["SAGE", "Paper A"]  ← Can go back through these
```

## Console Messages You Should See:

```
ArXiv Extension: Script loaded on [URL]
ArXiv Extension: Creating tree
ArXiv Extension: Setup complete
ArXiv Extension: Selecting paper: [Paper Name]
ArXiv Extension: Going back to previous paper
ArXiv Extension: Toggling flowchart, now visible: true
```

## Visual Elements:

### 1. **Main Paper Box** (white border)

- Shows current paper title and limitations
- Has "Find New Papers" button on the right
- Has "← Go Back" button on the left (when applicable)

### 2. **Child Paper Boxes** (white border, hoverable)

- Generated papers with green hover effects
- Clickable to navigate to that paper
- Slide in with smooth animations

### 3. **Navigation Buttons**

- **"Find New Papers"** (white): Generates/shows related papers
- **"← Go Back"** (green): Returns to previous paper in stack
- **Toggle Button** (red): Shows/hides entire flowchart

## Common Issues & Solutions:

### Papers Not Clickable

- Check console for "ArXiv Extension: Selecting paper" messages
- Ensure hover effects show green highlighting
- Verify click handlers are attached

### Back Button Not Appearing

- Navigate into a paper first (click a generated paper)
- Check if `paperStack.length > 0` in console
- Verify button visibility logic

### Animations Not Smooth

- Check CSS transitions are applied
- Verify `.transitioning` class is added/removed properly
- Look for timing issues in setTimeout callbacks

### Papers Not Generating

- Check console for generation messages
- Verify "Find New Papers" button functionality
- Look for JavaScript errors during generation

## Test Sequence:

1. ✅ Load page → see toggle button
2. ✅ Click toggle → see main paper
3. ✅ Click "Find New Papers" → see "Generating..." then 2 papers
4. ✅ Hover papers → see green highlight
5. ✅ Click a paper → it becomes main paper, see back button
6. ✅ Click "Find New Papers" again → generates papers for current paper
7. ✅ Click "← Go Back" → returns to previous paper
8. ✅ Navigate through multiple levels → test deep navigation

## Files Modified for Recursive Functionality:

1. `content.js` - Added paper stack, navigation, selection system
2. `styles.css` - Added hover effects, back button, transition animations
3. `test.html` - Updated test instructions
4. `DEBUG_GUIDE.md` - Updated debugging information
