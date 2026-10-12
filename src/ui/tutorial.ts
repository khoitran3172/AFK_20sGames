// Hướng dẫn tân thủ ngắn (~10s): vòng sáng quanh phần tử + bong bóng chữ, tự chuyển bước, chạm để qua nhanh.
import Phaser from 'phaser';
import { button, panel, T } from './kit';
import { t } from '../i18n';

export interface TutStep { x: number; y: number; key: string; r?: number }

export function runTutorial(scene: Phaser.Scene, steps: TutStep[], onEnd: () => void) {
  const D = 9000;
  const layer = scene.add.container(0, 0).setDepth(D);
  const block = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.35).setInteractive();
  layer.add(block);
  let i = -1, timer: Phaser.Time.TimerEvent | null = null, dyn: Phaser.GameObjects.Container | null = null, done = false;
  const end = () => { if (done) return; done = true; timer?.remove(); layer.destroy(true); onEnd(); };

  const show = () => {
    timer?.remove(); dyn?.destroy(true);
    i++;
    if (i >= steps.length) { end(); return; }
    const s = steps[i];
    const c = scene.add.container(0, 0);
    dyn = c; layer.add(c);
    const ring = scene.add.sprite(s.x, s.y + 6, 'giga_ring_big', 0).setScale(s.r ?? 1.5).setBlendMode(Phaser.BlendModes.ADD);
    ring.play({ key: 'giga_ring_big', repeat: -1, frameRate: 8 });
    c.add(ring);
    const W = 500, H = 128;
    const bx = Math.max(12, Math.min(1268 - W, s.x - W / 2));
    let by = s.y < 360 ? s.y + 90 : s.y - 90 - H;
    by = Math.max(90, Math.min(700 - H, by));
    c.add(panel(scene, bx, by, W, H, false, 0.5).setPosition(bx, by));
    c.add(T(scene, bx + W / 2, by + 14, t(s.key), 19, { origin: [0.5, 0], color: '#3b2a14', stroke: '#fff3cc', sw: 0, wrap: W - 40, align: 'center', ls: 2 }));
    c.add(T(scene, bx + W - 16, by + H - 20, `${i + 1}/${steps.length}  ·  ${t('tut_tap')}`, 14, { origin: [1, 0.5], color: '#6b4a20', stroke: '#fff3cc', sw: 0 }));
    const sk = button(scene, 1190, 56, 150, 40, t('tut_skip'), end, true, 17);
    c.add(sk.c);
    timer = scene.time.delayedCall(2800, show);
  };
  block.on('pointerup', show);
  show();
}
