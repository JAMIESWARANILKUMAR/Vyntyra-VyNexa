import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck, Cpu, Phone, MapPin, Calendar, Heart, CheckCircle2, Radio, QrCode, User, Building2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { toast } from "sonner";

interface IdCardData {
  employeeId: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  dateOfJoining?: string;
  validUntil?: string;
  securityLevel?: string;
  officeLocation?: string;
}

interface IdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: IdCardData | null;
}

export function IdCardModal({ isOpen, onClose, employee }: IdCardModalProps) {
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

  if (!employee) return null;

  const empIdSerial = employee.employeeId.startsWith("VY-") 
    ? employee.employeeId 
    : `VY-EMP-${employee.employeeId.slice(0, 8).toUpperCase()}`;

  const nfcPayload = JSON.stringify({
    org: "VyNexa Consultancy Services",
    id: empIdSerial,
    name: employee.fullName,
    role: employee.role,
    dept: employee.department || "Engineering",
    clearance: employee.securityLevel || "Level-3 Enterprise",
    valid: employee.validUntil || "2027-12-31"
  });

  async function handleTransmitNfc() {
    if (!("NDEFReader" in window)) {
      setNfcSupported(false);
      toast.info("Web NFC is supported on Android Chrome devices. Copying digital NFC payload to clipboard!");
      navigator.clipboard.writeText(nfcPayload);
      toast.success("NFC Smart Badge payload copied to clipboard!");
      return;
    }

    try {
      setNfcWriting(true);
      // @ts-ignore Web NFC API
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [
          { recordType: "url", data: `https://vyntyraconsultancyservices.in/verify?emp=${empIdSerial}` },
          { recordType: "text", data: nfcPayload }
        ]
      });
      toast.success("NFC Smart Badge updated! Hold badge near phone reader.");
    } catch (err: any) {
      toast.error(err.message || "Failed to write NFC tag. Ensure NFC is enabled in phone settings.");
    } finally {
      setNfcWriting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-white border border-slate-100 shadow-2xl print:max-w-none print:w-full print:h-auto print:shadow-none print:border-none print:rounded-none">
        
        {/* Actions Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 print:hidden rounded-t-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="h-4 w-4 text-emerald-400" />
            Dual-Sided Smart NFC Badge & Security Pass
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleTransmitNfc}
              size="sm"
              variant="outline"
              disabled={nfcWriting}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-xl font-medium text-xs gap-1.5"
            >
              <Radio className={`h-3.5 w-3.5 ${nfcWriting ? 'animate-ping' : ''}`} /> 
              {nfcWriting ? "Tap NFC Card to Phone..." : "Write/Transmit to NFC Badge"}
            </Button>

            <Button 
              onClick={handlePrint}
              size="sm" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-xs gap-1.5 shadow-md"
            >
              <Printer className="h-3.5 w-3.5" /> Print Dual-Sided ID Pass
            </Button>
          </div>
        </div>

        {/* Both Cards Preview (Front & Back) */}
        <div id="printable-id-card" className="p-8 sm:p-12 space-y-10 bg-slate-50 print:bg-white print:p-4">
          
          <div className="text-center print:hidden">
            <h2 className="text-lg font-bold text-slate-900">Official Employee ID Pass (NFC & RFID Enabled)</h2>
            <p className="text-xs text-slate-500 font-light mt-1">High-resolution printable badge layout with RFID chip emulator and QR authentication.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            {/* FRONT OF ID CARD */}
            <div className="w-[320px] h-[510px] mx-auto bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-800 print:shadow-none print:border-2 print:border-slate-900">
              
              {/* Top Bar / Lanyard Slot Indicator */}
              <div className="absolute top-2 inset-x-0 flex justify-center">
                <div className="w-12 h-2 bg-slate-800 rounded-full border border-slate-700" />
              </div>

              <div className="pt-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 bg-white text-black font-extrabold text-lg rounded-xl flex items-center justify-center shadow-lg">
                      V
                    </div>
                    <div>
                      <div className="font-extrabold text-sm tracking-tight text-white leading-tight">VyNexa</div>
                      <div className="text-[8px] text-emerald-400 uppercase tracking-widest font-semibold">Consultancy Services</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    STAFF
                  </span>
                </div>

                {/* Profile Photo & Info */}
                <div className="text-center mt-6">
                  <div className="relative inline-block">
                    <ProfileAvatar url={employee.avatarUrl} name={employee.fullName} className="h-28 w-28 text-3xl mx-auto ring-4 ring-emerald-500/40 shadow-2xl" />
                    <div className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg" title="NFC Smart Chip Active">
                      <Cpu className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mt-4 tracking-tight">{employee.fullName}</h3>
                  <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">{employee.role}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{employee.department || "Engineering & IT"}</p>
                </div>
              </div>

              {/* NFC Chip Graphic & Employee ID */}
              <div className="space-y-3 my-2">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">Employee Serial</span>
                    <span className="font-mono font-bold text-white mt-0.5 block">{empIdSerial}</span>
                  </div>
                  {/* Gold Sim-Style Chip Graphic */}
                  <div className="w-10 h-7 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 rounded-md border border-amber-600/50 p-1 flex flex-col justify-between shadow-inner">
                    <div className="w-full h-0.5 bg-amber-700/40" />
                    <div className="w-full h-0.5 bg-amber-700/40" />
                    <div className="w-full h-0.5 bg-amber-700/40" />
                  </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-slate-400 block font-light">Blood Group</span>
                    <span className="font-bold text-red-400 mt-0.5 block">{employee.bloodGroup || "O+ Positive"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-light">Clearance Level</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">{employee.securityLevel || "L3 - Enterprise"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-light">Joined Date</span>
                    <span className="font-medium text-slate-200 mt-0.5 block">{employee.dateOfJoining || "15 Jan 2026"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-light">Valid Thru</span>
                    <span className="font-medium text-slate-200 mt-0.5 block">{employee.validUntil || "31 Dec 2028"}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[9px] text-slate-400">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" /> RFID / NFC Pass</span>
                <span>Visakhapatnam HQ</span>
              </div>
            </div>

            {/* BACK OF ID CARD */}
            <div className="w-[320px] h-[510px] mx-auto bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-800 print:shadow-none print:border-2 print:border-slate-900">
              
              {/* Top Magnetic Strip */}
              <div className="absolute top-6 inset-x-0 h-10 bg-black border-y border-slate-800" />

              <div className="pt-16 space-y-4">
                
                {/* Emergency & Address Details */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Emergency Contact</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><Phone className="h-3 w-3" /> {employee.emergencyContact || "+91 98765 00000"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Office Location</span>
                    <span className="text-slate-300 font-medium mt-0.5 block">{employee.officeLocation || "VyNexa IT Tower, Cyber Hills, Visakhapatnam, AP, 530045"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Authorized Signatory</span>
                    <span className="text-slate-300 font-serif italic mt-0.5 block font-bold">Jami Eswar Anil Kumar (Director)</span>
                  </div>
                </div>

                {/* QR Code & NFC Antenna Signal */}
                <div className="bg-white text-slate-900 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scan to Verify</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">Instant HR Check</div>
                    <div className="text-[9px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <Radio className="h-3 w-3 animate-pulse" /> NFC Sensor Ready
                    </div>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                    <QRCodeSVG value={`https://vyntyraconsultancyservices.in/verify?emp=${empIdSerial}`} size={75} />
                  </div>
                </div>

              </div>

              {/* Instructions */}
              <div className="space-y-2 text-[9px] text-slate-400 text-center border-t border-slate-800 pt-3">
                <p>This card remains property of VyNexa Consultancy Services. If found, please return to any company facility or call HR at support@vyntyraconsultancyservices.in.</p>
                <p className="font-mono text-[8px] text-slate-500">NFC UID: {`04:${empIdSerial.slice(0, 4)}:${empIdSerial.slice(4, 8)}:8F`}</p>
              </div>

            </div>

          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
