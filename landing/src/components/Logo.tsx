import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
  rounded?: 'lg' | 'xl' | '2xl' | '3xl';
}

const roundedMap: Record<string, string> = {
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.25rem',
};

export default function Logo({ size = 40, className = '', rounded = 'xl' }: LogoProps) {
  return (
    <div
      className={`relative overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: roundedMap[rounded],
      }}
    >
      <Image
        src="/icon.png"
        alt="I'MU"
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'cover' }}
        priority
      />
    </div>
  );
}
