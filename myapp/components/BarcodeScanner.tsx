'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStartedRef = useRef(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Success callback
            if (hasScannedRef.current) return; // Prevent multiple scans
            hasScannedRef.current = true;
            
            console.log('Barcode scanned:', decodedText);
            
            // Stop scanner before calling success callback
            try {
              await scanner.stop();
              await scanner.clear();
            } catch (err) {
              console.error('Error stopping scanner:', err);
            }
            
            onScanSuccess(decodedText);
          },
          () => {
            // Error callback (fires frequently, so we ignore it)
            // This is just for scan failures, not critical errors
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Failed to access camera. Please check permissions.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="relative flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white shadow-lg">
        <div className="flex-1">
          <h2 className="text-lg font-bold">Scan Barcode</h2>
          <p className="text-xs opacity-90">
            扫描条码 / 바코드 스캔 / สแกนบาร์โค้ด
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-bold transition hover:bg-white/30"
          aria-label="Close scanner"
        >
          ×
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Scanner Container */}
          <div
            id="barcode-reader"
            className="overflow-hidden rounded-2xl shadow-2xl"
          ></div>

          {/* Scanning Indicator */}
          {isScanning && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-blue-600 shadow-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
                <span>Scanning...</span>
              </div>
              <p className="mt-2 text-sm text-white/80">
                Point camera at barcode
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-500 px-4 py-3 text-center text-sm text-white shadow-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-t from-black/60 to-transparent px-6 py-6 text-center text-white">
        <p className="text-sm opacity-90">
          💡 Align barcode within the square
        </p>
        <p className="mt-1 text-xs opacity-75">
          将条码对准方框 / 사각형 안에 바코드 정렬 / จัดบาร์โค้ดให้อยู่ในกรอบ
        </p>
      </div>
    </div>
  );
}
