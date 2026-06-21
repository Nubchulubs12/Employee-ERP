import { useState } from "react";
import "../App.css";

function getStartOfWeek(date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeekLabel(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} - ${weekEnd.toLocaleDateString("en-US", opts)}`;
}

function getWeekDays(weekStart) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
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

function getEntryDateKey(entry) {
  if (entry.clockInTime && entry.clockInTime.includes("T")) {
    return formatDateKey(new Date(entry.clockInTime));
  }
  return entry.workDate;
}

function formatDisplayTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function calcHours(entry) {
  if (entry.isPto) {
    return Number(entry.ptoHours || 0);
  }

  if (!entry.clockInTime || !entry.clockOutTime) return 0;

  const diff = new Date(entry.clockOutTime) - new Date(entry.clockInTime);
  return diff > 0 ? diff / 3600000 : 0;
}

function getClockOutDateKey(entry) {
  if (entry.clockOutTime && entry.clockOutTime.includes("T")) {
    return formatDateKey(new Date(entry.clockOutTime));
  }
  return getEntryDateKey(entry);
}

function getMidnightDateTime(dateKey, time) {
  return `${dateKey}T${time}`;
}

function splitOvernightEntries(entries) {
  const occupiedRowsByDay = new Map();
  const segments = [];

  function getNextSharedRow(dateKeys) {
    let rowIndex = 0;

    while (
      dateKeys.some((dateKey) => occupiedRowsByDay.get(dateKey)?.has(rowIndex))
    ) {
      rowIndex += 1;
    }

    for (const dateKey of dateKeys) {
      if (!occupiedRowsByDay.has(dateKey)) {
        occupiedRowsByDay.set(dateKey, new Set());
      }

      occupiedRowsByDay.get(dateKey).add(rowIndex);
    }

    return rowIndex;
  }

  for (const entry of entries.slice().sort((a, b) => getEntryStartTime(a) - getEntryStartTime(b))) {
    if (entry.isPto || !entry.clockInTime || !entry.clockOutTime) {
      const dateKey = getEntryDateKey(entry);
      const rowIndex = getNextSharedRow([dateKey]);
      segments.push({ ...entry, _segmentDateKey: dateKey, _rowIndex: rowIndex });
      continue;
    }

    const inKey = getEntryDateKey(entry);
    const outKey = getClockOutDateKey(entry);

    if (inKey === outKey) {
      const rowIndex = getNextSharedRow([inKey]);
      segments.push({ ...entry, _segmentDateKey: inKey, _rowIndex: rowIndex });
      continue;
    }

    const rowIndex = getNextSharedRow([inKey, outKey]);

    segments.push({
      ...entry,
      _displayId: `${entry.id}_start`,
      _sourceEntry: entry,
      _sourceId: entry.id,
      clockOutTime: getMidnightDateTime(inKey, "23:59:59"),
      _segmentDateKey: inKey,
      _rowIndex: rowIndex,
      _isSplit: true,
      _splitType: "start",
    });
    segments.push({
      ...entry,
      _displayId: `${entry.id}_end`,
      _sourceEntry: entry,
      _sourceId: entry.id,
      clockInTime: getMidnightDateTime(outKey, "00:00:00"),
      _segmentDateKey: outKey,
      _rowIndex: rowIndex,
      _isSplit: true,
      _splitType: "end",
    });
  }

  return segments;
}

function getEntryStartTime(entry) {
  if (!entry.clockInTime) return 0;
  const date = new Date(entry.clockInTime);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getEntryLabel(entry) {
  if (entry._splitType === "start") {
    return (
      <>
        <span>{formatDisplayTime(entry.clockInTime)}</span>
        <span className="mini-grid-sep">-&gt;</span>
      </>
    );
  }

  if (entry._splitType === "end") {
    return (
      <>
        <span className="mini-grid-sep">Clock Out</span>
        <span>{formatDisplayTime(entry.clockOutTime)}</span>
      </>
    );
  }

  return (
    <>
      <span>{formatDisplayTime(entry.clockInTime)}</span>
      <span className="mini-grid-sep">-&gt;</span>
      <span>
        {entry.clockOutTime ? (
          formatDisplayTime(entry.clockOutTime)
        ) : (
          <em>Still In</em>
        )}
      </span>
    </>
  );
}

function buildPtoEntries(ptoRequests = []) {
  return ptoRequests
    .filter((request) => request.status === "APPROVED")
    .flatMap((request) => {
      const start = new Date(`${request.startDate}T00:00:00`);
      const end = new Date(`${request.endDate}T00:00:00`);

      const totalDays =
        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const hoursPerDay = Number(request.hoursRequested || 0) / totalDays;
      const entries = [];
      const current = new Date(start);

      while (current <= end) {
        const dateStr = formatDateKey(current);

        entries.push({
          id: `pto-${request.id}-${dateStr}`,
          workDate: dateStr,
          clockInTime: `${dateStr}T00:00:00`,
          clockOutTime: `${dateStr}T00:00:00`,
          ptoHours: hoursPerDay,
          isPto: true,
        });

        current.setDate(current.getDate() + 1);
      }

      return entries;
    });
}

export default function MiniTimeGrid({
  timeEntries = [],
  ptoRequests = [],
  onEdit,
  onDelete,
  onAdd,
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = getStartOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekDays = getWeekDays(weekStart);
  const isCurrentWeek = weekOffset === 0;
  const weekDateKeys = new Set(weekDays.map((d) => d.dateKey));
  const allEntries = [...timeEntries, ...buildPtoEntries(ptoRequests)];

  const weekSourceEntries = allEntries.filter((entry) => {
    const inKey = getEntryDateKey(entry);
    const outKey = entry.isPto ? inKey : getClockOutDateKey(entry);

    return weekDateKeys.has(inKey) || weekDateKeys.has(outKey);
  });
  const weekEntries = splitOvernightEntries(weekSourceEntries);

  const weeklyTotal = weekEntries
    .reduce((sum, entry) => sum + calcHours(entry), 0)
    .toFixed(2);

  const navBtnStyle = {
    background: "none",
    border: "none",
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#000",
    cursor: "pointer",
    padding: "0 6px",
    userSelect: "none",
  };

  return (
    <div className="mini-time-grid">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "6px 0",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: 8,
        }}
      >
        <button style={navBtnStyle} onClick={() => setWeekOffset((o) => o - 1)}>
          &lsaquo;
        </button>

        <span style={{ fontWeight: 600, fontSize: "0.9rem", minWidth: 220, textAlign: "center" }}>
          {isCurrentWeek ? "Current Week" : formatWeekLabel(weekStart)}
        </span>

        <button style={navBtnStyle} onClick={() => setWeekOffset((o) => o + 1)}>
          &rsaquo;
        </button>

        {!isCurrentWeek && (
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              border: "1px solid #bbb",
              borderRadius: 4,
              cursor: "pointer",
              background: "none",
              color: "#000",
            }}
          >
            Today
          </button>
        )}
      </div>

      <div className="mini-grid-days">
        {weekDays.map((day) => {
          const dayEntries = weekEntries.filter((entry) => entry._segmentDateKey === day.dateKey);
          const entryRows = Array.from(
            { length: Math.max(0, ...dayEntries.map((entry) => entry._rowIndex)) + 1 },
            (_, index) => index
          );
          const showAddButton = Boolean(onAdd);

          return (
            <div key={day.dateKey} className="mini-grid-day">
              <div className={`mini-grid-day-header${day.isToday ? " mini-grid-today" : ""}`}>
                {day.label}
              </div>

              <div className="mini-grid-day-body">
                {dayEntries.length === 0 ? (
                  <div className="mini-grid-empty">
                    {showAddButton ? (
                      <button
                        type="button"
                        className="mini-btn mini-btn-add"
                        onClick={() => onAdd(day.dateKey)}
                      >
                        Add
                      </button>
                    ) : (
                      "-"
                    )}
                  </div>
                ) : (
                  <>
                    {entryRows.map((rowIndex) => {
                      const entry = dayEntries.find((item) => item._rowIndex === rowIndex);

                      if (!entry) {
                        return (
                          <div
                            key={`${day.dateKey}-row-${rowIndex}`}
                            className="mini-grid-row-slot mini-grid-row-slot--empty"
                          />
                        );
                      }

                      const hrs = calcHours(entry).toFixed(2);

                      return (
                        <div className="mini-grid-row-slot" key={entry._displayId || entry.id}>
                          <div
                            className={`mini-grid-entry${entry.isPto ? " mini-grid-entry--pto" : ""}${entry._isSplit ? " mini-grid-entry--split" : ""}${entry._splitType ? ` mini-grid-entry--split-${entry._splitType}` : ""}`}
                          >
                            {entry.isPto ? (
                              <>
                                <div className="mini-grid-entry-times">
                                  <strong>PTO</strong>
                                </div>
                                <div className="mini-grid-entry-hrs">{hrs} hrs</div>
                              </>
                            ) : (
                              <>
                                <div className="mini-grid-entry-times">
                                  {getEntryLabel(entry)}
                                </div>

                                {entry.clockOutTime && (
                                  <div className="mini-grid-entry-hrs">{hrs} hrs</div>
                                )}

                                {entry.clockOutTime && (
                                  <div className="mini-grid-entry-actions">
                                    <button
                                      type="button"
                                      className="mini-btn mini-btn-edit"
                                      onClick={() => onEdit(entry._sourceEntry || entry)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="mini-btn mini-btn-delete"
                                      onClick={() => onDelete(entry._sourceId || entry.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {showAddButton && (
                      <button
                        type="button"
                        className="mini-btn mini-btn-add mini-btn-add-inline"
                        onClick={() => onAdd(day.dateKey)}
                      >
                        Add
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "8px 12px",
          borderTop: "2px solid #e0e0e0",
          fontWeight: 600,
          fontSize: "0.9rem",
          marginTop: 8,
        }}
      >
        Week Total &nbsp; {weeklyTotal} hrs
      </div>
    </div>
  );
}
