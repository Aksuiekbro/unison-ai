"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateJobSeekerProfile } from "@/app/actions/profile";
import { Checkbox } from "@/components/ui/checkbox";
import type { JobSeekerProfileData } from "@/lib/validations";

type ProfileSnapshot = Partial<JobSeekerProfileData> & {
  skills?: string[];
};

type ResumeUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile?: ProfileSnapshot;
  onAdded?: (payload: { file: File; parsedData?: any; fieldsUpdated?: string[] | null }) => void;
};

type UploadStatus = "idle" | "uploading" | "parsed" | "error";

type ProfileFieldKey =
  | "firstName"
  | "lastName"
  | "title"
  | "summary"
  | "phone"
  | "location"
  | "linkedinUrl"
  | "githubUrl"
  | "skills";

type ParsedProfileFields = Partial<Record<ProfileFieldKey, string | string[]>> & {
  skills?: string[];
};

type DiffItem = {
  key: ProfileFieldKey;
  label: string;
  oldValue?: string | string[];
  newValue?: string | string[];
};

const ACCEPTED = [".pdf", ".doc", ".docx"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const FIELD_LABELS: Record<ProfileFieldKey, string> = {
  firstName: "Имя",
  lastName: "Фамилия",
  title: "Желаемая должность",
  summary: "Профессиональное резюме",
  phone: "Телефон",
  location: "Локация",
  linkedinUrl: "LinkedIn",
  githubUrl: "GitHub",
  skills: "Навыки",
};

const cleanString = (value?: string | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSkills = (skills?: string[]): string[] => {
  return skills?.map((s) => s.trim()).filter(Boolean) ?? [];
};

const extractParsedFields = (parsedData: any): ParsedProfileFields => {
  if (!parsedData) return {};
  const fields: ParsedProfileFields = {};
  const fullName = cleanString(parsedData?.personal_info?.full_name);
  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      fields.firstName = parts[0];
      if (parts.length > 1) {
        fields.lastName = parts.slice(1).join(" ");
      }
    }
  }

  const summary = cleanString(parsedData?.professional_summary);
  if (summary) fields.summary = summary;

  const phone = cleanString(parsedData?.personal_info?.phone);
  if (phone) fields.phone = phone;

  const location = cleanString(parsedData?.personal_info?.location);
  if (location) fields.location = location;

  const linkedin = cleanString(parsedData?.personal_info?.linkedin_url);
  if (linkedin) {
    fields.linkedinUrl = linkedin.startsWith("http") ? linkedin : `https://${linkedin}`;
  }

  const github = cleanString(parsedData?.personal_info?.github_url);
  if (github) {
    fields.githubUrl = github.startsWith("http") ? github : `https://${github}`;
  }

  const experiences: any[] = parsedData?.experience || parsedData?.experiences || [];
  if (Array.isArray(experiences) && experiences.length > 0) {
    const primaryRole = cleanString(experiences[0]?.job_title || experiences[0]?.position);
    if (primaryRole) fields.title = primaryRole;
  }

  const skillNames = Array.isArray(parsedData?.skills)
    ? parsedData.skills.map((skill: any) => cleanString(skill?.name)).filter(Boolean)
    : [];
  if (skillNames.length > 0) {
    fields.skills = normalizeSkills(skillNames as string[]);
  }

  return fields;
};

const arraysDiffer = (a: string[], b: string[]) => {
  if (a.length !== b.length) return true;
  const normalizedA = [...a].map((s) => s.toLowerCase()).sort();
  const normalizedB = [...b].map((s) => s.toLowerCase()).sort();
  return normalizedA.some((value, index) => value !== normalizedB[index]);
};

const buildDiffItems = (
  parsedFields: ParsedProfileFields,
  currentProfile?: ProfileSnapshot
): DiffItem[] => {
  const items: DiffItem[] = [];
  Object.entries(FIELD_LABELS).forEach(([key, label]) => {
    const typedKey = key as ProfileFieldKey;
    const newValue = parsedFields[typedKey];
    if (newValue === undefined) return;

    if (typedKey === "skills") {
      const prevSkills = normalizeSkills(currentProfile?.skills);
      const nextSkills = normalizeSkills(newValue as string[]);
      if (nextSkills.length === 0) return;
      if (!arraysDiffer(prevSkills, nextSkills)) return;
      items.push({
        key: typedKey,
        label,
        oldValue: prevSkills,
        newValue: nextSkills,
      });
      return;
    }

    const previous = cleanString((currentProfile as any)?.[typedKey]);
    const proposed = cleanString(newValue as string | undefined);
    if (!proposed) return;
    if (previous === proposed) return;
    items.push({
      key: typedKey,
      label,
      oldValue: previous,
      newValue: proposed,
    });
  });
  return items;
};

const formatDiffValue = (key: ProfileFieldKey, value?: string | string[]) => {
  if (key === "skills") {
    const arr = normalizeSkills(Array.isArray(value) ? (value as string[]) : []);
    return arr.length > 0 ? arr.join(", ") : "—";
  }
  return cleanString(value as string | undefined) || "—";
};

export default function ResumeUploadDialog({ open, onOpenChange, onAdded, currentProfile }: ResumeUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [fieldsUpdated, setFieldsUpdated] = useState<string[] | null>(null);
  const [fieldSelections, setFieldSelections] = useState<Record<ProfileFieldKey, boolean>>({});
  const [isSaving, startTransition] = useTransition();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const safeProfile: ProfileSnapshot = currentProfile ? { ...currentProfile } : {};
  const parsedFields = useMemo(() => extractParsedFields(parsedData), [parsedData]);
  const diffItems = useMemo(() => buildDiffItems(parsedFields, safeProfile), [parsedFields, safeProfile]);
  const selectedCount = diffItems.filter((item) => fieldSelections[item.key] ?? true).length;
  const allSelected = diffItems.length > 0 && diffItems.every((item) => fieldSelections[item.key] ?? true);

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
      setFieldSelections({});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (diffItems.length === 0) {
      setFieldSelections({});
      return;
    }
    setFieldSelections((prev) => {
      const next: Record<ProfileFieldKey, boolean> = {} as Record<ProfileFieldKey, boolean>;
      diffItems.forEach((item) => {
        next[item.key] = prev[item.key] ?? true;
      });
      return next;
    });
  }, [diffItems]);

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

  const handleToggleField = (key: ProfileFieldKey, checked: boolean | "indeterminate") => {
    setFieldSelections((prev) => ({
      ...prev,
      [key]: checked === true,
    }));
  };

  const handleToggleAll = (checked: boolean | "indeterminate") => {
    const shouldSelect = checked === true;
    const next: Record<ProfileFieldKey, boolean> = {} as Record<ProfileFieldKey, boolean>;
    diffItems.forEach((item) => {
      next[item.key] = shouldSelect;
    });
    setFieldSelections(next);
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
        const selectedKeys = diffItems
          .filter((item) => fieldSelections[item.key])
          .map((item) => item.key);

        const finalProfile: ProfileSnapshot = {
          firstName: safeProfile.firstName || "",
          lastName: safeProfile.lastName || "",
          title: safeProfile.title || "",
          summary: safeProfile.summary || "",
          phone: safeProfile.phone || "",
          location: safeProfile.location || "",
          linkedinUrl: safeProfile.linkedinUrl || "",
          githubUrl: safeProfile.githubUrl || "",
          skills: normalizeSkills(safeProfile.skills),
        };

        selectedKeys.forEach((key) => {
          const parsedValue = parsedFields[key];
          if (parsedValue === undefined) return;
          if (key === "skills") {
            finalProfile.skills = normalizeSkills(parsedValue as string[]);
          } else {
            finalProfile[key] = parsedValue as string;
          }
        });

        const normalizeUrl = (value?: string | null) => {
          if (!value) return "";
          const trimmed = value.trim();
          if (!trimmed) return "";
          return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        };

        const fd = new FormData();
        fd.append("firstName", finalProfile.firstName ?? "");
        fd.append("lastName", finalProfile.lastName ?? "");
        fd.append("title", finalProfile.title ?? "");
        fd.append("summary", finalProfile.summary ?? "");
        fd.append("phone", finalProfile.phone ?? "");
        fd.append("location", finalProfile.location ?? "");
        fd.append("linkedinUrl", normalizeUrl(finalProfile.linkedinUrl));
        fd.append("githubUrl", normalizeUrl(finalProfile.githubUrl));
        fd.append("skills", JSON.stringify(finalProfile.skills ?? []));
        fd.append("resume", file);
        fd.append("resumeAutoApply", "false");

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

        {status === "parsed" && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-[#0A2540]">Подтвердите найденные Gemini изменения</h4>
            <p className="text-xs text-gray-500 mt-1">
              Отметьте поля, которые выглядят корректно. Только отмеченные значения будут отправлены в профиль.
            </p>
            {diffItems.length > 0 ? (
              <>
                <div className="mt-3 flex items-center justify-between rounded-md border bg-gray-50 p-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-fields"
                      checked={allSelected}
                      onCheckedChange={handleToggleAll}
                    />
                    <label htmlFor="select-all-fields" className="cursor-pointer select-none">
                      Выбрать все поля
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedCount} из {diffItems.length} выбрано
                  </span>
                </div>
                <div className="mt-3 space-y-3 max-h-72 overflow-auto pr-1">
                  {diffItems.map((item) => (
                    <div key={item.key} className="flex gap-3 rounded-md border p-3">
                      <Checkbox
                        id={`field-${item.key}`}
                        checked={fieldSelections[item.key] ?? true}
                        onCheckedChange={(checked) => handleToggleField(item.key, checked)}
                      />
                      <div className="flex-1 space-y-2 text-sm">
                        <p className="font-semibold text-[#0A2540]">{item.label}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase text-gray-500">Текущие данные</p>
                            <p className="text-sm text-gray-900 break-words">
                              {formatDiffValue(item.key, item.oldValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500">Новые данные Gemini</p>
                            <p className="text-sm text-[#0A2540] break-words">
                              {formatDiffValue(item.key, item.newValue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 rounded-md border border-dashed p-3 text-sm text-gray-600">
                AI не предложил изменений. Резюме всё равно будет прикреплено к вашему профилю.
              </p>
            )}
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
