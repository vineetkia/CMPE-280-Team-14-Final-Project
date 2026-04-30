import { AppRouteTransition } from "./_components/route-transition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppRouteTransition>{children}</AppRouteTransition>;
}
