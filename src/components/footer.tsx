import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, Github, Linkedin, Twitter, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

function VisitorCounter() {
  // Mock visitor count, starts at a high number and increments slowly
  const [count, setCount] = useState(384592);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5 text-xs text-primary-foreground/60 bg-primary-foreground/[0.03] hover:bg-primary-foreground/[0.05] transition-colors px-4 py-2 rounded-full border border-primary-foreground/10 cursor-default">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <Users className="h-3.5 w-3.5 text-primary-foreground/40" />
      <span className="font-medium tracking-wide">Total Visitors:</span> 
      <span className="text-white font-mono tracking-tight tabular-nums">{count.toLocaleString()}</span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-[#0a1128] text-primary-foreground overflow-hidden">
      {/* Premium subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5 pointer-events-none" />
      
      {/* Top Border Glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent opacity-50" />

      <div className="relative mx-auto w-full max-w-6xl px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand & Logo (Takes up 4 columns on large screens) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link to="/" className="inline-block w-fit opacity-90 hover:opacity-100 transition-opacity">
              <img 
                src="https://vyntyraconsultancyservices.in/logo.png" 
                alt="Vyntyra" 
                className="h-9 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]" 
              />
            </Link>
            <div>
              <h2 className="font-semibold text-xl tracking-tight text-white/95">Vyntyra</h2>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold/90 font-medium mt-1">
                Consultancy Services
              </div>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-sm">
              Engineering the next generation of intelligent search infrastructure and enterprise AI solutions. 
              Pioneering tomorrow's digital capabilities today.
            </p>
            
            <div className="flex gap-3 mt-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-primary-foreground/10 bg-primary-foreground/5 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-primary transition-all duration-300">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-6 flex items-center gap-2">
              Company
            </h3>
            <ul className="space-y-3.5 text-[13px] text-primary-foreground/60 font-medium">
              <li>
                <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  About Vyntyra 
                  <ExternalLink className="h-3 w-3 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-gold" />
                </a>
              </li>
              <li><Link to="/" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Careers</Link></li>
              <li><Link to="/about" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Why Join Us</Link></li>
              <li><Link to="/status" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Track Application</Link></li>
            </ul>
          </div>
          
          {/* Support & Portals */}
          <div className="lg:col-span-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-6 flex items-center gap-2">
              Secure Portals
            </h3>
            <ul className="space-y-3.5 text-[13px] text-primary-foreground/60 font-medium mb-6">
              <li><Link to="/auth" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Employee Workspace</Link></li>
              <li><Link to="/auth" className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-300">Admin Dashboard</Link></li>
            </ul>
            
            <div className="mt-6">
              <Button variant="outline" className="w-full sm:w-auto bg-primary-foreground/[0.03] border-primary-foreground/20 hover:bg-gold hover:border-gold hover:text-primary transition-all duration-300 text-sm font-medium h-10 px-6 rounded-sm shadow-sm" asChild>
                <Link to="/auth">Authenticate</Link>
              </Button>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold mb-6">
              Global HQ
            </h3>
            <ul className="space-y-5 text-[13px] text-primary-foreground/60">
              <li className="flex items-start gap-4 group">
                <div className="bg-primary-foreground/5 p-2 rounded-sm border border-primary-foreground/10 group-hover:border-gold/30 transition-colors duration-300">
                  <Mail className="h-4 w-4 text-gold" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-primary-foreground/40 mb-0.5">Email</span>
                  <a href="mailto:hr@vyntyraconsultancyservices.in" className="leading-tight hover:text-white transition-colors">hr@vyntyraconsultancyservices.in</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="bg-primary-foreground/5 p-2 rounded-sm border border-primary-foreground/10 group-hover:border-gold/30 transition-colors duration-300">
                  <MapPin className="h-4 w-4 text-gold" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-primary-foreground/40 mb-0.5">India</span>
                  <span className="leading-relaxed group-hover:text-white transition-colors">Global Delivery Center</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-20 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-primary-foreground/40 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold/50" />
            © {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.
          </div>
          
          <VisitorCounter />
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Notice</Link>
            <Link to="/terms" className="hover:text-gold transition-colors">Applicant Terms</Link>
            <Link to="/track" className="hover:text-gold transition-colors">Security Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
