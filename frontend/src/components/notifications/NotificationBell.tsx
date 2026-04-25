import React from "react";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, isOpen, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative p-2 rounded-full transition-all duration-300 group ${
        isOpen ? "text-white bg-white/15" : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
      aria-label="Open notifications"
    >
      <Bell size={20} className="group-hover:scale-110 transition-transform" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
