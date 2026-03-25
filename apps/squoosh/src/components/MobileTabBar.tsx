export type MobileTab = 'preview' | 'code' | 'settings';

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'code', label: 'Code' },
  { id: 'settings', label: 'Settings' },
];

type Props = {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
};

export default function MobileTabBar({ active, onChange }: Props) {
  return (
    <div className="flex items-center bg-gray-900 border-b border-white/10 shrink-0 px-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-5 py-3 text-sm font-medium transition-colors ${
            active === tab.id
              ? 'text-white border-b-2 border-[#ff2d78] -mb-px'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
