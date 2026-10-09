import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import SendEmailModal from '../components/SendEmailModal';
import { fetchUserCampaignsThunk } from '../redux/slices/notificationSlice';

const Dashboard = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { campaigns, stats, loading: notificationLoading } = useSelector((state) => state.notifications);

  const [activeTab, setActiveTab] = useState('overview');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, mode: 'single' });

  const userId = user?.id || user?._id || 'user_demo';

  const fetchDashboardData = () => {
    dispatch(fetchUserCampaignsThunk(userId));
  };

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const openSingleModal = (mode = 'single') => {
    setModalConfig({ isOpen: true, mode });
  };

  const openBulkModal = () => {
    setModalConfig({ isOpen: true, mode: 'bulk' });
  };

  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  // Exact original metrics fetched directly from MongoDB collections
  let totalCampaigns = stats?.totalCampaigns ?? campaigns.length;
  let totalEmailsDispatched = stats?.totalEmailsDispatched ?? 0;
  let successfulDeliveries = stats?.successfulDeliveries ?? 0;
  let failedDeliveries = stats?.failedDeliveries ?? 0;

  // Fallback calculation if stats object is not yet loaded
  if (!stats && campaigns.length > 0) {
    totalCampaigns = campaigns.length;
    campaigns.forEach((c) => {
      const recipients = c.total || 1;
      totalEmailsDispatched += recipients;
      if (c.status === 'FAILED') {
        failedDeliveries += recipients;
      } else {
        successfulDeliveries += recipients;
      }
    });
  }

  const deliverySuccessRate = totalEmailsDispatched > 0
    ? ((successfulDeliveries / totalEmailsDispatched) * 100).toFixed(1)
    : '100.0';

  return (
    <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif] text-on-surface flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSingleModal={openSingleModal}
        onOpenBulkModal={openBulkModal}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/30 px-space-lg flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-space-sm">
            <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant uppercase tracking-wider">
              Node Ingestion Gate / MongoDB Live Data
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          </div>

          <div className="flex items-center gap-space-md font-['JetBrains_Mono',monospace] text-xs">
            <span className="text-on-surface-variant hidden md:inline">
              Polling: <strong className="text-primary font-semibold">5s Outbox Window</strong>
            </span>
            <span className="text-on-surface-variant hidden lg:inline">
              Rate Limit: <strong className="text-primary font-semibold">30 msgs/10s</strong>
            </span>
            <button
              onClick={fetchDashboardData}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${notificationLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Sync DB</span>
            </button>
          </div>
        </header>

        {/* Dashboard View Body */}
        <main className="p-space-lg flex-1 flex flex-col gap-space-lg max-w-7xl w-full mx-auto">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface-variant font-medium">
                  Dispatch Cluster Core
                </span>
              </div>
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                Operator Dashboard: {user?.name || 'Cluster Administrator'}
              </h1>
              <p className="text-sm text-on-surface-variant">
                Monitor real-time outbox publisher events, campaign delivery stats, and DLQ error logs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                onClick={() => openSingleModal('single')}
                className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-medium text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">send</span>
                <span>Send Single Email</span>
              </button>

              <button
                onClick={openBulkModal}
                className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-medium text-xs flex items-center gap-1.5 shadow-sm hover:bg-primary-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">mark_email_unread</span>
                <span>Send Bulk Emails</span>
              </button>
            </div>
          </div>

          {/* Key Metric Overview Cards - Real Database Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-medium">
                  Total Emails Dispatched
                </span>
                <span className="material-symbols-outlined text-primary text-xl">mark_email_read</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-primary tracking-tight">{totalEmailsDispatched}</span>
                <span className="font-['JetBrains_Mono',monospace] text-xs text-tertiary-fixed-dim bg-tertiary-container px-2 py-0.5 rounded">
                  {deliverySuccessRate}% Delivered
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-medium">
                  Active Campaigns
                </span>
                <span className="material-symbols-outlined text-primary text-xl">campaign</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-primary tracking-tight">{totalCampaigns}</span>
                <span className="font-['JetBrains_Mono',monospace] text-xs text-primary bg-primary-fixed px-2 py-0.5 rounded">
                  Outbox Protected
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-medium">
                  Successful Deliveries
                </span>
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-primary tracking-tight">{successfulDeliveries}</span>
                <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant">
                  Idempotency Guarded
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-medium">
                  Failed & DLQ Retries
                </span>
                <span className="material-symbols-outlined text-secondary text-xl">report_problem</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-secondary tracking-tight">{failedDeliveries}</span>
                <span className="font-['JetBrains_Mono',monospace] text-xs text-secondary font-semibold bg-secondary-fixed px-2 py-0.5 rounded">
                  5 Retries Max
                </span>
              </div>
            </motion.div>
          </div>

          {/* Real-time Outbox Pipeline Stream Section */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-lg">stream</span>
                <h2 className="font-bold text-lg text-primary">Live Outbox Stream & Pipeline Topology</h2>
              </div>
              <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                Outbox Publisher Interval: 5,000ms
              </span>
            </div>

            {/* Outbox Pipeline Status Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-space-sm font-['JetBrains_Mono',monospace] text-xs">
              <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">1. MongoDB Outbox</span>
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                </div>
                <span className="text-on-surface-variant text-[11px]">PENDING status</span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">2. Publisher Check</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                </div>
                <span className="text-on-surface-variant text-[11px]">Scheduled &lt; 30s</span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">3. RabbitMQ Exchange</span>
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                </div>
                <span className="text-on-surface-variant text-[11px]">PUBLISHED / QUEUED</span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">4. Worker Mesh</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                </div>
                <span className="text-on-surface-variant text-[11px]">30 msgs/10s limit</span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-secondary font-semibold">5. DLQ Monitor</span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                </div>
                <span className="text-on-surface-variant text-[11px]">30s Polling Check</span>
              </div>
            </div>
          </div>

          {/* Campaigns & Dispatch History Table */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-lg">campaign</span>
                <h2 className="font-bold text-lg text-primary">Recent Campaigns & Email Batches</h2>
              </div>
              <button
                onClick={openBulkModal}
                className="text-xs text-secondary hover:underline font-semibold cursor-pointer"
              >
                + Create New Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="py-space-xl text-center flex flex-col items-center justify-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-4xl">inbox</span>
                <p className="text-sm font-semibold text-primary">No email campaigns created yet</p>
                <p className="text-xs text-on-surface-variant">
                  Click "Send Single Email" or "Send Bulk Emails" in the sidebar to test outbox delivery!
                </p>
                <button
                  onClick={() => openSingleModal('single')}
                  className="mt-2 px-space-md py-1.5 rounded-lg bg-secondary text-on-secondary font-medium text-xs shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  Send First Email
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 font-['JetBrains_Mono',monospace] uppercase text-on-surface-variant text-[11px]">
                      <th className="py-2.5 px-3">Campaign Title</th>
                      <th className="py-2.5 px-3">Recipients Count</th>
                      <th className="py-2.5 px-3">Scheduled At</th>
                      <th className="py-2.5 px-3">Outbox Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {campaigns.map((camp) => (
                      <tr key={camp._id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-3 font-semibold text-primary">{camp.title}</td>
                        <td className="py-3 px-3 font-['JetBrains_Mono',monospace]">{camp.total || 1} recipients</td>
                        <td className="py-3 px-3 font-['JetBrains_Mono',monospace] text-on-surface-variant">
                          {new Date(camp.scheduledAt || camp.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-['JetBrains_Mono',monospace] text-[11px] font-semibold ${
                              camp.status === 'COMPLETED'
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                : camp.status === 'CANCELLED'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-primary-fixed text-on-primary-fixed-variant'
                            }`}
                          >
                            {camp.status || 'SCHEDULED'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => alert(`Campaign ID: ${camp._id}\nStatus: ${camp.status}`)}
                            className="text-xs text-primary hover:underline font-medium cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={modalConfig.isOpen}
        mode={modalConfig.mode}
        onClose={closeModal}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
