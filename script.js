// ==========================================================================
// CENTRAL DATABASE CONFIGURATION ENGINE (FIREBASE CONNECTION)
// ==========================================================================
// Kunci Konfigurasi Asli Milik Server Absensi Polri (TIDAK BOLEH DIHAPUS)
const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

// Inisialisasi Aplikasi Server Utama Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// State System Global Object Virtual Memory
let statusSesiAdmin = false;

// ==========================================================================
// DISCORD EMBED LOGIC ENGINE: ANNOUNCEMENT GOVERNMENT
// ==========================================================================

// 1. Ambil & Render Pengumuman Pemerintah ke Halaman Pengunjung
db.ref('gov_announcements').on('value', (snapshot) => {
    const containerUser = document.getElementById('ctx-gov-announce');
    const containerAdmin = document.getElementById('adm-list-gov');
    
    if (containerUser) containerUser.innerHTML = "";
    if (containerAdmin) containerAdmin.innerHTML = "";
    
    if (!snapshot.exists()) {
        if (containerUser) containerUser.innerHTML = `<div class="card-body">Belum ada pengumuman resmi yang diterbitkan saat ini.</div>`;
        return;
    }

    let listPengumuman = [];
    snapshot.forEach((child) => {
        listPengumuman.push({ id: child.key, ...child.val() });
    });

    // Urutkan berdasarkan waktu rilis terbaru (Descending)
    listPengumuman.sort((a, b) => b.timestamp - a.timestamp);

    listPengumuman.forEach((data) => {
        let classGayaTeks = data.style === 'code' ? 'msg-code' : 'msg-tebal';

        // Tampilkan di Sisi Pengunjung Umum
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

        // Tampilkan di Daftar Kelola Panel Admin (Bisa Dihapus)
        if (containerAdmin && statusSesiAdmin) {
            containerAdmin.innerHTML += `
                <div class="admin-item-row" style="display:flex; justify-content:between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:6px;">
                    <div style="flex:1;">
                        <strong>Tag:</strong> ${escapeHTML(data.role)} | <strong>Gaya:</strong> ${data.style.toUpperCase()}<br>
                        <small style="color: #9aa5b5; font-size:11px;">${escapeHTML(data.text.substring(0, 60))}...</small>
                    </div>
                    <button class="btn-sm-danger" onclick="hapusGovAnnouncement('${data.id}')" style="background:#d33; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Hapus</button>
                </div>
            `;
        }
    });
});

// 2. Fungsi Eksekusi Kirim Pengumuman Manual dari Panel Admin
function addGovAnnouncement() {
    if (!statusSesiAdmin) return;

    const roleInput = document.getElementById('adm-gov-role').value.trim();
    const styleInput = document.getElementById('adm-gov-style').value;
    const textInput = document.getElementById('adm-gov-text').value.trim();

    if (!textInput) {
        return Swal.fire("Eror Validasi", "Kolom isi pesan tidak boleh dikosongkan!", "error");
    }

    db.ref('gov_announcements').push({
        role: roleInput || "@Everyone",
        style: styleInput,
        text: textInput,
        timestamp: Date.now()
    }).then(() => {
        Swal.fire("Berhasil", "Embed Announcement Government Berhasil Disiarkan!", "success");
        document.getElementById('adm-gov-text').value = "";
        document.getElementById('adm-gov-role').value = "";
    }).catch(err => {
        Swal.fire("Gagal", err.message, "error");
    });
}

// 3. Fungsi Hapus Berita Pengumuman Pemerintah
function hapusGovAnnouncement(idKey) {
    Swal.fire({
        title: "Hapus Embed?",
        text: "Pengumuman ini akan lenyap permanen dari server website utama!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Ya, Hapus!"
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref(`gov_announcements/${idKey}`).remove().then(() => {
                Swal.fire("Terhapus", "Data pengumuman berhasil dibersihkan.", "success");
            });
        }
    });
}


// ==========================================================================
// CORE CONTENT RENDERING SYSTEM (TEXTS, PEJABAT, IMAGES & MULTIMEDIA)
// ==========================================================================

// Sinkronisasi Profile Komunitas & Sejarah (Teks)
db.ref('text_data').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    
    const viewProf = document.getElementById('ctx-profile-comm');
    const viewSej = document.getElementById('ctx-sejarah');
    const admProf = document.getElementById('adm-prof-comm');
    const admSej = document.getElementById('adm-sejarah');

    if(viewProf) viewProf.innerHTML = data.profile_comm || "Deskripsi profile belum dikonfigurasi.";
    if(viewSej) viewSej.innerHTML = data.sejarah || "Sejarah komunitas belum ditambahkan oleh administrator.";

    if(admProf && !admProf.value) admProf.value = data.profile_comm || "";
    if(admSej && !admSej.value) admSej.value = data.sejarah || "";
});

// Sinkronisasi Struktur Birokrasi Pejabat Negara
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
                <div class="pejabat-card scroll-anim appear">
                    <img src="${val.img || 'https://via.placeholder.com/150'}" alt="${val.nama}">
                    <div class="pejabat-info">
                        <h4>${escapeHTML(val.jabatan)}</h4>
                        <p>${escapeHTML(val.nama)}</p>
                    </div>
                </div>
            `;
        }

        if(admListPejabat && statusSesiAdmin) {
            admListPejabat.innerHTML += `
                <div class="admin-item-row">
                    <span><strong>${escapeHTML(val.jabatan)}</strong> - ${escapeHTML(val.nama)}</span>
                    <button class="btn-sm-danger" onclick="deleteData('pejabat','${key}')">Hapus</button>
                </div>
            `;
        }
    });
});

// Sinkronisasi Koleksi Gambar Publik & Home Slider Dynamic
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
                <div class="gallery-item" onclick="viewImageFull('${val.url}')">
                    <img src="${val.url}" alt="Gallery Public">
                </div>
            `;
        } else if(val.type === 'slideshow') {
            statusAdaSlide = true;
            sliderHTML += `
                <div class="slide" style="background-image: url('${val.url}');">
                    <div class="slide-content">
                        <h2>[ID] Jayakarta Roleplay</h2>
                        <p>Server Kota Impian Terbaik & Berwibawa Seluruh Indonesia</p>
                    </div>
                </div>
            `;
        }

        if(admListImg && statusSesiAdmin) {
            admListImg.innerHTML += `
                <div class="admin-item-row">
                    <span>(${val.type}) <a href="${val.url}" target="_blank">Lihat Tautan Gambar</a></span>
                    <button class="btn-sm-danger" onclick="deleteData('images_data','${key}')">Hapus</button>
                </div>
            `;
        }
    });

    if(sliderContainer && statusAdaSlide) {
        sliderContainer.innerHTML = sliderHTML;
        startSliderEngine();
    }
});

// Sinkronisasi Multi-Media News
db.ref('media_posts').on('value', (snapshot) => {
    const targetIDs = ['media-info', 'media-dev', 'media-pemerintahan', 'media-discord', 'media-umum'];
    targetIDs.forEach(id => {
        const element = document.getElementById(`ctx-${id}`);
        if(element) element.innerHTML = "";
    });

    const admListMedia = document.getElementById('adm-list-media');
    if(admListMedia) admListMedia.innerHTML = "";

    snapshot.forEach((child) => {
        const key = child.key;
        const val = child.val();
        const ctxTarget = document.getElementById(`ctx-${val.target}`);

        if(ctxTarget) {
            let mediaImgHTML = val.img ? `<img src="${val.img}" alt="Media Illustration" style="width:100%; max-height:250px; object-fit:cover; border-radius:6px; margin-bottom:15px;">` : '';
            ctxTarget.innerHTML += `
                <div class="card scroll-anim appear" style="margin-bottom:25px;">
                    <div class="card-body">
                        ${mediaImgHTML}
                        <h3 style="color:var(--neon-text); margin-bottom:10px;">${escapeHTML(val.title)}</h3>
                        <p style="white-space:pre-wrap; line-height:1.6; color:#e2e8f0;">${escapeHTML(val.text)}</p>
                    </div>
                </div>
            `;
        }

        if(admListMedia && statusSesiAdmin) {
            admListMedia.innerHTML += `
                <div class="admin-item-row">
                    <span>[${val.target.toUpperCase()}] - ${escapeHTML(val.title)}</span>
                    <button class="btn-sm-danger" onclick="deleteData('media_posts','${key}')">Hapus</button>
                </div>
            `;
        }
    });
});


// ==========================================================================
// EXECUTIONS & ACTION WRITE DATA SYSTEM (ADMINISTRATOR MODES)
// ==========================================================================

function updateTextData() {
    if(!statusSesiAdmin) return;
    const pComm = document.getElementById('adm-prof-comm').value;
    const sej = document.getElementById('adm-sejarah').value;

    db.ref('text_data').set({
        profile_comm: pComm,
        sejarah: sej
    }).then(() => {
        Swal.fire("Sukses", "Deskripsi Profil & Sejarah berhasil diperbarui!", "success");
    });
}

function addPejabat() {
    if(!statusSesiAdmin) return;
    const jabatan = document.getElementById('adm-pjb-jabatan').value.trim();
    const nama = document.getElementById('adm-pjb-nama').value.trim();
    const img = document.getElementById('adm-pjb-img').value.trim();

    if(!jabatan || !nama) return Swal.fire("Eror", "Jabatan & Nama wajib diisi!", "error");

    db.ref('pejabat').push({ jabatan, nama, img }).then(() => {
        Swal.fire("Sukses", "Struktur birokrasi pejabat berhasil ditambah!", "success");
        document.getElementById('adm-pjb-jabatan').value = "";
        document.getElementById('adm-pjb-nama').value = "";
        document.getElementById('adm-pjb-img').value = "";
    });
}

function addImageData() {
    if(!statusSesiAdmin) return;
    const url = document.getElementById('adm-img-url').value.trim();
    const type = document.getElementById('adm-img-type').value;

    if(!url) return Swal.fire("Eror", "URL Link Tautan Gambar Kosong!", "error");

    db.ref('images_data').push({ url, type }).then(() => {
        Swal.fire("Sukses", "Data Gambar berhasil disimpan!", "success");
        document.getElementById('adm-img-url').value = "";
    });
}

function addMediaData() {
    if(!statusSesiAdmin) return;
    const target = document.getElementById('adm-med-target').value;
    const title = document.getElementById('adm-med-title').value.trim();
    const img = document.getElementById('adm-med-img').value.trim();
    const text = document.getElementById('adm-med-text').value.trim();

    if(!title || !text) return Swal.fire("Eror", "Judul & Konten Pesan teks wajib diisi!", "error");

    db.ref('media_posts').push({ target, title, img, text }).then(() => {
        Swal.fire("Sukses", "Berita Artikel Media berhasil di-publish!", "success");
        document.getElementById('adm-med-title').value = "";
        document.getElementById('adm-med-img').value = "";
        document.getElementById('adm-med-text').value = "";
    });
}

function deleteData(path, nodeKey) {
    if(!statusSesiAdmin) return;
    Swal.fire({
        title: "Konfirmasi Hapus?",
        text: "Data yang dihapus tidak bisa dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Ya, Eliminasi!"
    }).then((res) => {
        if(res.isConfirmed) {
            db.ref(`${path}/${nodeKey}`).remove().then(() => {
                Swal.fire("Terhapus", "Data Node berhasil dieksekusi keluar.", "success");
            });
        }
    });
}


// ==========================================================================
// SECURITY ACCESS SYSTEM (ADMIN CONTROLLER GATE)
// ==========================================================================

function loginAdmin() {
    Swal.fire({
        title: 'Security Administrator Check',
        html: `
            <input type="text" id="swal-user" class="swal2-input" placeholder="Username">
            <input type="password" id="swal-pass" class="swal2-input" placeholder="Password">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Buka Dashboard',
        preConfirm: () => {
            const user = document.getElementById('swal-user').value;
            const pass = document.getElementById('swal-pass').value;
            return { user: user, pass: pass };
        }
    }).then((result) => {
        if (result.isDismissed) return;
        
        const credentials = result.value;
        if(credentials.user === "admin" && credentials.pass === "jayakarta2026") {
            statusSesiAdmin = true;
            
            // Pindah halaman ke Panel Admin
            if (typeof switchView === "function") {
                switchView('admin');
            }
            
            // Memicu paksa render ulang daftar kelola admin
            db.ref('gov_announcements').setValue = db.ref('gov_announcements').push().parent.getKey();
            
            Swal.fire("Akses Diterima", "Selamat datang kembali Owner / Admin Utama.", "success");
        } else {
            Swal.fire("Akses Ditolak", "Kombinasi Key-Kata Sandi Salah Total!", "error");
        }
    });
}

function logoutAdmin() {
    statusSesiAdmin = false;
    if (typeof switchView === "function") {
        switchView('home');
    }
    Swal.fire("Logged Out", "Sesi kendali administrator berhasil ditutup dengan aman.", "info");
}


// ==========================================================================
// UX ANIMATION SYSTEMS & COMPLEMENTARY ENGINE SLIDER
// ==========================================================================

function startSliderEngine() {
    const slides = document.querySelectorAll('.slider-container .slide');
    if(slides.length <= 1) return;
    
    let indexSekarang = 0;
    setInterval(() => {
        slides[indexSekarang].classList.remove('active');
        indexSekarang = (indexSekarang + 1) % slides.length;
        slides[indexSekarang].classList.add('active');
    }, 5000);
}

function viewImageFull(urlTautan) {
    Swal.fire({
        imageUrl: urlTautan,
        imageAlt: 'Visual JRP Real-Time Graphic Preview',
        showCloseButton: true,
        showConfirmButton: false,
        background: 'rgba(10,12,16,0.95)',
        width: '90%'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    startSliderEngine();
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-anim').forEach(el => observer.observe(el));
});

