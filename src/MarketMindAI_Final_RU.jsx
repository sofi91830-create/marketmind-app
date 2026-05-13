/**
 * MarketMind AI — Telegram Mini App (Russian, solid dark)
 * Деплой: Vercel / любой статический хост
 * Точка входа: index.jsx (или App.jsx)
 *
 * Зависимости:  react, react-dom, lucide-react, tailwindcss
 * Telegram SDK: добавьте в index.html ↓
 *   <script src="https://telegram.org/js/telegram-web-app.js"></script>
 *
 * URL-параметры (все опциональны):
 *   ?profit=47832&orders=284&username=Алексей
 *   &is_pro=true
 *   &stock_alert=Urban+Step+Pro:3:12,City+Runner:8:45,Trail+V2:14:89
 *
 * Формат stock_alert: "Название:дней:штук,..."
 */

import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag, RotateCcw, Wand2, Loader2, Star,
  Search, Lock, CheckCircle2, AlertTriangle, ChevronRight,
  BarChart3, MessageSquare, Home, Wifi, Sparkles,
  Package, ArrowUpRight, Target, Eye, Copy, Send, TrendingUp,
  Crown, Zap,
} from "lucide-react";

// ─── УТИЛИТЫ ──────────────────────────────────────────────────────────────────
const cx = (...cls) => cls.filter(Boolean).join(" ");

const pluralDays = (n) =>
  n % 10 === 1 && n % 100 !== 11 ? `${n} день`
  : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? `${n} дня`
  : `${n} дней`;

const getParam = (key, fallback = "") =>
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(key) ?? fallback
    : fallback;

const parseStock = (raw) => {
  if (!raw) return DEFAULT_STOCK;
  try {
    return raw.split(",").map((seg) => {
      const [name, days, stock] = seg.split(":");
      return { name: decodeURIComponent(name), daysLeft: parseInt(days) || 7, stock: parseInt(stock) || 50 };
    });
  } catch { return DEFAULT_STOCK; }
};

// ─── КОНСТАНТЫ ────────────────────────────────────────────────────────────────
const DEFAULT_STOCK = [
  { name: "Urban Step Pro",  daysLeft: 3,  stock: 12 },
  { name: "City Runner X",   daysLeft: 8,  stock: 45 },
  { name: "Trail Blazer V2", daysLeft: 14, stock: 89 },
];

const DEFAULT_REVIEWS = [
  { id: 1, initials: "МК", product: "Urban Step Pro",  rating: 2, date: "2 часа назад",   text: "Подошва начала отслаиваться уже через неделю. Ожидала гораздо лучшего качества за такую цену. Очень разочарована.", replied: false },
  { id: 2, initials: "ДВ", product: "City Runner X",   rating: 4, date: "5 часов назад", text: "В целом отличные кроссовки. Молния немного тугая, но посадка идеальная и удобно весь день на ногах.", replied: false },
  { id: 3, initials: "СР", product: "Trail Blazer V2", rating: 5, date: "1 день назад",   text: "Обожаю! Уже вторая пара. Качество превосходное, доставка молниеносная!", replied: true },
];

const DEFAULT_KEYWORDS = [
  { word: "водонепроницаемые кроссовки для бега", volume: "49К", difficulty: "medium" },
  { word: "лёгкие трейловые кеды",                volume: "31К", difficulty: "low"    },
  { word: "мужская городская обувь 2025",          volume: "22К", difficulty: "low"    },
  { word: "дышащие спортивные кроссовки",          volume: "18К", difficulty: "high"   },
];

const SPARKLINE = [22, 31, 27, 43, 35, 50, 46, 60, 53, 67, 62, 77];

const DIFF_LABEL = { low: "низкая", medium: "средняя", high: "высокая" };

const AI_REPLIES = [
  "Уважаемый покупатель, искренне благодарим за честный отзыв! Нам очень жаль о возникшей проблеме — это не соответствует нашим стандартам. Мы уже передали информацию в отдел качества и хотим всё исправить. Пожалуйста, свяжитесь с поддержкой — отправим замену или вернём деньги в полном объёме.",
  "Добрый день! Большое спасибо за тёплые слова — особенно приятно слышать об удобстве и посадке! По молнии — уже работаем над улучшением в следующей партии. Как постоянному покупателю хотим предложить скидку 15% на следующий заказ — напишите нам напрямую!",
  "Здравствуйте! Спасибо за отличный отзыв — очень рады, что товар оправдал ожидания! Подпишитесь на наш магазин, чтобы не пропустить новинки и спецпредложения.",
];

// ─── ЦВЕТА (Tailwind, solid dark) ─────────────────────────────────────────────
// Карточки: bg-slate-800 / border-slate-700
// Страница: bg-slate-900
// Акцент:   violet-600 → cyan-500 (gradient)
// Успех:    emerald-400 | Предупреждение: amber-400 | Ошибка: red-400

// ─── АТОМАРНЫЕ КОМПОНЕНТЫ ─────────────────────────────────────────────────────
/** Solid dark card — bg-slate-800, border-slate-700 */
const Card = ({ children, className = "", style = {} }) => (
  <div
    className={cx("bg-slate-800 border border-slate-700 rounded-2xl", className)}
    style={style}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const v = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-950 text-emerald-400 border border-emerald-800",
    warning: "bg-amber-950  text-amber-400  border border-amber-800",
    danger:  "bg-red-950    text-red-400    border border-red-800",
    info:    "bg-violet-950 text-violet-300 border border-violet-800",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", v[variant])}>
      {children}
    </span>
  );
};

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5 mt-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={11} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-700 fill-slate-700"} />
    ))}
  </div>
);

// ─── СПАРКЛАЙН ────────────────────────────────────────────────────────────────
const Sparkline = ({ data = SPARKLINE }) => {
  const w = 110, h = 36;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / rng) * (h - 6) - 3,
  ]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M${pts.map(([x, y]) => `${x},${y}`).join("L")}L${w},${h}L0,${h}Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity=".4" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <polyline points={line} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill="#a78bfa" />
    </svg>
  );
};

// ─── PRO-ОВЕРЛЕЙ ──────────────────────────────────────────────────────────────
const ProOverlay = ({ onUpgrade }) => (
  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
    style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(6px)" }}>
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
        <Crown size={22} className="text-white" />
      </div>
      <p className="text-white font-black text-[15px] leading-snug">Функция доступна<br/>в тарифе PRO</p>
      <p className="text-slate-400 text-xs leading-relaxed">Разблокируйте полный анализ конкурентов, SEO-аудит и неограниченные ИИ-ответы</p>
      <button onClick={onUpgrade}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
        Активировать PRO
      </button>
    </div>
  </div>
);

// ─── ВКЛАДКА 1: АНАЛИТИКА ─────────────────────────────────────────────────────
const AnalyticsTab = ({ profit, orders, stockItems, username }) => {
  const fmtProfit = Number(profit || 47832).toLocaleString("ru-RU");
  const fmtOrders = Number(orders || 284);

  return (
    <div className="px-4 pb-28 pt-3 space-y-3">

      {/* Приветствие */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-slate-400 text-[12px]">Доброе утро,</p>
          <p className="text-white font-black text-[20px] tracking-tight leading-tight">
            {username || "Продавец"} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-950 border border-emerald-800 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block" />
            <span className="text-emerald-400 text-[11px] font-bold">Онлайн</span>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black"
            style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
            {(username || "П").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Карточка прибыли */}
      <Card className="p-5" style={{ background: "#1a2035", borderColor: "#334155", boxShadow: "0 0 0 1px rgba(76,29,149,.12) inset" }}>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
          Чистая прибыль сегодня
        </p>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[2.5rem] font-black leading-none tracking-tight tabular-nums"
              style={{ background: "linear-gradient(135deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 20px rgba(139,92,246,.5))" }}>
              ₽{fmtProfit}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <ArrowUpRight size={13} className="text-emerald-400" />
              <span className="text-emerald-400 text-[13px] font-bold">+12.4%</span>
              <span className="text-slate-500 text-[12px]">по сравнению со вчерашним днём</span>
            </div>
          </div>
          <Sparkline />
        </div>
        <div className="h-px bg-slate-800 my-3" />
        <div className="flex items-center justify-between">
          <span className="text-slate-600 text-[10px]">Обновлено 2 мин. назад</span>
          <span className="text-slate-600 text-[10px] flex items-center gap-1">
            <Wifi size={10} />Синхронизация
          </span>
        </div>
      </Card>

      {/* Сетка метрик */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-950 border border-violet-800 flex items-center justify-center">
              <ShoppingBag size={14} className="text-violet-400" />
            </div>
            <Badge variant="success">+8 сег.</Badge>
          </div>
          <p className="text-[1.7rem] font-black text-white tabular-nums leading-none">{fmtOrders}</p>
          <p className="text-slate-500 text-[11px] mt-1.5 font-medium">Всего заказов</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center">
              <RotateCcw size={14} className="text-amber-400" />
            </div>
            <Badge variant="success">-0.3%</Badge>
          </div>
          <p className="text-[1.7rem] font-black text-white tabular-nums leading-none">2.1%</p>
          <p className="text-slate-500 text-[11px] mt-1.5 font-medium">Процент возвратов</p>
        </Card>
      </div>

      {/* Критический остаток */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-amber-400" />
          <span className="text-slate-100 text-[13px] font-bold">Критический остаток</span>
          <Badge variant="warning" className="ml-auto">3 артикула</Badge>
        </div>
        <div className="space-y-4">
          {stockItems.map((item, i) => {
            const maxStock = Math.max(item.stock * 5, 200);
            const pct = Math.round((item.stock / maxStock) * 100);
            const color  = item.daysLeft <= 3 ? "#ef4444" : item.daysLeft <= 7 ? "#f59e0b" : "#10b981";
            const tcls   = item.daysLeft <= 3 ? "text-red-400" : item.daysLeft <= 7 ? "text-amber-400" : "text-emerald-400";
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package size={11} className="text-slate-600 flex-shrink-0" />
                    <span className="text-slate-200 text-[13px] font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-slate-500 text-[11px]">{item.stock} шт.</span>
                    <span className={cx("text-[11px] font-bold", tcls)}>{pluralDays(item.daysLeft)}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}70` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ─── ВКЛАДКА 2: РЕПУТАЦИЯ ─────────────────────────────────────────────────────
const ReputationTab = () => {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [loadingId, setLoadingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const pending = reviews.filter(r => !r.replied).length;

  const generate = (r) => {
    setLoadingId(r.id);
    setTimeout(() => {
      const reply = r.rating <= 2 ? AI_REPLIES[0] : r.rating <= 4 ? AI_REPLIES[1] : AI_REPLIES[2];
      setDrafts(d => ({ ...d, [r.id]: reply }));
      setLoadingId(null);
    }, 2200);
  };
  const send = (id) => {
    setReviews(rs => rs.map(r => r.id === id ? { ...r, replied: true } : r));
    setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
  };

  return (
    <div className="px-4 pb-28 pt-3 space-y-3">
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-white font-black text-[20px] tracking-tight">Репутация (ИИ)</p>
          <p className="text-slate-500 text-xs mt-0.5">Управление отзывами с помощью нейросети</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 mt-1">
          <Badge variant="info"><Sparkles size={9} />ИИ активен</Badge>
          {pending > 0 && <Badge variant="warning">{pending} без ответа</Badge>}
        </div>
      </div>

      {reviews.map(r => (
        <Card key={r.id} className="p-4">
          {/* Шапка */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-black"
              style={{ background: "linear-gradient(135deg,#3730a3,#1e40af)", border: "1px solid rgba(55,48,163,.4)", color: "#bfdbfe" }}>
              {r.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-slate-100 text-[13px] font-bold">{r.initials}</span>
                <span className="text-slate-500 text-[11px]">{r.date}</span>
              </div>
              <StarRating rating={r.rating} />
              <p className="text-slate-500 text-[11px] mt-0.5 truncate">{r.product}</p>
            </div>
          </div>

          <p className="text-slate-400 text-[13px] leading-relaxed mb-4">{r.text}</p>

          {r.replied ? (
            <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-emerald-400 text-[12px] font-bold">Ответ отправлен</span>
            </div>
          ) : drafts[r.id] ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-violet-400" />
                <span className="text-violet-400 text-[11px] font-bold">Ответ сгенерирован нейросетью</span>
              </div>
              <textarea
                className="w-full bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-xs p-3 resize-none outline-none focus:border-violet-600 transition-colors leading-relaxed"
                rows={5}
                value={drafts[r.id]}
                onChange={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setDrafts(d => { const n = { ...d }; delete n[r.id]; return n; })}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-500 text-xs font-bold transition-colors hover:bg-slate-800 active:scale-95">
                  Отмена
                </button>
                <button
                  onClick={() => send(r.id)}
                  className="flex-1 py-2 rounded-xl text-violet-200 text-xs font-black flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95 bg-violet-950 border border-violet-800">
                  <Send size={11} />Отправить ответ
                </button>
              </div>
            </div>
          ) : loadingId === r.id ? (
            <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-violet-950 border border-violet-800">
              <Loader2 size={15} className="text-violet-400 animate-spin" />
              <span className="text-violet-300 text-[13px] font-medium">Нейросеть составляет ответ...</span>
            </div>
          ) : (
            <button
              onClick={() => generate(r)}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-[13px] font-black bg-violet-950 border border-violet-800 text-violet-300 transition-all active:scale-95 hover:bg-violet-900">
              <Wand2 size={14} />Сгенерировать ответ ИИ
            </button>
          )}
        </Card>
      ))}
    </div>
  );
};

// ─── ВКЛАДКА 3: ШПИОН И SEO ───────────────────────────────────────────────────
const GrowthTab = ({ isPro, onUpgrade }) => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSpy = () => {
    if (!url.trim()) return;
    setLoading(true);
    setTimeout(() => { setResult(true); setLoading(false); }, 1900);
  };

  const spyItems = [
    { label: "Ест. продаж/мес.", value: "₽1 240 000", Icon: TrendingUp },
    { label: "Остаток на складе", value: "~340 шт.",    Icon: Package   },
    { label: "Средний рейтинг",  value: "4.3 / 5",     Icon: Star      },
    { label: "Отзывов всего",    value: "1 847",        Icon: MessageSquare },
  ];

  return (
    <div className="px-4 pb-28 pt-3 space-y-3">
      <div className="pt-1">
        <p className="text-white font-black text-[20px] tracking-tight">Шпион и SEO</p>
        <p className="text-slate-500 text-xs mt-0.5">Анализ конкурентов · SEO Аудит карточки</p>
      </div>

      {/* Шпион конкурентов */}
      <div className="relative">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-cyan-400" />
            <span className="text-slate-100 text-[13px] font-bold">Шпион конкурентов</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-violet-600 transition-colors">
              <Search size={13} className="text-slate-600 flex-shrink-0" />
              <input
                type="url"
                placeholder="Вставьте ссылку на конкурента..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runSpy()}
                disabled={!isPro}
                className="bg-transparent text-slate-300 text-sm flex-1 outline-none placeholder-slate-700"
              />
            </div>
            <button
              onClick={runSpy}
              disabled={loading || !isPro}
              className="px-4 py-2.5 rounded-xl text-white disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            </button>
          </div>

          {result && isPro && (
            <div className="space-y-3 mt-3">
              <div className="h-px bg-slate-700" />
              <div className="grid grid-cols-2 gap-2.5">
                {spyItems.map((item, i) => (
                  <div key={i} className="rounded-xl bg-slate-900 border border-slate-700 p-3">
                    <item.Icon size={11} className="text-slate-600 mb-1.5" />
                    <p className="text-white font-black text-[13px]">{item.value}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all active:scale-95 bg-violet-950 border border-violet-800">
                <Sparkles size={13} className="text-violet-400" />
                <span className="text-violet-300 text-[13px] font-bold flex-1">Скачать полный отчёт</span>
                <ChevronRight size={13} className="text-violet-600" />
              </div>
            </div>
          )}
        </Card>
        {!isPro && <ProOverlay onUpgrade={onUpgrade} />}
      </div>

      {/* SEO Аудит */}
      <div className="relative">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-emerald-400" />
              <span className="text-slate-100 text-[13px] font-bold">SEO Аудит карточки</span>
            </div>
            <Badge variant="success">Авто-скан</Badge>
          </div>
          <p className="text-slate-500 text-[11px] mb-4 mt-1">Отсутствующие высокочастотные запросы для вашего топ-товара</p>

          <div className="space-y-2">
            {DEFAULT_KEYWORDS.map((kw, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-5 h-5 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={10} className="text-emerald-400" />
                </div>
                <span className="text-slate-400 text-[12px] flex-1">{kw.word}</span>
                <span className="text-slate-500 text-[11px]">{kw.volume}/мес.</span>
                <Badge variant={kw.difficulty === "low" ? "success" : kw.difficulty === "medium" ? "warning" : "danger"}>
                  {DIFF_LABEL[kw.difficulty]}
                </Badge>
              </div>
            ))}
          </div>

          <button
            disabled={!isPro}
            className="w-full mt-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-500 border border-slate-700 bg-slate-900 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 hover:bg-slate-800">
            <Copy size={11} />Скопировать все ключевые слова
          </button>
        </Card>
        {!isPro && <ProOverlay onUpgrade={onUpgrade} />}
      </div>
    </div>
  );
};

// ─── НИЖНЯЯ НАВИГАЦИЯ ─────────────────────────────────────────────────────────
const NAV = [
  { id: "analytics",  label: "Аналитика",   Icon: Home        },
  { id: "reputation", label: "Репутация",   Icon: MessageSquare },
  { id: "spy",        label: "Шпион и SEO", Icon: Search   },
];

const BottomNav = ({ active, onChange }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800">
    <div className="flex items-center justify-around max-w-md mx-auto px-4 pt-2.5 pb-7">
      {NAV.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 min-w-[60px]">
            <div className={cx(
              "w-11 h-10 rounded-2xl flex items-center justify-center transition-all duration-200",
              on ? "bg-violet-950 border border-violet-800" : "bg-transparent"
            )}>
              <Icon size={18} className={on ? "text-violet-300" : "text-slate-700"}
                style={on ? { filter: "drop-shadow(0 0 7px rgba(167,139,250,.8))" } : {}} />
            </div>
            <span className={cx("text-[10px] font-bold", on ? "text-violet-300" : "text-slate-700")}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── AMBIENT BLOBS ────────────────────────────────────────────────────────────
const AmbientBg = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {[
      { style: { top: -80, left: -60, width: 280, height: 280, background: "radial-gradient(circle,#7c3aed,transparent 70%)", opacity: .2 } },
      { style: { top: "38%", right: -70, width: 240, height: 240, background: "radial-gradient(circle,#0891b2,transparent 70%)", opacity: .17 } },
      { style: { bottom: 110, left: 20, width: 180, height: 180, background: "radial-gradient(circle,#10b981,transparent 70%)", opacity: .1 } },
    ].map((b, i) => (
      <div key={i} className="absolute rounded-full" style={{ filter: "blur(55px)", ...b.style }} />
    ))}
  </div>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("analytics");

  const params = useMemo(() => ({
    profit:   getParam("profit",   "47832"),
    orders:   getParam("orders",   "284"),
    username: getParam("username", "Алексей"),
    isPro:    getParam("is_pro",   "true") !== "false",
    stock:    parseStock(getParam("stock_alert", "")),
  }), []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try { tg.setHeaderColor("#0f172a"); }    catch {}
      try { tg.setBackgroundColor("#0f172a"); } catch {}
    }
  }, []);

  const handleUpgrade = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink("https://t.me/your_bot?start=upgrade_pro");
      tg.close();
    } else {
      window.open("https://t.me/your_bot?start=upgrade_pro", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative" style={{ color: "#f8fafc" }}>
      <AmbientBg />

      <div className="relative z-10 max-w-md mx-auto">

        {/* Логобар */}
        <div className="sticky top-0 z-30 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
            <BarChart3 size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-black tracking-tight"
            style={{ background: "linear-gradient(135deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            MarketMind AI
          </span>
          <div className="ml-auto">
            {params.isPro ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-950 border border-violet-800 text-violet-300">
                <Zap size={9} />PRO
              </span>
            ) : (
              <button onClick={handleUpgrade}
                className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-950 border border-violet-800 text-violet-300 transition-all active:scale-95">
                <Zap size={9} />Перейти на PRO
              </button>
            )}
          </div>
        </div>

        {/* Содержимое */}
        <div className="min-h-[calc(100vh-56px)]">
          {tab === "analytics"  && <AnalyticsTab  profit={params.profit} orders={params.orders} stockItems={params.stock} username={params.username} />}
          {tab === "reputation" && <ReputationTab />}
          {tab === "spy"        && <GrowthTab isPro={params.isPro} onUpgrade={handleUpgrade} />}
        </div>
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
