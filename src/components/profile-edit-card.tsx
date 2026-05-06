"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  updateAvatarUrl,
  updateDisplayName,
} from "@/lib/profile/actions";
import { uploadAvatar } from "@/lib/profile/upload";

interface ProfileEditCardProps {
  email: string;
  userId: string;
  initialDisplayName: string | null;
  initialAvatarUrl: string | null;
  initials: string;
}

export function ProfileEditCard({
  email,
  userId,
  initialDisplayName,
  initialAvatarUrl,
  initials,
}: ProfileEditCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const savedName = initialDisplayName?.trim() ?? "";
  const canSave = name.trim().length > 0 && name.trim() !== savedName;

  function handleSaveName() {
    if (!canSave) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (!res.ok) {
        setError(res.error);
      } else {
        setName(""); // input clears so the new name shows as the placeholder
        setInfo("Name saved.");
        router.refresh();
      }
    });
  }

  function handleRemoveName() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateDisplayName("");
      if (!res.ok) {
        setError(res.error);
      } else {
        setName("");
        setInfo("Name removed.");
        router.refresh();
      }
    });
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still triggers
    if (!file) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        const url = await uploadAvatar(file, userId);
        const res = await updateAvatarUrl(url);
        if (!res.ok) {
          setError(res.error);
        } else {
          setAvatarUrl(url);
          setInfo("Avatar updated.");
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  function handleRemoveAvatar() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateAvatarUrl(null);
      if (!res.ok) {
        setError(res.error);
      } else {
        setAvatarUrl(null);
        setInfo("Avatar removed.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center gap-4">
          {/* Avatar with overlay camera button */}
          <button
            type="button"
            onClick={pickFile}
            disabled={pending}
            className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-2xl font-bold text-primary ring-2 ring-primary/40 disabled:opacity-50"
            aria-label="Change avatar"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            <p className="truncate text-sm font-medium">{email}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={pickFile}
                disabled={pending}
                className="rounded-full border border-input bg-secondary px-3 py-1 text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
              >
                {avatarUrl ? "Change photo" : "Add photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-full border border-destructive/50 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="display-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Display name
            </label>
            {savedName && (
              <button
                type="button"
                onClick={handleRemoveName}
                disabled={pending}
                className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-destructive disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="display-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={savedName || "What should we call you?"}
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-foreground/70"
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={pending || !canSave}
              className="rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "…" : "Save"}
            </button>
          </div>
          {savedName && (
            <p className="text-[10px] text-muted-foreground">
              Type a new name above to update.
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {info && !error && (
          <p className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            {info}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
