import { Order } from '../types';

export interface ThermalPrintOptions {
  brandName: string;
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
  paperSize: '58mm' | '80mm';
  receiptType: 'customer' | 'kitchen';
}

/**
 * Common Bluetooth Thermal Printer Service & Characteristic UUIDs
 * Compatible with Panda, Iware, Eppos, VSC, Cashwell, Xprinter, POS-5802, etc.
 */
export const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common SPP / BLE
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

export const PRINTER_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  'bef8d6c1-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-aca3-4815-a43e-84ae96277a51',
];

/**
 * Format a line with left text and right text padded with spaces
 */
export const padLine = (left: string, right: string, width: number): string => {
  const leftTrim = left.trim();
  const rightTrim = right.trim();
  const availableSpace = width - rightTrim.length;

  if (leftTrim.length >= availableSpace) {
    const truncatedLeft = leftTrim.slice(0, Math.max(0, availableSpace - 1));
    return `${truncatedLeft} ${rightTrim}`;
  }

  const spacesNeeded = width - (leftTrim.length + rightTrim.length);
  return `${leftTrim}${' '.repeat(Math.max(1, spacesNeeded))}${rightTrim}`;
};

/**
 * Center text within target width
 */
export const centerText = (text: string, width: number): string => {
  const trimmed = text.trim();
  if (trimmed.length >= width) return trimmed.slice(0, width);
  const leftPad = Math.floor((width - trimmed.length) / 2);
  const rightPad = width - trimmed.length - leftPad;
  return `${' '.repeat(leftPad)}${trimmed}${' '.repeat(rightPad)}`;
};

/**
 * Generates an ESC/POS binary command buffer for 58mm or 80mm thermal printers
 */
export const generateEscPosBuffer = (
  order: Order,
  options: ThermalPrintOptions
): Uint8Array => {
  const {
    brandName,
    outletName = order.outletName,
    outletAddress = '',
    outletPhone = '',
    paperSize = '80mm',
    receiptType = 'customer',
  } = options;

  const lineWidth = paperSize === '58mm' ? 32 : 48;
  const divider = '-'.repeat(lineWidth);
  const doubleDivider = '='.repeat(lineWidth);

  // ESC/POS Command Byte Sequences
  const ESC = 0x1b;
  const GS = 0x1d;

  const CMD_INIT = [ESC, 0x40]; // Initialize printer
  const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00];
  const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
  const CMD_ALIGN_RIGHT = [ESC, 0x61, 0x02];
  const CMD_BOLD_ON = [ESC, 0x45, 0x01];
  const CMD_BOLD_OFF = [ESC, 0x45, 0x00];
  const CMD_DOUBLE_SIZE = [ESC, 0x21, 0x30];
  const CMD_DOUBLE_HEIGHT = [ESC, 0x21, 0x10];
  const CMD_NORMAL_SIZE = [ESC, 0x21, 0x00];
  const CMD_FEED_AND_CUT = [ESC, 0x64, 0x03, GS, 0x56, 0x41, 0x10]; // Feed 3 lines & partial cut

  const encoder = new TextEncoder();
  const bytes: number[] = [...CMD_INIT];

  const appendText = (text: string) => {
    const encoded = encoder.encode(text + '\n');
    for (let i = 0; i < encoded.length; i++) {
      bytes.push(encoded[i]);
    }
  };

  const appendRaw = (rawBytes: number[]) => {
    bytes.push(...rawBytes);
  };

  if (receiptType === 'customer') {
    // ================= CUSTOMER RECEIPT =================
    // Header
    appendRaw(CMD_ALIGN_CENTER);
    appendRaw(CMD_DOUBLE_SIZE);
    appendText(brandName.toUpperCase());
    appendRaw(CMD_NORMAL_SIZE);

    if (outletName) appendText(outletName);
    if (outletAddress) appendText(outletAddress);
    if (outletPhone) appendText(`Telp: ${outletPhone}`);

    appendRaw(CMD_ALIGN_LEFT);
    appendText(divider);

    // Meta details
    appendText(padLine('No. Nota', order.invoiceNumber, lineWidth));
    appendText(
      padLine(
        'Waktu',
        new Date(order.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        lineWidth
      )
    );
    appendText(padLine('Kasir', order.cashierName, lineWidth));
    appendText(
      padLine(
        'Tipe',
        order.orderType === 'dine-in'
          ? `Meja: ${order.tableNumber || 'Dine-In'}`
          : 'Bungkus / Takeaway',
        lineWidth
      )
    );
    if (order.customerName) {
      appendText(padLine('Pelanggan', order.customerName, lineWidth));
    }
    if (order.status === 'VOIDED') {
      appendRaw(CMD_ALIGN_CENTER);
      appendRaw(CMD_BOLD_ON);
      appendText('*** NOTA DIBATALKAN (VOID) ***');
      appendRaw(CMD_BOLD_OFF);
      appendRaw(CMD_ALIGN_LEFT);
    }

    appendText(divider);

    // Items
    order.items.forEach((item) => {
      const itemTotal = `Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
      appendText(padLine(item.name, itemTotal, lineWidth));
      const itemDetail = `  ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}${
        item.notes ? ` (${item.notes})` : ''
      }`;
      appendText(itemDetail);
    });

    appendText(divider);

    // Calculation summary
    appendText(padLine('Subtotal', `Rp ${order.subtotal.toLocaleString('id-ID')}`, lineWidth));
    if (order.discount > 0) {
      appendText(padLine('Diskon Promo', `-Rp ${order.discount.toLocaleString('id-ID')}`, lineWidth));
    }

    appendRaw(CMD_BOLD_ON);
    appendText(padLine('TOTAL BAYAR', `Rp ${order.total.toLocaleString('id-ID')}`, lineWidth));
    appendRaw(CMD_BOLD_OFF);

    appendText(divider);

    // Payment details
    appendText(padLine('Metode Bayar', order.paymentMethod, lineWidth));
    if (order.paymentMethod === 'CASH') {
      appendText(
        padLine('Uang Tunai', `Rp ${(order.cashReceived || order.total).toLocaleString('id-ID')}`, lineWidth)
      );
      appendText(
        padLine('Kembalian', `Rp ${(order.changeAmount || 0).toLocaleString('id-ID')}`, lineWidth)
      );
    }

    appendText(doubleDivider);

    // Footer
    appendRaw(CMD_ALIGN_CENTER);
    appendRaw(CMD_BOLD_ON);
    appendText('Terima Kasih!');
    appendRaw(CMD_BOLD_OFF);
    appendText('Selamat Menikmati Hidangan Kami');
    appendText('Kritik & Saran Hubungi Kasir');
  } else {
    // ================= KITCHEN / STEAMER TICKET =================
    appendRaw(CMD_ALIGN_CENTER);
    appendRaw(CMD_DOUBLE_SIZE);
    appendText('*** TIKET DAPUR ***');
    appendRaw(CMD_NORMAL_SIZE);

    if (outletName) appendText(outletName);
    appendText(divider);

    appendRaw(CMD_DOUBLE_HEIGHT);
    appendText(
      order.orderType === 'dine-in'
        ? `MEJA: ${order.tableNumber || '-'}`
        : 'BUNGKUS / TAKEAWAY'
    );
    appendRaw(CMD_NORMAL_SIZE);

    appendRaw(CMD_ALIGN_LEFT);
    appendText(padLine('No. Nota', order.invoiceNumber, lineWidth));
    appendText(
      padLine(
        'Jam Order',
        new Date(order.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        lineWidth
      )
    );
    if (order.customerName) {
      appendText(padLine('Pelanggan', order.customerName, lineWidth));
    }

    appendText(divider);

    // Kitchen Checklist
    order.items.forEach((item) => {
      appendRaw(CMD_BOLD_ON);
      appendText(`[ ${item.quantity}x ] ${item.name}`);
      appendRaw(CMD_BOLD_OFF);
      if (item.notes) {
        appendText(`  * NOTE: ${item.notes}`);
      }
    });

    appendText(divider);
    const totalPortions = order.items.reduce((s, i) => s + i.quantity, 0);
    appendText(padLine('TOTAL PORSI', `${totalPortions} Porsi`, lineWidth));
    appendRaw(CMD_ALIGN_CENTER);
    appendText('Pastikan klakat bersih & saus lengkap');
  }

  // Feed & Cut Paper
  appendRaw(CMD_FEED_AND_CUT);

  return new Uint8Array(bytes);
};

/**
 * Check if Web Bluetooth API is supported in the current browser
 */
export const isWebBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

/**
 * Check if Web USB API is supported in the current browser
 */
export const isWebUsbSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
};

/**
 * Direct print to a Bluetooth Thermal Mini Printer (58mm or 80mm) via Web Bluetooth
 */
export const printViaBluetooth = async (
  buffer: Uint8Array,
  onStatusUpdate?: (statusText: string) => void
): Promise<{ success: boolean; message: string }> => {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      message:
        'Web Bluetooth API tidak didukung pada browser ini. Gunakan Google Chrome di Android/PC, atau cetak melalui dialog cetak sistem.',
    };
  }

  try {
    onStatusUpdate?.('Mencari printer Bluetooth kasir...');

    // Request Bluetooth device with printer service UUIDs or accept all devices
    const navBluetooth = (navigator as any).bluetooth;
    const device = await navBluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS,
    });

    if (!device) {
      return { success: false, message: 'Pencarian printer Bluetooth dibatalkan.' };
    }

    onStatusUpdate?.(`Menghubungkan ke ${device.name || 'Printer Thermal'}...`);
    const server = await device.gatt.connect();

    // Iterate through known printer services to locate the writable characteristic
    let writeChar: any = null;

    for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        for (const charUuid of PRINTER_CHARACTERISTIC_UUIDS) {
          try {
            const char = await service.getCharacteristic(charUuid);
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          } catch {
            // continue search
          }
        }
      } catch {
        // continue search
      }
      if (writeChar) break;
    }

    // Fallback: discover any service and its writable characteristic
    if (!writeChar) {
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
          if (writeChar) break;
        }
      } catch (err) {
        console.warn('Fallback GATT characteristic discovery error:', err);
      }
    }

    if (!writeChar) {
      server.disconnect();
      return {
        success: false,
        message:
          'Karakteristik cetak ESC/POS tidak ditemukan pada printer yang dipilih. Pastikan printer dalam mode SPP/Thermal.',
      };
    }

    onStatusUpdate?.('Mengirim data cetak struk...');

    // Bluetooth chunking: send in 512-byte slices to prevent MTU overflow
    const CHUNK_SIZE = 512;
    for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
      const slice = buffer.slice(offset, offset + CHUNK_SIZE);
      if (writeChar.writeValueWithResponse) {
        await writeChar.writeValueWithResponse(slice);
      } else {
        await writeChar.writeValueWithoutResponse(slice);
      }
      // Small tick between chunks
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    // Disconnect GATT after printing
    setTimeout(() => {
      try {
        server.disconnect();
      } catch {
        // ignore
      }
    }, 500);

    return {
      success: true,
      message: `Struk berhasil dicetak ke ${device.name || 'Printer Bluetooth'}!`,
    };
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return { success: false, message: 'Pemilihan printer Bluetooth dibatalkan.' };
    }
    return {
      success: false,
      message: `Gagal mencetak Bluetooth: ${error?.message || 'Koneksi terputus'}. Silakan gunakan tombol Cetak Browser.`,
    };
  }
};

/**
 * Direct print to a USB Thermal Mini Printer via Web USB API
 */
export const printViaUsb = async (
  buffer: Uint8Array,
  onStatusUpdate?: (statusText: string) => void
): Promise<{ success: boolean; message: string }> => {
  if (!isWebUsbSupported()) {
    return {
      success: false,
      message:
        'Web USB API tidak didukung pada browser ini. Silakan gunakan tombol Cetak Browser.',
    };
  }

  try {
    onStatusUpdate?.('Mencari printer USB kasir...');
    const navUsb = (navigator as any).usb;
    const device = await navUsb.requestDevice({
      filters: [{ classCode: 7 }], // USB Class 7 = Printer
    });

    if (!device) {
      return { success: false, message: 'Pemilihan printer USB dibatalkan.' };
    }

    onStatusUpdate?.(`Membuka port printer USB ${device.productName || ''}...`);
    await device.open();
    await device.selectConfiguration(1);

    // Claim first printer interface
    const iface = device.configuration.interfaces[0];
    await device.claimInterface(iface.interfaceNumber);

    // Locate out-endpoint for writing raw bytes
    const endpoint = iface.alternate.endpoints.find(
      (e: any) => e.direction === 'out'
    );

    if (!endpoint) {
      await device.close();
      return {
        success: false,
        message: 'Endpoint OUT untuk transfer data printer tidak ditemukan.',
      };
    }

    onStatusUpdate?.('Mentransfer data cetak ke printer USB...');
    await device.transferOut(endpoint.endpointNumber, buffer);
    await device.close();

    return {
      success: true,
      message: `Struk berhasil dicetak ke ${device.productName || 'Printer USB'}!`,
    };
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return { success: false, message: 'Pemilihan printer USB dibatalkan.' };
    }
    return {
      success: false,
      message: `Gagal mencetak USB: ${error?.message || 'Error perangkat'}. Silakan gunakan Cetak Browser.`,
    };
  }
};
