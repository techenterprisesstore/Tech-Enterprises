import { Card, CardContent, Skeleton, Box } from '@mui/material';

const ProductSkeleton = () => {
  return (
    <Card sx={{ height: '100%', borderRadius: 1 }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="60%" height={24} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </CardContent>
    </Card>
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
