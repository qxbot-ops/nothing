importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDaf9dAdFadmaHDfG-JXoYRvG90xM-ERVg",
  authDomain: "blackchat-c676c.firebaseapp.com",
  projectId: "blackchat-c676c",
  storageBucket: "blackchat-c676c.firebasestorage.app",
  messagingSenderId: "653825711440",
  appId: "1:653825711440:web:955800452cc4505b572055"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Call notification check karo
  if (payload.data?.type === 'call') {
    const callerName = payload.data.callerName || 'Unknown';
    const chatId = payload.data.chatId;
    
    const notificationTitle = `${callerName} is calling...`;
    const notificationOptions = {
      body: 'Tap to answer',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'call-' + chatId, // ek hi call ka ek notification
      requireInteraction: true, // user hataye tab tak rahe
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      sound: '/ringtone.mp3', // public folder me ringtone.mp3 daal de
      data: {
        type: 'call',
        chatId: chatId,
        callerName: callerName
      },
      actions: [
        { action: 'accept', title: 'Accept', icon: '/accept-icon.png' },
        { action: 'reject', title: 'Reject', icon: '/reject-icon.png' }
      ]
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
    return;
  }
  
  // Normal message notification
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data,
    tag: payload.data?.chatId || 'chat',
    renotify: true
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification pe click handle karo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  
  if (data?.type === 'call') {
    // Call notification pe click
    if (event.action === 'accept') {
      // Accept button dabaya
      event.waitUntil(
        clients.openWindow(`/?chat=${data.chatId}&acceptCall=true`)
      );
    } else if (event.action === 'reject') {
      // Reject button - kuch nahi karna
      return;
    } else {
      // Notification body pe click - app khol ke call screen dikhao
      event.waitUntil(
        clients.openWindow(`/?chat=${data.chatId}&incomingCall=true`)
      );
    }
  } else {
    // Normal message - chat khol do
    const chatId = data?.chatId;
    const urlToOpen = chatId ? `/?chat=${chatId}` : '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});