"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type saleSheetType } from "@/db/schema/sale-sheet";
import { type ApiResponse, type SaleItem, type PageState } from "./types";

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface UseRecorderOptions {
  businessId: string | undefined;
  onProcessed: (items: SaleItem[], transcription: string, date: string) => void;
  onError: (msg: string) => void;
  setPageState: (s: PageState) => void;
}

export function useRecorder({
  businessId,
  onProcessed,
  onError,
  setPageState,
}: UseRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Keep a ref to the latest sheet so onstop closure never goes stale
  const sheetRef = useRef<saleSheetType | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // ── processAudio — stable ref so onstop closure is never stale ─────────────
  const processAudio = useCallback(
    async (mimeType: string) => {
      const sheet = sheetRef.current;
      if (!sheet) return;

      const isMP4 = mimeType.includes("mp4");
      const extension = isMP4 ? "m4a" : "webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const formData = new FormData();
      formData.append("audio", blob, `recording.${extension}`);
      formData.append("sheet_id", sheet.id);
      formData.append("business_id", businessId ?? "");

      try {
        const res = await fetch("/api/process-recording", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          onError(`Server error: ${res.status}. Please try again.`);
          setPageState("error");
          return;
        }

        const json: ApiResponse = await res.json();

        if (json.error) {
          onError(json.message ?? "Processing failed. Please try again.");
          setPageState("error");
          return;
        }

        const resolvedDate = json.date ?? new Date().toISOString();
        const items: SaleItem[] = json.data.map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          price: d.price,
        }));

        onProcessed(items, json.transcription, resolvedDate);
        setPageState("review");
      } catch {
        onError("Network error. Check your connection and try again.");
        setPageState("error");
      }
    },
    // businessId and callbacks are stable — they come from parent state/props
    [businessId, onProcessed, onError, setPageState],
  );

  // ── Start mic ──────────────────────────────────────────────────────────────
  const startMic = useCallback(
    async (sheet: saleSheetType) => {
      sheetRef.current = sheet;
      setDuration(0);
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const mimeType =
          [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
            "audio/ogg;codecs=opus",
            "",
          ].find((t) => t === "" || MediaRecorder.isTypeSupported(t)) ?? "";

        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : {},
        );
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          processAudio(recorder.mimeType);
        };

        recorder.start(250);
        setIsRecording(true);
        setPageState("recording");
      } catch {
        onError(
          "Microphone access denied. Please allow mic permissions and try again.",
        );
        setPageState("error");
      }
    },
    [processAudio, onError, setPageState],
  );

  // ── Stop ───────────────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    setPageState("processing");
  }, [setPageState]);

  // ── Force-stop without processing (cancel) ─────────────────────────────────
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      // Remove onstop handler so processAudio doesn't fire
      mediaRecorderRef.current!.onstop = null;
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
    setDuration(0);
  }, []);

  return { isRecording, duration, startMic, stopRecording, cancelRecording };
}
