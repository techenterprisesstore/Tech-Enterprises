import { Container, Paper, Typography, Box, Alert } from '@mui/material';
import HeroIcon from './HeroIcon';

const FirebaseConfigError = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 1, textAlign: 'center' }}>
        <HeroIcon name="error" size={64} color="error.main" sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Firebase Configuration Required
        </Typography>
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          Please configure Firebase to use this application.
        </Alert>
        <Box sx={{ mt: 3, textAlign: 'left' }}>
          <Typography variant="body1" gutterBottom>
            <strong>Steps to fix:</strong>
          </Typography>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Create a <code>.env</code> file in the root directory</li>
            <li>Copy the contents from <code>.env.example</code></li>
            <li>Add your Firebase project credentials</li>
            <li>Restart the development server</li>
          </ol>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            See README.md for detailed setup instructions.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default FirebaseConfigError;
