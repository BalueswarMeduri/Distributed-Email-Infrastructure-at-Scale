import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(24,40,37,0.04)] border-b border-outline-variant/20"
    >
      <div className="h-16 max-w-7xl mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between">
        <Link to="/" className="flex items-center gap-space-md group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm"
          >
            D
          </motion.div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold group-hover:text-primary-container transition-colors">
              Dispatch
            </span>
            <span className="font-label-code-sm text-label-code-sm text-on-surface-variant uppercase tracking-wider">
              Distributed Core
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-space-lg">
          <Link
            to="/"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors font-medium relative group py-1"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <a
            href="#architecture"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors font-medium relative group py-1"
          >
            Architecture & Queueing
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a
            href="#metrics"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors font-medium relative group py-1"
          >
            Benchmark Metrics
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </a>
          <Link
            to="/dashboard"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors font-medium relative group py-1"
          >
            Docs & Dashboard
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        <div className="flex items-center gap-space-md">
          <Link
            to="/login"
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface px-space-sm py-space-xs transition-colors font-medium"
          >
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/register"
              className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-sm rounded-lg font-body-sm text-body-sm font-medium transition-all shadow-[0_1px_4px_rgba(8,30,25,0.15)] inline-block"
            >
              Deploy Cluster
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
