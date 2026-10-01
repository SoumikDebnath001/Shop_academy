// Store prices are stored in KES. One shared formatter keeps server and client output identical (no hydration drift).
const ksh = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 });

export const formatPrice = (kes: number) => `KSh ${ksh.format(kes)}`;
