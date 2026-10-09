import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-surface-container-low shadow-[0_-1px_6px_rgba(24,40,37,0.03)] py-space-xl">
      <div className="max-w-7xl mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter-lg pb-space-lg">
          <div className="flex flex-col gap-space-sm md:col-span-1">
            <div className="flex items-center gap-space-sm">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
                D
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                Dispatch
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Distributed notification infrastructure for mission-critical software.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-code-md text-label-code-md uppercase tracking-wider text-on-surface font-semibold">
              Product
            </span>
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              href="#architecture"
            >
              Architecture
            </a>
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              href="#metrics"
            >
              Benchmarks
            </a>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              to="/dashboard"
            >
              Documentation
            </Link>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-code-md text-label-code-md uppercase tracking-wider text-on-surface font-semibold">
              Resources
            </span>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              to="/send"
            >
              API Reference
            </Link>
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              href="#"
            >
              System Status
            </a>
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              href="#"
            >
              Security Vault
            </a>
          </div>

          <div className="flex flex-col gap-space-sm">
            <span className="font-label-code-md text-label-code-md uppercase tracking-wider text-on-surface font-semibold">
              Newsletter
            </span>
            <div className="flex items-center gap-space-xs">
              <input
                className="w-full bg-surface-container-lowest px-space-sm py-space-xs font-label-code-sm text-label-code-sm text-on-surface rounded placeholder:text-outline focus:outline-none border border-outline-variant/40"
                placeholder="you@company.com"
                type="email"
              />
              <button className="bg-primary text-on-primary hover:bg-primary-container px-space-sm py-space-xs rounded font-body-sm text-body-sm whitespace-nowrap transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm border-t border-surface-container-high">
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
            © 2026 Dispatch Notification Systems Inc. All rights reserved.
          </span>
          <div className="flex items-center gap-space-md">
            <a className="font-label-code-sm text-label-code-sm text-on-surface-variant hover:text-on-surface" href="#">
              Telemetry SLA
            </a>
            <a className="font-label-code-sm text-label-code-sm text-on-surface-variant hover:text-on-surface" href="#">
              Privacy Ordinance
            </a>
            <a className="font-label-code-sm text-label-code-sm text-on-surface-variant hover:text-on-surface" href="#">
              Terms of Compute
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
