import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, resolveMediaUrl } from '../../api';
import { useSocket } from '../../context/SocketContext';

/** API: prefer isPremiumActive; else derive from subscription (Premium + endsAt). */
function isPatientPremium(patient) {
  if (!patient) return false;
  if (typeof patient.isPremiumActive === 'boolean') return patient.isPremiumActive;
  const sub = patient.subscription;
  if (!sub || sub.plan !== 'PREMIUM') return false;
  if (sub.endsAt == null) return true;
  return new Date(sub.endsAt) > new Date();
}

function PatientPremiumIcon({ premium, labelSubscribed = '', labelNotSubscribed = '' }) {
  const title = premium ? labelSubscribed : labelNotSubscribed;
  if (premium) {
    return (
      <span className="inline-flex shrink-0" title={title} aria-label={title}>
        <svg className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 15l-5.878 3.09 1.123-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.757 4.635 1.123 6.545z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0" title={title} aria-label={title}>
      <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M4.93 4.93l14.14 14.14" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function DoctorChat() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const myUserId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}').id;
    } catch {
      return '';
    }
  }, []);

  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [assignedPatients, setAssignedPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [startBusy, setStartBusy] = useState(false);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const scrollRef = useRef(null);
  const patientPickerRef = useRef(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) || null;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const loadConversations = useCallback(
    async (opts = {}) => {
      const preferredSelectId = opts.preferredSelectId;
      setListLoading(true);
      setListError('');
      const { res, data } = await get('/chat/conversations');
      if (res.status === 401) {
        navigate('/login', { replace: true });
        setListLoading(false);
        return;
      }
      if (!res.ok || data?.success === false) {
        setListError(data?.message || t('loadError'));
        setConversations([]);
        setListLoading(false);
        return;
      }
      const d = data.data || data;
      const items = d.items || [];
      setConversations(items);
      setListLoading(false);
      setSelectedId((prev) => {
        if (preferredSelectId && items.some((c) => c.id === preferredSelectId)) return preferredSelectId;
        if (prev && items.some((c) => c.id === prev)) return prev;
        return items[0]?.id ?? null;
      });
    },
    [navigate, t]
  );

  const loadAssignedPatients = useCallback(async () => {
    setPatientsLoading(true);
    const { res, data } = await get('/doctors/me/patients?limit=500');
    if (res.status === 401) {
      navigate('/login', { replace: true });
      setPatientsLoading(false);
      return;
    }
    if (res.ok && data?.success !== false) {
      const d = data.data || data;
      const items = d.items || [];
      const sorted = [...items].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      setAssignedPatients(sorted);
    } else {
      setAssignedPatients([]);
    }
    setPatientsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadAssignedPatients();
  }, [loadAssignedPatients]);

  useEffect(() => {
    if (!patientPickerOpen) return undefined;
    const onDocDown = (e) => {
      if (patientPickerRef.current && !patientPickerRef.current.contains(e.target)) {
        setPatientPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [patientPickerOpen]);

  const premiumLabels = useMemo(
    () => ({ yes: t('doctorChatPatientPremium'), no: t('doctorChatPatientFree') }),
    [t]
  );

  const startChatWithPatient = async (patientUserId) => {
    if (!patientUserId || startBusy) return;
    setStartBusy(true);
    setPatientPickerOpen(false);
    setListError('');
    const { res, data } = await post(`/doctors/me/patients/${patientUserId}/conversation`, {});
    setStartBusy(false);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok || data?.success === false) {
      setListError(data?.message || t('loadError'));
      return;
    }
    const conv = data.data;
    await loadConversations({ preferredSelectId: conv?.id });
  };

  const loadMessages = useCallback(
    async (convId) => {
      if (!convId) {
        setMessages([]);
        return;
      }
      setMsgLoading(true);
      setMsgError('');
      const { res, data } = await get(`/chat/conversations/${convId}/messages?limit=100`);
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok || data?.success === false) {
        setMessages([]);
        setMsgError(data?.message || t('loadError'));
      } else {
        const d = data.data || data;
        setMessages(Array.isArray(d.items) ? d.items : []);
      }
      setMsgLoading(false);
    },
    [navigate, t]
  );

  useEffect(() => {
    loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket || !connected) return;
    const onChat = ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx < 0) {
          loadConversations();
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], updatedAt: message.createdAt || new Date().toISOString() };
        next.sort(
          (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
        return next;
      });
      if (conversationId === selectedId && message?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };
    socket.on('chat:message', onChat);
    return () => socket.off('chat:message', onChat);
  }, [socket, connected, selectedId, loadConversations]);

  const submitMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setDraft('');
    const { res, data } = await post(`/chat/conversations/${selectedId}/messages`, { content: text });
    setSending(false);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok || data?.success === false) {
      setMsgError(data?.message || t('loadError'));
      return;
    }
    const payload = data.data;
    if (payload?.removed) return;
    if (payload?.id) {
      setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
    }
    loadConversations();
  };

  const title = t('doctorChat');
  const desc = t('doctorChatPageDesc');
  const pickHint = t('doctorChatPickPatient');
  const noConvsMsg =
    lang === 'ar'
      ? 'لا محادثات بعد. ابدأ باختيار مريض من القائمة أعلاه.'
      : lang === 'it'
        ? 'Nessuna chat. Inizia scegliendo un paziente sopra.'
        : 'No chats yet. Start by choosing a patient above.';

  return (
    <div className="p-6 md:p-8 flex flex-col min-h-[calc(100vh-5rem)] max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{desc}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
          {connected
            ? lang === 'ar'
              ? 'متصل بالتحديثات الفورية'
              : lang === 'it'
                ? 'Socket connesso'
                : 'Live updates connected'
            : lang === 'ar'
              ? 'بانتظار الاتصال…'
              : lang === 'it'
                ? 'Connessione in corso…'
                : 'Connecting…'}
        </p>
      </div>

      {listError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {listError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-[420px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        {/* قائمة المحادثات */}
        <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-600 flex flex-col max-h-[40vh] lg:max-h-none">
          <div className="p-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50/90 dark:bg-slate-900/30" ref={patientPickerRef}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              {t('doctorChatStartWith')}
            </label>
            <div className="relative">
              <button
                type="button"
                id="doctor-chat-start-patient"
                disabled={patientsLoading || startBusy || assignedPatients.length === 0}
                aria-expanded={patientPickerOpen}
                aria-haspopup="listbox"
                aria-label={t('doctorChatOpenPatientPicker')}
                onClick={() => setPatientPickerOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 text-start disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="truncate">{t('doctorChatPickPatient')}</span>
                <svg className={`w-4 h-4 shrink-0 transition-transform ${patientPickerOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {patientPickerOpen && !patientsLoading && assignedPatients.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
                >
                  {assignedPatients.map((p) => {
                    const prem = isPatientPremium(p);
                    return (
                      <li key={p.id} role="option">
                        <button
                          type="button"
                          disabled={startBusy}
                          onClick={() => startChatWithPatient(p.id)}
                          className="w-full px-3 py-2 flex items-center gap-2 text-start hover:bg-slate-100 dark:hover:bg-slate-700/80 disabled:opacity-50 text-sm text-slate-800 dark:text-slate-100"
                        >
                          <PatientPremiumIcon
                            premium={prem}
                            labelSubscribed={premiumLabels.yes}
                            labelNotSubscribed={premiumLabels.no}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-medium truncate block">
                              {p.name || p.email || p.id}
                              {p.isActive === false
                                ? ` (${lang === 'ar' ? 'غير نشط' : lang === 'it' ? 'inattivo' : 'inactive'})`
                                : ''}
                            </span>
                            {p.email && p.name && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{p.email}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {patientsLoading && (
              <p className="text-[11px] text-slate-500 mt-1">{t('loading')}</p>
            )}
            {!patientsLoading && assignedPatients.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                {lang === 'ar' ? 'لا مرضى معيَّنين لك حالياً.' : lang === 'it' ? 'Nessun paziente assegnato.' : 'No patients assigned to you.'}
              </p>
            )}
          </div>
          <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-600">
            {t('doctorChatSidebarTitle')}
          </div>
          <div className="overflow-y-auto flex-1">
            {listLoading ? (
              <div className="p-6 text-center text-slate-500">{t('loading')}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">{noConvsMsg}</div>
            ) : (
              conversations.map((c) => {
                const patient = c.patient;
                const active = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-start px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                      active ? 'bg-primary-50 dark:bg-primary-900/25 border-s-4 border-s-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <PatientPremiumIcon
                        premium={isPatientPremium(patient)}
                        labelSubscribed={premiumLabels.yes}
                        labelNotSubscribed={premiumLabels.no}
                      />
                      <span className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{patient?.name || '—'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{patient?.email || ''}</p>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* منطقة الرسائل */}
        <main className="flex-1 flex flex-col min-h-[320px]">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm p-8">
              {pickHint}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 shrink-0">
                <div className="flex gap-2 items-start">
                  <PatientPremiumIcon
                    premium={isPatientPremium(selectedConv.patient)}
                    labelSubscribed={premiumLabels.yes}
                    labelNotSubscribed={premiumLabels.no}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{selectedConv.patient?.name || '—'}</p>
                    <p className="text-xs text-slate-500 truncate">{selectedConv.patient?.email}</p>
                  </div>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80 dark:bg-slate-900/40"
              >
                {msgLoading ? (
                  <div className="text-center text-slate-500 py-12">{t('loading')}</div>
                ) : (
                  <>
                    {msgError && (
                      <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 text-xs">{msgError}</div>
                    )}
                    {messages.length === 0 && !msgError && (
                      <p className="text-center text-slate-400 text-sm py-8">
                        {lang === 'ar' ? 'لا رسائل بعد. اكتب رسالتك الأولى.' : lang === 'it' ? 'Nessun messaggio.' : 'No messages yet. Say hello.'}
                      </p>
                    )}
                    {messages.map((m) => {
                      const mine = m.senderId === myUserId || m.sender?.id === myUserId;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                              mine
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            {!mine && (
                              <p className="text-[10px] opacity-75 mb-1 font-medium">
                                {m.sender?.name || (lang === 'ar' ? 'مريض' : 'Patient')}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            {m.attachmentUrl && (
                              <a
                                href={resolveMediaUrl(m.attachmentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs underline mt-1 block ${mine ? 'text-white/90' : 'text-primary-600'}`}
                              >
                                {m.attachmentName || (lang === 'ar' ? 'مرفق' : 'Attachment')}
                              </a>
                            )}
                            <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                              {m.createdAt ? new Date(m.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : lang === 'it' ? 'it-IT' : 'en') : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <form
                onSubmit={submitMessage}
                className="p-3 border-t border-slate-200 dark:border-slate-600 flex gap-2 shrink-0 bg-white dark:bg-slate-800"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب رسالة…' : lang === 'it' ? 'Scrivi un messaggio…' : 'Write a message…'}
                  rows={2}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm resize-none"
                  disabled={msgLoading || sending}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending || msgLoading}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 self-end shrink-0"
                >
                  {lang === 'ar' ? 'إرسال' : lang === 'it' ? 'Invia' : 'Send'}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
