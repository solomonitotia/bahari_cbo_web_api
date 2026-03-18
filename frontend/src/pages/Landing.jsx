import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, Bell, Shield, Users, Thermometer, Wifi, WifiOff,
  AlertTriangle, ArrowRight, CheckCircle2, Radio, FileSpreadsheet,
  ChevronDown, Newspaper, MapPin, Anchor, Leaf,
} from 'lucide-react';

const API_BASE = '/api';

export default function Landing() {
  const [posts,       setPosts]       = useState([]);
  const [loadingPosts,setLoadingPosts]= useState(true);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [stats,       setStats]       = useState({ total: 0, online: 0, warning: 0, offline: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/posts?limit=3`)
      .then(r => r.json()).then(d => setPosts(d.data || []))
      .catch(() => {}).finally(() => setLoadingPosts(false));

    fetch(`${API_BASE}/readings/public-stats`)
      .then(r => r.json()).then(d => { if (d.data) setStats(d.data); })
      .catch(() => {});
  }, []);

  const features = [
    { icon: BarChart2,       label: 'Real-Time Charts',   desc: 'Live temperature graphs updated every reading' },
    { icon: FileSpreadsheet, label: 'CSV / Excel Export',  desc: 'Download your data for offline analysis' },
    { icon: Bell,            label: 'Smart Alerts',        desc: 'Instant alerts when temps leave safe range' },
    { icon: Shield,          label: 'Role-Based Access',   desc: 'Admin, custodian, and monitor permission levels' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-sm shadow-lg">🌊</div>
            <div>
              <p className="font-black text-white text-sm leading-none">Bahari CBO</p>
              <p className="text-primary-400 text-[10px] leading-tight">Smart Ocean Monitoring</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[['#about','About'],['#how','How It Works'],['#news','News']].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-300 hover:text-white font-medium px-3 py-1.5 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              Register
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0a0f1e] px-5 py-4 space-y-3">
            {[['#about','About'],['#how','How It Works'],['#news','News']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-300 py-1">{label}</a>
            ))}
            <Link to="/login" className="block text-sm text-primary-400 font-semibold py-1">Sign In</Link>
            <Link to="/register" className="block bg-primary-600 text-white text-sm font-bold text-center py-2.5 rounded-lg">Register</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-14">
        <div className="max-w-6xl mx-auto px-5">

          {/* Full-width hero image */}
          <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden mt-6 border border-white/10 shadow-2xl">
            {/* Ocean gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c2a4a] via-[#0a1f3d] to-[#060d1a]" />
            {/* Animated sensor grid */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-10 gap-6 opacity-25">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i % 7 === 0 ? 'bg-primary-400 animate-pulse' :
                      i % 5 === 0 ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                    style={{ animationDelay: `${(i % 7) * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
            {/* Wave overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060d1a]/80 to-transparent" />
            {/* Live badge */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white font-medium">Live Monitoring Active</span>
            </div>
            {/* Caption */}
            <div className="absolute bottom-5 left-0 right-0 text-center">
              <p className="text-slate-400 text-xs font-medium">Bahari CBO IoT Sensor Network — Kenyan Coast</p>
            </div>
            {/* Floating stat pills */}
            <div className="absolute top-5 left-5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
              <p className="text-primary-400 text-lg font-black leading-none">{stats.total || 1}</p>
              <p className="text-slate-500 text-xs">Stations</p>
            </div>
            <div className="absolute top-5 right-5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
              <p className="text-green-400 text-lg font-black leading-none">{stats.online}</p>
              <p className="text-slate-500 text-xs">Online</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="py-12 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5">
              Ocean Temperature<br />
              <span className="text-primary-400">Monitoring for All</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Real-time IoT sensor data from fish cages and seaweed farms along the
              Kenyan coast. Track conditions, receive alerts, and protect your harvest.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <Link to="/register"
                className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg text-base w-full sm:w-auto">
                Get Started — It's Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login"
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-base w-full sm:w-auto">
                Sign In to Your Account
              </Link>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              No credit card required · Free for community members
            </p>
          </div>

          {/* ── NETWORK OVERVIEW ── */}
          <div className="mb-16">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">NETWORK OVERVIEW</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Stations', value: stats.total || 1, color: 'text-white' },
                { label: 'Online',   value: stats.online,     color: 'text-green-400' },
                { label: 'Warning',  value: stats.warning,    color: 'text-yellow-400' },
                { label: 'Offline',  value: stats.offline,    color: 'text-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 border border-white/8 rounded-xl px-5 py-4">
                  <p className={`text-3xl font-black leading-none mb-1 ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll cue */}
          <div className="flex justify-center pb-10">
            <a href="#features" className="flex flex-col items-center text-slate-600 hover:text-slate-400 transition-colors gap-1">
              <span className="text-xs">Scroll to learn more</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ── */}
      <section id="features" className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">PLATFORM FEATURES</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label}
                className="flex items-center gap-4 bg-white/4 hover:bg-white/7 border border-white/8 rounded-xl p-5 transition-colors cursor-default">
                <div className="w-10 h-10 rounded-lg bg-primary-600/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-3">About Us</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight">
                A Coastal Community<br />Working Together
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Bahari CBO was founded by fishermen and seaweed farmers along the Kenyan coast.
                Our mission is to protect ocean livelihoods using smart, affordable technology.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-7">
                Temperature is the most critical factor for healthy fish cages and productive seaweed farms.
                Our sensor network ensures every member knows what is happening at their site — any time, from any phone.
              </p>
              <div className="flex flex-wrap gap-2">
                {['🐟 Fish Farming','🌿 Seaweed Farming','📊 Data Monitoring','🤝 Community Driven'].map(tag => (
                  <span key={tag} className="bg-white/5 border border-white/10 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* System status card */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-white text-sm">System Status</p>
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> All Operational
                </span>
              </div>
              {[
                { label: 'Fish Cage Sensors',  status: 'Monitored' },
                { label: 'Seaweed Farm Sites', status: 'Monitored' },
                { label: 'Live Data Updates',  status: 'Every 5 min' },
                { label: 'Alert System',       status: 'Active' },
                { label: 'API Endpoint',       status: 'Online' },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white text-xs font-semibold">{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-3">Simple & Reliable</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">How Our Monitoring Works</h2>
            <p className="text-slate-500 mt-3 text-sm max-w-xl mx-auto">
              You do not need to be a tech expert. Our system is built for every community member.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Anchor,    num: '01', title: 'Sensors Deployed',  desc: 'Temperature sensors installed in fish cages and seaweed farms at every monitored site.' },
              { icon: Wifi,      num: '02', title: 'Data Transmitted',  desc: 'Sensors send live readings to our secure cloud every few minutes, day and night.' },
              { icon: Bell,      num: '03', title: 'Instant Alerts',    desc: 'When temperature leaves the safe range, custodians are notified immediately.' },
              { icon: BarChart2, num: '04', title: 'Track & Decide',    desc: 'View charts and history to make informed decisions about your farm.' },
            ].map(({ icon: Icon, num, title, desc }) => (
              <div key={title} className="relative bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-primary-500/30 transition-colors">
                <p className="text-5xl font-black text-white/4 absolute top-4 right-5 leading-none select-none">{num}</p>
                <div className="w-10 h-10 rounded-lg bg-primary-600/15 border border-primary-500/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section id="news" className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-2">From Our Team</p>
              <h2 className="text-2xl font-black text-white">Latest News & Updates</h2>
            </div>
            <Link to="/login" className="hidden sm:flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(n => (
                <div key={n} className="rounded-2xl border border-white/8 overflow-hidden animate-pulse">
                  <div className="h-40 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded" />
                    <div className="h-3 bg-white/5 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 border border-white/8 rounded-2xl text-center">
              <Newspaper className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No news published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map(post => (
                <article key={post._id}
                  className="rounded-2xl border border-white/8 overflow-hidden hover:border-primary-500/30 transition-colors group bg-white/3">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-primary-900/50 to-[#060d1a] flex items-center justify-center text-4xl">
                      {post.category === 'success_story' ? '🌟' : post.category === 'guide' ? '📖' : '🌊'}
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <h3 className="font-bold text-white mb-2 text-sm leading-snug line-clamp-2 group-hover:text-primary-400 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/5 py-16">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Monitor Your Site?</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Join Bahari CBO members already using our monitoring system.
            Free, easy to use, and built for the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-8 rounded-xl transition-colors text-base w-full sm:w-auto">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-base w-full sm:w-auto">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center text-xs">🌊</div>
            <span className="text-slate-400 font-semibold">Bahari CBO</span>
          </div>
          <div className="flex gap-5">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#how"   className="hover:text-white transition-colors">How It Works</a>
            <a href="#news"  className="hover:text-white transition-colors">News</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p>© {new Date().getFullYear()} Bahari CBO · Built for Kenyan coastal communities</p>
        </div>
      </footer>

    </div>
  );
}
