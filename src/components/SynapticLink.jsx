import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

/**
 * Animated synaptic link between two neurons.
 * @param {Object} props
 * @param {Array} props.start - [x, y, z] start position
 * @param {Array} props.end - [x, y, z] end position
 * @param {boolean} props.isActive - true if either connected neuron is selected
 * @param {number} props.weight - synapse weight (0-1)
 */
export default function SynapticLink({ start, end, isActive, weight }) {
  const lineRef = useRef();

  useFrame((state, delta) => {
    if (lineRef.current && lineRef.current.material) {
      // Flowing dash offset
      lineRef.current.material.dashOffset -= delta * 0.5;
    }
  });

  const baseOpacity = 0.2 + (weight * 0.3);
  const activeOpacity = 0.6 + (weight * 0.4);
  const color = isActive ? '#06b6d4' : '#888888';
  const lineWidth = isActive ? 2 : 1;
  const opacity = isActive ? activeOpacity : baseOpacity;

  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={true}
      dashSize={0.15}
      gapSize={0.1}
      dashOffset={0}
    />
  );
}
