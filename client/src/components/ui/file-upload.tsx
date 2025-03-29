import { useRef, useState } from "react";
import { FileIcon, UploadCloudIcon, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileUploadProps = {
  label: string;
  type: "image" | "pdf" | "video" | "document";
  accept: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onClear: () => void;
  required?: boolean;
  placeholder?: string;
};

export function FileUpload({
  label,
  type,
  accept,
  value,
  onChange,
  onClear,
  required = false,
  placeholder = "Drag & drop file or click to browse",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.match(accept.replace(/\*/g, '.*').replace(/,/g, '|'))) {
      alert(`Invalid file type. Please upload a ${type} file.`);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Please upload a file smaller than 50MB.");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange(base64);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Error reading file");
      setIsUploading(false);
      setFileName(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    onClear();
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const renderPreview = () => {
    if (!value) return null;

    if (type === "image") {
      return (
        <div className="relative mt-2 mb-2">
          <img 
            src={value} 
            alt={label} 
            className="max-h-48 max-w-full rounded-md object-contain" 
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (type === "video") {
      return (
        <div className="relative mt-2 mb-2">
          <video 
            src={value} 
            controls 
            className="max-h-48 max-w-full rounded-md" 
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-2 mb-2">
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <FileIcon className="h-4 w-4" />
          <span className="text-sm truncate max-w-[200px]">{fileName || "File uploaded"}</span>
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="h-6 w-6"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-2 w-full">
      {renderPreview()}
      
      <div
        className={`border-2 border-dashed rounded-md p-6 transition-colors cursor-pointer 
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"}
          ${value ? "border-success bg-success/5" : ""}
          ${isUploading ? "pointer-events-none" : "hover:border-primary hover:bg-primary/5"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <UploadCloudIcon className="h-10 w-10 text-muted-foreground" />
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isUploading ? "Uploading..." : placeholder}
            </p>
            <p className="text-xs text-muted-foreground">
              {isUploading 
                ? fileName 
                : `${accept.split(',').join(', ')} ${required ? "(Required)" : "(Optional)"}`
              }
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}