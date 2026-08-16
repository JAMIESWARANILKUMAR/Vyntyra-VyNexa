import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, Linkedin, Twitter, Instagram, Facebook, Globe, MessageSquare, Briefcase, Chrome, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

function VisitorCounter() {
  const count = 12459;

  return (
    <div className="flex items-center gap-3 text-xs text-primary-foreground/60 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-5 py-2.5 rounded-full border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md cursor-default">
      <Users className="h-4 w-4 text-gold/80" />
      <span className="font-medium tracking-wide">Total Visitors</span>
      <div className="w-px h-3 bg-white/20" />
      <span className="text-white font-mono tracking-tight tabular-nums font-semibold">{count.toLocaleString()}</span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-[#0a1128] text-primary-foreground overflow-hidden">
      {/* Premium subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1128] to-[#050814] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />
      
      {/* Top Border Glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-70" />

      <div className="relative mx-auto w-full max-w-[1800px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Brand & Logo */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="inline-block w-fit opacity-90 hover:opacity-100 transition-opacity">
              <img 
                src="/icon-512.png" 
                alt="Vyntyra" 
                className="h-10 w-auto object-contain rounded-md drop-shadow-md"  
              />
            </Link>
            <div>
              <h2 className="font-semibold text-lg tracking-tight text-white/95">Vyntyra</h2>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold/90 font-medium mt-0.5">
                Consultancy Services
              </div>
            </div>
            <p className="text-xs text-primary-foreground/60 leading-relaxed">
              Engineering the next generation of intelligent search infrastructure and enterprise AI solutions. 
              Pioneering tomorrow's digital capabilities today.
            </p>
            
            <div className="flex flex-wrap gap-2.5 mt-2">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Globe, label: "Website" },
                { Icon: MessageSquare, label: "Discord" },
                { Icon: Briefcase, label: "Glassdoor" },
                { Icon: Linkedin, label: "LinkedIn" },
                { Icon: Chrome, label: "Google" }
              ].map(({ Icon, label }, i) => (
                <a key={i} href="#" title={label} className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-[#0a1128] transition-all duration-300">
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-4 flex items-center gap-2">
              Company
            </h3>
            <ul className="space-y-2.5 text-xs text-primary-foreground/60 font-medium">
              <li>
                <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  About Vyntyra 
                  <ExternalLink className="h-3 w-3 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-gold" />
                </a>
              </li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Why Join Us</Link></li>
              <li><Link to="/status" className="hover:text-white transition-colors">Track Application</Link></li>
            </ul>
          </div>
          
          {/* Support & Portals */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-4 flex items-center gap-2">
              Secure Portals
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <Link to="/auth/employee" className="group flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all">
                <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">Employee Dashboard</span>
                <ExternalLink className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 transition-all" />
              </Link>
              <Link to="/auth/intern" className="group flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all">
                <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">Intern Dashboard</span>
                <ExternalLink className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 transition-all" />
              </Link>
              <Link to="/auth/admin" className="group flex items-center justify-between p-2.5 rounded-lg bg-gold/[0.02] hover:bg-gold/[0.08] border border-transparent hover:border-gold/20 transition-all">
                <span className="text-xs font-medium text-gold/70 group-hover:text-gold transition-colors">Super Admin</span>
                <ShieldCheck className="h-3.5 w-3.5 text-gold/40 group-hover:text-gold/80 transition-all" />
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-4">
              Global HQ
            </h3>
            <div className="space-y-3">
              <a href="mailto:hr@vyntyraconsultancyservices.in" className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-gold/30 transition-all group">
                <div className="bg-black/20 p-1.5 rounded-md shadow-inner">
                  <Mail className="h-3.5 w-3.5 text-gold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-primary-foreground/40">Email</span>
                  <span className="text-xs leading-tight text-white/80 group-hover:text-white transition-colors truncate">Send an Email</span>
                </div>
              </a>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-gold/30 transition-all group">
                <div className="bg-black/20 p-1.5 rounded-md shadow-inner">
                  <MapPin className="h-3.5 w-3.5 text-gold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-primary-foreground/40">India</span>
                  <span className="text-xs leading-tight text-white/80 group-hover:text-white transition-colors truncate">Global Delivery Center</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-primary-foreground/40 font-medium">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold/50" />
              © {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.
            </div>
            <div className="text-[10px] text-white/40">
              Managed by Legal Authorized Person: <span className="text-white/60">JAMI ESWAR ANIL KUMAR</span> (Founder &amp; Director) · <a href="mailto:jamieswaranilkumar@vyntyraconsultancyservices.in" className="hover:text-gold transition-colors">jamieswaranilkumar@vyntyraconsultancyservices.in</a>
            </div>
          </div>
          
          <VisitorCounter />
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gold transition-colors">Terms &amp; Conditions</Link>
            <Link to="/agreement" className="hover:text-gold transition-colors">User Agreement</Link>
            <Link to="/refunds" className="hover:text-gold transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
