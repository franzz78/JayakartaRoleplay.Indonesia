// FIREBASE REAL-TIME CONFIGURATION DATA DARI REQUEST USER
const firebaseConfig = {
  apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
  databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "absensi-polri",
  storageBucket: "absensi-polri.firebasestorage.app",
  messagingSenderId: "19006760644",
  appId: "1:19006760644:web:b980f54aea123e92ed4b91"
};

// Validasi & Inisialisasi Firebase Engine
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Application Global State Control Variables
let isAdminAuthenticated = false;
let globalAudio = new Audio();
globalAudio.loop = true;
let isMuted = true;

// DOM Element References Navigation Drawer
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('closeBtn');

menuToggle.addEventListener('click', () => sidebar.classList.add('open'));
closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// Switch View Engine Controller (Ganti Menu)
function switchView(viewId) {
    sidebar.classList.remove('open');
    const sections = document.querySelectorAll('main section');
    sections.forEach(sec => {
        sec.classList.remove('view-active');
        sec.classList.add('view-hidden');
    });

    const activeSec = document.getElementById(`view-${viewId}`);
    if(activeSec) {
        activeSec.classList.remove('view-hidden');
        activeSec.classList.add('view-active');
        window.scrollTo({top: 0, behavior: 'smooth'});
        triggerScrollAnimation();
    }
}

// SweetAlert2 Toast Global Engine Notification
function toastNotification(title, icon = 'success') {
    Swal.fire({
        title: title,
        icon: icon,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: '#141414',
        color: '#ffffff',
        iconColor: icon === 'success' ? '#ffffff' : '#d9534f'
    });
}

// --- SECURE ADMINISTRATOR CONTROL AUTHENTICATION ---
function loginAdmin() {
    if(isAdminAuthenticated) {
        switchView('admin');
        return;
    }

    Swal.fire({
        title: 'Verifikasi Administrator',
        text: 'Masukkan Username/Token Akses Keamanan Panel:',
        input: 'password',
        inputPlaceholder: 'Token Akses...',
        showCancelButton: true,
        confirmButtonText: 'Masuk Panel',
        cancelButtonText: 'Batal',
        background: '#141414',
        color: '#ffffff',
        confirmButtonColor: '#444444',
        cancelButtonColor: '#222222'
    }).then((result) => {
        if (result.value === 'JayakartaRPID#2026') {
            isAdminAuthenticated = true;
            toastNotification('Akses Valid! Selamat Datang Admin.');
            switchView('admin');
        } else if(result.isConfirmed) {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak!', text: 'Token Kunci Administrator Tidak Sah.', background: '#141414', color: '#ffffff' });
        }
    });
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    toastNotification('Keluar dari panel admin', 'info');
    switchView('home');
}

// --- CORE BACKSOUND MUSIC PLAYER ENGINE SOUND SYSTEM ---
function toggleAudioGlobal() {
    const disk = document.getElementById('vinylDisk');
    const status = document.querySelector('.vinyl-status');
    
    if (isMuted) {
        globalAudio.play().then(() => {
            isMuted = false;
            disk.classList.add('spinning');
            status.innerText = "Playing";
        }).catch(() => {
            toastNotification('Klik layar sekali lagi agar Browser mengizinkan audio', 'warning');
        });
    } else {
        globalAudio.pause();
        isMuted = true;
        disk.classList.remove('spinning');
        status.innerText = "Mute";
    }
}

// Realtime Listener Untuk Musik Global Yang Diatur Admin
db.ref('global_audio_url').on('value', snap => {
    const url = snap.val();
    if(url) {
        document.getElementById('adm-audio-url').value = url;
        globalAudio.src = url;
        globalAudio.load();
        if(!isMuted) {
            globalAudio.play().catch(()=>{});
        }
    }
});

function updateGlobalAudio() {
    const url = document.getElementById('adm-audio-url').value;
    if(!url) return toastNotification('URL Link Audio Tidak Boleh Kosong!', 'error');
    db.ref('global_audio_url').set(url, err => {
        if(!err) toastNotification('Musik Global Sinkron Berhasil Diubah!');
    });
}

// --- DATA BINDING SYNC DYNAMIC COMPONENT FIREBASE ---

// 1. Sinkronisasi Data Teks Profile & Sejarah Komunitas
db.ref('text_data').on('value', snap => {
    const data = snap.val() || { profile_comm: "Data profile belum diisi oleh Admin.", sejarah: "Data sejarah belum diisi oleh Admin." };
    document.getElementById('ctx-profile-comm').innerText = data.profile_comm;
    document.getElementById('ctx-sejarah').innerText = data.sejarah;
    
    document.getElementById('adm-prof-comm').value = data.profile_comm;
    document.getElementById('adm-sejarah').value = data.sejarah;
});

function updateTextData() {
    const pComm = document.getElementById('adm-prof-comm').value;
    const sej = document.getElementById('adm-sejarah').value;
    db.ref('text_data').set({ profile_comm: pComm, sejarah: sej }, err => {
        if(!err) toastNotification('Data deskripsi teks utama berhasil disimpan');
    });
}

// 2. Sinkronisasi Data Profil Pejabat Negara [Bisa Ditambah Tanpa Batas]
db.ref('pejabat').on('value', snap => {
    const container = document.getElementById('ctx-pejabat');
    const admList = document.getElementById('adm-list-pejabat');
    container.innerHTML = '';
    admList.innerHTML = '';
    
    snap.forEach(child => {
        const key = child.key;
        const val = child.val();
        
        container.innerHTML += `
            <div class="pejabat-card scroll-anim">
                <img src="${val.img || 'https://via.placeholder.com/150'}" class="pejabat-img" alt="Foto">
                <div class="pejabat-role">${val.jabatan}</div>
                <div class="pejabat-name">${val.nama}</div>
            </div>
        `;

        admList.innerHTML += `
            <div class="adm-item">
                <span><strong>${val.jabatan}</strong> - ${val.nama}</span>
                <button class="btn-danger" onclick="deleteData('pejabat/${key}')">Hapus</button>
            </div>
        `;
    });
    triggerScrollAnimation();
});

function addPejabat() {
    const jabatan = document.getElementById('adm-pjb-jabatan').value;
    const nama = document.getElementById('adm-pjb-nama').value;
    const img = document.getElementById('adm-pjb-img').value;
    
    if(!jabatan || !nama || !img) return toastNotification('Harap isi semua input form pejabat!', 'error');

    db.ref('pejabat').push({ jabatan, nama, img }, err => {
        if(!err) {
            toastNotification('Data Pejabat Berhasil Ditambahkan');
            document.getElementById('adm-pjb-jabatan').value = '';
            document.getElementById('adm-pjb-nama').value = '';
            document.getElementById('adm-pjb-img').value = '';
        }
    });
}

// 3. Sinkronisasi Gambar Slideshow Banner Home & Galeri Foto Publik
db.ref('images').on('value', snap => {
    const slider = document.getElementById('sliderContainer');
    const gallery = document.getElementById('ctx-images-public');
    const admList = document.getElementById('adm-list-images');
    
    gallery.innerHTML = '';
    admList.innerHTML = '';
    
    let slideHtml = '';
    let firstSlide = true;

    snap.forEach(child => {
        const key = child.key;
        const val = child.val();

        if (val.type === 'slideshow') {
            slideHtml += `
                <div class="slide ${firstSlide ? 'active' : ''}" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('${val.url}');">
                    <div class="slide-content">
                        <h2>Jayakarta Roleplay</h2>
                        <p>Dunia Virtual Virtual Realitas Indonesia</p>
                    </div>
                </div>
            `;
            firstSlide = false;
        } else {
            gallery.innerHTML += `<img src="${val.url}" class="gallery-item scroll-anim" onclick="window.open('${val.url}', '_blank')">`;
        }

        admList.innerHTML += `
            <div class="adm-item">
                <span>[${val.type.toUpperCase()}] ${val.url}</span>
                <button class="btn-danger" onclick="deleteData('images/${key}')">Hapus</button>
            </div>
        `;
    });

    if(slideHtml) slider.innerHTML = slideHtml;
    startSliderEngine();
    triggerScrollAnimation();
});

function addImageData() {
    const url = document.getElementById('adm-img-url').value;
    const type = document.getElementById('adm-img-type').value;
    if(!url) return toastNotification('Masukkan tautan URL Gambar!', 'error');

    db.ref('images').push({ url, type }, err => {
        if(!err) {
            toastNotification('Gambar Terunggah Sukses');
            document.getElementById('adm-img-url').value = '';
        }
    });
}

// 4. Sinkronisasi Semua Kategori Halaman Multi-Media Konten Post
const listMediaMenus = ['media-info', 'media-dev', 'media-pemerintahan', 'media-discord', 'media-umum'];
db.ref('media_posts').on('value', snap => {
    listMediaMenus.forEach(menu => document.getElementById(`ctx-${menu}`).innerHTML = '');
    const admList = document.getElementById('adm-list-media');
    admList.innerHTML = '';

    snap.forEach(child => {
        const key = child.key;
        const val = child.val();
        const targetContainer = document.getElementById(`ctx-${val.target}`);

        if (targetContainer) {
            let imgRender = val.img ? `<img src="${val.img}" alt="Media Post Assets">` : '';
            targetContainer.innerHTML += `
                <div class="media-card scroll-anim">
                    <h4>${val.title}</h4>
                    <p>${val.text}</p>
                    ${imgRender}
                </div>
            `;
        }

        admList.innerHTML += `
            <div class="adm-item">
                <span>[${val.target.toUpperCase()}] - ${val.title}</span>
                <button class="btn-danger" onclick="deleteData('media_posts/${key}')">Hapus</button>
            </div>
        `;
    });
    triggerScrollAnimation();
});

function addMediaData() {
    const target = document.getElementById('adm-med-target').value;
    const title = document.getElementById('adm-med-title').value;
    const img = document.getElementById('adm-med-img').value;
    const text = document.getElementById('adm-med-text').value;

    if(!title || !text) return toastNotification('Judul postingan dan konten teks wajib diisi!', 'error');

    db.ref('media_posts').push({ target, title, img, text }, err => {
        if(!err) {
            toastNotification('Artikel Berhasil Dipublish Kategori');
            document.getElementById('adm-med-title').value = '';
            document.getElementById('adm-med-img').value = '';
            document.getElementById('adm-med-text').value = '';
        }
    });
}

// --- GLOBAL REUSABLE FUNCTIONS DATA HANDLER ---
function deleteData(path) {
    Swal.fire({
        title: 'Hapus Item?',
        text: "Data yang dihapus dari real-time database akan hilang permanen global.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d9534f',
        cancelButtonColor: '#333333',
        confirmButtonText: 'Ya, Hapus!',
        background: '#141414',
        color: '#ffffff'
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref(path).remove(err => {
                if(!err) toastNotification('Item Terhapus dari Database', 'info');
            });
        }
    });
}

// Real-Time Banner Slider Automation Loop Engine
let sliderTimer;
function startSliderEngine() {
    clearInterval(sliderTimer);
    const slides = document.querySelectorAll('.slide');
    if(slides.length <= 1) return;
    let index = 0;
    
    sliderTimer = setInterval(() => {
        slides[index].classList.remove('active');
        index = (index + 1) % slides.length;
        slides[index].classList.add('active');
    }, 5000);
}

// Scroll Intersection Visual Triggers Animation Function
function triggerScrollAnimation() {
    const items = document.querySelectorAll('.scroll-anim');
    items.forEach(item => {
        const rect = item.getBoundingClientRect();
        if(rect.top < window.innerHeight - 30) {
            item.classList.add('appear');
        }
    });
}

window.addEventListener('scroll', triggerScrollAnimation);
window.addEventListener('load', triggerScrollAnimation);
