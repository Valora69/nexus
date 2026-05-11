'use client';

import { toast } from 'sonner';

import {
  PaymentsHeader,
  PendingVerificationList,
  AwaitingConfirmationList,
  PaymentHistoryList,
  VerifyPaymentModal,
} from '@web/components/features/payments';
import { PaymentModals } from '@web/lib/constants/modals';
import { useModalWithItem } from '@web/hooks';

import {
  useGetPendingVerification,
  useGetPendingConfirmation,
  useGetAllPayments,
} from '@web/lib/client/queries/paymentQueries';
import { useUpdatePayment } from '@web/lib/client/mutations/paymentMutation';
import type { PaymentWithRelations } from '@web/lib/types/entities';

export default function PaymentsPage() {
  // Modal state using custom hook
  const {
    activeModal,
    selectedItem: selectedPayment,
    openModalWithItem,
    closeModal,
  } = useModalWithItem<PaymentModals, PaymentWithRelations>();

  // Data queries
  const { data: pendingVerification = [], isLoading: isLoadingVerification } =
    useGetPendingVerification();
  const { data: myPendingPayments = [], isLoading: isLoadingConfirmation } =
    useGetPendingConfirmation();
  const { data: allPayments = [], isLoading: isLoadingAll } =
    useGetAllPayments();

  const completedPayments = allPayments.filter(
    (p: PaymentWithRelations) => p.isVerified,
  );

  // Mutation
  const verifyPaymentMutation = useUpdatePayment({
    onSuccess: () => {
      toast.success('Payment verified!');
      closeModal();
    },
  });

  const isLoading =
    isLoadingVerification || isLoadingConfirmation || isLoadingAll;

  // Handlers
  const onVerifyPayment = (payment: PaymentWithRelations) => {
    openModalWithItem(PaymentModals.VerifyPayment, payment);
  };

  const handleConfirmVerify = async () => {
    if (!selectedPayment) return;
    try {
      await verifyPaymentMutation.mutateAsync({
        id: selectedPayment.id,
        paymentData: {
          isVerified: true,
        },
      });
    } catch {
      toast.error('Failed to verify payment');
    }
  };

  // Modals mapping
  const modals = {
    [PaymentModals.VerifyPayment]: (
      <VerifyPaymentModal
        isOpen={activeModal === PaymentModals.VerifyPayment}
        onClose={closeModal}
        payment={selectedPayment}
        onConfirm={handleConfirmVerify}
        isPending={verifyPaymentMutation.isPending}
      />
    ),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PaymentsHeader
          title="Payments"
          description="View payment history and status"
        />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-muted/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PaymentsHeader
        title="Payments"
        description="View payment history and status"
      />

      <PendingVerificationList
        payments={pendingVerification}
        onVerify={onVerifyPayment}
        isVerifying={verifyPaymentMutation.isPending}
      />

      <AwaitingConfirmationList payments={myPendingPayments} />

      <PaymentHistoryList payments={completedPayments} />

      {activeModal && modals[activeModal]}
    </div>
  );
}
