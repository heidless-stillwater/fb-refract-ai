import { cn } from '@/lib/utils';

const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    className={cn('h-6 w-6 text-primary', className)}
    fill="currentColor"
    aria-label="Refract AI Logo"
  >
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm4-88a4,4,0,0,1-8,0V88a4,4,0,0,1,8,0Zm48,28L156.4,182.26a4,4,0,0,1-5.66-5.66L174.34,152H81.66l23.6,24.6a4,4,0,1,1-5.66,5.66L73.2,156.4a4,4,0,0,1,0-5.66l26.4-27.54a4,4,0,1,1,5.66,5.66L81.66,144h92.68l-23.6-24.6a4,4,0,0,1,5.66-5.66L180.4,140.4A4,4,0,0,1,180.4,144.34Z" />
  </svg>
);

export default Logo;
