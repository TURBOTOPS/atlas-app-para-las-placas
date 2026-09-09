export interface Sale {
  id: string;
  timestamp: string;
  clientName: string;
  clientRut: string;
  qty: number;
  unitPrice: number;
  docType: string;
  paymentMethod: string;
  totalBruto: number;
  neto: number;
  iva: number;
  estimatedUnitCost: number;
  reinvestment: number;
  savings: number;
  profit: number;
  notes: string;
  receiptImage?: string | null;
}

export interface Reception {
  id: string;
  timestamp: string;
  supplier: string;
  tracking: string;
  qty: number;
  orderDate: string;
  arrivalDate: string;
  transitDays: number;
  usdFob: number;
  exchangeRate: number;
  courierTaxesClp: number;
  totalLandedClp: number;
  unitLandedClp: number;
  notes?: string;
  receiptImage?: string | null;
}

export interface AppConfig {
  reinvestPct: number;
  savingsPct: number;
  profitPct: number;
  criticalStockThreshold: number;
}
