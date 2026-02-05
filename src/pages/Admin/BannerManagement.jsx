import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import HeroIcon from '../../components/Common/HeroIcon';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../../services/bannerService';

const BannerFormModal = ({ open, onClose, onSuccess, banner = null }) => {
  const isEdit = !!banner?.id;
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (banner) {
        setImageUrl(banner.imageUrl || '');
        setImagePreview(banner.imageUrl || '');
        setLink(banner.link || '');
      } else {
        setImageUrl('');
        setImagePreview('');
        setLink('');
      }
      setImageFile(null);
      setError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, banner]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setImageUrl('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const imageSrc = imageFile ? null : (imageUrl && imageUrl.trim());
    if (!imageSrc && !imageFile && (!banner || !banner.imageUrl)) {
      setError('Add a banner image (URL or upload).');
      return;
    }
    const data = { title: '', subtitle: '', buttonText: '', link: (link || '').trim(), order: 0 };
    setLoading(true);
    setError('');
    try {
      const result = isEdit
        ? await updateBanner(banner.id, data, imageFile, imageFile ? undefined : imageUrl.trim())
        : await createBanner(data, imageFile, imageUrl.trim() || undefined);
      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.error || 'Failed to save banner.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save banner.');
    } finally {
      setLoading(false);
    }
  };

  const previewSrc = imagePreview || (imageUrl && imageUrl.trim()) || '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>{isEdit ? 'Edit banner' : 'Add banner'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
          Banner image
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Recommended size: 1920×800 px (desktop) or 1920×1000 px (mobile)
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (imageFile) {
              setImageFile(null);
              setImagePreview('');
            }
          }}
          sx={{ mb: 1 }}
          disabled={!!imageFile}
        />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ mb: 2 }}>
          Upload image
        </Button>
        {previewSrc && (
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <Box
              component="img"
              src={previewSrc}
              alt="Banner"
              sx={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
            />
            <IconButton size="small" onClick={removeImage} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}>
              <HeroIcon name="close" size={16} />
            </IconButton>
          </Box>
        )}

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
          Link URL (optional)
        </Typography>
        <TextField
          fullWidth
          label="Where the whole banner goes when clicked"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="e.g. /offers or https://example.com"
          sx={{ mb: 1 }}
          variant="outlined"
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : <HeroIcon name="save" size={18} />}>
          {loading ? 'Saving…' : isEdit ? 'Update' : 'Add banner'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const loadBanners = async () => {
    setLoading(true);
    const result = await getBanners();
    if (result.success) setBanners(result.banners || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingBanner(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    const result = await deleteBanner(id);
    if (result.success) loadBanners();
    else alert(result.error);
  };

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>Admin</Typography>
              <Typography variant="h5" fontWeight={600}>Banners</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Hero banners on the home page. Set image and optional link.</Typography>
            </Box>
            <Button variant="contained" startIcon={<HeroIcon name="add" size={20} />} onClick={handleAdd} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}>
              Add banner
            </Button>
          </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : banners.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: '#fff' }}>
            <HeroIcon name="camera" size={40} color="text.secondary" sx={{ opacity: 0.5, mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>No banners yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Add a banner for the home page hero.</Typography>
            <Button variant="contained" onClick={handleAdd} startIcon={<HeroIcon name="add" size={18} />} sx={{ borderRadius: 2 }}>Add banner</Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {banners.map((b) => (
              <Grid item xs={12} sm={6} md={4} key={b.id}>
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                  <Box sx={{ aspectRatio: '2.5/1', bgcolor: 'background.default', position: 'relative' }}>
                    {b.imageUrl ? (
                      <Box
                        component="img"
                        src={b.imageUrl}
                        alt={b.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #f0f2ff 0%, #e8ebff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HeroIcon name="camera" size={40} color="primary.main" sx={{ opacity: 0.4 }} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap title={b.link || 'No link'}>
                      Link: {b.link || '—'}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleEdit(b)} sx={{ color: 'primary.main' }} title="Edit">
                        <HeroIcon name="edit" size={20} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(b.id)} sx={{ color: 'error.main' }} title="Delete">
                        <HeroIcon name="delete" size={20} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <BannerFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingBanner(null); }} onSuccess={loadBanners} banner={editingBanner} />
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default BannerManagement;
