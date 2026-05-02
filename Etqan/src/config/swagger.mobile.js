const fullDoc = require('./swagger');

const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);

/**
 * OpenAPI للموبايل (المريض): نفس مسارات الباك اند الظاهرة في واجهة Figma (Etqan Design)،
 * بدون أدمن وبدون عمليات إنشاء/تعديل خطط أو وجبات أو تمارين (للدكتور/الإدارة فقط).
 * التوثيق الكامل مع الأدمن: /api-docs-admin
 */
function buildMobileSwagger(full) {
  const excludedPathPrefixes = ['/admin'];
  const excludedBannersAdmin = ['/banners/admin'];

  const excludedPathsExact = new Set([
    '/nutrition-plan/my-created',
    '/nutrition-plan/patient/{userId}/plans',
    '/nutrition-plan/doctor/{doctorId}/plans',
    '/nutrition-plan',
    '/workout-plan/doctor/{doctorId}/plans',
    '/workout-plan',
    '/doctor-notes',
    '/doctor-notes/patient/{patientId}',
  ]);

  const stripMethodsByPath = {
    '/meals': ['post'],
    '/meals/{id}': ['patch', 'delete'],
    '/exercises': ['post'],
    '/exercises/{id}': ['patch', 'delete'],
    '/nutrition-plan/{id}': ['patch', 'delete'],
    '/workout-plan/{id}': ['patch', 'delete'],
  };

  let paths = { ...(full.paths || {}) };

  paths = Object.fromEntries(
    Object.entries(paths).filter(([p]) => {
      if (excludedPathPrefixes.some((x) => p === x || p.startsWith(`${x}/`))) return false;
      if (excludedBannersAdmin.some((x) => p === x || p.startsWith(`${x}/`))) return false;
      if (excludedPathsExact.has(p)) return false;
      return true;
    })
  );

  for (const [pathKey, toStrip] of Object.entries(stripMethodsByPath)) {
    if (!paths[pathKey]) continue;
    const item = { ...paths[pathKey] };
    for (const m of toStrip) delete item[m];
    const hasOp = Object.keys(item).some((k) => HTTP_VERBS.has(k));
    if (hasOp) paths[pathKey] = item;
    else delete paths[pathKey];
  }

  const excludedTags = new Set(['Admin']);
  for (const pathItem of Object.values(paths)) {
    for (const key of Object.keys(pathItem)) {
      if (!HTTP_VERBS.has(key)) continue;
      const op = pathItem[key];
      if (op && Array.isArray(op.tags)) {
        op.tags = op.tags.filter((t) => !excludedTags.has(t));
      }
    }
  }

  const usedTagNames = new Set();
  for (const pathItem of Object.values(paths)) {
    for (const key of Object.keys(pathItem)) {
      if (!HTTP_VERBS.has(key)) continue;
      const op = pathItem[key];
      if (op && Array.isArray(op.tags)) op.tags.forEach((t) => usedTagNames.add(t));
    }
  }
  const tags = (full.tags || []).filter((t) => usedTagNames.has(t.name));

  return {
    ...full,
    info: {
      ...(full.info || {}),
      title: `${full.info?.title || 'Etqan API'} (Mobile)`,
      description: [
        'Endpoints لتطبيق المريض — متوافقة مع شاشات Figma (رئيسية، تغذية، تمارين، تقدم، مجتمع، ملف، إشعارات، دكتور، إلخ).',
        'لا يشمل لوحة الأدمن أو مسارات الدكتور لإدارة المرضى/الخطط.',
        'Full API + Admin: `/api-docs-admin`',
      ].join(' '),
    },
    tags,
    paths,
  };
}

module.exports = buildMobileSwagger(fullDoc);
