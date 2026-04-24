import "../App.css";

const HOUR_HEIGHT = 32;
const START_HOUR = 1;
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

function getCurrentWeekDays() {
  const today = new Date();
  const sunday = getStartOfWeek(today);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + index);

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

function getDailyTotal(entries, dateKey) {
  const total = entries
    .filter((entry) => getEntryDateKey(entry) === dateKey && entry.clockOutTime)
    .reduce((sum, entry) => {
      return sum + calculateHours(entry.clockInTime, entry.clockOutTime);
    }, 0);

  return total.toFixed(2);
}
function getEntryDateKey(entry) {
  if (entry.clockInTime && entry.clockInTime.includes("T")) {
    const date = new Date(entry.clockInTime);
    return formatDateKey(date);
  }

  return entry.workDate;
}

export default function TimeSheetGrid({ timeEntries = [] }) {
  const weekDays = getCurrentWeekDays();
  const totalGridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="timesheet-wrapper">
      <div className="timesheet-title">
        Current Week
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
           const dayEntries = timeEntries.filter(
             (entry) => getEntryDateKey(entry) === day.dateKey
           );

            return (
              <div key={day.dateKey} className="timesheet-day-column">
                <div className={`timesheet-day-header ${day.isToday ? "today-header" : ""}`}>
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
                        className="timesheet-entry"
                        style={getEntryStyle(entry)}
                      >
                        <div className="timesheet-entry-time">
                          {formatTime(entry.clockInTime)} -{" "}
                          {entry.clockOutTime
                            ? formatTime(entry.clockOutTime)
                            : "Still in"}
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
                  {getDailyTotal(timeEntries, day.dateKey)} hrs
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}