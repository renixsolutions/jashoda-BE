const fs = require('fs');
const path = require('path');

const filePath = 'd:/Renix/Jashoda_Jewels/new jashoda/new jashoda/main_front/jashoda_frontend_march_1/src/app/checkout/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Change Heading Font and Icon for Shipping Information
content = content.replace(
    /<h2 className="text-3xl font-serif text-\[\#31111B\] flex items-center gap-3">/g,
    '<h2 className="text-2xl md:text-3xl font-sans font-extrabold text-[#31111B] tracking-tight flex items-center gap-3">'
);
content = content.replace(
    /<Truck className="w-6 h-6" \/>/g,
    '<Truck className="w-7 h-7 text-[#C5A059]" strokeWidth={1.5} />'
);

// Change Heading Font and Icon for Payment Method
content = content.replace(
    /<h2 className="text-3xl font-serif text-\[\#31111B\] mb-6 flex items-center gap-3">/g,
    '<h2 className="text-2xl md:text-3xl font-sans font-extrabold text-[#31111B] tracking-tight mb-6 flex items-center gap-3">'
);
content = content.replace(
    /<CreditCard className="w-6 h-6" \/>/g,
    '<CreditCard className="w-7 h-7 text-[#C5A059]" strokeWidth={1.5} />'
);

// Change Order Summary Heading
content = content.replace(
    /<h2 className="text-xl font-serif text-\[\#1E2856\] mb-6">Order Summary<\/h2>/g,
    '<h2 className="text-xl font-sans font-extrabold text-[#31111B] tracking-tight mb-6 pb-4 border-b border-[#31111B]/10">Order Summary</h2>'
);
content = content.replace(
    /<h2 className="text-xl font-serif text-\[\#31111B\] mb-6">Order Summary<\/h2>/g,
    '<h2 className="text-xl font-sans font-extrabold text-[#31111B] tracking-tight mb-6 pb-4 border-b border-[#31111B]/10">Order Summary</h2>'
);

// Map Icon
content = content.replace(
    /<MapIcon className="w-4 h-4" \/>/g,
    '<MapIcon className="w-4 h-4" strokeWidth={1.5} />'
);

// Plus Icon
content = content.replace(
    /<Plus className="w-4 h-4" \/>/g,
    '<Plus className="w-4 h-4" strokeWidth={1.5} />'
);

// Shield Icon
content = content.replace(
    /<ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" \/>/g,
    '<ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />'
);

// ChevronRight Icon
content = content.replace(
    /<ChevronRight className="w-4 h-4" \/>/g,
    '<ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />'
);
content = content.replace(
    /<ChevronRight className="w-5 h-5" \/>/g,
    '<ChevronRight className="w-4 h-4" strokeWidth={1.5} />'
);


fs.writeFileSync(filePath, content);
console.log('Fonts and icons updated successfully!');
