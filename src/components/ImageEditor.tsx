import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Crop, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataURL: string) => Promise<void>;
  imageDataURL: string | null;
}

export default function ImageEditor({ isOpen, onClose, onSave, imageDataURL }: ImageEditorProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Load the image when the editor is opened
  useEffect(() => {
    if (isOpen && imageDataURL) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        renderImage();
      };
      img.onerror = () => {
        toast.error("Failed to load image. Please try again.");
        onClose();
      };
      img.src = imageDataURL;
    }
  }, [isOpen, imageDataURL, onClose]);

  // Render the image when scale or position changes
  useEffect(() => {
    if (isOpen) {
      renderImage();
    }
  }, [scale, position, isOpen]);

  const renderImage = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions to maintain aspect ratio
    const img = imageRef.current;
    const aspectRatio = img.width / img.height;
    
    let width, height;
    if (aspectRatio > 1) {
      // Landscape
      width = canvas.width;
      height = width / aspectRatio;
    } else {
      // Portrait
      height = canvas.height;
      width = height * aspectRatio;
    }
    
    // Apply scale
    width *= scale;
    height *= scale;
    
    // Calculate position to center the image
    const x = (canvas.width - width) / 2 + position.x;
    const y = (canvas.height - height) / 2 + position.y;
    
    // Draw the image
    ctx.drawImage(img, x, y, width, height);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current) {
      toast.error('Failed to process image');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Get the cropped image as a data URL
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.7);
      
      // Call the onSave callback with the data URL
      await onSave(dataURL);
      
      // Close the editor
      onClose();
    } catch (error) {
      console.error('Error saving cropped image:', error);
      toast.error('Failed to save photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div 
            ref={containerRef}
            className="relative w-full h-[300px] border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={300}
              className="absolute"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Slider 
              value={[scale * 100]} 
              min={50} 
              max={200} 
              step={10}
              onValueChange={(value) => setScale(value[0] / 100)}
              className="flex-1"
            />
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={scale >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Drag the image to position it. Use the slider to zoom in or out.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Crop className="mr-2 h-4 w-4" />
                Save & Crop
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 