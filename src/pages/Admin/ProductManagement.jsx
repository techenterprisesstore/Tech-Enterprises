import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  IconButton,
  Box,
  MenuItem,
  Alert,
  InputAdornment,
  Divider,
  Chip,
} from '@mui/material';
import HeroIcon from '../../components/Common/HeroIcon';
import RichTextEditor from '../../components/Common/RichTextEditor';
import { getProducts, createProduct, updateProduct, deleteProduct, clearProductsCache } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { formatCurrency } from '../../utils/format';
import { CircularProgress } from '@mui/material';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    offerPrice: '',
    stock: '',
    category: '',
    isOffer: false,
    imageUrl: '',
    galleryImages: [],
  });
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryItems, setGalleryItems] = useState([]); // { type: 'url', url } | { type: 'file', file, preview }
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [categoryNames, setCategoryNames] = useState(PRODUCT_CATEGORIES);
  const [categoryFilter, setCategoryFilter] = useState('');
  const galleryFileInputRef = useRef(null);
  const mainFileInputRef = useRef(null);

  const categoriesWithProducts = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const filteredProducts = categoryFilter === '' ? products : products.filter((p) => p.category === categoryFilter);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      const result = await getCategories();
      if (result.success && result.categories?.length > 0) {
        setCategoryNames(result.categories.map((c) => c.name));
      }
    };
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getProducts(100);
    if (result.success) {
      setProducts(result.products);
    }
    setLoading(false);
  };

  const handleOpen = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const existingGallery = (product.galleryImages && product.galleryImages.length > 0)
        ? product.galleryImages
        : (product.imageUrl ? [product.imageUrl] : []);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        offerPrice: product.offerPrice || '',
        stock: product.stock,
        category: product.category || '',
        isOffer: product.isOffer || false,
        imageUrl: product.imageUrl || '',
        galleryImages: existingGallery,
      });
      setMainImageFile(null);
      setMainImagePreview('');
      setGalleryItems(existingGallery.slice(1).map((url) => ({ type: 'url', url })));
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        offerPrice: '',
        stock: '',
        category: '',
        isOffer: false,
        imageUrl: '',
        galleryImages: [],
      });
      setMainImageFile(null);
      setMainImagePreview('');
      setGalleryItems([]);
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setMainImageFile(null);
    setMainImagePreview('');
    setGalleryItems([]);
    setError('');
  };

  const handleMainImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setMainImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setMainImagePreview(reader.result);
    reader.readAsDataURL(file);
    if (mainFileInputRef.current) mainFileInputRef.current.value = '';
  };

  const addGalleryUrl = () => {
    setGalleryItems((prev) => [...prev, { type: 'url', url: '' }]);
  };

  const addGalleryFile = () => {
    galleryFileInputRef.current?.click();
  };

  const handleGalleryFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGalleryItems((prev) => [...prev, { type: 'file', file, preview: reader.result }]);
    };
    reader.readAsDataURL(file);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
  };

  const updateGalleryUrl = (index, url) => {
    setGalleryItems((prev) => {
      const next = [...prev];
      if (next[index]?.type === 'url') next[index] = { type: 'url', url };
      return next;
    });
  };

  const removeGalleryItem = (index) => {
    setGalleryItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      setError('Please fill all required fields.');
      return;
    }

    setProcessing(true);
    const galleryFiles = galleryItems.filter((i) => i.type === 'file').map((i) => i.file);
    const galleryUrlsFromForm = galleryItems.filter((i) => i.type === 'url' && (i.url || '').trim()).map((i) => (i.url || '').trim());

    const mainUrl = (formData.imageUrl || '').trim();
    const payload = {
      name: formData.name,
      description: formData.description || '',
      price: formData.price,
      offerPrice: formData.offerPrice || '',
      stock: formData.stock,
      category: formData.category,
      isOffer: formData.isOffer,
      imageUrl: mainUrl,
      galleryImages: undefined,
    };

    if (editingProduct && !mainImageFile && galleryFiles.length === 0 && galleryUrlsFromForm.length === 0) {
      payload.galleryImages = editingProduct.galleryImages || (editingProduct.imageUrl ? [editingProduct.imageUrl] : []);
    }

    const result = editingProduct
      ? await updateProduct(editingProduct.id, payload, mainImageFile, galleryFiles, galleryUrlsFromForm)
      : await createProduct(payload, mainImageFile, galleryFiles, galleryUrlsFromForm);

    if (result.success) {
      clearProductsCache();
      setTimeout(() => loadProducts(), 500);
      handleClose();
    } else {
      setError(result.error);
    }
    setProcessing(false);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const result = await deleteProduct(productId);
    if (result.success) {
      clearProductsCache();
      setTimeout(() => loadProducts(), 500);
    } else {
      alert('Error deleting product: ' + result.error);
    }
  };

  const mainPreview = mainImagePreview || formData.imageUrl || (editingProduct?.imageUrl && !mainImageFile ? editingProduct.imageUrl : '');

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>Admin</Typography>
              <Typography variant="h5" fontWeight={600}>Products</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Add and edit products</Typography>
            </Box>
            <Button variant="contained" startIcon={<HeroIcon name="add" size={20} />} onClick={() => handleOpen()} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}>
              Add product
            </Button>
          </Box>

          {!loading && (categoriesWithProducts.length > 0 || products.length > 0) && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                Category:
              </Typography>
              <Chip
                label="All"
                onClick={() => setCategoryFilter('')}
                variant={categoryFilter === '' ? 'filled' : 'outlined'}
                size="small"
                sx={{ borderRadius: 50 }}
              />
              {categoriesWithProducts.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  onClick={() => setCategoryFilter(cat)}
                  variant={categoryFilter === cat ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ borderRadius: 50 }}
                />
              ))}
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                      display: 'flex',
                      alignItems: 'stretch',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        minWidth: 100,
                        flexShrink: 0,
                        bgcolor: 'background.default',
                        position: 'relative',
                        aspectRatio: '1',
                      }}
                    >
                      <Box
                        component="img"
                        src={(product.galleryImages && product.galleryImages[0]) || product.imageUrl || '/placeholder.svg'}
                        alt={product.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.target.src = '/placeholder.svg'; }}
                      />
                      {(() => {
                        const op = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
                        const pr = Number(product.price);
                        const hasOffer = product.isOffer === true || (op != null && op > 0 && pr > op);
                        return hasOffer ? (
                          <Chip
                            label="Offer"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: 'success.main',
                              color: 'white',
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        ) : null;
                      })()}
                    </Box>
                    <Box sx={{ p: 1.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                          {product.category}
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {(() => {
                            const op = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
                            const pr = Number(product.price);
                            const hasOffer = product.isOffer === true || (op != null && op > 0 && pr > op);
                            return hasOffer ? (
                              <>
                                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                  {formatCurrency(product.price)}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="primary">
                                  {formatCurrency(product.offerPrice)}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" fontWeight={600} color="primary">
                                {formatCurrency(product.price)}
                              </Typography>
                            );
                          })()}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {product.stock}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.25 }}>
                        <IconButton size="small" onClick={() => handleOpen(product)} sx={{ color: 'primary.main' }} title="Edit">
                          <HeroIcon name="edit" size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(product.id)} sx={{ color: 'error.main' }} title="Delete">
                          <HeroIcon name="delete" size={18} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '95vh' } }}>
            <DialogTitle sx={{ fontWeight: 600, pb: 0, px: 3, pt: 2 }}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5, px: 3, pb: 0, overflowY: 'auto' }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={3} sx={{ mb: 1 }}>
                {/* Left: Images + Title */}
                <Grid item xs={12} md={5}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Main image */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Main image
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Image URL (optional)"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        disabled={!!mainImageFile}
                        variant="outlined"
                        sx={{ minWidth: 0 }}
                      />
                      <Button size="small" variant="outlined" onClick={() => mainFileInputRef.current?.click()} sx={{ flexShrink: 0 }}>
                        Upload
                      </Button>
                    </Box>
                    <input ref={mainFileInputRef} type="file" accept="image/*" onChange={handleMainImageFile} style={{ display: 'none' }} />
                    {mainPreview ? (
                      <Box sx={{ position: 'relative', width: 200, height: 200, flexShrink: 0, mb: 2 }}>
                        <Box
                          component="img"
                          src={mainPreview}
                          alt="Main"
                          sx={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {mainImageFile && (
                          <IconButton
                            size="small"
                            onClick={() => { setMainImageFile(null); setMainImagePreview(''); }}
                            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                          >
                            <HeroIcon name="close" size={16} color="white" />
                          </IconButton>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ width: 200, height: 200, borderRadius: 1, border: '1px dashed', borderColor: 'divider', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">No image</Typography>
                      </Box>
                    )}

                    {/* Gallery preview thumbnails (below main image) */}
                    {galleryItems.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {galleryItems.map((item, index) => {
                          const thumbSrc = item.type === 'file' ? item.preview : (item.url?.trim() || null);
                          return (
                            <Box key={index} sx={{ position: 'relative' }}>
                              {thumbSrc ? (
                                <Box
                                  component="img"
                                  src={thumbSrc}
                                  alt=""
                                  sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <Box sx={{ width: 56, height: 56, borderRadius: 1, border: '1px dashed', borderColor: 'divider', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">URL</Typography>
                                </Box>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => removeGalleryItem(index)}
                                sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'error.main', color: 'white', width: 18, height: 18, minWidth: 18, minHeight: 18, '&:hover': { bgcolor: 'error.dark' }, '& .MuiSvgIcon-root': { fontSize: 10 } }}
                              >
                                <HeroIcon name="close" size={10} color="white" />
                              </IconButton>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Gallery images */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                      Gallery images
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Add more (URL or upload). First image is main.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                      <Button size="small" variant="outlined" onClick={addGalleryUrl}>Add URL</Button>
                      <Button size="small" variant="outlined" onClick={addGalleryFile}>Upload</Button>
                      <input ref={galleryFileInputRef} type="file" accept="image/*" onChange={handleGalleryFile} style={{ display: 'none' }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                      {galleryItems.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.type === 'file' ? (
                            <Box component="img" src={item.preview} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
                          ) : (
                            <TextField
                              size="small"
                              placeholder="Image URL"
                              value={item.url}
                              onChange={(e) => updateGalleryUrl(index, e.target.value)}
                              variant="outlined"
                              sx={{ flex: 1, minWidth: 0 }}
                            />
                          )}
                          <IconButton size="small" onClick={() => removeGalleryItem(index)} sx={{ color: 'error.main', flexShrink: 0 }} title="Remove">
                            <HeroIcon name="close" size={18} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>

                {/* Right: Title, Description, Category, Pricing */}
                <Grid item xs={12} md={7}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Title
                    </Typography>
                    <TextField
                      fullWidth
                      label="Product name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Optional. Use the toolbar for bold, italic, link, and bullets.
                    </Typography>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(html) => setFormData({ ...formData, description: html })}
                      placeholder="Product description..."
                      minHeight={160}
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Category
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      label="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      sx={{ mb: 2 }}
                      variant="outlined"
                      size="small"
                    >
                      {categoryNames.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </TextField>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Pricing & stock
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Price (₹)"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          size="small"
                          variant="outlined"
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Offer price (₹)"
                          type="number"
                          value={formData.offerPrice}
                          onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                          size="small"
                          placeholder="Optional"
                          variant="outlined"
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Stock"
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          required
                          size="small"
                          variant="outlined"
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </Grid>
                    </Grid>
                    <FormControlLabel
                      control={<Switch checked={formData.isOffer} onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })} />}
                      label="Mark as offer"
                      sx={{ mt: 1.5, display: 'block' }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
              <Button onClick={handleClose} disabled={processing}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={processing} startIcon={processing ? <CircularProgress size={18} /> : <HeroIcon name="save" size={18} />}>
                {processing ? 'Saving…' : editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default ProductManagement;
