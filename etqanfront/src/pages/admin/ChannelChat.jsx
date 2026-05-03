import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, resolveMediaUrl } from '../../api';
import { useSocket } from '../../context/SocketContext';

export default function AdminChannelChat() {
  const { channelId } = useParams();
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

  const [channel, setChannel] = useState(null);
  const [channelError, setChannelError] = useState('');

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgError, setMsgError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const loadChannelMeta = useCallback(async () => {
    if (!channelId) return;
    setChannelError('');
    const { res, data } = await get(`/channels/${encodeURIComponent(channelId)}`);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok || data?.success === false) {
      setChannel(null);
      setChannelError(data?.message || t('loadError'));
      return;
    }
    const ch = data.data ?? data;
    setChannel(ch);
  }, [channelId, navigate, t]);

  const loadMessages = useCallback(async () => {
    if (!channelId) return;
    setMsgLoading(true);
    setMsgError('');
    const { res, data } = await get(
      `/channels/${encodeURIComponent(channelId)}/messages?limit=100`
    );
    if (res.status === 401) {
      navigate('/login', { replace: true });
      setMsgLoading(false);
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
  }, [channelId, navigate, t]);

  useEffect(() => {
    loadChannelMeta();
  }, [loadChannelMeta]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket || !connected || !channelId) return undefined;
    socket.emit('join:channel', channelId);
    const onChannelMsg = ({ channelId: cid, message }) => {
      if (cid !== channelId || !message?.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };
    socket.on('channel:message', onChannelMsg);
    return () => {
      socket.emit('leave:channel', channelId);
      socket.off('channel:message', onChannelMsg);
    };
  }, [socket, connected, channelId]);

  const channelTitle = useMemo(() => {
    if (!channel) return '';
    return lang === 'ar'
      ? channel.nameAr || channel.nameIt || channel.name || '—'
      : lang === 'it'
        ? channel.nameIt || channel.name || channel.nameAr || '—'
        : channel.name || channel.nameAr || channel.nameIt || '—';
  }, [channel, lang]);

  const submitMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !channelId || sending) return;
    setSending(true);
    setDraft('');
    setMsgError('');
    const { res, data } = await post(
      `/channels/${encodeURIComponent(channelId)}/messages`,
      { content: text }
    );
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
  };

  if (!channelId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-red-600 text-sm">{t('loadError')}</p>
        <Link to="/admin/channels" className="text-primary-600 underline text-sm mt-2 inline-block">
          {t('channelsOpenChatBack')}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col min-h-[calc(100vh-5rem)] max-w-4xl mx-auto">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/admin/channels"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block"
          >
            ← {t('channelsOpenChatBack')}
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{channelTitle || t('channels')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('channelChatStaffDesc')}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {connected
              ? lang === 'ar'
                ? 'متصل بالتحديثات الفورية'
                : lang === 'it'
                  ? 'Socket connesso'
                  : 'Live updates connected'
              : lang === 'ar'
                ? 'بانتظار الاتصال…'
                : lang === 'it'
                  ? 'Connessione…'
                  : 'Connecting…'}
          </p>
        </div>
      </div>

      {channelError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {channelError}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-[420px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80 dark:bg-slate-900/40 min-h-[280px]">
          {msgLoading ? (
            <div className="text-center text-slate-500 py-12">{t('loading')}</div>
          ) : (
            <>
              {msgError && (
                <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-700 text-xs">{msgError}</div>
              )}
              {messages.length === 0 && !msgError && (
                <p className="text-center text-slate-400 text-sm py-8">
                  {lang === 'ar'
                    ? 'لا رسائل بعد في هذه القناة.'
                    : lang === 'it'
                      ? 'Nessun messaggio in questo canale.'
                      : 'No messages in this channel yet.'}
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
                          {m.sender?.name || m.sender?.email || '—'}
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
                          {m.attachmentName || (lang === 'ar' ? 'مرفق' : lang === 'it' ? 'Allegato' : 'Attachment')}
                        </a>
                      )}
                      <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString(
                              lang === 'ar' ? 'ar-EG' : lang === 'it' ? 'it-IT' : 'en'
                            )
                          : ''}
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
            placeholder={
              lang === 'ar' ? 'اكتب رسالة في القناة…' : lang === 'it' ? 'Messaggio nel canale…' : 'Write a channel message…'
            }
            rows={2}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm resize-none"
            disabled={msgLoading || sending || !!channelError}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || msgLoading || !!channelError}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 self-end shrink-0"
          >
            {lang === 'ar' ? 'إرسال' : lang === 'it' ? 'Invia' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
