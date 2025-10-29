import { cn } from 'utils'

export const SwiperNavigation = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <div className={cn('flex items-center gap-2 justify-end')}>{children}</div>
  )
}
