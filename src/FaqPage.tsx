import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle } from 'lucide-react';
import SiteNav from './SiteNav';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-[#3c4949]/20 py-5">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left py-2 focus:outline-none group cursor-pointer"
      >
        <span className="font-display text-headline-sm uppercase text-[#dee4e3] group-hover:text-primary transition-colors duration-200">
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="text-primary shrink-0 ml-4" size={18} />
        ) : (
          <ChevronDown className="text-on-surface-variant group-hover:text-primary shrink-0 ml-4 transition-colors" size={18} />
        )}
      </button>
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="font-body text-body-md text-on-surface-variant leading-relaxed pb-2 whitespace-pre-line">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const FAQS = [
    {
      question: "What cameras are the Detroit Night LUT Packs designed for?",
      answer: "The Detroit Night LUT Pack is designed specifically for low-light log profiles, including Blackmagic Design Generation 5 Color Science (BMPCC 4K/6K/Pyxis 6K). They are tuned to preserve skin tones and mid-tone contrast while rolling off heavy sodium streetlights into clean, rich amber tones."
    },
    {
      question: "How do I install LUTs or PowerGrades in DaVinci Resolve?",
      answer: "In DaVinci Resolve:\n1. Open your Project Settings and navigate to 'Color Management'.\n2. Scroll down and click 'Open LUT Folder'.\n3. Copy the .cube files into the opened directory, then hit 'Update Lists' in Resolve.\n\nFor PowerGrades, simply right-click in your gallery background panel, select 'Import', and navigate to the extracted .drx files."
    },
    {
      question: "Which adapter was used for the PL-mount NiSi Athena lens review?",
      answer: "I used a professional PL-to-L mount adapter (such as the Wooden Camera or Sigma adapter) to mount the PL version of the NiSi Athena lenses onto the Blackmagic Pyxis 6K camera rig. This ensures flange distance accuracy and provides a rock-solid physical connection."
    },
    {
      question: "Are your LUTs and digital products available worldwide?",
      answer: "Yes, all digital assets (LUT packs, PowerGrades, and PDF guidebooks) are delivered instantly via digital download email link immediately after payment is verified. You can purchase and download them from any country globally."
    },
    {
      question: "How do I book cinematography or grading services for a project?",
      answer: "Please navigate to our Contact page and fill out the inquiry form with your project type (commercial, documentary, narrative), target shooting dates, and estimated budget. I will review and reply within 48 business hours with availability details."
    }
  ];

  return (
    <div className="min-h-screen text-on-surface font-body relative bg-background">
      <div className="film-grain"></div>

      <SiteNav />

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 md:px-16 max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <HelpCircle size={16} />
            </div>
            <span className="font-mono text-label-md text-primary tracking-widest uppercase">Support Center</span>
          </div>
          <h1 className="font-display text-display-md md:text-display-lg uppercase leading-none">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <div className="teal-divider mt-6"></div>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-2 bg-surface-container-lowest p-8 border border-outline-variant/30">
          {FAQS.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-16 border-t border-[#3c4949]/20 bg-[#090f10]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="font-display text-headline-sm text-on-surface uppercase">
            My Cine Toolbox
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/faq" className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase">
              FAQ
            </Link>
            <Link to="/privacy" className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase">
              Privacy Policy
            </Link>
            <p className="font-mono text-[10px] text-outline uppercase tracking-tighter">
              © 2026 Aaron Stowers Cinematography. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
