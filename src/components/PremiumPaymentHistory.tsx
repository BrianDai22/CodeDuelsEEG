import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPremiumPaymentHistory } from '@/lib/api';
import { format } from 'date-fns';

interface PremiumPayment {
  userId: string;
  email: string;
  sessionId: string;
  paymentDate: string;
  amount: number;
}

const PremiumPaymentHistory = () => {
  const [payments, setPayments] = useState<PremiumPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const paymentHistory = await getPremiumPaymentHistory();
        setPayments(paymentHistory);
      } catch (error) {
        console.error('Error loading payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading payment history...</div>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">No premium payments found.</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Premium Payment History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Session ID</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.sessionId}>
              <TableCell>{payment.userId}</TableCell>
              <TableCell>{payment.email}</TableCell>
              <TableCell>
                <code className="text-sm">{payment.sessionId}</code>
              </TableCell>
              <TableCell>
                {format(new Date(payment.paymentDate), 'PPpp')}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  ${payment.amount.toFixed(2)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PremiumPaymentHistory; 