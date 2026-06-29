const STORAGE_KEY = "mi-racha-v1";
const MS_PER_DAY = 86_400_000;

const today = startOfDay(new Date());
let viewedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let state = loadState();

const elements = {
  count: document.querySelector("#day-count"),
  label: document.querySelector("#day-label"),
  message: document.querySelector("#encouragement"),
  start: document.querySelector("#start-date"),
  end: document.querySelector("#end-date"),
  month: document.querySelector("#month-label"),
  grid: document.querySelector("#calendar-grid"),
  add: document.querySelector("#add-day"),
  finish: document.querySelector("#finish-streak"),
  dialog: document.querySelector("#finish-dialog"),
  cancelFinish: document.querySelector("#cancel-finish"),
  confirmFinish: document.querySelector("#confirm-finish"),
};

document.querySelector("#prev-month").addEventListener("click", () => changeMonth(-1));
document.querySelector("#next-month").addEventListener("click", () => changeMonth(1));
elements.add.addEventListener("click", registerDay);
elements.finish.addEventListener("click", () => elements.dialog.showModal());
elements.cancelFinish.addEventListener("click", () => elements.dialog.close());
elements.confirmFinish.addEventListener("click", finishStreak);
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

render();

function registerDay() {
  if (state.finishedAt) return;

  if (!state.startedAt) {
    state.startedAt = dateKey(today);
    state.days = 1;
  } else {
    state.days += 1;
  }

  const latest = addDays(parseDate(state.startedAt), state.days - 1);
  viewedMonth = new Date(latest.getFullYear(), latest.getMonth(), 1);
  saveState();
  render();
  pulseCount();
}

function finishStreak() {
  if (!state.startedAt || state.finishedAt) return;
  state.finishedAt = dateKey(addDays(parseDate(state.startedAt), state.days - 1));
  saveState();
  elements.dialog.close();
  render();
}

function changeMonth(offset) {
  viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + offset, 1);
  renderCalendar();
}

function render() {
  const count = state.days || 0;
  elements.count.textContent = count;
  elements.label.textContent = `${count} ${count === 1 ? "día" : "días"}`;
  elements.start.textContent = state.startedAt ? shortDate(parseDate(state.startedAt)) : "—";
  elements.end.textContent = state.finishedAt ? shortDate(parseDate(state.finishedAt)) : "En curso";
  elements.add.disabled = Boolean(state.finishedAt);
  elements.add.querySelector("span:first-child").textContent = state.finishedAt ? "Racha terminada" : "Registrar un día más";
  elements.finish.disabled = !state.startedAt || Boolean(state.finishedAt);
  elements.message.textContent = messageFor(count, Boolean(state.finishedAt));
  renderCalendar();
}

function renderCalendar() {
  elements.month.textContent = new Intl.DateTimeFormat("es-CR", { month: "long", year: "numeric" }).format(viewedMonth);
  elements.grid.innerHTML = "";

  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - firstWeekday);
  const streakStart = state.startedAt ? parseDate(state.startedAt) : null;
  const streakLast = streakStart ? addDays(streakStart, state.days - 1) : null;

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const cell = document.createElement("span");
    const isCurrentMonth = date.getMonth() === month;
    const isInStreak = streakStart && date >= streakStart && date <= streakLast;
    const classes = ["calendar-day"];

    if (!isCurrentMonth) classes.push("muted");
    if (sameDay(date, today)) classes.push("today");
    if (isInStreak) classes.push("in-streak");
    if (streakStart && sameDay(date, streakStart)) classes.push("start-day");
    if (state.finishedAt && sameDay(date, parseDate(state.finishedAt))) classes.push("end-day");

    cell.className = classes.join(" ");
    cell.textContent = date.getDate();
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", accessibleDate(date, isInStreak));
    elements.grid.appendChild(cell);
  }
}

function loadState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (value && Number.isInteger(value.days) && value.days >= 0) return value;
  } catch (error) {
    console.warn("No fue posible recuperar la racha guardada.", error);
  }
  return { days: 0, startedAt: null, finishedAt: null };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pulseCount() {
  const flame = document.querySelector(".flame");
  flame.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.11)" }, { transform: "scale(1)" }],
    { duration: 380, easing: "ease-out" },
  );
}

function messageFor(count, finished) {
  if (finished) return "Racha completada. Cada día contó.";
  if (count === 0) return "Todo gran hábito empieza con un día.";
  if (count < 7) return "Buen comienzo. Sigue construyendo el hábito.";
  if (count < 30) return "La constancia ya se está notando.";
  return "Esto ya es parte de quién eres.";
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return startOfDay(result);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function shortDate(date) {
  return new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function accessibleDate(date, inStreak) {
  const formatted = new Intl.DateTimeFormat("es-CR", { dateStyle: "full" }).format(date);
  return inStreak ? `${formatted}, día registrado` : formatted;
}
