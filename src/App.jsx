import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// 🌟 DIARIO FAMILIAR — Maxi, Rocío & Carmen
// ============================================================

const STORAGE_KEY = "diario-familiar-data";

const PROFILES = [
  { id: "maxi", name: "Maxi", emoji: "🦸‍♂️", color: "#6366f1" },
  { id: "rocio", name: "Rocío", emoji: "🌸", color: "#f43f5e" },
  { id: "carmen", name: "Carmen", emoji: "🌟", color: "#ec4899" },
];

const DEFAULT_HABITS = {
  maxi: [
    { id: "h1", name: "Ejercicio", emoji: "🏋️" },
    { id: "h2", name: "Leer", emoji: "📖" },
    { id: "h3", name: "Comer bien sin atracones", emoji: "🥗" },
    { id: "h4", name: "Usar menos el móvil", emoji: "📵" },
  ],
  rocio: [
    { id: "h1", name: "Ejercicio", emoji: "🏋️" },
    { id: "h2", name: "Leer", emoji: "📖" },
    { id: "h3", name: "Meditar", emoji: "🧘" },
    { id: "h4", name: "Agua (8 vasos)", emoji: "💧" },
  ],
  carmen: [
    { id: "h1", name: "Salir a andar", emoji: "🚶‍♀️" },
    { id: "h2", name: "Leer", emoji: "📖" },
    { id: "h3", name: "Estudiar un poco", emoji: "📚" },
    { id: "h4", name: "Deberes", emoji: "📝" },
    { id: "h5", name: "Sacar a Salchichón", emoji: "🐕" },
    { id: "h6", name: "No enfadarse", emoji: "😌" },
  ],
};

const DEFAULT_REWARDS = {
  maxi: [
    { id: "r1", name: "Día de descanso total", emoji: "🛋️", cost: 50, claimed: false },
    { id: "r2", name: "Cena especial", emoji: "🍽️", cost: 30, claimed: false },
    { id: "r3", name: "Comprar algo chulo", emoji: "🎁", cost: 100, claimed: false },
  ],
  rocio: [
    { id: "r1", name: "Día de spa", emoji: "💆", cost: 50, claimed: false },
    { id: "r2", name: "Cena romántica", emoji: "🍷", cost: 40, claimed: false },
    { id: "r3", name: "Capricho especial", emoji: "🎁", cost: 80, claimed: false },
  ],
  carmen: [
    { id: "r1", name: "Elegir película familiar", emoji: "🎬", cost: 20, claimed: false },
    { id: "r2", name: "Helado doble", emoji: "🍦", cost: 15, claimed: false },
    { id: "r3", name: "Día sin deberes", emoji: "🎉", cost: 40, claimed: false },
    { id: "r4", name: "Juguete nuevo", emoji: "🧸", cost: 80, claimed: false },
  ],
};

const STAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6366f1"];
const STAR_LABELS = ["Malísimo", "Regular", "Bien", "Genial", "¡Increíble!"];
const CALENDAR_COLORS = ["#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#c7d2fe", "#e5e7eb"];

function getDateKey(date) {
  return date.toISOString().split("T")[0];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

// ---- Storage ----
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all expected keys exist
      return {
        entries: parsed.entries || {},
        rewards: parsed.rewards || JSON.parse(JSON.stringify(DEFAULT_REWARDS)),
        habits: parsed.habits || JSON.parse(JSON.stringify(DEFAULT_HABITS)),
      };
    }
  } catch (e) {
    console.warn("Error loading data:", e);
  }
  return {
    entries: {},
    rewards: JSON.parse(JSON.stringify(DEFAULT_REWARDS)),
    habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
  };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Error saving data:", e);
  }
}

// ============================================================
// COMPONENTS
// ============================================================

function StarRating({ value, onChange, size = 36 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-125 focus:outline-none active:scale-150"
          title={STAR_LABELS[star - 1]}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={(hover || value) >= star ? STAR_COLORS[star - 1] : "#d1d5db"} stroke={(hover || value) >= star ? STAR_COLORS[star - 1] : "#9ca3af"} strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {(hover || value) > 0 && (
        <span className="ml-2 text-sm font-medium" style={{ color: STAR_COLORS[(hover || value) - 1] }}>
          {STAR_LABELS[(hover || value) - 1]}
        </span>
      )}
    </div>
  );
}

function HabitChecklist({ habits, checked, onChange }) {
  return (
    <div className="space-y-2">
      {habits.map((habit) => {
        const isChecked = checked.includes(habit.id);
        return (
          <label
            key={habit.id}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isChecked ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-transparent hover:bg-gray-100"}`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => {
                const next = isChecked
                  ? checked.filter((h) => h !== habit.id)
                  : [...checked, habit.id];
                onChange(next);
              }}
              className="w-5 h-5 rounded accent-green-500"
            />
            <span className="text-xl">{habit.emoji}</span>
            <span className={`text-base flex-1 ${isChecked ? "line-through text-gray-400" : "text-gray-700"}`}>
              {habit.name}
            </span>
            {isChecked && <span className="text-green-500 font-bold">+2 ⭐</span>}
          </label>
        );
      })}
    </div>
  );
}

function DiaryLines({ lines, onChange }) {
  const placeholders = ["Lo mejor del día...", "Algo que aprendí...", "Mañana quiero..."];
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-gray-300 mt-2.5 text-sm font-mono w-5 text-right">{i + 1}.</span>
          <input
            type="text"
            value={lines[i] || ""}
            onChange={(e) => {
              const next = [...lines];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholders[i]}
            className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-gray-700 placeholder-gray-300 text-sm"
            maxLength={150}
          />
        </div>
      ))}
    </div>
  );
}

function MiniCalendar({ entries, profileId, year, month, onChangeMonth, onSelectDate, selectedDate }) {
  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];
  const today = getDateKey(new Date());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onChangeMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-lg">◀</button>
        <span className="font-bold text-gray-700 text-lg">{monthNames[month]} {year}</span>
        <button onClick={() => onChangeMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-lg">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((d) => (
          <div key={d} className="font-semibold text-gray-400 text-xs py-2">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entryKey = `${profileId}:${dateKey}`;
          const entry = entries[entryKey];
          const score = entry?.score || 0;
          const bg = score > 0 ? CALENDAR_COLORS[score - 1] : "#f9fafb";
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;
          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={`w-9 h-9 mx-auto rounded-full text-xs font-semibold transition-all ${isToday ? "ring-2 ring-indigo-400 ring-offset-1" : ""} ${isSelected ? "ring-2 ring-pink-400 ring-offset-1 scale-110" : ""} hover:scale-110`}
              style={{ backgroundColor: bg, color: score > 0 ? "#1f2937" : "#d1d5db" }}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
        {STAR_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: CALENDAR_COLORS[i] }} />
            <span>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardCard({ reward, points, onClaim }) {
  const canClaim = points >= reward.cost && !reward.claimed;
  const progress = Math.min(100, (points / reward.cost) * 100);
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${reward.claimed ? "border-green-300 bg-green-50" : canClaim ? "border-indigo-300 bg-white hover:shadow-lg hover:-translate-y-1" : "border-gray-200 bg-gray-50"}`}>
      <div className="text-3xl mb-2 text-center">{reward.emoji}</div>
      <div className="font-semibold text-gray-800 text-sm text-center">{reward.name}</div>
      {!reward.claimed && (
        <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: canClaim ? "#22c55e" : "#6366f1" }} />
        </div>
      )}
      <div className="flex items-center justify-center mt-2">
        {reward.claimed ? (
          <span className="text-sm text-green-600 font-bold">✅ ¡Canjeado!</span>
        ) : (
          <button
            disabled={!canClaim}
            onClick={() => canClaim && onClaim(reward.id)}
            className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all ${canClaim ? "bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            ⭐ {reward.cost} pts
          </button>
        )}
      </div>
    </div>
  );
}

function StatsBar({ entries, profileId, habits }) {
  const stats = useMemo(() => {
    let totalDays = 0, totalScore = 0, totalHabits = 0, totalPossibleHabits = 0;
    const today = new Date();
    const allKeys = Object.keys(entries).filter(k => k.startsWith(profileId + ":"));

    allKeys.forEach(key => {
      const e = entries[key];
      if (e?.score > 0) {
        totalDays++;
        totalScore += e.score;
        totalHabits += (e.habits || []).length;
        totalPossibleHabits += habits.length;
      }
    });

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${profileId}:${getDateKey(d)}`;
      if (entries[key]?.score > 0) currentStreak++;
      else break;
    }

    return {
      totalDays,
      avgScore: totalDays > 0 ? (totalScore / totalDays).toFixed(1) : "—",
      streak: currentStreak,
      habitRate: totalPossibleHabits > 0 ? Math.round((totalHabits / totalPossibleHabits) * 100) : 0,
    };
  }, [entries, profileId, habits]);

  const items = [
    { label: "Días", value: stats.totalDays, emoji: "📅", color: "#6366f1" },
    { label: "Media", value: stats.avgScore, emoji: "⭐", color: "#eab308" },
    { label: "Racha", value: `${stats.streak}d`, emoji: "🔥", color: "#ef4444" },
    { label: "Hábitos", value: `${stats.habitRate}%`, emoji: "✅", color: "#22c55e" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((s) => (
        <div key={s.label} className="text-center p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-lg">{s.emoji}</div>
          <div className="font-bold text-base text-gray-800 mt-0.5">{s.value}</div>
          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function HabitManager({ habits, onUpdate }) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✨");
  const emojis = ["✨", "🎯", "🏃", "🎨", "🎵", "🧹", "🍎", "💪", "📚", "🌱", "🧘", "💻", "🎮", "🛏️", "🪥"];

  return (
    <div className="space-y-3">
      {habits.map((h, i) => (
        <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <span className="text-xl">{h.emoji}</span>
          <span className="flex-1 text-gray-700 font-medium">{h.name}</span>
          <button
            onClick={() => onUpdate(habits.filter((_, idx) => idx !== i))}
            className="text-red-400 hover:text-red-600 text-lg px-2 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      {habits.length < 8 && (
        <>
          <div className="flex gap-1 flex-wrap p-2 bg-gray-50 rounded-xl">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                className={`text-lg p-1.5 rounded-lg transition-all ${newEmoji === e ? "bg-indigo-100 ring-2 ring-indigo-400 scale-110" : "hover:bg-gray-200"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-xl self-center">{newEmoji}</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo hábito..."
              className="flex-1 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  onUpdate([...habits, { id: `h${Date.now()}`, name: newName.trim(), emoji: newEmoji }]);
                  setNewName("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newName.trim()) {
                  onUpdate([...habits, { id: `h${Date.now()}`, name: newName.trim(), emoji: newEmoji }]);
                  setNewName("");
                }
              }}
              disabled={!newName.trim()}
              className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AddReward({ onAdd }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState(20);
  const [emoji, setEmoji] = useState("🎁");
  const emojis = ["🎁", "🎬", "🍦", "🎮", "🧸", "🎨", "🏖️", "🍕", "📱", "🎠", "🎪", "🎵"];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap p-2 bg-gray-50 rounded-xl">
        {emojis.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? "bg-indigo-100 ring-2 ring-indigo-400 scale-110" : "hover:bg-gray-200"}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <span className="text-2xl self-center">{emoji}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del premio..."
          className="flex-1 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"
          maxLength={30}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Coste:</span>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          className="flex-1 accent-indigo-500"
        />
        <span className="font-bold text-indigo-600 min-w-[60px] text-right">⭐ {cost}</span>
      </div>
      <button
        onClick={() => {
          if (name.trim()) {
            onAdd({ id: `r${Date.now()}`, name: name.trim(), emoji, cost, claimed: false });
            setName("");
          }
        }}
        disabled={!name.trim()}
        className="w-full py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Añadir Premio
      </button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [data, setData] = useState(loadData);
  const [profileId, setProfileId] = useState("maxi");
  const [tab, setTab] = useState("today");
  const today = getDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => { saveData(data); }, [data]);

  const profile = PROFILES.find((p) => p.id === profileId);
  const entryKey = `${profileId}:${selectedDate}`;
  const entry = data.entries[entryKey] || { score: 0, habits: [], lines: ["", "", ""] };
  const habits = data.habits[profileId] || [];
  const rewards = data.rewards[profileId] || [];

  const points = useMemo(() => {
    let pts = 0;
    Object.keys(data.entries).forEach((k) => {
      if (k.startsWith(profileId + ":")) {
        const e = data.entries[k];
        pts += (e.score || 0) * 2;
        pts += ((e.habits || []).length) * 2;
        pts += (e.lines || []).filter((l) => l.trim()).length;
      }
    });
    rewards.forEach((r) => { if (r.claimed) pts -= r.cost; });
    return pts;
  }, [data, profileId, rewards]);s, rewards, activeProfile]);

  const updateEntry = useCallback((updates) => {
    setData((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [entryKey]: { ...entry, ...updates },
      },
    }));
  }, [entryKey, entry]);

  const saveAnimation = useCallback(() => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1200);
  }, []);

  const claimReward = useCallback((rewardId) => {
    setData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        [activeProfile]: prev.rewards[activeProfile].map((r) =>
          r.id === rewardId ? { ...r, claimed: true } : r
        ),
      },
    }));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  }, [activeProfile]);

  const isToday = selectedDate === getDateKey(new Date());
  const dateObj = new Date(selectedDate + "T12:00:00");
  const dateDisplay = dateObj.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  const tabs = [
    { id: "hoy", name: "Hoy", emoji: "📝" },
    { id: "calendario", name: "Calendario", emoji: "📅" },
    { id: "recompensas", name: "Premios", emoji: "🏆" },
    { id: "ajustes", name: "Ajustes", emoji: "⚙️" },
  ];

  const allHabitsComplete = habits.length > 0 && (entry.habits || []).length === habits.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉🎊🥳</div>
        </div>
      )}

      {/* Save toast */}
      {showSaved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg font-semibold text-sm animate-bounce">
          ✅ ¡Guardado!
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text">
              Diario Familiar
            </h1>
            <div className="flex gap-1.5">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActiveProfile(p.id); setSelectedDate(getDateKey(new Date())); setActiveTab("hoy"); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${activeProfile === p.id ? "shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  style={activeProfile === p.id ? { backgroundColor: p.color, color: "white" } : {}}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Points banner */}
      <div className="max-w-lg mx-auto px-4 mt-3">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl px-4 py-2.5 border border-amber-200">
          <span className="text-amber-700 font-semibold text-sm">{profile.emoji} Puntos de {profile.name}</span>
          <span className="text-amber-700 font-extrabold text-xl">{totalPoints} ⭐</span>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Stats */}
        <StatsBar entries={data.entries} profileId={activeProfile} habits={habits} />

        <div className="mt-4">
          {/* === HOY === */}
          {activeTab === "hoy" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700 capitalize">{dateDisplay}</div>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(getDateKey(new Date()))}
                    className="text-sm text-indigo-500 hover:text-indigo-700 mt-1 font-medium"
                  >
                    ← Volver a hoy
                  </button>
                )}
              </div>

              {/* Score */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 text-base">¿Cómo fue tu día?</h3>
                <StarRating
                  value={entry.score}
                  onChange={(score) => { updateEntry({ score }); saveAnimation(); }}
                  size={42}
                />
              </section>

              {/* Diary */}
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 text-base">📔 3 líneas sobre hoy</h3>
                <DiaryLines
                  lines={entry.lines || ["", "", ""]}
                  onChange={(lines) => updateEntry({ lines })}
                />
                <button
                  onClick={saveAnimation}
                  className="mt-3 w-full py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold transition-colors active:scale-98"
                >
                  💾 Guardar diario
                </button>
              </section>

              {/* Habits */}
              <section className={`bg-white rounded-2xl p-5 shadow-sm border ${allHabitsComplete ? "border-green-300" : "border-gray-100"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-700 text-base">✅ Hábitos del día</h3>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${allHabitsComplete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {(entry.habits || []).length}/{habits.length}
                  </span>
                </div>
                <HabitChecklist
                  habits={habits}
                  checked={entry.habits || []}
                  onChange={(checked) => { updateEntry({ habits: checked }); saveAnimation(); }}
                />
                {allHabitsComplete && (
                  <div className="mt-3 text-center text-green-600 font-bold text-sm celebrate-pulse bg-green-50 rounded-xl py-2">
                    🎉 ¡Todos completados! +{habits.length * 2} puntos
                  </div>
                )}
              </section>
            </div>
          )}

          {/* === CALENDARIO === */}
          {activeTab === "calendario" && (
            <div className="space-y-4">
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <MiniCalendar
                  entries={data.entries}
                  profileId={activeProfile}
                  year={calYear}
                  month={calMonth}
                  onChangeMonth={(dir) => {
                    let m = calMonth + dir;
                    let y = calYear;
                    if (m < 0) { m = 11; y--; }
                    if (m > 11) { m = 0; y++; }
                    setCalMonth(m);
                    setCalYear(y);
                  }}
                  onSelectDate={(date) => { setSelectedDate(date); setActiveTab("hoy"); }}
                  selectedDate={selectedDate}
                />
              </section>

              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 text-base">📖 Últimas entradas</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {Object.keys(data.entries)
                    .filter((k) => k.startsWith(activeProfile + ":"))
                    .sort()
                    .reverse()
                    .slice(0, 15)
                    .map((key) => {
                      const e = data.entries[key];
                      if (!e.score) return null;
                      const d = key.split(":")[1];
                      const dateStr = new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
                      return (
                        <button
                          key={key}
                          onClick={() => { setSelectedDate(d); setActiveTab("hoy"); }}
                          className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600 capitalize">{dateStr}</span>
                            <div className="flex gap-0.5">
                              {Array(e.score).fill(0).map((_, i) => (
                                <span key={i} className="text-xs">⭐</span>
                              ))}
                            </div>
                          </div>
                          {e.lines?.[0] && (
                            <p className="text-xs text-gray-400 mt-1 truncate italic">"{e.lines[0]}"</p>
                          )}
                        </button>
                      );
                    })
                    .filter(Boolean)}
                  {Object.keys(data.entries).filter((k) => k.startsWith(activeProfile + ":") && data.entries[k].score).length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-6">Aún no hay entradas. ¡Empieza hoy! 🚀</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* === RECOMPENSAS === */}
          {activeTab === "recompensas" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="text-5xl font-extrabold text-amber-500">{totalPoints}</div>
                <div className="text-sm text-gray-400 mt-1 font-medium">puntos disponibles</div>
              </div>

              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 text-base">🎁 Premios de {profile.name}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {rewards.map((r) => (
                    <RewardCard key={r.id} reward={r} points={totalPoints} onClaim={claimReward} />
                  ))}
                </div>
              </section>

              <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <h3 className="font-bold text-indigo-700 mb-3 text-base">💡 ¿Cómo ganar puntos?</h3>
                <div className="space-y-2.5 text-sm text-indigo-600">
                  <div className="flex items-center gap-3 bg-white/60 rounded-xl p-2.5">
                    <span className="text-lg">⭐</span>
                    <span>Puntuar tu día = <strong>1-5 pts</strong></span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 rounded-xl p-2.5">
                    <span className="text-lg">✅</span>
                    <span>Cada hábito completado = <strong>+2 pts</strong></span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 rounded-xl p-2.5">
                    <span className="text-lg">🔥</span>
                    <span>¡Mantén tu racha para acumular más!</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* === AJUSTES === */}
          {activeTab === "ajustes" && (
            <div className="space-y-4">
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 text-base">
                  {profile.emoji} Hábitos de {profile.name}
                </h3>
                <HabitManager
                  habits={habits}
                  onUpdate={(updated) => {
                    setData((prev) => ({
                      ...prev,
                      habits: { ...prev.habits, [activeProfile]: updated },
                    }));
                    saveAnimation();
                  }}
                />
              </section>

              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 text-base">🎯 Añadir nuevo premio</h3>
                <AddReward
                  onAdd={(reward) => {
                    setData((prev) => ({
                      ...prev,
                      rewards: {
                        ...prev.rewards,
                        [activeProfile]: [...(prev.rewards[activeProfile] || []), reward],
                      },
                    }));
                    saveAnimation();
                  }}
                />
              </section>

              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 text-base">🗑️ Resetear datos</h3>
                <p className="text-sm text-gray-500 mb-3">Borra todas las entradas y premios de {profile.name}. ¡Cuidado!</p>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Seguro que quieres borrar todos los datos de ${profile.name}?`)) {
                      setData((prev) => {
                        const newEntries = {};
                        Object.keys(prev.entries).forEach((k) => {
                          if (!k.startsWith(activeProfile + ":")) newEntries[k] = prev.entries[k];
                        });
                        return {
                          ...prev,
                          entries: newEntries,
                          rewards: { ...prev.rewards, [activeProfile]: JSON.parse(JSON.stringify(DEFAULT_REWARDS[activeProfile])) },
                          habits: { ...prev.habits, [activeProfile]: JSON.parse(JSON.stringify(DEFAULT_HABITS[activeProfile])) },
                        };
                      });
                      saveAnimation();
                    }
                  }}
                  className="w-full py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-semibold transition-colors border border-red-200"
                >
                  Borrar datos de {profile.name}
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 shadow-lg z-40">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-center transition-all active:scale-95 ${activeTab === tab.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <div className={`text-xl ${activeTab === tab.id ? "scale-110" : ""} transition-transform`}>{tab.emoji}</div>
              <div className={`text-[10px] font-semibold mt-0.5 ${activeTab === tab.id ? "text-indigo-600" : ""}`}>{tab.name}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
