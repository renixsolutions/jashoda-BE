const fs = require('fs');

const filePath = 'd:/Renix/Jashoda_Jewels/new jashoda/new jashoda/main_front/jashoda_frontend_march_1/src/components/auth/EmailVerificationModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Overlay
content = content.replace(/bg-black\/60/g, 'bg-[#31111B]/40');

// Modal container
content = content.replace(/bg-white rounded-2xl shadow-2xl/g, 'bg-[#FAFAFA] rounded-[24px] shadow-[0_10px_40px_rgba(49,17,27,0.1)] border border-[#31111B]/10');

// Close button
content = content.replace(/text-gray-400 hover:text-gray-600/g, 'text-[#31111B]/40 hover:text-[#31111B] hover:bg-[#31111B]/5 rounded-full');

// Icon container
content = content.replace(/bg-\[\#1E2856\]\/5/g, 'bg-[#C5A059]/10 border border-[#C5A059]/20 shadow-inner');
content = content.replace(/text-\[\#1E2856\]/g, 'text-[#C5A059]');
content = content.replace(/<Mail className="w-8 h-8 text-\[\#C5A059\]" \/>/, '<Mail className="w-7 h-7 text-[#C5A059]" strokeWidth={1} />');

// Typography
content = content.replace(/<h2 className="text-2xl font-serif text-\[\#C5A059\] mb-3">/g, '<h2 className="text-2xl font-serif text-[#31111B] mb-3 tracking-wide">');
content = content.replace(/text-gray-500 mb-8/g, 'text-[#31111B]/60 mb-8 font-light leading-relaxed');

// Alerts
// Green alert (Success)
content = content.replace(/bg-green-50 border border-green-100/g, 'bg-emerald-50/50 border border-emerald-100/50');
content = content.replace(/text-green-800/g, 'text-[#31111B]');
content = content.replace(/text-green-700/g, 'text-[#31111B]/70 font-light');
content = content.replace(/<CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0\.5" \/>/g, '<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.5} />');

// Amber alert (Warning/Info)
content = content.replace(/bg-amber-50 border border-amber-100/g, 'bg-[#C5A059]/5 border border-[#C5A059]/20');
content = content.replace(/text-amber-800/g, 'text-[#31111B]');
content = content.replace(/text-amber-700/g, 'text-[#31111B]/70 font-light');
content = content.replace(/<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0\.5" \/>/g, '<AlertCircle className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" strokeWidth={1.5} />');

// Buttons
content = content.replace(
    /className="w-full py-4 bg-\[\#1E2856\] text-white rounded-xl hover:bg-\[\#151b3b\] font-medium flex items-center justify-center gap-2"/g,
    'className="w-full h-14 bg-[#31111B] text-[#D4AF37] hover:bg-[#4a1825] text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#31111B]/10 transition-all duration-300"'
);

content = content.replace(
    /className="w-full py-3 text-gray-500 hover:text-gray-700"/g,
    'className="w-full py-3 text-[#31111B]/50 hover:text-[#31111B] hover:bg-[#31111B]/5 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all duration-300"'
);

// Footer
content = content.replace(/bg-gray-50 p-4 border-t border-gray-100/g, 'bg-white p-5 border-t border-[#31111B]/5');
content = content.replace(/text-gray-400 font-light/g, 'text-[#31111B]/50 font-light');
content = content.replace(/className="text-\[\#C5A059\] font-semibold hover:underline"/g, 'className="text-[#C5A059] font-bold uppercase text-[9px] tracking-widest hover:underline ml-1"');

fs.writeFileSync(filePath, content);
console.log('Modal redesigned successfully!');
