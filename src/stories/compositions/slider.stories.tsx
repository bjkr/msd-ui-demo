import type { Meta, StoryObj } from '@storybook/react-vite'
import Fade from 'embla-carousel-fade'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPrevious,
} from '../../ui/compositions/Carousel'
import { cn } from 'utils'

const meta: Meta<typeof Carousel> = {
  title: 'MSD UI Compositions/Carousel',
  component: Carousel,
  decorators: [
    (Story) => (
      <div className="w-full h-full flex justify-center items-center overflow-hidden py-16 px-8">
        <div className="container overflow-visible">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}
export default meta

export const StoryCarouselDefault: StoryObj<typeof Carousel> = {
  name: 'Default',
  args: {},
  render: ({ ...props }) => (
    <Carousel className="w-full" opts={{ duration: 20 }}>
      <div className="flex items-center justify-between py-3">
        <h3 className="text-2xl font-bold">Carousel title</h3>
        <div className="flex items-center justify-end gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>
      <CarouselContent className="-ml-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <CarouselItem className="pl-4 basis-1/3" key={index}>
            <div className="flex items-center justify-center p-1 h-64 border border-neutral-300 rounded-lg">
              <span className="text-4xl font-semibold">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  ),
}

export const StoryCarouselHero: StoryObj<typeof Carousel> = {
  name: 'Hero',
  args: {},
  render: ({ ...props }) => (
    <Carousel
      className="w-full"
      opts={{ duration: 20, containScroll: false }}
      plugins={[Fade()]}
    >
      <CarouselContent>
        {Array.from({ length: 8 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="flex items-center justify-center p-1 aspect-4/3 bg-neutral-100 rounded-xl">
              <span className="text-4xl font-semibold">{index + 1}</span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="absolute top-1/2 left-12 -translate-y-1/2" />
      <CarouselNext className="absolute top-1/2 right-12 -translate-y-1/2" />

      <CarouselPagination
        onBackground
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      />
    </Carousel>
  ),
}
