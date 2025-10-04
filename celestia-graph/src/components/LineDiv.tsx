import React, { useEffect } from 'react';

type LineDivProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'dashed' | 'glow';
  inset?: boolean;            // true => no margin lateral
  fade?: boolean;             // añade desvanecido lateral
};

const injectLineStyles = () => {
  if (document.getElementById('line-div-styles')) return;
  const style = document.createElement('style');
  style.id = 'line-div-styles';
  style.textContent = `
  .line-div {
    --ld-height: 2px;
    --ld-gap: 3.2rem;
    position: relative;
    width: 100%;
    border: 0;
    height: var(--ld-height);
    margin: var(--ld-gap) auto;
    background: linear-gradient(90deg, transparent, var(--neon-cyan) 12%, var(--neon-pink) 50%, var(--neon-lime) 88%, transparent);
    border-radius: 40px;
    overflow: hidden;
  }
  .line-div[data-variant='dashed'] {
    background:
      repeating-linear-gradient(90deg,
        var(--neon-cyan) 0 32px,
        transparent 32px 52px),
      linear-gradient(90deg, transparent, var(--neon-pink), transparent);
    opacity: .75;
  }
  .line-div[data-variant='glow']::after {
    content: '';
    position: absolute;
    inset: -6px 0;
    background: linear-gradient(90deg, var(--neon-cyan), var(--neon-pink), var(--neon-lime));
    filter: blur(16px) brightness(1.15);
    opacity: .55;
    pointer-events: none;
  }
  .line-div[data-fade='true']::before,
  .line-div[data-fade='true']::after {
    content: '';
    position: absolute;
    top: 0;
    width: 14%;
    height: 100%;
    pointer-events: none;
  }
  .line-div[data-fade='true']::before {
    left: 0;
    background: linear-gradient(90deg, var(--bg-base) 0%, transparent 100%);
  }
  .line-div[data-fade='true']::after {
    right: 0;
    background: linear-gradient(270deg, var(--bg-base) 0%, transparent 100%);
    filter: none;
  }
  /* Sizes */
  .line-div[data-size='xs'] { --ld-height: 1px; --ld-gap: 1.4rem; }
  .line-div[data-size='sm'] { --ld-height: 2px; --ld-gap: 2rem; }
  .line-div[data-size='md'] { --ld-height: 3px; --ld-gap: 3.2rem; }
  .line-div[data-size='lg'] { --ld-height: 4px; --ld-gap: 4.4rem; }
  /* Inset removal of horizontal spacing concept left for parent layout */
  .line-div[data-inset='true'] {
    max-width: none;
  }
  @media (max-width: 640px) {
    .line-div { --ld-gap: 2.2rem; }
    .line-div[data-size='lg'] { --ld-gap: 3rem; }
  }
  `;
  document.head.appendChild(style);
};

export const LineDiv: React.FC<LineDivProps> = ({
  size = 'md',
  variant = 'glow',
  inset = false,
  fade = true
}) => {
  useEffect(() => {
    injectLineStyles();
  }, []);

  return (
    <hr
      className="line-div"
      data-size={size}
      data-variant={variant}
      data-inset={inset || undefined}
      data-fade={fade || undefined}
      aria-hidden="true"
    />
  );
};

export default LineDiv;
