import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, Bell, Shield, Users, Thermometer, Wifi, WifiOff, AlertTriangle,
  ChevronDown, ArrowRight, CheckCircle2, Radio, MapPin, Newspaper,
} from 'lucide-react';

const API_BASE = '/api';

const CategoryBadge = ({ cat }) => {
  const map = {
    news:         { cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',    label: 'News' },
    update:       { cls: 'bg-ocean-500/20 text-ocean-300 border border-ocean-500/30', label: 'Update' },
    guide:        { cls: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', label: 'Guide' },
    announcement: { cls: 'bg-orange-500/20 text-orange-300 border border-orange-500/30', label: 'Announcement' },
    success_story:{ cls: 'bg-green-500/20 text-green-300 border border-green-500/30', label: 'Success Story' },
  };
  const { cls, label } = map[cat] || { cls: 'bg-slate-700 text-slate-300', label: cat };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
};

export default function Landing() {
  const [posts, setPosts]           = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [networkStats, setNetworkStats] = useState({ total: 0, online: 0, warning: 0, offline: 0 });

  useEffect(() => {
    // Fetch posts
    fetch(`${API_BASE}/posts?limit=6`)
      .then(r => r.json())
      .then(d => setPosts(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));

    // Fetch public network overview (no auth required)
    fetch(`${API_BASE}/readings/public-stats`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setNetworkStats(d.data);
      })
      .catch(() => {});
  }, []);

  const features = [
    { icon: BarChart2,  label: 'Real-Time Charts',    desc: 'Live temperature graphs updated every minute' },
    { icon: Bell,       label: 'Smart Alerts',         desc: 'Instant notifications when temps go out of range' },
    { icon: Users,      label: 'Group Management',     desc: 'Assign devices and members to separate groups' },
    { icon: Shield,     label: 'Role-Based Access',    desc: 'Admin, custodian, and monitor permission levels' },
  ];

  const steps = [
    { icon: Radio,       num: '01', title: 'Sensors Deployed',   desc: 'Temperature sensors are installed in fish cages and seaweed farms at every monitored site.' },
    { icon: Wifi,        num: '02', title: 'Data Transmitted',   desc: 'Sensors send live readings to our secure cloud every few minutes, day and night.' },
    { icon: Bell,        num: '03', title: 'Instant Alerts',     desc: 'When temperature leaves the safe range, group custodians are notified immediately.' },
    { icon: BarChart2,   num: '04', title: 'Track & Decide',     desc: 'View charts and history to make informed decisions about your fish or seaweed farm.' },
  ];

  return (
    <div className="min-h-screen bg-[#060d1a] font-sans text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#060d1a]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ocean-600 rounded-lg flex items-center justify-center text-base shadow-lg">🌊</div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Bahari CBO</p>
              <p className="text-ocean-400 text-xs leading-tight hidden sm:block">Smart Ocean Monitoring</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {['#about', '#how-it-works', '#news'].map((href, i) => (
              <a key={href} href={href} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                {['About', 'How It Works', 'News'][i]}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-300 hover:text-white font-medium transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <Link to="/register" className="bg-ocean-600 hover:bg-ocean-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
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
          <div className="md:hidden border-t border-white/10 bg-[#0a1628] px-4 py-4 space-y-3">
            {[['#about','About'],['#how-it-works','How It Works'],['#news','News']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-300 py-1">{label}</a>
            ))}
            <Link to="/login" className="block text-sm text-ocean-400 font-semibold py-1">Sign In</Link>
            <Link to="/register" className="block bg-ocean-600 text-white text-sm font-semibold text-center py-2 rounded-lg">Register</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-ocean-900/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-ocean-800/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero image band */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-0">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-ocean-900 via-slate-900 to-[#060d1a] h-64 sm:h-80 flex items-end">
            {/* Animated dots representing sensors */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="grid grid-cols-8 gap-8">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i % 5 === 0 ? 'bg-ocean-400' : 'bg-slate-600'} ${i % 7 === 0 ? 'animate-pulse' : ''}`} />
                ))}
              </div>
            </div>
            {/* Ocean wave animation */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ocean-900/60 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/10">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-300 font-medium">Live Monitoring Active</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Bahari CBO IoT Sensor Network — Kenyan Coast</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Ocean Temperature
            <span className="block text-ocean-400">Monitoring for All</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time IoT sensor data from fish cages and seaweed farms along the Kenyan coast.
            Track conditions, receive alerts, and protect your harvest.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-ocean-500 hover:bg-ocean-400 text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg shadow-ocean-900/40 text-base">
              Get Started — It's Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors border border-white/10 text-base">
              Sign In to Your Account
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-ocean-500" />
            No credit card required · Free for community members
          </div>
        </div>

        {/* ── Network Overview ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Network Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Devices',  value: networkStats.total,   color: 'text-white',         icon: Radio },
              { label: 'Online',   value: networkStats.online,  color: 'text-ocean-400',     icon: Wifi },
              { label: 'Warning',  value: networkStats.warning, color: 'text-yellow-400',    icon: AlertTriangle },
              { label: 'Offline',  value: networkStats.offline, color: 'text-orange-400',    icon: WifiOff },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-1">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* scroll cue */}
        <div className="flex justify-center pb-10">
          <a href="#features" className="flex flex-col items-center text-slate-600 hover:text-slate-400 transition-colors gap-1">
            <span className="text-xs">Scroll to learn more</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ── Platform Features ── */}
      <section id="features" className="border-t border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-10">Platform Features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-5 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-ocean-600/20 border border-ocean-500/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-ocean-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="border-t border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-ocean-400 uppercase tracking-widest mb-3">About Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                A Coastal Community<br />Working Together
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-5">
                Bahari CBO was founded by fishermen and seaweed farmers along the Kenyan coast.
                Our mission is to protect ocean livelihoods using smart, affordable technology.
              </p>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                Temperature is one of the most critical factors for healthy fish cages and productive seaweed farms.
                Our sensor network ensures every member knows what is happening at their site — any time, from any phone.
              </p>
              <div className="flex flex-wrap gap-2">
                {['🐟 Fish Farming', '🌿 Seaweed Farming', '📊 Data Monitoring', '🤝 Community Driven'].map((tag) => (
                  <span key={tag} className="bg-white/5 border border-white/10 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Status card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="font-bold text-white text-sm">System Status</p>
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> All Systems Operational
                </span>
              </div>
              {[
                { label: 'Fish Cage Sensors',  status: 'Monitored',   ok: true },
                { label: 'Seaweed Farm Sites', status: 'Monitored',   ok: true },
                { label: 'Live Data Updates',  status: 'Every 5 min', ok: true },
                { label: 'Alert System',       status: 'Active',      ok: true },
                { label: 'API Endpoint',       status: 'Online',      ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-white text-sm font-medium">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="border-t border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-ocean-400 uppercase tracking-widest mb-3">Simple & Reliable</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How Our Monitoring Works</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">
              You do not need to be a technology expert. Our system is built for every community member.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(({ icon: Icon, num, title, desc }) => (
              <div key={title} className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-ocean-500/40 transition-colors">
                <p className="text-4xl font-black text-white/5 absolute top-4 right-4 leading-none">{num}</p>
                <div className="w-10 h-10 rounded-lg bg-ocean-600/20 border border-ocean-500/30 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-ocean-400" />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News ── */}
      <section id="news" className="border-t border-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-ocean-400 uppercase tracking-widest mb-3">From Our Team</p>
              <h2 className="text-3xl font-bold text-white">Latest News & Updates</h2>
            </div>
            <Link to="/login" className="hidden sm:flex items-center gap-1 text-sm text-ocean-400 hover:text-ocean-300 font-medium transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(n => (
                <div key={n} className="rounded-2xl border border-white/10 overflow-hidden animate-pulse">
                  <div className="h-44 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded" />
                    <div className="h-3 bg-white/5 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-white/10 rounded-2xl">
              <Newspaper className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No news published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <article key={post._id}
                  className="rounded-2xl border border-white/10 overflow-hidden hover:border-ocean-500/40 transition-colors group bg-white/3">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-ocean-900 to-slate-900 flex items-center justify-center text-5xl">
                      {post.category === 'success_story' ? '🌟' : post.category === 'guide' ? '📖' : '🌊'}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryBadge cat={post.category} />
                      <span className="text-xs text-slate-600">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-2 text-sm leading-snug line-clamp-2 group-hover:text-ocean-400 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-600">By {post.author?.name || 'Bahari CBO'}</span>
                      <span className="text-xs text-slate-600">{post.views} views</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/5 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Monitor Your Site?</h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Join Bahari CBO members already using our monitoring system. Free, easy to use, and built for the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-ocean-500 hover:bg-ocean-400 text-white font-bold py-3.5 px-10 rounded-xl transition-colors shadow-lg text-base">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 px-10 rounded-xl transition-colors text-base">
              I Already Have an Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ocean-600 rounded-lg flex items-center justify-center text-sm">🌊</div>
            <div>
              <p className="text-white font-semibold text-sm">Bahari CBO</p>
              <p className="text-slate-600 text-xs">Built for Kenyan coastal communities</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#news" className="hover:text-white transition-colors">News</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-slate-700">© {new Date().getFullYear()} Bahari CBO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
