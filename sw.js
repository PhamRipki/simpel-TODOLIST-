/* Service Worker (sw.js)
   Minimal scaffolding for Push API integration.
   This file listens for 'push' events and shows a notification.
   To use Push, you must subscribe on the client and send the
   subscription to your server which will call the push service
   (requires VAPID keys and a server-side sender).
*/

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Pengingat",
      body: event.data
        ? event.data.text()
        : "Ada tugas yang perlu diperhatikan",
    };
  }
  const title = data.title || "Pengingat tugas";
  const options = {
    body: data.body || "Cek aplikasi To-Do Anda.",
    tag: data.tag || "todo-reminder",
    data: data.url || "/",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
