import React from 'react';
import { Box, Typography } from '@mui/material';

const HeaderBar: React.FC = () => {
  // Authentication removed, simplified header
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h6" fontWeight={600}>
        AI Data Agent
      </Typography>
    </Box>
  );
};

export default HeaderBar;

