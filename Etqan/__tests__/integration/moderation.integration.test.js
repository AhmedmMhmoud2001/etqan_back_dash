const request = require('supertest');
const app = require('../../src/app');

const API = '/api';

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Moderation: reject unsafe community/chat/channel content', () => {
  let patientToken;
  let channelId;
  let conversationId;

  beforeAll(async () => {
    const login = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send({ email: 'patient2@etqan.com', password: 'User@123' });
    expect(login.status).toBe(200);
    patientToken = login.body?.data?.token ?? login.body?.token;
    expect(patientToken).toBeDefined();

    const upgrade = await request(app)
      .post(`${API}/subscription/upgrade`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ durationMonths: 1 });
    expect(upgrade.status).toBe(200);

    const channelsRes = await request(app).get(`${API}/channels`);
    expect(channelsRes.status).toBe(200);
    const data = channelsRes.body?.data ?? {};
    const list = data.items ?? data ?? [];
    const channelList = Array.isArray(list) ? list : [];
    expect(channelList.length).toBeGreaterThan(0);
    channelId = channelList[0].id;

    const convRes = await request(app)
      .get(`${API}/chat/conversations/me`)
      .set(authHeader(patientToken));
    expect(convRes.status).toBe(200);
    conversationId = (convRes.body?.data ?? convRes.body)?.id;
    expect(conversationId).toBeDefined();
  });

  it('blocks and does not store a channel message containing URL', async () => {
    const bad = 'check this out https://example.com';
    const send = await request(app)
      .post(`${API}/channels/${channelId}/messages`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: bad });
    expect(send.status).toBe(200);
    expect(send.body?.data?.removed ?? send.body?.removed).toBe(true);

    const list = await request(app)
      .get(`${API}/channels/${channelId}/messages?limit=50`)
      .set(authHeader(patientToken));
    expect(list.status).toBe(200);
    const items = (list.body?.data?.items ?? list.body?.items ?? []);
    const msgs = Array.isArray(items) ? items : [];
    expect(msgs.some((m) => m?.content === bad)).toBe(false);
  });

  it('blocks and does not store a chat message containing email', async () => {
    const bad = 'my email is test@example.com';
    const send = await request(app)
      .post(`${API}/chat/conversations/${conversationId}/messages`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: bad });
    expect(send.status).toBe(200);
    expect(send.body?.data?.removed ?? send.body?.removed).toBe(true);

    const list = await request(app)
      .get(`${API}/chat/conversations/${conversationId}/messages?limit=50`)
      .set(authHeader(patientToken));
    expect(list.status).toBe(200);
    const items = (list.body?.data?.items ?? list.body?.items ?? []);
    const msgs = Array.isArray(items) ? items : [];
    expect(msgs.some((m) => m?.content === bad)).toBe(false);
  });

  it('blocks and does not create a community post containing phone number', async () => {
    const bad = 'call me at +20 010 1234 5678';
    const create = await request(app)
      .post(`${API}/community/posts`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: bad });
    expect(create.status).toBe(200);
    expect(create.body?.data?.removed ?? create.body?.removed).toBe(true);

    const feed = await request(app).get(`${API}/community/posts?limit=50`);
    expect(feed.status).toBe(200);
    const items = feed.body?.data?.items ?? feed.body?.items ?? [];
    const posts = Array.isArray(items) ? items : [];
    expect(posts.some((p) => p?.content === bad)).toBe(false);
  });

  it('blocks and does not create a community comment containing profanity', async () => {
    // create a clean post first
    const postRes = await request(app)
      .post(`${API}/community/posts`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: 'Clean post for moderation test' });
    expect([200, 201].includes(postRes.status)).toBe(true);
    const post = postRes.body?.data ?? postRes.body;
    expect(post?.id).toBeDefined();

    const badComment = 'you are an asshole';
    const commentRes = await request(app)
      .post(`${API}/community/posts/${post.id}/comments`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: badComment });
    expect(commentRes.status).toBe(200);
    expect(commentRes.body?.data?.removed ?? commentRes.body?.removed).toBe(true);

    const list = await request(app).get(`${API}/community/posts/${post.id}/comments?limit=50`);
    expect(list.status).toBe(200);
    const comments = list.body?.data?.items ?? list.body?.items ?? [];
    const arr = Array.isArray(comments) ? comments : [];
    expect(arr.some((c) => c?.content === badComment)).toBe(false);
  });

  it('deletes a post if updated with unsafe content', async () => {
    const postRes = await request(app)
      .post(`${API}/community/posts`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: 'Post to be updated' });
    expect([200, 201].includes(postRes.status)).toBe(true);
    const post = postRes.body?.data ?? postRes.body;
    expect(post?.id).toBeDefined();

    const update = await request(app)
      .patch(`${API}/community/posts/${post.id}`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: 'visit www.example.com now' });
    expect(update.status).toBe(200);
    expect(update.body?.data?.removed ?? update.body?.removed).toBe(true);

    const get = await request(app).get(`${API}/community/posts/${post.id}`);
    expect(get.status).toBe(404);
  });
});

