import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Image from "next/image";
import { GripIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "sonner";
// Add drag-and-drop support
import { useState } from "react";
import { Card } from "../ui/card";

// New schema type for each image
export type ImageFieldItem = {
  status: "old" | "new" | "deleted" | "updated";
  file: string | File; // string for existing (Supabase URL), File for new/updated
};

/**
 * FormMultiImageUpload - Multi-image upload for React Hook Form with status tracking ("old", "new", "updated", "deleted").
 *
 * - Supports both existing images (from DB) and new uploads.
 * - Tracks image status for backend sync: "old" (existing), "new" (newly added), "updated" (replaced, includes oldUrl), "deleted" (marked for removal).
 * - Allows drag-and-drop reordering, image preview, and removal.
 * - Uses only shadcn/ui components and is accessible/mobile-friendly.
 *
 * @template T - Form field values type (from React Hook Form)
 * @param {Object} props - Component props
 * @param {Control<T>} props.control - React Hook Form control object
 * @param {FieldPath<T>} props.name - Field name in the form (should match schema)
 * @param {string} [props.label] - Display label for the upload section (default: "사진 첨부 (선택)")
 * @param {number} [props.maxImages=5] - Maximum number of images allowed
 * @param {string} [props.formItemClassName] - Optional CSS class for the form item wrapper
 * @param {string} [props.formLabelClassName] - Optional CSS class for the form label
 * @param {boolean} [props.disabled] - Disable all controls
 *
 * @returns {React.ReactElement} A form item with multi-image upload UI, image preview, drag-and-drop, and status tracking.
 *
 * @example
 * // 1. Add to your Zod schema:
 * const formSchema = z.object({
 *   pictures: z.array(
 *     z.object({
 *       status: z.enum(["old", "new", "deleted", "updated"]),
 *       file: z.union([z.string().url(), z.instanceof(File)]),
 *       oldUrl: z.string().url().optional(),
 *     })
 *   )
 * });
 *
 * // 2. Set up default values:
 * const form = useForm({
 *   defaultValues: {
 *     pictures: [
 *       { status: "old", file: "https://..." },
 *       { status: "new", file: new File([""], "filename.jpg") },
 *     ],
 *   },
 * });
 *
 * // 3. Use in your form:
 * <FormMultiImageUpload
 *   control={form.control}
 *   name="pictures"
 *   label="사진 첨부"
 *   maxImages={5}
 * />
 *
 * // 4. On submit, values.pictures will be an array of { status, file, oldUrl? } objects for backend processing.
 *
 * // 5. Backend handling example:
 * //    Use the following logic to process images before saving to your DB:
 * async function handleImagesForSave(images) {
 *   const resultUrls = [];
 *   for (const img of images) {
 *     if (img.status === "deleted") {
 *       // Remove from storage if needed
 *       if (typeof img.file === "string") {
 *         await deleteFileFromSupabase(img.file, { bucket: "YOUR_BUCKET" });
 *       }
 *       continue;
 *     }
 *     if (img.status === "old" && typeof img.file === "string") {
 *       resultUrls.push(img.file);
 *       continue;
 *     }
 *     if (img.status === "new" && img.file instanceof File) {
 *       const publicUrl = await uploadFileToSupabase(img.file, { bucket: "YOUR_BUCKET" });
 *       resultUrls.push(publicUrl);
 *       continue;
 *     }
 *     if (img.status === "updated" && img.file instanceof File && img.oldUrl) {
 *       await deleteFileFromSupabase(img.oldUrl, { bucket: "YOUR_BUCKET" });
 *       const publicUrl = await uploadFileToSupabase(img.file, { bucket: "YOUR_BUCKET" });
 *       resultUrls.push(publicUrl);
 *       continue;
 *     }
 *   }
 *   return resultUrls; // Save this array to your DB
 * }
 *
 * // See also: updateClinicWithImages, addClinicWithImages in your codebase for full integration.
 */

type FormImageUploadProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>; // e.g. "images"
  label?: string;
  maxImages?: number;
  formItemClassName?: string;
  formLabelClassName?: string;
  disabled?: boolean;
};

export default function FormMultiImageUpload<T extends FieldValues>({
  control,
  name,
  label = "사진 첨부 (선택)", // Photo attachment (optional)
  maxImages = 5,
  formItemClassName,
  formLabelClassName,
  disabled = false,
}: FormImageUploadProps<T>): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);
  const updateIndexRef = useRef<number | null>(null);
  // For drag-and-drop reordering
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Always expect field.value to be an array of ImageFieldItem
        const images: ImageFieldItem[] = field.value || [];
        // Only show images not deleted
        const visibleImages = images.filter((img) => img.status !== "deleted");
        // Helper to update the images array
        const setValue = (newImages: ImageFieldItem[]) => {
          field.onChange(newImages);
        };
        // Add new images
        const handleAddImages = (files: FileList | null) => {
          if (!files) return;
          const allowed = maxImages - visibleImages.length;
          if (files.length > allowed) {
            toast.error(`최대 ${maxImages}장까지 업로드할 수 있습니다.`); // You can upload up to {maxImages} images.
          }
          const fileArr = Array.from(files).slice(0, allowed);
          const newImages: ImageFieldItem[] = fileArr.map((file) => ({
            status: "new",
            file,
          }));
          setValue([...images, ...newImages]);
        };
        // Mark image as deleted
        const handleRemoveImage = (idx: number) => {
          const updated = images.map((img, i) =>
            i === idx ? { ...img, status: "deleted" as const } : img
          );
          setValue(updated);
        };
        // Extend ImageFieldItem type locally to allow oldUrl for updated images
        interface ImageFieldItemWithOldUrl extends ImageFieldItem {
          oldUrl?: string;
        }
        // Update image (replace file, set status)
        const handleUpdateImage = (idx: number, file: File) => {
          const updated = images.map((img, i): ImageFieldItemWithOldUrl => {
            if (i !== idx) return img;
            if (img.status === "old") {
              // Attach oldUrl for backend update logic
              return {
                status: "updated",
                file,
                oldUrl: typeof img.file === "string" ? img.file : undefined,
              };
            } else {
              return { status: "new", file };
            }
          });
          setValue(updated);
        };
        // When user clicks image, open update file input
        const onImageClick = (idx: number) => {
          updateIndexRef.current = idx;
          updateInputRef.current?.click();
        };
        // Handle drag start
        const handleDragStart = (idx: number) => {
          setDraggedIdx(idx);
        };
        // Handle drag over
        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
        };
        // Handle drop
        const handleDrop = (idx: number) => {
          if (draggedIdx === null || draggedIdx === idx) return;
          const reordered = [...images];
          const [removed] = reordered.splice(draggedIdx, 1);
          reordered.splice(idx, 0, removed);
          setValue(reordered);
          setDraggedIdx(null);
        };
        return (
          <FormItem className={formItemClassName}>
            <FormLabel
              className={cn(
                "text-[16px] font-pretendard-600",
                formLabelClassName
              )}
            >
              {label}
            </FormLabel>
            <FormControl>
              <div className="flex gap-2 flex-wrap mt-2">
                {visibleImages.map((img, idx) => (
                  <Card
                    key={idx}
                    className="relative w-20 h-20 rounded-lg overflow-hidden group cursor-pointer p-0"
                    draggable={!disabled}
                    onDragStart={
                      disabled
                        ? undefined
                        : () =>
                            handleDragStart(images.findIndex((i) => i === img))
                    }
                    onDragOver={disabled ? undefined : handleDragOver}
                    onDrop={
                      disabled
                        ? undefined
                        : () => handleDrop(images.findIndex((i) => i === img))
                    }
                    style={{ opacity: draggedIdx === idx ? 0.5 : 1 }}
                  >
                    {typeof img.file === "string" ? (
                      <Image
                        src={img.file}
                        alt={`quotation-img-${idx}`}
                        fill
                        onClick={
                          disabled
                            ? undefined
                            : () =>
                                onImageClick(images.findIndex((i) => i === img))
                        }
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={URL.createObjectURL(img.file)}
                        alt={`quotation-img-${idx}`}
                        fill
                        unoptimized
                        onClick={
                          disabled
                            ? undefined
                            : () =>
                                onImageClick(images.findIndex((i) => i === img))
                        }
                        className="object-cover"
                      />
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-0 w-6 h-6 min-w-0 min-h-0"
                      style={{ lineHeight: 1 }}
                      onClick={
                        disabled
                          ? undefined
                          : () =>
                              handleRemoveImage(
                                images.findIndex((i) => i === img)
                              )
                      }
                      disabled={disabled}
                    >
                      <X size={13} />
                    </Button>
                    {/* Drag handle visual indicator */}
                    <div className="absolute top-1 left-1 flex justify-center pointer-events-none z-10">
                      <GripIcon className="text-xs bg-white/80 rounded px-1 py-0.5 w-4 h-4" />
                    </div>
                  </Card>
                ))}
                {visibleImages.length < maxImages && !disabled && (
                  <div className="w-20 h-20 flex items-center justify-center border rounded-lg bg-gray-100 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-full flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-xs mt-1">사진 추가</span>{" "}
                      {/* Add photo */}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      max={maxImages}
                      onChange={(e) => {
                        handleAddImages(e.target.files);
                        e.target.value = "";
                      }}
                      disabled={disabled}
                    />
                  </div>
                )}
                {/* Hidden input for updating image */}
                <Input
                  ref={updateInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const idx = updateIndexRef.current;
                    if (e.target.files && e.target.files[0] && idx !== null) {
                      handleUpdateImage(idx, e.target.files[0]);
                    }
                    updateIndexRef.current = null;
                    e.target.value = "";
                  }}
                  disabled={disabled}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
