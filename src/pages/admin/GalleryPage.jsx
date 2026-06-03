import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Button, IconButton, Tooltip,
  CircularProgress, Alert, Grid, Tab, Tabs, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  LinearProgress, Stack,
} from "@mui/material";
import CloudUploadIcon  from "@mui/icons-material/CloudUpload";
import DeleteIcon       from "@mui/icons-material/Delete";
import EditIcon         from "@mui/icons-material/Edit";
import VisibilityIcon   from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowUpwardIcon  from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LinkIcon         from "@mui/icons-material/Link";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import VideocamIcon     from "@mui/icons-material/Videocam";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { galleryAPI } from "../../api/client";

const BLANK_EDIT   = { id: "", title: "", caption: "", thumb: "", active: true };
const BLANK_LINK   = { type: "video", src: "", title: "", caption: "" };
const BLANK_UPLOAD = { file: null, title: "", caption: "" };

export default function GalleryPage() {
  const [tab, setTab]         = useState("photo");
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState(BLANK_UPLOAD);
  const [uploadMode, setUploadMode] = useState("any"); // "any" | "photo" | "video"
  const [previewUrl, setPreviewUrl] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(BLANK_EDIT);
  const [saving, setSaving]     = useState(false);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState(BLANK_LINK);

  const fileInputRef = useRef(null);

  // Free the object URL when the upload modal closes so we don't leak memory.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // ── Data ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await galleryAPI.list();
      setItems(items);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => i.type === tab);
  const photoCount = items.filter((i) => i.type === "photo").length;
  const videoCount = items.filter((i) => i.type === "video").length;
  const activeCount = filtered.filter((i) => i.active).length;

  // ── Upload modal ────────────────────────────────────────────────────────
  // Clicking the Upload button opens a dialog where the admin picks a file
  // and (optionally) fills in title + caption before the upload starts.

  /**
   * Open the upload modal in one of three modes:
   *   "any"   — top-right button. Accepts image OR video, classified by mimetype.
   *   "photo" — empty-state on Photos tab. Strictly images only.
   *   "video" — empty-state on Videos tab. Strictly videos only.
   */
  const openUploadModal = (mode = "any") => {
    setUploadMode(mode);
    setUploadForm(BLANK_UPLOAD);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setError("");
    setProgress(0);
    setUploadOpen(true);
  };

  // Accept attribute & label change based on mode.
  const uploadAccept =
    uploadMode === "photo" ? "image/*"
    : uploadMode === "video" ? "video/*"
    : "image/*,video/*";

  const uploadHelpText =
    uploadMode === "photo" ? "Up to 50 MB • JPG, PNG, WebP, AVIF, GIF"
    : uploadMode === "video" ? "Up to 50 MB • MP4, MOV, WebM, MKV"
    : "Up to 50 MB • Images or videos";

  const uploadTitle =
    uploadMode === "photo" ? "Upload Photo"
    : uploadMode === "video" ? "Upload Video"
    : "Upload to Gallery";

  const closeUploadModal = () => {
    if (uploading) return; // don't close mid-upload
    setUploadOpen(false);
    setUploadForm(BLANK_UPLOAD);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickFile = (file) => {
    if (!file) return;

    // Enforce strict type matching when the modal was opened from a tab's
    // empty-state button — videos tab rejects images, photos tab rejects videos.
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (uploadMode === "photo" && !isImage) {
      setError(`Please select an image file. "${file.name}" is not an image.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (uploadMode === "video" && !isVideo) {
      setError(`Please select a video file. "${file.name}" is not a video.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (uploadMode === "any" && !isImage && !isVideo) {
      setError(`Unsupported file type: ${file.type || "unknown"}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError("");
    setUploadForm((prev) => ({ ...prev, file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submitUpload = async () => {
    if (!uploadForm.file || uploading) return;
    setUploading(true);
    setError("");
    try {
      await galleryAPI.upload(
        uploadForm.file,
        {
          title:     uploadForm.title.trim(),
          caption:   uploadForm.caption.trim(),
          sortOrder: items.length,
        },
        (p) => setProgress(p),
      );
      await load();
      // Close on success
      setUploadOpen(false);
      setUploadForm(BLANK_UPLOAD);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleLinkAdd = async () => {
    if (!linkForm.src.trim()) return;
    setSaving(true);
    setError("");
    try {
      await galleryAPI.create({
        type: linkForm.type,
        src: linkForm.src.trim(),
        title: linkForm.title.trim(),
        caption: linkForm.caption.trim(),
        provider: "external",
        sortOrder: items.length,
      });
      setLinkOpen(false);
      setLinkForm(BLANK_LINK);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add link");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const openEdit = (item) => {
    setEditForm({
      id: item._id,
      title: item.title || "",
      caption: item.caption || "",
      thumb: item.thumb || "",
      active: item.active,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await galleryAPI.update(editForm.id, {
        title: editForm.title,
        caption: editForm.caption,
        thumb: editForm.thumb,
        active: editForm.active,
      });
      setEditOpen(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle / Delete / Reorder ───────────────────────────────────────────
  const toggle = async (id) => {
    try { await galleryAPI.toggle(id); await load(); }
    catch (e) { setError(e?.response?.data?.message || "Toggle failed"); }
  };

  const remove = async (item) => {
    const label = item.title || item.caption || "this item";
    if (!confirm(`Delete "${label}" from the gallery? The hosted file is also removed from Cloudinary.`)) return;
    try { await galleryAPI.remove(item._id); await load(); }
    catch (e) { setError(e?.response?.data?.message || "Delete failed"); }
  };

  const move = async (item, dir) => {
    const sameType = items.filter((i) => i.type === item.type)
      .sort((a, b) => a.sortOrder - b.sortOrder || (new Date(b.createdAt) - new Date(a.createdAt)));
    const idx = sameType.findIndex((i) => i._id === item._id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sameType.length) return;

    [sameType[idx], sameType[swap]] = [sameType[swap], sameType[idx]];
    const payload = sameType.map((i, n) => ({ id: i._id, sortOrder: n }));
    try { await galleryAPI.reorder(payload); await load(); }
    catch (e) { setError(e?.response?.data?.message || "Reorder failed"); }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Gallery</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage photos and videos shown on the public website's Gallery page.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setLinkOpen(true)}
          >
            Add by URL
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => openUploadModal("any")}
            disabled={uploading}
          >
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={uploadAccept}
            style={{ display: "none" }}
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">PHOTOS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{photoCount}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">VIDEOS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{videoCount}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">ACTIVE ({tab.toUpperCase()})</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{activeCount}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">TOTAL</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{items.length}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {error && !uploadOpen && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="photo" icon={<PhotoLibraryIcon />} iconPosition="start" label={`Photos (${photoCount})`} />
        <Tab value="video" icon={<VideocamIcon />}     iconPosition="start" label={`Videos (${videoCount})`} />
      </Tabs>

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              No {tab}s yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Upload your first {tab} to start building the gallery.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => openUploadModal(tab)}
            >
              Upload {tab === "photo" ? "a Photo" : "a Video"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card sx={{ opacity: item.active ? 1 : 0.55, position: "relative" }}>
                <Box
                  sx={{
                    aspectRatio: "1 / 1",
                    backgroundImage: `url(${item.thumb || item.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#1A1A1A",
                    position: "relative",
                  }}
                >
                  {item.type === "video" && (
                    <PlayCircleOutlineIcon
                      sx={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: 56,
                        color: "rgba(255,255,255,0.85)",
                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
                      }}
                    />
                  )}
                  <Chip
                    size="small"
                    label={item.type.toUpperCase()}
                    sx={{
                      position: "absolute", top: 8, left: 8,
                      bgcolor: "rgba(0,0,0,0.6)", color: "#fff",
                      fontWeight: 700, letterSpacing: "0.05em",
                    }}
                  />
                  {!item.active && (
                    <Chip
                      size="small"
                      label="HIDDEN"
                      color="warning"
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    />
                  )}
                </Box>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, mb: 0.25, minHeight: 20 }}
                    noWrap
                  >
                    {item.title || "Untitled"}
                  </Typography>
                  {item.caption && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                      noWrap
                      title={item.caption}
                    >
                      {item.caption}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Order: {item.sortOrder} • {item.provider}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                    <Tooltip title="Edit caption">
                      <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={item.active ? "Hide from website" : "Show on website"}>
                      <IconButton size="small" onClick={() => toggle(item._id)}>
                        {item.active ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Move up">
                      <IconButton size="small" onClick={() => move(item, "up")}><ArrowUpwardIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <IconButton size="small" onClick={() => move(item, "down")}><ArrowDownwardIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => remove(item)} sx={{ color: "error.main" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload dialog */}
      <Dialog
        open={uploadOpen}
        onClose={closeUploadModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{uploadTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* File picker / preview area */}
            <Box
              onClick={() => !uploading && fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: uploadForm.file ? "primary.main" : "divider",
                borderRadius: 2,
                p: uploadForm.file ? 0 : 4,
                textAlign: "center",
                cursor: uploading ? "default" : "pointer",
                bgcolor: "action.hover",
                overflow: "hidden",
                position: "relative",
                transition: "border-color 0.2s",
                "&:hover": { borderColor: uploading ? "divider" : "primary.main" },
              }}
            >
              {uploadForm.file ? (
                <Box sx={{ position: "relative" }}>
                  {uploadForm.file.type.startsWith("video/") ? (
                    <Box
                      component="video"
                      src={previewUrl}
                      controls
                      sx={{ width: "100%", maxHeight: 280, display: "block" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={previewUrl}
                      alt="Preview"
                      sx={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block" }}
                    />
                  )}
                  <Box
                    sx={{
                      p: 1.25,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ minWidth: 0, textAlign: "left" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {uploadForm.file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                        {uploadForm.file.type.startsWith("video/") ? "Video" : "Photo"}
                      </Typography>
                    </Box>
                    {!uploading && (
                      <Button size="small" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Change
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Click to select{" "}
                    {uploadMode === "photo"
                      ? "an image"
                      : uploadMode === "video"
                      ? "a video"
                      : "an image or video"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {uploadHelpText}
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              label="Title (optional)"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              fullWidth
              disabled={uploading}
              inputProps={{ maxLength: 120 }}
              helperText={`${uploadForm.title.length}/120 — headline shown on the website`}
            />
            <TextField
              label="Caption (optional)"
              value={uploadForm.caption}
              onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
              fullWidth
              multiline
              minRows={2}
              disabled={uploading}
              inputProps={{ maxLength: 240 }}
              helperText={`${uploadForm.caption.length}/240 — longer description shown under the title`}
            />

            {uploading && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Uploading… {progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {error && uploadOpen && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadModal} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={submitUpload}
            variant="contained"
            color="primary"
            disabled={!uploadForm.file || uploading}
            startIcon={uploading ? null : <CloudUploadIcon />}
          >
            {uploading ? `Uploading ${progress}%` : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Gallery Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Title (optional)"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              fullWidth
              inputProps={{ maxLength: 120 }}
              helperText={`${editForm.title.length}/120 — shown as the headline on the website`}
            />
            <TextField
              label="Caption (optional)"
              value={editForm.caption}
              onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
              fullWidth
              multiline
              minRows={2}
              inputProps={{ maxLength: 240 }}
              helperText={`${editForm.caption.length}/240 — a longer description shown under the title`}
            />
            <TextField
              label="Thumbnail URL (optional)"
              value={editForm.thumb}
              onChange={(e) => setEditForm({ ...editForm, thumb: e.target.value })}
              fullWidth
              helperText="Leave blank to auto-derive from the main asset."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                />
              }
              label="Visible on website"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add-by-URL dialog (handy for YouTube videos) */}
      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add by URL</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Paste a direct image URL, a Cloudinary URL, or a YouTube watch
              link. Use this when the asset is already hosted somewhere else.
            </Typography>
            <Tabs
              value={linkForm.type}
              onChange={(_, v) => setLinkForm({ ...linkForm, type: v })}
            >
              <Tab value="photo" label="Photo" />
              <Tab value="video" label="Video" />
            </Tabs>
            <TextField
              label="URL"
              value={linkForm.src}
              onChange={(e) => setLinkForm({ ...linkForm, src: e.target.value })}
              fullWidth
              placeholder={
                linkForm.type === "video"
                  ? "https://youtu.be/dQw4w9WgXcQ"
                  : "https://res.cloudinary.com/.../photo.jpg"
              }
            />
            <TextField
              label="Title (optional)"
              value={linkForm.title}
              onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
              fullWidth
              inputProps={{ maxLength: 120 }}
            />
            <TextField
              label="Caption (optional)"
              value={linkForm.caption}
              onChange={(e) => setLinkForm({ ...linkForm, caption: e.target.value })}
              fullWidth
              multiline
              minRows={2}
              inputProps={{ maxLength: 240 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkOpen(false)}>Cancel</Button>
          <Button onClick={handleLinkAdd} variant="contained" disabled={saving || !linkForm.src.trim()}>
            {saving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
