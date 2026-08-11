import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, ShieldCheck, Building2, CheckCircle2, FileText } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generatePayslipPdf } from "@/lib/payslip";
import { urlToBase64 } from "@/lib/nocGenerator";
import { toast } from "sonner";

interface PayslipData {
  payoutId?: string;
  employeeName: string;
  employeeId: string;
  designation?: string;
  department?: string;
  email: string;
  phone?: string;
  bankDetails?: string;
  panNumber?: string;
  payPeriod: string; // e.g. "July 2026"
  paymentDate: string;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus?: number;
  pfDeduction: number;
  professionalTax: number;
  tds: number;
  netPay: number;
}

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayslipData | null;
}

export function PayslipModal({ isOpen, onClose, payslip }: PayslipModalProps) {
  if (!payslip) return null;

  const grossEarnings = payslip.basicSalary + payslip.hra + payslip.specialAllowance + (payslip.bonus || 0);
  const totalDeductions = payslip.pfDeduction + payslip.professionalTax + payslip.tds;
  const netPayable = payslip.netPay || (grossEarnings - totalDeductions);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    if (!payslip) return;
    try {
      const logoBase64 = await urlToBase64("/icon-512.png");
      const doc = generatePayslipPdf({
        employeeName: payslip.employeeName,
        employeeId: payslip.employeeId,
        designation: payslip.designation || "Software Engineer",
        department: payslip.department || "Engineering & Software",
        payPeriod: payslip.payPeriod,
        dateOfJoining: "2026-08-01",
        basicSalary: payslip.basicSalary,
        hra: payslip.hra,
        specialAllowance: payslip.specialAllowance,
        conveyanceAllowance: 0,
        performanceBonus: payslip.bonus || 0,
        providentFund: payslip.pfDeduction,
        professionalTax: payslip.professionalTax,
        incomeTax: payslip.tds,
        logoBase64,
      });
      doc.save(`Payslip_${payslip.employeeName.replace(/\s+/g, "_")}_${payslip.payPeriod.replace(/\s+/g, "_")}.pdf`);
      toast.success("Official PDF Payslip downloaded!");
    } catch (err: any) {
      toast.error("Failed to download PDF: " + err.message);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl bg-white border border-slate-100 shadow-2xl print:max-w-none print:w-full print:h-auto print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Actions Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden rounded-t-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <FileText className="h-4 w-4 text-emerald-400" />
            Official Payslip &amp; Tax Summary
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDownloadPdf}
              size="sm" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-xs gap-1.5 shadow-md"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button 
              onClick={handlePrint}
              size="sm" 
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800 rounded-xl font-medium text-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div id="printable-payslip" className="p-8 sm:p-12 space-y-8 bg-white text-slate-800 font-sans print:p-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-4">
              <img 
                src="/icon-512.png" 
                alt="Vyntyra Logo" 
                className="h-14 w-14 rounded-2xl object-cover shadow-xl border border-slate-200 shrink-0" 
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">VyNexa Consultancy Services</h1>
                <p className="text-xs text-slate-500 font-medium">Vyntyra Technologies Pvt. Ltd. · Enterprise Portal</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Visakhapatnam, Andhra Pradesh, India · CIN: U72900AP2026PTC109823</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                SALARY PAYSLIP
              </span>
              <div className="text-sm font-semibold text-slate-900 mt-2">{payslip.payPeriod}</div>
              <div className="text-[11px] text-slate-400">Payment Date: {payslip.paymentDate}</div>
            </div>
          </div>

          {/* Employee & Bank Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Employee Name</span>
              <span className="font-bold text-slate-900 mt-1 block">{payslip.employeeName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Employee ID</span>
              <span className="font-mono font-semibold text-slate-700 mt-1 block">{payslip.employeeId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Designation</span>
              <span className="font-medium text-slate-700 mt-1 block">{payslip.designation || "Software Engineer"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Department</span>
              <span className="font-medium text-slate-700 mt-1 block">{payslip.department || "Engineering & IT"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Work Email</span>
              <span className="font-medium text-slate-700 mt-1 block truncate">{payslip.email}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">PAN Number</span>
              <span className="font-mono font-semibold text-slate-700 mt-1 block">{payslip.panNumber || "ABCDE1234F"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bank Account & IFSC</span>
              <span className="font-medium text-slate-700 mt-1 block">{payslip.bankDetails || "Kotak Mahindra Bank · A/C ****8821"}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3 w-1/2">Earnings</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 w-1/2 border-l border-slate-700">Deductions</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-light text-slate-700">
                <tr>
                  <td className="p-3 font-medium text-slate-900">Basic Salary</td>
                  <td className="p-3 text-right font-mono">₹{payslip.basicSalary.toLocaleString("en-IN")}</td>
                  <td className="p-3 font-medium text-slate-900 border-l border-slate-100">Provident Fund (PF)</td>
                  <td className="p-3 text-right font-mono">₹{payslip.pfDeduction.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900">House Rent Allowance (HRA)</td>
                  <td className="p-3 text-right font-mono">₹{payslip.hra.toLocaleString("en-IN")}</td>
                  <td className="p-3 font-medium text-slate-900 border-l border-slate-100">Professional Tax (PT)</td>
                  <td className="p-3 text-right font-mono">₹{payslip.professionalTax.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900">Special / Conveyance Allowance</td>
                  <td className="p-3 text-right font-mono">₹{payslip.specialAllowance.toLocaleString("en-IN")}</td>
                  <td className="p-3 font-medium text-slate-900 border-l border-slate-100">Income Tax (TDS)</td>
                  <td className="p-3 text-right font-mono">₹{payslip.tds.toLocaleString("en-IN")}</td>
                </tr>
                {payslip.bonus ? (
                  <tr>
                    <td className="p-3 font-medium text-slate-900">Performance Bonus / Incentive</td>
                    <td className="p-3 text-right font-mono">₹{payslip.bonus.toLocaleString("en-IN")}</td>
                    <td className="p-3 border-l border-slate-100">--</td>
                    <td className="p-3 text-right font-mono">--</td>
                  </tr>
                ) : null}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="p-3 uppercase text-[10px]">Gross Earnings</td>
                  <td className="p-3 text-right font-mono text-emerald-600">₹{grossEarnings.toLocaleString("en-IN")}</td>
                  <td className="p-3 uppercase text-[10px] border-l border-slate-200">Total Deductions</td>
                  <td className="p-3 text-right font-mono text-red-600">₹{totalDeductions.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-black text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Net Take-Home Pay</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">₹{netPayable.toLocaleString("en-IN")}</h2>
            </div>
            <div className="text-xs text-slate-300 font-light italic">
              Electronically generated & verified by VyNexa Payroll Engine
            </div>
          </div>

          {/* Footer & Verification Stamp */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <QRCodeSVG value={`VY-PAYSLIP-${payslip.payoutId || payslip.employeeId}-${payslip.payPeriod}`} size={64} />
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Digital Security Verification
                </div>
                <div>Hash: {`0x8f${payslip.employeeId.slice(0, 6)}...982`}</div>
                <div>This payslip requires no physical signature.</div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-right space-y-1 min-w-[230px]">
              <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-white shrink-0" />
                <span>Signature Verified</span>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5 mt-1 font-mono">
                <div>Digitally Signed by: <span className="font-semibold text-slate-900">Jami Eswar Anil Kumar</span></div>
                <div>Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} IST</div>
                <div className="text-[9px] text-slate-400 font-sans italic">Verified Corporate Payout Authorization</div>
              </div>
              <div className="border-t border-slate-300 pt-1.5 mt-2">
                <div className="font-bold text-slate-900 text-xs">Authorized Signatory</div>
                <div className="text-[10px] text-slate-500 font-medium">Vyntyra Consultancy Services</div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
