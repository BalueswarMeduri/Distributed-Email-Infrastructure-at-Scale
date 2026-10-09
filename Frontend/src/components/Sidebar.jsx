import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUserThunk } from '../redux/slices/authSlice';

const Sidebar = ({ activeTab, setActiveTab, onOpenSingleModal, onOpenBulkModal }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUserThunk());
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Overview & Metrics', icon: 'grid_view' },
    { id: 'campaigns', label: 'Campaigns & Dispatch', icon: 'campaign' },
    { id: 'pipeline', label: 'Live Outbox Stream', icon: 'stream' },
    { id: 'failures', label: 'DLQ & Failures', icon: 'report_problem' }
  ];

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between h-screen sticky top-0 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Branding */}
      <div className="flex flex-col">
        <div className="h-16 px-space-md border-b border-outline-variant/30 flex items-center gap-space-sm">
          <Link to="/" className="flex items-center gap-space-sm group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-primary tracking-tight">
                Dispatch
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-on-surface-variant uppercase tracking-wider">
                Cluster Console
              </span>
            </div>
          </Link>
        </div>

        {/* Dispatch Action Buttons */}
        <div className="p-space-sm flex flex-col gap-space-xs border-b border-outline-variant/20">
          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-on-surface-variant uppercase tracking-widest px-space-xs py-1">
            Dispatch Operations
          </span>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenSingleModal}
            className="w-full py-2 px-space-sm rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-medium text-xs flex items-center justify-between shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Send Single Email</span>
            </div>
            <span className="material-symbols-outlined text-[14px]">add</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenBulkModal}
            className="w-full py-2 px-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container font-medium text-xs flex items-center justify-between shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">mark_email_unread</span>
              <span>Send Bulk Emails</span>
            </div>
            <span className="material-symbols-outlined text-[14px]">group_add</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenSingleModal('scheduled')}
            className="w-full py-2 px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-medium text-xs flex items-center justify-between border border-outline-variant/30 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Schedule Email</span>
            </div>
            <span className="material-symbols-outlined text-[14px]">event</span>
          </motion.button>
        </div>

        {/* Navigation Section */}
        <div className="p-space-sm flex flex-col gap-1">
          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-on-surface-variant uppercase tracking-widest px-space-xs py-1">
            Navigation
          </span>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full py-2 px-space-sm rounded-lg text-xs font-medium flex items-center gap-space-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-container text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-primary' : 'text-outline'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Logout Footer */}
      <div className="p-space-sm border-t border-outline-variant/30 bg-surface-container-low/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col max-w-[110px]">
              <span className="text-xs font-semibold text-primary truncate">
                {user?.name || 'Operator'}
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-on-surface-variant truncate">
                {user?.email || 'operator@cluster.io'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-outline hover:text-secondary hover:bg-error-container/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
