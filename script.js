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

// DISCORD SYSTEM CONFIGURATION
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1525025200029302885/NoIIw47bdySktKIpjP3_bYdtfBYje5jWkt40oHx2DenP8HOeuJ9PS_SwZvFZFKZmuJlK";

// ==========================================================================
// DISCORD EMBED & REALTIME DATABASE ENGINE
// ==========================================================================

// 1. Sinkronisasi Data Pengumuman Realtime dari Firebase
db.ref('gov_announcements').on('value', (snapshot) => {
    const containerUser = document.getElementById('ctx-gov-announce');
    const containerAdmin = document.getElementById('adm-list-gov');
    
    if (containerUser) containerUser.innerHTML = "";
    if (containerAdmin) containerAdmin.innerHTML = "";
    
    if (!snapshot.exists()) {
        if (containerUser) containerUser.innerHTML = `<div class="card" style="text-align:center;color:var(--text-muted);">Belum ada pengumuman resmi saat ini.</div>`;
        return;
    }

    let listPengumuman = [];
    snapshot.forEach((child) => {
        listPengumuman.push({ id: child.key, ...child.val() });
    });

    listPengumuman.sort((a, b) => b.timestamp - a.timestamp);

    listPengumuman.forEach((data) => {
        let classGayaTeks = data.style === 'code' ? 'msg-code' : 'msg-tebal';

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

        if (containerAdmin && statusSesiAdmin) {
            containerAdmin.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px; margin-bottom:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <strong style="color:var(--neon-gold)">${escapeHTML(data.role)}</strong><br>
                        <small style="color:var(--text-muted); font-size:12px;">${escapeHTML(data.text.substring(0, 50))}...</small>
                    </div>
                    <button class="btn-danger" style="padding:4px 10px; font-size:12px;" onclick="hapusGovAnnouncement('${data.id}')">Hapus</button>
                </div>
            `;
        }
    });
});

// 2. Publish Pengumuman Manual (Simpan Firebase + Kirim Webhook Discord)
function addGovAnnouncement() {
    if (!statusSesiAdmin) return;

    const roleInput = document.getElementById('adm-gov-role').value.trim() || "@Everyone";
    const styleInput = document.getElementById('adm-gov-style').value;
    const textInput = document.getElementById('adm-gov-text').value.trim();

    if (!textInput) {
        return Swal.fire("Eror", "Pesan pengumuman tidak boleh kosong!", "error");
    }

    // Format tampilan teks untuk Discord
    let formattedTextForDiscord = textInput;
    if (styleInput === 'code') {
        formattedTextForDiscord = "```text\n" + textInput + "\n```";
    } else {
        formattedTextForDiscord = "**" + textInput + "**";
    }

    // Payload Struktur JSON Embed Discord (Warna Kuning Desimal: 15381256)
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
        ],
        "attachments": []
    };

    // Eksekusi Pengiriman Webhook ke Server Discord Lu
    fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDiscord)
    })
    .then(() => {
        // Jika Berhasil, Simpan juga ke Firebase Realtime Database
        return db.ref('gov_announcements').push({
            role: roleInput,
            style: styleInput,
            text: textInput,
            timestamp: Date.now()
        });
    })
    .then(() => {
        Swal.fire("Berhasil", "Embed Announcement berhasil disiarkan ke Web & Discord!", "success");
        document.getElementById('adm-gov-text').value = "";
        document.getElementById('adm-gov-role').value = "";
    })
    .catch(err => {
        Swal.fire("Gagal", "Terjadi kesalahan sistem: " + err.message, "error");
    });
}

// 3. Hapus Pengumuman Dari Web
function hapusGovAnnouncement(idKey) {
    Swal.fire({
        title: "Hapus Pengumuman?",
        text: "Data akan terhapus dari log database website!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Ya, Hapus!"
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref(`gov_announcements/${idKey}`).remove().then(() => {
                Swal.fire("Sukses", "Data dibersihkan.", "success");
            });
        }
    });
}

// ==========================================================================
// CORE CONTENT HANDLERS & FALLBACKS
// ==========================================================================
db.ref('text_data').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    if(document.getElementById('ctx-profile-comm')) document.getElementById('ctx-profile-comm').innerHTML = data.profile_comm || "Deskripsi profile kosong.";
    if(document.getElementById('ctx-sejarah')) document.getElementById('ctx-sejarah').innerHTML = data.sejarah || "Data Sejarah kosong.";
});

function updateTextData() {
    if(!statusSesiAdmin) return;
    db.ref('text_data').set({
        profile_comm: document.getElementById('adm-prof-comm').value,
        sejarah: document.getElementById('adm-sejarah').value
    }).then(() => Swal.fire("Sukses", "Data teks diperbarui!", "success"));
}

function loginAdmin() {
    Swal.fire({
        title: 'Admin Verification',
        html: `<input type="text" id="swal-user" class="swal2-input" placeholder="Username">
               <input type="password" id="swal-pass" class="swal2-input" placeholder="Password">`,
        confirmButtonText: 'Login',
        focusConfirm: false,
        preConfirm: () => {
            return { user: document.getElementById('swal-user').value, pass: document.getElementById('swal-pass').value }
        }
    }).then((res) => {
        if(!res.value) return;
        if(res.value.user === "admin" && res.value.pass === "jayakarta2026") {
            statusSesiAdmin = true;
            switchView('admin');
            Swal.fire("Sukses", "Selamat datang kembali Owner.", "success");
        } else {
            Swal.fire("Gagal", "Password salah!", "error");
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
