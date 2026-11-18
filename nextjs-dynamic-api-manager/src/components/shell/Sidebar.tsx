'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import {
  ViewAgenda as EndpointIcon,
  ArrowForward as RestfulIcon,
  ChatBubbleOutline as ResponseIcon,
  Build as WsdlIcon,
  InfoOutlined as AboutIcon,
  Code as BrandIcon,
} from '@mui/icons-material';
import { tokens } from '@/theme/tokens';
import { useServiceSummary } from '@/components/ServiceSummaryProvider';
import { navGroups, normalizePath, NavIconKey } from './navigation';

const icons: Record<NavIconKey, React.ElementType> = {
  endpoint: EndpointIcon,
  restful: RestfulIcon,
  response: ResponseIcon,
  wsdl: WsdlIcon,
  about: AboutIcon,
};

const c = tokens.color;

export default function Sidebar() {
  const current = normalizePath(usePathname() || '/');
  const { endpoints, controllers, connection } = useServiceSummary();

  const countOf = (key?: 'endpoints' | 'controllers'): string | null => {
    if (!key) return null;
    const list = key === 'endpoints' ? endpoints : controllers;
    if (list) return String(list.length);
    return connection === 'checking' ? '…' : null;
  };

  return (
    <Box
      component="nav"
      aria-label="主選單"
      data-testid="sidebar"
      sx={{
        flex: { xs: '1 1 100%', md: `0 0 ${tokens.size.sidebarWidth}px` },
        width: { xs: '100%', md: tokens.size.sidebarWidth },
        maxWidth: '100%',
        boxSizing: 'border-box',
        p: { xs: '12px', md: '20px 12px' },
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        backgroundColor: c.surface,
        borderRight: { xs: 0, md: `1px solid ${c.border}` },
        borderBottom: { xs: `1px solid ${c.border}`, md: 0 },
        position: { md: 'sticky' },
        top: { md: 0 },
        alignSelf: { md: 'flex-start' },
        minHeight: { md: '100vh' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', p: { xs: '4px 12px 8px', md: '4px 12px 20px' } }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            backgroundColor: c.primary,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden
        >
          <BrandIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box component="span" sx={{ fontSize: 15, fontWeight: 700, color: c.textStrong }}>Dynamic API</Box>
          <Box component="span" sx={{ fontSize: 12, color: c.textSubtle }}>Mock 伺服器管理</Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: 'wrap', gap: { xs: '4px 16px', md: '4px' } }}>
        {navGroups.map((group) => (
          <Box
            key={group.label}
            role="group"
            aria-label={group.label}
            sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: 'wrap', alignItems: { xs: 'center', md: 'stretch' }, gap: '4px' }}
          >
            <Box component="span" sx={{ p: { xs: '0 4px', md: '12px 12px 4px' }, fontSize: 12, fontWeight: 600, color: c.textSubtle }}>
              {group.label}
            </Box>
            {group.items.map((item) => {
              const active = current === item.href;
              const Icon = icons[item.icon];
              const count = countOf(item.count);
              return (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: tokens.size.navItemHeight,
                    px: '12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: 14,
                    color: active ? c.primaryText : c.textSecondary,
                    fontWeight: active ? 600 : 400,
                    backgroundColor: active ? c.primarySoft : 'transparent',
                    '&:hover': { backgroundColor: active ? c.primarySoft : c.surfaceMuted, color: active ? c.primaryText : c.text },
                    '&:focus-visible': { outline: `2px solid ${c.primary}`, outlineOffset: 2 },
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} aria-hidden />
                  <Box component="span" sx={{ flex: 1 }}>{item.label}</Box>
                  {count !== null && (
                    <Box component="span" data-testid={`nav-count-${item.count}`} sx={{ fontSize: 12, color: c.textSubtle }}>
                      {count}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
