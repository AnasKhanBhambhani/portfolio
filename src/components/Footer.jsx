import { NAV_ITEMS } from "../data/content";

export default function Footer() {
  const year = new Date().getFullYear();

  // The tab bar floats over the bottom of the page below lg (see Nav.jsx), so the
  // last row needs room to clear it. From lg up the bar sits at the top instead and
  // the footer goes back to its normal padding.
  return (
    <footer className="relative z-10 border-t border-edge/10 pt-12.5 pb-32 lg:pb-12.5">
      <div data-aos="fade-up" className="flex justify-between items-center flex-wrap gap-6">
        <a href="#hero" className="font-display font-bold text-[19px] flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-[3px] grad-btn" />
          Muhammad<span className="text-muted-2 font-normal">.anas</span>
        </a>
        <div className="flex gap-6.5 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted text-sm hover:text-fg transition-colors duration-250"
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
