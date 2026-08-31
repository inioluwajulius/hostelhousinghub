import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { photoUploadAPI } from "@/lib/api";

interface PhotoUploaderProps {
  propertyId: string;
  roomId?: string;
  existingPhotos?: string[];
  onUploadComplete: (urls: string[]) => void;
  uploadType?: "property" | "profile" | "matric"; // Type of upload
}

const PhotoUploader = ({ 
  propertyId, 
  roomId, 
  existingPhotos = [], 
  onUploadComplete,
  uploadType = "property"
}: PhotoUploaderProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      try {
        let uploadedUrl: string;

        if (uploadType === "property") {
          uploadedUrl = await photoUploadAPI.uploadPropertyPhoto(propertyId, file);
        } else if (uploadType === "profile") {
          uploadedUrl = await photoUploadAPI.uploadProfilePhoto(user.id, file);
        } else if (uploadType === "matric") {
          uploadedUrl = await photoUploadAPI.uploadMatricPhoto(user.id, file);
        } else {
          throw new Error("Invalid upload type");
        }

        uploadedUrls.push(uploadedUrl);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    const newPhotos = [...photos, ...uploadedUrls];
    setPhotos(newPhotos);
    onUploadComplete(newPhotos);
    setUploading(false);

    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully`);
    }
  };

  const removePhoto = async (index: number) => {
    const photoUrl = photos[index];
    const newPhotos = photos.filter((_, i) => i !== index);
    
    // Try to delete from storage
    try {
      const pathMatch = photoUrl.match(/\/([^?]+)/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        
        if (uploadType === "property") {
          await photoUploadAPI.deletePropertyPhoto(filePath);
        } else if (uploadType === "profile") {
          await photoUploadAPI.deleteProfilePhoto(filePath);
        } else if (uploadType === "matric") {
          await photoUploadAPI.deleteMatricPhoto(filePath);
        }
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      // Continue anyway - just remove from UI
    }
    
    setPhotos(newPhotos);
    onUploadComplete(newPhotos);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Photos</p>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {photos.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload photos</p>
          <p className="text-xs text-muted-foreground mt-1">Max 5MB per file · JPG, PNG, WebP</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
