import ResilientImage from '@/components/ui/resilient-image';

type ArticleCardProps = {
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  category?: string;
  date?: string;
  readingTime?: string;
  href: string;
  variant?: 'medium' | 'small';
};

export default function ArticleCard({
  title,
  excerpt,
  image,
  imageAlt,
  category,
  date,
  readingTime,
  href,
  variant = 'medium',
}: ArticleCardProps) {
  if (variant === 'small') {
    return (
      <a
        href={href}
        className="rounded-xl overflow-hidden p-3 flex gap-6 bg-white/50 backdrop-blur-[10px] border border-white/20 shadow-md group hover:bg-white/70 transition-all"
      >
        <div className="w-1/3 aspect-square rounded-lg overflow-hidden shrink-0">
          <ResilientImage
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            src={image}
            alt={imageAlt}
            loading="lazy"
          />
        </div>

        <div className="flex flex-col justify-center py-1 pr-6 min-w-0">
          {category && (
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {category}
            </span>
          )}
          <h3 className="font-serif text-xl text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="font-sans text-sm text-on-surface-variant line-clamp-2 mb-3">
            {excerpt}
          </p>
          <div className="flex items-center gap-4">
            {date && (
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
                {date}
              </span>
            )}
            {readingTime && (
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
                {readingTime}
              </span>
            )}
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={href}
      className="rounded-xl overflow-hidden group bg-white/50 backdrop-blur-[10px] border border-white/20 shadow-md block"
    >
      <div className="relative h-[300px] overflow-hidden">
          <ResilientImage
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src={image}
          alt={imageAlt}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="font-serif text-2xl text-white">{title}</h2>
        </div>
      </div>

      <div className="p-6">
        {category && (
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
            {category}
          </span>
        )}
        <p className="font-sans text-base text-on-surface-variant line-clamp-2 mb-4">
          {excerpt}
        </p>
        <div className="flex items-center gap-4">
          {date && (
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
              {date}
            </span>
          )}
          {readingTime && (
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
              {readingTime}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
