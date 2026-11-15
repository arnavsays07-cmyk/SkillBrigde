/**
 * js/search_peers.js
 * Dynamic Fetch API peer discovery, 300ms debouncing, AbortController & booking modal
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('peer-search-input');
    const deptFilter  = document.getElementById('peer-dept-filter');
    const statusLabel = document.getElementById('search-status');
    const countLabel  = document.getElementById('peer-count-label');
    const peersGrid   = document.getElementById('peers-grid');

    const modal         = document.getElementById('booking-modal');
    const modalTutor    = document.getElementById('booking-tutor-label');
    const modalTutorId  = document.getElementById('booking-tutor-id');
    const modalSubject  = document.getElementById('booking-subject-id');
    const bookingForm   = document.getElementById('booking-form');
    const bookingError  = document.getElementById('booking-error');
    const toastBanner   = document.getElementById('booking-toast');

    const configEl = document.getElementById('skillbridge-config');
    const apiBase  = configEl ? configEl.dataset.baseUrl : '';
    const csrfToken = configEl ? configEl.dataset.csrf : '';

    let debounceTimer = null;
    let abortController = null;
    let latestPeers = [];

    async function fetchPeers() {
        if (!searchInput || !deptFilter || !peersGrid) return;

        const query = searchInput.value.trim();
        const department = deptFilter.value;

        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        if (statusLabel) statusLabel.classList.remove('hidden');

        try {
            const params = new URLSearchParams({
                subject: query,
                department: department
            });

            const response = await fetch(`${apiBase}/api/search_peers.php?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                signal: abortController.signal
            });

            if (response.status === 401) {
                window.location.href = `${apiBase}/auth/login.php`;
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            latestPeers = json.data || [];
            renderPeers(latestPeers);
        } catch (error) {
            if (error && error.name === 'AbortError') return;
            peersGrid.innerHTML = `
                <div class="col-span-full p-6 text-center text-red-300 bg-red-950/30 rounded-2xl border border-red-800/60 text-xs">
                    Unable to load peer tutors right now. Please refresh and try again.
                </div>
            `;
        } finally {
            if (statusLabel) statusLabel.classList.add('hidden');
        }
    }

    function renderPeers(peers) {
        if (!peersGrid) return;

        if (countLabel) {
            countLabel.textContent = String(peers.length);
        }

        if (peers.length === 0) {
            peersGrid.innerHTML = `
                <div class="col-span-full bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl py-16 px-6 text-center">
                    <h3 class="text-base font-semibold text-white mb-1">No matching peer tutors found</h3>
                    <p class="text-xs text-slate-400">Try adjusting your search query or selecting "All Departments".</p>
                </div>
            `;
            return;
        }

        peersGrid.innerHTML = peers.map(peer => {
            const subjects = (peer.teachable_subjects || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const badges = subjects.map(s =>
                `<span class="px-2.5 py-1 text-xs rounded-lg bg-slate-950/80 text-slate-300 border border-slate-800 font-medium">${escapeHtml(s)}</span>`
            ).join('');

            return `
                <div class="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col justify-between shadow-lg">
                    <div>
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <h3 class="font-bold text-white text-base">${escapeHtml(peer.name)}</h3>
                                <p class="text-xs text-slate-400 font-medium">${escapeHtml(peer.department)} • Sem ${Number(peer.semester)}</p>
                            </div>
                            <div class="flex items-center gap-1 bg-amber-950/60 border border-amber-800/50 text-amber-300 px-2 py-1 rounded-lg text-xs font-semibold shrink-0">
                                ★ ${parseFloat(peer.average_rating).toFixed(2)}
                                <span class="text-slate-400 text-[10px] font-normal">(${Number(peer.total_reviews)})</span>
                            </div>
                        </div>

                        ${peer.bio ? `<p class="text-xs text-slate-300 line-clamp-2 mb-3.5 leading-relaxed">${escapeHtml(peer.bio)}</p>` : ''}

                        <div class="mb-4">
                            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Teaches:</span>
                            <div class="flex flex-wrap gap-1.5">
                                ${badges || '<span class="text-xs text-slate-500">No subjects listed</span>'}
                            </div>
                        </div>

                        <div class="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-5">
                            <span class="font-medium text-slate-300">Availability:</span> ${escapeHtml(peer.availability || 'Flexible')}
                        </div>
                    </div>

                    <button
                        type="button"
                        data-book-peer-id="${Number(peer.id)}"
                        class="book-peer-btn w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                        Book Study Session (10 pts)
                    </button>
                </div>
            `;
        }).join('');

        peersGrid.querySelectorAll('.book-peer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const peerId = Number(btn.getAttribute('data-book-peer-id'));
                const peer = latestPeers.find(p => Number(p.id) === peerId);
                if (peer) openBookingModal(peer);
            });
        });
    }

    function openBookingModal(peer) {
        if (!modal || !modalTutor || !modalTutorId || !modalSubject) return;

        modalTutor.textContent = `Tutor: ${peer.name} (${peer.department})`;
        modalTutorId.value = String(peer.id);

        const rawOptions = (peer.teachable_skill_options || '').split('||').filter(Boolean);
        if (rawOptions.length > 0) {
            modalSubject.innerHTML = rawOptions.map(item => {
                const [id, label] = item.split('::');
                return `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`;
            }).join('');
        }

        if (bookingError) bookingError.classList.add('hidden');
        modal.classList.remove('hidden');
    }

    function closeBookingModal() {
        if (modal) modal.classList.add('hidden');
    }

    document.querySelectorAll('[data-close-booking]').forEach(el => {
        el.addEventListener('click', closeBookingModal);
    });

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (bookingError) bookingError.classList.add('hidden');

            const formData = new FormData(bookingForm);
            formData.set('csrf_token', csrfToken);

            try {
                const res = await fetch(`${apiBase}/book_session.php`, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': csrfToken
                    },
                    body: formData
                });
                const json = await res.json();

                if (!res.ok || json.status !== 'success') {
                    if (bookingError) {
                        bookingError.textContent = json.message || 'Could not submit booking.';
                        bookingError.classList.remove('hidden');
                    }
                    return;
                }

                closeBookingModal();
                bookingForm.reset();
                if (toastBanner) {
                    toastBanner.textContent = json.message;
                    toastBanner.classList.remove('hidden');
                    setTimeout(() => toastBanner.classList.add('hidden'), 5000);
                }
            } catch {
                if (bookingError) {
                    bookingError.textContent = 'Network error while booking session.';
                    bookingError.classList.remove('hidden');
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchPeers, 280);
        });
    }

    if (deptFilter) {
        deptFilter.addEventListener('change', fetchPeers);
    }

    fetchPeers();
});

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
