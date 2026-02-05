import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import HeroIcon from '../Common/HeroIcon';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';

const LoginModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signInWithEmail(formData.email, formData.password);

    if (result.success) {
      onClose();
      navigate(result.user.role === 'admin' ? '/admin' : '/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const result = await signInWithGoogle();

    if (result.success) {
      onClose();
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 3,
          position: 'relative',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/assets/whitelogo.png"
            alt="Tech Enterprise Logo"
            sx={{
              height: 40,
              width: 'auto',
            }}
            onError={(e) => {
              e.target.src = '/assets/secondarylogo.png';
            }}
          />
          <Typography variant="h5" fontWeight={700}>
            Welcome Back
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <HeroIcon name="close" size={24} color="white" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, px: 4, pb: 4 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 1,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              }
            }}
            icon={<HeroIcon name="error" size={20} />}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HeroIcon name="email" size={20} color="text.secondary" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HeroIcon name="lock" size={20} color="text.secondary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'text.secondary' }}
                  >
                    <HeroIcon name={showPassword ? 'eyeSlash' : 'eye'} size={20} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={loading ? null : <HeroIcon name="arrowRight" size={20} color="white" solid />}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: 1,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
            }}
            disabled={loading}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Signing in...
              </Box>
            ) : (
              'Sign In'
            )}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            OR
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<HeroIcon name="google" size={20} />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          sx={{
            py: 1.5,
            borderRadius: 1,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            }
          }}
        >
          Sign in with Google
        </Button>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              to="/signup"
              onClick={onClose}
              style={{
                textDecoration: 'none',
                color: '#2e4bf7',
                fontWeight: 600
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
