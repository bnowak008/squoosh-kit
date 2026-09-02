export default function Logo() {
  return (
    <span className="flex items-center gap-2.5 lg:gap-3">
      <span
        className="logo-mark relative inline-flex h-10 w-10 lg:h-14 lg:w-14"
        aria-hidden="true"
      >
        <span className="logo-bar logo-bar-top" />
        <span className="logo-blob" />
        <span className="logo-bar logo-bar-bottom" />
      </span>
      <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
        Squoosh<span className="text-[#ff2d78]">-Kit</span>
      </span>
    </span>
  );
}
