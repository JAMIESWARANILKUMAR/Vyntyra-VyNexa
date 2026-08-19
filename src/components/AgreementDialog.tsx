import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function AgreementDialog({ open, onOpenChange, onAccept }: AgreementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Applicant Terms &amp; Privacy Notice</DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-4">
          <p>
            By submitting this application, you acknowledge and agree that Vyntyra Consultancy Services and its authorized officials (JAMI ESWAR ANIL KUMAR, Founder &amp; Director, jamieswaranilkumar@vyntyraconsultancyservices.in) may contact you and use the information you provided for employment‑related purposes, including but not limited to candidate evaluation, background checks, and onboarding communications.
          </p>
          <p>
            Your data will be processed in accordance with our Privacy Policy and applicable data‑protection regulations (DPDPA 2023). The information will be stored securely, encrypted at rest, and accessed only by authorised HR personnel.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 font-medium leading-relaxed">
            <strong>Note / Information:</strong> Exam fee is payable to receive certificate and stipend will be provided for top 10% interns up to ₹5,000 to ₹15,000 (terms and eligibility apply). Once the payment is done, only then your dashboard will be fully functional.
          </div>
          <p>
            You confirm that all information submitted is accurate to the best of your knowledge and that you have read and understood the terms and privacy notice linked in the application form.
          </p>
        </DialogDescription>
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAccept}>I Agree</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
