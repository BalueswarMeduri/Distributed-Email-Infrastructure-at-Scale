import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { sendSingleEmailThunk, sendBulkEmailsThunk, clearNotificationFeedback } from '../redux/slices/notificationSlice';

const SendEmailModal = ({ isOpen, onClose, mode = 'single', onSuccess }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { loading, error, successMessage } = useSelector((state) => state.notifications);

  const [to, setTo] = useState('');
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState(user?.email ? `noreply@${user.email.split('@')[1] || 'dispatch.internal'}` : 'noreply@dispatch.internal');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [csvFileName, setCsvFileName] = useState('');

  const [localFeedback, setLocalFeedback] = useState({ success: null, message: '' });

  const isBulk = mode === 'bulk';
  const isScheduledMode = mode === 'scheduled';

  // Handle CSV file upload & parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;
      const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const uniqueEmails = [...new Set(emailMatches)];

      if (uniqueEmails.length > 0) {
        setRecipientsText(uniqueEmails.join(', '));
        setLocalFeedback({
          success: true,
          message: `Successfully parsed ${uniqueEmails.length} recipient emails from '${file.name}'`
        });
      } else {
        setLocalFeedback({
          success: false,
          message: `No valid email addresses found in file '${file.name}'`
        });
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearNotificationFeedback());
    setLocalFeedback({ success: null, message: '' });

    const userId = user?.id || user?._id || 'user_demo';
    const deliveryTime = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    const isImmediate = !scheduledAt;

    if (isBulk) {
      const recipientList = recipientsText
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (recipientList.length === 0) {
        setLocalFeedback({ success: false, message: 'Please provide recipient emails or upload a CSV file.' });
        return;
      }

      const payload = {
        userId,
        title: title || 'Bulk Dispatch Campaign',
        from,
        subject,
        body,
        recipients: recipientList,
        scheduledAt: deliveryTime
      };

      const result = await dispatch(sendBulkEmailsThunk(payload));
      if (sendBulkEmailsThunk.fulfilled.match(result)) {
        setLocalFeedback({
          success: true,
          message: isImmediate
            ? `⚡ Immediate Bulk Campaign created! ${recipientList.length} emails dispatched instantly to RabbitMQ.`
            : `📅 Scheduled Bulk Campaign created for ${new Date(scheduledAt).toLocaleString()} with ${recipientList.length} recipients.`
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          handleReset();
          onClose();
        }, 1500);
      } else {
        setLocalFeedback({ success: false, message: result.payload || 'Failed to dispatch bulk campaign.' });
      }
    } else {
      const payload = {
        userId,
        to,
        from,
        subject,
        body,
        scheduledAt: deliveryTime
      };

      const result = await dispatch(sendSingleEmailThunk(payload));
      if (sendSingleEmailThunk.fulfilled.match(result)) {
        setLocalFeedback({
          success: true,
          message: isImmediate
            ? '⚡ Email dispatched instantly! Sent to Outbox & RabbitMQ in milliseconds.'
            : `📅 Scheduled email notification created for ${new Date(scheduledAt).toLocaleString()}`
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          handleReset();
          onClose();
        }, 1500);
      } else {
        setLocalFeedback({ success: false, message: result.payload || 'Failed to dispatch notification.' });
      }
    }
  };

  const handleReset = () => {
    setTo('');
    setTitle('');
    setSubject('');
    setBody('');
    setRecipientsText('');
    setScheduledAt('');
    setCsvFileName('');
    setLocalFeedback({ success: null, message: '' });
    dispatch(clearNotificationFeedback());
  };

  if (!isOpen) return null;

  const displayMessage = localFeedback.message || successMessage || error;
  const isSuccess = localFeedback.success !== null ? localFeedback.success : !!successMessage;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-on-surface/50 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-xl border border-outline-variant/40 overflow-hidden flex flex-col"
        >
          {/* Top Header */}
          <div className="bg-surface-container px-space-md py-space-sm flex items-center justify-between border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wider text-primary">
                {isBulk ? 'Bulk CSV Campaign Ingestion' : isScheduledMode ? 'Schedule Timed Email' : 'Dispatch Single Email'}
              </span>
            </div>
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="text-outline hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-space-lg flex flex-col gap-space-md">
            {displayMessage && (
              <div
                className={`p-space-sm rounded-lg text-xs flex items-center gap-2 ${
                  isSuccess
                    ? 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant border border-tertiary-fixed'
                    : 'bg-error-container/60 text-on-error-container border border-error/30'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {isSuccess ? 'check_circle' : 'error'}
                </span>
                <span>{displayMessage}</span>
              </div>
            )}

            {isBulk ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Q4 Product Launch Updates"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
                  />
                </div>

                {/* CSV File Upload Section */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                      Upload Recipient CSV File
                    </label>
                    {csvFileName && (
                      <span className="font-['JetBrains_Mono',monospace] text-[11px] text-primary font-semibold">
                        📄 {csvFileName}
                      </span>
                    )}
                  </div>
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container border border-dashed border-outline-variant/60 cursor-pointer transition-colors text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-base">upload_file</span>
                    <span>Click to browse `.csv` or `.txt` email list</span>
                    <input
                      type="file"
                      accept=".csv, .txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                    Recipient Email List (Comma or Line Separated)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="user1@company.com, user2@company.com, user3@company.com"
                    value={recipientsText}
                    onChange={(e) => setRecipientsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-['JetBrains_Mono',monospace] text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                  Recipient Email (To)
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex.operator@client.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                  Sender Address (From)
                </label>
                <input
                  type="text"
                  required
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                    Scheduled Time
                  </label>
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] text-on-surface-variant font-bold">
                    {scheduledAt ? '📅 Scheduled' : '⚡ Immediate'}
                  </span>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
                />
                <span className="text-[10px] text-on-surface-variant">
                  {scheduledAt ? 'Will execute automatically at scheduled time' : 'Leave empty for immediate sending (Instant Outbox & RabbitMQ push)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                Email Subject
              </label>
              <input
                type="text"
                required
                placeholder="Critical Cluster Alert / Verification Code"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-on-surface font-semibold">
                Email Body Content
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write your email body content here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30 font-['Plus_Jakarta_Sans',sans-serif]"
              />
            </div>

            <div className="pt-space-xs flex items-center justify-end gap-space-sm border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container font-medium text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                    <span>Saving to Outbox...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xs">
                      {scheduledAt ? 'schedule_send' : 'send'}
                    </span>
                    <span>
                      {scheduledAt
                        ? 'Schedule Delivery'
                        : isBulk
                        ? 'Dispatch Bulk Campaign'
                        : 'Dispatch Email Immediately'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendEmailModal;
