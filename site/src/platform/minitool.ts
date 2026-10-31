// Keep legacy helpers ahead of dynamically loaded shared Tarot content chunks.
import './minitoolCompat';
void import('./minitoolApp').catch(() => {
  const root = document.getElementById('minitool');
  if (root) root.textContent = '猫牌暂时没有加载好，请重新打开。';
});
