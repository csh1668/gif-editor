import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { File as FileIcon, CheckCircle2, Upload } from "lucide-react";

interface FileUploadZoneProps {
  accept?: string;
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  title?: string;
  description?: string;
  supportedFormats?: string;
}

export default function FileUploadZone({
  accept = "*/*",
  onFileSelect,
  selectedFile,
  title = "파일 선택",
  description = "드래그하여 업로드 또는 클릭하여 선택",
  supportedFormats,
}: FileUploadZoneProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const descriptionId = `${inputId}-description`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) onFileSelect(file);
    setIsDragging(false);
  };

  const handleClick = () => {
    const element = document.getElementById(inputId) as HTMLInputElement | null;
    element?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{title}</Label>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby={descriptionId}
        aria-busy={isDragging}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-10 text-sm cursor-pointer",
          "text-muted-foreground transition-all hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging && "border-primary/60 bg-primary/5 text-foreground"
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "mb-3 rounded-full border bg-background p-3 shadow-sm transition-transform",
            "group-hover:scale-105",
            isDragging && "border-primary/60 bg-primary/10"
          )}>
            {selectedFile ? (
              <CheckCircle2 className={cn("h-8 w-8", isDragging ? "text-primary" : "text-foreground/80")} />
            ) : (
              <Upload className={cn("h-8 w-8", isDragging ? "text-primary" : "text-foreground/70")} />
            )}
          </div>

          <div id={descriptionId} className="font-medium text-foreground">
            {description}
          </div>

          {supportedFormats && (
            <div className="mt-2 text-xs inline-flex items-center gap-1 text-muted-foreground">
              <span className="rounded-full border px-2 py-1 bg-background/60">{supportedFormats}</span>
            </div>
          )}

          {selectedFile && (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs text-foreground">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate" title={selectedFile.name}>{selectedFile.name}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
