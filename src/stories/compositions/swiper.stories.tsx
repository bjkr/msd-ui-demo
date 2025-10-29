import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Swiper,
  SwiperHeader,
  SwiperNext,
  SwiperPrevious,
  SwiperSlide,
  SwiperNavigation,
  SwiperFooter,
} from '../../ui/compositions/Swiper'
import { cn } from 'utils'

const meta: Meta<typeof Swiper> = {
  title: 'MSD UI Compositions/Swiper',
  component: Swiper,
  decorators: [
    (Story) => (
      <div className="w-full h-full flex justify-center items-center">
        <div className="container overflow-visible">
          <Story />
        </div>
      </div>
    ),
  ],
  tags: ['autodocs'],
}
export default meta

const items = [
  {
    id: 1,
    title: 'Item 1',
  },
  {
    id: 2,
    title: 'Item 2',
  },
  {
    id: 3,
    title: 'Item 3',
  },
  {
    id: 4,
    title: 'Item 4',
  },
  {
    id: 5,
    title: 'Item 5',
  },
  {
    id: 6,
    title: 'Item 6',
  },
  {
    id: 7,
    title: 'Item 7',
  },
  {
    id: 8,
    title: 'Item 8',
  },
]

export const StorySwiper: StoryObj<typeof Swiper> = {
  name: 'Default',
  args: {},
  render: ({ ...props }) => (
    <Swiper
      slidesPerView={4}
      spaceBetween={20}
      direction="horizontal"
      breakpoints={{
        0: {
          spaceBetween: 8,
          slidesPerView: 1,
        },
        468: {
          spaceBetween: 8,
          slidesPerView: 2,
        },
        768: {
          spaceBetween: 20,
          slidesPerView: 3,
        },
        1024: {
          spaceBetween: 20,
          slidesPerView: 4,
        },
        1280: {
          spaceBetween: 20,
          slidesPerView: 5,
        },
      }}
    >
      {/* <div slot="container-start"> */}
      <SwiperHeader
        slot="container-start"
        className="flex items-center justify-between"
      >
        <h3 className="text-2xl font-bold">Header Title</h3>
        <SwiperNavigation>
          <SwiperPrevious />
          <SwiperNext />
        </SwiperNavigation>
      </SwiperHeader>
      {/* </div> */}
      {items.map(({ id, title }, index) => (
        <SwiperSlide
          key={index}
          className={cn(
            'bg-red-500 text-white p-5 rounded-lg cursor-grab select-none'
          )}
        >
          {title}
        </SwiperSlide>
      ))}
      <SwiperFooter slot="container-end" className="text-center">
        Footer Content
      </SwiperFooter>
    </Swiper>
  ),
}
