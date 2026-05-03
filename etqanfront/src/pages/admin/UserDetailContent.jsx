/**
 * محتوى عرض تفاصيل مستخدم أدمن (صفحة مستقلة أو سابقاً كان مودال)
 */
function fmtMeasure(v, suffix = '') {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return `${Number.isInteger(n) ? String(n) : n.toFixed(1)}${suffix}`;
}

const MEASUREMENT_METRIC_KEYS = ['weight', 'bodyFat', 'muscleMass', 'water', 'waist'];

function suffixForMeasurementKey(key) {
  if (key === 'weight' || key === 'muscleMass') return ' kg';
  if (key === 'bodyFat' || key === 'water') return '%';
  if (key === 'waist') return ' cm';
  return '';
}

function measurementMetricLabel(lang, key) {
  const ar = { weight: 'الوزن', bodyFat: 'نسبة الدهون', muscleMass: 'كتلة العضلات', water: 'نسبة الماء', waist: 'الخصر' };
  const it = { weight: 'Peso', bodyFat: 'Grasso corp. %', muscleMass: 'Massa musc.', water: 'Acqua %', waist: 'Vita' };
  const en = { weight: 'Weight', bodyFat: 'Body fat %', muscleMass: 'Muscle mass', water: 'Water %', waist: 'Waist' };
  if (lang === 'ar') return ar[key] || key;
  if (lang === 'it') return it[key] || key;
  return en[key] || key;
}

function fmtDelta(delta, suf) {
  if (delta == null || Number.isNaN(Number(delta))) return '—';
  const n = Number(delta);
  const sign = n > 0 ? '+' : '';
  const body = Number.isInteger(n) ? `${n}` : n.toFixed(1);
  return `${sign}${body}${suf}`;
}

function fmtProgressPct(p) {
  if (p == null || Number.isNaN(Number(p))) return '—';
  return `${Number(p).toFixed(1)}%`;
}

export default function UserDetailContent({ userDetails, workoutSessions, measurements = [], lang, t }) {
  const lc = lang === 'ar' ? 'ar-EG' : lang === 'it' ? 'it-IT' : 'en-US';
  const mp = userDetails.measurementProgress;
  const measurementsTitle =
    lang === 'ar' ? 'سجل القياسات' : lang === 'it' ? 'Registro misurazioni' : 'Measurement history';
  const measurementsEmpty =
    lang === 'ar' ? 'لا توجد قياسات مسجّلة لهذا العميل.' : lang === 'it' ? 'Nessuna misurazione registrata.' : 'No measurements recorded for this client.';
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">
          {lang === 'ar' ? 'بيانات الحساب' : 'Account info'}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('name')}</p><p className="text-slate-800 dark:text-slate-100 font-medium">{userDetails.name}</p></div>
          <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('email')}</p><p className="text-slate-800 dark:text-slate-100 break-all">{userDetails.email}</p></div>
          <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('role')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.role}</p></div>
          <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('status')}</p>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${userDetails.isActive !== false ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
              {userDetails.isActive !== false ? t('active') : t('inactive')}
            </span>
          </div>
          {userDetails.emailVerified != null && (
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'البريد موثّق' : 'Email verified'}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.emailVerified ? (lang === 'ar' ? 'نعم' : 'Yes') : (lang === 'ar' ? 'لا' : 'No')}</p></div>
          )}
          {userDetails.createdAt && (
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</p><p className="text-slate-600 dark:text-slate-300">{new Date(userDetails.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en')}</p></div>
          )}
          {userDetails.updatedAt && (
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'آخر تحديث' : 'Updated'}</p><p className="text-slate-600 dark:text-slate-300">{new Date(userDetails.updatedAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en')}</p></div>
          )}
        </div>
      </section>

      {userDetails.stats && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">
            {lang === 'ar' ? 'إحصائيات ونسبة التطور' : 'Progress & Statistics'}
          </h3>
          <div className="space-y-4">
            {(() => {
              const target = userDetails.profile?.targetWeight;
              const latest = userDetails.stats.latestWeight ?? userDetails.profile?.weight;
              const start = userDetails.stats.firstWeight ?? userDetails.profile?.weight;
              const goal = userDetails.profile?.goal;
              let progressPct = null;
              if (target != null && latest != null && start != null && goal) {
                if (goal === 'LOSE_WEIGHT' && start > target) {
                  progressPct = Math.min(100, Math.max(0, ((start - latest) / (start - target)) * 100));
                } else if (goal === 'BUILD_MUSCLE' && target > start) {
                  progressPct = Math.min(100, Math.max(0, ((latest - start) / (target - start)) * 100));
                } else if (goal === 'MAINTAIN' && target > 0) {
                  const diff = Math.abs(latest - target);
                  progressPct = diff <= 2 ? 100 : Math.max(0, 100 - diff * 10);
                }
              }
              return progressPct != null ? (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'نسبة التطور (الوزن)' : 'Weight progress'}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{Math.round(progressPct)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${Math.round(progressPct)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {start != null && `${lang === 'ar' ? 'البداية' : 'Start'}: ${start} kg`}
                    {latest != null && ` → ${lang === 'ar' ? 'الحالي' : 'Current'}: ${latest} kg`}
                    {target != null && ` → ${lang === 'ar' ? 'الهدف' : 'Target'}: ${target} kg`}
                  </p>
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{userDetails.stats.measurementsCount ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'القياسات' : 'Measurements'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{userDetails.stats.mealLogsCount ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'سجلات الوجبات' : 'Meal logs'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{userDetails.stats.workoutSessionsCount ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'جلسات التمرين' : 'Workout sessions'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{userDetails.stats.nutritionPlansCount ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'خطط التغذية' : 'Nutrition plans'}</p>
              </div>
            </div>
            {userDetails.stats.latestMeasuredAt && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'آخر قياس' : 'Last measurement'}: {new Date(userDetails.stats.latestMeasuredAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en')}
                {userDetails.stats.latestBodyFat != null && ` • ${lang === 'ar' ? 'دهون' : 'Body fat'}: ${userDetails.stats.latestBodyFat}%`}
                {userDetails.stats.latestWaist != null && ` • ${lang === 'ar' ? 'خصر' : 'Waist'}: ${userDetails.stats.latestWaist} cm`}
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">
          {lang === 'ar'
            ? 'القياسات المرجعية (البداية) والهدف'
            : lang === 'it'
              ? 'Baseline (inizio) e obiettivo'
              : 'Baseline & target measurements'}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/80 dark:bg-slate-700/20">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300 mb-3">
              {lang === 'ar' ? 'قياس البداية (خط الأساس)' : lang === 'it' ? 'Baseline (inizio)' : 'Baseline (start)'}
            </h4>
            {!mp?.baseline ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'لم يُحفَظ خط الأساس لهذا العميل.' : lang === 'it' ? 'Nessuna baseline salvata.' : 'No baseline saved for this client.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {MEASUREMENT_METRIC_KEYS.map((key) => {
                  const suf = suffixForMeasurementKey(key);
                  return (
                    <div key={`b-${key}`}>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{measurementMetricLabel(lang, key)}</p>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{fmtMeasure(mp.baseline[key], suf)}</p>
                    </div>
                  );
                })}
                {mp.baseline.updatedAt && (
                  <div className="col-span-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-600">
                    {lang === 'ar' ? 'آخر تحديث للخط المرجعي' : lang === 'it' ? 'Agg. baseline' : 'Baseline updated'}:{' '}
                    {new Date(mp.baseline.updatedAt).toLocaleString(lc)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-emerald-50/50 dark:bg-emerald-900/15">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300 mb-3">
              {lang === 'ar' ? 'القياسات المستهدفة' : lang === 'it' ? 'Obiettivo (target)' : 'Target (goal)'}
            </h4>
            {!mp?.goal ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'لم يُحفَظ الهدف لهذا العميل.' : lang === 'it' ? 'Nessun obiettivo salvato.' : 'No target saved for this client.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {MEASUREMENT_METRIC_KEYS.map((key) => {
                  const suf = suffixForMeasurementKey(key);
                  return (
                    <div key={`g-${key}`}>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{measurementMetricLabel(lang, key)}</p>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{fmtMeasure(mp.goal[key], suf)}</p>
                    </div>
                  );
                })}
                {mp.goal.updatedAt && (
                  <div className="col-span-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/80 dark:border-slate-600">
                    {lang === 'ar' ? 'آخر تحديث للهدف' : lang === 'it' ? 'Agg. obiettivo' : 'Target updated'}:{' '}
                    {new Date(mp.goal.updatedAt).toLocaleString(lc)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {mp?.current && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">
            <span className="font-medium">{lang === 'ar' ? 'آخر قياس في السجل (للمقارنة)' : lang === 'it' ? 'Ultima misura (serie)' : 'Latest logged measurement'}:</span>{' '}
            {mp.current.measuredAt ? new Date(mp.current.measuredAt).toLocaleString(lc) : '—'}{' '}
            · {fmtMeasure(mp.current.weight, ' kg')}
            {mp.current.bodyFat != null && ` · ${fmtMeasure(mp.current.bodyFat, '%')} ${lang === 'ar' ? 'دهون' : lang === 'it' ? 'grasso' : 'fat'}`}
          </p>
        )}
        {(mp?.baseline || mp?.goal || mp?.current) && mp?.metrics && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {lang === 'ar' ? 'إحصائيات التقدّم مقارنة بالبداية والهدف' : lang === 'it' ? 'Progresso vs baseline e obiettivo' : 'Progress vs baseline & target'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {lang === 'ar'
                ? 'نسبة إنجاز الهدف ≈ (القيمة الحالية − البداية) ÷ (الهدف − البداية). تُعبّأ الخلايا عند توفر خط الأساس والهدف وآخر قياس.'
                : lang === 'it'
                  ? 'Progresso % ≈ (attuale − baseline) ÷ (obiettivo − baseline), se tutti disponibili.'
                  : 'Goal progress % ≈ (current − baseline) ÷ (target − baseline) when baseline, latest reading, and target exist.'}
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
              <table className="w-full text-sm text-start">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                  <tr>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'المؤشر' : lang === 'it' ? 'Indicatore' : 'Metric'}</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'البداية' : lang === 'it' ? 'Inizio' : 'Baseline'}</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'آخر قياس' : lang === 'it' ? 'Ultimo' : 'Latest'}</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'الهدف' : lang === 'it' ? 'Obiettivo' : 'Target'}</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'التغير عن البداية' : lang === 'it' ? 'Δ da inizio' : 'Δ vs baseline'}</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'إنجاز الهدف %' : lang === 'it' ? 'Progresso %' : 'Goal %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {MEASUREMENT_METRIC_KEYS.map((key) => {
                    const row = mp.metrics[key];
                    if (!row) return null;
                    const suf = suffixForMeasurementKey(key);
                    const hasAny = row.start != null || row.current != null || row.goal != null;
                    if (!hasAny) return null;
                    return (
                      <tr key={`mp-${key}`} className="text-slate-800 dark:text-slate-100">
                        <td className="px-3 py-2 whitespace-nowrap font-medium">{measurementMetricLabel(lang, key)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtMeasure(row.start, suf)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtMeasure(row.current, suf)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtMeasure(row.goal, suf)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtDelta(row.deltaFromStart, suf)}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium">{fmtProgressPct(row.progressPercent)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">
          {measurementsTitle}
        </h3>
        {measurements.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{measurementsEmpty}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
            <table className="w-full text-sm text-start">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'التاريخ' : lang === 'it' ? 'Data' : 'Date'}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{t('weight')}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'دهون %' : lang === 'it' ? '% Grasso' : 'Body fat %'}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'عضلات (كجم)' : lang === 'it' ? 'Muscolo (kg)' : 'Muscle (kg)'}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'ماء %' : lang === 'it' ? 'Acqua %' : 'Water %'}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'خصر (سم)' : lang === 'it' ? 'Vita (cm)' : 'Waist (cm)'}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{lang === 'ar' ? 'المصدر' : lang === 'it' ? 'Fonte' : 'Source'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {measurements.map((m) => (
                  <tr key={m.id} className="text-slate-800 dark:text-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {m.measuredAt ? new Date(m.measuredAt).toLocaleString(lc) : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtMeasure(m.weight, ' kg')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtMeasure(m.bodyFat, '%')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtMeasure(m.muscleMass, ' kg')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtMeasure(m.water, '%')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtMeasure(m.waist, ' cm')}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{m.source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {workoutSessions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">{lang === 'ar' ? 'جلسات التمرين — العدات المنفذة' : 'Workout sessions — reps performed'}</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {workoutSessions.map((sess) => (
              <div key={sess.id} className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 bg-slate-50/50 dark:bg-slate-700/30 text-sm">
                <div className="font-medium text-slate-800 dark:text-slate-100 mb-2">
                  {(sess.exercises?.[0]?.exercise
                    ? (lang === 'ar'
                      ? sess.exercises[0].exercise.nameAr || sess.exercises[0].exercise.nameIt || sess.exercises[0].exercise.name
                      : lang === 'it'
                        ? sess.exercises[0].exercise.nameIt || sess.exercises[0].exercise.name || sess.exercises[0].exercise.nameAr
                        : sess.exercises[0].exercise.name || sess.exercises[0].exercise.nameAr || sess.exercises[0].exercise.nameIt)
                    : (lang === 'ar' ? 'جلسة تمرين' : lang === 'it' ? 'Allenamento' : 'Workout'))} — {sess.startedAt ? new Date(sess.startedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'it' ? 'it-IT' : 'en-US') : ''} {sess.status === 'COMPLETED' ? (lang === 'ar' ? '(مكتملة)' : lang === 'it' ? '(completato)' : '(completed)') : ''}
                </div>
                <ul className="space-y-2">
                  {(sess.exercises || []).map((ex) => (
                    <li key={ex.id} className="ps-2 border-s-2 border-primary-400/50">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{lang === 'ar' ? ex.exercise?.nameAr || ex.exercise?.nameIt || ex.exercise?.name : lang === 'it' ? ex.exercise?.nameIt || ex.exercise?.name || ex.exercise?.nameAr : ex.exercise?.name || ex.exercise?.nameAr || ex.exercise?.nameIt}</span>
                      <span className="text-slate-500 dark:text-slate-400 ms-1">({ex.sets} {lang === 'ar' ? 'مجموعات' : 'sets'} × {ex.repMin}-{ex.repMax} {lang === 'ar' ? 'تكرار' : 'reps'})</span>
                      <div className="mt-1 text-slate-600 dark:text-slate-300">
                        {lang === 'ar' ? 'العدات المنفذة' : 'Reps done'}: {(ex.setsLog || []).map((set) => set.actualReps != null ? set.actualReps : '—').join(', ')}
                        {(ex.setsLog || []).length === 0 && '—'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {userDetails.doctor && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">{t('doctor')}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('name')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.doctor.user?.name || '—'}</p></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('email')}</p><p className="text-slate-800 dark:text-slate-100 break-all">{userDetails.doctor.user?.email || '—'}</p></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('title')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.doctor.title || '—'}</p></div>
          </div>
        </section>
      )}

      {userDetails.profile ? (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">{lang === 'ar' ? 'البروفايل والهدف' : 'Profile & goals'}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {userDetails.profile.measurementSystem != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('measurementSystem')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.measurementSystem}</p></div>}
            {userDetails.profile.gender != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('gender')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.gender}</p></div>}
            {userDetails.profile.age != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('age')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.age}</p></div>}
            {userDetails.profile.height != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('height')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.height} cm</p></div>}
            {userDetails.profile.weight != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('weight')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.weight} kg</p></div>}
            {userDetails.profile.targetWeight != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('targetWeight')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.targetWeight} kg</p></div>}
            {userDetails.profile.activityLevel != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('activityLevel')}</p><p className="text-slate-800 dark:text-slate-100">{String(userDetails.profile.activityLevel).replace(/_/g, ' ')}</p></div>}
            {userDetails.profile.goal != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('goal')}</p><p className="text-slate-800 dark:text-slate-100">{String(userDetails.profile.goal).replace(/_/g, ' ')}</p></div>}
            {userDetails.profile.language != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('language')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.language}</p></div>}
            {userDetails.profile.notificationsEnabled != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.notificationsEnabled ? (lang === 'ar' ? 'مفعّلة' : 'On') : (lang === 'ar' ? 'معطّلة' : 'Off')}</p></div>}
            {userDetails.profile.darkMode != null && <div><p className="text-xs text-slate-500 dark:text-slate-400">{t('darkModeLabel')}</p><p className="text-slate-800 dark:text-slate-100">{userDetails.profile.darkMode ? (lang === 'ar' ? 'داكن' : 'Dark') : (lang === 'ar' ? 'فاتح' : 'Light')}</p></div>}
            {userDetails.profile.dietaryPreferences != null && (Array.isArray(userDetails.profile.dietaryPreferences) ? userDetails.profile.dietaryPreferences.length > 0 : true) && (
              <div className="col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">{t('dietaryPreferences')}</p><p className="text-slate-800 dark:text-slate-100">{Array.isArray(userDetails.profile.dietaryPreferences) ? userDetails.profile.dietaryPreferences.join(', ') : String(userDetails.profile.dietaryPreferences)}</p></div>
            )}
            {userDetails.profile.allergies != null && userDetails.profile.allergies?.length !== 0 && (
              <div className="col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">{t('allergies')}</p><p className="text-slate-800 dark:text-slate-100">{Array.isArray(userDetails.profile.allergies) ? userDetails.profile.allergies.join(', ') : String(userDetails.profile.allergies)}</p></div>
            )}
            {userDetails.profile.healthConditions != null && userDetails.profile.healthConditions?.length !== 0 && (
              <div className="col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">{t('healthConditions')}</p><p className="text-slate-800 dark:text-slate-100">{Array.isArray(userDetails.profile.healthConditions) ? userDetails.profile.healthConditions.join(', ') : String(userDetails.profile.healthConditions)}</p></div>
            )}
          </div>
        </section>
      ) : (
        <section>
          <p className="text-sm text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'لا يوجد بروفايل مكتمل لهذا المستخدم.' : 'No profile data for this user.'}</p>
        </section>
      )}
    </div>
  );
}
