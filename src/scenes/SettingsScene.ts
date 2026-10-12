import Phaser from 'phaser';
import { Farm } from '../core/farm';
import { resetSave } from '../core/state';
import { Lang, getLang, setLang, t } from '../i18n';
import { button, modalBack, panel, T } from '../ui/kit';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create() {
    modalBack(this, 0.6);
    const c = this.add.container(640, 360).setDepth(10);
    c.add(panel(this, -280, -230, 560, 460, true, 0.55));
    c.add(T(this, 0, -200, t('settings'), 36, { origin: [0.5, 0], color: '#fff6dd' }));
    c.add(T(this, -230, -140, t('language'), 26, { color: '#e8d9a8' }));
    const mk = (x: number, l: Lang, label: string) => {
      const b = button(this, x, -60, 210, 56, label, () => this.setLanguage(l), getLang() !== l, 24);
      c.add(b.c);
    };
    mk(-115, 'vi', t('lang_vi'));
    mk(115, 'en', t('lang_en'));
    c.add(T(this, 0, -8, getLang() === 'vi' ? 'Phông chữ: Baloo 2 (đủ dấu tiếng Việt)' : 'Font: Pixelify Sans', 20, { origin: [0.5, 0], color: '#e8d9a8' }));
    c.add(T(this, 0, 36, 'Aăâ Êô Ơư Đđ ạảãấầẩẫậắằẳẵặếềểễệ', 22, { origin: [0.5, 0], color: '#fff6dd' }));
    const rs = button(this, -115, 130, 210, 52, t('reset'), () => {
      if (window.confirm(t('reset_confirm'))) { resetSave(); location.reload(); }
    }, true, 22);
    c.add(rs.c);
    const cl = button(this, 115, 130, 210, 52, t('close'), () => this.scene.stop(), false, 22);
    c.add(cl.c);
    c.add(T(this, 0, 188, t('credits'), 16, { origin: [0.5, 0], color: '#e8d9a8', wrap: 500, align: 'center' }));
    void Farm;
  }
  setLanguage(l: Lang) {
    setLang(l);
    const w = this.scene.get('World'), a = this.scene.get('Army');
    this.scene.stop();
    (w.scene.isActive() ? w : a).scene.restart();
  }
}
