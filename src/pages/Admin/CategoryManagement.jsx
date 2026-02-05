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
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';

const CreateCategoryModal = ({ open, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setName('');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setError('');
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, GIF, WebP).');
      return;
    }
    setError('');
    setImageFile(file);
    setImageUrl('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasImage = imagePreview || (imageUrl && imageUrl.trim());
  const previewSrc = imagePreview || (imageUrl && imageUrl.trim()) || '';

  const handleSubmit = async () => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await createCategory(trimmed, imageFile, imageUrl.trim() || undefined);
      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.error || 'Failed to create category.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 1 } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>Create category</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Headphones"
          sx={{ mb: 2 }}
          variant="outlined"
        />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Category image (optional)
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Or paste image URL (e.g. https://...)"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (imageFile) {
              setImageFile(null);
              setImagePreview('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
          sx={{ mb: 2 }}
          variant="outlined"
          disabled={!!imageFile}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {!hasImage ? (
          <Box
            onClick={() => !imageUrl && fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              cursor: imageUrl ? 'default' : 'pointer',
              bgcolor: 'action.hover',
              '&:hover': imageUrl ? {} : { borderColor: 'primary.main', bgcolor: 'rgba(46, 75, 247, 0.04)' },
            }}
          >
            <HeroIcon name="camera" size={40} color="text.secondary" sx={{ display: 'block', mx: 'auto', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Click to choose an image
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              JPEG, PNG, GIF or WebP
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <Box
              component="img"
              src={previewSrc}
              alt="Preview"
              onError={(e) => {
                if (imageUrl && !imageFile) e.target.style.display = 'none';
              }}
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <IconButton
              onClick={handleRemoveImage}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <HeroIcon name="close" size={20} color="white" />
            </IconButton>
            {imageFile && (
              <Button
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{ mt: 1 }}
              >
                Change image
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : <HeroIcon name="add" size={18} />}>
          {loading ? 'Creating…' : 'Create category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EditCategoryModal = ({ open, onClose, onSuccess, category }) => {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setImageUrl(category.imageUrl || '');
      setImagePreview(category.imageUrl || '');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [category]);

  const handleClose = () => {
    setName('');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setError('');
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, GIF, WebP).');
      return;
    }
    setError('');
    setImageFile(file);
    setImageUrl('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasImage = imagePreview || (imageUrl && imageUrl.trim());
  const previewSrc = imagePreview || (imageUrl && imageUrl.trim()) || '';

  const handleSubmit = async () => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }
    if (!category?.id) return;
    setLoading(true);
    setError('');
    try {
      const result = await updateCategory(
        category.id,
        { name: trimmed },
        imageFile,
        imageFile ? undefined : (imageUrl || '').trim()
      );
      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.error || 'Failed to update category.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update category.');
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 1 } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>Edit category</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Headphones"
          sx={{ mb: 2 }}
          variant="outlined"
        />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Category image (optional)
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Or paste image URL (e.g. https://...)"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            if (imageFile) {
              setImageFile(null);
              setImagePreview('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
          sx={{ mb: 2 }}
          variant="outlined"
          disabled={!!imageFile}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {!hasImage ? (
          <Box
            onClick={() => !imageUrl && fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              cursor: imageUrl ? 'default' : 'pointer',
              bgcolor: 'action.hover',
              '&:hover': imageUrl ? {} : { borderColor: 'primary.main', bgcolor: 'rgba(46, 75, 247, 0.04)' },
            }}
          >
            <HeroIcon name="camera" size={40} color="text.secondary" sx={{ display: 'block', mx: 'auto', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Click to choose an image
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              JPEG, PNG, GIF or WebP
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <Box
              component="img"
              src={previewSrc}
              alt="Preview"
              onError={(e) => {
                if (imageUrl && !imageFile) e.target.style.display = 'none';
              }}
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <IconButton
              onClick={handleRemoveImage}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <HeroIcon name="close" size={20} color="white" />
            </IconButton>
            {imageFile && (
              <Button
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{ mt: 1 }}
              >
                Change image
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : <HeroIcon name="save" size={18} />}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    const result = await getCategories();
    if (result.success) {
      setCategories(result.categories || []);
    } else {
      setError(result.error || 'Failed to load categories.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products using this category will keep the name but the category will be removed from the list.`)) return;
    const result = await deleteCategory(id);
    if (result.success) loadCategories();
    else setError(result.error);
  };

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.25 }}>Admin</Typography>
              <Typography variant="h5" fontWeight={600} sx={{ lineHeight: 1.3 }}>Categories</Typography>
              <Typography variant="caption" color="text.secondary">Add and manage categories</Typography>
            </Box>
            <Button variant="contained" size="small" startIcon={<HeroIcon name="add" size={18} />} onClick={() => setModalOpen(true)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, boxShadow: 'none', py: 0.75, px: 1.5 }}>
              Add category
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {categories.length > 0 ? (
                <Grid container spacing={1.5}>
                  {categories.map((cat) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            minWidth: 64,
                            height: 64,
                            bgcolor: 'grey.100',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {cat.imageUrl ? (
                            <Box
                              component="img"
                              src={cat.imageUrl}
                              alt={cat.name}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <HeroIcon name="shoppingBag" size={28} color="text.secondary" sx={{ opacity: 0.4 }} />
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, py: 1, px: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                            {cat.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <IconButton size="small" onClick={() => setEditingCategory(cat)} sx={{ color: 'primary.main', p: 0.5 }} title="Edit">
                              <HeroIcon name="edit" size={18} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(cat.id, cat.name)} sx={{ color: 'error.main', p: 0.5 }} title="Delete">
                              <HeroIcon name="delete" size={18} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: '#fff',
                  }}
                >
                  <HeroIcon name="shoppingBag" size={44} color="text.secondary" sx={{ opacity: 0.5, mb: 1.5 }} />
                  <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>No categories yet</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>Add a category to organize your products.</Typography>
                  <Button variant="contained" size="small" startIcon={<HeroIcon name="add" size={18} />} onClick={() => setModalOpen(true)} sx={{ borderRadius: 1.5 }}>
                    Add category
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Container>
      </Box>

      <CreateCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={loadCategories} />
      <EditCategoryModal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSuccess={loadCategories}
        category={editingCategory}
      />
    </ProtectedRoute>
  );
};

export default CategoryManagement;
