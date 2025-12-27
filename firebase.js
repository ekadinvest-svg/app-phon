// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAFrQqBAv94X2AgubYnRzithQRx97yL1YU",
  authDomain: "app-phon.firebaseapp.com",
  projectId: "app-phon",
  storageBucket: "app-phon.appspot.com",
  messagingSenderId: "312399079852",
  appId: "1:312399079852:web:f933710203bc72c9e97209",
  measurementId: "G-ME1MTXWTRT"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
