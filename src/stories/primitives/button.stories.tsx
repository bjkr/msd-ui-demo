import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../ui/primitives/Button/Button'
import { IconCart, IconChevronRight } from 'icons'

const meta: Meta<typeof Button> = {
  title: 'MSD UI Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}
export default meta

export const StoryButtonBrand: StoryObj<typeof Button> = {
  name: 'Brand',
  args: {
    children: 'Button',
    variant: 'brand',
    disabled: false,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/aVsuHSoTzKm2LX5OpE6ulY/MSD-UI-Demo?node-id=10-3&t=PJU8EKjW9t2FXEwa-4',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonBrandSmall: StoryObj<typeof Button> = {
  name: 'Brand Small',
  args: {
    children: 'Button',
    variant: 'brand',
    size: 'sm',
    disabled: false,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/aVsuHSoTzKm2LX5OpE6ulY/MSD-UI-Demo?node-id=10-44&t=PJU8EKjW9t2FXEwa-4',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonBrandDisabled: StoryObj<typeof Button> = {
  name: 'Brand Disabled',
  args: {
    children: 'Button',
    variant: 'brand',
    disabled: true,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/aVsuHSoTzKm2LX5OpE6ulY/MSD-UI-Demo?node-id=10-9&t=PJU8EKjW9t2FXEwa-4',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonPrimary: StoryObj<typeof Button> = {
  name: 'Primary',
  args: {
    children: 'Button',
    disabled: false,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/aVsuHSoTzKm2LX5OpE6ulY/MSD-UI-Demo?node-id=10-359&t=PJU8EKjW9t2FXEwa-4',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonPrimarySmall: StoryObj<typeof Button> = {
  name: 'Primary Small',
  args: {
    children: 'Button',
    disabled: false,
    asChild: false,
    size: 'sm',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/aVsuHSoTzKm2LX5OpE6ulY/MSD-UI-Demo?node-id=10-366&t=PJU8EKjW9t2FXEwa-4',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonPrimaryDisabled: StoryObj<typeof Button> = {
  name: 'Primary Disabled',
  args: {
    children: 'Button',
    disabled: true,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/aVsuHSoTzKm2LX5OpE6ulY/MSD-UI-Demo?node-id=10-401&t=PJU8EKjW9t2FXEwa-4',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonSecondary: StoryObj<typeof Button> = {
  name: 'Secondary',
  args: {
    children: 'Button',
    variant: 'secondary',
    disabled: false,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonSecondarySmall: StoryObj<typeof Button> = {
  name: 'Secondary Small',
  args: {
    children: 'Button',
    variant: 'secondary',
    disabled: false,
    size: 'sm',
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonSecondaryDisabled: StoryObj<typeof Button> = {
  name: 'Secondary Disabled',
  args: {
    children: 'Button',
    variant: 'secondary',
    disabled: true,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonTertiary: StoryObj<typeof Button> = {
  name: 'Tertiary',
  args: {
    children: 'Button',
    variant: 'tertiary',
    disabled: false,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonTertiarySmall: StoryObj<typeof Button> = {
  name: 'Tertiary Small',
  args: {
    children: 'Button',
    variant: 'tertiary',
    disabled: false,
    size: 'sm',
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonTertiaryDisabled: StoryObj<typeof Button> = {
  name: 'Tertiary Disabled',
  args: {
    children: 'Button',
    variant: 'tertiary',
    disabled: true,
    asChild: false,
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => <Button {...props}>{children}</Button>,
}

export const StoryButtonWithLeadingIcon: StoryObj<typeof Button> = {
  name: 'With Leading Icon',
  args: {
    children: 'Button',
    size: 'md',
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => (
    <Button {...props}>
      <IconCart className="-ml-1.5" />
      {children}
    </Button>
  ),
}

export const StoryButtonWithTrailingIcon: StoryObj<typeof Button> = {
  name: 'With Trailing Icon',
  args: {
    children: 'Button',
    size: 'md',
  },
  parameters: {
    design: {
      type: 'figma',
      url: '',
    },
  },
  render: ({ children, ...props }) => (
    <Button {...props}>
      {children}
      <IconChevronRight className="-mr-1.5" />
    </Button>
  ),
}
