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

// INTERACTION WEBHOOK DISCORD ENDPOINT ENGINE
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1525025200029302885/NoIIw47bdySktKIpjP3_bYdtfBYje5jWkt40oHx2DenP8HOeuJ9PS_SwZvFZFKZmuJlK";

// ==========================================================================
// GOVERNMENT ANNOUNCEMENT CORE PROCESSOR (FIREBASE + DISCORD REALTIME)
// ==========================================================================

// 1. Sinkronisasi Data Pengumuman Realtime ke Sisi User & Sisi Panel Kelola Admin
db.ref('gov_announcements').on('value', (snapshot) => {
    const containerUser = document.getElementById('ctx-gov-announce');
    const containerAdmin = document.getElementById('adm-list-gov');
    
    if (containerUser) containerUser.innerHTML = "";
    if (containerAdmin) containerAdmin.innerHTML = "";
    
    if (!snapshot.exists()) {
        if (containerUser) containerUser.innerHTML = `<div class="premium-neon-card" style="text-align:center;color:var(--text-muted);">Belum ada dokumentasi pengumuman negara yang diterbitkan saat ini.</div>`;
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
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05); margin-bottom:6px;">
                    <div>
                        <strong style="color:var(--neon-gold); font-size:12px;">Tag: ${escapeHTML(data.role)}</strong>
                        <small style="color:#fff; display:block; font-size:13px; margin-top:2px;">${escapeHTML(data.text.substring(0, 50))}...</small>
                    </div>
                    <button class="btn-danger-logout" style="padding:4px 10px; font-size:11px;" onclick="hapusGovAnnouncement('${data.id}')">Hapus</button>
                </div>
            `;
        }
    });
});

// 2. Fungsi Kirim Pengumuman Gabungan (Simpan Database + Tembak Discord Embed)
function addGovAnnouncement() {
    if (!statusSesiAdmin) return;

    const roleInput = document.getElementById('adm-gov-role').value.trim() || "@Everyone";
    const styleInput = document.getElementById('adm-gov-style').value;
    const textInput = document.getElementById('adm-gov-text').value.trim();

    if (!textInput) {
        return Swal.fire("Validasi Gagal", "Pesan isi data pengumuman kosong!", "error");
    }

    let formattedTextForDiscord = textInput;
    if (styleInput === 'code') {
        formattedTextForDiscord = "```text\n" + textInput + "\n```";
    } else {
        formattedTextForDiscord = "**" + textInput + "**";
    }

    const payloadDiscord = {
        "content": roleInput,
        "embeds": [
            {
                "title": "Announcement Government",
                "description": formattedTextForDiscord,
                "color": 15381256,
                "footer": { "text": "@[ID] Jayakarta Roleplay, Indonesia - 2026" },
                "timestamp": new Date().toISOString()
            }
        ]
    };

    fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDiscord)
    })
    .then(() => {
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
    .catch(err => Swal.fire("Gagal", err.message, "error"));
}

function hapusGovAnnouncement(idKey) {
    if (!statusSesiAdmin) return;
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
                Swal.fire("Terhapus", "Data berhasil dieliminasi.", "success");
            });
        }
    });
}


// ==========================================================================
// CORE CONTENT RENDERING SYSTEM MODULES (UTUH TANPA POTONGAN)
// ==========================================================================

// 1. Sinkronisasi Teks Informasi Dasar (Profile & Sejarah)
db.ref('text_data').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    if(document.getElementById('ctx-profile-comm')) document.getElementById('ctx-profile-comm').innerHTML = data.profile_comm || "Belum ada konfigurasi deskripsi.";
    if(document.getElementById('ctx-sejarah')) document.getElementById('ctx-sejarah').innerHTML = data.sejarah || "Belum ada konfigurasi sejarah.";
    
    if(document.getElementById('adm-prof-comm') && !document.getElementById('adm-prof-comm').value) document.getElementById('adm-prof-comm').value = data.profile_comm || "";
    if(document.getElementById('adm-sejarah') && !document.getElementById('adm-sejarah').value) document.getElementById('adm-sejarah').value = data.sejarah || "";
});

function updateTextData() {
    if(!statusSesiAdmin) return;
    db.ref('text_data').set({
        profile_comm: document.getElementById('adm-prof-comm').value,
        sejarah: document.getElementById('adm-sejarah').value
    }).then(() => Swal.fire("Sukses", "Data deskripsi teks berhasil disimpan!", "success"));
}

// 2. Sinkronisasi Struktur Birokrasi Pejabat Negara (Utuh + Tombol Hapus Admin)
db.ref('pejabat').on('value', (snapshot) => {
    const ctxPejabat = document.getElementById('ctx-pejabat');
    const admListPejabat = document.getElementById('adm-list-pejabat');

    if(ctxPejabat) ctxPejabat.innerHTML = "";
    if(admListPejabat) admListPejabat.innerHTML = "";

    snapshot.forEach((child) => {
        const key = child.key;
        const val = child.val();

        if(ctxPejabat) {
            ctxPejabat.innerHTML += `
                <div class="pejabat-card">
                    <img src="${val.img || 'https://via.placeholder.com/150'}" alt="${val.nama}">
                    <h4>${escapeHTML(val.jabatan)}</h4>
                    <p style="font-size:14px;color:var(--text-muted);margin-top:2px;">${escapeHTML(val.nama)}</p>
                </div>
            `;
        }

        if(admListPejabat && statusSesiAdmin) {
            admListPejabat.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:4px; margin-bottom:4px;">
                    <span><strong>${escapeHTML(val.jabatan)}</strong> - ${escapeHTML(val.nama)}</span>
                    <button class="btn-danger-logout" style="padding:2px 8px; font-size:11px;" onclick="deleteNodeData('pejabat','${key}')">Hapus</button>
                </div>
            `;
        }
    });
});

function addPejabat() {
    if(!statusSesiAdmin) return;
    const jabatan = document.getElementById('adm-pjb-jabatan').value.trim();
    const nama = document.getElementById('adm-pjb-nama').value.trim();
    const img = document.getElementById('adm-pjb-img').value.trim();

    if(!jabatan || !nama) return Swal.fire("Eror", "Kolom Jabatan & Nama Wajib Diisi!", "error");

    db.ref('pejabat').push({ jabatan, nama, img }).then(() => {
        Swal.fire("Sukses", "Personel birokrasi ditambahkan!", "success");
        document.getElementById('adm-pjb-jabatan').value = "";
        document.getElementById('adm-pjb-nama').value = "";
        document.getElementById('adm-pjb-img').value = "";
    });
}

// 3. Sinkronisasi Data Gambar & Home Slider Engine Dynamic (Utuh)
db.ref('images_data').on('value', (snapshot) => {
    const ctxGallery = document.getElementById('ctx-images-public');
    const admListImg = document.getElementById('adm-list-images');
    const sliderContainer = document.getElementById('sliderContainer');

    if(ctxGallery) ctxGallery.innerHTML = "";
    if(admListImg) admListImg.innerHTML = "";
    
    let sliderHTML = "";
    let statusAdaSlide = false;

    snapshot.forEach((child) => {
        const key = child.key;
        const val = child.val();

        if(val.type === 'public' && ctxGallery) {
            ctxGallery.innerHTML += `
                <div class="gallery-item-node" onclick="viewFullImagePopup('${val.url}')">
                    <img src="${val.url}" alt="Public Resource">
                </div>
            `;
        } else if(val.type === 'slideshow') {
            statusAdaSlide = true;
            sliderHTML += `
                <div class="slide" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(6,8,12,0.95)), url('${val.url}');">
                    <div class="slide-content">
                        <h2>[ID] JAYAKARTA ROLEPLAY</h2>
                        <p>Server Kota Impian Terbaik & Berwibawa Seluruh Indonesia</p>
                    </div>
                </div>
            `;
        }

        if(admListImg && statusSesiAdmin) {
            admListImg.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:4px; margin-bottom:4px; font-size:12px;">
                    <span>Type: <strong>${val.type.toUpperCase()}</strong> | Link Tautan Gambar Aktif</span>
                    <button class="btn-danger-logout" style="padding:2px 8px; font-size:11px;" onclick="deleteNodeData('images_data','${key}')">Hapus</button>
                </div>
            `;
        }
    });

    if(sliderContainer && statusAdaSlide) {
        sliderContainer.innerHTML = sliderHTML;
        initializeSliderEngine();
    }
});

function addImageData() {
    if(!statusSesiAdmin) return;
    const url = document.getElementById('adm-img-url').value.trim();
    const type = document.getElementById('adm-img-type').value;

    if(!url) return Swal.fire("Eror", "Link URL Gambar Kosong!", "error");

    db.ref('images_data').push({ url, type }).then(() => {
        Swal.fire("Sukses", "Data aset gambar berhasil dikirim!", "success");
        document.getElementById('adm-img-url').value = "";
    });
}

// 4. Sinkronisasi Liputan Artikel 5 Kategori Sektor Media (Lengkap & Utuh)
db.ref('media_posts').on('value', (snapshot) => {
    const categories = ['media-info', 'media-dev', 'media-pemerintahan', 'media-discord', 'media-umum'];
    categories.forEach(id => {
        if(document.getElementById(`ctx-${id}`)) document.getElementById(`ctx-${id}`).innerHTML = "";
    });

    const admListMedia = document.getElementById('adm-list-media');
    if(admListMedia) admListMedia.innerHTML = "";

    snapshot.forEach((child) => {
        const key = child.key;
        const val = child.val();
        const ctxTarget = document.getElementById(`ctx-${val.target}`);

        if(ctxTarget) {
            let imgHTML = val.img ? `<img src="${val.img}" alt="Media Resource" style="width:100%; max-height:260px; object-fit:cover; border-radius:4px; margin-bottom:12px;">` : '';
            ctxTarget.innerHTML += `
                <div class="premium-neon-card" style="margin-bottom:10px;">
                    ${imgHTML}
                    <h3 style="color:var(--neon-gold); margin-bottom:6px;">${escapeHTML(val.title)}</h3>
                    <p style="white-space:pre-wrap; line-height:1.6; font-size:14px;">${escapeHTML(val.text)}</p>
                </div>
            `;
        }

        if(admListMedia && statusSesiAdmin) {
            admListMedia.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:4px; margin-bottom:4px; font-size:12px;">
                    <span>[${val.target.toUpperCase()}] - ${escapeHTML(val.title)}</span>
                    <button class="btn-danger-logout" style="padding:2px 8px; font-size:11px;" onclick="deleteNodeData('media_posts','${key}')">Hapus</button>
                </div>
            `;
        }
    });
});

function addMediaData() {
    if(!statusSesiAdmin) return;
    const target = document.getElementById('adm-med-target').value;
    const title = document.getElementById('adm-med-title').value.trim();
    const img = document.getElementById('adm-med-img').value.trim();
    const text = document.getElementById('adm-med-text').value.trim();

    if(!title || !text) return Swal.fire("Eror", "Judul & Isi Narasi Berita Wajib Diisi!", "error");

    db.ref('media_posts').push({ target, title, img, text }).then(() => {
        Swal.fire("Sukses", "Berita artikel resmi dipublikasikan!", "success");
        document.getElementById('adm-med-title').value = "";
        document.getElementById('adm-med-img').value = "";
        document.getElementById('adm-med-text').value = "";
    });
}

// 5. Global Action Penuntut Penghapusan Node Database Server
function deleteNodeData(path, nodeKey) {
    if(!statusSesiAdmin) return;
    Swal.fire({
        title: "Eksekusi Hapus?",
        text: "Data node ini akan dibersihkan selamanya dari database!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Ya, Eliminasi!"
    }).then((res) => {
        if(res.isConfirmed) {
            db.ref(`${path}/${nodeKey}`).remove().then(() => {
                Swal.fire("Sukses", "Node data berhasil dibersihkan.", "success");
            });
        }
    });
}


// ==========================================================================
// SECURITY ACCESS GATEWAY AUTENTIKASI MANAGEMENT
// ==========================================================================
function loginAdmin() {
    Swal.fire({
        title: 'GATEKEEPER SECURITY',
        html: `<input type="text" id="swal-user" class="swal2-input" placeholder="Username">
               <input type="password" id="swal-pass" class="swal2-input" placeholder="Password">`,
        confirmButtonText: 'Buka Dashboard',
        focusConfirm: false,
        preConfirm: () => {
            return { user: document.getElementById('swal-user').value, pass: document.getElementById('swal-pass').value }
        }
    }).then((res) => {
        if(!res.value) return;
        if(res.value.user === "admin" && res.value.pass === "jayakarta2026") {
            statusSesiAdmin = true;
            switchView('admin');
            // Memicu paksa sinkronisasi real-time render log kelola admin
            db.ref('gov_announcements').push().parent.once('value', () => {});
            Swal.fire("Akses Diterima", "Selamat bertugas kembali Owner / Admin Utama.", "success");
        } else {
            Swal.fire("Akses Ditolak", "Kombinasi Key-Sandi Pengaman Salah Total!", "error");
        }
    });
}

function logoutAdmin() {
    statusSesiAdmin = false;
    switchView('home');
    Swal.fire("Logged Out", "Sesi kendali berhasil ditutup dengan aman.", "info");
}


// ==========================================================================
// SUPPLEMENTARY DRIVER INTERACTIVE UTILITIES
// ==========================================================================
let sliderIntervalID = null;
function initializeSliderEngine() {
    if(sliderIntervalID) clearInterval(sliderIntervalID);
    const slides = document.querySelectorAll('.slider-container .slide');
    if(slides.length <= 1) return;
    
    let currentIdx = 0;
    sliderIntervalID = setInterval(() => {
        slides[currentIdx].classList.remove('active');
        currentIdx = (currentIdx + 1) % slides.length;
        slides[currentIdx].classList.add('active');
    }, 5000);
}

function viewFullImagePopup(url) {
    Swal.fire({
        imageUrl: url,
        showCloseButton: true,
        showConfirmButton: false,
        background: 'rgba(5,7,10,0.98)',
        width: '85%'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
  
