"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadOpen(false);
      setSelectedFile(null);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      // Validate file size client-side (10 MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("File exceeds maximum size of 10 MB.");
        setSelectedFile(null);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">POD & documents</CardTitle>
            <CardDescription>Upload and verify delivery and inspection documents.</CardDescription>
          </CardHeader>
        </Card>
        <div className="flex items-center gap-2">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={uploading}>
                <Plus className="mr-2 w-4 h-4" /> Upload document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload document</DialogTitle>
                <DialogDescription>
                  Select a file to upload. Supported: PDF, PNG, JPG, WebP, TIFF, DOC, DOCX, XLS, XLSX, CSV. Max 10 MB.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); uploadDocument(); }} className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select file</Label>
                  <div className="flex items-center pl-3">
                    <Upload className="w-4 h-4 text-slate-text mr-2" />
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="pl-9 w-full cursor-pointer"
                    />
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-slate-text">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{selectedFile.name}</span>
                      <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-surface-muted rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-text">Uploading…</p>
                  </div>
                )}
              </form>
              <DialogFooter>
                <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button onClick={() => uploadDocument()} disabled={uploading || !selectedFile}>
                  {uploading ? "Uploading…" : "Upload document"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 rounded-lg border border-success-teal bg-green-50 text-success-teal text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>File uploaded successfully.</span>
        </div>
      )}

      {loading ? (
        <div className="h-10 w-3/4"><div className="h-full w-full bg-surface-muted rounded animate-pulse" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {docs.slice(0, 9).map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-slate-text" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-navy-midnight truncate">{doc.originalName}</div>
                    <div className="text-xs text-slate-text truncate">{doc.fileUrl}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="default" className={doc.status === "PENDING" ? "bg-amber-50 border-amber-200 text-warning-amber" : "bg-green-50 border-green-200 text-success-teal"}>
                    {doc.status}
                  </Badge>
                  {doc.verified && <span className="text-xs text-slate-text">Verified</span>}
                </div>
                <p className="text-xs text-slate-text mt-2">{`${(doc.size / 1024).toFixed(1)} KB • ${doc.mimeType}`}</p>
              </CardContent>
            </Card>
          ))}
          {docs.length === 0 && <div className="col-span-full p-8 text-center text-slate-text">No documents uploaded.</div>}
        </div>
      )}
    </div>
  );
}
