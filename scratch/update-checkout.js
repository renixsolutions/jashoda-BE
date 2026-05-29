const fs = require('fs');
const path = require('path');

const filePath = 'd:/Renix/Jashoda_Jewels/new jashoda/new jashoda/main_front/jashoda_frontend_march_1/src/app/checkout/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Colors
content = content.replace(/text-\[\#1E2856\]/g, 'text-[#31111B]');
content = content.replace(/bg-\[\#1E2856\]/g, 'bg-[#31111B]');
content = content.replace(/border-\[\#1E2856\]/g, 'border-[#31111B]');
content = content.replace(/hover:bg-\[\#151b3b\]/g, 'hover:bg-[#4a1825]');
content = content.replace(/focus:ring-\[\#1E2856\]/g, 'focus:ring-[#C5A059]');
content = content.replace(/text-gray-900/g, 'text-[#31111B]');

// Backgrounds & Borders
content = content.replace(/bg-gray-50/g, 'bg-[#FAFAFA]');
content = content.replace(/border-gray-100/g, 'border-[#31111B]/10');
content = content.replace(/border-gray-200/g, 'border-[#31111B]/10');
content = content.replace(/border-gray-300/g, 'border-[#31111B]/20');
content = content.replace(/text-gray-500/g, 'text-[#31111B]/60');
content = content.replace(/text-gray-600/g, 'text-[#31111B]/70');
content = content.replace(/text-gray-700/g, 'text-[#31111B]/80');

// Component specific
// "min-h-screen pt-6 pb-24 bg-gray-50" -> "min-h-screen pt-12 pb-24 bg-white relative z-10"
content = content.replace(/min-h-screen pt-6 pb-24 bg-\[\#FAFAFA\]/g, 'min-h-screen pt-12 pb-24 bg-white relative z-10');
content = content.replace(/min-h-screen pt-6 pb-24 bg-gray-50/g, 'min-h-screen pt-12 pb-24 bg-white relative z-10');

// Form containers "bg-white p-6 md:p-8 rounded-xl shadow-sm border border-[#31111B]/10"
content = content.replace(/bg-white p-6 md:p-8 rounded-xl shadow-sm border border-\[\#31111B\]\/10/g, 'bg-[#FAFAFA] p-6 md:p-8 rounded-[24px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-[#31111B]/10');
content = content.replace(/bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100/g, 'bg-[#FAFAFA] p-6 md:p-8 rounded-[24px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-[#31111B]/10');

// Order Summary Container
content = content.replace(/<div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-\[\#31111B\]\/10 sticky top-32">/g, '<div className="bg-[#FAFAFA] p-6 md:p-8 rounded-[24px] border border-[#31111B]/5 sticky top-32">');
content = content.replace(/<div className="bg-[#FAFAFA] p-6 md:p-8 rounded-\[24px\] shadow-\[inset_0_2px_10px_rgba\(0,0,0,0\.02\)\] border border-\[\#31111B\]\/10 sticky top-32">/g, '<div className="bg-[#FAFAFA] p-6 md:p-8 rounded-[24px] border border-[#31111B]/5 sticky top-32">');
content = content.replace(/<div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 sticky top-32">/g, '<div className="bg-[#FAFAFA] p-6 md:p-8 rounded-[24px] border border-[#31111B]/5 sticky top-32">');

// Input styles
content = content.replace(/className="w-full border border-\[\#31111B\]\/20 rounded-lg px-4 py-3 text-\[\#31111B\] focus:outline-none focus:ring-1 focus:ring-\[\#C5A059\]"/g, 'className="w-full border border-[#31111B]/20 rounded-xl px-4 py-3 text-[#31111B] bg-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"');
content = content.replace(/className="w-full border border-\[\#31111B\]\/20 rounded-lg px-4 py-3 text-\[\#31111B\] focus:outline-none focus:ring-1 focus:ring-\[\#C5A059\] bg-white"/g, 'className="w-full border border-[#31111B]/20 rounded-xl px-4 py-3 text-[#31111B] bg-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"');

// Empty state
content = content.replace(/<div className="min-h-\[60vh\] flex flex-col items-center justify-center p-4">/, '<div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-white relative z-10">');
content = content.replace(/<h1 className="text-3xl font-serif text-\[\#31111B\] mb-4">Your Bag is Empty<\/h1>/, '<div className="w-24 h-24 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-8 shadow-inner border border-[#31111B]/5"><ShoppingBag className="w-10 h-10 text-[#C5A059]" strokeWidth={1} /></div><h1 className="text-4xl font-serif text-[#31111B] mb-4 tracking-wide">Your Bag is Empty</h1>');
content = content.replace(/<Button className="bg-\[\#31111B\] text-white px-8 py-3 rounded-full hover:bg-\[\#4a1825\]">/, '<Button className="bg-[#31111B] text-[#D4AF37] px-10 py-6 rounded-full hover:bg-[#4a1825] transition-colors uppercase tracking-widest text-xs font-bold shadow-lg shadow-[#31111B]/20">');

// Continue buttons
content = content.replace(/<Button type="submit" className="w-full py-4 bg-\[\#31111B\] text-white rounded-lg hover:bg-\[\#4a1825\] font-medium text-lg flex items-center justify-center gap-2">/g, '<Button type="submit" className="w-full h-14 bg-[#31111B] text-[#D4AF37] hover:bg-[#4a1825] text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#31111B]/10 transition-all duration-300 mt-4">');

content = content.replace(/<Button type="submit" disabled={isProcessing} className="flex-\[2\] py-4 bg-\[\#31111B\] text-white rounded-lg hover:bg-\[\#4a1825\] font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">/g, '<Button type="submit" disabled={isProcessing} className="flex-[2] h-14 bg-[#31111B] text-[#D4AF37] hover:bg-[#4a1825] text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#31111B]/10 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">');

content = content.replace(/<Button type="button" onClick={\(\) => setCurrentStep\('shipping'\)} className="flex-1 py-4 bg-white border border-\[\#31111B\]\/20 text-\[\#31111B\]\/80 rounded-lg hover:bg-\[\#FAFAFA\] font-medium text-lg">/g, '<Button type="button" onClick={() => setCurrentStep(\'shipping\')} className="flex-1 h-14 bg-white border border-[#31111B]/20 text-[#31111B]/80 hover:text-[#31111B] hover:border-[#31111B]/40 text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl transition-all duration-300">');

content = content.replace(/<Button\n\s+type="button"\n\s+onClick={\(\) => setShowNewAddressForm\(true\)}\n\s+className="w-full py-4 bg-white border border-dashed border-\[\#31111B\] text-\[\#31111B\] rounded-xl hover:bg-\[\#31111B\]\/5 font-medium transition-colors flex items-center justify-center gap-2"\n\s+>/g, '<Button\n                                                            type="button"\n                                                            onClick={() => setShowNewAddressForm(true)}\n                                                            className="w-full py-4 bg-white border border-dashed border-[#C5A059]/40 text-[#31111B]/60 rounded-xl hover:border-[#C5A059] hover:bg-[#C5A059]/5 hover:text-[#31111B] transition-all flex items-center justify-center gap-2"\n                                                        >');

content = content.replace(/className="w-full py-4 bg-white border border-dashed border-\[\#31111B\] text-\[\#31111B\] rounded-xl hover:bg-\[\#31111B\]\/5 font-medium transition-colors flex items-center justify-center gap-2"/g, 'className="w-full py-4 bg-[#FAFAFA] border border-dashed border-[#C5A059]/40 text-[#31111B]/60 rounded-xl hover:border-[#C5A059] hover:bg-[#C5A059]/5 hover:text-[#31111B] transition-all flex items-center justify-center gap-2"');

// Fix headers
content = content.replace(/<h2 className="text-2xl font-serif text-\[\#31111B\] mb-6 flex items-center gap-2">/g, '<h2 className="text-3xl font-serif text-[#31111B] mb-6 flex items-center gap-3">');
content = content.replace(/<h2 className="text-2xl font-serif text-\[\#31111B\] flex items-center gap-2">/g, '<h2 className="text-3xl font-serif text-[#31111B] flex items-center gap-3">');

fs.writeFileSync(filePath, content);
console.log('UI updated successfully!');
