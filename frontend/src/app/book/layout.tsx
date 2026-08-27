import { QueryProvider } from '../../providers/QueryProvider';
import '../globals.css'; // Keep global styles

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="booking-flow-isolation">
      <QueryProvider>
        {children}
      </QueryProvider>
    </div>
  );
}
