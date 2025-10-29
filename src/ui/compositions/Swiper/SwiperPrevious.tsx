import { Button } from 'primitives'
import { IconChevronLeft } from 'icons'
import { useSwiperReactive } from './hooks/useSwiperReactive'

export const SwiperPrevious = () => {
  const swiper = useSwiperReactive()

  return (
    <Button onClick={() => swiper.slidePrev()} disabled={swiper.isBeginning}>
      <IconChevronLeft />
    </Button>
  )
}
