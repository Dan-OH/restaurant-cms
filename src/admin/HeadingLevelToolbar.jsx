import FloatingToolbar, { ToolbarButton } from './FloatingToolbar.jsx'

// The floating toolbar for a section's heading: picks its level. Loaded on demand by
// src/sections/EditableHeading.jsx, which documents the props.
export default function HeadingLevelToolbar({ levels, level, onLevelChange }) {
  return (
    <FloatingToolbar label="Heading level">
      {levels.map((option) => (
        <ToolbarButton
          key={option.id}
          label={option.label}
          active={option.id === level}
          onClick={() => onLevelChange(option.id)}
        >
          H{option.id}
        </ToolbarButton>
      ))}
    </FloatingToolbar>
  )
}
