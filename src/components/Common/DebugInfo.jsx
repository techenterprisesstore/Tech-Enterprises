import { Paper, Typography, Box, Button } from '@mui/material';
import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const DebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const products = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      
      setDebugInfo({
        count: products.length,
        products: products,
        dbInitialized: !!db,
        collectionName: 'products'
      });
    } catch (error) {
      setDebugInfo({
        error: error.message,
        code: error.code,
        dbInitialized: !!db
      });
    }
    setLoading(false);
  };

  if (!debugInfo) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 1 }}>
        <Button onClick={checkProducts} disabled={loading} variant="outlined" size="small">
          {loading ? 'Checking...' : 'Debug: Check Products in Firestore'}
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>Debug Information</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2"><strong>DB Initialized:</strong> {debugInfo.dbInitialized ? 'Yes' : 'No'}</Typography>
        {debugInfo.count !== undefined && (
          <Typography variant="body2"><strong>Products Found:</strong> {debugInfo.count}</Typography>
        )}
        {debugInfo.error && (
          <Typography variant="body2" color="error"><strong>Error:</strong> {debugInfo.error}</Typography>
        )}
        {debugInfo.code && (
          <Typography variant="body2" color="error"><strong>Error Code:</strong> {debugInfo.code}</Typography>
        )}
      </Box>
      {debugInfo.products && debugInfo.products.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Product List:</Typography>
          {debugInfo.products.map((p, i) => (
            <Typography key={i} variant="caption" sx={{ display: 'block' }}>
              {i + 1}. {p.name || 'Unnamed'} (ID: {p.id})
            </Typography>
          ))}
        </Box>
      )}
      <Button onClick={() => setDebugInfo(null)} size="small" sx={{ mt: 2 }}>
        Close
      </Button>
    </Paper>
  );
};

export default DebugInfo;
