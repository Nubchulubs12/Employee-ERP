import { useState } from "react";
import "../App.css";

const HOUR_HEIGHT = 32;
const START_HOUR = 0;
const END_HOUR = 24;

function getStartOfWeek(date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeekLabel(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} – ${weekEnd.toLocaleDateString("en-US", opts)}`;
}

function getWeekDays(weekStart) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return {
      dateKey: formatDateKey(day),
      label: day.toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
      isToday: formatDateKey(day) === formatDateKey(today),
    };
  });
}

function timeToMinutes(timeString) {
  if (!timeString) return null;
  const timeOnly = timeString.includes("T")
    ? timeString.split("T")[1]
    : timeString;
  const [hours, minutes, seconds] = timeOnly.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes + (seconds || 0) / 60;
}

function formatTime(timeString) {
  if (!timeString) return "";
  const timeOnly = timeString.includes("T")
    ? timeString.split("T")[1]
    : timeString;
  const [hourRaw, minuteRaw] = timeOnly.split(":");
  const hour = Number(hourRaw);
  const minute = String(minuteRaw || "00").padStart(2, "0");
  if (Number.isNaN(hour)) return "";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${suffix}`;
}

function calculateHours(clockInTime, clockOutTime) {
  if (!clockInTime || !clockOutTime) return 0;

  if (clockInTime.includes("T") && clockOutTime.includes("T")) {
    const diffMs = new Date(clockOutTime) - new Date(clockInTime);
    if (diffMs <= 0) return 0;
    return diffMs / 1000 / 60 / 60;
  }

  const start = timeToMinutes(clockInTime);
  const end = timeToMinutes(clockOutTime);
  if (start === null || end === null || end <= start) return 0;
  return (end - start) / 60;
}

function getEntryStyle(entry) {
  if (!entry.clockInTime || !entry.clockOutTime) {
    return { display: "none" };
  }
  const startMinutes = timeToMinutes(entry.clockInTime);
  const endMinutes = timeToMinutes(entry.clockOutTime);
  const gridStartMinutes = START_HOUR * 60;
  const gridEndMinutes = END_HOUR * 60;
  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes ||
    endMinutes < gridStartMinutes ||
    startMinutes > gridEndMinutes
  ) {
    return { display: "none" };
  }
  const visibleStart = Math.max(startMinutes, gridStartMinutes);
  const visibleEnd = Math.min(endMinutes, gridEndMinutes);
  const top = ((visibleStart - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT;
  return {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
  };
}

function getEntryDateKey(entry) {
  if (entry.clockInTime && entry.clockInTime.includes("T")) {
    const date = new Date(entry.clockInTime);
    return formatDateKey(date);
  }
  return entry.workDate;
}

function getDisplayEntries(timeEntries) {
  const segments = [];
  for (const entry of timeEntries) {
    if (!entry.clockInTime || !entry.clockOutTime) {
      segments.push({ ...entry, _segmentDateKey: getEntryDateKey(entry) });
      continue;
    }
    const inKey = getEntryDateKey(entry);
    let outKey;
    if (entry.clockOutTime.includes("T")) {
      outKey = formatDateKey(new Date(entry.clockOutTime));
    } else {
      outKey = entry.workDate;
    }
    if (inKey === outKey) {
      segments.push({ ...entry, _segmentDateKey: inKey });
    } else {
      const midnightOut = entry.clockInTime.includes("T")
        ? entry.clockInTime.split("T")[0] + "T23:59:59"
        : "23:59:59";
      segments.push({
        ...entry,
        id: `${entry.id}_seg1`,
        clockOutTime: midnightOut,
        _segmentDateKey: inKey,
        _isSplit: true,
        _splitType: "start",
      });
      const midnightIn = entry.clockOutTime.includes("T")
        ? entry.clockOutTime.split("T")[0] + "T00:00:00"
        : "00:00:00";
      segments.push({
        ...entry,
        id: `${entry.id}_seg2`,
        clockInTime: midnightIn,
        _segmentDateKey: outKey,
        _isSplit: true,
        _splitType: "end",
      });
    }
  }
  return segments;
}

function getDailyTotal(entries, dateKey) {
  const total = entries
    .filter((entry) => {
      const key = entry._segmentDateKey ?? getEntryDateKey(entry);
      return key === dateKey && entry.clockOutTime;
    })
    .reduce((sum, entry) => {
      return sum + calculateHours(entry.clockInTime, entry.clockOutTime);
    }, 0);
  return total.toFixed(2);
}

export default function TimeSheetGrid({ timeEntries = [] }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = getStartOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekDays = getWeekDays(weekStart);
  const totalGridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const weekDateKeys = new Set(weekDays.map((d) => d.dateKey));
  const weekEntries = timeEntries.filter((entry) => {
    const inKey = getEntryDateKey(entry);
    let outKey = inKey;
    if (entry.clockOutTime && entry.clockOutTime.includes("T")) {
      outKey = formatDateKey(new Date(entry.clockOutTime));
    }
    return weekDateKeys.has(inKey) || weekDateKeys.has(outKey);
  });

  const displayEntries = getDisplayEntries(weekEntries);


  const weeklyTotal = displayEntries
    .filter((entry) => entry.clockInTime && entry.clockOutTime)
    .reduce((sum, entry) => sum + calculateHours(entry.clockInTime, entry.clockOutTime), 0)
    .toFixed(2);

  const isCurrentWeek = weekOffset === 0;

  const navBtnStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#000",
    cursor: "pointer",
    lineHeight: 1,
    padding: "0 6px",
    userSelect: "none",
  };

  return (
    <div className="timesheet-wrapper">
      <div className="timesheet-grid">

        <div
          className="timesheet-time-column"
          style={{ visibility: "hidden", pointerEvents: "none", flexShrink: 0 }}
        >
          <div className="timesheet-header-cell" />
        </div>


        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "6px 0",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <button
            style={navBtnStyle}
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
          >
            ‹
          </button>

          <span style={{ fontWeight: 600, fontSize: "0.95rem", minWidth: "210px", textAlign: "center" }}>
            {isCurrentWeek ? "Current Week" : formatWeekLabel(weekStart)}
          </span>

          <button
            style={navBtnStyle}
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
          >
            ›
          </button>

          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                fontSize: "0.78rem",
                padding: "2px 10px",
                border: "1px solid #bbb",
                borderRadius: "4px",
                cursor: "pointer",
                background: "none",
                color: "#000",
              }}
            >
              Today
            </button>
          )}
        </div>
      </div>

      <div className="timesheet-grid">
        <div className="timesheet-time-column">
          <div className="timesheet-header-cell">Time</div>

          {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => {
            const hour = START_HOUR + index;
            return (
              <div
                key={hour}
                className="timesheet-time-label"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {formatHourLabel(hour)}
              </div>
            );
          })}

          <div className="timesheet-total-label">Total</div>
        </div>

        <div className="timesheet-days">
          {weekDays.map((day) => {
            const dayEntries = displayEntries.filter(
              (entry) => entry._segmentDateKey === day.dateKey
            );

            return (
              <div key={day.dateKey} className="timesheet-day-column">
                <div
                  className={`timesheet-day-header ${
                    day.isToday ? "today-header" : ""
                  }`}
                >
                  {day.label}
                </div>

                <div
                  className="timesheet-day-body"
                  style={{ height: `${totalGridHeight}px` }}
                >
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
                    <div
                      key={index}
                      className="timesheet-hour-row"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {dayEntries.map((entry) => {
                    const hoursWorked = calculateHours(
                      entry.clockInTime,
                      entry.clockOutTime
                    );

                    return (
                      <div
                        key={entry.id}
                        className={`timesheet-entry${
                          entry._isSplit ? " timesheet-entry--split" : ""
                        }`}
                        style={getEntryStyle(entry)}
                      >
                        <div className="timesheet-entry-time">
                          {entry._splitType === "start"
                            ? `${formatTime(entry.clockInTime)} – –`
                            : entry._splitType === "end"
                            ? `– – ${formatTime(entry.clockOutTime)}`
                            : `${formatTime(entry.clockInTime)} – ${
                                entry.clockOutTime
                                  ? formatTime(entry.clockOutTime)
                                  : "Still in"
                              }`}
                        </div>

                        {entry.clockOutTime && (
                          <div className="timesheet-entry-hours">
                            {hoursWorked.toFixed(2)} hrs
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="timesheet-day-total">
                  {getDailyTotal(displayEntries, day.dateKey)} hrs
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="timesheet-weekly-total">
        <span className="timesheet-weekly-total-label">Week Total</span>
        <span className="timesheet-weekly-total-hours">{weeklyTotal} hrs</span>
      </div>
    </div>
  );
}