// Lucide-style line icons used by the dashboards.
const mk = (paths) =>
  function Icon({ size = 20, className = '', strokeWidth = 1.8, ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...rest}
      >
        {paths}
      </svg>
    )
  }

export const HomeI = mk(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" /></>)
export const StarI = mk(<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />)
export const PieI = mk(<><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>)
export const CompassI = mk(<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>)
export const WalletI = mk(<><path d="M4 7a2 2 0 0 1 2-2h11v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="16.5" cy="13.5" r="1.2" /></>)
export const GridI = mk(<><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" /></>)
export const MirrorI = mk(<><rect x="3.5" y="5" width="13" height="13" rx="2" /><path d="M7.5 8.5H20.5V21H7.5" /><path d="M7.5 14h5M10 11.5v5" /></>)
export const CalendarI = mk(<><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>)
export const AwardI = mk(<><circle cx="12" cy="9" r="5.5" /><path d="m8.8 13.8-1.3 6.7L12 18.5l4.5 2-1.3-6.7" /></>)
export const MegaphoneI = mk(<><path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1z" /><path d="M18.5 9.5a4 4 0 0 1 0 5" /></>)
export const CoinsHandI = mk(<><ellipse cx="9" cy="6.5" rx="5.5" ry="2.5" /><path d="M3.5 6.5v4c0 1.4 2.5 2.5 5.5 2.5M3.5 10.5v4c0 1.4 2.5 2.5 5.5 2.5" /><ellipse cx="16" cy="14" rx="4.5" ry="2" /><path d="M11.5 14v3.5c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V14" /></>)
export const SettingsI = mk(<><circle cx="12" cy="12" r="3" /><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)
export const HelpI = mk(<><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5M12 16.8v.1" /></>)
export const BookI = mk(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>)
export const CandlesI = mk(<><path d="M7 4v3M7 15v3M12 7v2M12 17v3M17 3v4M17 14v4" /><rect x="5" y="7" width="4" height="8" rx="1" /><rect x="10" y="9" width="4" height="8" rx="1" /><rect x="15" y="7" width="4" height="7" rx="1" /></>)
export const LogoutI = mk(<><path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" /><path d="m15 8 4 4-4 4M19 12H9" /></>)
export const SearchI = mk(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>)
export const BellI = mk(<><path d="M6 17.5V11a6 6 0 1 1 12 0v6.5l1.5 1.5h-15z" /><path d="M10 21a2 2 0 0 0 4 0" /></>)
export const BellRingI = mk(<><path d="M6 17.5V11a6 6 0 0 1 8-5.7M18 11v6.5l1.5 1.5h-15L6 17.5" /><path d="M10 21a2 2 0 0 0 4 0M18 3.5a8 8 0 0 1 2.5 4M21.5 5.5l-1-.5" /></>)
export const SparkleI = mk(<><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /><path d="M19 16c.2 1.6.9 2.3 2.5 2.5-1.600.2-2.300.9-2.500 2.500-.2-1.600-.9-2.300-2.500-2.500 1.600-.2 2.300-.9 2.500-2.500z" /></>)
export const ChevRightI = mk(<path d="m9 5 7 7-7 7" />)
export const ChevLeftI = mk(<path d="m15 5-7 7 7 7" />)
export const ChevDownI = mk(<path d="m5 9 7 7 7-7" />)
export const ChevUpI = mk(<path d="m5 15 7-7 7 7" />)
export const AlertI = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.1" /></>)
export const MonitorI = mk(<><rect x="3" y="4" width="14" height="10" rx="1.5" /><path d="M8 18h4M10 14v4" /><rect x="15.5" y="9" width="5.5" height="10" rx="1.2" fill="var(--c-card)" /></>)
export const UserI = mk(<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.7-3.9 3.6-6 7.500-6s6.800 2.100 7.500 6" /></>)
export const ArrowsI = mk(<><path d="M5 8h14M15 4l4 4-4 4M19 16H5M9 12l-4 4 4 4" /></>)
export const LockEyeI = mk(<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15.5" r="1.4" /></>)
export const CoinsI = mk(<><ellipse cx="10" cy="6" rx="6" ry="2.600" /><path d="M4 6v4.500c0 1.400 2.700 2.600 6 2.600s6-1.200 6-2.600V6M4 10.500V15c0 1.400 2.700 2.600 6 2.600s6-1.200 6-2.600v-4.500" /><path d="M17 12.500c2.300.3 4 1.200 4 2.400V19c0 1.400-2.700 2.600-6 2.600" /></>)
export const ShieldI = mk(<><path d="M12 3 5 6v5.500c0 4.300 3 8 7 9.500 4-1.500 7-5.200 7-9.500V6z" /><path d="m9 12 2.200 2.200L15.500 10" /></>)
export const FileI = mk(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>)
export const UploadI = mk(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1.500 1.500 0 0 0 1.500 1.500h13A1.500 1.500 0 0 0 20 19v-3" /></>)
export const CheckI = mk(<path d="m5 12.500 4.500 4.500L19 7.500" />)
export const XI = mk(<path d="m6 6 12 12M18 6 6 18" />)
export const PlusI = mk(<path d="M12 5v14M5 12h14" />)
export const TrashI = mk(<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.500A1.500 1.500 0 0 0 8.500 21h7a1.500 1.500 0 0 0 1.500-1.500L18 7M9 7V4.500A1.500 1.500 0 0 1 10.500 3h3A1.500 1.500 0 0 1 15 4.500V7" /></>)
export const EditI = mk(<><path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16z" /><path d="m13.500 6.500 4 4" /></>)
export const MenuI = mk(<path d="M4 7h16M4 12h16M4 17h16" />)
export const PanelLeftI = mk(<><path d="M4 12h10M8 8l-4 4 4 4" /><path d="M20 5v14" /></>)
export const DashI = mk(<><rect x="3.500" y="3.500" width="7" height="9" rx="1.500" /><rect x="13.500" y="3.500" width="7" height="5" rx="1.500" /><rect x="13.500" y="11.500" width="7" height="9" rx="1.500" /><rect x="3.500" y="15.500" width="7" height="5" rx="1.500" /></>)
export const TrendUpI = mk(<><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>)
export const TrendDownI = mk(<><path d="m3 7 6 6 4-4 8 8" /><path d="M15 17h6v-6" /></>)
export const MessageI = mk(<path d="M21 12a8 8 0 0 1-11.600 7.100L4 20.500l1.500-4.800A8 8 0 1 1 21 12z" />)
export const SendI = mk(<><path d="m21 3-9.500 18-2.500-8-8-2.500z" /><path d="M21 3 9 13" /></>)
export const ActivityI = mk(<path d="M3 12h4l3-8 4 16 3-8h4" />)
export const DatabaseI = mk(<><ellipse cx="12" cy="5.500" rx="8" ry="3" /><path d="M4 5.500v13c0 1.700 3.600 3 8 3s8-1.300 8-3v-13M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3" /></>)
export const SlidersI = mk(<><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>)
export const EyeI = mk(<><path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" /><circle cx="12" cy="12" r="2.800" /></>)
export const DownloadI = mk(<><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 16v3a1.500 1.500 0 0 0 1.500 1.500h13A1.500 1.500 0 0 0 20 19v-3" /></>)
export const RefreshI = mk(<><path d="M20 11A8 8 0 0 0 6 6.500L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.500l2-2.500M20 20v-5h-5" /></>)
export const CopyI = mk(<><rect x="8.500" y="8.500" width="12" height="12" rx="2" /><path d="M15.500 8.500V5.500A2 2 0 0 0 13.500 3.500h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></>)
export const FilterI = mk(<path d="M4 5h16l-6 7.500V19l-4 2v-8.500z" />)
export const UsersI = mk(<><circle cx="9" cy="8" r="3.500" /><path d="M2.500 20c.5-3.500 3-5.500 6.500-5.500S15 16.500 15.500 20" /><path d="M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.800c2 .6 3.200 2.300 3.500 5.200" /></>)
export const ShieldAlertI = mk(<><path d="M12 3 5 6v5.500c0 4.300 3 8 7 9.500 4-1.500 7-5.200 7-9.500V6z" /><path d="M12 8.500v4M12 15.800v.1" /></>)
export const ListI = mk(<><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r=".8" /><circle cx="4" cy="12" r=".8" /><circle cx="4" cy="18" r=".8" /></>)
export const LifebuoyI = mk(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.500" /><path d="m5.600 5.600 3.900 3.900M14.500 14.500l3.900 3.900M18.400 5.600l-3.900 3.900M9.500 14.500l-3.900 3.900" /></>)
export const BoltI = mk(<path d="M13 3 5 13.500h6L10 21l8-10.500h-6z" />)
export const GiftI = mk(<><rect x="3.500" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8c-2.500 0-4-1-4-2.500S9 3 10.500 3 12 6 12 8zM12 8c2.500 0 4-1 4-2.500S15 3 13.500 3 12 6 12 8z" /></>)
export const MailI = mk(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.500 7 8.500 6.500L20.500 7" /></>)
export const KeyI = mk(<><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2.500 2.500M14 9l2 2" /></>)
export const InfoI = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.500M12 7.700v.1" /></>)
export const PauseI = mk(<><rect x="6.500" y="5" width="3.500" height="14" rx="1" /><rect x="14" y="5" width="3.500" height="14" rx="1" /></>)
export const PlayI = mk(<path d="M7 4.500v15l12-7.500z" />)
export const BanI = mk(<><circle cx="12" cy="12" r="9" /><path d="m5.700 5.700 12.600 12.600" /></>)
