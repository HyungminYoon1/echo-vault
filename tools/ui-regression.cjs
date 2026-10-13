async (page) => {
  if (!new URL(page.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) throw Error('Loopback only');
  await page.reload();
  await page.locator('#intro').click();
  await page.locator('#board').focus();
  for (const key of ['ArrowUp','ArrowUp','r','ArrowRight','ArrowUp','ArrowRight','ArrowRight','ArrowRight','ArrowRight']) await page.keyboard.press(key);
  if (await page.locator('#result-title').textContent() !== '탈출 성공') throw Error('Intro must really finish');
  if (!await page.locator('#hint').isDisabled()) throw Error('REGRESSION: hint still accepts input after victory');
  console.log('PASS: actual intro 6 beats/2730; terminal hint locked');
}
