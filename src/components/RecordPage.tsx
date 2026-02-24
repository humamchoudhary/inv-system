"use client";

import { useState, useCallback } from "react";
import { type saleSheetType } from "@/db/schema/sale-sheet";
import createSheetAction from "@/app/actions/createSheet";
import { useRecorder } from "./useRecorder";
import {
  SheetCreateScreen,
  SheetSelectScreen,
  RecordingScreen,
  ProcessingScreen,
  ErrorScreen,
  SuccessScreen,
  ReviewScreen,
} from "./Screens";
import type { RecordPageProps, SaleItem, PageState } from "./types";

export default function RecordPage({
  activeBusiness,
  sheets = [],
  onSave,
}: RecordPageProps) {
  const businessName = activeBusiness?.name ?? "My Shop";
  const hasSheets = sheets.length > 0;

  // ── Page state ──────────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>(
    hasSheets ? "sheet-select" : "sheet-create",
  );

  // ── Sheet ───────────────────────────────────────────────────────────────────
  const [selectedSheet, setSelectedSheet] = useState<saleSheetType | null>(
    null,
  );
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetError, setNewSheetError] = useState("");
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // ── Review ──────────────────────────────────────────────────────────────────
  const [transcription, setTranscription] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [recordingDate, setRecordingDate] = useState("");

  // ── Recorder hook ───────────────────────────────────────────────────────────
  const handleProcessed = useCallback(
    (newItems: SaleItem[], newTranscription: string, date: string) => {
      setItems(newItems);
      setTranscription(newTranscription);
      setRecordingDate(date);
    },
    [],
  );

  const handleRecordError = useCallback((msg: string) => {
    setProcessingError(msg);
  }, []);

  const { isRecording, duration, startMic, stopRecording, cancelRecording } =
    useRecorder({
      businessId: activeBusiness?.id,
      onProcessed: handleProcessed,
      onError: handleRecordError,
      setPageState,
    });

  // ── Sheet creation ──────────────────────────────────────────────────────────
  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) {
      setNewSheetError("Sheet name is required.");
      return;
    }
    if (!activeBusiness?.id) return;
    setIsCreatingSheet(true);
    try {
      const sheet = await createSheetAction({
        name: newSheetName.trim(),
        business_id: activeBusiness.id,
      });
      setSelectedSheet(sheet);
      startMic(sheet);
    } catch {
      setNewSheetError("Failed to create sheet. Please try again.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // ── Item editing ────────────────────────────────────────────────────────────
  const updateItem = useCallback(
    (id: string, field: keyof Omit<SaleItem, "id">, value: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                [field]: field === "price" ? parseFloat(value) || 0 : value,
              }
            : item,
        ),
      );
    },
    [],
  );

  const deleteItem = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  const addItem = useCallback(() => {
    const newItem: SaleItem = { id: crypto.randomUUID(), name: "", price: 0 };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedSheet || !onSave) return;
    setSaveError("");
    setIsSaving(true);
    try {
      await onSave({
        items,
        transcription,
        sheetId: selectedSheet.id,
        date: recordingDate || new Date().toISOString(),
      });
      setPageState("success");
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset helpers ───────────────────────────────────────────────────────────
  const resetReviewState = () => {
    setItems([]);
    setTranscription("");
    setProcessingError("");
    setSaveError("");
    setRecordingDate("");
  };

  const handleCancel = () => {
    cancelRecording();
    resetReviewState();
    setPageState(hasSheets ? "sheet-select" : "sheet-create");
  };

  const handleReRecord = () => {
    if (!selectedSheet) return;
    resetReviewState();
    startMic(selectedSheet);
  };

  const handleSheetSelect = (sheet: saleSheetType) => {
    setSelectedSheet((prev) => (prev?.id === sheet.id ? null : sheet));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  switch (pageState) {
    case "sheet-create":
      return (
        <SheetCreateScreen
          businessName={businessName}
          hasSheets={hasSheets}
          newSheetName={newSheetName}
          newSheetError={newSheetError}
          isCreatingSheet={isCreatingSheet}
          onNameChange={(v) => {
            setNewSheetName(v);
            setNewSheetError("");
          }}
          onCreate={handleCreateSheet}
          onBack={() => setPageState("sheet-select")}
        />
      );

    case "sheet-select":
      return (
        <SheetSelectScreen
          businessName={businessName}
          sheets={sheets}
          selectedSheet={selectedSheet}
          onSelect={handleSheetSelect}
          onNewSheet={() => {
            setNewSheetName("");
            setPageState("sheet-create");
          }}
          onStart={() => selectedSheet && startMic(selectedSheet)}
        />
      );

    case "recording":
      return (
        <RecordingScreen
          businessName={businessName}
          selectedSheet={selectedSheet}
          isRecording={isRecording}
          duration={duration}
          onStop={stopRecording}
          onCancel={handleCancel}
        />
      );

    case "processing":
      return <ProcessingScreen selectedSheet={selectedSheet} />;

    case "error":
      return (
        <ErrorScreen
          businessName={businessName}
          processingError={processingError}
          selectedSheet={selectedSheet}
          onRetry={handleReRecord}
          onBack={handleCancel}
        />
      );

    case "success":
      return <SuccessScreen onReRecord={handleReRecord} />;

    case "review":
    default:
      return (
        <ReviewScreen
          businessName={businessName}
          selectedSheet={selectedSheet}
          transcription={transcription}
          recordingDate={recordingDate}
          items={items}
          editingId={editingId}
          isSaving={isSaving}
          saveError={saveError}
          onDateChange={setRecordingDate}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddItem={addItem}
          onSetEditing={setEditingId}
          onSave={handleSave}
          onReRecord={handleReRecord}
        />
      );
  }
}
