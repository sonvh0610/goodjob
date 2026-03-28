import { useEffect, useMemo } from 'react';

interface MediaPickerProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  multiple?: boolean;
  helperText?: string;
  className?: string;
  inputClassName?: string;
  onValidationError?: (message: string | null) => void;
}

export function MediaPicker({
  files,
  onFilesChange,
  accept = 'image/*,video/*',
  maxFiles = 5,
  multiple = true,
  helperText,
  className,
  inputClassName,
  onValidationError,
}: MediaPickerProps) {
  const imagePreviews = useMemo(
    () =>
      files
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({ key: `${file.name}-${file.size}`, file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  return (
    <div className={className}>
      <input
        className={inputClassName}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []);
          if (selected.length > maxFiles) {
            onValidationError?.(`Maximum ${maxFiles} media files`);
            onFilesChange([]);
            return;
          }
          onValidationError?.(null);
          onFilesChange(selected);
        }}
      />
      {helperText ? (
        <span className="mt-1 block text-xs text-on-surface-variant">{helperText}</span>
      ) : null}

      {files.length > 0 ? (
        <div className="mt-3 space-y-2">
          {imagePreviews.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {imagePreviews.map((preview) => (
                <img
                  key={preview.key}
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-24 w-full rounded-lg object-cover border border-surface-container"
                />
              ))}
            </div>
          ) : null}
          <ul className="space-y-1">
            {files
              .filter((file) => !file.type.startsWith('image/'))
              .map((file) => (
                <li key={`${file.name}-${file.size}`} className="text-xs text-on-surface-variant">
                  {file.type.startsWith('video/')
                    ? `Video selected: ${file.name} (preview unavailable)`
                    : file.name}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
