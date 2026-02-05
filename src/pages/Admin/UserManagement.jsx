import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Grid,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar
} from '@mui/material';
import { getAllUsers, updateUserRole } from '../../services/userService';
import { formatDate } from '../../utils/format';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import HeroIcon from '../../components/Common/HeroIcon';
import { useAuth } from '../../hooks/useAuth';

const UserManagement = () => {
  const { profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState({});
  const [roleChanges, setRoleChanges] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
      // Initialize role changes with current roles
      const initialRoles = {};
      result.users.forEach(user => {
        initialRoles[user.id] = user.role;
      });
      setRoleChanges(initialRoles);
    }
    setLoading(false);
  };

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
    setError('');
  };

  const handleSaveRole = async (userId) => {
    const newRole = roleChanges[userId];
    if (!newRole || newRole === users.find(u => u.id === userId)?.role) {
      return; // No change
    }

    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    setError('');

    const result = await updateUserRole(userId, newRole);
    
    if (result.success) {
      // Reload users to get updated data
      await loadUsers();
    } else {
      setError(result.error || 'Failed to update role');
      // Revert the change
      setRoleChanges(prev => ({
        ...prev,
        [userId]: users.find(u => u.id === userId)?.role
      }));
    }
    
    setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
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
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>Admin</Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>Users</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage roles. Save to apply changes.</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {users.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No users found
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {users.map((user) => {
              const currentRole = roleChanges[user.id] || user.role;
              const hasChanges = currentRole !== user.role;
              const isUpdating = updatingRoles[user.id];
              const isCurrentUser = currentUserProfile?.id === user.id;
              const displayName = user.name || (user.email ? user.email.split('@')[0] : '?');
              const initial = displayName.trim() ? displayName.trim()[0].toUpperCase() : (user.email || '?')[0].toUpperCase();
              const photoUrl = user.photoURL || user.photoUrl || user.avatar;

              return (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      <Avatar
                        src={photoUrl}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: photoUrl ? 'transparent' : '#6366f1',
                          fontSize: '1.1rem',
                          fontWeight: 600
                        }}
                      >
                        {photoUrl ? null : initial}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {user.name || user.email?.split('@')[0] || 'N/A'}
                          </Typography>
                          {isCurrentUser && (
                            <Chip label="You" size="small" color="primary" sx={{ height: 20 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {user.email}
                        </Typography>
                        {user.phone && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {user.phone}
                          </Typography>
                        )}
                        {user.createdAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            Joined {formatDate(user.createdAt)}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={currentRole}
                        label="Role"
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isUpdating || isCurrentUser}
                        sx={{ borderRadius: 1.5 }}
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip
                        label={currentRole === 'admin' ? 'Admin' : 'User'}
                        color={currentRole === 'admin' ? 'error' : 'default'}
                        size="small"
                        sx={{ height: 22 }}
                      />
                      <Chip label={user.provider === 'google' ? 'Google' : 'Email'} size="small" sx={{ height: 22 }} />
                      {hasChanges && !isUpdating && (
                        <Tooltip title="Save changes">
                          <IconButton size="small" color="primary" onClick={() => handleSaveRole(user.id)} disabled={isCurrentUser}>
                            <HeroIcon name="save" size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isUpdating && <CircularProgress size={20} />}
                    </Box>

                    {isCurrentUser && (
                      <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                        You cannot change your own role
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default UserManagement;
