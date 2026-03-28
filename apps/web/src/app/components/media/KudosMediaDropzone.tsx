import { useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type PreviewFile = {
  key: string;
  file: File;
  isImage: boolean;
  previewUrl?: string;
};

type KudosMediaDropzoneProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  onError?: (message: string | null) => void;
};

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function KudosMediaDropzone({
  files,
  onFilesChange,
  maxFiles = 5,
  onError,
}: KudosMediaDropzoneProps) {
  const [activeImage, setActiveImage] = useState<PreviewFile | null>(null);

  const previewFiles = useMemo<PreviewFile[]>(
    () =>
      files.map((file) => {
        const isImage = file.type.startsWith('image/');
        return {
          key: fileKey(file),
          file,
          isImage,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
        };
      }),
    [files]
  );

  useEffect(() => {
    return () => {
      previewFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [previewFiles]);

  const onDrop = (acceptedFiles: File[]) => {
    const deduped = Array.from(
      new Map([...files, ...acceptedFiles].map((file) => [fileKey(file), file])).values()
    );

    if (deduped.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} media files per kudo`);
      return;
    }

    onError?.(null);
    onFilesChange(deduped);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    maxFiles,
    noClick: true,
    accept: {
      'image/*': [],
      'video/*': [],
    },
  });

  const removeFile = (target: PreviewFile) => {
    onFilesChange(files.filter((file) => fileKey(file) !== target.key));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 transition ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-surface-container bg-white hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-semibold text-on-surface">
          Drag and drop images/videos here
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Up to {maxFiles} files. Image preview enabled. Video preview not shown.
        </p>
        <button
          type="button"
          onClick={open}
          className="mt-3 cursor-pointer rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
        >
          Browse Files
        </button>
      </div>

      {previewFiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {previewFiles.map((item) => (
            <div
              key={item.key}
              className="relative aspect-square overflow-hidden rounded-xl border border-surface-container bg-surface-container-low"
            >
              {item.isImage && item.previewUrl ? (
                <button
                  type="button"
                  onClick={() => setActiveImage(item)}
                  className="h-full w-full cursor-pointer"
                  title="Open full image"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                    Video
                  </p>
                  <p className="mt-1 line-clamp-3 text-[11px] text-on-surface-variant">
                    {item.file.name}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(item)}
                className="absolute right-1 top-1 h-6 w-6 cursor-pointer rounded-full bg-black/70 text-xs font-bold text-white"
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {activeImage?.previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute right-4 top-4 h-10 w-10 cursor-pointer rounded-full bg-black/60 text-xl text-white"
            onClick={() => setActiveImage(null)}
          >
            ×
          </button>
          <img
            src={activeImage.previewUrl}
            alt={activeImage.file.name}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
