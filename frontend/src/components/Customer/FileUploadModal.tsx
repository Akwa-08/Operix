import React, {useState, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {X, Upload, Link, File, AlertCircle, Loader2} from "lucide-react";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fileUrl: string) => void;
  productName: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  productName,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const simulateUpload = async () => {
    if (activeTab === "upload" && !file) {
      setError("Please select a file first");
      return;
    }
    if (activeTab === "url" && !url) {
      setError("Please enter a valid URL");
      return;
    }

    setIsUploading(true);
    setError(null);

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // In a real app, you'd upload to Supabase storage or similar here
    const finalUrl = activeTab === "upload" ? URL.createObjectURL(file!) : url;

    setTimeout(() => {
      onUpload(finalUrl);
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
      setUrl("");
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{opacity: 0, scale: 0.95, y: 20}}
          animate={{opacity: 1, scale: 1, y: 0}}
          exit={{opacity: 0, scale: 0.95, y: 20}}
          className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Requirement Content
              </h2>
              <p className="text-gray-500 font-medium text-sm mt-1">
                Upload content for:{" "}
                <span className="text-cyan-500 font-bold">{productName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900 cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-2 bg-gray-50/50 mx-8 mt-6 rounded-2xl border border-gray-100">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <Upload className="w-4 h-4" />
              Upload file
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "url"
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <Link className="w-4 h-4" />
              By URL
            </button>
          </div>

          <div className="p-8">
            {activeTab === "upload" ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  file
                    ? "border-cyan-500 bg-cyan-50/20"
                    : "border-gray-200 hover:border-cyan-400 hover:bg-gray-50/50"
                }`}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  className={`p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${
                    file
                      ? "bg-cyan-500 text-white shadow-xl shadow-cyan-100"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                  <File className="w-8 h-8" />
                </div>

                {file ? (
                  <div className="text-center">
                    <p className="text-gray-900 font-bold mb-1">{file.name}</p>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-900 font-bold mb-1">
                      Select a file to upload
                    </p>
                    <p className="text-gray-400 text-sm font-medium">
                      or drag and drop it here
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-700">
                  Paste your link here
                </p>
                <div className="relative">
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    placeholder="https://example.com/myfile.pdf"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium px-2">
                  You can use your Google Drive, Dropbox, or any public link.
                </p>
              </div>
            )}

            {error && (
              <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-bold">{error}</p>
              </motion.div>
            )}

            {isUploading && (
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                    <span className="text-sm font-bold text-gray-900">
                      Uploading...
                    </span>
                  </div>
                  <span className="text-sm font-black text-cyan-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{width: 0}}
                    animate={{width: `${uploadProgress}%`}}
                    className="h-full bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  />
                </div>
              </div>
            )}

            <div className="mt-10 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-gray-50 text-gray-600 font-black text-sm uppercase tracking-wider rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={simulateUpload}
                disabled={isUploading}
                className="flex-3 py-4 bg-cyan-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-cyan-100 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {isUploading ? "Preparing..." : "Satisfy and Save"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
