import figma from '@figma/code-connect'
import { Button } from 'primitives'

const sharedBaseProps = {
  disabled: figma.enum('state', { disabled: true }),
}

const buttonProps = {
  label: figma.string('label'),
  iconLeading: figma.boolean('with leading icon', {
    true: figma.instance('leading icon'),
    false: undefined,
  }),
  iconTrailing: figma.boolean('with trailing icon', {
    true: figma.instance('trailing icon'),
    false: undefined,
  }),
  size: figma.enum('size', { small: 'sm', medium: 'md' }),
  ...sharedBaseProps,
}

const iconButtonProps = {
  iconLeading: figma.instance('leading icon'),
  size: figma.enum('size', { small: 'iconSm', medium: 'icon' }),
  ...sharedBaseProps,
}

figma.connect(Button, '<FIGMA_BUTTON_BRAND>', {
  props: {
    ...buttonProps,
  },
  example: ({ label, iconLeading, iconTrailing, ...props }) => (
    <Button onClick={() => {}} variant="brand" {...props}>
      {iconLeading}
      {label}
      {iconTrailing}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_PRIMARY>', {
  props: { ...buttonProps },
  example: ({ label, iconLeading, iconTrailing, ...props }) => (
    <Button onClick={() => {}} variant="primary" {...props}>
      {iconLeading}
      {label}
      {iconTrailing}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_SECONDARY>', {
  props: { ...buttonProps },
  example: ({ label, iconLeading, iconTrailing, ...props }) => (
    <Button onClick={() => {}} variant="secondary" {...props}>
      {iconLeading}
      {label}
      {iconTrailing}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_TERTIARY>', {
  props: { ...buttonProps },
  example: ({ label, iconLeading, iconTrailing, ...props }) => (
    <Button onClick={() => {}} variant="tertiary" {...props}>
      {iconLeading}
      {label}
      {iconTrailing}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_ICON_BRAND>', {
  props: {
    ...iconButtonProps,
  },
  example: ({ iconLeading, ...props }) => (
    <Button onClick={() => {}} variant="brand" {...props}>
      {iconLeading}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_ICON_PRIMARY>', {
  props: {
    ...iconButtonProps,
  },
  example: ({ iconLeading, ...props }) => (
    <Button onClick={() => {}} variant="primary" {...props}>
      {iconLeading}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_ICON_SECONDARY>', {
  props: {
    ...iconButtonProps,
  },
  example: ({ iconLeading, ...props }) => (
    <Button onClick={() => {}} variant="secondary" {...props}>
      {iconLeading}
    </Button>
  ),
})

figma.connect(Button, '<FIGMA_BUTTON_ICON_TERTIARY>', {
  props: {
    ...iconButtonProps,
  },
  example: ({ iconLeading, ...props }) => (
    <Button onClick={() => {}} variant="tertiary" {...props}>
      {iconLeading}
    </Button>
  ),
})
