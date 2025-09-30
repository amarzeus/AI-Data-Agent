import React, { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { ChartData } from '../../types'

interface Chart3DProps {
  data: ChartData
  height?: number
  width?: number
}

// 3D Bar Chart Component
const Bar3D: React.FC<{ data: any[]; position: [number, number, number] }> = ({ data, position }) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  const bars = useMemo(() => {
    return data.map((item, index) => {
      const height = (item.value / Math.max(...data.map(d => d.value))) * 2
      const color = new THREE.Color().setHSL((index / data.length) * 0.8, 0.7, 0.5)

      return (
        <mesh
          key={index}
          position={[
            position[0] + (index - data.length / 2) * 0.5,
            position[1] + height / 2,
            position[2]
          ]}
          ref={meshRef}
        >
          <boxGeometry args={[0.3, height, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    })
  }, [data, position])

  return <>{bars}</>
}

// 3D Scatter Plot Component
const Scatter3D: React.FC<{ data: any[]; position: [number, number, number] }> = ({ data, position }) => {
  const points = useMemo(() => {
    return data.map((_, index) => {
      const x = (Math.random() - 0.5) * 4
      const y = (Math.random() - 0.5) * 4
      const z = (Math.random() - 0.5) * 4

      return (
        <mesh key={index} position={[position[0] + x, position[1] + y, position[2] + z]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color={`hsl(${(index / data.length) * 360}, 70%, 50%)`} />
        </mesh>
      )
    })
  }, [data, position])

  return <>{points}</>
}

// 3D Surface Plot Component
const Surface3D: React.FC<{ data: any[]; position: [number, number, number] }> = ({ position }) => {
  const surfaceRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (surfaceRef.current) {
      surfaceRef.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })

  const geometry = useMemo(() => {
    const width = 20
    const height = 20
    const geometry = new THREE.PlaneGeometry(4, 4, width - 1, height - 1)

    const positions = geometry.attributes.position
    const colors = []

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)

      // Create wave-like surface
      const z = Math.sin(x * 2) * Math.cos(y * 2) * 0.5
      positions.setZ(i, z)

      // Color based on height
      const hue = (z + 0.5) / 1
      const color = new THREE.Color().setHSL(hue, 0.7, 0.5)
      colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    return geometry
  }, [])

  return (
    <mesh ref={surfaceRef} position={position} geometry={geometry}>
      <meshStandardMaterial vertexColors />
    </mesh>
  )
}

// Main 3D Chart Component
const Chart3D: React.FC<Chart3DProps> = ({
  data,
  height = 400,
  width = '100%'
}) => {
  const [chartType, setChartType] = useState<'bars' | 'scatter' | 'surface'>('bars')

  const renderChart = () => {
    switch (chartType) {
      case 'bars':
        return <Bar3D data={data.data || []} position={[0, 0, 0]} />
      case 'scatter':
        return <Scatter3D data={data.data || []} position={[0, 0, 0]} />
      case 'surface':
        return <Surface3D data={data.data || []} position={[0, 0, 0]} />
      default:
        return <Bar3D data={data.data || []} position={[0, 0, 0]} />
    }
  }

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        height,
        width,
        overflow: 'hidden',
        borderRadius: 3,
        position: 'relative'
      }}
    >
      <CardContent sx={{ p: 0, height: '100%' }}>
        {/* Chart Type Selector */}
        <div className="chart-type-selector">
          {(['bars', 'scatter', 'surface'] as const).map((type) => (
            <Box
              key={type}
              component="button"
              onClick={() => setChartType(type)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: chartType === type ? 600 : 400,
                backgroundColor: chartType === type ? 'primary.main' : 'transparent',
                color: chartType === type ? 'white' : 'text.primary',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: chartType === type ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              {type}
            </Box>
          ))}
        </div>

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />

          {/* Grid Helper */}
          <gridHelper args={[10, 10]} />

          {/* Render Chart */}
          {renderChart()}

          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
          />

          {/* Axes Labels */}
          <Text
            position={[3, 0, 0]}
            fontSize={0.2}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            {data.xAxis || 'X Axis'}
          </Text>
          <Text
            position={[0, 3, 0]}
            fontSize={0.2}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            {data.yAxis || 'Y Axis'}
          </Text>
          <Text
            position={[0, 0, 3]}
            fontSize={0.2}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            Z Axis
          </Text>
        </Canvas>

        {/* Chart Title */}
        <div className="chart-title">
          <Typography variant="subtitle2">
            {data.title || '3D Data Visualization'}
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default Chart3D
