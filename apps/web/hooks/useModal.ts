import { useState, useCallback } from 'react';

/**
 * Generic hook for managing modal state with a type-safe enum
 *
 * @example
 * // In your component:
 * const { activeModal, openModal, closeModal, isOpen } = useModal<ProfileModals>();
 *
 * // Open a specific modal
 * openModal(ProfileModals.EditProfile);
 *
 * // Check if specific modal is open
 * if (isOpen(ProfileModals.EditProfile)) { ... }
 *
 * // Close any open modal
 * closeModal();
 */
export function useModal<T extends string | number>() {
  const [activeModal, setActiveModal] = useState<T | null>(null);

  const openModal = useCallback((modal: T) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isOpen = useCallback(
    (modal: T) => activeModal === modal,
    [activeModal],
  );

  return {
    activeModal,
    openModal,
    closeModal,
    isOpen,
    setActiveModal,
  };
}

/**
 * Hook for managing modal state along with a selected item
 * Useful when modals need to display/edit a specific item
 *
 * @example
 * const {
 *   activeModal,
 *   selectedItem,
 *   openModalWithItem,
 *   closeModal,
 * } = useModalWithItem<PaymentModals, PaymentWithRelations>();
 *
 * // Open modal with specific item
 * openModalWithItem(PaymentModals.VerifyPayment, payment);
 *
 * // In modal: selectedItem is the payment object
 */
export function useModalWithItem<T extends string | number, TItem>() {
  const [activeModal, setActiveModal] = useState<T | null>(null);
  const [selectedItem, setSelectedItem] = useState<TItem | null>(null);

  const openModalWithItem = useCallback((modal: T, item: TItem) => {
    setSelectedItem(item);
    setActiveModal(modal);
  }, []);

  const openModal = useCallback((modal: T) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedItem(null);
  }, []);

  const isOpen = useCallback(
    (modal: T) => activeModal === modal,
    [activeModal],
  );

  return {
    activeModal,
    selectedItem,
    openModal,
    openModalWithItem,
    closeModal,
    isOpen,
    setActiveModal,
    setSelectedItem,
  };
}

export default useModal;
