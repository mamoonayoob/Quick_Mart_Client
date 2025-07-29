// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.

// Import Firebase scripts
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object

// Since service workers can't access environment variables directly,
// we'll use the same fallback values as in the config.js file
firebase.initializeApp({
  apiKey: "AIzaSyCg7GDC-VtTDamuN8srAij2-6SrfJb46r8",
  authDomain: "quik-mart-67f95.firebaseapp.com",
  projectId: "quik-mart-67f95",
  storageBucket: "quik-mart-67f95.firebasestorage.app",
  messagingSenderId: "195567052068",
  appId: "1:195567052068:web:d049df3f3b336034147fb1"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
    // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  // Display the notification
  /* eslint-disable-next-line no-restricted-globals */
  self.registration.showNotification(notificationTitle, notificationOptions);
});
