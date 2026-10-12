import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export function Section({ kicker, title, description, children, actions }: {
  kicker?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          {kicker && <p className="kicker mb-1">{kicker}</p>}
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-300">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
}

export function Field({ label, value, onChange, error, hint, className, ...rest }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {rest.required && <span className="ml-0.5 text-signal-400" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        spellCheck={false}
        {...rest}
      />
      {error ? (
        <p id={msgId} className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-300" role="alert">
          <span aria-hidden>●</span>
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-ink-700 bg-ink-950/60 p-0.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.title}
              onClick={() => onChange(opt.value)}
              className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                active ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-300 hover:text-ink-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({ label, description, checked, onChange }: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm text-ink-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-400">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-signal-500' : 'bg-ink-700'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const valid = HEX_RE.test(value);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-950/60 p-1 pr-2 focus-within:border-signal-500">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={valid && value.length === 7 ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <input
          id={id}
          value={value}
          maxLength={7}
          onChange={(e) => onChange(e.target.value.trim())}
          aria-invalid={!valid || undefined}
          className={`w-full bg-transparent font-mono text-xs uppercase outline-none ${valid ? 'text-ink-100' : 'text-rose-300'}`}
        />
      </div>
    </div>
  );
}

export function Range({ label, value, min, max, step = 1, unit = 'px', onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium tracking-wide text-ink-300">{label}</label>
        <span className="font-mono text-xs text-signal-300">{value}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-signal-500"
      />
    </div>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'ok'; title?: string; children: ReactNode }) {
  const styles = {
    info: 'border-signal-500/30 bg-signal-500/5 text-ink-200',
    warn: 'border-amber-400/30 bg-amber-400/5 text-amber-100',
    ok: 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100',
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles}`}>
      {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
      {children}
    </div>
  );
}
