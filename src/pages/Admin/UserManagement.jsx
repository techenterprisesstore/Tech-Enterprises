import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { getAllUsers, deleteUser } from '../../services/userService';
import { formatDate } from '../../utils/format';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import HeroIcon from '../../components/Common/HeroIcon';
import { useAuth } from '../../hooks/useAuth';

const PROVIDER_COLORS = {
  google: { bg: '#fff3e0', color: '#e65100', label: 'Google' },
  email: { bg: '#e8f5e9', color: '#2e7d32', label: 'Email' },
};

const ROLE_COLORS = {
  admin: { bg: '#fff1f2', color: '#be123c' },
  user: { bg: '#f0f9ff', color: '#0369a1' },
};

const UserManagement = () => {
  const { profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // user object to confirm delete
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
    }
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteUser(deleteTarget.id);
    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    } else {
      setError(result.error || 'Failed to delete user');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filteredUsers = users
    .filter(u => {
      const q = search.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    })
    // Admins first, then by join order (already asc from Firestore)
    .sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return 0;
    });

  const headerStyle = {
    fontWeight: 700,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#64748b',
    py: 1.5,
    px: 2,
    borderBottom: '1px solid #e2e8f0',
    bgcolor: '#f8fafc',
    whiteSpace: 'nowrap',
  };

  const cellStyle = {
    py: 1.5,
    px: 2,
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>

          {/* Header */}
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
            Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.25 }}>Users</Typography>
              <Typography variant="body2" color="text.secondary">
                {users.length} member{users.length !== 1 ? 's' : ''} total
              </Typography>
            </Box>

            {/* Search */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2,
              px: 1.5, py: 0.75, minWidth: 220,
              '&:focus-within': { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' },
              transition: 'all 0.2s',
            }}>
              <HeroIcon name="search" size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <InputBase
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ fontSize: '0.875rem', flex: 1 }}
              />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Table */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerStyle, width: 40 }}>#</TableCell>
                    <TableCell sx={headerStyle}>User</TableCell>
                    <TableCell sx={headerStyle}>Email</TableCell>
                    <TableCell sx={headerStyle}>Provider</TableCell>
                    <TableCell sx={headerStyle}>Role</TableCell>
                    <TableCell sx={headerStyle}>Joined</TableCell>
                    <TableCell sx={{ ...headerStyle, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                        {search ? `No users matching "${search}"` : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, idx) => {
                      const isCurrentUser = currentUserProfile?.id === user.id;
                      const displayName = user.name || user.email?.split('@')[0] || 'N/A';
                      const initial = displayName.trim()[0]?.toUpperCase() || '?';
                      const photoUrl = user.photoURL || user.photoUrl || user.avatar;
                      const provider = user.provider === 'google' ? 'google' : 'email';
                      const providerStyle = PROVIDER_COLORS[provider];
                      const role = user.role || 'user';
                      const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.user;

                      return (
                        <TableRow
                          key={user.id}
                          sx={{
                            position: 'relative',
                            bgcolor: role === 'admin'
                              ? 'rgba(99,102,241,0.04)'
                              : isCurrentUser
                                ? 'rgba(99,102,241,0.02)'
                                : '#fff',
                            borderLeft: role === 'admin' ? '3px solid #6366f1' : '3px solid transparent',
                            '&:hover': {
                              bgcolor: role === 'admin' ? 'rgba(99,102,241,0.08)' : '#f8fafc',
                            },
                            transition: 'background 0.15s',
                          }}
                        >
                          {/* # */}
                          <TableCell sx={{ ...cellStyle, color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                            {idx + 1}
                          </TableCell>

                          {/* User */}
                          <TableCell sx={cellStyle}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={photoUrl}
                                sx={{
                                  width: 38, height: 38,
                                  bgcolor: photoUrl ? 'transparent' : (role === 'admin' ? '#6366f1' : '#94a3b8'),
                                  fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
                                  boxShadow: role === 'admin' ? '0 0 0 2px #818cf8' : 'none',
                                }}
                              >
                                {!photoUrl && initial}
                              </Avatar>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.885rem', color: '#0f172a' }}>
                                    {displayName}
                                  </Typography>
                                  {isCurrentUser && (
                                    <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                                  )}
                                </Box>
                                {user.phone && (
                                  <Typography variant="caption" color="text.secondary">{user.phone}</Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Email */}
                          <TableCell sx={{ ...cellStyle, color: '#475569', fontSize: '0.85rem' }}>
                            {user.email || '—'}
                          </TableCell>

                          {/* Provider */}
                          <TableCell sx={cellStyle}>
                            <Chip
                              label={providerStyle.label}
                              size="small"
                              sx={{ bgcolor: providerStyle.bg, color: providerStyle.color, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                            />
                          </TableCell>

                          {/* Role */}
                          <TableCell sx={cellStyle}>
                            <Chip
                              label={role.charAt(0).toUpperCase() + role.slice(1)}
                              size="small"
                              sx={{
                                bgcolor: roleStyle.bg,
                                color: roleStyle.color,
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                height: 24,
                                px: 0.5,
                                border: `1px solid ${role === 'admin' ? '#fca5a5' : '#bae6fd'}`,
                                letterSpacing: '0.03em',
                              }}
                            />
                          </TableCell>

                          {/* Joined */}
                          <TableCell sx={{ ...cellStyle, color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            {user.createdAt ? formatDate(user.createdAt) : '—'}
                          </TableCell>

                          {/* Actions */}
                          <TableCell sx={{ ...cellStyle, textAlign: 'center' }}>
                            {isCurrentUser ? (
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>—</Typography>
                            ) : (
                              <Tooltip title="Delete user">
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteTarget(user)}
                                  sx={{
                                    color: '#ef4444',
                                    '&:hover': { bgcolor: '#fff1f2' },
                                    width: 32, height: 32,
                                  }}
                                >
                                  <HeroIcon name="trash" size={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer */}
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 0.5, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
          Delete User?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem', color: '#475569' }}>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name || deleteTarget?.email}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            variant="contained"
            size="small"
            color="error"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, minWidth: 80 }}
          >
            {deleting ? <CircularProgress size={16} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
};

export default UserManagement;
