import { QueryProvider } from '../../providers/QueryProvider';

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="client-dashboard-isolation">
      <QueryProvider>
        {children}
      </QueryProvider>
    </div>
  );
}
