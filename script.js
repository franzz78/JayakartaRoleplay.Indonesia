// ==========================================================================
// CENTRAL DATABASE CONFIGURATION ENGINE (FIREBASE CONNECTION)
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
let statusSesiAdmin = false;

// DISCORD SERVERS GATEWAY WEBHOOK
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1525025200029302885/NoIIw47bdySktKIpjP3_bYdtfBYje5jWkt40oHx2DenP8HOeuJ9PS_SwZvFZFKZmuJlK";

// ==========================================================================
// GOVERNMENT ANNOUNCEMENT & DISCORD EMBED SYSTEM MODULE
// ==========================================================================

// 1. Sinkronisasi Data Pengumuman Realtime dari Firebase (Client & Admin)
db.ref('gov_announcements').on('value', (snapshot) => {
    const containerUser = document.getElementById('ctx-gov-announce');
    const containerAdmin = document.getElementById('adm-list-gov');
    
    if (containerUser) containerUser.innerHTML = "";
    if (containerAdmin) containerAdmin.innerHTML = "";
    
    if (!snapshot.exists()) {
        if (containerUser) containerUser.innerHTML = `<div class="premium-card" style="text-align:center;color:var(--text-dark-muted);">Belum ada maklumat atau pengumuman pemerintah resmi yang dikeluarkan saat ini.</div>`;
        return;
    }

    let listPengumuman = [];
    snapshot.forEach((child) => {
        listPengumuman.push({ id: child.key, ...child.val() });
    });

    // Urutkan Pengumuman Terbaru di Paling Atas
    listPengumuman.sort((a, b) => b.timestamp - a.timestamp);

    listPengumuman.forEach((data) => {
        let classGayaTeks = data.style === 'code' ? 'msg-code' : 'msg-tebal';

        // Render Sisi Pengunjung Publik
        if (containerUser) {
            containerUser.innerHTML += `
                <div class="embed-gov-card">
                    <span class="embed-role-tag"><i class="fa-solid fa-at"></i> ${escapeHTML(data.role)}</span>
                    <div class="embed-title-gov">Announcement Government</div>
                    <div class="${classGayaTeks}">${escapeHTML(data.text)}</div>
                    <div class="embed-footer-gov">@[ID] Jayakarta Roleplay, Indonesia - 2026</div>
                </div>
            `;
        }

        // Render Sisi Manajemen Panel Kendali Admin
        if (containerAdmin && statusSesiAdmin) {
            containerAdmin.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05); margin-bottom:6px;">
                    <div style="max-width:80%;">
                        <strong style="color:var(--accent-gold); font-size:12px;">Tag: ${escapeHTML(data.role)}</strong><br>
                        <small style="color:var(--text-white); font-size:13px; display:block; margin-top:2px;">${escapeHTML(data.text.substring(0, 60))}...</small>
                    </div>
                    <button class="btn-danger-action" onclick="hapusGovAnnouncement('${data.id}')">Hapus</button>
                </div>
            `;
        }
    });
});

// 2. Fungsi Transmit Eksekusi Gabungan (Push Database + Kirim Embed Webhook Discord)
function addGovAnnouncement() {
    if (!statusSesiAdmin) return;

    const roleInput = document.getElementById('adm-gov-role').value.trim() || "@Everyone";
    const styleInput = document.getElementById('adm-gov-style').value;
    const textInput = document.getElementById('adm-gov-text').value.trim();

    if (!textInput) {
        return Swal.fire("Eror Transmisi", "Kolom isi pengumuman teks wajib dilengkapi!", "error");
    }

    // Rekayasa Struktur Gaya Teks Khusus Discord Embed Layout
    let formattedTextForDiscord = textInput;
    if (styleInput === 'code') {
        formattedTextForDiscord = "```text\n" + textInput + "\n```";
    } else {
        formattedTextForDiscord = "**" + textInput + "**";
    }

    // JSON Payload Struktur Data Discord Embed Resmi (Kode Warna Kuning Desimal: 15381256)
    const payloadDiscord = {
        "content": roleInput,
        "embeds": [
            {
                "title": "Announcement Government",
                "description": formattedTextForDiscord,
                "color": 15381256,
                "footer": {
                    "text": "@[ID] Jayakarta Roleplay, Indonesia - 2026"
                },
                "timestamp": new Date().toISOString()
            }
        ]
    };

    // Eksekusi API Webhook Discord
    fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDiscord)
    })
    .then(() => {
        // Simpan Log ke Firebase Realtime Database Utama
        return db.ref('gov_announcements').push({
            role: roleInput,
            style: styleInput,
            text: textInput,
            timestamp: Date.now()
        });
    })
    .then(() => {
        Swal.fire("Berhasil", "Embed Announcement sukses disiarkan ke Web & Discord!", "success");
        document.getElementById('adm-gov-text').value = "";
        document.getElementById('adm-gov-role').value = "";
    })
    .catch(err => {
        Swal.fire("Gagal Sistem", "Gagal memproses data: " + err.message, "error");
    });
}

// 3. Fungsi Hapus Baris Berita Dari Server Utama
function hapusGovAnnouncement(idKey) {
    Swal.fire({
        title: "Konfirmasi Likuidasi?",
        text: "Data pengumuman ini akan dihapus permanen dari server website utama!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Ya, Hapus Data!"
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref(`gov_announcements/${idKey}`).remove().then(() => {
                Swal.fire("Sukses", "Data log berhasil dieksekusi keluar.", "success");
            });
        }
    });
}

// ==========================================================================
// CORE LAYOUT COMPLEMENTARY MODULE DATA HANDLERS
// ==========================================================================

db.ref('text_data').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    if(document.getElementById('ctx-profile-comm')) document.getElementById('ctx-profile-comm').innerHTML = data.profile_comm || "Belum terkonfigurasi.";
    if(document.getElementById('ctx-sejarah')) document.getElementById('ctx-sejarah').innerHTML = data.sejarah || "Belum terkonfigurasi.";
    
    if(document.getElementById('adm-prof-comm') && !document.getElementById('adm-prof-comm').value) document.getElementById('adm-prof-comm').value = data.profile_comm || "";
    if(document.getElementById('adm-sejarah') && !document.getElementById('adm-sejarah').value) document.getElementById('adm-sejarah').value = data.sejarah || "";
});

function updateTextData() {
    if(!statusSesiAdmin) return;
    db.ref('text_data').set({
        profile_comm: document.getElementById('adm-prof-comm').value,
        sejarah: document.getElementById('adm-sejarah').value
    }).then(() => Swal.fire("Sukses", "Konfigurasi teks dasar disimpan!", "success"));
}

function loginAdmin() {
    Swal.fire({
        title: 'GATEKEEPER AUTENTIKASI',
        html: `<input type="text" id="swal-user" class="swal2-input" placeholder="Username">
               <input type="password" id="swal-pass" class="swal2-input" placeholder="Password">`,
        confirmButtonText: 'Buka Akses Panel',
        focusConfirm: false,
        preConfirm: () => {
            return { user: document.getElementById('swal-user').value, pass: document.getElementById('swal-pass').value }
        }
    }).then((res) => {
        if(!res.value) return;
        if(res.value.user === "admin" && res.value.pass === "jayakarta2026") {
            statusSesiAdmin = true;
            switchView('admin');
            // Trigger paksa listener render ulang daftar admin
            db.ref('gov_announcements').push().parent.once('value', () => {});
            Swal.fire("Akses Diterima", "Selamat bekerja kembali Administrator.", "success");
        } else {
            Swal.fire("Ditolak", "Kombinasi sandi pengaman salah total!", "error");
        }
    });
}

function logoutAdmin() {
    statusSesiAdmin = false;
    switchView('home');
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
