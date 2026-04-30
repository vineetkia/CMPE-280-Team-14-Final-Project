/* Icons.jsx — single-stroke 1.25 line icons, currentColor */
const Ic = ({ d, size = 16, sw = 1.25, children, viewBox = "0 0 24 24", style }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icon = {
  Home: (p) => <Ic {...p}><path d="M4 11l8-7 8 7"/><path d="M6 10v9a1 1 0 001 1h3v-6h4v6h3a1 1 0 001-1v-9"/></Ic>,
  Doc:  (p) => <Ic {...p}><path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 15h6M9 18h4"/></Ic>,
  Kanban:(p) => <Ic {...p}><rect x="4" y="4" width="5" height="14" rx="1"/><rect x="11" y="4" width="5" height="9" rx="1"/><rect x="18" y="4" width="2.5" height="6" rx="1"/></Ic>,
  Mic:  (p) => <Ic {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></Ic>,
  Chart:(p) => <Ic {...p}><path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 4-6"/></Ic>,
  Cog:  (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></Ic>,
  Search:(p) => <Ic {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></Ic>,
  Plus: (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  ArrowR:(p) => <Ic {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Ic>,
  ArrowL:(p) => <Ic {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Ic>,
  ArrowUp:(p) => <Ic {...p}><path d="M12 19V5M6 11l6-6 6 6"/></Ic>,
  ArrowDn:(p) => <Ic {...p}><path d="M12 5v14M6 13l6 6 6-6"/></Ic>,
  X:    (p) => <Ic {...p}><path d="M6 6l12 12M18 6L6 18"/></Ic>,
  Check:(p) => <Ic {...p}><path d="M5 12l4 4L19 6"/></Ic>,
  Upload:(p) => <Ic {...p}><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1"/></Ic>,
  Download:(p) => <Ic {...p}><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></Ic>,
  Filter:(p) => <Ic {...p}><path d="M4 5h16l-6 8v6l-4-2v-4z"/></Ic>,
  More: (p) => <Ic {...p}><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></Ic>,
  Sun:  (p) => <Ic {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Ic>,
  Moon: (p) => <Ic {...p}><path d="M20 14a8 8 0 11-9-9 7 7 0 009 9z"/></Ic>,
  Eye:  (p) => <Ic {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Ic>,
  Bell: (p) => <Ic {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></Ic>,
  Note: (p) => <Ic {...p}><path d="M5 4h14v16l-7-3-7 3z"/></Ic>,
  Pin:  (p) => <Ic {...p}><path d="M12 2l3 6h5l-4 4 1.5 7L12 16l-5.5 3L8 12 4 8h5z"/></Ic>,
  Flame:(p) => <Ic {...p}><path d="M12 3c1.5 4 5 5 5 9a5 5 0 01-10 0c0-2 1-3 1-5 0 1 1 2 2 2 0-3 1-4 2-6z"/></Ic>,
  Time: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>,
  Map:  (p) => <Ic {...p}><path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></Ic>,
  Chip: (p) => <Ic {...p}><rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></Ic>,
  Drag: (p) => <Ic {...p}><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></Ic>,
  Link: (p) => <Ic {...p}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></Ic>,
  Sparkle:(p) => <Ic {...p}><path d="M12 4v6M12 14v6M4 12h6M14 12h6"/><path d="M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/></Ic>,
  Phone:(p) => <Ic {...p}><path d="M5 4h4l2 5-2 1a11 11 0 005 5l1-2 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></Ic>,
  Quote:(p) => <Ic {...p}><path d="M7 7h4v4H7zM7 11c0 4-3 6-3 6M13 7h4v4h-4zM13 11c0 4-3 6-3 6"/></Ic>,
  Logo: ({size=18}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 4h3v7h6V4h3v16h-3v-6H7v6H4z" fill="currentColor"/>
      <circle cx="20" cy="6" r="2" fill="#9c4a2c"/>
    </svg>
  ),
};

window.Icon = Icon;
