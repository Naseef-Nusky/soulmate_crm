export default function ActionButton({ children, onClick, variant = 'primary', disabled, type, className = '' }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-500'
      : variant === 'secondary'
      ? 'border border-gurulink-primary text-gurulink-primary hover:bg-gurulink-bgSoft'
      : 'bg-gurulink-accent text-gurulink-primary hover:bg-gurulink-accentHover';

  return (
    <button
      type={type || 'button'}
      className={`${base} ${styles} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}


