/* اتصال لوحة المسئول بقاعدة Firebase (مستقل عن ملفات الطالب) */
const cfg={apiKey:"AIzaSyCz-c2GPbQ_k9PuOc9SZpKqzL124ZtB1Qc",authDomain:"alaa-41089.firebaseapp.com",databaseURL:"https://alaa-41089-default-rtdb.firebaseio.com",projectId:"alaa-41089"};

firebase.initializeApp(cfg);
const db=firebase.database();
