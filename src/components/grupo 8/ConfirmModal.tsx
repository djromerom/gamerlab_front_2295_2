import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void; // Función para cerrar el modal
  onConfirm: () => void; // Función para confirmar la acción
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null; // No renderizar el modal si no está abierto

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4 text-center">Confirmar Envío</h2>
        <p className="text-sm text-center mb-6">
          ¿Estás seguro de que deseas enviar la evaluación? Una vez enviada, no podrás modificarla.
        </p>
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            No, volver
          </button>
          <button
            className="px-4 py-2 bg-[#6644ff] hover:bg-[#5a3be5] text-white rounded-md"
            onClick={onConfirm}
          >
            Sí, enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;