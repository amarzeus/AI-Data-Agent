import React, { useMemo } from 'react'
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
  gap?: number
  minHeight?: number
}

// Animation variants for grid items
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  })
}

const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className = '',
  gap = 3,
  minHeight = 400
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))

  // Calculate responsive grid configuration
  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        columns: 1,
        rows: 'auto',
        areas: ['chat', 'upload', 'viz', 'history']
      }
    } else if (isTablet) {
      return {
        columns: 2,
        rows: 'auto',
        areas: ['chat upload', 'viz viz', 'history history']
      }
    } else {
      return {
        columns: 3,
        rows: 'auto',
        areas: ['chat chat upload', 'viz viz viz', 'history history history']
      }
    }
  }, [isMobile, isTablet])

  const childrenArray = React.Children.toArray(children)

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      className={className}
      sx={{
        minHeight,
        width: '100%',
        position: 'relative'
      }}
    >
      <Grid
        container
        spacing={gap}
        sx={{
          height: '100%',
          gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
          gridTemplateRows: gridConfig.rows,
          gridTemplateAreas: {
            xs: gridConfig.areas.join(' '),
            sm: gridConfig.areas.join(' '),
            md: gridConfig.areas.join(' '),
            lg: gridConfig.areas.join(' ')
          },
          gap: theme.spacing(gap)
        }}
      >
        {childrenArray.map((child, index) => (
          <Box
            key={index}
            component={motion.div}
            custom={index}
            variants={itemVariants}
            sx={{
              gridArea: {
                xs: gridConfig.areas[index % gridConfig.areas.length],
                sm: gridConfig.areas[index % gridConfig.areas.length],
                md: gridConfig.areas[index % gridConfig.areas.length],
                lg: gridConfig.areas[index % gridConfig.areas.length]
              }
            }}
          >
            {child}
          </Box>
        ))}
      </Grid>

      {/* Background gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.gradients?.primary,
          opacity: 0.02,
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
    </Box>
  )
}

export default BentoGrid
