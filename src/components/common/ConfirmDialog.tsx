/**
 * ✅ Diálogo reutilizable de confirmación
 *
 * Centraliza la UI para acciones sensibles y evita repetir lógica visual
 * en distintas pantallas del sistema.
 */
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface Props {
  open: boolean;
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({ open, title, content, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent>
        {/* 🗣️ Mensaje descriptivo para que el usuario entienda la acción */}
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {/* ↩️ Acción segura para cancelar */}
        <Button variant="outlined" onClick={onClose}>{cancelText}</Button>
        {/* ✅ Acción positiva entregada por la pantalla consumidora */}
        <Button variant="contained" onClick={onConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}
