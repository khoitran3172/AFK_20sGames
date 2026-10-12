import Phaser from 'phaser';
import { Farm } from '../core/farm';
import { resetSave } from '../core/state';
import { applyCloud, clearOffer, cloudEnabled, pullSave, pushSave, recoveryCode, restoreOffer, status } from '../core/cloud';
import { Lang, getLang, setLang, t } from '../i18n';
import { button, modalBack, panel, T, toast } from '../ui/kit';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create() {
    modalBack(this, 0.6);
    const c = this.add.container(640, 360).setDepth(10);
    c.add(panel(this, -280, -230, 560, 540, true, 0.55));
    c.add(T(this, 0, -200, t('settings'), 36, { origin: [0.5, 0], color: '#fff6dd' }));
    c.add(T(this, -230, -140, t('language'), 26, { color: '#e8d9a8' }));
    const mk = (x: number, l: Lang, label: string) => {
      const b = button(this, x, -60, 210, 56, label, () => this.setLanguage(l), getLang() !== l, 24);
      c.add(b.c);
    };
    mk(-115, 'vi', t('lang_vi'));
    mk(115, 'en', t('lang_en'));
    // ---- Lưu đám mây (Google Sheet)
    c.add(T(this, -230, -8, t('cloud_title'), 24, { color: '#e8d9a8' }));
    if (!cloudEnabled()) {
      c.add(T(this, -230, 30, t('cloud_off'), 17, { color: '#c9b98a', wrap: 460 }));
    } else {
      c.add(T(this, -230, 28, `${t('cloud_code')}: ${recoveryCode()}`, 24, { color: '#fff6dd' }));
      const stTxt = T(this, -230, 62, '', 16, { color: '#c9b98a', wrap: 460 });
      c.add(stTxt);
      const upd = () => {
        const when = status.last ? new Date(status.last).toLocaleTimeString() : '—';
        stTxt.setText(`${t('cloud_last')}: ${when}${status.state === 'err' ? '  ·  ' + t('cloud_err') : status.state === 'busy' ? '  ·  …' : ''}`);
      };
      upd();
      const sync = button(this, -115, 108, 210, 44, t('cloud_sync'), async () => { const ok = await pushSave(true); upd(); toast(this, ok ? t('cloud_ok') : t('cloud_err'), ok ? '#bfffc0' : '#ff9a8a'); }, false, 18);
      const restore = button(this, 115, 108, 210, 44, t('cloud_restore'), async () => {
        const code = (window.prompt(t('cloud_prompt')) ?? '').trim().toUpperCase();
        if (!code) return;
        const cs = await pullSave(code);
        if (!cs.found) { toast(this, t('cloud_notfound'), '#ff9a8a'); return; }
        if (window.confirm(t('cloud_confirm'))) { if (applyCloud(cs)) { location.reload(); } else toast(this, t('cloud_bad'), '#ff9a8a'); }
      }, true, 18);
      c.add([sync.c, restore.c]);
      if (restoreOffer) {
        const offer = restoreOffer;
        c.add(T(this, 0, 150, t('cloud_newer'), 16, { origin: [0.5, 0], color: '#ffd9a0', wrap: 480, align: 'center' }));
        const use = button(this, 0, 196, 240, 40, t('cloud_use'), () => { if (applyCloud(offer)) { clearOffer(); location.reload(); } else toast(this, t('cloud_bad'), '#ff9a8a'); }, true, 17);
        c.add(use.c);
      }
    }
    const rs = button(this, -115, 226, 210, 46, t('reset'), () => {
      if (window.confirm(t('reset_confirm'))) { resetSave(); location.reload(); }
    }, true, 22);
    c.add(rs.c);
    const cl = button(this, 115, 226, 210, 46, t('close'), () => this.scene.stop(), false, 22);
    c.add(cl.c);
    c.add(T(this, 0, 260, t('credits'), 16, { origin: [0.5, 0], color: '#e8d9a8', wrap: 500, align: 'center' }));
    void Farm;
  }
  setLanguage(l: Lang) {
    setLang(l);
    const w = this.scene.get('World'), a = this.scene.get('Army');
    this.scene.stop();
    (w.scene.isActive() ? w : a).scene.restart();
  }
}
