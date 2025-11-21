import Image from 'next/image';
import logoImage from '@/assets/logos/logo.png';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={logoImage}
        alt="CiptaStok Logo"
        width={140}
        height={48}
        priority
        className="h-12 w-auto"
      />
    </div>
  );
}
