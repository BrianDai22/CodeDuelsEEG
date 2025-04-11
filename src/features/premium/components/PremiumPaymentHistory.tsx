import React, { useState, useEffect } from 'react';
import { Card } from '@ui/data/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/data/table';
import { Badge } from '@ui/data/badge';
import { format } from 'date-fns';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@features/auth/AuthContext';

interface PaymentRecord {
  sessionId: string;
  email?: string;
  paymentDate?: number;
  amount?: number;
  status?: string;
}

const PremiumPaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const functions = getFunctions();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setError("Please log in to view payment history.");
      return;
    }

    const loadPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const getPaymentHistoryFunc = httpsCallable<unknown, PaymentRecord[]>(functions, 'getPaymentHistory');
        const result = await getPaymentHistoryFunc();
        setPayments(result.data);
      } catch (err: any) {
        console.error('Error loading payment history:', err);
        setError(err.message || "Failed to load payment history.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, [user, functions]);

  if (isLoading) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading payment history...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-500 bg-red-50/50">
        <div className="flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error: {error}
        </div>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">No premium payments found.</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Premium Payment History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Session ID</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.sessionId}>
              <TableCell>{payment.email || 'N/A'}</TableCell>
              <TableCell>
                <code className="text-sm text-gray-600">{payment.sessionId}</code>
              </TableCell>
              <TableCell>
                {payment.paymentDate ? format(new Date(payment.paymentDate), 'PPpp') : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={payment.status === 'paid' ? 'default' : 'outline'}
                  className={payment.status === 'paid' ? 'bg-green-500/80 hover:bg-green-600/80 text-white' : ''}
                >
                  {payment.status || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {payment.amount !== undefined ? `$${payment.amount.toFixed(2)}` : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PremiumPaymentHistory; 