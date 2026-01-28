import { SidebarWrapper } from '@/components/sidebar-wrapper'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarWrapper>{children}</SidebarWrapper>
}
