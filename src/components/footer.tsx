import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, Github, Linkedin, Twitter } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t border-primary/20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Brand & Logo */}
          <div className="lg:col-span-1">
            <div className="flex flex-col gap-4 mb-6">
              <div className="inline-block bg-white/5 rounded-md p-3 backdrop-blur-sm border border-white/10 w-fit">
                <img 
                  src="https://vyntyraconsultancyservices.in/logo.png" 
                  alt="Vyntyra" 
                  className="h-12 w-auto object-contain drop-shadow-md" 
                />
              </div>
              <div>
                <div className="font-semibold text-xl leading-tight text-white">Vyntyra</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold mt-1">
                  Consultancy Services
                </div>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Engineering the next generation of intelligent search infrastructure and enterprise AI solutions.
            </p>
            
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold hover:text-primary transition-colors">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-gold font-semibold mb-5 flex items-center gap-2">
              Company
            </div>
            <ul className="space-y-3 text-sm text-primary-foreground/75">
              <li>
                <a href="https://vyntyraconsultancyservices.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  About Vyntyra 
                  <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </li>
              <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Why Join Us</Link></li>
              <li><Link to="/status" className="hover:text-white transition-colors">Track Application</Link></li>
            </ul>
          </div>
          
          {/* Support & Portals */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-gold font-semibold mb-5 flex items-center gap-2">
              Portals
            </div>
            <ul className="space-y-3 text-sm text-primary-foreground/75 mb-6">
              <li><Link to="/auth" className="hover:text-white transition-colors">Employee Login</Link></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
            </ul>
            
            <div className="mt-8">
              <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-gold hover:text-primary transition-all text-sm font-medium h-9" asChild>
                <Link to="/auth">Access Secure Portal</Link>
              </Button>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-gold font-semibold mb-5">
              Contact & Global HQ
            </div>
            <ul className="space-y-4 text-sm text-primary-foreground/75">
              <li className="flex items-start gap-3 group">
                <div className="bg-white/5 p-1.5 rounded-md group-hover:bg-gold/20 transition-colors">
                  <Mail className="h-4 w-4 text-gold" />
                </div>
                <span className="mt-1 leading-tight group-hover:text-white transition-colors">hr@vyntyraconsultancyservices.in</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="bg-white/5 p-1.5 rounded-md group-hover:bg-gold/20 transition-colors">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <span className="mt-1 leading-tight group-hover:text-white transition-colors">Support via website</span>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="bg-white/5 p-1.5 rounded-md group-hover:bg-gold/20 transition-colors">
                  <MapPin className="h-4 w-4 text-gold" />
                </div>
                <span className="mt-1 leading-relaxed group-hover:text-white transition-colors">India<br/><span className="text-xs text-primary-foreground/50">Global Delivery Center</span></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-primary-foreground/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold/50" />
            © {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Notice</Link>
            <Link to="/terms" className="hover:text-gold transition-colors">Applicant Terms</Link>
            <Link to="/track" className="hover:text-gold transition-colors">Security Policy</Link>
            <a href="#" className="hover:text-gold transition-colors">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
