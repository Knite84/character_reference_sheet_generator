/**
 * RefSheet Studio - Template Definitions
 * 
 * Defines target export resolutions, aspect ratios, and well slot configurations.
 * Gutter is fixed at #dedede and 8px equivalent.
 */

const TEMPLATES = {
  minimal: {
    id: 'minimal',
    name: 'Minimal Character Reference Sheet',
    aspectRatio: '3/2',
    aspectW: 3,
    aspectH: 2,
    exportWidth: 3000,
    exportHeight: 2000,
    slots: [
      {
        id: 'face-front',
        label: '1:1 Face Front',
        aspect: '1:1',
        gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
        // Normalized export coordinates (0 to 1 relative to grid units)
        // Grid is 3 units wide, 2 units high
        unitBounds: { x: 0, y: 0, w: 1, h: 1 }
      },
      {
        id: 'face-side',
        label: '1:1 Face 3/4 Side',
        aspect: '1:1',
        gridArea: { col: 1, row: 2, colSpan: 1, rowSpan: 1 },
        unitBounds: { x: 0, y: 1, w: 1, h: 1 }
      },
      {
        id: 'stand-front',
        label: '1:2 Standing Front',
        aspect: '1:2',
        gridArea: { col: 2, row: 1, colSpan: 1, rowSpan: 2 },
        unitBounds: { x: 1, y: 0, w: 1, h: 2 }
      },
      {
        id: 'stand-back',
        label: '1:2 Standing Back',
        aspect: '1:2',
        gridArea: { col: 3, row: 1, colSpan: 1, rowSpan: 2 },
        unitBounds: { x: 2, y: 0, w: 1, h: 2 }
      }
    ]
  },

  detailed: {
    id: 'detailed',
    name: 'Detailed Character Reference Sheet',
    aspectRatio: '2/1',
    aspectW: 4,
    aspectH: 2,
    exportWidth: 4000,
    exportHeight: 2000,
    slots: [
      {
        id: 'face-front',
        label: '1:1 Face Front',
        aspect: '1:1',
        gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
        unitBounds: { x: 0, y: 0, w: 1, h: 1 }
      },
      {
        id: 'face-side',
        label: '1:1 Face 3/4 Side',
        aspect: '1:1',
        gridArea: { col: 2, row: 1, colSpan: 1, rowSpan: 1 },
        unitBounds: { x: 1, y: 0, w: 1, h: 1 }
      },
      {
        id: 'face-smile',
        label: '1:1 Face Smiling',
        aspect: '1:1',
        gridArea: { col: 1, row: 2, colSpan: 1, rowSpan: 1 },
        unitBounds: { x: 0, y: 1, w: 1, h: 1 }
      },
      {
        id: 'face-emotion',
        label: '1:1 Face Emotion',
        aspect: '1:1',
        gridArea: { col: 2, row: 2, colSpan: 1, rowSpan: 1 },
        unitBounds: { x: 1, y: 1, w: 1, h: 1 }
      },
      {
        id: 'stand-front',
        label: '1:2 Standing Front',
        aspect: '1:2',
        gridArea: { col: 3, row: 1, colSpan: 1, rowSpan: 2 },
        unitBounds: { x: 2, y: 0, w: 1, h: 2 }
      },
      {
        id: 'stand-back',
        label: '1:2 Standing Back',
        aspect: '1:2',
        gridArea: { col: 4, row: 1, colSpan: 1, rowSpan: 2 },
        unitBounds: { x: 3, y: 0, w: 1, h: 2 }
      }
    ]
  },

  col1: {
    id: 'col1',
    name: '1-Column Reference Sheet',
    aspectRatio: '1/2',
    aspectW: 1,
    aspectH: 2,
    exportWidth: 2000,
    exportHeight: 4000,
    slots: [
      { id: 'col1-top', label: '1:1 Top', aspect: '1:1', gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'col1-bottom', label: '1:1 Bottom', aspect: '1:1', gridArea: { col: 1, row: 2, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 1, w: 1, h: 1 } }
    ]
  },

  col2: {
    id: 'col2',
    name: '2-Column Reference Sheet',
    aspectRatio: '1/1',
    aspectW: 2,
    aspectH: 2,
    exportWidth: 3000,
    exportHeight: 3000,
    slots: [
      { id: 'col-1', label: '1:2 Column 1', aspect: '1:2', gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 0, w: 1, h: 2 } },
      { id: 'col-2', label: '1:2 Column 2', aspect: '1:2', gridArea: { col: 2, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 0, w: 1, h: 2 } }
    ]
  },

  col3: {
    id: 'col3',
    name: '3-Column Reference Sheet',
    aspectRatio: '3/2',
    aspectW: 3,
    aspectH: 2,
    exportWidth: 3000,
    exportHeight: 2000,
    slots: [
      { id: 'col-1', label: '1:2 Column 1', aspect: '1:2', gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 0, w: 1, h: 2 } },
      { id: 'col-2', label: '1:2 Column 2', aspect: '1:2', gridArea: { col: 2, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 0, w: 1, h: 2 } },
      { id: 'col-3', label: '1:2 Column 3', aspect: '1:2', gridArea: { col: 3, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 2, y: 0, w: 1, h: 2 } }
    ]
  },

  grid4: {
    id: 'grid4',
    name: '4-Grid Reference Sheet',
    aspectRatio: '1/1',
    aspectW: 2,
    aspectH: 2,
    exportWidth: 3000,
    exportHeight: 3000,
    slots: [
      { id: 'slot-1', label: '1:1 Square 1', aspect: '1:1', gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'slot-2', label: '1:1 Square 2', aspect: '1:1', gridArea: { col: 2, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 0, w: 1, h: 1 } },
      { id: 'slot-3', label: '1:1 Square 3', aspect: '1:1', gridArea: { col: 1, row: 2, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 1, w: 1, h: 1 } },
      { id: 'slot-4', label: '1:1 Square 4', aspect: '1:1', gridArea: { col: 2, row: 2, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 1, w: 1, h: 1 } }
    ]
  },

  grid9: {
    id: 'grid9',
    name: '9-Grid Reference Sheet',
    aspectRatio: '1/1',
    aspectW: 3,
    aspectH: 3,
    exportWidth: 3500,
    exportHeight: 3500,
    slots: [
      { id: 'slot-1', label: '1:1 Slot 1', aspect: '1:1', gridArea: { col: 1, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'slot-2', label: '1:1 Slot 2', aspect: '1:1', gridArea: { col: 2, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 0, w: 1, h: 1 } },
      { id: 'slot-3', label: '1:1 Slot 3', aspect: '1:1', gridArea: { col: 3, row: 1, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 2, y: 0, w: 1, h: 1 } },
      { id: 'slot-4', label: '1:1 Slot 4', aspect: '1:1', gridArea: { col: 1, row: 2, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 1, w: 1, h: 1 } },
      { id: 'slot-5', label: '1:1 Slot 5', aspect: '1:1', gridArea: { col: 2, row: 2, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 1, w: 1, h: 1 } },
      { id: 'slot-6', label: '1:1 Slot 6', aspect: '1:1', gridArea: { col: 3, row: 2, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 2, y: 1, w: 1, h: 1 } },
      { id: 'slot-7', label: '1:1 Slot 7', aspect: '1:1', gridArea: { col: 1, row: 3, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 0, y: 2, w: 1, h: 1 } },
      { id: 'slot-8', label: '1:1 Slot 8', aspect: '1:1', gridArea: { col: 2, row: 3, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 1, y: 2, w: 1, h: 1 } },
      { id: 'slot-9', label: '1:1 Slot 9', aspect: '1:1', gridArea: { col: 3, row: 3, colSpan: 1, rowSpan: 1 }, unitBounds: { x: 2, y: 2, w: 1, h: 1 } },
    ]
  }
};
