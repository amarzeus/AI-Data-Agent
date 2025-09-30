import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface AvatarCropModalProps {
  open: boolean;
  onClose: () => void;
  onCrop: (croppedImageBlob: Blob) => void;
  imageFile: File | null;
}

const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  open,
  onClose,
  onCrop,
  imageFile
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions to fit image in canvas while maintaining aspect ratio
    const canvasSize = 300;
    const scaleX = canvasSize / image.naturalWidth;
    const scaleY = canvasSize / image.naturalHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = image.naturalWidth * scale;
    const scaledHeight = image.naturalHeight * scale;

    const offsetX = (canvasSize - scaledWidth) / 2;
    const offsetY = (canvasSize - scaledHeight) / 2;

    // Save context for transformations
    ctx.save();

    // Apply transformations
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-canvasSize / 2, -canvasSize / 2);

    // Draw image
    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    // Draw crop area
    ctx.restore();
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw crop area corners
    ctx.fillStyle = '#2196f3';
    const cornerSize = 8;
    // Top-left
    ctx.fillRect(cropArea.x - cornerSize / 2, cropArea.y - cornerSize / 2, cornerSize, cornerSize);
    // Top-right
    ctx.fillRect(cropArea.x + cropArea.width - cornerSize / 2, cropArea.y - cornerSize / 2, cornerSize, cornerSize);
    // Bottom-left
    ctx.fillRect(cropArea.x - cornerSize / 2, cropArea.y + cropArea.height - cornerSize / 2, cornerSize, cornerSize);
    // Bottom-right
    ctx.fillRect(cropArea.x + cropArea.width - cornerSize / 2, cropArea.y + cropArea.height - cornerSize / 2, cornerSize, cornerSize);
  }, [imageLoaded, rotation, cropArea]);

  React.useEffect(() => {
    drawImage();
  }, [drawImage]);

  React.useEffect(() => {
    if (imageFile && open) {
      const image = new Image();
      image.onload = () => {
        setImageLoaded(true);
        // Set initial crop area to center of image
        const canvasSize = 300;
        const cropSize = Math.min(200, canvasSize);
        setCropArea({
          x: (canvasSize - cropSize) / 2,
          y: (canvasSize - cropSize) / 2,
          width: cropSize,
          height: cropSize
        });
      };
      image.src = URL.createObjectURL(imageFile);
      imageRef.current = image;
    }
  }, [imageFile, open]);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    cropCanvas.width = cropArea.width;
    cropCanvas.height = cropArea.height;

    // Draw the cropped portion
    cropCtx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    cropCanvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
        toast.success('Image cropped successfully!');
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { height: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Crop Profile Picture</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Drag the crop area or use the controls below to adjust your profile picture.
          </Alert>

          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                maxWidth: '100%',
                cursor: 'move'
              }}
            />

            {/* Crop area overlay would go here for dragging */}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Zoom: {Math.round(scale * 100)}%
            </Typography>
            <Slider
              value={scale}
              onChange={(_, value) => setScale(value as number)}
              min={0.5}
              max={3}
              step={0.1}
              marks
              sx={{ maxWidth: 200, mx: 'auto' }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={handleRotate} size="small">
            <RotateRightIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCrop}
          startIcon={<CropIcon />}
          disabled={!imageLoaded}
        >
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarCropModal;
