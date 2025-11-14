import Image from 'next/image';
import Link from 'next/link';
import { Twitter, Facebook, Linkedin, Globe, ChevronRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#245F73] border-t border-[#245F73]">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Branding */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary-foreground">SMD Exam Portal</h3>
            <p className="text-primary-foreground">
              Ensuring fair and secure online assessments for everyone.
            </p>
            <div className="flex items-center gap-4">
              <Image src="/ByteBlooper (1) (1).png" alt="ByteBlooper Logo" width={80} height={40} className="object-contain bg-[#245F73] p-1 rounded" />
            </div>
            <p className="text-primary-foreground text-xs">
              a product of ByteBlooper
            </p>
          </div>
          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary-foreground">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="flex items-center text-primary-foreground hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                <ChevronRight className="h-4 w-4 mr-2" />
                Home
              </Link></li>
              <li><Link href="#how-it-works" className="flex items-center text-primary-foreground hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                <ChevronRight className="h-4 w-4 mr-2" />
                How It Works
              </Link></li>
              <li><Link href="mailto:official@byteblooper.com" className="flex items-center text-primary-foreground hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                <ChevronRight className="h-4 w-4 mr-2" />
                Contact
              </Link></li>
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-primary-foreground">Connect With Us</h4>
            <div className="flex space-x-4">
            
              <Link href="https://www.byteblooper.com/" className="text-primary-foreground hover:text-white transition-all duration-300 transform hover:-translate-y-1 inline-block" target="_blank" rel="noopener noreferrer">
                <Globe className="h-6 w-6" />
              </Link>
              <Link href="https://www.facebook.com/share/1DBy8sVPMq/" className="text-primary-foreground hover:text-white transition-all duration-300 transform hover:-translate-y-1 inline-block" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="https://www.linkedin.com/company/byte-blooper/" className="text-primary-foreground hover:text-white transition-all duration-300 transform hover:-translate-y-1 inline-block " target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#245F73] py-4">
        <div className="container mx-auto text-center text-sm text-primary-foreground">
          &copy; {new Date().getFullYear()} ByteBlooper. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
