import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

const db = getDatabase(initializeApp(firebaseConfig));

document.getElementById('menu-btn').onclick = () => document.getElementById('navbar').classList.toggle('hidden');
document.getElementById('btn-join').onclick = () => window.location.href = "https://discord.gg/9VC5UFewb4";

window.loadPage = (page) => {
    document.getElementById('navbar').classList.add('hidden');
    const content = document.getElementById('content');
    
    if(page === 'admin') {
        Swal.fire({ title: 'Admin Login', input: 'password' }).then(res => {
            if(res.value === 'JayakartaRPID#2026') {
                content.innerHTML = `<h2>Dashboard Admin</h2><input id="key" placeholder="Path (ex: pejabat/RI-1)"> <input id="val" placeholder="URL Foto"> <button onclick="saveData()">Simpan</button>`;
            }
        });
    } else {
        onValue(ref(db, page), (snapshot) => {
            content.innerHTML = `<h2>${page.toUpperCase()}</h2><p>${JSON.stringify(snapshot.val() || 'Data kosong')}</p>`;
        });
    }
};

window.saveData = () => {
    const key = document.getElementById('key').value;
    const val = document.getElementById('val').value;
    update(ref(db), {[key]: val}).then(() => Swal.fire('Berhasil', 'Data diperbarui', 'success'));
};

