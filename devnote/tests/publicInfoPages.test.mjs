import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const footerSource = await readFile(
  new URL('../src/components/layout/Footer.tsx', import.meta.url),
  'utf8',
);
const aboutSource = await readFile(new URL('../src/pages/AboutPage.tsx', import.meta.url), 'utf8');
const contactSource = await readFile(
  new URL('../src/pages/ContactPage.tsx', import.meta.url),
  'utf8',
);
const guestbookSource = await readFile(
  new URL('../src/pages/GuestbookPage.tsx', import.meta.url),
  'utf8',
);

assert.match(appSource, /path="\/about" element={<AboutPage \/>}/);
assert.match(appSource, /path="\/contact" element={<ContactPage \/>}/);
assert.match(appSource, /path="\/guestbook" element={<GuestbookPage \/>}/);
assert.match(footerSource, /소개 \(About\)', to: '\/about'/);
assert.match(footerSource, /문의 \(Contact\)', to: '\/contact'/);
assert.match(footerSource, /방명록', to: '\/guestbook'/);

assert.match(aboutSource, /이 블로그에서 다루는 것/);
assert.match(aboutSource, /기록의 원칙/);
assert.match(aboutSource, /getPosts/);
assert.match(aboutSource, /buildAboutStats/);
assert.match(contactSource, /문의 보내기/);
assert.match(contactSource, /평균 2~3일 이내/);
assert.match(guestbookSource, /따뜻한 한마디를 남겨주세요/);
assert.match(guestbookSource, /관리자/);
