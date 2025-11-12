import Image from 'next/image';
import Link from 'next/link';
import { Twitter, Facebook, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground border-t border-primary">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Branding */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-background">SMD Exam Portal</h3>
            <p className="text-muted">
              Ensuring fair and secure online assessments for everyone.
            </p>
            <div className="flex items-center gap-4">
              <Image src="/diulogoside.png" alt="DIU Logo" width={80} height={40} className="object-contain bg-white p-1 rounded" />
              <Image src="/sec_logo.jpg" alt="SEC Logo" width={80} height={40} className="object-contain bg-white p-1 rounded" />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-background">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-muted hover:text-background transition-all duration-300 transform hover:-translate-y-1 inline-block">Home</Link></li>
              <li><Link href="#how-it-works" className="text-muted hover:text-background transition-all duration-300 transform hover:-translate-y-1 inline-block">How It Works</Link></li>
              <li><Link href="#" className="text-muted hover:text-background transition-all duration-300 transform hover:-translate-y-1 inline-block">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-background">Connect With Us</h4>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted hover:text-background transition-all duration-300 transform hover:-translate-y-1 inline-block">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted hover:text-background transition-all duration-300 transform hover:-translate-y-1 inline-block">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted hover:text-background transition-all duration-300 transform hover:-translate-y-1 inline-block">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-primary py-4">
        <div className="container mx-auto text-center text-sm text-primary-foreground">
          &copy; {new Date().getFullYear()} SMD Exam Portal. All rights reserved. Powered by SelfMadeDev.
        </div>
      </div>
    </footer>
  );
}
