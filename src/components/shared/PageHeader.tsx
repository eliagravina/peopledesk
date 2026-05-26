interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="px-5 py-4 border-b flex items-center justify-between gap-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div>
        <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
