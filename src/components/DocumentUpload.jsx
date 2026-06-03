import { useRef, useState } from "react";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import api from "../api/client";

/**
 * Drag-and-drop image uploader. Uploads to the backend (Cloudinary) and calls
 * onChange(url). Shows a clear preview of the uploaded scan with a remove button.
 *
 * Props: label, value (url string), onChange(url|"")
 */
export default function DocumentUpload({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please choose an image (JPG/PNG)."); return; }
    setErr(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/document", fd);
      onChange(data.url);
    } catch (e) {
      setErr(e?.response?.data?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight={600}>
        {label}
      </Typography>

      {value ? (
        <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <Box component="img" src={value} alt={label}
            sx={{ width: "100%", height: 150, objectFit: "contain", display: "block", bgcolor: "rgba(0,0,0,0.04)" }} />
          <IconButton size="small" onClick={() => onChange("")}
            sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.85)" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          sx={{
            cursor: "pointer", height: 120, borderRadius: 1, border: "1.5px dashed",
            borderColor: drag ? "primary.main" : "divider",
            bgcolor: drag ? "rgba(211,47,47,0.06)" : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 0.5, textAlign: "center", px: 1, transition: "border-color .2s, background .2s",
          }}
        >
          {uploading ? <CircularProgress size={22} /> : (
            <>
              <CloudUploadIcon sx={{ color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">Drag &amp; drop or click to upload</Typography>
            </>
          )}
        </Box>
      )}

      {err && <Typography variant="caption" color="error" display="block" mt={0.5}>{err}</Typography>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
    </Box>
  );
}
