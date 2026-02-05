import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  CircularProgress,
  Alert,
} from '@mui/material';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { getAllRatingsForAdmin } from '../../services/ratingService';
import { formatDate } from '../../utils/format';

const RatingManagement = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    setError('');
    const result = await getAllRatingsForAdmin();
    if (result.success) {
      setRatings(result.ratings || []);
    } else {
      setError(result.error || 'Failed to load ratings');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
            Admin
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
            Product Ratings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            All ratings and reviews submitted by users.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {ratings.length === 0 ? (
            <Alert severity="info">
              No ratings yet. Ratings will appear here when users rate products on the product detail page.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Review</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ratings.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" noWrap title={r.productName}>
                          {r.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{r.userName}</Typography>
                        {r.userEmail && (
                          <Typography variant="caption" color="text.secondary">
                            {r.userEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Rating value={r.rating} readOnly size="small" precision={0.5} />
                        <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                          {r.rating}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        {r.reviewText ? (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {r.reviewText}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {r.updatedAt ? formatDate(r.updatedAt) : (r.createdAt ? formatDate(r.createdAt) : '—')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default RatingManagement;
