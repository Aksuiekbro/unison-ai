"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateJobSeekerProfile } from "@/app/actions/profile";

type ResumeUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (payload: { file: File; parsedData?: any; fieldsUpdated?: string[] | null }) => void;
};

type UploadStatus = "idle" | "uploading" | "parsed" | "error";

const ACCEPTED = [".pdf", ".doc", ".docx"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export default function ResumeUploadDialog({ open, onOpenChange, onAdded }: ResumeUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [fieldsUpdated, setFieldsUpdated] = useState<string[] | null>(null);
  const [isSaving, startTransition] = useTransition();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset dialog state when closed
      if (xhrRef.current && status === "uploading") {
        xhrRef.current.abort();
      }
      setFile(null);
      setProgress(0);
      setStatus("idle");
      setError(null);
      setParsedData(null);
      setFieldsUpdated(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptAttr = useMemo(() => ACCEPTED.join(","), []);

  const formatFileName = (name: string, maxLength: number = 20) => {
    if (!name) return "";
    if (name.length <= maxLength) return name;
    return `${name.slice(0, Math.max(0, maxLength - 3))}...`;
  };

  const validateFile = (f: File) => {
    const lower = f.name.toLowerCase();
    const isAccepted = ACCEPTED.some((ext) => lower.endsWith(ext));
    if (!isAccepted) {
      toast.error("Поддерживаются только PDF или DOC/DOCX");
      return false;
    }
    if (f.size > MAX_SIZE_BYTES) {
      toast.error("Размер файла должен быть меньше 10MB");
      return false;
    }
    return true;
  };

  const startUpload = (f: File) => {
    if (!validateFile(f)) return;
    setFile(f);
    setProgress(0);
    setStatus("uploading");
    setError(null);
    setParsedData(null);
    setFieldsUpdated(null);

    const formData = new FormData();
    formData.append("resume", f);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/resume/parse", true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setProgress(pct);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        try {
          const contentType = xhr.getResponseHeader("content-type") || "";
          if (!contentType.includes("application/json")) {
            throw new Error("Неверный формат ответа сервера");
          }
          const res = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && res?.success) {
            setProgress(100);
            setStatus("parsed");
            setParsedData(res.data);
            setFieldsUpdated(res.fieldsUpdated || null);
            toast.success("Резюме успешно обработано AI");
          } else {
            const msg = res?.error || `Ошибка загрузки: ${xhr.status}`;
            setError(msg);
            setStatus("error");
            toast.error(msg);
          }
        } catch (e: any) {
          const msg = e?.message || "Ошибка обработки ответа сервера";
          setError(msg);
          setStatus("error");
          toast.error(msg);
        }
      }
    };

    xhr.onerror = () => {
      setError("Сетевая ошибка при загрузке файла");
      setStatus("error");
      toast.error("Сетевая ошибка при загрузке файла");
    };

    xhr.onabort = () => {
      setError("Загрузка отменена");
      setStatus("error");
      toast.error("Загрузка отменена");
    };

    xhr.send(formData);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) startUpload(f);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) startUpload(f);
  };

  const addToProfile = () => {
    if (!file || status !== "parsed") return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("resume", file);
        const result: any = await updateJobSeekerProfile(fd);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Резюме добавлено в профиль");
        onAdded?.({ file, parsedData, fieldsUpdated });
        onOpenChange(false);
      } catch (e: any) {
        toast.error(e?.message || "Не удалось добавить в профиль");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a resume</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            For best results, upload a PDF or DOCX up to 10MB.
          </p>
        </DialogHeader>

        <div
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base font-medium text-gray-700 mb-2">
            Drag and drop resume to upload
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Your resume will remain private until you publish your profile.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Select files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleSelect}
          />
        </div>

        {file && (
          <div className="mt-4 p-3 rounded-lg border bg-white">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#00C49A]" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{formatFileName(file.name)}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round((file.size / 1024 / 1024) * 10) / 10} MB
                  </p>
                </div>
                <div className="mt-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500" aria-live="polite">
                    <span>{status === "parsed" ? "AI parsing complete" : error ? error : "Uploading..."}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
              {status === "parsed" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : status === "error" ? (
                <X className="w-5 h-5 text-red-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-[#00C49A]" />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#00C49A] hover:bg-[#00A085]"
            disabled={!file || status !== "parsed" || isSaving}
            onClick={addToProfile}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to profile"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


