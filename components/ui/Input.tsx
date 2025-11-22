import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-black mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border border-black px-4 py-2 text-black placeholder-black/50 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition ${
            error ? 'border-black focus:border-black focus:ring-black' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-black">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

