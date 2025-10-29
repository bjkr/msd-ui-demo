import { SwiperSlide } from 'swiper/react'

import { cn } from '../../utils'

export const SwiperItem = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <SwiperSlide
      className={cn('bg-red-500 text-white p-5 rounded-lg', className)}
    >
      {children}
    </SwiperSlide>
  )
}
