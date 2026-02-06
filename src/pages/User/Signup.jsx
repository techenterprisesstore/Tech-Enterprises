import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import HeroIcon from '../../components/Common/HeroIcon';
import { registerWithEmail, signInWithGoogle } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const cardStyles = {
  width: '100%',
  maxWidth: 420,
  bgcolor: '#fff',
  borderRadius: 3,
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  p: 3.5,
};

const Signup = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && profile) navigate('/', { replace: true });
  }, [profile, authLoading, navigate]);

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          bgcolor: '#f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={28} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (profile) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await registerWithEmail(formData.email, formData.password, formData.name, formData.phone);
    if (result.success) navigate('/');
    else setError(result.error);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const result = await signInWithGoogle();
    if (result.success) navigate('/');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Box sx={cardStyles}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
          <Box
            component="img"
            src="/assets/primarylogo.png"
            alt="Tech Enterprises"
            sx={{ height: 40, width: 'auto' }}
            onError={(e) => {
              e.target.src = '/assets/applogo.png';
            }}
          />
          
        </Box>

        <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Create account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign up to get started
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#fff',
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            autoComplete="email"
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#fff',
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
          />
          <TextField
            fullWidth
            label="Phone (optional)"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            variant="outlined"
            size="small"
            placeholder="+91 98765 43210"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#fff',
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            placeholder="Password *"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="new-password"
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    <HeroIcon name={showPassword ? 'eyeSlash' : 'eye'} size={20} color="text.secondary" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#fff',
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
          />
          <TextField
            fullWidth
            label="Confirm password"
            placeholder="Confirm password *"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                    <HeroIcon name={showConfirmPassword ? 'eyeSlash' : 'eye'} size={20} color="text.secondary" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#fff',
                '& fieldset': { borderColor: '#e0e0e0' },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              mt: 0.5,
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign up'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.primary" sx={{ textAlign: 'center', my: 2 }}>
          or
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<HeroIcon name="google" size={20} />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          sx={{
            py: 1.25,
            borderRadius: 1.5,
            fontWeight: 500,
            textTransform: 'none',
            borderColor: '#e0e0e0',
            color: 'text.primary',
            bgcolor: '#fff',
          }}
        >
          Continue with Google
        </Button>
        <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Log in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Signup;
