import { test } from 'node:test';
import assert from 'node:assert/strict';
import { particle, withBatchim, formalStem, conjugate, romanize, hasBatchim } from '../js/hangul.js';

test('particules selon la consonne finale', () => {
  assert.equal(particle('사과', '을', '를'), '사과를');
  assert.equal(particle('빵', '을', '를'), '빵을');
  assert.equal(particle('저', '은', '는'), '저는');
  assert.equal(particle('날씨', '이', '가'), '날씨가');
  assert.equal(hasBatchim('책'), true);
});

test('radicaux et batchim', () => {
  assert.equal(withBatchim('먹어', 'ㅆ'), '먹었');
  assert.equal(withBatchim('가', 'ㅆ'), '갔');
  assert.equal(formalStem('먹'), '먹습');
  assert.equal(formalStem('가'), '갑');
  assert.equal(formalStem('만들'), '만듭');
});

test('conjugaisons', () => {
  const eat = { stem: '먹', a: '먹어', f: '먹을' };
  const go = { stem: '가', a: '가', f: '갈' };
  const make = { stem: '만들', a: '만들어', f: '만들' };
  const listen = { stem: '듣', a: '들어', f: '들을' };
  assert.equal(conjugate(eat, 'present', 'polite'), '먹어요.');
  assert.equal(conjugate(eat, 'past', 'polite'), '먹었어요.');
  assert.equal(conjugate(eat, 'future', 'polite'), '먹을 거예요.');
  assert.equal(conjugate(eat, 'present', 'formal'), '먹습니다.');
  assert.equal(conjugate(eat, 'present', 'formal', true), '먹습니까?');
  assert.equal(conjugate(eat, 'past', 'formal'), '먹었습니다.');
  assert.equal(conjugate(go, 'present', 'formal'), '갑니다.');
  assert.equal(conjugate(go, 'past', 'casual'), '갔어.');
  assert.equal(conjugate(go, 'future', 'casual', true), '갈 거야?');
  assert.equal(conjugate(make, 'present', 'formal'), '만듭니다.');
  assert.equal(conjugate(make, 'future', 'polite'), '만들 거예요.');
  assert.equal(conjugate(listen, 'past', 'polite'), '들었어요.');
  assert.equal(conjugate(listen, 'present', 'formal'), '듣습니다.');
});

test('romanisation révisée', () => {
  const cases = {
    한국어: 'hangugeo', 감사합니다: 'gamsahamnida', 먹었어요: 'meogeosseoyo', 좋아요: 'joayo', 읽어요: 'ilgeoyo',
    맛있어요: 'masisseoyo', 신라: 'silla', 좋다: 'jota', 학교에: 'hakgyoe', 라면: 'ramyeon', 사랑해요: 'saranghaeyo',
  };
  for (const [kr, rom] of Object.entries(cases)) assert.equal(romanize(kr), rom, kr);
});
