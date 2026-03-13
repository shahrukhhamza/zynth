import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/** Return a centered 1:1 crop covering at least `pct`% of the shorter axis */
function defaultCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

/** Draw the cropped region onto a canvas and return a high-quality base64 JPEG.
 *  crop must be in PIXEL units (not %). */
function exportCanvas(image, crop) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Ratio: natural image pixels → rendered (layout) pixels
  const scaleX = image.naturalWidth  / image.width;
  const scaleY = image.naturalHeight / image.height;

  const OUTPUT_SIZE = 400;
  canvas.width  = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width  * scaleX,
    crop.height * scaleY,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
  );

  return canvas.toDataURL('image/jpeg', 0.95);
}

export default function ImageCropModal({ imageSrc, onConfirm, onCancel }) {
  const theme = useTheme();
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const pct = defaultCrop(width, height);
    setCrop(pct);
    // Pre-set completedCrop in pixels so confirming without moving the box still works
    setCompletedCrop({
      unit: 'px',
      x:      (pct.x      / 100) * width,
      y:      (pct.y      / 100) * height,
      width:  (pct.width  / 100) * width,
      height: (pct.height / 100) * height,
    });
  }, []);

  function handleConfirm() {
    if (!imgRef.current || !completedCrop?.width) return;
    const base64 = exportCanvas(imgRef.current, completedCrop);
    onConfirm(base64);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          maxWidth: 520,
          maxHeight: '90vh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div>
            <h3 className="text-sm font-bold" style={{ color: theme.text }}>Crop Profile Photo</h3>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>Drag to reposition · resize handles to zoom</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: theme.muted }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div
          className="flex items-center justify-center overflow-auto p-4 flex-1"
          style={{ backgroundColor: theme.isDark ? theme.bg : '#e2e8f0', minHeight: 0 }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
            minWidth={30}
            keepSelection
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{
                maxHeight: '55vh',
                maxWidth: '100%',
                display: 'block',
              }}
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-t flex-shrink-0"
          style={{ borderColor: theme.border }}
        >
          <p className="text-xs flex-1" style={{ color: theme.muted }}>Drag handles to resize · drag inside to reposition</p>

          {/* Cancel / Confirm */}
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: theme.border, color: theme.muted }}
            onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.accent }}
          >
            <Check className="w-3.5 h-3.5" />
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}
