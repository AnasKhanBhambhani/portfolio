export default function Footer() {
  const year = new Date().getFullYear();

  // The tab bar floats over the bottom of the page below lg (see Nav.jsx), so the
  // last row needs room to clear it. From lg up the bar sits at the top instead and
  // the footer goes back to its normal padding.
  return (
    <footer className="relative z-10 border-t border-edge/10 pt-12.5 pb-32 lg:pb-12.5">
      <div data-aos="fade-up" className="text-center text-muted-2 text-[13px]">
        © {year} Muhammad Anas · Built with <span className="text-heart">♥</span>
      </div>
    </footer>
  );
}
