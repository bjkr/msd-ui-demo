import { cn } from 'utils'

export const SwiperFooter = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
  slot?: string
}) => {
  return (
    <div className={cn('py-2', className)} {...props}>
      {children}
    </div>
  )
}
