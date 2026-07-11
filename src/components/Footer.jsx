import { NAV_ITEMS } from "../data/content";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/10 py-12.5">
      <div className="flex justify-between items-center flex-wrap gap-6">
        <a href="#hero" className="font-display font-bold text-[19px] flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-[3px] grad-btn" />
          Muhammad<span className="text-muted-2 font-normal">.anas</span>
        </a>
        <div className="flex gap-6.5 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted text-sm hover:text-white transition-colors duration-250"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="text-muted-2 text-[13px]">
          © {year} Muhammad Anas · Built with <span className="text-heart">♥</span>
        </div>
      </div>
    </footer>
  );
}
