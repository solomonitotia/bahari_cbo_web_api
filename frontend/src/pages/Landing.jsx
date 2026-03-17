import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = '/api';

// Wave SVG divider
const Wave = ({ flip = false, fill = '#fff' }) => (
  <div className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`}>
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
      <path
        d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
        fill={fill}
      />
    </svg>
  </div>
);

const CategoryBadge = ({ cat }) => {
  const styles = {
    news: 'bg-blue-100 text-blue-700',
    update: 'bg-green-100 text-green-700',
    guide: 'bg-purple-100 text-purple-700',
    announcement: 'bg-orange-100 text-orange-700',
    success_story: 'bg-teal-100 text-teal-700',
  };
  const labels = {
    news: 'News', update: 'Update', guide: 'Guide',
    announcement: 'Announcement', success_story: 'Success Story',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[cat] || 'bg-gray-100 text-gray-600'}`}>
      {labels[cat] || cat}
    </span>
  );
};

export default function Landing() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/posts?limit=6`)
      .then((r) => r.json())
      .then((d) => setPosts(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  const stats = [
    { value: '500+', label: 'Community Members' },
    { value: '12', label: 'Fish Cage Sites' },
    { value: '8', label: 'Seaweed Farms' },
    { value: '24/7', label: 'Live Monitoring' },
  ];

  const steps = [
    { icon: '📡', title: 'Sensors Deployed', desc: 'Temperature sensors are installed in fish cages and seaweed farms across our sites.' },
    { icon: '📶', title: 'Data Transmitted', desc: 'Sensors send live readings to our secure system every few minutes, day and night.' },
    { icon: '🔔', title: 'Instant Alerts', desc: 'When temperature goes outside the safe range, group custodians are notified immediately.' },
    { icon: '📊', title: 'Track & Decide', desc: 'Community members view charts and history to make informed decisions about their farms.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌊</span>
            <div>
              <p className="font-bold text-ocean-800 leading-tight text-sm">Bahari CBO</p>
              <p className="text-ocean-500 text-xs leading-tight hidden sm:block">Smart Ocean Monitoring</p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm text-gray-600 hover:text-ocean-600 font-medium transition-colors">About</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-ocean-600 font-medium transition-colors">How It Works</a>
            <a href="#news" className="text-sm text-gray-600 hover:text-ocean-600 font-medium transition-colors">News</a>
            <Link to="/login" className="text-sm text-ocean-600 font-semibold hover:text-ocean-800 transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Join the Community</Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a href="#about" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 py-1">About</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 py-1">How It Works</a>
            <a href="#news" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 py-1">News</a>
            <Link to="/login" className="block text-sm font-semibold text-ocean-600 py-1">Sign In</Link>
            <Link to="/register" className="btn-primary block text-center text-sm py-2">Join the Community</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen bg-gradient-to-br from-ocean-900 via-ocean-800 to-teal-700 flex items-center pt-16">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 text-9xl">🌊</div>
          <div className="absolute bottom-40 right-20 text-8xl">🐟</div>
          <div className="absolute top-1/2 left-1/3 text-7xl">🌿</div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-ocean-100 text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Live Monitoring Active
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Protecting Kenya's
            <span className="block text-ocean-300">Ocean Livelihoods</span>
          </h1>

          <p className="text-lg sm:text-xl text-ocean-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bahari CBO uses smart technology to monitor water temperature at fish cages and seaweed farms —
            helping our community make better decisions and protect their harvests.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-ocean-800 font-bold py-3 px-8 rounded-xl hover:bg-ocean-50 transition-colors shadow-lg text-base"
            >
              Join the Community
            </Link>
            <Link
              to="/login"
              className="bg-ocean-700 hover:bg-ocean-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors border border-ocean-500 text-base"
            >
              Sign In to Monitor
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 flex justify-center">
            <a href="#stats" className="flex flex-col items-center text-ocean-300 hover:text-white transition-colors">
              <span className="text-xs mb-1">Scroll to learn more</span>
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>

        <Wave fill="#f9fafb" />
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold text-ocean-700 mb-1">{s.value}</p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-ocean-500 font-semibold text-sm uppercase tracking-wider">About Us</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-6 leading-tight">
                We Are a Coastal Community Working Together
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-5">
                Bahari CBO (Community Based Organisation) was founded by fishermen and seaweed farmers along the Kenyan coast.
                Our mission is to improve the livelihoods of our members by using technology to protect and monitor their ocean resources.
              </p>
              <p className="text-gray-600 text-base leading-relaxed mb-8">
                We know that temperature is one of the most important factors for healthy fish cages and productive seaweed farms.
                That is why we have installed sensors at every site — so every member knows what is happening, at any time, from their phone.
              </p>
              <div className="flex flex-wrap gap-3">
                {['🐟 Fish Farming', '🌿 Seaweed Farming', '📊 Data Monitoring', '🤝 Community Driven'].map((tag) => (
                  <span key={tag} className="bg-ocean-50 text-ocean-700 text-sm font-medium px-4 py-1.5 rounded-full border border-ocean-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-ocean-500 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
                <p className="text-lg font-bold mb-6">Current System Status</p>
                {[
                  { label: 'All Fish Cage Sites', status: 'Monitored', ok: true },
                  { label: 'All Seaweed Farms', status: 'Monitored', ok: true },
                  { label: 'Live Data Updates', status: 'Every 5 min', ok: true },
                  { label: 'Alert System', status: 'Active', ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/20 last:border-0">
                    <span className="text-ocean-100 text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-white text-sm font-medium">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-yellow-900 rounded-xl px-4 py-2 text-sm font-bold shadow-lg">
                🌡️ Live Temperature Data
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-ocean-500 font-semibold text-sm uppercase tracking-wider">Simple & Reliable</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">How Our Monitoring Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base">
              You do not need to be a technology expert. Our system is designed to be simple for every community member.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-ocean-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow">
                  {i + 1}
                </div>
                <div className="text-4xl mb-4 mt-2">{step.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News & Updates ── */}
      <section id="news" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-ocean-500 font-semibold text-sm uppercase tracking-wider">From Our Team</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Latest News & Updates</h2>
            </div>
            <Link to="/login" className="hidden sm:block text-sm text-ocean-600 font-semibold hover:underline">
              View all →
            </Link>
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <p className="text-5xl mb-4">📰</p>
              <p className="text-gray-500">No news published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Cover image or gradient placeholder */}
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-ocean-400 to-teal-500 flex items-center justify-center text-5xl">
                      {post.category === 'success_story' ? '🌟' : post.category === 'guide' ? '📖' : '🌊'}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryBadge cat={post.category} />
                      <span className="text-xs text-gray-400">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2 text-base leading-snug line-clamp-2 group-hover:text-ocean-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">By {post.author?.name || 'Bahari CBO'}</span>
                      <span className="text-xs text-gray-400">{post.views} views</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-gradient-to-br from-ocean-800 to-teal-700 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-8xl flex items-center justify-center gap-16 pointer-events-none">
          <span>🌊</span><span>🐟</span><span>🌿</span>
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Monitor Your Site?</h2>
          <p className="text-ocean-200 text-base mb-10 leading-relaxed">
            Join other Bahari CBO members already using our monitoring system. It is free, easy to use, and made for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-ocean-800 font-bold py-3.5 px-10 rounded-xl hover:bg-ocean-50 transition-colors shadow-lg text-base"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white font-semibold py-3.5 px-10 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              I Already Have an Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ocean-950 text-ocean-300 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌊</span>
              <div>
                <p className="text-white font-semibold text-sm">Bahari CBO</p>
                <p className="text-ocean-400 text-xs">Protecting Ocean Livelihoods</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#news" className="hover:text-white transition-colors">News</a>
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <p className="text-xs text-ocean-500">© {new Date().getFullYear()} Bahari CBO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
