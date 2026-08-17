# RefSheet Studio 🎨

A fast, 100% client-side web application designed to generate high-resolution character image reference sheets directly in your browser. 

Built specifically for desktop workflows, video generation reference pipelines, and effortless GitHub Pages hosting with **zero backend**, **zero server dependencies**, and **zero logins required**.

---

## 🌟 Features

- **100% Local & Private**: All photos are processed in local browser memory via HTML5 Canvas. No images are ever uploaded to an external server.
- **Resolution-Independent Pipeline**: Upload source images of any resolution (even 15,000px+), and export at crisp, designated high resolutions.
- **3 Native Reference Sheet Templates**:
  - **Minimal Character Reference Sheet**: `3:2` Aspect Ratio &bull; Exports at `3,000 x 2,000 px`
    - `1:1 Face Front`
    - `1:1 Face 3/4 Side`
    - `1:2 Standing Front`
    - `1:2 Standing Back`
  - **Detailed Character Reference Sheet**: `2:1` Aspect Ratio &bull; Exports at `4,000 x 2,000 px`
    - `1:1 Face Front`
    - `1:1 Face 3/4 Side`
    - `1:1 Face Smiling`
    - `1:1 Face Emotion / Misc`
    - `1:2 Standing Front`
    - `1:2 Standing Back`
  - **9-Grid Reference Sheet**: `1:1` Aspect Ratio &bull; Exports at `3,500 x 3,500 px`
    - 9 equal `1:1` square content wells in a 3x3 uniform grid.
- **Fixed Layout & Gutters**: Fixed `#dedede` border and `8px` gutters around and between every well, scaled proportionally on high-res export.
- **Intuitive Manipulation**:
  - **Pan / Slide**: Click and drag inside any populated well to re-frame the shot.
  - **Zoom / Scaling**: Scroll with your mouse wheel or adjust the floating slider on hover.
  - **Move & Swap**: Drag the swap handle on any well to instantly swap or move photos between slots.
  - **Clear Well**: Hover and click the `×` button to remove a photo from a slot without losing it in your media library.
  - **Re-center**: Quick one-click reset for zoom and pan.
- **High-Res Export**:
  - Export lossless `.PNG` or high-quality `.JPG` with a single click.

---

## 🚀 Running Locally

Because RefSheet Studio is built with standard HTML5, CSS3, and modern JavaScript:

### Method 1: Direct File
Simply double-click `index.html` in your file explorer to open it in Chrome, Edge, Brave, Firefox, or Safari.

### Method 2: Local HTTP Server (Optional)
If you prefer running a local server:

```bash
# Using Python 3
python -m http.server 8080

# Using Node.js (npx serve or live-server)
npx serve .
```
Then navigate to `http://localhost:8080`.

---

## 🌐 Deploying to GitHub Pages

1. Commit and push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial RefSheet Studio release"
   git push origin main
   ```
2. Go to your GitHub repository settings:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select your branch (e.g. `main`) and folder (`/ (root)`).
   - Click **Save**.
3. Your app is live at `https://<your-username>.github.io/<repo-name>/`!

---

## 📂 Project Structure

```
character_reference_sheets_generator/
├── index.html          # Semantic single-page HTML layout
├── css/
│   ├── style.css       # Core typography, dark theme UI, sidebar, layout
│   └── collage.css     # Collage board grid templates, #dedede 8px gutters, well overlays
├── js/
│   ├── templates.js    # Dimensions, aspect ratios & slot coordinates (Minimal, Detailed, 9-Grid)
│   ├── mediaPool.js    # Local file loading, blob URLs, thumbnail drag-and-drop
│   ├── wellRenderer.js # Interactive well canvas, pan, zoom, swap, and clear mechanics
│   ├── exporter.js     # High-res offscreen canvas compositor and PNG/JPG download
│   └── app.js          # App lifecycle, layout auto-scaler, and UI event binding
└── README.md           # Documentation & instructions
```
"# character_reference_sheet_generator" 
