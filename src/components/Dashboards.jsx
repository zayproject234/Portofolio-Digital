import React, { useEffect, useState, useRef } from 'react';
import '../../style.css';

const STORAGE_KEY = 'cdn_pro_data';

const STATUS_BADGE = {
    ongoing: { cls: 'badge b-ongoing', label: 'Berjalan' },
    done: { cls: 'badge b-done', label: 'Selesai' },
    paused: { cls: 'badge b-paused', label: 'Ditunda' },
};

function useLocalStorageState(key, initial) {
    const [state, setState] = useState(() => {
        try { return JSON.parse(localStorage.getItem(key) || 'null') ?? initial; }
        catch { return initial; }
    });
    useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
    return [state, setState];
}

export default function AppOld() {
    const [notes, setNotes] = useLocalStorageState(STORAGE_KEY, []);
    const [activeFilter, setActiveFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', desc: '', cat: 'Web', status: 'ongoing', link: '' });
    const [toast, setToast] = useState({ msg: '', type: 'success', show: false });
    const toastTimer = useRef(null);

    useEffect(() => { return () => clearTimeout(toastTimer.current); }, []);

    function showNotify(msg, type = 'success') {
        clearTimeout(toastTimer.current);
        setToast({ msg, type, show: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
    }

    function openModal(note = null) {
        setEditing(note?.id || null);
        setForm({ name: note?.name || '', desc: note?.desc || '', cat: note?.cat || 'Web', status: note?.status || 'ongoing', link: note?.link || '' });
        setModalOpen(true);
    }

    function closeModal() { setModalOpen(false); setEditing(null); }

    function saveNote() {
        if (!form.name.trim()) return showNotify('Nama project kosong!', 'danger');
        const data = {
            id: editing || Math.random().toString(36).substr(2, 9),
            name: form.name.trim(),
            desc: form.desc.trim(),
            cat: form.cat,
            status: form.status,
            link: form.link.trim(),
            ts: editing ? (notes.find(n => n.id === editing)?.ts) : new Date().toISOString(),
        };

        if (editing) {
            setNotes(prev => prev.map(n => n.id === editing ? data : n));
            showNotify('Project diperbarui');
        } else {
            setNotes(prev => [data, ...prev]);
            showNotify('Project ditambahkan');
        }
        closeModal();
    }

    function delNote(id) {
        if (!window.confirm('Hapus project ini?')) return;
        setNotes(prev => prev.filter(n => n.id !== id));
        showNotify('Project dihapus', 'danger');
    }

    function editNote(id) {
        const p = notes.find(n => n.id === id);
        if (p) openModal(p);
    }

    const filtered = notes.filter(n => {
        const matchesF = activeFilter === 'all' || n.status === activeFilter;
        const q = search.toLowerCase();
        const matchesS = n.name.toLowerCase().includes(q) || (n.desc || '').toLowerCase().includes(q);
        return matchesF && matchesS;
    });

    // counters
    const totals = {
        total: notes.length,
        ongoing: notes.filter(n => n.status === 'ongoing').length,
        done: notes.filter(n => n.status === 'done').length,
        paused: notes.filter(n => n.status === 'paused').length,
    };

    let globalCounter = 1;

    return (
        <div>
            <div className="bg-canvas">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
            </div>
            <div className="bg-grid" />

            <div className="shell">
                <aside>
                    <div className="brand">
                        <div className="brand-logo">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <div>
                            <div className="brand-name">Catatan Digital</div>
                            <div className="brand-tag">Project Manager</div>
                        </div>
                    </div>

                    <div className="stat-grid">
                        <div className="stat-card"><div className="stat-num">{totals.ongoing}</div><div className="stat-lbl">Berjalan</div></div>
                        <div className="stat-card"><div className="stat-num">{totals.paused}</div><div className="stat-lbl">Ditunda</div></div>
                        <div className="stat-card"><div className="stat-num">{totals.done}</div><div className="stat-lbl">Selesai</div></div>
                        <div className="stat-card"><div className="stat-num">{totals.total}</div><div className="stat-lbl">Total</div></div>
                    </div>

                    <nav>
                        {['all','ongoing','paused','done','transactions'].map(f => (
                            <button key={f} className={`nav-btn ${activeFilter===f? 'active':''}`} onClick={() => { setActiveFilter(f); }}>
                                {f==='all' ? 'Semua Project' : (f==='transactions' ? 'Transaksi' : f.charAt(0).toUpperCase()+f.slice(1))}
                            </button>
                        ))}
                    </nav>

                    <button className="btn-add" onClick={() => openModal()}>+ Tambah Project</button>
                </aside>

                <main>
                    <div className="topbar">
                        <div className="page-title">
                            <span id="view-sub">{activeFilter==='all' ? 'List Project' : activeFilter}</span>
                            <h1 className="title-glow">Dashboard</h1>
                        </div>
                        <div className="search-box">
                            <input className="search-input" placeholder="Cari project..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div id="note-area">
                        {filtered.length === 0 ? (
                            <div style={{textAlign:'center', padding:50, color:'var(--txt3)'}}>Tidak ada project ditemukan.</div>
                        ) : (
                            <div className="notes-grid">
                                {filtered.map(n => {
                                    const d = new Date(n.ts);
                                    const dateStr = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
                                    const timeStr = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
                                    const idx = globalCounter++;
                                    return (
                                        <div className={`note-card s-${n.status}`} key={n.id}>
                                            <div className="card-header">
                                                <div className="card-badges"><span className={STATUS_BADGE[n.status]?.cls}>{STATUS_BADGE[n.status]?.label}</span></div>
                                                <div className="card-actions">
                                                    <button className="act" onClick={() => editNote(n.id)}>✎</button>
                                                    <button className="act del" onClick={() => delNote(n.id)}>✕</button>
                                                </div>
                                            </div>
                                            <div className="card-title" data-index={idx}>{n.name}</div>
                                            <div className="card-desc">{n.desc || '...'}</div>
                                            <div className="card-footer">
                                                <span className="card-time">{dateStr} • {timeStr}</span>
                                                {n.link ? <a href={n.link} target="_blank" rel="noreferrer" className="card-link">↗ Link</a> : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <div className={`toast ${toast.show ? 'show' : ''}`} style={{ zIndex:9999 }}>
                <div className={`t-icon ${toast.type==='success' ? 't-success' : 't-danger'}`}>{toast.type==='success' ? '✓' : '✕'}</div>
                <span>{toast.msg}</span>
            </div>

            {modalOpen && (
                <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal">
                        <div className="modal-hdr">
                            <h2 id="modal-title">{editing ? 'Edit Project' : 'Project Baru'}</h2>
                            <button className="modal-x" onClick={() => closeModal()}>&times;</button>
                        </div>
                        <div className="form">
                            <div className="fgroup">
                                <label>Nama Project</label>
                                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama project Anda..." />
                            </div>
                            <div className="fgroup">
                                <label>Deskripsi</label>
                                <textarea rows={3} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Detail singkat..." />
                            </div>
                            <div className="frow">
                                <div className="fgroup">
                                    <label>Kategori</label>
                                    <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
                                        <option value="Web">Web Dev</option>
                                        <option value="Design">Design</option>
                                        <option value="Mobile">Mobile</option>
                                    </select>
                                </div>
                                <div className="fgroup">
                                    <label>Status</label>
                                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="ongoing">Berjalan</option>
                                        <option value="done">Selesai</option>
                                        <option value="paused">Ditunda</option>
                                    </select>
                                </div>
                            </div>
                            <div className="fgroup">
                                <label>Link Project</label>
                                <input type="url" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
                            </div>
                            <div className="modal-foot">
                                <button className="btn-cancel" onClick={() => closeModal()}>Batal</button>
                                <button className="btn-save" onClick={() => saveNote()}>Simpan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
