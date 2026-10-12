// Con trỏ chuột kiểu game: dùng Cursor_01 (mũi tên) và Cursor_02 (bàn tay chỉ) của bộ Tiny Swords UI.
const BASE = 'assets/ts/UI_Elements/UI_Elements/Cursors/';
const SCALE = 1.5;

function make(file: string, box: [number, number, number, number], hot: [number, number]): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const [x, y, w, h] = box;
      const cv = document.createElement('canvas');
      cv.width = Math.round(w * SCALE); cv.height = Math.round(h * SCALE);
      const g = cv.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      g.drawImage(img, x, y, w, h, 0, 0, cv.width, cv.height);
      resolve(`url(${cv.toDataURL('image/png')}) ${Math.round(hot[0] * SCALE)} ${Math.round(hot[1] * SCALE)}`);
    };
    img.onerror = reject;
    img.src = BASE + file;
  });
}

export async function installCursors(canvas: HTMLCanvasElement) {
  try {
    const [arrow, hand] = await Promise.all([
      make('Cursor_01.png', [20, 15, 26, 34], [3, 3]),
      make('Cursor_02.png', [18, 15, 31, 36], [12, 4]),
    ]);
    const A = `${arrow}, default`, H = `${hand}, pointer`;
    canvas.style.cursor = A;
    // Phaser đặt cursor 'pointer' khi rê vào vật thể tương tác (useHandCursor): đổi sang bàn tay của bộ UI
    new MutationObserver(() => {
      const c = canvas.style.cursor;
      if (c === 'pointer') canvas.style.cursor = H;
      else if (c === 'default' || c === '') canvas.style.cursor = A;
    }).observe(canvas, { attributes: true, attributeFilter: ['style'] });
  } catch { /* không có con trỏ tùy chỉnh thì dùng mặc định */ }
}
