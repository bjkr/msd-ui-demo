import { useEffect, useState } from 'react'
import { Swiper as SwiperRoot, type SwiperProps } from 'swiper/react'

import 'swiper/css'

import { cn } from '../../utils'

export const Swiper = ({ children, ...props }: SwiperProps) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return (
    <div className={cn('swiper-container', 'w-full overflow-visible')}>
      <SwiperRoot {...props} style={{ overflow: 'visible' }}>
        {children}
      </SwiperRoot>
    </div>
  )
}
