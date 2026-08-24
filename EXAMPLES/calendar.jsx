import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

// ---------- Helpers ----------
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function buildMonthGrid(year, month) {
  const firstDayOffset = new Date(year, month, 1).getDay(); // 0=Min
  const total = daysInMonth(year, month);
  const prevTotal = daysInMonth(year, month - 1 < 0 ? 11 : month - 1);
  const cells = [];

  for (let i = firstDayOffset - 1; i >= 0; i--) {
    cells.push({ day: prevTotal - i, inMonth: false, offset: -1 });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, inMonth: true, offset: 0 });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - (firstDayOffset + total) + 1, inMonth: false, offset: 1 });
  }
  return cells;
}

function sameDate(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// ---------- Wheel column (iOS-style scroll picker) ----------
function WheelColumn({ values, selectedIndex, onChange, width = 64, renderLabel }) {
  const ITEM_H = 36;
  const VISIBLE = 5; // must be odd
  const PAD = Math.floor(VISIBLE / 2) * ITEM_H;
  const ref = useRef(null);
  const isProgrammatic = useRef(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    isProgrammatic.current = true;
    ref.current.scrollTop = selectedIndex * ITEM_H;
    const t = setTimeout(() => (isProgrammatic.current = false), 50);
    return () => clearTimeout(t);
  }, [selectedIndex, values.length]);

  const handleScroll = () => {
    if (isProgrammatic.current || !ref.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      isProgrammatic.current = true;
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      setTimeout(() => (isProgrammatic.current = false), 200);
      if (clamped !== selectedIndex) onChange(clamped);
    }, 90);
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height: ITEM_H * VISIBLE,
      }}
    >
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="ios-wheel-scroll"
      >
        <div style={{ height: PAD }} />
        {values.map((v, i) => {
          const dist = Math.abs(i - selectedIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.22;
          const scale = dist === 0 ? 1 : dist === 1 ? 0.92 : 0.86;
          return (
            <div
              key={i}
              onClick={() => {
                isProgrammatic.current = true;
                ref.current.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                setTimeout(() => (isProgrammatic.current = false), 200);
                onChange(i);
              }}
              style={{
                height: ITEM_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scrollSnapAlign: "center",
                fontSize: 21,
                fontWeight: dist === 0 ? 600 : 400,
                color: dist === 0 ? "#000" : "#8e8e93",
                opacity,
                transform: `scale(${scale})`,
                transition: "opacity 0.15s, transform 0.15s, font-weight 0.15s",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {renderLabel ? renderLabel(v) : v}
            </div>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
      {/* selection highlight band */}
      <div
        style={{
          position: "absolute",
          top: PAD,
          left: 0,
          right: 0,
          height: ITEM_H,
          background: "rgba(118,118,128,0.12)",
          borderRadius: 9,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ---------- Main component ----------
export default function IOSDateTimePicker() {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now);
  const [hour, setHour] = useState(now.getHours() % 12 === 0 ? 12 : now.getHours() % 12);
  const [minute, setMinute] = useState(now.getMinutes());
  const [ampm, setAmpm] = useState(now.getHours() >= 12 ? "PM" : "AM");
  const [tab, setTab] = useState("date"); // "date" | "time"
  const [confirmed, setConfirmed] = useState(null);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const pickDay = (cell) => {
    let y = viewYear;
    let m = viewMonth;
    if (cell.offset === -1) {
      m -= 1;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
    } else if (cell.offset === 1) {
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    } else {
      setViewMonth(m);
      setViewYear(y);
    }
    const d = new Date(y, m, cell.day);
    setSelectedDate(d);
    if (cell.offset !== 0) {
      setViewYear(y);
      setViewMonth(m);
    }
  };

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes60 = Array.from({ length: 60 }, (_, i) => i);
  const ampmList = ["AM", "PM"];

  const finalDateTime = useMemo(() => {
    let h24 = hour % 12;
    if (ampm === "PM") h24 += 12;
    const d = new Date(selectedDate);
    d.setHours(h24, minute, 0, 0);
    return d;
  }, [selectedDate, hour, minute, ampm]);

  const formattedSummary = `${DAY_NAMES[finalDateTime.getDay()]}, ${finalDateTime.getDate()} ${
    MONTH_NAMES[finalDateTime.getMonth()]
  } ${finalDateTime.getFullYear()} · ${pad(hour)}:${pad(minute)} ${ampm}`;

  const today = new Date();

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
        maxWidth: 360,
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <style>{`
        .ios-wheel-scroll::-webkit-scrollbar { display: none; }
        .ios-tab-btn { transition: background 0.2s, color 0.2s; }
        .ios-day-cell { transition: transform 0.12s; }
        .ios-day-cell:active { transform: scale(0.9); }
      `}</style>

      {/* Header summary */}
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid rgba(60,60,67,0.1)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#8e8e93", letterSpacing: 0.4, textTransform: "uppercase" }}>
          Tanggal &amp; Waktu
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#000", marginTop: 4 }}>
          {formattedSummary}
        </div>
      </div>

      {/* Segmented control */}
      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            display: "flex",
            background: "#e9e9eb",
            borderRadius: 9,
            padding: 2,
            gap: 2,
          }}
        >
          {[
            { key: "date", label: "Tanggal" },
            { key: "time", label: "Waktu" },
          ].map((t) => (
            <button
              key={t.key}
              className="ios-tab-btn"
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                border: "none",
                cursor: "pointer",
                padding: "7px 0",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                background: tab === t.key ? "#ffffff" : "transparent",
                color: tab === t.key ? "#000" : "#6e6e73",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* DATE TAB */}
      {tab === "date" && (
        <div style={{ padding: "16px 18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button
              onClick={goPrevMonth}
              aria-label="Bulan sebelumnya"
              style={navBtnStyle}
            >
              ‹
            </button>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#000" }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              onClick={goNextMonth}
              aria-label="Bulan berikutnya"
              style={navBtnStyle}
            >
              ›
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8e8e93",
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 2 }}>
            {grid.map((cell, i) => {
              let cellDate;
              if (cell.offset === 0) cellDate = new Date(viewYear, viewMonth, cell.day);
              else if (cell.offset === -1)
                cellDate = new Date(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1, cell.day);
              else cellDate = new Date(viewMonth === 11 ? viewYear + 1 : viewYear, viewMonth === 11 ? 0 : viewMonth + 1, cell.day);

              const isSelected = sameDate(cellDate, selectedDate);
              const isToday = sameDate(cellDate, today);

              return (
                <div
                  key={i}
                  className="ios-day-cell"
                  onClick={() => pickDay(cell)}
                  style={{
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? "#007aff" : "transparent",
                      color: isSelected
                        ? "#fff"
                        : !cell.inMonth
                        ? "#c7c7cc"
                        : isToday
                        ? "#007aff"
                        : "#000",
                    }}
                  >
                    {cell.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TIME TAB */}
      {tab === "time" && (
        <div
          style={{
            padding: "20px 18px 24px",
            display: "flex",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <WheelColumn
            values={hours12}
            selectedIndex={hour - 1}
            onChange={(i) => setHour(hours12[i])}
            width={56}
          />
          <div style={{ display: "flex", alignItems: "center", fontSize: 21, fontWeight: 600, color: "#000" }}>:</div>
          <WheelColumn
            values={minutes60}
            selectedIndex={minute}
            onChange={(i) => setMinute(minutes60[i])}
            width={56}
            renderLabel={(v) => pad(v)}
          />
          <div style={{ width: 12 }} />
          <WheelColumn
            values={ampmList}
            selectedIndex={ampmList.indexOf(ampm)}
            onChange={(i) => setAmpm(ampmList[i])}
            width={64}
          />
        </div>
      )}

      {/* Footer actions */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid rgba(60,60,67,0.1)",
        }}
      >
        <button
          onClick={() => {
            const n = new Date();
            setSelectedDate(n);
            setViewYear(n.getFullYear());
            setViewMonth(n.getMonth());
            setHour(n.getHours() % 12 === 0 ? 12 : n.getHours() % 12);
            setMinute(n.getMinutes());
            setAmpm(n.getHours() >= 12 ? "PM" : "AM");
          }}
          style={footerBtnStyle("left")}
        >
          Sekarang
        </button>
        <div style={{ width: 1, background: "rgba(60,60,67,0.1)" }} />
        <button
          onClick={() => setConfirmed(finalDateTime)}
          style={footerBtnStyle("right", true)}
        >
          Selesai
        </button>
      </div>

      {confirmed && (
        <div
          style={{
            padding: "12px 20px 16px",
            fontSize: 12,
            color: "#34c759",
            fontWeight: 600,
            textAlign: "center",
            background: "#f2f2f7",
          }}
        >
          Dipilih: {DAY_NAMES[confirmed.getDay()]}, {confirmed.getDate()} {MONTH_NAMES[confirmed.getMonth()]}{" "}
          {confirmed.getFullYear()} · {pad(hour)}:{pad(minute)} {ampm}
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  border: "none",
  background: "transparent",
  color: "#007aff",
  fontSize: 22,
  fontWeight: 500,
  cursor: "pointer",
  width: 30,
  height: 30,
  lineHeight: "30px",
};

function footerBtnStyle(side, primary) {
  return {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "14px 0",
    fontSize: 16,
    fontWeight: primary ? 600 : 400,
    color: "#007aff",
    cursor: "pointer",
  };
}