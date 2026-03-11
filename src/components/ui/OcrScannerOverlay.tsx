// src/components/ui/OcrScannerOverlay.tsx
/**
 * 📇 OcrScannerOverlay
 * ---------------------------------------------------
 * Overlay fullscreen especial para OCR.
 *
 * ✅ Se muestra solo cuando se ejecuta "Escanear OCR"
 * ✅ Animación tipo escáner
 * ✅ No reemplaza el loader global general
 */

import React from "react";
import { Backdrop, Box, Fade, Typography } from "@mui/material";
import { keyframes } from "@mui/system";

import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";

type Props = {
  open: boolean;
  title?: string;
  subtitle?: string;
};

const sweep = keyframes`
  0% {
    top: 8%;
    opacity: 0.35;
  }
  50% {
    top: 78%;
    opacity: 1;
  }
  100% {
    top: 8%;
    opacity: 0.35;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
`;

export default function OcrScannerOverlay({
  open,
  title = "Escaneando credencial...",
  subtitle = "Extrayendo datos con OCR 🧠",
}: Props) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2500,
        bgcolor: "rgba(13, 16, 24, 0.58)",
        backdropFilter: "blur(7px)",
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            width: { xs: "90%", sm: 420 },
            maxWidth: 420,
            px: 3,
            py: 3.2,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.96)",
            boxShadow: "0 26px 70px rgba(0,0,0,0.28)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2.2,
          }}
        >
          {/* 🪪 Marco del escáner */}
          <Box
            sx={{
              position: "relative",
              width: { xs: 250, sm: 280 },
              height: { xs: 150, sm: 170 },
              borderRadius: 3,
              border: "2px solid rgba(108,56,65,0.20)",
              bgcolor: "rgba(108,56,65,0.04)",
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px rgba(108,56,65,0.08)",
            }}
          >
            {/* esquinas tipo scanner */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              {/* top-left */}
              <Box sx={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderTop: "4px solid #6C3841", borderLeft: "4px solid #6C3841", borderTopLeftRadius: 8 }} />
              {/* top-right */}
              <Box sx={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderTop: "4px solid #6C3841", borderRight: "4px solid #6C3841", borderTopRightRadius: 8 }} />
              {/* bottom-left */}
              <Box sx={{ position: "absolute", bottom: 10, left: 10, width: 26, height: 26, borderBottom: "4px solid #6C3841", borderLeft: "4px solid #6C3841", borderBottomLeftRadius: 8 }} />
              {/* bottom-right */}
              <Box sx={{ position: "absolute", bottom: 10, right: 10, width: 26, height: 26, borderBottom: "4px solid #6C3841", borderRight: "4px solid #6C3841", borderBottomRightRadius: 8 }} />
            </Box>

            {/* Icono central */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#6C3841",
                animation: `${pulse} 1.4s ease-in-out infinite`,
              }}
            >
              <DocumentScannerIcon sx={{ fontSize: 64 }} />
            </Box>

            {/* Línea de barrido */}
            <Box
              sx={{
                position: "absolute",
                left: "8%",
                width: "84%",
                height: 4,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(108,56,65,0) 0%, rgba(108,56,65,0.9) 50%, rgba(108,56,65,0) 100%)",
                boxShadow: "0 0 16px rgba(108,56,65,0.55)",
                animation: `${sweep} 1.8s ease-in-out infinite`,
              }}
            />

            {/* brillo */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.12) 100%)",
                pointerEvents: "none",
              }}
            />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 18,
                color: "#6C3841",
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.6,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Backdrop>
  );
}