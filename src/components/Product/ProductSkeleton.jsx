import { Box, Skeleton } from '@mui/material';

const ProductSkeleton = () => {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%',
          bgcolor: 'background.default',
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 0,
          }}
          animation="wave"
        />
      </Box>
      <Box sx={{ p: 1.75 }}>
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.25 }}>
          <Skeleton variant="rounded" width={80} height={18} />
          <Skeleton variant="text" width={32} height={16} />
        </Box>
        <Skeleton variant="text" width={70} height={24} sx={{ mb: 1.25 }} />
        <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
};

export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </>
  );
};

export default ProductSkeleton;
