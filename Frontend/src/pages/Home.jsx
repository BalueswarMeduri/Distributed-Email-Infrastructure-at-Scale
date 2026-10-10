import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const [activeTab, setActiveTab] = useState('curl');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const snippets = {
    curl: `curl -X POST https://api.dispatch.internal/v1/notifications/dispatch \\
  -H "Authorization: Bearer dsp_live_9f81a7b" \\
  -H "X-Priority-Lane: P0_CRITICAL" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "email",
    "partition_key": "tenant_alpha_checkout",
    "qos_profile": {
      "jittered_backoff_max_ms": 180000,
      "dead_letter_target": "dlq.quarantine.eu-west",
      "domain_throttle_concurrency": 45
    },
    "recipients": [
      {"addr": "cfo@acme-corp.com", "tier": "instant"}
    ]
  }'`,
    payload: `{
  "envelope_id": "env_9938cba42",
  "schedule_timestamp": "2026-10-10T10:00:00.000Z",
  "retry_policy": {
    "strategy": "FULL_JITTER_EXPONENTIAL",
    "base_delay_ms": 1000,
    "max_retries": 5
  },
  "template": {
    "slug": "checkout-confirmation-v3",
    "fallback_plain": "Your order has been confirmed."
  }
}`,
    response: `{
  "status": "QUEUED_ACK",
  "partition_id": "kfk-part-09",
  "offset": 49830211,
  "ingest_latency_ms": 1.82,
  "dlq_failover_ready": true,
  "assigned_worker_pool": "pool-fastpath-iad"
}`
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResult({
        status: '202 ACCEPTED',
        latency: '1.41ms',
        node: 'us-east-1b-kfk11'
      });
    }, 700);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const pipelineStages = [
    {
      step: '01 Gateway',
      title: 'API Gateway',
      desc: 'Sliding window rate limiting & JWT auth validation.',
      icon: 'shield',
      badgeClass: 'bg-surface-container text-primary'
    },
    {
      step: '02 Outbox',
      title: 'Outbox Publisher',
      desc: 'Atomic MongoDB transactions & 5s interval polling.',
      icon: 'layers',
      badgeClass: 'bg-surface-container text-primary'
    },
    {
      step: '03 Queue',
      title: 'RabbitMQ',
      desc: 'Asynchronous message broker & durable queueing.',
      icon: 'cyclone',
      badgeClass: 'bg-surface-container text-primary'
    },
    {
      step: '04 Delivery',
      title: 'Worker Service',
      desc: 'Idempotency check & 30 emails/10s Redis rate limit.',
      icon: 'send_and_archive',
      badgeClass: 'bg-surface-container text-primary'
    },
    {
      step: '05 DLQ',
      title: 'Auto Retries',
      desc: '5 retry attempts exhaust & 30s DLQ monitor logging.',
      icon: 'published_with_changes',
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed-variant'
    }
  ];

  return (
    <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif] text-on-surface flex flex-col">
      <Navbar />

      <main className="w-full pt-16 bg-background flex-grow">
        {/* SECTION 1: HERO & TERMINAL DISPATCH ENGINE */}
        <section className="relative w-full pt-space-xl pb-space-lg px-margin md:px-margin-md lg:px-margin-lg overflow-hidden">
          {/* Ambient radial gradient */}
          <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-gradient-to-br from-tertiary-fixed/20 via-transparent to-transparent blur-3xl pointer-events-none -z-10"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            {/* Left Column: Architectural Proposition */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="lg:col-span-7 flex flex-col gap-space-md"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded bg-surface-container-high text-primary font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider shadow-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  v2.4.0 High-Concurrency Kernel
                </span>
                <span className="text-on-surface-variant font-['JetBrains_Mono',monospace] text-xs hidden sm:inline-block">
                  / ISO-27001 & SOC2 AUDITED
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="font-['Plus_Jakarta_Sans',sans-serif] text-4xl lg:text-5xl text-primary font-bold tracking-tight max-w-2xl leading-[1.12]"
              >
                Distributed Email Infrastructure at Scale
              </motion.h1>

              <motion.p variants={itemVariants} className="text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                High-throughput transactional and bulk dispatch with zero packet loss, Transactional Outbox pattern, and automatic retries.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/send"
                    className="bg-secondary text-on-secondary px-space-lg py-space-sm rounded font-body-md text-body-md font-medium shadow-md hover:opacity-95 transition-all flex items-center gap-space-xs"
                  >
                    <span>Start Sending</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/dashboard"
                    className="bg-surface-container-lowest text-primary px-space-lg py-space-sm rounded font-body-md text-body-md font-medium shadow-sm hover:bg-surface-container transition-all flex items-center gap-space-xs border border-outline-variant/30"
                  >
                    <span>Live Dashboard</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div variants={itemVariants} className="flex items-center gap-space-lg pt-space-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs">
                  <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                  <span>Transactional Outbox Pattern</span>
                </div>
                <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs">
                  <span className="material-symbols-outlined text-sm text-primary">hub</span>
                  <span>RabbitMQ & Redis Cluster</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Micro-Console & Terminal Engine */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col w-full"
            >
              <div className="relative bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden border border-outline-variant/40 hover:shadow-2xl transition-shadow duration-300">
                {/* Window Header */}
                <div className="bg-surface-container px-space-md py-space-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-dim"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim"></span>
                    <span className="ml-2 font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant">
                      dispatch-cli ~ ingestion-gate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest font-['JetBrains_Mono',monospace] text-xs text-primary font-medium">
                      HTTP/2
                    </span>
                    <span className="text-on-surface-variant font-['JetBrains_Mono',monospace] text-xs">
                      202 ACCEPTED
                    </span>
                  </div>
                </div>

                {/* Tab Bar */}
                <div className="bg-surface-container-low px-space-md py-1.5 flex items-center justify-between text-on-surface-variant border-b border-outline-variant/30">
                  <div className="flex items-center gap-space-md">
                    {['curl', 'payload', 'response'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`font-['JetBrains_Mono',monospace] text-xs pb-0.5 capitalize transition-colors ${activeTab === tab
                            ? 'font-semibold text-primary border-b-2 border-primary'
                            : 'text-on-surface-variant hover:text-primary'
                          }`}
                      >
                        {tab === 'curl' ? 'cURL Request' : tab === 'payload' ? 'JSON Envelope' : 'Cluster Receipt'}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="px-2.5 py-1 rounded bg-primary text-on-primary font-['JetBrains_Mono',monospace] text-xs flex items-center gap-1 hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">play_arrow</span>
                    Run
                  </motion.button>
                </div>

                {/* Code Viewport */}
                <div className="p-space-md bg-surface-container-lowest font-['JetBrains_Mono',monospace] text-xs leading-relaxed overflow-x-auto min-h-[310px] flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    <motion.pre
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="text-on-surface whitespace-pre"
                    >
                      {snippets[activeTab]}
                    </motion.pre>
                  </AnimatePresence>

                  <div className="mt-space-sm pt-space-xs bg-surface-container-low px-space-sm py-space-xs rounded flex items-center justify-between text-on-surface-variant">
                    {isSimulating ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs"
                      >
                        <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                        <span className="text-secondary font-bold">DISPATCHING PACKET...</span>
                      </motion.div>
                    ) : simulationResult ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs"
                      >
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                        <span>
                          Ack: <strong className="text-primary font-semibold">{simulationResult.status}</strong> ({simulationResult.latency})
                        </span>
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs">
                        <span className="inline-block w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                        <span>
                          Ack-Lag: <strong className="text-primary font-semibold">1.82ms</strong>
                        </span>
                      </div>
                    )}
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant">
                      Broker Node: <span className="text-primary font-semibold">{simulationResult ? simulationResult.node : 'us-east-1a-kfk03'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto mt-space-xl"
          >
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-md grid grid-cols-2 md:grid-cols-4 gap-gutter border border-outline-variant/30">
              {[
                { label: 'Peak Throughput', value: '6k', unit: '/sec', valueColor: 'text-primary' },
                { label: 'Delivery SLA', value: '99.99%', unit: '', valueColor: 'text-primary' },
                { label: 'Packet Loss', value: '0.00%', unit: '', valueColor: 'text-secondary' },
                { label: 'Ingestion Latency', value: '< 4ms', unit: '', valueColor: 'text-primary' }
              ].map((metric, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3 }}
                  className="flex flex-col p-space-sm rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-3xl font-bold tracking-tight ${metric.valueColor}`}>{metric.value}</span>
                    {metric.unit && <span className="font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant">{metric.unit}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* SECTION 2: ARCHITECTURE PIPELINE FLOW & RESILIENCE RUNTIME */}
        <section id="architecture" className="w-full py-space-xl px-margin md:px-margin-md lg:px-margin-lg bg-surface-container-low border-t border-b border-outline-variant/30">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-space-md"
            >
              <div className="max-w-2xl flex flex-col gap-space-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-['JetBrains_Mono',monospace] text-xs text-secondary font-semibold uppercase tracking-wider">
                    Pipeline Overview
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-primary tracking-tight">
                  Architected for Zero Data Loss
                </h2>
                <p className="text-body-lg text-on-surface-variant">
                  End-to-end resilient delivery pipeline using MongoDB Transactional Outbox, RabbitMQ, and Worker mesh.
                </p>
              </div>
              <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs bg-surface-container-lowest px-space-md py-space-sm rounded-lg shadow-sm border border-outline-variant/30">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-ping"></span>
                <span className="text-on-surface-variant">
                  Live Event Loop: <strong className="text-primary font-semibold">1,024 Workers Active</strong>
                </span>
              </div>
            </motion.div>

            {/* VISUAL PIPELINE FLOW CANVAS */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="w-full bg-surface-container-lowest rounded-xl shadow-lg p-space-lg flex flex-col gap-space-lg border border-outline-variant/40"
            >
              <div className="flex items-center justify-between pb-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-primary font-bold">
                    Topology Map: Multi-Partition Ingress to Worker Mesh
                  </span>
                </div>
                <div className="flex items-center gap-space-xs font-['JetBrains_Mono',monospace] text-xs text-on-surface-variant">
                  <span className="w-3 h-3 rounded bg-primary-fixed inline-block"></span> Nominal
                  <span className="w-3 h-3 rounded bg-secondary-fixed inline-block ml-2"></span> DLQ Reroute
                </div>
              </div>

              {/* Flow Visualizer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-space-sm relative">
                {pipelineStages.map((stage, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="bg-surface-container-low rounded-lg p-space-md flex flex-col justify-between shadow-sm hover:shadow-lg transition-all border border-outline-variant/30 cursor-pointer"
                  >
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-['JetBrains_Mono',monospace] text-xs px-2 py-0.5 rounded font-semibold ${stage.badgeClass}`}>
                          {stage.step}
                        </span>
                        <span className="material-symbols-outlined text-primary text-lg">{stage.icon}</span>
                      </div>
                      <h3 className="font-semibold text-primary mt-2">{stage.title}</h3>
                      <p className="text-xs text-on-surface-variant leading-normal">{stage.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Architectural Telemetry Bar */}
              <div className="bg-surface-container p-space-md rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm font-['JetBrains_Mono',monospace] text-xs">
                <div className="flex items-center gap-space-sm text-primary">
                  <span className="material-symbols-outlined text-base text-primary">terminal</span>
                  <span>
                    BACKPRESSURE SENSOR: <strong className="text-primary">0.02% QUEUE OCCUPANCY</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-space-md text-on-surface-variant">
                  <span>
                    Buffer Depth: <strong className="text-primary">14.2 MB</strong>
                  </span>
                  <span>
                    Retry Policy: <strong className="text-primary">Exponential Jitter</strong>
                  </span>
                  <span>
                    DLQ Health: <strong className="text-primary">100.00%</strong>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* SYSTEM DESIGN CAPABILITY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
              {[
                {
                  title: 'Single & Bulk Dispatch',
                  desc: 'Low-latency transactional endpoints and streaming bulk campaign creation with Outbox protection.',
                  icon: 'data_array',
                  iconColor: 'text-primary'
                },
                {
                  title: 'Scheduled Queues',
                  desc: 'Deterministic precision timer queues for future delivery with 30-second outbox window processing.',
                  icon: 'schedule',
                  iconColor: 'text-primary'
                },
                {
                  title: 'Resilient DLQ & Idempotency',
                  desc: 'Automated retries up to 5 times, event-id idempotency guard, and dead-letter failure tracking.',
                  icon: 'replay',
                  iconColor: 'text-secondary'
                }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  whileHover={{ y: -8 }}
                  className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-xl flex flex-col gap-space-sm border border-outline-variant/30 transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded bg-surface-container flex items-center justify-center ${card.iconColor}`}>
                    <span className="material-symbols-outlined">{card.icon}</span>
                  </div>
                  <h3 className="font-semibold text-xl text-primary">{card.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed text-sm">{card.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* BOTTOM CTA BANNER */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-primary text-on-primary rounded-xl p-space-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-space-lg"
            >
              <div className="flex flex-col gap-space-xs max-w-xl">
                <h3 className="text-2xl md:text-3xl text-on-primary font-bold tracking-tight">
                  Ready to test your Dispatch Cluster?
                </h3>
                <p className="text-primary-fixed-dim text-sm">
                  Start sending single, bulk, or scheduled emails with full fault tolerance and outbox reliability.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-md w-full md:w-auto">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/send"
                    className="px-space-lg py-space-sm rounded font-body-md text-body-md font-medium bg-secondary text-on-secondary hover:opacity-90 shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Send Notification</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/dashboard"
                    className="px-space-lg py-space-sm rounded font-body-md text-body-md font-medium bg-surface-container-lowest text-primary hover:bg-surface-container transition-all flex items-center gap-2"
                  >
                    <span>Dashboard</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
