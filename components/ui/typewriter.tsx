"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type TypewriterProps = {
  phrases: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
  loop?: boolean;
  className?: string;
  cursorClassName?: string;
};

export function Typewriter({
  phrases,
  typingSpeedMs = 40,
  deletingSpeedMs = 20,
  pauseMs = 1200,
  loop = true,
  className,
  cursorClassName,
}: TypewriterProps) {
  const safePhrases = useMemo(
    () => (Array.isArray(phrases) ? phrases.filter(Boolean) : []),
    [phrases]
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const longestPhrase = useMemo(
    () =>
      safePhrases.reduce((longest, current) =>
        current.length >= longest.length ? current : longest
      , ""),
    [safePhrases]
  );

  useEffect(() => {
    if (safePhrases.length === 0) return;

    const currentPhrase = safePhrases[phraseIndex % safePhrases.length];
    const isTypingPhaseComplete = displayText === currentPhrase && !isDeleting;
    const isDeletingPhaseComplete = displayText.length === 0 && isDeleting;

    let nextDelay = typingSpeedMs;

    if (isTypingPhaseComplete) {
      nextDelay = pauseMs;
      timeoutRef.current = window.setTimeout(() => {
        setIsDeleting(true);
      }, nextDelay);
      return () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      };
    }

    if (isDeleting && !isDeletingPhaseComplete) {
      nextDelay = deletingSpeedMs;
      timeoutRef.current = window.setTimeout(() => {
        setDisplayText((prev) => currentPhrase.slice(0, prev.length - 1));
      }, nextDelay);
      return () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      };
    }

    if (isDeletingPhaseComplete) {
      const hasNextPhrase = phraseIndex + 1 < safePhrases.length;
      const shouldContinue = loop || hasNextPhrase;
      if (!shouldContinue) {
        // End on last phrase fully deleted (render empty), but better to keep last full phrase instead:
        setIsDeleting(false);
        setDisplayText(currentPhrase);
        return;
      }
      setIsDeleting(false);
      setPhraseIndex((idx) => (idx + 1) % safePhrases.length);
      return;
    }

    if (!isDeleting) {
      timeoutRef.current = window.setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
      }, nextDelay);
      return () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      };
    }
  }, [
    safePhrases,
    phraseIndex,
    displayText,
    isDeleting,
    typingSpeedMs,
    deletingSpeedMs,
    pauseMs,
    loop,
  ]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (safePhrases.length === 0) return null;

  const currentFullPhrase = safePhrases[phraseIndex % safePhrases.length];

  return (
    <span className={clsx("relative inline-block align-baseline", className)} aria-live="polite" aria-label={currentFullPhrase}>
      <span className="invisible whitespace-pre-wrap" aria-hidden="true">
        {longestPhrase}
      </span>
      <span className="absolute inset-0 whitespace-pre-wrap pointer-events-none">
        <span>{displayText}</span>
      <span
        className={clsx(
          "inline-block w-[1ch] text-current",
          "animate-pulse",
          cursorClassName
        )}
        aria-hidden="true"
      >
        |
      </span>
      </span>
    </span>
  );
}


