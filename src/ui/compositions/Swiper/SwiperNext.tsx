import { Button } from 'primitives'
import { IconChevronRight } from 'icons'
import { useSwiperReactive } from './hooks/useSwiperReactive'

export const SwiperNext = () => {
  const swiper = useSwiperReactive()

  return (
    <Button onClick={() => swiper.slideNext()} disabled={swiper.isEnd}>
      <IconChevronRight />
    </Button>
  )
}
