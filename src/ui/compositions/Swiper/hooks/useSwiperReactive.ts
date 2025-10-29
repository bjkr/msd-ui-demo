import { useEffect, useState } from 'react'
import { useSwiper } from 'swiper/react'

/**
 * Hook to get the swiper instance in a reactive way.
 * This is useful when you need to get the active index of the swiper on every slide change.
 * See: https://github.com/nolimits4web/swiper/issues/5577#issuecomment-1476587892
 * @returns {Swiper} swiper
 */
export const useSwiperReactive = () => {
  const swiper = useSwiper()

  // State to force a rerender.
  const [, setSignal] = useState({})
  const forcedRerender = () => setSignal({})

  useEffect(() => {
    if (swiper) swiper.on('slideChange', forcedRerender)
  }, [])

  return swiper
}
