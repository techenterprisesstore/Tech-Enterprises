import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../../services/offerService';
import { getAllUsers } from '../../services/userService';
import { formatCurrency } from '../../utils/format';

const OfferFormDialog = ({ open, onClose, onSuccess, offer = null, users = [] }) => {
  const isEdit = !!offer?.id;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [targetUserIds, setTargetUserIds] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (offer) {
        setName(offer.name || '');
        setCode(offer.code || '');
        setDiscountType(offer.discountType === 'amount' ? 'amount' : 'percent');
        setDiscountValue(String(offer.discountValue ?? ''));
        setTargetUserIds(Array.isArray(offer.targetUserIds) ? offer.targetUserIds : []);
        setStartDate(offer.startDate ? offer.startDate.slice(0, 10) : '');
        setEndDate(offer.endDate ? offer.endDate.slice(0, 10) : '');
        setIsActive(offer.isActive !== false);
      } else {
        setName('');
        setCode('');
        setDiscountType('percent');
        setDiscountValue('');
        setTargetUserIds([]);
        setStartDate('');
        setEndDate('');
        setIsActive(true);
      }
      setError('');
    }
  }, [open, offer]);

  const handleSubmit = async () => {
    const trimmedCode = (code || '').trim().toUpperCase();
    if (!trimmedCode) {
      setError('Coupon code is required');
      return;
    }
    const numVal = parseFloat(discountValue);
    if (isNaN(numVal) || numVal < 0) {
      setError('Discount value must be a positive number');
      return;
    }
    if (discountType === 'percent' && numVal > 100) {
      setError('Percent discount cannot exceed 100');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = {
        name: (name || trimmedCode).trim(),
        code: trimmedCode,
        discountType,
        discountValue: numVal,
        targetUserIds,
        startDate: startDate || null,
        endDate: endDate || null,
        isActive,
      };
      const result = isEdit ? await updateOffer(offer.id, data) : await createOffer(data);
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Failed to save offer');
      }
    } catch (err) {
      setError(err.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId) => {
    setTargetUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (targetUserIds.length === users.length) {
      setTargetUserIds([]);
    } else {
      setTargetUserIds(users.map((u) => u.id));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 600 }}>{isEdit ? 'Edit offer' : 'Add offer'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Offer name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Sale"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Coupon code"
          size="small"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SAVE20"
          helperText="Users will enter this at checkout. Stored in uppercase."
          sx={{ mb: 2 }}
          disabled={isEdit}
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Discount type</InputLabel>
            <Select
              value={discountType}
              label="Discount type"
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <MenuItem value="percent">Percent (%)</MenuItem>
              <MenuItem value="amount">Fixed amount (₹)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={discountType === 'percent' ? 'Percent' : 'Amount (₹)'}
            type="number"
            size="small"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            inputProps={{ min: 0, max: discountType === 'percent' ? 100 : undefined }}
            sx={{ flex: 1 }}
          />
        </Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          Who can use this offer?
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Leave none selected to allow all users. Or select specific users/employees.
        </Typography>
        <Button size="small" onClick={selectAllUsers} sx={{ mb: 1 }}>
          {targetUserIds.length === users.length ? 'Deselect all' : 'Select all users'}
        </Button>
        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
          <List dense>
            {users.map((u) => (
              <ListItem key={u.id} dense>
                <Checkbox
                  checked={targetUserIds.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                  size="small"
                />
                <ListItemText primary={u.name || u.email} secondary={u.email} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            ))}
            {users.length === 0 && (
              <ListItem>
                <ListItemText primary="No users loaded" secondary="Save offer to allow all users" />
              </ListItem>
            )}
          </List>
        </Paper>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Start date (optional)"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="End date (optional)"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
        </Box>
        <FormControlLabel
          control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
          label="Active (visible and usable)"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={22} /> : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [offersRes, usersRes] = await Promise.all([getOffers(), getAllUsers()]);
    if (offersRes.success) setOffers(offersRes.offers);
    if (usersRes.success) setUsers(usersRes.users);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer? It can no longer be used.')) return;
    setDeletingId(id);
    const result = await deleteOffer(id);
    setDeletingId(null);
    if (result.success) await loadData();
  };

  const discountLabel = (o) => {
    if (o.discountType === 'percent') return `${o.discountValue}% off`;
    return `${formatCurrency(Number(o.discountValue))} off`;
  };

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Admin
              </Typography>
              <Typography variant="h5" fontWeight={600}>Offers & Coupons</Typography>
              <Typography variant="body2" color="text.secondary">Create coupons and choose which users can use them.</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => { setEditingOffer(null); setDialogOpen(true); }}
              sx={{ borderRadius: 2 }}
            >
              Add offer
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : offers.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Tag size={40} style={{ color: '#9ca3af', marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>No offers yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Create a coupon to show on the user offers page and use at checkout.</Typography>
              <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setEditingOffer(null); setDialogOpen(true); }}>
                Add offer
              </Button>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ overflow: 'auto' }}>
                {offers.map((offer) => (
                  <Box
                    key={offer.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                      p: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tag size={20} style={{ color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>{offer.name || offer.code}</Typography>
                        <Typography variant="caption" color="text.secondary">Code: {offer.code}</Typography>
                      </Box>
                    </Box>
                    <Chip label={discountLabel(offer)} size="small" color="primary" variant="outlined" />
                    <Chip
                      label={(offer.targetUserIds || []).length === 0 ? 'All users' : `${(offer.targetUserIds || []).length} users`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip label={offer.isActive ? 'Active' : 'Inactive'} size="small" color={offer.isActive ? 'success' : 'default'} sx={{ ml: 'auto' }} />
                    <IconButton size="small" onClick={() => { setEditingOffer(offer); setDialogOpen(true); }}><Pencil size={16} /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(offer.id)} disabled={deletingId === offer.id}>
                      {deletingId === offer.id ? <CircularProgress size={16} /> : <Trash2 size={16} />}
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Container>
      </Box>

      <OfferFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingOffer(null); }}
        onSuccess={loadData}
        offer={editingOffer}
        users={users}
      />
    </ProtectedRoute>
  );
};

export default OfferManagement;
