import { useEffect, useRef, useState } from 'react';
import { Button } from '@mantine/core';
import { RefreshCw } from 'lucide-react';

export const APP_REFRESH_QUERY_PARAM = '_mt_refresh';

export function createCacheBustedRefreshUrl(
  href: string,
  token = Date.now().toString(36),
) {
  const url = new URL(href);
  url.searchParams.set(APP_REFRESH_QUERY_PARAM, token);
  return url.toString();
}

export function removeRefreshTokenFromUrl(href: string) {
  const url = new URL(href);
  if (!url.searchParams.has(APP_REFRESH_QUERY_PARAM)) return null;
  url.searchParams.delete(APP_REFRESH_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

interface AppRefreshButtonProps {
  className?: string;
  compact?: boolean;
}

export function AppRefreshButton({
  className = '',
  compact = false,
}: AppRefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number | null>(null);
  const accessibleLabel = '刷新到最新版本';
  const title = '保留抽牌记录，重新载入最新页面';

  useEffect(() => {
    const cleanPath = removeRefreshTokenFromUrl(window.location.href);
    if (cleanPath) {
      window.history.replaceState(window.history.state, '', cleanPath);
    }
    return () => {
      if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current);
    };
  }, []);

  function refreshApp() {
    if (refreshing) return;
    setRefreshing(true);
    const nextUrl = createCacheBustedRefreshUrl(window.location.href);
    refreshTimer.current = window.setTimeout(() => {
      window.location.replace(nextUrl);
    }, 80);
  }

  return (
    <Button
      type="button"
      className={`appRefreshButton ${className}`.trim()}
      size={compact ? 'compact-sm' : 'sm'}
      variant="white"
      color="violet"
      leftSection={<RefreshCw size={compact ? 14 : 16} />}
      loading={refreshing}
      onClick={refreshApp}
      aria-label={accessibleLabel}
      title={title}
    >
      {compact ? '刷新' : '刷新页面'}
    </Button>
  );
}
