import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AppIcon } from '../ui/AppIcon';

type SidebarNavLinkProps = {
  active?: boolean;
  collapsed?: boolean;
  className?: string;
  href?: string;
  iconName: string;
  iconClassName?: string;
  iconDataIcon?: string;
  iconStyle?: CSSProperties;
  label: string;
  onClick?: () => void;
  labelClassName?: string;
  to?: string;
};

export function SidebarNavLink({
  active = false,
  collapsed = false,
  className = '',
  href = '#',
  iconName,
  iconClassName = 'material-symbols-outlined',
  iconDataIcon,
  iconStyle,
  label,
  onClick,
  labelClassName = 'font-semibold text-sm',
  to,
}: SidebarNavLinkProps) {
  const mergedClassName =
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
      active
        ? 'bg-primary text-on-primary'
        : 'text-on-surface hover:bg-primary hover:text-on-primary'
    } ${collapsed ? 'justify-center' : ''} ${className}`.trim();

  const content = (
    <>
      <AppIcon
        className={iconClassName}
        data-icon={iconDataIcon}
        style={iconStyle}
      >
        {iconName}
      </AppIcon>
      {collapsed ? null : <span className={labelClassName}>{label}</span>}
    </>
  );

  if (to) {
    return (
      <Link className={mergedClassName} onClick={onClick} title={label} to={to}>
        {content}
      </Link>
    );
  }

  return (
    <a className={mergedClassName} href={href} onClick={onClick} title={label}>
      {content}
    </a>
  );
}
