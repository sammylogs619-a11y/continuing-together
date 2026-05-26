import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, X, LogIn, UserPlus } from "lucide-react";
import {
  Search,
  Menu,
  Headphones,
  Languages,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import { AISupportFAB } from "@/components/ai-support-fab";
import {
  SiTelegram,
  SiX,
  SiGoogle,
  SiDiscord,
  SiInstagram,
  SiFacebook,
  SiSnapchat,
  SiYoutube,
  SiTiktok,
  SiWhatsapp,
  SiSteam,
  SiRoblox,
  SiActivision,
  SiPlaystation,
  SiDota2,
  SiCounterstrike,
  SiPubg,
  SiFortnite,
  SiValorant,
} from "react-icons/si";
import { FaMicrosoft, FaLinkedin, FaFire } from "react-icons/fa";
import { Gem, Gamepad2 } from "lucide-react";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

type BrandItem = {
  name: string;
  Icon: IconType | LucideIcon;
  color: string; // tailwind text color class
  bg?: string; // optional tile bg override
};

const services: BrandItem[] = [
  { name: "Telegram", Icon: SiTelegram, color: "text-[#229ED9]" },
  { name: "Twitter", Icon: SiX, color: "text-black" },
  { name: "Google", Icon: SiGoogle, color: "text-[#4285F4]" },
  { name: "Discord", Icon: SiDiscord, color: "text-[#5865F2]" },
  { name: "Instagram", Icon: SiInstagram, color: "text-[#E1306C]" },
  { name: "Facebook", Icon: SiFacebook, color: "text-[#1877F2]" },
  { name: "LinkedIn", Icon: FaLinkedin, color: "text-[#0A66C2]" },
  { name: "Microsoft", Icon: FaMicrosoft, color: "text-[#5E5E5E]" },
  { name: "Snapchat", Icon: SiSnapchat, color: "text-[#FFFC00]", bg: "bg-yellow-50" },
  { name: "YouTube", Icon: SiYoutube, color: "text-[#FF0000]" },
  { name: "TikTok", Icon: SiTiktok, color: "text-black" },
  { name: "WhatsApp", Icon: SiWhatsapp, color: "text-[#25D366]" },
];

const games: BrandItem[] = [
  { name: "Steam", Icon: SiSteam, color: "text-[#1b2838]" },
  { name: "Roblox", Icon: SiRoblox, color: "text-[#E2231A]" },
  { name: "Call Of Duty", Icon: SiActivision, color: "text-emerald-700" },
  { name: "PlayStation", Icon: SiPlaystation, color: "text-[#0070D1]" },
  { name: "Dota 2", Icon: SiDota2, color: "text-[#B5160E]" },
  { name: "Minecraft", Icon: Gem, color: "text-emerald-600" },
  { name: "CS:GO", Icon: SiCounterstrike, color: "text-amber-600" },
  { name: "PUBG", Icon: SiPubg, color: "text-yellow-600" },
  { name: "Free Fire", Icon: FaFire, color: "text-orange-500" },
  { name: "Fortnite", Icon: SiFortnite, color: "text-violet-600" },
  { name: "Valorant", Icon: SiValorant, color: "text-[#FA4454]" },
  { name: "Mobile Legends", Icon: Gamepad2, color: "text-indigo-700" },
];

const stores = [
  { name: "Sammy Official", badge: "verified", desc: "Sammy Official is a trusted digital marketplace where you can buy premium accounts.", color: "from-rose-500 to-rose-700" },
  { name: "King Store", badge: null, desc: "We sell all types of social media accounts like Gmail, Google, Facebook & more.", color: "from-amber-500 to-yellow-600" },
  { name: "Jiostore", badge: null, desc: "We have all types of high quality accounts and after sale service support.", color: "from-blue-500 to-blue-700" },
  { name: "Jannat Digital", badge: "trusted", desc: "Welcome to Jannat Digital — your trusted source for high-quality digital goods.", color: "from-fuchsia-500 to-purple-700" },
  { name: "Matamate", badge: "trusted", desc: "We sell high quality social media accounts with full warranty.", color: "from-cyan-500 to-blue-600" },
  { name: "Ss Marketing", badge: "verified", desc: "We deliver premium social media accounts across platforms like Insta & TikTok.", color: "from-orange-500 to-red-600" },
  { name: "Global Ads", badge: "verified", desc: "Standard Facebook ad accounts and BM accounts ready for campaigns.", color: "from-lime-500 to-emerald-600" },
  { name: "Prism Flow", badge: "verified", desc: "Welcome to Prism Flow — where data is not just cold characters but power.", color: "from-slate-500 to-slate-800" },
  { name: "SmartShop", badge: null, desc: "We deliver high-quality social media accounts across platforms worldwide.", color: "from-yellow-500 to-orange-500" },
];

const products = [
  { title: "Mail — @52you.in — real people mail with IMAP, POP3, SMTP, WEB access", price: "$0.09", left: "20 left" },
  { title: "Mailforgames.com | Real people's emails with IMAP-WEB | Trusted", price: "$0.08", left: "50 left" },
  { title: "Smakmail.com Eternal | IMAP + POP3 + API | .COM email for registrations", price: "$0.12", left: "50 left" },
  { title: "Offlive.com Accounts | Email@offlive.com accounts. Male or female.", price: "$0.16", left: "20 left" },
  { title: "2/3 year old Gmail with recovery 2FA key", price: "$78.00", left: "47 left" },
  { title: "100 fresh Gmails 2026 — on demand", price: "$0.43", left: "Manual · 6h" },
  { title: "Mailo.com Accounts | POP3, SMTP, IMAP activated", price: "$0.14", left: "9 left" },
  { title: "Twitter Aged 2009–2020 | 1100–1500+ Followers | 2FA Enabled", price: "$13.50", left: "Manual · 12h" },
  { title: "Twitter Aged 2009–2020 | 500–1000 Followers | 2FA Enabled", price: "$6.60", left: "Manual · 12h" },
  { title: "Twitter Aged 2009–2020 | 250–500 Followers | 2FA Enabled", price: "$2.25", left: "Manual · 12h" },
  { title: "Twitter Aged 2009–2020 | 100–250 Followers | 2FA Enabled", price: "$1.50", left: "Manual · 12h" },
  { title: "Twitter Aged 2009–2020 | 30–100 Followers | 2FA Enabled", price: "$1.00", left: "Manual · 12h" },
  { title: "Twitter Aged 2008 Account | Original Email | 2FA Enabled", price: "$8.00", left: "Manual · 12h" },
  { title: "Twitter Aged 2007 Account | Original Email | 2FA Enabled", price: "$15.00", left: "Manual · 12h" },
  { title: "Gmail Account — premium quality", price: "$0.75", left: "10 left" },
  { title: "6–7 year old Gmail and recovery mail — 100% active", price: "$16.00", left: "Manual · 24h" },
  { title: "Fresh Outlook accounts", price: "$0.20", left: "107 left" },
  { title: "3/5 Month 2FA Facebook Account | Vietnam IP", price: "$0.25", left: "538 left" },
];

const blog = [
  { date: "2026-05-15", title: "Sammy Store vs Z2U: Which marketplace has better digital account delivery?" },
  { date: "2026-05-13", title: "Sammy Store vs MMOGA: Account marketplace comparison for 2026" },
  { date: "2026-05-11", title: "Sammy Store vs Kinguin: Where to buy digital accounts safely" },
];

function IconTile({ item }: { item: BrandItem }) {
  const { Icon } = item;
  return (
    <a
      href="#"
      className="group flex flex-col items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors"
    >
      <div
        className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-white border ${item.bg ?? ""}`}
      >
        <Icon className={`h-7 w-7 ${item.color}`} />
      </div>
      <span className="text-xs text-foreground/80 group-hover:text-foreground text-center leading-tight">
        {item.name}
      </span>
    </a>
  );
}

function Badge({ kind }: { kind: "verified" | "trusted" }) {
  if (kind === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-verified/10 text-verified px-2 py-0.5 text-xs font-medium">
        <BadgeCheck className="h-3 w-3" /> Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-trusted/10 text-trusted px-2 py-0.5 text-xs font-medium">
      <ShieldCheck className="h-3 w-3" /> Trusted
    </span>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top utility bar */}
      <div className="border-b bg-muted/40 text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <nav className="flex gap-4 text-muted-foreground">
            <a href="/for-buyers" className="hover:text-foreground">For buyers</a>
            <a href="/for-sellers" className="hover:text-foreground">For sellers</a>
          </nav>
          <AuthNav />
        </div>
      </div>

      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <a href="/" className="flex items-center gap-2 min-w-0">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground font-black">
                S
              </div>
              <span className="text-lg font-extrabold tracking-tight truncate">SAMMY STORE</span>
            </a>
            <a
              href="/products"
              className="inline-flex items-center gap-1 rounded-md bg-brand text-brand-foreground px-3 py-2 text-sm font-medium hover:opacity-90 shrink-0 sm:hidden"
            >
              <Menu className="h-4 w-4" /> Catalog
            </a>
          </div>
          <a
            href="/products"
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-brand text-brand-foreground px-3 py-2 text-sm font-medium hover:opacity-90 shrink-0"
          >
            <Menu className="h-4 w-4" /> Catalog
          </a>
          <div className="sm:ml-auto flex flex-1 sm:max-w-2xl items-center rounded-md border bg-background overflow-hidden">
            <input
              className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-transparent"
              placeholder="Search on SAMMY STORE"
            />
            <button className="grid h-10 w-10 shrink-0 place-items-center bg-muted hover:bg-muted/70">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>


      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-2xl bg-brand-blue text-brand-blue-foreground px-6 py-12 md:py-16 text-center shadow-sm">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            SAMMY STORE is a reliable marketplace of digital services
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-base md:text-lg opacity-90">
            A secure platform for independent third-party vendors to list digital services,
            software, and promotional assets for global buyers.
          </p>
        </div>
      </section>

      {/* Services & Games */}
      <section className="mx-auto max-w-7xl px-4 py-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-end justify-between border-b border-brand-blue/30 pb-2">
            <h2 className="text-lg font-bold">Services</h2>
            <a href="#" className="text-sm text-brand-blue inline-flex items-center gap-1 hover:underline">
              Show all services <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-7 gap-2">
            {services.map((s) => (
              <IconTile key={s.name} item={s} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-end justify-between border-b border-brand-blue/30 pb-2">
            <h2 className="text-lg font-bold">Games</h2>
            <a href="#" className="text-sm text-brand-blue inline-flex items-center gap-1 hover:underline">
              Show all games <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-7 gap-2">
            {games.map((g) => (
              <IconTile key={g.name} item={g} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Stores */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <h2 className="text-xl font-bold border-b-2 border-brand-blue inline-block pb-1">Top Stores</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stores.map((s) => (
            <div key={s.name} className="rounded-xl border bg-card p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <div className={`h-12 w-12 shrink-0 rounded-full bg-gradient-to-br ${s.color} grid place-items-center text-white font-bold`}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    {s.badge && <Badge kind={s.badge as "verified" | "trusted"} />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
                </div>
              </div>
              <button className="mt-4 w-full rounded-md bg-brand-blue text-brand-blue-foreground py-2 text-sm font-medium hover:opacity-90">
                Visit Store
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Products */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-xl font-bold border-b-2 border-brand-blue inline-block pb-1">Latest Products</h2>
        <div className="mt-5 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p, i) => (
            <article key={i} className="rounded-xl border bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="relative aspect-square bg-gradient-to-br from-muted to-muted-foreground/10 grid place-items-center text-3xl">
                <span className="opacity-60">📦</span>
                <span className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium border">
                  {p.left}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-xs font-medium leading-snug line-clamp-3 min-h-[3rem]">{p.title}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-brand font-bold">{p.price}</span>
                  <button className="text-xs rounded-md border border-brand-blue text-brand-blue px-2 py-1 hover:bg-brand-blue hover:text-brand-blue-foreground transition-colors">
                    View
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold border-b-2 border-brand-blue inline-block pb-1">From the Blog</h2>
          <a href="#" className="text-sm text-brand-blue inline-flex items-center gap-1 hover:underline">
            All Posts <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {blog.map((b) => (
            <a key={b.title} href="#" className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow block">
              <time className="text-xs text-muted-foreground">{b.date}</time>
              <h3 className="mt-2 font-semibold leading-snug">{b.title}</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-brand-blue">
                Read <ArrowRight className="h-3 w-3" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground font-black text-xs">S</div>
            <span className="font-semibold text-foreground">SAMMY STORE</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <nav className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="/for-buyers" className="hover:text-foreground">For buyers</a>
            <a href="/for-sellers" className="hover:text-foreground">For sellers</a>
          </nav>
        </div>
      </footer>

      {/* Floating buttons */}
      <div className="fixed left-3 top-20 flex flex-col gap-3 z-40">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" aria-label="Support">
          <Headphones className="h-5 w-5" />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" aria-label="Language">
          <Languages className="h-5 w-5" />
        </button>
      </div>
      <div className="fixed right-3 top-20 z-50">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-300/50 hover:scale-105 transition-transform"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Slide-in menu panel */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-40 h-full w-[88%] max-w-sm bg-slate-800 text-white shadow-2xl transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="px-5 pt-20 pb-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 ring-4 ring-indigo-400/30">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Guest User</h3>
              <p className="text-sm text-slate-300">Sign in to access features</p>
            </div>
          </div>

          <div className="my-5 h-px bg-white/10" />

          <a
            href="/login"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium hover:bg-white/10 transition-colors"
          >
            <LogIn className="h-5 w-5" /> Sign In
          </a>
          <a
            href="/signup"
            className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium hover:bg-white/10 transition-colors"
          >
            <UserPlus className="h-5 w-5" /> Sign Up
          </a>
        </div>
      </aside>
    </div>
  );
}
